import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── M-Pesa SMS patterns (covers 2024+ Safaricom formats) ───────────────────
const PATTERNS = {
  // Income: "You have received Ksh3,000.00 from JANE DOE 0712345678 on ..."
  received:    /received ksh([\d,]+\.?\d*) from ([^.0-9]+?)(?=\s*\d{6,}|\s+on \d|\.)/i,
  // Send/Pay: "Ksh1,000.00 sent to JOHN" / "Ksh2,500.00 paid to KPLC"
  sent:        /ksh([\d,]+\.?\d*) (?:sent|paid) to ([^.]+?)(?=\s+on \d|\.|\s+for account|transaction|$)/i,
  // Withdraw: "Ksh2,000.00 withdrawn from AGENT" / "Give Ksh X cash to AGENT"
  withdrawn:   /ksh([\d,]+\.?\d*) withdrawn from ([^.]+?)(?=\s+on \d|\.|new m-?pesa|$)/i,
  giveCash:    /give ksh([\d,]+\.?\d*) cash to ([^.]+?)(?=\.|new m-?pesa|$)/i,
  // Airtime: "bought Ksh100.00 of airtime" / "airtime purchase of Ksh100.00"
  airtimeBought: /bought ksh([\d,]+\.?\d*) of airtime/i,
  airtimePurchase: /airtime purchase of ksh([\d,]+\.?\d*)/i,

  receipt:      /\b([A-Z0-9]{10})\b/,                                  // 10-char M-Pesa code
  date:         /on (\d{1,2}\/\d{1,2}\/\d{2,4}) at (\d{1,2}:\d{2} [AP]M)/i,
  balanceAfter: /new m-?pesa balance is ksh([\d,]+\.?\d*)/i,
  txnCost:      /transaction cost[,\s]+ksh([\d,]+\.?\d*)/i,
  anyAmount:    /ksh\s?([\d,]+\.?\d*)/i,                               // fallback first amount
};

// ─── Auto-categorisation ────────────────────────────────────────────────────
const CATEGORY_RULES: { pattern: RegExp; category: string; type: "income" | "expense" }[] = [
  { pattern: /kplc|kenya power|umeme|power|token|stima/i,                       category: "Utilities",     type: "expense" },
  { pattern: /safaricom|airtel|telkom|faiba|airtime|bundles|data/i,             category: "Utilities",     type: "expense" },
  { pattern: /water|nairobi water|nawasco|gas|k-?gas|progas/i,                  category: "Utilities",     type: "expense" },
  { pattern: /naivas|carrefour|quickmart|chandarana|tuskys|uchumi|shoprite|cleanshelf|eastmatt/i, category: "Food & Dining", type: "expense" },
  { pattern: /restaurant|cafe|coffee|kfc|java|artcaffe|pizza|burger|chicken|hotel.*food|kibanda|food/i, category: "Food & Dining", type: "expense" },
  { pattern: /uber|bolt|faras|little|indriver|matatu|fare|sgr|fuel|petrol|shell|total|rubis|station/i, category: "Transport", type: "expense" },
  { pattern: /netflix|spotify|showmax|dstv|gotv|youtube|subscription|prime/i,   category: "Subscriptions", type: "expense" },
  { pattern: /nhif|sha|hospital|clinic|pharmacy|chemist|medical|dawa|hosp/i,    category: "Healthcare",    type: "expense" },
  { pattern: /school|fees|university|college|tuition|kcse|knec|academy/i,       category: "Education",     type: "expense" },
  { pattern: /airbnb|hotel|lodge|kenya airways|jambojet|flysax|flight|travel/i, category: "Travel",        type: "expense" },
  { pattern: /rent|landlord|apartment|house|caretaker/i,                        category: "Housing",       type: "expense" },
  { pattern: /salary|payroll|wages|pay slip|payslip/i,                          category: "Salary",        type: "income"  },
  { pattern: /freelance|upwork|fiverr|toptal|consult/i,                        category: "Freelance",     type: "income"  },
  { pattern: /dividend|interest|investment|returns|sacco|mmf/i,                 category: "Investment",    type: "income"  },
];

function guessCategory(text: string, txnType: "income" | "expense"): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.type === txnType && rule.pattern.test(text)) return rule.category;
  }
  return txnType === "income" ? "Other Income" : "Other Expense";
}

const parseAmount = (raw: string) => parseFloat(raw.replace(/,/g, ""));

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
  counterparty: string;
  occurredOn: string;
  balanceAfter: number | null;
  txnCost: number | null;
  needsReview: boolean;
  rawSms: string;
}

