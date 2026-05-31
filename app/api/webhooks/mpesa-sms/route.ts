import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── M-Pesa SMS patterns ────────────────────────────────────────────────────
const PATTERNS = {
  // Income: received money
  received:    /you have received ksh([\d,]+\.?\d*) from (.+?)(?=\s*\d{9,12}|\s+on \d)/i,
  // Expense: sent/paid
  sent:        /ksh([\d,]+\.?\d*) (?:sent|paid) to ([^.]+?)\.?\s*(?:on \d|transaction|$)/i,
  // Withdrawal (agent)
  withdraw:    /give ksh([\d,]+\.?\d*) cash to (.+?)(?:\.|new m-?pesa)/i,
  // Airtime
  airtime:     /airtime purchase of ksh([\d,]+\.?\d*)/i,
  // Receipt code: 10-12 uppercase alphanumeric followed by "Confirmed"
  receipt:     /\b([A-Z0-9]{10,12})\s+confirmed/i,
  // Date/time in SMS
  date:        /on (\d{1,2}\/\d{1,2}\/\d{2,4}) at (\d{1,2}:\d{2} [AP]M)/i,
  // Balance after transaction (classic SMS only)
  balanceAfter: /new m-?pesa balance is ksh([\d,]+\.?\d*)/i,
  // Transaction cost
  txnCost:     /transaction cost[,\s]+ksh([\d,]+\.?\d*)/i,
  // Detection: is this an M-Pesa SMS?
  isMpesa:     /confirmed[.\s]+ksh[\d,]/i,
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
  counterparty: string;       // sender name (income) or recipient name (expense)
  occurredOn: string;
  balanceAfter: number | null; // M-Pesa balance after this transaction
  txnCost: number | null;      // transaction fee
  rawSms: string;              // full SMS for audit
}

function cleanSmsText(raw: string): string {
  return raw.replace(/^From\s*:\s*.+[\r\n]+/i, "").trim();
}

function parseMpesaSMS(rawText: string): ParsedSMS | null {
  const text = cleanSmsText(rawText);

  const isMpesa = PATTERNS.balanceAfter.test(text) || PATTERNS.isMpesa.test(text);
  if (!isMpesa) return null;

  const receipt     = text.match(PATTERNS.receipt)?.[1] ?? "UNKNOWN";
  const dateMatch   = text.match(PATTERNS.date);
  const occurredOn  = dateMatch ? parseDate(dateMatch[1]) : new Date().toISOString().split("T")[0];

  // Extract balance after transaction (may be absent in RCS notifications)
  const balanceMatch = text.match(PATTERNS.balanceAfter);
  const balanceAfter = balanceMatch ? parseAmount(balanceMatch[1]) : null;

  // Extract transaction cost
  const costMatch = text.match(PATTERNS.txnCost);
  const txnCost = costMatch ? parseAmount(costMatch[1]) : null;

  // Income: received
  const receivedMatch = text.match(PATTERNS.received);
  if (receivedMatch) {
    const counterparty = receivedMatch[2].trim();
    return {
      receipt,
      amount: parseAmount(receivedMatch[1]),
      txnType: "income",
      description: `Received from ${counterparty}`,
      counterparty,
      occurredOn,
      balanceAfter,
      txnCost,
      rawSms: text,
    };
  }

  // Expense: sent/paid to
  const sentMatch = text.match(PATTERNS.sent);
  if (sentMatch) {
    const counterparty = sentMatch[2].trim();
    return {
      receipt,
      amount: parseAmount(sentMatch[1]),
      txnType: "expense",
      description: `Paid to ${counterparty}`,
      counterparty,
      occurredOn,
      balanceAfter,
      txnCost,
      rawSms: text,
    };
  }

  // Expense: withdrawal
  const withdrawMatch = text.match(PATTERNS.withdraw);
  if (withdrawMatch) {
    const counterparty = withdrawMatch[2].trim();
    return {
      receipt,
      amount: parseAmount(withdrawMatch[1]),
      txnType: "expense",
      description: `Withdrawal at ${counterparty}`,
      counterparty,
      occurredOn,
      balanceAfter,
      txnCost,
      rawSms: text,
    };
  }

  // Expense: airtime
  const airtimeMatch = text.match(PATTERNS.airtime);
  if (airtimeMatch) {
    return {
      receipt,
      amount: parseAmount(airtimeMatch[1]),
      txnType: "expense",
      description: "Airtime purchase",
      counterparty: "Safaricom",
      occurredOn,
      balanceAfter,
      txnCost,
      rawSms: text,
    };
  }

  return null;
}

// ─── Body extraction (supports JSON, form, plain-text, JSON-as-text) ─────────
async function extractSmsText(request: NextRequest): Promise<string> {
  const ct = request.headers.get("content-type") ?? "";
  const aliases = ["body", "message", "sms", "text", "msg", "content", "sms_body"];

  function fromJson(json: Record<string, unknown>): string {
    for (const key of aliases) {
      if (typeof json[key] === "string" && (json[key] as string).length > 0) return json[key] as string;
    }
    const first = Object.values(json).find((v) => typeof v === "string" && (v as string).length > 10);
    return (first as string) ?? "";
  }

  if (ct.includes("application/json")) {
    const json = await request.json().catch(() => ({}));
    return fromJson(json);
  }

  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => new FormData());
    for (const key of aliases) {
      const val = form.get(key);
      if (typeof val === "string" && val) return val;
    }
    for (const [, val] of form.entries()) {
      if (typeof val === "string" && PATTERNS.balanceAfter.test(val)) return val;
    }
    return "";
  }

  // text/plain or unknown — also try JSON parse (SMS Forwarder sends JSON as text/plain)
  const raw = await request.text().catch(() => "");
  if (raw.trimStart().startsWith("{")) {
    try {
      const json = JSON.parse(raw) as Record<string, unknown>;
      const extracted = fromJson(json);
      if (extracted) return extracted;
    } catch { /* fall through */ }
  }
  return raw;
}

