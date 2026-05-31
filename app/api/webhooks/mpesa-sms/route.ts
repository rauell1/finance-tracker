import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── M-Pesa SMS patterns ────────────────────────────────────────────────────
const PATTERNS = {
  received: /you have received ksh([\d,]+\.?\d*) from (.+?)(?:\d{10}|\d{9}|on \d)/i,
  sent:     /ksh([\d,]+\.?\d*) (?:sent|paid) to (.+?)(?:\.|on \d)/i,
  withdraw: /give ksh([\d,]+\.?\d*) cash to (.+?)(?:\.|new)/i,
  airtime:  /airtime purchase of ksh([\d,]+\.?\d*)/i,
  receipt:  /(?:^|\n)([A-Z0-9]{10,12})\s/m,
  date:     /on (\d{1,2}\/\d{1,2}\/\d{2,4}) at (\d{1,2}:\d{2} [AP]M)/i,
  balance:  /new m-?pesa balance is ksh/i,
};

// ─── Auto-categorisation ────────────────────────────────────────────────────
const CATEGORY_RULES: { pattern: RegExp; category: string; type: "income" | "expense" }[] = [
  { pattern: /kplc|kenya power|umeme|power token/i,                            category: "Utilities",     type: "expense" },
  { pattern: /safaricom|airtel|telkom|faiba/i,                                 category: "Utilities",     type: "expense" },
  { pattern: /naivas|carrefour|quickmart|chandarana|tuskys|uchumi|shoprite/i,  category: "Food & Dining", type: "expense" },
  { pattern: /uber|bolt|faras|little cab|indriver/i,                           category: "Transport",     type: "expense" },
  { pattern: /netflix|spotify|showmax|dstv|youtube premium/i,                  category: "Subscriptions", type: "expense" },
  { pattern: /nhif|hospital|clinic|pharmacy|chemist|medical/i,                 category: "Healthcare",    type: "expense" },
  { pattern: /school|fees|university|college|tuition|kcse|knec/i,             category: "Education",     type: "expense" },
  { pattern: /airbnb|hotel|kenya airways|jambojet|flysax|flight/i,            category: "Travel",        type: "expense" },
  { pattern: /airtime/i,                                                        category: "Utilities",     type: "expense" },
  { pattern: /salary|payroll|wages|pay slip/i,                                 category: "Salary",        type: "income"  },
  { pattern: /freelance|upwork|fiverr|toptal/i,                               category: "Freelance",     type: "income"  },
  { pattern: /dividend|interest|investment|returns/i,                          category: "Investment",    type: "income"  },
];

function guessCategory(description: string, txnType: "income" | "expense"): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.type === txnType && rule.pattern.test(description)) return rule.category;
  }
  return txnType === "income" ? "Other Income" : "Other Expense";
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, ""));
}

