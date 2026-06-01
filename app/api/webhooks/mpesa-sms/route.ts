import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

// ─── Patterns ────────────────────────────────────────────────────────────────
const P = {
  fulizaInfo:   /fuliza m-?pesa amount is/i,
  received:     /received ksh([\d,]+\.?\d*) from ([^.]+?)(?=\s*\d{6,}|\s+on \d|\.)/i,
  sentPaid:     /ksh([\d,]+\.?\d*) (?:sent|paid) to ([^.]+?)(?=\s+for account|\s+on \d|\.)/i,
  withdrawn:    /ksh([\d,]+\.?\d*) withdrawn from ([^.]+?)(?=\s+on \d|\.|new m-?pesa)/i,
  giveCash:     /give ksh([\d,]+\.?\d*) cash to ([^.]+?)(?=\.|new m-?pesa)/i,
  airtime:      /(?:bought ksh([\d,]+\.?\d*) of airtime|airtime purchase of ksh([\d,]+\.?\d*))/i,
  // Savings transfers (M-Pesa ↔ KCB M-PESA / M-Shwari)
  toSavings:    /ksh([\d,]+\.?\d*) transfer(?:r)?ed to (kcb m-?pesa|m-?shwari)/i,
  fromSavings:  /ksh([\d,]+\.?\d*) transfer(?:r)?ed from (kcb m-?pesa|m-?shwari)/i,
  receipt:      /\b([A-Z0-9]{10})\b/,
  date:         /on (\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  mpesaBal:     /new m-?pesa balance is ksh([\d,]+\.?\d*)/i,
  kcbBal:       /new kcb m-?pesa[^.]*balance is ksh([\d,]+\.?\d*)/i,
  mshwariBal:   /new m-?shwari[^.]*balance is ksh([\d,]+\.?\d*)/i,
  txnCost:      /transaction cost[,\s]+ksh([\d,]+\.?\d*)/i,
  anyAmount:    /ksh\s?([\d,]+\.?\d*)/i,
};

const CATEGORY_RULES: { pattern: RegExp; category: string; type: "income" | "expense" }[] = [
  { pattern: /kplc|kenya power|umeme|power|token|stima/i,                       category: "Utilities",     type: "expense" },
  { pattern: /safaricom|airtel|telkom|faiba|airtime|bundle|data/i,              category: "Utilities",     type: "expense" },
  { pattern: /water|nawasco|gas|k-?gas|progas/i,                               category: "Utilities",     type: "expense" },
  { pattern: /naivas|carrefour|quickmart|chandarana|tuskys|uchumi|cleanshelf|eatery|eateries|restaurant|cafe|wineries|savor|kitchen|food|grill|fries/i, category: "Food & Dining", type: "expense" },
  { pattern: /uber|bolt|faras|little|indriver|matatu|fare|sgr|fuel|petrol|shell|total|rubis/i, category: "Transport", type: "expense" },
  { pattern: /netflix|spotify|showmax|dstv|gotv|youtube|subscription/i,         category: "Subscriptions", type: "expense" },
  { pattern: /nhif|sha|hospital|clinic|pharmacy|chemist|medical|dawa/i,         category: "Healthcare",    type: "expense" },
  { pattern: /school|fees|university|college|tuition|academy/i,                 category: "Education",     type: "expense" },
  { pattern: /airbnb|hotel|lodge|kenya airways|jambojet|flight/i,               category: "Travel",        type: "expense" },
  { pattern: /rent|landlord|caretaker/i,                                        category: "Housing",       type: "expense" },
  { pattern: /salary|payroll|wages|payslip/i,                                   category: "Salary",        type: "income"  },
  { pattern: /freelance|upwork|fiverr|consult/i,                               category: "Freelance",     type: "income"  },
  { pattern: /dividend|interest|investment|returns|sacco/i,                     category: "Investment",    type: "income"  },
];

function guessCategory(text: string, t: "income" | "expense"): string {
  for (const r of CATEGORY_RULES) if (r.type === t && r.pattern.test(text)) return r.category;
  return t === "income" ? "Other Income" : "Other Expense";
}

const num = (s: string) => parseFloat(s.replace(/,/g, ""));
function parseDate(s: string): string {
  const [d, m, y] = s.split("/").map(Number);
  const yr = y < 100 ? 2000 + y : y;
  return `${yr}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function cleanName(raw: string): string {
  return raw
    .replace(/\b\d{9,12}\b/g, "")     // phone numbers
    .replace(/\s+/g, " ")
    .replace(/[.\s]+$/, "")            // trailing dot/space
    .trim() || "Unknown";
}
function cleanSms(raw: string): string {
  return raw.replace(/^From\s*:\s*.+[\r\n]+/i, "").trim();
}
function looksLikeMpesa(t: string): boolean {
  return (/confirmed/i.test(t) && /ksh\s?[\d,]/i.test(t)) || P.mpesaBal.test(t) || /\b[A-Z0-9]{10}\b\s+confirmed/i.test(t);
}

type Kind = "income" | "expense" | "transfer_out" | "transfer_in" | "fuliza" | "skip";
interface Parsed {
  kind: Kind;
  receipt: string;
  amount: number;
  description: string;
  counterparty: string;
  occurredOn: string;
  txnType: "income" | "expense" | "transfer";
  savingsCode?: "kcb_mpesa" | "mshwari";
  mpesaBal: number | null;
  savingsBal: number | null;
  txnCost: number | null;
  needsReview: boolean;
  raw: string;
}

function savingsCodeFor(label: string): "kcb_mpesa" | "mshwari" {
  return /kcb/i.test(label) ? "kcb_mpesa" : "mshwari";
}

function parse(rawText: string): Parsed | null {
  const text = cleanSms(rawText);
  if (!looksLikeMpesa(text)) return null;

  // Fuliza financing line - skip (the paired send carries the real expense)
  if (P.fulizaInfo.test(text) && !P.sentPaid.test(text)) {
    return { kind: "fuliza", receipt: text.match(P.receipt)?.[1] ?? "UNKNOWN", amount: 0, description: "", counterparty: "", occurredOn: "", txnType: "expense", mpesaBal: null, savingsBal: null, txnCost: null, needsReview: false, raw: text.slice(0, 400) };
  }

  const receipt    = text.match(P.receipt)?.[1] ?? "UNKNOWN";
  const occurredOn = text.match(P.date) ? parseDate(text.match(P.date)![1]) : new Date().toISOString().split("T")[0];
  const mpesaBal   = text.match(P.mpesaBal) ? num(text.match(P.mpesaBal)![1]) : null;
  const txnCost    = text.match(P.txnCost) ? num(text.match(P.txnCost)![1]) : null;
  const base = { receipt, occurredOn, mpesaBal, txnCost, raw: text.slice(0, 400), needsReview: false };

  // Transfer TO savings (KCB M-PESA / M-Shwari)
  const toSav = text.match(P.toSavings);
  if (toSav) {
    const code = savingsCodeFor(toSav[2]);
    const savBal = code === "kcb_mpesa"
      ? (text.match(P.kcbBal) ? num(text.match(P.kcbBal)![1]) : null)
      : (text.match(P.mshwariBal) ? num(text.match(P.mshwariBal)![1]) : null);
    const name = code === "kcb_mpesa" ? "KCB M-PESA" : "M-Shwari";
    return { ...base, kind: "transfer_out", amount: num(toSav[1]), txnType: "transfer", savingsCode: code, savingsBal: savBal, counterparty: name, description: `Transfer to ${name}` };
  }

  // Transfer FROM savings back to M-Pesa
  const fromSav = text.match(P.fromSavings);
  if (fromSav) {
    const code = savingsCodeFor(fromSav[2]);
    const savBal = code === "kcb_mpesa"
      ? (text.match(P.kcbBal) ? num(text.match(P.kcbBal)![1]) : null)
      : (text.match(P.mshwariBal) ? num(text.match(P.mshwariBal)![1]) : null);
    const name = code === "kcb_mpesa" ? "KCB M-PESA" : "M-Shwari";
    return { ...base, kind: "transfer_in", amount: num(fromSav[1]), txnType: "transfer", savingsCode: code, savingsBal: savBal, counterparty: name, description: `Transfer from ${name}` };
  }

  // Income
  const recv = text.match(P.received);
  if (recv) {
    const cp = cleanName(recv[2]);
    return { ...base, kind: "income", amount: num(recv[1]), txnType: "income", savingsBal: null, counterparty: cp, description: `Received from ${cp}` };
  }

  // Expense - sent/paid
  const sp = text.match(P.sentPaid);
  if (sp) {
    const cp = cleanName(sp[2]);
    return { ...base, kind: "expense", amount: num(sp[1]), txnType: "expense", savingsBal: null, counterparty: cp, description: `Paid to ${cp}` };
  }

  // Expense - withdrawal
  const wd = text.match(P.withdrawn) ?? text.match(P.giveCash);
  if (wd) {
    const cp = cleanName(wd[2]);
    return { ...base, kind: "expense", amount: num(wd[1]), txnType: "expense", savingsBal: null, counterparty: cp, description: `Withdrawal at ${cp}` };
  }

  // Expense - airtime
  const air = text.match(P.airtime);
  if (air) {
    return { ...base, kind: "expense", amount: num(air[1] ?? air[2]), txnType: "expense", savingsBal: null, counterparty: "Safaricom", description: "Airtime purchase" };
  }

  // Fallback - capture, flag for review
  const any = text.match(P.anyAmount);
  if (any) {
    const isInc = /received|deposit|refund|reversal|credited/i.test(text);
    return { ...base, kind: isInc ? "income" : "expense", amount: num(any[1]), txnType: isInc ? "income" : "expense", savingsBal: null, counterparty: "Unknown", description: isInc ? "M-Pesa income (review)" : "M-Pesa expense (review)", needsReview: true };
  }
  return null;
}

// ─── Body extraction ──────────────────────────────────────────────────────────
async function extractSmsText(request: NextRequest): Promise<string> {
  const ct = request.headers.get("content-type") ?? "";
  const aliases = ["body", "message", "sms", "text", "msg", "content", "sms_body"];
  const fromJson = (j: Record<string, unknown>) => {
    for (const k of aliases) if (typeof j[k] === "string" && (j[k] as string).length > 0) return j[k] as string;
    const f = Object.values(j).find((v) => typeof v === "string" && (v as string).length > 10);
    return (f as string) ?? "";
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

// Recompute an account's opening_balance so its computed balance equals `stated`.
async function setBalance(supabase: AdminClient, accountId: string, stated: number) {
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
  await supabase.from("accounts").update({ opening_balance: stated - net }).eq("id", accountId);
}

// ─── POST ───────────────────────────────────────────────────────────────────
// Persist a raw payload for diagnosis (recoverable via GET ?debug=1). Best-effort.
async function captureDebug(rawBody: string, contentType: string, extracted: string, reason: string) {
  try {
    const supabase = createAdminClient();
    const { data: mpesa } = await supabase.from("accounts").select("id, user_id").eq("account_code", "main").single();
    if (!mpesa) return;
    const { data: cat } = await supabase.from("categories").select("id").eq("user_id", mpesa.user_id).eq("type", "expense").limit(1).single();
    if (!cat) return;
    await supabase.from("transactions").insert({
      user_id: mpesa.user_id, account_id: mpesa.id, category_id: cat.id,
      txn_type: "expense", amount: 0.01, currency_code: "KES",
      occurred_on: new Date().toISOString().split("T")[0],
      description: `DEBUG ${reason}`,
      metadata: { source: "webhook_debug", reason, content_type: contentType, raw_body: rawBody.slice(0, 500), extracted: extracted.slice(0, 300) },
    });
  } catch { /* best effort */ }
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-webhook-secret") ?? request.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Capture raw body up-front (clone so extractSmsText can still read the stream)
  const contentType = request.headers.get("content-type") ?? "none";
  let rawBody = "";
  try { rawBody = await request.clone().text(); } catch { /* */ }

  let smsText = "";
  try { smsText = await extractSmsText(request); } catch { return NextResponse.json({ error: "Could not read body" }, { status: 400 }); }
  if (!smsText) {
    await captureDebug(rawBody, contentType, "", "empty_body");
    return NextResponse.json({ status: "ignored", reason: "empty_body", content_type: contentType, raw_preview: rawBody.slice(0, 120) });
  }

  const p = parse(smsText);
  if (!p) {
    await captureDebug(rawBody, contentType, smsText, "not_mpesa");
    return NextResponse.json({ status: "ignored", reason: "not_mpesa", preview: smsText.slice(0, 120) });
  }
  if (p.kind === "fuliza") return NextResponse.json({ status: "ignored", reason: "fuliza_financing", receipt: p.receipt });
  if (p.amount <= 0) return NextResponse.json({ status: "ignored", reason: "zero_amount" });

  const supabase = createAdminClient();

  const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
  const mpesa = (accts ?? []).find((a) => a.account_code === "main");
  if (!mpesa) return NextResponse.json({ error: "MPESA account not found" }, { status: 404 });
  const userId = mpesa.user_id;

  // Dedup
  if (p.receipt !== "UNKNOWN") {
    const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true })
      .eq("user_id", userId).contains("metadata", { mpesa_receipt: p.receipt });
    if (count && count > 0) return NextResponse.json({ status: "ignored", reason: "duplicate", receipt: p.receipt });
  }

  // ── Transfers to/from savings sub-wallets ──
  if (p.txnType === "transfer" && p.savingsCode) {
    const savings = (accts ?? []).find((a) => a.account_code === p.savingsCode);
    if (!savings) return NextResponse.json({ error: `${p.savingsCode} account not found` }, { status: 404 });

    const fromId = p.kind === "transfer_out" ? mpesa.id : savings.id;
    const toId   = p.kind === "transfer_out" ? savings.id : mpesa.id;

    const { data: txn, error } = await supabase.from("transactions").insert({
      user_id: userId, account_id: fromId, transfer_account_id: toId, category_id: null,
      txn_type: "transfer", amount: p.amount, currency_code: "KES", occurred_on: p.occurredOn,
      description: p.description,
      metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, counterparty: p.counterparty, balance_after: p.mpesaBal, savings_balance: p.savingsBal, raw_sms: p.raw },
    }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Sync both balances from the SMS
    if (p.mpesaBal !== null)   { try { await setBalance(supabase, mpesa.id, p.mpesaBal); } catch {} }
    if (p.savingsBal !== null) { try { await setBalance(supabase, savings.id, p.savingsBal); } catch {} }

    return NextResponse.json({ status: "created", kind: p.kind, transaction_id: txn.id, amount: p.amount, savings: p.savingsCode, mpesa_balance: p.mpesaBal, savings_balance: p.savingsBal });
  }

  // ── Income / Expense ──
  const categoryName = guessCategory(p.raw, p.txnType as "income" | "expense");
  let { data: category } = await supabase.from("categories").select("id")
    .eq("user_id", userId).eq("name", categoryName).eq("type", p.txnType).single();
  if (!category) {
    const { data: fb } = await supabase.from("categories").select("id").eq("user_id", userId).eq("type", p.txnType).limit(1).single();
    category = fb;
  }
  if (!category) return NextResponse.json({ error: "No category found" }, { status: 500 });

  const { data: txn, error } = await supabase.from("transactions").insert({
    user_id: userId, account_id: mpesa.id, category_id: category.id,
    txn_type: p.txnType, amount: p.amount, currency_code: "KES", occurred_on: p.occurredOn,
    description: p.description,
    metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, counterparty: p.counterparty, balance_after: p.mpesaBal, txn_cost: p.txnCost, needs_review: p.needsReview, raw_sms: p.raw },
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message, raw: p.raw }, { status: 500 });

  if (p.mpesaBal !== null) { try { await setBalance(supabase, mpesa.id, p.mpesaBal); } catch {} }

  return NextResponse.json({
    status: "created", kind: p.kind, transaction_id: txn.id, amount: p.amount, type: p.txnType,
    category: categoryName, counterparty: p.counterparty, balance_after: p.mpesaBal, needs_review: p.needsReview,
  });
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const { data: accounts } = await supabase.from("accounts").select("account_code, name, opening_balance, currency_code").order("account_code");
  const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true });
  // Confirm which Supabase project the running app is bound to
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^["']|["']$/g, "").trim();
  const projectRef = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1] ?? "unknown";

  // ?cleardebug=1 → delete all webhook_debug placeholder rows
  if (request.nextUrl.searchParams.get("cleardebug") === "1") {
    const { count: deleted } = await supabase
      .from("transactions")
      .delete({ count: "exact" })
      .contains("metadata", { source: "webhook_debug" });
    return NextResponse.json({ status: "cleared", deleted });
  }

  // ?debug=1 → return recent raw captures from failed parses
  if (request.nextUrl.searchParams.get("debug") === "1") {
    const { data: debug } = await supabase
      .from("transactions")
      .select("created_at, description, metadata")
      .contains("metadata", { source: "webhook_debug" })
      .order("created_at", { ascending: false })
      .limit(10);
    return NextResponse.json({ project_ref: projectRef, debug });
  }

  return NextResponse.json({ status: "ok", project_ref: projectRef, accounts, transaction_count: count });
}
