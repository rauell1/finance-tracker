import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

// ─── M-Pesa SMS patterns ────────────────────────────────────────────────────
const PATTERNS = {
  received: /you have received ksh([\d,]+\.?\d*) from (.+?)(?:\d{10}|\d{9}|on \d)/i,
  sent:     /ksh([\d,]+\.?\d*) (?:sent|paid) to (.+?)(?:\.|on \d|transaction)/i,
  withdraw: /give ksh([\d,]+\.?\d*) cash to (.+?)(?:\.|new)/i,
  airtime:  /airtime purchase of ksh([\d,]+\.?\d*)/i,
  receipt:  /(?:^|\n|\s)([A-Z0-9]{10,12})\s+confirmed/im,
  date:     /on (\d{1,2}\/\d{1,2}\/\d{2,4}) at (\d{1,2}:\d{2} [AP]M)/i,
  // Balance line is present in classic SMS but absent in RCS/push notifications — optional
  balance:  /new m-?pesa balance is ksh/i,
  // Confirmed + Ksh = M-Pesa transaction (works with or without balance line)
  isMpesa:  /confirmed[.\s]+ksh[\d,]/i,
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
  // Strip "From : SENDER\n" prefix added by SMS Forwarder app templates (supports Windows CRLF as well)
  return raw.replace(/^From\s*:\s*.+[\r\n]+/i, "").trim();
}

function parseMpesaSMS(rawText: string): ParsedSMS | null {
  const text = cleanSmsText(rawText);

  // Accept if either the balance line OR the "Confirmed. KshX" pattern is present
  // RCS/push notifications omit the balance line but still have "Confirmed. Ksh"
  const isMpesa = PATTERNS.balance.test(text) || PATTERNS.isMpesa.test(text);
  if (!isMpesa) return null;

  const receiptMatch = text.match(PATTERNS.receipt);
  const receipt    = receiptMatch?.[1] ?? "UNKNOWN";
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

  // 2. Log request details and extract SMS body (stream-safe, no cloning)
  const debugCt = request.headers.get("content-type") ?? "none";
  let smsText = "";

  try {
    smsText = await extractSmsText(request);
    console.log(`[mpesa-webhook] content-type=${debugCt} extracted_sms=${smsText.slice(0, 200)}`);
  } catch (e) {
    console.error("[mpesa-webhook] body read error:", e);
    return NextResponse.json({ error: "Could not read request body" }, { status: 400 });
  }

  if (!smsText) {
    console.log(`[mpesa-webhook] empty sms text extracted from content-type=${debugCt}`);
    return NextResponse.json({
      error: "Empty SMS body",
      hint: "Update Message Template in the app to just: {Message Body}",
    }, { status: 400 });
  }

  // 3. Parse M-Pesa SMS
  const parsed = parseMpesaSMS(smsText);
  if (!parsed) {
    console.log(`[mpesa-webhook] not recognised as mpesa. sms=${smsText.slice(0, 120)}`);
    return NextResponse.json({ status: "ignored", reason: "not_mpesa_transaction", preview: smsText.slice(0, 120) });
  }

  if (parsed.amount <= 0) {
    return NextResponse.json({ status: "ignored", reason: "zero_amount" });
  }

  // 4. Find MPESA account (search only by account_code since name is 'Main Wallet' in DB)
  const supabase = createAdminClient();

  const { data: account } = await supabase
    .from("accounts")
    .select("id, user_id")
    .eq("account_code", "main")
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

// Health-check & Diagnostics
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRolePresent = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const cleanedKey = rawKey.replace(/^["']|["']$/g, "").trim();
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    cleanedKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { data: profiles, error: profError } = await supabase
    .from("profiles")
    .select("id, full_name, created_at");

  const { data: accounts, error: accError } = await supabase
    .from("accounts")
    .select("id, user_id, account_code, name");

  const { data: transactionsCount } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({
    status: "ok",
    message: "M-Pesa webhook is live",
    diagnostics: {
      service_role_key_defined: serviceRolePresent,
      service_role_key_length: rawKey.length,
      service_role_key_prefix: rawKey.slice(0, 10),
      cleaned_key_length: cleanedKey.length,
      cleaned_key_prefix: cleanedKey.slice(0, 10),
      profiles_count: profiles?.length ?? 0,
      profiles_list: profiles,
      profiles_error: profError?.message ?? null,
      accounts_count: accounts?.length ?? 0,
      accounts_list: accounts,
      accounts_error: accError?.message ?? null,
      transactions_total: transactionsCount ?? 0,
    }
  });
}