function parseDate(dateStr: string): string {
  const [d, m, y] = dateStr.split("/").map(Number);
  const fullYear = y < 100 ? 2000 + y : y;
  return `${fullYear}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

interface ParsedSMS {
  receipt: string;
  amount: number;
  txnType: "income" | "expense";
  description: string;
  occurredOn: string;
}

function cleanSmsText(raw: string): string {
  // Strip "From : SENDER\n" prefix added by SMS Forwarder app templates
  return raw.replace(/^From\s*:\s*.+\n/i, "").trim();
}

function parseMpesaSMS(rawText: string): ParsedSMS | null {
  const text = cleanSmsText(rawText);
  if (!PATTERNS.balance.test(text)) return null;

  const receipt    = text.match(PATTERNS.receipt)?.[1] ?? "UNKNOWN";
  const dateMatch  = text.match(PATTERNS.date);
  const occurredOn = dateMatch ? parseDate(dateMatch[1]) : new Date().toISOString().split("T")[0];

  const receivedMatch = text.match(PATTERNS.received);
  if (receivedMatch) return { receipt, amount: parseAmount(receivedMatch[1]), txnType: "income",  description: `Received from ${receivedMatch[2].trim()}`, occurredOn };

  const sentMatch = text.match(PATTERNS.sent);
  if (sentMatch)     return { receipt, amount: parseAmount(sentMatch[1]),     txnType: "expense", description: `Paid to ${sentMatch[2].trim()}`, occurredOn };

  const withdrawMatch = text.match(PATTERNS.withdraw);
  if (withdrawMatch) return { receipt, amount: parseAmount(withdrawMatch[1]), txnType: "expense", description: `Withdrawal - ${withdrawMatch[2].trim()}`, occurredOn };

  const airtimeMatch = text.match(PATTERNS.airtime);
  if (airtimeMatch)  return { receipt, amount: parseAmount(airtimeMatch[1]),  txnType: "expense", description: "Airtime purchase", occurredOn };

  return null;
}

// ─── Flexible body extraction ────────────────────────────────────────────────
// Supports every format SMS Forwarder apps typically send:
//   JSON:           { "body": "...", "from": "MPESA" }
//   Form-encoded:   body=...&from=MPESA
//   Raw text:       the SMS text itself
// Field name aliases tried: body, message, sms, text, msg, content, sms_body, %body%
async function extractSmsText(request: NextRequest): Promise<string> {
  const ct = request.headers.get("content-type") ?? "";
  const aliases = ["body", "message", "sms", "text", "msg", "content", "sms_body"];

  if (ct.includes("application/json")) {
    const json = await request.json().catch(() => ({}));
    for (const key of aliases) {
      if (typeof json[key] === "string" && json[key]) return json[key];
    }
    // Some apps put the whole payload as a stringified value
    const first = Object.values(json).find((v) => typeof v === "string" && (v as string).length > 20);
    return (first as string) ?? "";
  }

  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => new FormData());
    for (const key of aliases) {
      const val = form.get(key);
      if (typeof val === "string" && val) return val;
    }
    // Try any field that contains M-Pesa balance text
    for (const [, val] of form.entries()) {
      if (typeof val === "string" && PATTERNS.balance.test(val)) return val;
    }
    return "";
  }

  // Plain text / unknown — read raw body
  return await request.text().catch(() => "");
}

// ─── Webhook handler ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Verify secret (query param or header)
  const secret =
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("x-webhook-secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Extract SMS text from whatever format the app sends
  let smsText = "";
  try {
    smsText = await extractSmsText(request);
  } catch {
    return NextResponse.json({ error: "Could not read request body" }, { status: 400 });
  }

  if (!smsText) {
    return NextResponse.json({ error: "Empty SMS body", hint: "Set body field to your app's message placeholder (e.g. %body% or {message})" }, { status: 400 });
  }

  // 3. Parse M-Pesa SMS
  const parsed = parseMpesaSMS(smsText);
  if (!parsed) {
    // Return 200 so the app doesn't retry — just not an M-Pesa transaction SMS
    return NextResponse.json({ status: "ignored", reason: "not_mpesa_transaction", preview: smsText.slice(0, 80) });
  }

  if (parsed.amount <= 0) {
    return NextResponse.json({ status: "ignored", reason: "zero_amount" });
  }

  // 4. Find MPESA account
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("accounts")
    .select("id, user_id")
    .eq("account_code", "main")
    .eq("name", "MPESA")
    .single();

  if (!account) {
    return NextResponse.json({ error: "MPESA account not found" }, { status: 404 });
  }

  // 5. Deduplicate by receipt number
  if (parsed.receipt !== "UNKNOWN") {
    const { count } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", account.user_id)
      .contains("metadata", { mpesa_receipt: parsed.receipt });

    if (count && count > 0) {
      return NextResponse.json({ status: "ignored", reason: "duplicate", receipt: parsed.receipt });
    }
  }

  // 6. Look up category
  const categoryName = guessCategory(parsed.description, parsed.txnType);
  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", account.user_id)
    .eq("name", categoryName)
    .eq("type", parsed.txnType)
    .single();

  let categoryId = category?.id;
  if (!categoryId) {
    const { data: fallback } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", account.user_id)
      .eq("type", parsed.txnType)
      .limit(1)
      .single();
    categoryId = fallback?.id;
  }

  if (!categoryId) {
    return NextResponse.json({ error: "No category found" }, { status: 500 });
  }

  // 7. Insert transaction
  const { data: txn, error } = await supabase
    .from("transactions")
    .insert({
      user_id:       account.user_id,
      account_id:    account.id,
      category_id:   categoryId,
      txn_type:      parsed.txnType,
      amount:        parsed.amount,
      currency_code: "KES",
      occurred_on:   parsed.occurredOn,
      description:   parsed.description,
      metadata: {
        mpesa_receipt: parsed.receipt,
        source:        "sms_webhook",
      },
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    status:         "created",
    transaction_id: txn.id,
    receipt:        parsed.receipt,
    amount:         parsed.amount,
    type:           parsed.txnType,
    category:       categoryName,
    occurred_on:    parsed.occurredOn,
    description:    parsed.description,
  });
}

// Health-check so you can test the URL is reachable
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ status: "ok", message: "M-Pesa webhook is live" });
}