function cleanSmsText(raw: string): string {
  return raw.replace(/^From\s*:\s*.+[\r\n]+/i, "").trim();
}

// Robust M-Pesa detection: must look like a Safaricom confirmation
function looksLikeMpesa(text: string): boolean {
  const hasConfirmed = /confirmed/i.test(text);
  const hasKsh = /ksh\s?[\d,]/i.test(text);
  const hasBalance = PATTERNS.balanceAfter.test(text);
  const hasReceipt = /\b[A-Z0-9]{10}\b\s+confirmed/i.test(text);
  return (hasConfirmed && hasKsh) || hasBalance || hasReceipt;
}

function parseMpesaSMS(rawText: string): ParsedSMS | null {
  const text = cleanSmsText(rawText);
  if (!looksLikeMpesa(text)) return null;

  const receipt     = text.match(PATTERNS.receipt)?.[1] ?? "UNKNOWN";
  const dateMatch   = text.match(PATTERNS.date);
  const occurredOn  = dateMatch ? parseDate(dateMatch[1]) : new Date().toISOString().split("T")[0];
  const balanceAfter = text.match(PATTERNS.balanceAfter) ? parseAmount(text.match(PATTERNS.balanceAfter)![1]) : null;
  const txnCost      = text.match(PATTERNS.txnCost) ? parseAmount(text.match(PATTERNS.txnCost)![1]) : null;

  const base = { receipt, occurredOn, balanceAfter, txnCost, rawSms: text.slice(0, 400) };

  // 1. Income — received
  const recv = text.match(PATTERNS.received);
  if (recv) {
    const cp = recv[2].trim();
    return { ...base, amount: parseAmount(recv[1]), txnType: "income", counterparty: cp, description: `Received from ${cp}`, needsReview: false };
  }

  // 2. Expense — sent / paid
  const sent = text.match(PATTERNS.sent);
  if (sent) {
    const cp = sent[2].trim();
    return { ...base, amount: parseAmount(sent[1]), txnType: "expense", counterparty: cp, description: `Paid to ${cp}`, needsReview: false };
  }

  // 3. Expense — withdrawn
  const wd = text.match(PATTERNS.withdrawn) ?? text.match(PATTERNS.giveCash);
  if (wd) {
    const cp = wd[2].trim();
    return { ...base, amount: parseAmount(wd[1]), txnType: "expense", counterparty: cp, description: `Withdrawal at ${cp}`, needsReview: false };
  }

  // 4. Expense — airtime
  const air = text.match(PATTERNS.airtimeBought) ?? text.match(PATTERNS.airtimePurchase);
  if (air) {
    return { ...base, amount: parseAmount(air[1]), txnType: "expense", counterparty: "Safaricom", description: "Airtime purchase", needsReview: false };
  }

  // 5. FALLBACK — looks like M-Pesa but format unrecognised.
  //    Never drop it. Extract the first amount, guess direction, flag for review.
  const anyAmt = text.match(PATTERNS.anyAmount);
  if (anyAmt) {
    const isIncome = /received|deposit|refund|reversal|credited/i.test(text);
    return {
      ...base,
      amount: parseAmount(anyAmt[1]),
      txnType: isIncome ? "income" : "expense",
      counterparty: "Unknown",
      description: isIncome ? "M-Pesa income (review)" : "M-Pesa expense (review)",
      needsReview: true,
    };
  }

  return null;
}

// ─── Body extraction ──────────────────────────────────────────────────────────
async function extractSmsText(request: NextRequest): Promise<string> {
  const ct = request.headers.get("content-type") ?? "";
  const aliases = ["body", "message", "sms", "text", "msg", "content", "sms_body"];
  const fromJson = (j: Record<string, unknown>) => {
    for (const k of aliases) if (typeof j[k] === "string" && (j[k] as string).length > 0) return j[k] as string;
    const first = Object.values(j).find((v) => typeof v === "string" && (v as string).length > 10);
    return (first as string) ?? "";
  };

  if (ct.includes("application/json")) return fromJson(await request.json().catch(() => ({})));

  if (ct.includes("urlencoded") || ct.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => new FormData());
    for (const k of aliases) { const v = form.get(k); if (typeof v === "string" && v) return v; }
    for (const [, v] of form.entries()) if (typeof v === "string" && looksLikeMpesa(v)) return v;
    return "";
  }

  const raw = await request.text().catch(() => "");
  if (raw.trimStart().startsWith("{")) {
    try { const ex = fromJson(JSON.parse(raw)); if (ex) return ex; } catch { /* */ }
  }
  return raw;
}

