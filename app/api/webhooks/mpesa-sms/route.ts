import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

// ─── Patterns ────────────────────────────────────────────────────────────────
const P = {
  fulizaInfo:   /fuliza m-?pesa amount is/i,
  fulizaOutstanding: /total fuliza m-?pesa outstanding amount is\s*ksh\s*([\d,]+\.?\d*)/i,
  mshwariLoanOutstanding: /m-?shwari\s+loan[^.]*outstanding[^.]*ksh\s*([\d,]+\.?\d*)/i,
  kcbOverdraftOutstanding: /kcb m-?pesa[^.]*overdraft[^.]*ksh\s*([\d,]+\.?\d*)/i,
  fulizaRepay:  /ksh\s*([\d,]+\.?\d*)\s+from your m-pesa has been used to fully pay your outstanding fuliza/i,
  received:     /received ksh([\d,]+\.?\d*) from ([^.]+?)(?=\s*\d{6,}|\s+on \d|\.)/i,
  sentPaid:     /ksh([\d,]+\.?\d*) (?:sent|paid) to ([^.]+?)(?=\s+for account|\s+on \d|\.)/i,
  withdrawn:    /ksh([\d,]+\.?\d*) withdrawn from ([^.]+?)(?=\s+on \d|\.|new m-?pesa)/i,
  giveCash:     /give ksh([\d,]+\.?\d*) cash to ([^.]+?)(?=\.|new m-?pesa)/i,
  airtime:      /(?:bought ksh([\d,]+\.?\d*) of airtime|airtime purchase of ksh([\d,]+\.?\d*))/i,
  // Savings transfers (M-Pesa ↔ KCB M-PESA / M-Shwari) (supporting "your" and "account")
  toSavings:    /(?:you\s+have\s+)?(?:transfer(?:r)?ed\s+)?ksh\s*([\d,]+\.?\d*)\s+(?:transfer(?:r)?ed\s+)?to\s+(?:your\s+)?(kcb m-?pesa|m-?shwari)(?:\s+account)?/i,
  fromSavings:  /(?:you\s+have\s+)?(?:transfer(?:r)?ed\s+)?ksh\s*([\d,]+\.?\d*)\s+(?:transfer(?:r)?ed\s+)?from\s+(?:your\s+)?(kcb m-?pesa|m-?shwari)(?:\s+account)?/i,
  receipt:      /\b([A-Z0-9]{10})\b/,
  date:         /on (\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  mpesaBal:     /(?:new\s+|your\s+)?m-?pesa\s+balance\s+is\s+(?:ksh\s?)?([\d,]+\.?\d*)/i,
  kcbBal:       /(?:new\s+)?kcb m-?pesa[^.]*balance is\s+(?:ksh\s?)?([\d,]+\.?\d*)/i,
  mshwariBal:   /(?:new\s+)?m-?shwari[^.]*balance is\s+(?:ksh\s?)?([\d,]+\.?\d*)/i,
  txnCost:      /transaction cost[,\s]+ksh([\d,]+\.?\d*)/i,
  anyAmount:    /ksh\s?([\d,]+\.?\d*)/i,
  sbmCard:         /(?:online purchase|Retail transaction) of KES\s*([\d,]+\.?\d*) has been made on your card \d+\*+(\d+) at ([^.]+?) on (\d{4}-\d{2}-\d{2})/i,
  sbmPesalink:     /Dear ROY\s*:\s*KES\s*([\d,]+\.?\d*)\s+Incoming Pesalink\s*,\s*has been credited to account ending (\d+) on (\d{1,2}-\d{1,2}-\d{4})/i,
  sbmEft:          /Dear ROY\s*:\s*KES\s*([\d,]+\.?\d*)\s+Inward Clg EFT has been deposited to account ending with (\d+) on (\d{1,2}-\d{1,2}-\d{4})/i,
  sbmMobileCredit: /Dear ROY\s*:\s*KES\s*([\d,]+\.?\d*)\s*,\s*has been credited to account ending (\d+) through MPESA Mobile Banking Terminal on (\d{1,2}-\d{1,2}-\d{4})/i,
  sbmMpesaPay:     /Your M-Pesa payment of KES\s*([\d,]+\.?\d*) to (\d+) was successful on (\d{1,2}\/\d{1,2}\/\d{2,4}).*?M-Pesa Ref:\s*\b([A-Z0-9]{10})\b/i,
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

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function parseSbmDate(s: string): string {
  if (s.includes(" ")) s = s.split(" ")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parts = s.split(/[-/]/).map(Number);
  if (parts.length === 3) {
    if (parts[0] > 100) {
      return `${parts[0]}-${String(parts[1]).padStart(2, "0")}-${String(parts[2]).padStart(2, "0")}`;
    }
    if (s.includes("/") || parts[0] > 12) {
      const [d, m, y] = parts;
      const yr = y < 100 ? 2000 + y : y;
      return `${yr}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    const [m, d, y] = parts;
    const yr = y < 100 ? 2000 + y : y;
    return `${yr}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return new Date().toISOString().split("T")[0];
}

interface ParsedSbm {
  kind: "income" | "expense" | "transfer";
  receipt: string;
  amount: number;
  description: string;
  counterparty: string;
  occurredOn: string;
}

function parseSbmSMS(text: string): ParsedSbm | null {
  if (/maintenance| OTP |declined|closed tomorrow|resumed|reminder|observed/i.test(text)) return null;

  // 1. Card Purchase (Expense)
  const card = text.match(P.sbmCard);
  if (card) {
    const amount = num(card[1]);
    const merchant = cleanName(card[3]);
    const date = parseSbmDate(card[4]);
    return {
      kind: "expense",
      receipt: `SBM-CARD-${card[2]}-${date.replace(/-/g, "")}-${hashString(text)}`,
      amount,
      description: `Card purchase at ${merchant}`,
      counterparty: merchant,
      occurredOn: date,
    };
  }

  // 2. Incoming Credit (Income)
  const pesalink = text.match(P.sbmPesalink);
  if (pesalink) {
    return {
      kind: "income",
      receipt: `SBM-PL-${pesalink[2]}-${parseSbmDate(pesalink[3]).replace(/-/g, "")}-${hashString(text)}`,
      amount: num(pesalink[1]),
      description: "Incoming Pesalink",
      counterparty: "Pesalink",
      occurredOn: parseSbmDate(pesalink[3]),
    };
  }

  const eft = text.match(P.sbmEft);
  if (eft) {
    return {
      kind: "income",
      receipt: `SBM-EFT-${eft[2]}-${parseSbmDate(eft[3]).replace(/-/g, "")}-${hashString(text)}`,
      amount: num(eft[1]),
      description: "Inward Clearing EFT Deposit",
      counterparty: "Clearing House",
      occurredOn: parseSbmDate(eft[3]),
    };
  }

  // We skip sbmMobileCredit (credits from M-Pesa mobile banking terminal) 
  // because we already capture them as transfers from the sender-side M-Pesa paybill SMS!

  // 3. M-Pesa to SBM Paybill Payment (Transfer)
  const mpesaPay = text.match(P.sbmMpesaPay);
  if (mpesaPay) {
    return {
      kind: "transfer",
      receipt: mpesaPay[4],
      amount: num(mpesaPay[1]),
      description: "Transfer to SBM Bank",
      counterparty: "SBM Bank",
      occurredOn: parseSbmDate(mpesaPay[3]),
    };
  }

  return null;
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

  // Fuliza repayment line
  const fulizaRepay = text.match(P.fulizaRepay);
  if (fulizaRepay) {
    return { ...base, kind: "expense", amount: num(fulizaRepay[1]), txnType: "expense", savingsBal: null, counterparty: "Fuliza M-Pesa", description: "Fuliza repayment" };
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

// ─── Auto-debt upserts (Fuliza / M-Shwari Loan / KCB Overdraft) ─────────────
async function upsertAutoDebt(
  supabase: AdminClient,
  userId: string,
  source: "fuliza" | "mshwari_loan" | "kcb_overdraft",
  creditor: string,
  balance: number,
) {
  try {
    const isActive = balance > 0;
    const { data: existing } = await supabase
      .from("debts")
      .select("id")
      .eq("user_id", userId)
      .eq("source_identifier", source)
      .maybeSingle();
    if (existing) {
      await supabase.from("debts").update({
        creditor,
        debt_type: source,
        current_balance: balance,
        auto_tracked: true,
        is_active: isActive,
      }).eq("id", existing.id);
    } else {
      await supabase.from("debts").insert({
        user_id: userId,
        creditor,
        debt_type: source,
        principal: balance,
        current_balance: balance,
        currency_code: "KES",
        auto_tracked: true,
        is_active: isActive,
        source_identifier: source,
      });
    }
  } catch (err) {
    console.warn("[upsertAutoDebt] failed:", err);
  }
}

function advanceDate(dateStr: string, recurrence: string): string {
  const d = new Date(dateStr + "T00:00:00");
  switch (recurrence) {
    case "weekly":    d.setDate(d.getDate() + 7); break;
    case "monthly":   d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "yearly":    d.setFullYear(d.getFullYear() + 1); break;
    default:          d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().split("T")[0];
}

function currentCycleStart(recurrence: string, today: Date): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  switch (recurrence) {
    case "weekly":    d.setDate(d.getDate() - 7); break;
    case "monthly":   d.setDate(1); break;
    case "quarterly": d.setMonth(d.getMonth() - 3); break;
    case "yearly":    d.setMonth(0); d.setDate(1); break;
    default:          d.setDate(1);
  }
  return d.toISOString().split("T")[0];
}

async function tryAutoMatchObligation(
  supabase: AdminClient,
  userId: string,
  txnId: string,
  occurredOn: string,
  searchText: string,
) {
  try {
    const { data: obls } = await supabase
      .from("recurring_obligations")
      .select("id, recurrence, last_paid_date, next_due_date, match_keywords")
      .eq("user_id", userId)
      .eq("is_active", true)
      .not("match_keywords", "is", null);
    if (!obls || obls.length === 0) return;
    const lower = searchText.toLowerCase();
    const today = new Date();
    for (const o of obls) {
      if (!o.match_keywords) continue;
      const kws = o.match_keywords.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      if (!kws.some((k: string) => lower.includes(k))) continue;
      // Check cycle: skip if already paid in current cycle
      const cycleStart = currentCycleStart(o.recurrence, today);
      if (o.last_paid_date && o.last_paid_date >= cycleStart) continue;
      const fromDate = o.next_due_date ?? occurredOn;
      const nextDue = advanceDate(fromDate, o.recurrence);
      await supabase.from("recurring_obligations").update({
        last_paid_date: occurredOn,
        last_transaction_id: txnId,
        next_due_date: nextDue,
      }).eq("id", o.id);
    }
  } catch (err) {
    console.warn("[tryAutoMatchObligation] failed:", err);
  }
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

  // 1. SBM Bank Parsing
  const sbm = parseSbmSMS(smsText);
  if (sbm) {
    const supabase = createAdminClient();
    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    const sbmAccount = (accts ?? []).find((a) => a.account_code === "bank_c");
    if (!sbmAccount) return NextResponse.json({ error: "SBM Bank account (bank_c) not found" }, { status: 404 });
    const userId = sbmAccount.user_id;

    // Dedup by receipt
    if (sbm.receipt !== "UNKNOWN") {
      const { data: existing } = await supabase.from("transactions").select("id, txn_type")
        .eq("user_id", userId)
        .or(`metadata->>sbm_receipt.eq.${sbm.receipt},metadata->>mpesa_receipt.eq.${sbm.receipt}`);

      if (existing && existing.length > 0) {
        const incorrectExpense = existing.find(t => t.txn_type === "expense" && sbm.kind === "transfer");
        if (incorrectExpense) {
          await supabase.from("transactions").delete().eq("id", incorrectExpense.id);
        } else {
          return NextResponse.json({ status: "ignored", reason: "duplicate", receipt: sbm.receipt });
        }
      }
    }

    if (sbm.kind === "transfer") {
      const mpesa = (accts ?? []).find((a) => a.account_code === "main");
      if (!mpesa) return NextResponse.json({ error: "MPESA account not found" }, { status: 404 });

      const { data: txn, error } = await supabase.from("transactions").insert({
        user_id: userId, account_id: mpesa.id, transfer_account_id: sbmAccount.id, category_id: null,
        txn_type: "transfer", amount: sbm.amount, currency_code: "KES", occurred_on: sbm.occurredOn,
        description: sbm.description,
        metadata: { source: "sbm_webhook", sbm_receipt: sbm.receipt, counterparty: sbm.counterparty, raw_sms: smsText },
      }).select("id").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ status: "created", kind: "transfer", transaction_id: txn.id, amount: sbm.amount });
    }

    // Income / Expense
    const categoryName = guessCategory(smsText, sbm.kind);
    let { data: category } = await supabase.from("categories").select("id")
      .eq("user_id", userId).eq("name", categoryName).eq("type", sbm.kind).single();
    if (!category) {
      const { data: fb } = await supabase.from("categories").select("id").eq("user_id", userId).eq("type", sbm.kind).limit(1).single();
      category = fb;
    }
    if (!category) return NextResponse.json({ error: "No category found" }, { status: 500 });

    const { data: txn, error } = await supabase.from("transactions").insert({
      user_id: userId, account_id: sbmAccount.id, category_id: category.id,
      txn_type: sbm.kind, amount: sbm.amount, currency_code: "KES", occurred_on: sbm.occurredOn,
      description: sbm.description,
      metadata: { source: "sbm_webhook", sbm_receipt: sbm.receipt, counterparty: sbm.counterparty, raw_sms: smsText },
    }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ status: "created", kind: sbm.kind, transaction_id: txn.id, amount: sbm.amount, category: categoryName });
  }

  const p = parse(smsText);
  if (!p) {
    await captureDebug(rawBody, contentType, smsText, "not_mpesa");
    return NextResponse.json({ status: "ignored", reason: "not_mpesa", preview: smsText.slice(0, 120) });
  }
  if (p.kind === "fuliza") {
    // Auto-track Fuliza outstanding balance as a debt
    try {
      const adminSb = createAdminClient();
      const { data: mpesa } = await adminSb.from("accounts").select("user_id").eq("account_code", "main").single();
      if (mpesa) {
        const m = p.raw.match(P.fulizaOutstanding);
        if (m) {
          const balance = num(m[1]);
          await upsertAutoDebt(adminSb, mpesa.user_id, "fuliza", "Safaricom Fuliza", balance);
        }
      }
    } catch (err) {
      console.warn("[fuliza upsert] failed:", err);
    }
    return NextResponse.json({ status: "ignored", reason: "fuliza_financing", receipt: p.receipt });
  }
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

  // Auto-match recurring obligations on expense txns
  if (p.txnType === "expense") {
    const searchText = `${p.description ?? ""} ${p.counterparty ?? ""} ${p.raw}`;
    await tryAutoMatchObligation(supabase, userId, txn.id, p.occurredOn, searchText);
  }

  // Auto-track M-Shwari Loan / KCB M-PESA Overdraft outstanding balances
  try {
    const mshwariM = p.raw.match(P.mshwariLoanOutstanding);
    if (mshwariM) {
      await upsertAutoDebt(supabase, userId, "mshwari_loan", "M-Shwari Loan", num(mshwariM[1]));
    }
    const kcbM = p.raw.match(P.kcbOverdraftOutstanding);
    if (kcbM) {
      await upsertAutoDebt(supabase, userId, "kcb_overdraft", "KCB M-PESA Overdraft", num(kcbM[1]));
    }
  } catch (err) {
    console.warn("[auto-debt detection] failed:", err);
  }

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
  // ?diagnose=1 -> calculate exact balances using frontend query logic to check math
  if (request.nextUrl.searchParams.get("diagnose") === "1") {
    const { data: accts } = await supabase.from("accounts").select("id, name, account_code, opening_balance, user_id");
    if (!accts) return NextResponse.json({ error: "No accounts" });
    const { data: profiles } = await supabase.from("profiles").select("id, full_name");
    const { data: txns } = await supabase.from("transactions").select("user_id, description, amount");
    
    const ids = accts.map(a => a.id);
    const balances: Record<string, number> = {};
    for (const id of ids) balances[id] = 0;
    
    let totalBalance = accts.reduce((s, a) => s + Number(a.opening_balance), 0);
    let outflowsList = [];
    let inflowsList = [];

    if (ids.length > 0) {
      const [{ data: outflows }, { data: inflows }] = await Promise.all([
        supabase.from("transactions").select("account_id, amount, txn_type"),
        supabase.from("transactions").select("transfer_account_id, amount").not("transfer_account_id", "is", null),
      ]);
      outflowsList = outflows || [];
      inflowsList = inflows || [];

      for (const r of outflows || []) {
        if (r.txn_type === "income") {
          balances[r.account_id] += Number(r.amount);
          totalBalance += Number(r.amount);
        } else {
          balances[r.account_id] -= Number(r.amount);
          totalBalance -= Number(r.amount);
        }
      }
      for (const r of inflows || []) {
        if (r.transfer_account_id) {
          balances[r.transfer_account_id] += Number(r.amount);
          totalBalance += Number(r.amount);
        }
      }
    }

    const calculatedAccounts = accts.map(a => ({
      name: a.name,
      account_code: a.account_code,
      opening_balance: Number(a.opening_balance),
      net_change: balances[a.id] || 0,
      calculated_balance: Number(a.opening_balance) + (balances[a.id] || 0),
      user_id: a.user_id,
    }));

    return NextResponse.json({
      status: "diagnose",
      total_balance: totalBalance,
      accounts: calculatedAccounts,
      transaction_count: outflowsList.length,
      profiles: profiles,
      transactions_summary: (txns || []).slice(0, 10).map(t => ({ user_id: t.user_id, desc: t.description, amt: t.amount })),
    });
  }

  // ?reprocess=<receipt> -> delete and reprocess a transaction with new regexes
  const repReceipt = request.nextUrl.searchParams.get("reprocess");
  if (repReceipt) {
    const { data: txn } = await supabase.from("transactions").select("id, metadata").contains("metadata", { mpesa_receipt: repReceipt }).limit(1).maybeSingle();
    if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    const rawSms = (txn.metadata as Record<string, any>)?.raw_sms;
    if (!rawSms) return NextResponse.json({ error: "No raw SMS text in metadata" }, { status: 400 });

    await supabase.from("transactions").delete().eq("id", txn.id);

    const p = parse(rawSms);
    if (!p) return NextResponse.json({ error: "Failed to parse SMS with new regexes" }, { status: 400 });

    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    const mpesa = (accts ?? []).find((a) => a.account_code === "main");
    if (!mpesa) return NextResponse.json({ error: "M-Pesa account not found" }, { status: 404 });
    const userId = mpesa.user_id;

    let result = null;

    if (p.txnType === "transfer" && p.savingsCode) {
      const savings = (accts ?? []).find((a) => a.account_code === p.savingsCode);
      if (!savings) return NextResponse.json({ error: `${p.savingsCode} account not found` }, { status: 404 });

      const fromId = p.kind === "transfer_out" ? mpesa.id : savings.id;
      const toId   = p.kind === "transfer_out" ? savings.id : mpesa.id;

      const { data: newTxn, error } = await supabase.from("transactions").insert({
        user_id: userId, account_id: fromId, transfer_account_id: toId, category_id: null,
        txn_type: "transfer", amount: p.amount, currency_code: "KES", occurred_on: p.occurredOn,
        description: p.description,
        metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, counterparty: p.counterparty, balance_after: p.mpesaBal, savings_balance: p.savingsBal, raw_sms: p.raw },
      }).select("id").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      if (p.mpesaBal !== null)   { await setBalance(supabase, mpesa.id, p.mpesaBal); }
      if (p.savingsBal !== null) { await setBalance(supabase, savings.id, p.savingsBal); }
      result = { status: "reprocessed", id: newTxn.id, mpesa_balance: p.mpesaBal, savings_balance: p.savingsBal };
    } else {
      const categoryName = guessCategory(p.raw, p.txnType as "income" | "expense");
      let { data: category } = await supabase.from("categories").select("id").eq("user_id", userId).eq("name", categoryName).eq("type", p.txnType).single();
      if (!category) {
        const { data: fb } = await supabase.from("categories").select("id").eq("user_id", userId).eq("type", p.txnType).limit(1).single();
        category = fb;
      }
      if (!category) return NextResponse.json({ error: "No category" }, { status: 500 });

      const { data: newTxn, error } = await supabase.from("transactions").insert({
        user_id: userId, account_id: mpesa.id, category_id: category.id,
        txn_type: p.txnType, amount: p.amount, currency_code: "KES", occurred_on: p.occurredOn,
        description: p.description,
        metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, counterparty: p.counterparty, balance_after: p.mpesaBal, txn_cost: p.txnCost, needs_review: p.needsReview, raw_sms: p.raw },
      }).select("id").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      if (p.mpesaBal !== null) { await setBalance(supabase, mpesa.id, p.mpesaBal); }
      result = { status: "reprocessed", id: newTxn.id, mpesa_balance: p.mpesaBal };
    }

    return NextResponse.json(result);
  }

  // ?backfill=1 → delete duplicates and re-ingest all 43 pasted SMS with corrected regexes and accurate math!
  if (request.nextUrl.searchParams.get("backfill") === "1") {
    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    if (!accts || accts.length === 0) return NextResponse.json({ error: "No accounts found" }, { status: 500 });
    
    const mpesa = accts.find(a => a.account_code === "main");
    const kcb = accts.find(a => a.account_code === "kcb_mpesa");
    if (!mpesa || !kcb) return NextResponse.json({ error: "Main or KCB account missing" }, { status: 500 });
    const userId = mpesa.user_id;

    // 1. Delete all transactions created by the webhook or debug capturing
    await supabase.from("transactions").delete().eq("user_id", userId).or("metadata->>source.eq.sms_webhook,metadata->>source.eq.webhook_debug");
    
    // 2. Delete any manual upkeep double entry
    await supabase.from("transactions").delete().eq("user_id", userId).eq("description", "Monthly Upkeep sent by Okwembas");

    // 3. Reset all account opening balances to 0
    await supabase.from("accounts").update({ opening_balance: 0 }).eq("user_id", userId);

    const smsList = [
      "UEULA5XIBK confirmed. You have received Ksh12,852.00 from Jenifer Akoth OkwembaGilles in US via Sendwave on 30/5/26 at 8:06 PM. New M-PESA balance is Ksh12,852.00.",
      "UEULA5XIBO Confirmed. Ksh 1142.46 from your M-PESA has been used to fully pay your outstanding Fuliza M-PESA. Available Fuliza M-PESA limit is Ksh 1500.00. Your M-PESA balance is 11709.54.",
      "UEULA5XMT4 Confirmed. Ksh500.00 sent to Gathogo  Kigotho 0708767392 on 30/5/26 at 8:10 PM. New M-PESA balance is Ksh11,202.54. Transaction cost, Ksh7.00.  Amount you can transact within the day is 498,340.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEULA5XT58 Confirmed. Ksh40.00 sent to JOSPHAT  MUTINDA on 30/5/26 at 9:12 PM. New M-PESA balance is Ksh11,162.54. Transaction cost, Ksh0.00. Amount you can transact within the day is 498,300.00. Download My OneApp on https://saf.cx/kWQpy",
      "UEULA5XW6C Confirmed. Ksh75.00 paid to Polymatt Supermarket. on 30/5/26 at 9:17 PM.New M-PESA balance is Ksh11,087.54. Transaction cost, Ksh0.00. Amount you can transact within the day is 498,225.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEULA5XWBQ Confirmed. Ksh70.00 paid to ATOMIC INC 3. on 30/5/26 at 9:25 PM.New M-PESA balance is Ksh11,017.54. Transaction cost, Ksh0.00. Amount you can transact within the day is 498,155.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEULA5XWCI Confirmed. Ksh350.00 paid to SIP AND SAVOR WINERIES. on 30/5/26 at 9:26 PM.New M-PESA balance is Ksh10,667.54. Transaction cost, Ksh0.00. Amount you can transact within the day is 497,805.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA5Z1RU Confirmed. Ksh200.00 sent to MUSA  YAVATSA 0768360370 on 31/5/26 at 10:27 AM. New M-PESA balance is Ksh10,460.54. Transaction cost, Ksh7.00.  Amount you can transact within the day is 499,800.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA5Z4SY Confirmed. Ksh100.00 sent to IAN  HOKA 0705241027 on 31/5/26 at 10:28 AM. New M-PESA balance is Ksh10,360.54. Transaction cost, Ksh0.00.  Amount you can transact within the day is 499,700.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA5Z7JP Confirmed. Ksh500.00 sent to DTB 247 for account 5804605001 on 31/5/26 at 10:41 AM New M-PESA balance is Ksh9,855.54. Transaction cost, Ksh5.00.Amount you can transact within the day is 499,200.00. Download My OneApp on https://saf.cx/kWQpy",
      "UEVLA5ZFU3 Confirmed. Ksh400.00 paid to SIP AND SAVOR WINERIES. on 31/5/26 at 12:15 PM.New M-PESA balance is Ksh9,455.54. Transaction cost, Ksh0.00. Amount you can transact within the day is 498,800.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA5ZL0C Confirmed. Ksh9,000.00 transfered to KCB M-PESA account on 31/5/26 at 12:33 PM. New M-PESA balance is Ksh455.54, new KCB M-PESA Saving account balance is Ksh9,000.00.",
      "UEVLA5ZMZV Confirmed. Ksh450.00 sent to KPLC PREPAID for account 14244145760 on 31/5/26 at 1:08 PM New M-PESA balance is Ksh0.54. Transaction cost, Ksh5.00.Amount you can transact within the day is 489,350.00. Download My OneApp on https://saf.cx/kWQpy",
      "UEVLA606GQ Confirmed. Ksh140.00 paid to IMPALA STREET EATERIES. on 31/5/26 at 3:03 PM.New M-PESA balance is Ksh0.00. Transaction cost, Ksh0.00. Amount you can transact within the day is 489,210.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA606GQ Confirmed. Fuliza M-PESA amount is Ksh 139.46. Access Fee charged Ksh 1.40. Total Fuliza M-PESA outstanding amount is Ksh140.86 due on 30/06/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UEVLA601MI Confirmed. Ksh50.00 sent to DAVID  KINUTHIA on 31/5/26 at 3:09 PM. New M-PESA balance is Ksh0.00. Transaction cost, Ksh0.00. Amount you can transact within the day is 489,160.00. Download My OneApp on https://saf.cx/kWQpy",
      "UEVLA601MI Confirmed. Fuliza M-PESA amount is Ksh 50.00. Access Fee charged Ksh 0.50. Total Fuliza M-PESA outstanding amount is Ksh191.36 due on 30/06/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UEVLA604TD Confirmed. Fuliza M-PESA amount is Ksh 30.00. Access Fee charged Ksh 0.30. Total Fuliza M-PESA outstanding amount is Ksh221.66 due on 30/06/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UEVLA60MGN Confirmed. Ksh40.00 sent to PETER  NJOROGE KAHORO on 31/5/26 at 5:01 PM. New M-PESA balance is Ksh0.00. Transaction cost, Ksh0.00. Amount you can transact within the day is 489,090.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA60MGN Confirmed. Fuliza M-PESA amount is Ksh 40.00. Access Fee charged Ksh 0.40. Total Fuliza M-PESA outstanding amount is Ksh262.06 due on 30/06/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UEVLA60H7J Confirmed. Ksh50.00 sent to SONIA  OTIENO 0746511297 on 31/5/26 at 5:02 PM. New M-PESA balance is Ksh0.00. Transaction cost, Ksh0.00.  Amount you can transact within the day is 489,040.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA60H7J Confirmed. Fuliza M-PESA amount is Ksh 50.00. Access Fee charged Ksh 0.50. Total Fuliza M-PESA outstanding amount is Ksh312.56 due on 30/06/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UEVLA60NS4 Confirmed. Ksh300.00 sent to BRIAN  BURUDI 0720214254 on 31/5/26 at 5:03 PM. New M-PESA balance is Ksh0.00. Transaction cost, Ksh7.00.  Amount you can transact within the day is 488,740.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA60NS4 Confirmed. Fuliza M-PESA amount is Ksh 307.00. Access Fee charged Ksh 3.07. Total Fuliza M-PESA outstanding amount is Ksh622.63 due on 30/06/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UEVLA61G8X Confirmed. Ksh400.00 sent to Equity Paybill Account for account 0790962744 on 31/5/26 at 8:02 PM New M-PESA balance is Ksh0.00. Transaction cost, Ksh5.00.Amount you can transact within the day is 488,340.00. Download My OneApp on https://saf.cx/kWQpy",
      "UEVLA61G8X Confirmed. Fuliza M-PESA amount is Ksh 405.00. Access Fee charged Ksh 4.05. Total Fuliza M-PESA outstanding amount is Ksh1031.68 due on 30/06/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UEVLA61NCL Confirmed. Ksh 1031.68 from your M-PESA has been used to fully pay your outstanding Fuliza M-PESA. Available Fuliza M-PESA limit is Ksh 1500.00. Your M-PESA balance is 968.32.",
      "UEVLA61NCK Confirmed. You have transfered Ksh2,000.00 from your KCB M-PESA account on 31/5/26 at 8:06 PM. KCB M-PESA Account balance is Ksh7,000.00. New M-PESA balance is Ksh2,000.00.",
      "UEVLA61GK8 Confirmed. Ksh150.00 paid to DANIEL WANYOIKE NGUGI. on 31/5/26 at 8:15 PM.New M-PESA balance is Ksh818.32. Transaction cost, Ksh0.00. Amount you can transact within the day is 488,190.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA61Q0J Confirmed. Ksh280.00 sent to Equity Paybill Account for account 250019 on 31/5/26 at 8:20 PM New M-PESA balance is Ksh533.32. Transaction cost, Ksh5.00.Amount you can transact within the day is 487,910.00. Download My OneApp on https://saf.cx/kWQpy",
      "UEVLA61VAC Confirmed. Ksh200.00 transfered to KCB M-PESA account on 31/5/26 at 9:10 PM. New M-PESA balance is Ksh333.32, new KCB M-PESA Saving account balance is Ksh7,200.00.",
      "UEVLA61PXE Confirmed. Ksh100.00 transfered to KCB M-PESA account on 31/5/26 at 9:16 PM. New M-PESA balance is Ksh233.32, new KCB M-PESA Saving account balance is Ksh7,300.00.",
      "UEVLA620VX confirmed.You bought Ksh5.00 of airtime for 254704612435 on 31/5/26 at 9:36 PM.New  balance is Ksh228.32. Transaction cost, Ksh0.00. Amount you can transact within the day is 487,605.00.You can now access M-PESA via *334#",
      "UF1LA62OX6 Confirmed. Ksh100.00 transfered to KCB M-PESA account on 1/6/26 at 9:15 AM. New M-PESA balance is Ksh28.32, new KCB M-PESA Saving account balance is Ksh7,500.00.",
      "UF1LA62OVV Confirmed. Ksh100.00 transfered to KCB M-PESA account on 1/6/26 at 9:13 AM. New M-PESA balance is Ksh128.32, new KCB M-PESA Saving account balance is Ksh7,400.00.",
      "UF1LA62TF0 Confirmed. You have transfered Ksh100.00 from your KCB M-PESA account on 1/6/26 at 9:42 AM. KCB M-PESA Account balance is Ksh7,400.00. New M-PESA balance is Ksh128.32.",
      "UF1LA62YXP Confirmed. You have transfered Ksh100.00 from your KCB M-PESA account on 1/6/26 at 10:04 AM. KCB M-PESA Account balance is Ksh7,300.00. New M-PESA balance is Ksh228.32.",
      "UF1LA630GR Confirmed. You have transfered Ksh100.00 from your KCB M-PESA account on 1/6/26 at 10:08 AM. KCB M-PESA Account balance is Ksh7,200.00. New M-PESA balance is Ksh328.32.",
      "UF1LA633NI Confirmed. Ksh400.00 paid to SIP AND SAVOR WINERIES. on 1/6/26 at 10:41 AM.New M-PESA balance is Ksh0.00. Transaction cost, Ksh0.00. Amount you can transact within the day is 499,400.00. Download My OneApp on https://saf.cx/lPKcC",
      "UF1LA633NI Confirmed. Fuliza M-PESA amount is Ksh 71.68. Access Fee charged Ksh 0.72. Total Fuliza M-PESA outstanding amount is Ksh72.40 due on 01/07/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UF1LA633QX Confirmed. On 1/6/26 at 10:45 AM Give Ksh300.00 cash to SWISSCOM VENTURES  LTD Joska hse Gusii rd Nakuru New M-PESA balance is Ksh300.00. You can now access M-PESA via *334#",
      "UF1LA632C9 Confirmed. Ksh 72.40 from your M-PESA has been used to fully pay your outstanding Fuliza M-PESA. Available Fuliza M-PESA limit is Ksh 1500.00. Your M-PESA balance is 227.60.",
      "UF1LA63SEV Confirmed. You have transfered Ksh200.00 from your KCB M-PESA account on 1/6/26 at 2:11 PM. KCB M-PESA Account balance is Ksh7,000.00. New M-PESA balance is Ksh427.60."
    ];

    const ingested = [];
    for (const sms of smsList) {
      const p = parse(sms);
      if (!p || p.kind === "fuliza" || p.amount <= 0) continue;
      
      // Check dedup
      if (p.receipt !== "UNKNOWN") {
        const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true })
          .eq("user_id", userId).contains("metadata", { mpesa_receipt: p.receipt });
        if (count && count > 0) continue;
      }

      // Handle transfers
      if (p.txnType === "transfer" && p.savingsCode) {
        const savings = accts.find(a => a.account_code === p.savingsCode);
        if (!savings) continue;
        const fromId = p.kind === "transfer_out" ? mpesa.id : savings.id;
        const toId   = p.kind === "transfer_out" ? savings.id : mpesa.id;
        const { data: txn } = await supabase.from("transactions").insert({
          user_id: userId, account_id: fromId, transfer_account_id: toId, category_id: null,
          txn_type: "transfer", amount: p.amount, currency_code: "KES", occurred_on: p.occurredOn,
          description: p.description,
          metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, counterparty: p.counterparty, balance_after: p.mpesaBal, savings_balance: p.savingsBal, raw_sms: p.raw },
        }).select("id").single();
        if (txn) ingested.push({ receipt: p.receipt, kind: "transfer", amount: p.amount });
      } else {
        // Income / Expense
        const categoryName = guessCategory(p.raw, p.txnType as "income" | "expense");
        let { data: category } = await supabase.from("categories").select("id")
          .eq("user_id", userId).eq("name", categoryName).eq("type", p.txnType).single();
        if (!category) {
          const { data: fb } = await supabase.from("categories").select("id").eq("user_id", userId).eq("type", p.txnType).limit(1).single();
          category = fb;
        }
        if (category) {
          const { data: txn } = await supabase.from("transactions").insert({
            user_id: userId, account_id: mpesa.id, category_id: category.id,
            txn_type: p.txnType, amount: p.amount, currency_code: "KES", occurred_on: p.occurredOn,
            description: p.description,
            metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, counterparty: p.counterparty, balance_after: p.mpesaBal, txn_cost: p.txnCost, needs_review: p.needsReview, raw_sms: p.raw },
          }).select("id").single();
          if (txn) ingested.push({ receipt: p.receipt, kind: p.txnType, amount: p.amount });
        }
      }
    }

    // Set exact requested balances
    await setBalance(supabase, kcb.id, 7000);
    await setBalance(supabase, mpesa.id, 427.60);
    
    // Reset all other accounts opening_balances to 0.00
    const others = accts.filter(a => a.account_code !== "main" && a.account_code !== "kcb_mpesa");
    for (const o of others) {
      await supabase.from("accounts").update({ opening_balance: 0 }).eq("id", o.id);
    }

    return NextResponse.json({ status: "backfill_complete", parsed_and_inserted: ingested.length, details: ingested });
  }

  // ?backfillsbm=1 → delete duplicates and re-ingest all pasted SBM SMS notifications!
  if (request.nextUrl.searchParams.get("backfillsbm") === "1") {
    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    if (!accts || accts.length === 0) return NextResponse.json({ error: "No accounts found" }, { status: 500 });
    
    const sbmAccount = accts.find(a => a.account_code === "bank_c");
    const mpesa = accts.find(a => a.account_code === "main");
    if (!sbmAccount || !mpesa) return NextResponse.json({ error: "SBM Bank or M-Pesa account missing" }, { status: 500 });
    const userId = sbmAccount.user_id;

    // 1. Delete all transactions created by the SBM webhook
    await supabase.from("transactions").delete().eq("user_id", userId).contains("metadata", { source: "sbm_webhook" });

    // 2. Reset SBM Bank account opening_balance to 0
    await supabase.from("accounts").update({ opening_balance: 0 }).eq("id", sbmAccount.id);

    const sbmList = [
      "Dear ROY, online purchase of KES 149.00 has been made on your card 529058******4101 at GOOGLE *Truecaller Spa on 2026-05-15 01:49:30.  For queries, call 0709800000.",
      "Dear ROY : KES 900 Incoming Pesalink , has been credited to account ending 7860001 on 5-11-2026 .For any queries call 0709800000",
      "Dear ROY : KES 3000 Incoming Pesalink , has been credited to account ending 7860001 on 5-8-2026 .For any queries call 0709800000",
      "Dear ROY, online purchase of KES 149.00 has been made on your card 529058******4101 at GOOGLE *Truecaller Spa on 2026-04-15 01:49:30.  For queries, call 0709800000.",
      "Dear ROY, online purchase of KES 289.00 has been made on your card 529058******4101 at GOOGLE *YouTubePremium on 2026-04-10 04:56:46.  For queries, call 0709800000.",
      "Dear ROY : KES 47500 Inward Clg EFT has been deposited to account ending with 7860001 on 4-10-2026 .For any queries call 0709800000",
      "Dear ROY, online purchase of KES 745.00 has been made on your card 529058******4101 at Google ChatGPT on 2026-03-31 21:54:10.  For queries, call 0709800000.",
      "Dear ROY : KES 1850 , has been credited to account ending 7860001 through MPESA Mobile Banking Terminal on 4-1-2026 .For any queries call 0709800000",
      "Dear ROY, online purchase of KES 750.00 has been made on your card 529058******4101 at GOOGLE *Canva AI Photo on 2026-03-31 15:23:14.  For queries, call 0709800000.",
      "Your M-Pesa payment of KES 1850.00 to 0322417860001 was successful on 31/03/26 10:22 PM. M-Pesa Ref: UCVLAB13O1. SBM Bank. For queries contact us on 0709800000",
      "Dear ROY : KES 47500 Inward Clg EFT has been deposited to account ending with 7860001 on 3-6-2026 .For any queries call 0709800000",
      "Dear ROY, Retail transaction of KES 745.00 has been made on your card 529058******4101 at GOOGLE *ChatGPT on 2026-01-29 22:16:08. . For queries call 0709800000",
      "Dear ROY : KES 400 , has been credited to account ending 7860001 through MPESA Mobile Banking Terminal on 2-28-2026 .For any queries call 0709800000",
      "Dear ROY, Retail transaction of KES 375.00 has been made on your card 529058******4101 at Google Canva AI Photo on 2026-02-28 09:41:12. . For queries call 0709800000",
      "Your M-Pesa payment of KES 400.00 to 0322417860001 was successful on 28/02/26 11:40 AM. M-Pesa Ref: UBSLA7T9HY. SBM Bank. For queries contact us on 0709800000",
      "Dear ROY, Retail transaction of KES 745.00 has been made on your card 529058******4101 at GOOGLE *ChatGPT on 2026-02-28 02:26:01. . For queries call 0709800000",
      "Dear ROY : KES 800 , has been credited to account ending 7860001 through MPESA Mobile Banking Terminal on 2-28-2026 .For any queries call 0709800000",
      "Your M-Pesa payment of KES 800.00 to 0322417860001 was successful on 28/02/26 10:17 AM. M-Pesa Ref: UBSLA7SZ0V. SBM Bank. For queries contact us on 0709800000"
    ];

    const ingested = [];
    for (const sms of sbmList) {
      const sbm = parseSbmSMS(sms);
      if (!sbm) continue;

      // Dedup by receipt
      if (sbm.receipt !== "UNKNOWN") {
        const { data: existing } = await supabase.from("transactions").select("id, txn_type")
          .eq("user_id", userId)
          .or(`metadata->>sbm_receipt.eq.${sbm.receipt},metadata->>mpesa_receipt.eq.${sbm.receipt}`);

        if (existing && existing.length > 0) {
          const incorrectExpense = existing.find(t => t.txn_type === "expense" && sbm.kind === "transfer");
          if (incorrectExpense) {
            await supabase.from("transactions").delete().eq("id", incorrectExpense.id);
          } else {
            continue;
          }
        }
      }

      if (sbm.kind === "transfer") {
        const { data: txn } = await supabase.from("transactions").insert({
          user_id: userId, account_id: mpesa.id, transfer_account_id: sbmAccount.id, category_id: null,
          txn_type: "transfer", amount: sbm.amount, currency_code: "KES", occurred_on: sbm.occurredOn,
          description: sbm.description,
          metadata: { source: "sbm_webhook", sbm_receipt: sbm.receipt, counterparty: sbm.counterparty, raw_sms: sms },
        }).select("id").single();
        if (txn) ingested.push({ receipt: sbm.receipt, kind: "transfer", amount: sbm.amount });
      } else {
        const categoryName = guessCategory(sms, sbm.kind);
        let { data: category } = await supabase.from("categories").select("id")
          .eq("user_id", userId).eq("name", categoryName).eq("type", sbm.kind).single();
        if (!category) {
          const { data: fb } = await supabase.from("categories").select("id").eq("user_id", userId).eq("type", sbm.kind).limit(1).single();
          category = fb;
        }
        if (category) {
          const { data: txn } = await supabase.from("transactions").insert({
            user_id: userId, account_id: sbmAccount.id, category_id: category.id,
            txn_type: sbm.kind, amount: sbm.amount, currency_code: "KES", occurred_on: sbm.occurredOn,
            description: sbm.description,
            metadata: { source: "sbm_webhook", sbm_receipt: sbm.receipt, counterparty: sbm.counterparty, raw_sms: sms },
          }).select("id").single();
          if (txn) ingested.push({ receipt: sbm.receipt, kind: sbm.kind, amount: sbm.amount });
        }
      }
    }

    // Set exact final calibrated balances to protect internal transfer wealth preservation
    await setBalance(supabase, mpesa.id, 122.32);
    const kcbAccount = accts.find(a => a.account_code === "kcb_mpesa");
    if (kcbAccount) await setBalance(supabase, kcbAccount.id, 30001.00);
    const mshwariAccount = accts.find(a => a.account_code === "mshwari");
    if (mshwariAccount) await setBalance(supabase, mshwariAccount.id, 3000.27);
    await setBalance(supabase, sbmAccount.id, 13.46);

    return NextResponse.json({ status: "sbm_backfill_complete", parsed_and_inserted: ingested.length, details: ingested });
  }

  // ?recent=1 → list the latest transactions with full metadata
  if (request.nextUrl.searchParams.get("recent") === "1") {
    const { data: recent } = await supabase
      .from("transactions")
      .select("created_at, txn_type, amount, description, occurred_on, metadata")
      .order("created_at", { ascending: false })
      .limit(10);
    return NextResponse.json({ count, recent });
  }

  // ?testfilter=1 → compare different JSONB metadata filter methods
  if (request.nextUrl.searchParams.get("testfilter") === "1") {
    const q1 = await supabase.from("transactions").select("id", { count: "exact", head: true })
      .not("metadata->>is_transfer_counter", "eq", "true");
    const q2 = await supabase.from("transactions").select("id", { count: "exact", head: true })
      .or("metadata->>is_transfer_counter.is.null,metadata->>is_transfer_counter.neq.true");
    const q3 = await supabase.from("transactions").select("id", { count: "exact", head: true });

    return NextResponse.json({
      not_filter_count: q1.count,
      or_filter_count: q2.count,
      no_filter_count: q3.count,
      errors: { q1: q1.error, q2: q2.error, q3: q3.error }
    });
  }
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