// ─── Balance sync ─────────────────────────────────────────────────────────────
// When the SMS includes "New M-PESA balance is KshX", recalibrate opening_balance
// so that: opening_balance + net_transaction_flow = balance_after
async function syncAccountBalance(
  supabase: ReturnType<typeof createAdminClient>,
  accountId: string,
  balanceAfter: number
): Promise<void> {
  // Sum all income transactions
  const { data: income } = await supabase
    .from("transactions")
    .select("amount")
    .eq("account_id", accountId)
    .eq("txn_type", "income");

  // Sum all expense transactions
  const { data: expense } = await supabase
    .from("transactions")
    .select("amount")
    .eq("account_id", accountId)
    .eq("txn_type", "expense");

  // Transfers out of this account
  const { data: xferOut } = await supabase
    .from("transactions")
    .select("amount")
    .eq("account_id", accountId)
    .eq("txn_type", "transfer");

  // Transfers into this account
  const { data: xferIn } = await supabase
    .from("transactions")
    .select("amount")
    .eq("transfer_account_id", accountId)
    .eq("txn_type", "transfer");

  const netFlow =
    (income ?? []).reduce((s, t) => s + Number(t.amount), 0) -
    (expense ?? []).reduce((s, t) => s + Number(t.amount), 0) +
    (xferIn ?? []).reduce((s, t) => s + Number(t.amount), 0) -
    (xferOut ?? []).reduce((s, t) => s + Number(t.amount), 0);

  // opening_balance = balance_after - netFlow
  const newOpeningBalance = Math.max(0, balanceAfter - netFlow);

  await supabase
    .from("accounts")
    .update({ opening_balance: newOpeningBalance })
    .eq("id", accountId);
}

// ─── Webhook POST ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Auth
  const secret =
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("x-webhook-secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Extract SMS text
  let smsText = "";
  try {
    smsText = await extractSmsText(request);
  } catch {
    return NextResponse.json({ error: "Could not read request body" }, { status: 400 });
  }

  if (!smsText) {
    return NextResponse.json({ error: "Empty SMS body" }, { status: 400 });
  }

  // 3. Parse
  const parsed = parseMpesaSMS(smsText);
  if (!parsed) {
    return NextResponse.json({ status: "ignored", reason: "not_mpesa_transaction", preview: smsText.slice(0, 120) });
  }
  if (parsed.amount <= 0) {
    return NextResponse.json({ status: "ignored", reason: "zero_amount" });
  }

  const supabase = createAdminClient();

  // 4. Find MPESA account
  const { data: account } = await supabase
    .from("accounts")
    .select("id, user_id")
    .eq("account_code", "main")
    .single();

  if (!account) {
    return NextResponse.json({ error: "MPESA account not found" }, { status: 404 });
  }

  // 5. Deduplicate
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

  // 6. Category lookup
  const categoryName = guessCategory(parsed.description, parsed.txnType);
  let { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", account.user_id)
    .eq("name", categoryName)
    .eq("type", parsed.txnType)
    .single();

  if (!category) {
    const { data: fallback } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", account.user_id)
      .eq("type", parsed.txnType)
      .limit(1)
      .single();
    category = fallback;
  }

  if (!category) {
    return NextResponse.json({ error: "No category found" }, { status: 500 });
  }

  // 7. Insert transaction with full metadata
  const { data: txn, error } = await supabase
    .from("transactions")
    .insert({
      user_id:       account.user_id,
      account_id:    account.id,
      category_id:   category.id,
      txn_type:      parsed.txnType,
      amount:        parsed.amount,
      currency_code: "KES",
      occurred_on:   parsed.occurredOn,
      description:   parsed.description,
      metadata: {
        source:          "sms_webhook",
        mpesa_receipt:   parsed.receipt,
        counterparty:    parsed.counterparty,
        balance_after:   parsed.balanceAfter,
        txn_cost:        parsed.txnCost,
        // Keep raw SMS for audit/re-parsing
        raw_sms:         parsed.rawSms.slice(0, 300),
      },
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 8. Sync account balance if we got the balance_after from SMS
  if (parsed.balanceAfter !== null) {
    try {
      await syncAccountBalance(supabase, account.id, parsed.balanceAfter);
    } catch (e) {
      console.error("[mpesa-webhook] balance sync failed:", e);
      // Non-fatal — transaction was already saved
    }
  }

  return NextResponse.json({
    status:         "created",
    transaction_id: txn.id,
    receipt:        parsed.receipt,
    amount:         parsed.amount,
    type:           parsed.txnType,
    category:       categoryName,
    counterparty:   parsed.counterparty,
    occurred_on:    parsed.occurredOn,
    balance_after:  parsed.balanceAfter,
    txn_cost:       parsed.txnCost,
    description:    parsed.description,
  });
}

// ─── GET: Health check ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data: accounts } = await supabase.from("accounts").select("account_code, name, opening_balance, currency_code").order("account_code");
  const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true });
  return NextResponse.json({ status: "ok", accounts, transaction_count: count });
}