// ─── Balance sync ─────────────────────────────────────────────────────────────
async function syncAccountBalance(
  supabase: ReturnType<typeof createAdminClient>,
  accountId: string,
  balanceAfter: number
): Promise<void> {
  const [{ data: inc }, { data: exp }, { data: xOut }, { data: xIn }] = await Promise.all([
    supabase.from("transactions").select("amount").eq("account_id", accountId).eq("txn_type", "income"),
    supabase.from("transactions").select("amount").eq("account_id", accountId).eq("txn_type", "expense"),
    supabase.from("transactions").select("amount").eq("account_id", accountId).eq("txn_type", "transfer"),
    supabase.from("transactions").select("amount").eq("transfer_account_id", accountId).eq("txn_type", "transfer"),
  ]);
  const net =
    (inc ?? []).reduce((s, t) => s + Number(t.amount), 0) -
    (exp ?? []).reduce((s, t) => s + Number(t.amount), 0) +
    (xIn ?? []).reduce((s, t) => s + Number(t.amount), 0) -
    (xOut ?? []).reduce((s, t) => s + Number(t.amount), 0);
  await supabase.from("accounts").update({ opening_balance: Math.max(0, balanceAfter - net) }).eq("id", accountId);
}

// ─── POST ───────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const secret =
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("x-webhook-secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let smsText = "";
  try { smsText = await extractSmsText(request); }
  catch { return NextResponse.json({ error: "Could not read body" }, { status: 400 }); }
  if (!smsText) return NextResponse.json({ error: "Empty SMS body" }, { status: 400 });

  const parsed = parseMpesaSMS(smsText);
  if (!parsed) {
    return NextResponse.json({ status: "ignored", reason: "not_mpesa", preview: smsText.slice(0, 120) });
  }
  if (parsed.amount <= 0) {
    return NextResponse.json({ status: "ignored", reason: "zero_amount", preview: smsText.slice(0, 120) });
  }

  const supabase = createAdminClient();

  const { data: account } = await supabase
    .from("accounts").select("id, user_id").eq("account_code", "main").single();
  if (!account) return NextResponse.json({ error: "MPESA account not found" }, { status: 404 });

  // Dedup only on a real receipt
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

  // Category — match against full SMS text so merchant keywords are caught
  const categoryName = guessCategory(parsed.rawSms, parsed.txnType);
  let { data: category } = await supabase
    .from("categories").select("id").eq("user_id", account.user_id)
    .eq("name", categoryName).eq("type", parsed.txnType).single();
  if (!category) {
    const { data: fb } = await supabase
      .from("categories").select("id").eq("user_id", account.user_id)
      .eq("type", parsed.txnType).limit(1).single();
    category = fb;
  }
  if (!category) return NextResponse.json({ error: "No category found" }, { status: 500 });

  const { data: txn, error } = await supabase
    .from("transactions")
    .insert({
      user_id: account.user_id,
      account_id: account.id,
      category_id: category.id,
      txn_type: parsed.txnType,
      amount: parsed.amount,
      currency_code: "KES",
      occurred_on: parsed.occurredOn,
      description: parsed.description,
      metadata: {
        source: "sms_webhook",
        mpesa_receipt: parsed.receipt,
        counterparty: parsed.counterparty,
        balance_after: parsed.balanceAfter,
        txn_cost: parsed.txnCost,
        needs_review: parsed.needsReview,
        raw_sms: parsed.rawSms,
      },
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message, raw: parsed.rawSms }, { status: 500 });

  if (parsed.balanceAfter !== null) {
    try { await syncAccountBalance(supabase, account.id, parsed.balanceAfter); } catch { /* non-fatal */ }
  }

  return NextResponse.json({
    status: "created",
    transaction_id: txn.id,
    receipt: parsed.receipt,
    amount: parsed.amount,
    type: parsed.txnType,
    category: categoryName,
    counterparty: parsed.counterparty,
    balance_after: parsed.balanceAfter,
    needs_review: parsed.needsReview,
  });
}

// ─── GET: health + recent ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data: accounts } = await supabase
    .from("accounts").select("account_code, name, opening_balance, currency_code").order("account_code");
  const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true });
  const { data: recent } = await supabase
    .from("transactions")
    .select("amount, txn_type, description, occurred_on, metadata")
    .order("created_at", { ascending: false })
    .limit(10);
  return NextResponse.json({ status: "ok", accounts, transaction_count: count, recent });
}
