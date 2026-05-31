import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── M-Pesa SMS patterns ────────────────────────────────────────────────────
// All patterns tested against Safaricom production SMS formats.

const PATTERNS = {
  // Received money: "You have received Ksh50,000.00 from ABC Ltd 0700000000"
  received: /you have received ksh([\d,]+\.?\d*) from (.+?) [\d+]/i,

  // Sent / Pay Bill / Buy Goods: "Ksh2,400.00 sent to ..." or "Ksh850.00 paid to ..."
  sent: /ksh([\d,]+\.?\d*) (?:sent|paid) to (.+?)(?:\.|on \d)/i,

  // Withdraw (agent): "Give Ksh5,000.00 cash to"
  withdraw: /give ksh([\d,]+\.?\d*) cash to (.+?)(?:\.|new)/i,

  // Airtime: "Your airtime purchase of Ksh100.00"
  airtime: /airtime purchase of ksh([\d,]+\.?\d*)/i,

  // Receipt number (all M-Pesa SMS start with this)
  receipt: /^([A-Z0-9]{10,12})\s/,

  // Date: "on 31/5/26 at 11:00 AM" or "on 31/05/2026 at 11:00 AM"
  date: /on (\d{1,2}\/\d{1,2}\/\d{2,4}) at (\d{1,2}:\d{2} [AP]M)/i,

  // Balance (used to verify it's an M-Pesa SMS)
  balance: /new m-?pesa balance is ksh/i,
};

// ─── Auto-categorisation ───────────────────────────────────────────────────
const CATEGORY_RULES: { pattern: RegExp; category: string; type: "income" | "expense" }[] = [
  { pattern: /kplc|kenya power|umeme|power token/i,          category: "Utilities",     type: "expense" },
  { pattern: /safaricom|airtel|telkom|faiba/i,               category: "Utilities",     type: "expense" },
  { pattern: /naivas|carrefour|quickmart|chandarana|tuskys|uchumi|shoprite/i, category: "Food & Dining", type: "expense" },
  { pattern: /uber|bolt|faras|little cab|indriver/i,         category: "Transport",     type: "expense" },
  { pattern: /netflix|spotify|showmax|dstv|youtube premium/i,category: "Subscriptions",type: "expense" },
  { pattern: /nhif|hospital|clinic|pharmacy|chemist|medical/i,category: "Healthcare",   type: "expense" },
  { pattern: /school|fees|university|college|tuition|kcse|knec/i, category: "Education", type: "expense" },
  { pattern: /airbnb|hotel|b&b|kenya airways|jambojet|flysax|flight/i, category: "Travel", type: "expense" },
  { pattern: /airtime/i,                                      category: "Utilities",     type: "expense" },
  { pattern: /salary|payroll|wages|pay slip/i,               category: "Salary",        type: "income" },
  { pattern: /freelance|upwork|fiverr|toptal/i,              category: "Freelance",     type: "income" },
  { pattern: /dividend|interest|investment|returns/i,        category: "Investment",    type: "income" },
];

function guessCategory(description: string, txnType: "income" | "expense"): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.type === txnType && rule.pattern.test(description)) {
      return rule.category;
    }
  }
  return txnType === "income" ? "Other Income" : "Other Expense";
}

// ─── Amount parser ─────────────────────────────────────────────────────────
function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, ""));
}

// ─── Date parser ───────────────────────────────────────────────────────────
function parseDate(dateStr: string, timeStr: string): string {
  // dateStr: "31/5/26" or "31/05/2026"
  const [d, m, y] = dateStr.split("/").map(Number);
  const fullYear = y < 100 ? 2000 + y : y;
  const iso = `${fullYear}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return iso;
}

// ─── SMS parser ────────────────────────────────────────────────────────────
interface ParsedSMS {
  receipt: string;
  amount: number;
  txnType: "income" | "expense";
  description: string;
  occurredOn: string;
}

function parseMpesaSMS(body: string): ParsedSMS | null {
  const text = body.trim();

  // Must contain M-Pesa balance line — confirms it's a real M-Pesa SMS
  if (!PATTERNS.balance.test(text)) return null;

  const receiptMatch = text.match(PATTERNS.receipt);
  const receipt = receiptMatch?.[1] ?? "UNKNOWN";

  const dateMatch = text.match(PATTERNS.date);
  const occurredOn = dateMatch ? parseDate(dateMatch[1], dateMatch[2]) : new Date().toISOString().split("T")[0];

  // Try each transaction pattern
  const receivedMatch = text.match(PATTERNS.received);
  if (receivedMatch) {
    return {
      receipt,
      amount: parseAmount(receivedMatch[1]),
      txnType: "income",
      description: `Received from ${receivedMatch[2].trim()}`,
      occurredOn,
    };
  }

  const sentMatch = text.match(PATTERNS.sent);
  if (sentMatch) {
    return {
      receipt,
      amount: parseAmount(sentMatch[1]),
      txnType: "expense",
      description: `Paid to ${sentMatch[2].trim()}`,
      occurredOn,
    };
  }

  const withdrawMatch = text.match(PATTERNS.withdraw);
  if (withdrawMatch) {
    return {
      receipt,
      amount: parseAmount(withdrawMatch[1]),
      txnType: "expense",
      description: `Withdrawal - ${withdrawMatch[2].trim()}`,
      occurredOn,
    };
  }

  const airtimeMatch = text.match(PATTERNS.airtime);
  if (airtimeMatch) {
    return {
      receipt,
      amount: parseAmount(airtimeMatch[1]),
      txnType: "expense",
      description: "Airtime purchase",
      occurredOn,
    };
  }

  return null;
}

// ─── Webhook handler ───────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Verify secret
  const secret = request.nextUrl.searchParams.get("secret") ??
    request.headers.get("x-webhook-secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body — support JSON and form-data (SMS Forwarder sends both)
  let smsBody = "";
  let smsSender = "";
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const json = await request.json();
      smsBody = json.body ?? json.message ?? json.sms ?? json.text ?? "";
      smsSender = json.from ?? json.sender ?? "";
    } else {
      const form = await request.formData();
      smsBody = String(form.get("body") ?? form.get("message") ?? form.get("sms") ?? "");
      smsSender = String(form.get("from") ?? form.get("sender") ?? "");
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!smsBody) {
    return NextResponse.json({ error: "Missing SMS body" }, { status: 400 });
  }

  // 3. Only process SMS from Safaricom M-Pesa shortcode
  const isMpesa =
    /^MPESA$/i.test(smsSender.trim()) ||
    smsSender === "MPESA" ||
    smsSender === "21714" || // Safaricom M-Pesa shortcode
    smsBody.toLowerCase().includes("m-pesa balance");

  if (!isMpesa) {
    return NextResponse.json({ status: "ignored", reason: "not_mpesa" });
  }

  // 4. Parse the SMS
  const parsed = parseMpesaSMS(smsBody);
  if (!parsed) {
    return NextResponse.json({ status: "ignored", reason: "unrecognised_format", body: smsBody });
  }

  if (parsed.amount <= 0) {
    return NextResponse.json({ status: "ignored", reason: "zero_amount" });
  }

  // 5. Find the user's MPESA account
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Webhook calls are unauthenticated — find user via service-level query
  // We use a special single-user lookup via the MPESA account (account_code = 'main')
  // This is safe because the secret guards the endpoint
  const { data: account } = await supabase
    .from("accounts")
    .select("id, user_id")
    .eq("account_code", "main")
    .eq("name", "MPESA")
    .single();

  if (!account) {
    return NextResponse.json({ error: "MPESA account not found" }, { status: 404 });
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

  // Fallback to first category of correct type
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

  // 7. Deduplicate — skip if receipt already imported
  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", account.user_id)
    .contains("metadata", { mpesa_receipt: parsed.receipt });

  if (count && count > 0) {
    return NextResponse.json({ status: "ignored", reason: "duplicate", receipt: parsed.receipt });
  }

  // 8. Insert transaction
  const { data: txn, error } = await supabase
    .from("transactions")
    .insert({
      user_id: account.user_id,
      account_id: account.id,
      category_id: categoryId,
      txn_type: parsed.txnType,
      amount: parsed.amount,
      currency_code: "KES",
      occurred_on: parsed.occurredOn,
      description: parsed.description,
      metadata: {
        mpesa_receipt: parsed.receipt,
        source: "sms_webhook",
      },
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    status: "created",
    transaction_id: txn.id,
    receipt: parsed.receipt,
    amount: parsed.amount,
    type: parsed.txnType,
    category: categoryName,
    occurred_on: parsed.occurredOn,
  });
}
