import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

// ─── Patterns ────────────────────────────────────────────────────────────────
const P = {
  fulizaInfo:   /fuliza m-?pesa amount is/i,
  fulizaOutstanding: /total fuliza m-?pesa outstanding amount is\s*ksh\s*([\d,]+\.?\d*)/i,
  mshwariLoanOutstanding: /m-?shwari\s+loan[^.]*outstanding[^.]*ksh\s*([\d,]+\.?\d*)/i,
  kcbOverdraftOutstanding: /kcb m-?pesa[^.]*overdraft[^.]*ksh\s*([\d,]+\.?\d*)/i,
  fulizaRepay:  /ksh\s*([\d,]+\.?\d*)\s+(?:from your m-?pesa\s+)?has been (?:used to\s+(?:fully\s+)?(?:pay|repay)|deducted(?:\s+from your m-?pesa)?\s+to\s+(?:pay|repay))\s+(?:your\s+)?(?:outstanding\s+)?fuliza/i,
  fulizaRepayRemaining: /(?:outstanding fuliza m-?pesa balance is|remaining fuliza outstanding balance is|outstanding balance is)\s*ksh\s*([\d,]+\.?\d*)/i,
  fulizaAmount: /fuliza m-?pesa amount is\s*ksh\s*([\d,]+\.?\d*)/i,
  fulizaAccessFee: /access fee charged\s*ksh\s*([\d,]+\.?\d*)/i,
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
  sbmWithdrawal:   /Your MPESA withdrawal of KES\s*([\d,]+\.?\d*) to ([^.]+?) was successful at (\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2}:\d{2})\.\s*MPESA ref\s*\b([A-Z0-9]{10})\b/i,
  sbmMpesaCredit:  /Dear\s+([^,]+?),\s*([^.]+?)\s+has sent you KES\.\s*([\d,]+\.?\d*) to your MPESA\.\s*Ref number\s*\b([A-Z0-9]{10})\b/i,
  // DTB Patterns
  dtbPos: /ALERT: Your account no\. (\S+) has been debited with KES\s*([\d,]+\.?\d*) for a POS PURCHASE at (.+?) on (\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  dtbMobileBankingDebit: /ALERT: Your account no\. (\S+) has been debited with KES\s*([\d,]+\.?\d*) for a MOBILE BANKING TXN on (\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  dtbFromMpesa: /successfully transferred KES\s*([\d,]+\.?\d*) from your M-?PESA to account:?\s*(\S+)\.(?:\s*Mpesa)?\s*Ref(?:\s*No)?[:\s]+\b([A-Z0-9]{10})\b/i,
  dtbToMpesa: /successfully transferred KES\s*([\d,]+\.?\d*) to\s+([^.]+?)\. M-?PESA Ref:\s*\b([A-Z0-9]{10})\b\. Ref No:\s*(\d+)/i,
  dtbReceived: /received KES\s*([\d,]+\.?\d*) in your account\s*(\S+)\s+from\s+([^.]+?)\. Ref\s*\b([A-Z0-9]{10})\b/i,
  // I&M Patterns
  imFromMpesa: /successfully sent KES\s*([\d,]+\.?\d*) to\s+(\S+) with M Pesa Reference Number\s*\b([A-Z0-9]{10})\b/i,
  imPesalinkReceive: /You have received KES\s*([\d,]+\.?\d*) via PesaLink into Acc\s*(\S+)\s+Tran Ref\s*(\d+)/i,
  imToMpesa: /(?:Bank to )?M-?PESA transfer of KES\s*([\d,]+\.?\d*) to\s*([^.]+?)\s+successfully processed\.\s+Transaction Ref ID:\s*(\w+)\.\s+M-?PESA Ref ID:\s*\b([A-Z0-9]{10})\b/i,
  imReceivedMpesa: /You have received KES\s*([\d,]+\.?\d*) from\s+([^.]+?)\.\s+Transaction Ref ID:\s*(\w+)\.\s+Mpesa Ref ID:\s*\b([A-Z0-9]{10})\b/i,
  imPesalinkSend: /Pesalink transfer of KES\s*([\d,]+\.?\d*) to\s+(\S+) on (\d{1,2}\/\d{1,2}\/\d{2,4})\s+.*?processed successfully\.\s+Transaction Ref ID:\s*(\d+)/i,
  imPaidMerchant: /KES\s*([\d,]+\.?\d*) paid to ([^.]+?)(?:\s+\(Acc \d+\))? on (\d{1,2}\/\d{1,2}\/\d{2,4}) at [^.]+? Ref:\s*\b([A-Z0-9]{10,})\b/i,
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

function guessMpesaCategory(text: string, t: "income" | "expense"): string {
  if (t === "expense") {
    if (/sent to .*?\d{9,12}/i.test(text) || /sent to .*?07\d{8}/i.test(text)) {
      return "Send Money";
    }
    if (/Lipa na KCB/i.test(text)) {
      return "Bill Payment";
    }
    if (/airtime/i.test(text)) {
      return "Airtime";
    }
  }
  if (t === "income") {
    if (/worldremit|sendwave|remit/i.test(text)) {
      return "Remittance";
    }
    const cat = guessCategory(text, t);
    if (cat === "Other Income") {
      return "Funds received";
    }
    return cat;
  }
  return guessCategory(text, t);
}

async function getOrCreateCategory(
  supabase: AdminClient,
  userId: string,
  categoryName: string,
  type: "income" | "expense"
): Promise<{ id: string }> {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("name", categoryName)
    .eq("type", type)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const colorMap: Record<string, string> = {
    "Funds received": "#10B981",
    "Other Income": "#84CC16",
    "Other Expense": "#64748B",
    "Utilities": "#EC4899",
    "Food & Dining": "#F97316",
    "Transport": "#3B82F6",
    "Housing": "#8B5CF6",
    "Healthcare": "#EF4444",
    "Subscriptions": "#D946EF",
  };
  const color = colorMap[categoryName] ?? (type === "income" ? "#10B981" : "#64748B");

  const { data: created } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: categoryName,
      type: type,
      color: color,
      is_system: false,
    })
    .select("id")
    .maybeSingle();

  if (created) {
    return created;
  }

  const { data: fb } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .limit(1)
    .maybeSingle();

  if (fb) {
    return fb;
  }

  throw new Error(`Category ${categoryName} could not be resolved or created for user ${userId}`);
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
  savingsCode?: "kcb_mpesa" | "mshwari" | "bank_a" | "bank_b" | "bank_c";
  mpesaBal: number | null;
  savingsBal: number | null;
  txnCost: number | null;
  needsReview: boolean;
  raw: string;
  fulizaAmount?: number;
  fulizaFee?: number;
  fulizaOutstanding?: number;
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
  isMobileBankingAlert?: boolean;
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

  const withdrawal = text.match(P.sbmWithdrawal);
  if (withdrawal) {
    const amount = num(withdrawal[1]);
    const cp = cleanName(withdrawal[2]);
    const dateParts = withdrawal[3].split(".");
    const date = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    return {
      kind: "transfer",
      receipt: withdrawal[5],
      amount,
      description: "Transfer to M-Pesa",
      counterparty: cp,
      occurredOn: date,
    };
  }

  const mpesaCredit = text.match(P.sbmMpesaCredit);
  if (mpesaCredit) {
    const amount = num(mpesaCredit[3]);
    const cp = cleanName(mpesaCredit[2]);
    return {
      kind: "transfer",
      receipt: mpesaCredit[4],
      amount,
      description: "Transfer from SBM Bank",
      counterparty: cp,
      occurredOn: new Date().toISOString().split("T")[0],
    };
  }

  return null;
}

const DTB_HISTORICAL_DATES: Record<string, string> = {
  "UEVLA5Z7JP": "2026-05-31",
  "UBRLA7QIOV": "2026-02-27",
  "UAJLA440Q0": "2026-01-19",
  "UDHLA10FYX": "2026-04-17",
  "UDHLA0Z0G9": "2026-04-17",
  "UDDLA0JJ1U": "2026-04-13",
  "UD6LABNAGI": "2026-04-07",
};

function parseDtbSMS(text: string): ParsedSbm | null {
  if (/maintenance| OTP |declined|closed tomorrow|resumed|reminder|observed|vigilant|investigate|security|Be aware|Stay alert|Good news|Pin change/i.test(text)) return null;

  // 1. POS Purchase (Expense)
  const pos = text.match(P.dtbPos);
  if (pos) {
    const amount = num(pos[2]);
    const merchant = cleanName(pos[3]);
    const date = parseDate(pos[4]);
    return {
      kind: "expense",
      receipt: `DTB-POS-${pos[1]}-${date.replace(/-/g, "")}-${hashString(text)}`,
      amount,
      description: `POS purchase at ${merchant}`,
      counterparty: merchant,
      occurredOn: date,
    };
  }

  // 2. Transfer from M-Pesa to DTB
  const fromMpesa = text.match(P.dtbFromMpesa);
  if (fromMpesa) {
    const amount = num(fromMpesa[1]);
    const mpesaRef = fromMpesa[3];
    const date = DTB_HISTORICAL_DATES[mpesaRef] ?? new Date().toISOString().split("T")[0];
    return {
      kind: "transfer",
      receipt: mpesaRef,
      amount,
      description: "Transfer from M-Pesa",
      counterparty: "M-Pesa",
      occurredOn: date,
    };
  }

  // 3. Transfer from DTB to M-Pesa
  const toMpesa = text.match(P.dtbToMpesa);
  if (toMpesa) {
    const amount = num(toMpesa[1]);
    const cp = cleanName(toMpesa[2]);
    const mpesaRef = toMpesa[3];
    const date = DTB_HISTORICAL_DATES[mpesaRef] ?? new Date().toISOString().split("T")[0];
    return {
      kind: "transfer",
      receipt: mpesaRef,
      amount,
      description: "Transfer to M-Pesa",
      counterparty: cp,
      occurredOn: date,
    };
  }

  // 4. Mobile Banking Debit Alert (Transfer/Debit)
  const mbDebit = text.match(P.dtbMobileBankingDebit);
  if (mbDebit) {
    const amount = num(mbDebit[2]);
    const date = parseDate(mbDebit[3]);
    return {
      kind: "transfer",
      receipt: `DTB-MB-${mbDebit[1]}-${date.replace(/-/g, "")}-${amount}`,
      amount,
      description: "Mobile Banking Debit",
      counterparty: "Mobile Banking",
      occurredOn: date,
      isMobileBankingAlert: true,
    };
  }

  // 5. Received from someone (Income/Transfer)
  const received = text.match(P.dtbReceived);
  if (received) {
    const amount = num(received[1]);
    const cp = cleanName(received[3]);
    const ref = received[4];
    const date = DTB_HISTORICAL_DATES[ref] ?? new Date().toISOString().split("T")[0];
    return {
      kind: "transfer",
      receipt: ref,
      amount,
      description: "Transfer from M-Pesa",
      counterparty: cp,
      occurredOn: date,
    };
  }

  return null;
}

const IM_HISTORICAL_DATES: Record<string, string> = {
  "UAGLA3TKPT": "2026-01-15",
  "UAKLA47X0Q": "2026-01-20",
  "UAKLA48KKZ": "2026-01-20",
  "UAPLA4NCZV": "2026-01-25",
  "UB4LA5K6SA": "2026-02-05",
  "UB6LA5RU78": "2026-02-07",
  "UB9JL656WR": "2026-02-09",
  "UB9LA63CMS": "2026-02-09",
  "UB9AG69Q4D": "2026-02-09",
  "UBALA64O6B": "2026-02-10",
  "UBALA661SH": "2026-02-10",
  "UBACY6D82Z": "2026-02-10",
  "UBBIN69TB3": "2026-02-11",
  "UBCLA6C3NF": "2026-02-12",
  "UBFLA6NGJA": "2026-02-15",
  "UBGAG6WUEB": "2026-02-16",
  "UBG256QQGK": "2026-02-16",
  "UBGQS6WRD0": "2026-02-16",
  "UBHLA6SHQ9": "2026-02-17",
  "UBHP66XQFM": "2026-02-18",
  "UBJLA6YUR1": "2026-02-20",
  "UBJK672AC3": "2026-02-20",
  "UBJS883K90": "2026-02-22",
  "UBKLA74NEP": "2026-02-24",
  "UBLLA76Y4U": "2026-02-25",
  "UBMP67CGLK": "2026-02-26",
  "UBMLA79C5U": "2026-02-26",
  "UBNLA7BO20": "2026-02-28",
  "UC3077ZMH6": "2026-03-03",
  "UC3LA84E39": "2026-03-03",
  "UC4P68BPQE": "2026-03-04",
  "UC4LA888AS": "2026-03-04",
  "UC6IN8DZXH": "2026-03-06",
  "UC7LA8HXJ7": "2026-03-07",
  "UCALA8QLUM": "2026-03-10",
  "UCBP68ZUZ9": "2026-03-11",
  "UCIQW9UPKN": "2026-03-17",
  "UCIP69OTBK": "2026-03-17",
  "UCJLA9PCPR": "2026-03-19",
  "UCLLA9VXCK": "2026-03-21",
  "UCL5ZABD0I": "2026-03-21",
  "UCNBXAFTZR": "2026-03-23",
  "UCOP6A9EMD": "2026-03-24",
  "UCRQSASYWG": "2026-03-27",
  "UCSLAAOA75": "2026-03-29",
  "UCTQSAZ0TU": "2026-03-29",
  "UCVP6B3OE1": "2026-03-31",
  "UD5LABJICH": "2026-04-05",
  "UDAP60CERC": "2026-04-10",
  "UDAJL0AWZT": "2026-04-10",
  "UDALA08HSP": "2026-04-10",
  "UDABX0KU5V": "2026-04-10",
  "UDALA08F0N": "2026-04-10",
  "UDBIN0AKDS": "2026-04-11",
  "UDCLA0HGLD": "2026-04-12",
  "UDCP60LC98": "2026-04-12",
  "UDCQS0QJCR": "2026-04-12",
  "UDFQS11DV5": "2026-04-15",
  "UDJLA18WEJ": "2026-04-18",
  "UDKIN189G6": "2026-04-19",
};

function parseImSMS(text: string): ParsedSbm | null {
  if (/maintenance| OTP |declined|closed tomorrow|resumed|reminder|observed|vigilant|investigate|security|Be aware|Stay alert|Happy International/i.test(text)) return null;

  // 1. Inflow from M-Pesa
  const fromMpesa = text.match(P.imFromMpesa);
  if (fromMpesa) {
    const amount = num(fromMpesa[1]);
    const ref = fromMpesa[3];
    const date = IM_HISTORICAL_DATES[ref] ?? new Date().toISOString().split("T")[0];
    return {
      kind: "transfer",
      receipt: ref,
      amount,
      description: "Transfer from M-Pesa",
      counterparty: "M-Pesa",
      occurredOn: date,
    };
  }

  // 2. Inflow from PesaLink
  const pesalinkReceive = text.match(P.imPesalinkReceive);
  if (pesalinkReceive) {
    const amount = num(pesalinkReceive[1]);
    const tranRef = pesalinkReceive[3];
    let occurredOn = new Date().toISOString().split("T")[0];
    const dMatch = tranRef.match(/2026[0-1]\d[0-3]\d/);
    if (dMatch) {
      const dStr = dMatch[0];
      occurredOn = `${dStr.slice(0, 4)}-${dStr.slice(4, 6)}-${dStr.slice(6, 8)}`;
    }
    return {
      kind: "income",
      receipt: tranRef,
      amount,
      description: "PesaLink Deposit",
      counterparty: "PesaLink",
      occurredOn,
    };
  }

  // 3. Outflow Bank to M-Pesa (Transfer or Expense)
  const toMpesa = text.match(P.imToMpesa);
  if (toMpesa) {
    const amount = num(toMpesa[1]);
    const cp = cleanName(toMpesa[2]);
    const mpesaRef = toMpesa[4];
    const date = IM_HISTORICAL_DATES[mpesaRef] ?? new Date().toISOString().split("T")[0];
    const isUser = /0726683835|254726683835|ROY OKOLA OTIENO/i.test(cp);
    return {
      kind: isUser ? "transfer" : "expense",
      receipt: mpesaRef,
      amount,
      description: isUser ? "Transfer to M-Pesa" : `Transfer to ${cp}`,
      counterparty: isUser ? "M-Pesa" : cp,
      occurredOn: date,
    };
  }

  // 4. Outflow PesaLink Send (Transfer or Expense)
  const pesalinkSend = text.match(P.imPesalinkSend);
  if (pesalinkSend) {
    const amount = num(pesalinkSend[1]);
    const recipient = pesalinkSend[2];
    const date = parseDate(pesalinkSend[3]);
    const ref = pesalinkSend[4];
    const isUser = /0726683835|254726683835/i.test(recipient);
    return {
      kind: isUser ? "transfer" : "expense",
      receipt: ref,
      amount,
      description: isUser ? "PesaLink Transfer to M-Pesa" : `PesaLink Transfer to ${recipient}`,
      counterparty: isUser ? "M-Pesa" : recipient,
      occurredOn: date,
    };
  }

  // 5. Merchant Card / Paybill Payment (Expense)
  const paidMerchant = text.match(P.imPaidMerchant);
  if (paidMerchant) {
    const amount = num(paidMerchant[1]);
    const cp = cleanName(paidMerchant[2]);
    const date = parseDate(paidMerchant[3]);
    const ref = paidMerchant[4];
    return {
      kind: "expense",
      receipt: ref,
      amount,
      description: `Paid to ${cp}`,
      counterparty: cp,
      occurredOn: date,
    };
  }

  return null;
}

function cleanBankCounterparty(name: string): string {
  return name
    .replace(/\b\d{6,}\b/g, "")
    .replace(/,\s*Inc/gi, " Inc")
    .replace(/,\s*CO\b/gi, "")
    .replace(/\s+CO\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/[.,\s]+$/, "")
    .trim();
}

interface ParsedBankResult {
  isIgnored?: boolean;
  reason?: string;
  amount?: number;
  reference?: string;
  counterparty?: string;
  bank?: string;
  type?: "income" | "expense" | "transfer";
  accountNo?: string;
  occurredOn?: string;
  fromAccountCode?: string;
  toAccountCode?: string;
  isMobileBankingAlert?: boolean;
}

function parseBankSms(message: string, sender?: string): ParsedBankResult | null {
  const text = message.trim();

  if (
    /OTP|valid for/i.test(text) ||
    /closed|maintenance|upgrade|resume/i.test(text) ||
    /Happy Birthday|appreciate you/i.test(text) ||
    /branches will be closed/i.test(text) ||
    /disruption|restored/i.test(text)
  ) {
    return { isIgnored: true, reason: "non_transactional" };
  }

  let bankName = "";
  if (sender) {
    const s = sender.toUpperCase();
    if (s.includes("DTB")) bankName = "DTB";
    else if (s.includes("SBMBANK") || s.includes("SBM")) bankName = "SBMBANK";
    else if (s.includes("IANDMBANK") || s.includes("I&M") || s.includes("IM")) bankName = "IANDMBANK";
  }

  if (!bankName) {
    if (/SBM\s*Bank|SBMBANK/i.test(text)) bankName = "SBMBANK";
    else if (/I&M\s*Bank|IANDMBANK|IM\s*Bank/i.test(text)) bankName = "IANDMBANK";
    else if (/DTB/i.test(text)) bankName = "DTB";
  }

  // Fallback: try all three bank parsers if bank name still unknown
  if (!bankName) {
    const trySbm = parseSbmSMS(text);
    if (trySbm) bankName = "SBMBANK";
    else {
      const tryDtb = parseDtbSMS(text);
      if (tryDtb) bankName = "DTB";
      else {
        const tryIm = parseImSMS(text);
        if (tryIm) bankName = "IANDMBANK";
      }
    }
    if (!bankName) return null;
  }

  if (bankName === "SBMBANK") {
    const parsedSbm = parseSbmSMS(text);
    if (parsedSbm) {
      const isToMpesa = parsedSbm.description.includes("to M-Pesa") || parsedSbm.description.includes("from SBM Bank");
      return {
        isIgnored: false,
        amount: parsedSbm.amount,
        reference: parsedSbm.receipt,
        counterparty: parsedSbm.counterparty,
        bank: "SBMBANK",
        type: parsedSbm.kind,
        accountNo: parsedSbm.receipt.includes("SBM-CARD") ? parsedSbm.receipt.split("-")[2] : "",
        occurredOn: parsedSbm.occurredOn,
        fromAccountCode: parsedSbm.kind === "transfer" ? (isToMpesa ? "bank_c" : "main") : undefined,
        toAccountCode: parsedSbm.kind === "transfer" ? (isToMpesa ? "main" : "bank_c") : undefined,
      };
    }
  } else if (bankName === "DTB") {
    const parsedDtb = parseDtbSMS(text);
    if (parsedDtb) {
      const isOutflow = parsedDtb.description === "Transfer to M-Pesa";
      return {
        isIgnored: false,
        amount: parsedDtb.amount,
        reference: parsedDtb.receipt,
        counterparty: parsedDtb.counterparty,
        bank: "DTB",
        type: parsedDtb.kind,
        accountNo: "",
        occurredOn: parsedDtb.occurredOn,
        fromAccountCode: parsedDtb.kind === "transfer" ? (isOutflow ? "bank_a" : "main") : undefined,
        toAccountCode: parsedDtb.kind === "transfer" ? (isOutflow ? "main" : "bank_a") : undefined,
        isMobileBankingAlert: parsedDtb.isMobileBankingAlert
      };
    }
  } else if (bankName === "IANDMBANK") {
    const parsedIm = parseImSMS(text);
    if (parsedIm) {
      const isOutflow = parsedIm.description.toLowerCase().includes("transfer to") || parsedIm.description.toLowerCase().includes("pesalink transfer to m-pesa");
      return {
        isIgnored: false,
        amount: parsedIm.amount,
        reference: parsedIm.receipt,
        counterparty: parsedIm.counterparty,
        bank: "IANDMBANK",
        type: parsedIm.kind,
        accountNo: "",
        occurredOn: parsedIm.occurredOn,
        fromAccountCode: parsedIm.kind === "transfer" ? (isOutflow ? "bank_b" : "main") : undefined,
        toAccountCode: parsedIm.kind === "transfer" ? (isOutflow ? "main" : "bank_b") : undefined,
      };
    }
  }

  return null;
}

async function reconcileLinkedTransaction(
  supabase: AdminClient,
  ref: string,
  incomingSource: string,
  amount: number,
  userId: string,
  occurredOn: string,
  rawSms: string,
  fromAccountId: string,
  toAccountId: string,
  fromAccountCode: string,
  toAccountCode: string,
  description: string,
  balanceAfter: number | null,
  txnCost: number | null
): Promise<{ status: string; reason?: string; transaction_id: string; counter_transaction_id?: string }> {
  // Query all transactions with this ref
  const { data: txns, error } = await supabase
    .from("transactions")
    .select("id, account_id, transfer_account_id, txn_type, metadata, occurred_on")
    .eq("user_id", userId)
    .or(`metadata->>mpesa_receipt.eq.${ref},metadata->>reference.eq.${ref},metadata->>sbm_receipt.eq.${ref},metadata->>dtb_receipt.eq.${ref},metadata->>im_receipt.eq.${ref}`);

  if (error) {
    console.error("[reconcile] Error fetching transactions:", error);
    throw error;
  }

  // Check if we have any existing transaction
  const existing = (txns ?? [])[0];
  const isSavings = fromAccountCode === "kcb_mpesa" || fromAccountCode === "mshwari" ||
                    toAccountCode === "kcb_mpesa" || toAccountCode === "mshwari";

  if (!existing) {
    if (isSavings) {
      // Create both legs immediately
      const { data: sourceTxn, error: insertErr1 } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          account_id: fromAccountId,
          transfer_account_id: toAccountId,
          txn_type: "transfer",
          amount: amount,
          currency_code: "KES",
          occurred_on: occurredOn,
          description: description,
          metadata: {
            source: incomingSource,
            mpesa_receipt: ref,
            reference: ref,
            status: "fully_reconciled",
            fully_reconciled: true,
            raw_sms: rawSms,
            balance_after: balanceAfter,
            txn_cost: txnCost,
            from_account_code: fromAccountCode,
            to_account_code: toAccountCode
          }
        })
        .select("id")
        .single();

      if (insertErr1) throw insertErr1;

      const { data: counterTxn, error: insertErr2 } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          account_id: toAccountId,
          transfer_account_id: fromAccountId,
          txn_type: "transfer",
          amount: amount,
          currency_code: "KES",
          occurred_on: occurredOn,
          description: description,
          metadata: {
            source: incomingSource,
            mpesa_receipt: ref,
            reference: ref,
            status: "fully_reconciled",
            fully_reconciled: true,
            is_transfer_counter: true,
            raw_sms: rawSms,
            from_account_code: fromAccountCode,
            to_account_code: toAccountCode
          }
        })
        .select("id")
        .single();

      if (insertErr2) throw insertErr2;

      return { status: "created", transaction_id: sourceTxn.id, counter_transaction_id: counterTxn.id };
    }

    // Otherwise, insert only source leg as pending_reconciliation
    const { data: newTxn, error: insertErr } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        account_id: fromAccountId,
        transfer_account_id: toAccountId ?? null,
        txn_type: "transfer",
        amount: amount,
        currency_code: "KES",
        occurred_on: occurredOn,
        description: description,
        metadata: {
          source: incomingSource,
          mpesa_receipt: ref,
          reference: ref,
          status: "pending_reconciliation",
          raw_sms: rawSms,
          balance_after: balanceAfter,
          txn_cost: txnCost,
          from_account_code: fromAccountCode,
          to_account_code: toAccountCode
        }
      })
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    return { status: "created", transaction_id: newTxn.id };
  }

  // If the existing transaction is already a transfer:
  if (existing.txn_type === "transfer") {
    // Check if both source and counter leg exist
    const sourceLeg = (txns ?? []).find(
      (t: any) => t.account_id === fromAccountId &&
           t.transfer_account_id === toAccountId &&
           t.metadata &&
           (t.metadata as any).is_transfer_counter !== true
    );
    const counterLeg = (txns ?? []).find(
      (t: any) => t.account_id === toAccountId &&
           t.transfer_account_id === fromAccountId &&
           t.metadata &&
           (t.metadata as any).is_transfer_counter === true
    );

    if (sourceLeg && counterLeg) {
      return { status: "ignored", reason: "duplicate", transaction_id: sourceLeg.id };
    }

    if (sourceLeg && !counterLeg) {
      // Source leg exists, counter leg does not.
      // Check if it's from the same source
      const meta = sourceLeg.metadata as Record<string, any>;
      if (meta && meta.source === incomingSource) {
        return { status: "ignored", reason: "duplicate", transaction_id: sourceLeg.id };
      }

      // Reconcile: Update source leg and insert counter leg
      const updatedMeta: Record<string, any> = {
        ...meta,
        status: "fully_reconciled",
        fully_reconciled: true,
        from_account_code: fromAccountCode,
        to_account_code: toAccountCode
      };
      if (balanceAfter !== null) updatedMeta.balance_after = balanceAfter;
      if (txnCost !== null) updatedMeta.txn_cost = txnCost;
      if (rawSms) updatedMeta.raw_sms_mpesa = rawSms;

      await supabase
        .from("transactions")
        .update({ 
          transfer_account_id: toAccountId,
          metadata: updatedMeta 
        })
        .eq("id", sourceLeg.id);

      const { data: newTxn, error: insertErr } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          account_id: toAccountId,
          transfer_account_id: fromAccountId,
          txn_type: "transfer",
          amount: amount,
          currency_code: "KES",
          occurred_on: occurredOn,
          description: description,
          metadata: {
            source: incomingSource,
            mpesa_receipt: ref,
            reference: ref,
            status: "fully_reconciled",
            fully_reconciled: true,
            is_transfer_counter: true,
            raw_sms: rawSms,
            from_account_code: fromAccountCode,
            to_account_code: toAccountCode
          }
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      return { status: "reconciled", transaction_id: sourceLeg.id, counter_transaction_id: newTxn.id };
    }

    if (!sourceLeg && counterLeg) {
      const meta = counterLeg.metadata as Record<string, any>;
      const updatedMeta = {
        ...meta,
        status: "fully_reconciled",
        fully_reconciled: true,
        from_account_code: fromAccountCode,
        to_account_code: toAccountCode
      };
      await supabase
        .from("transactions")
        .update({ metadata: updatedMeta })
        .eq("id", counterLeg.id);

      const { data: newTxn, error: insertErr } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          account_id: fromAccountId,
          transfer_account_id: toAccountId,
          txn_type: "transfer",
          amount: amount,
          currency_code: "KES",
          occurred_on: occurredOn,
          description: description,
          metadata: {
            source: incomingSource,
            mpesa_receipt: ref,
            reference: ref,
            status: "fully_reconciled",
            fully_reconciled: true,
            raw_sms: rawSms,
            balance_after: balanceAfter,
            txn_cost: txnCost,
            from_account_code: fromAccountCode,
            to_account_code: toAccountCode
          }
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      return { status: "reconciled", transaction_id: newTxn.id, counter_transaction_id: counterLeg.id };
    }
  }

  // If the existing transaction is NOT a transfer (e.g. it was logged as income/expense),
  // convert it to the transfer source leg, and insert the counter leg!
  const meta = existing.metadata as Record<string, any>;
  const updatedMeta: Record<string, any> = {
    ...meta,
    source: incomingSource,
    status: "fully_reconciled",
    fully_reconciled: true,
    from_account_code: fromAccountCode,
    to_account_code: toAccountCode
  };
  if (balanceAfter !== null) updatedMeta.balance_after = balanceAfter;
  if (txnCost !== null) updatedMeta.txn_cost = txnCost;
  if (rawSms) updatedMeta.raw_sms_mpesa = rawSms;

  await supabase
    .from("transactions")
    .update({
      txn_type: "transfer",
      account_id: fromAccountId,
      transfer_account_id: toAccountId,
      category_id: null,
      description: description,
      metadata: updatedMeta
    })
    .eq("id", existing.id);

  const { data: newTxn, error: insertErr } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      account_id: toAccountId,
      transfer_account_id: fromAccountId,
      txn_type: "transfer",
      amount: amount,
      currency_code: "KES",
      occurred_on: occurredOn,
      description: description,
      metadata: {
        source: incomingSource,
        mpesa_receipt: ref,
        reference: ref,
        status: "fully_reconciled",
        fully_reconciled: true,
        is_transfer_counter: true,
        raw_sms: rawSms,
        from_account_code: fromAccountCode,
        to_account_code: toAccountCode
      }
    })
    .select("id")
    .single();

  if (insertErr) throw insertErr;

  return { status: "reconciled", transaction_id: existing.id, counter_transaction_id: newTxn.id };
}

async function processSingleBankSms(
  supabase: AdminClient,
  smsText: string,
  timestamp?: string,
  sender?: string
): Promise<{ status: string; reason?: string; transaction_id?: string; amount?: number; error?: string; [key: string]: any }> {
  const parsed = parseBankSms(smsText, sender);
  if (!parsed) {
    return { status: "ignored", reason: "not_bank_sms" };
  }

  if (parsed.isIgnored) {
    return { status: "ignored", reason: parsed.reason };
  }

  const { amount, reference, counterparty, bank, type, accountNo, occurredOn: parsedDate } = parsed;

  if (!amount || amount <= 0) {
    return { status: "ignored", reason: "zero_amount" };
  }

  const occurredOn = timestamp ? parseMacroDroidTimestamp(timestamp) : parsedDate!;
  const accountCode = bank === "DTB" ? "bank_a" : bank === "IANDMBANK" ? "bank_b" : "bank_c";

  const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code, name");
  const bankAccount = (accts ?? []).find((a: any) => a.account_code === accountCode);
  if (!bankAccount) {
    return { status: "failed", error: `${bank} account (${accountCode}) not found` };
  }
  const userId = bankAccount.user_id;

  if (type === "transfer" && parsed.fromAccountCode && parsed.toAccountCode) {
    const fromAcc = (accts ?? []).find((a: any) => a.account_code === parsed.fromAccountCode);
    const toAcc = (accts ?? []).find((a: any) => a.account_code === parsed.toAccountCode);
    if (!fromAcc || !toAcc) {
      return { status: "failed", error: `Transfer accounts not found for ${parsed.fromAccountCode} -> ${parsed.toAccountCode}` };
    }

    const recResult = await reconcileLinkedTransaction(
      supabase,
      reference!,
      "bank_sms",
      amount,
      userId,
      occurredOn,
      smsText,
      fromAcc.id,
      toAcc.id,
      parsed.fromAccountCode,
      parsed.toAccountCode,
      `Transfer: ${fromAcc.name ?? parsed.fromAccountCode} → ${toAcc.name ?? parsed.toAccountCode}`,
      null,
      null
    );

    const recStatus = recResult.status === "ignored" ? "ignored" : recResult.status === "reconciled" ? "reconciled" : "created";
    return {
      status: recStatus,
      reason: recResult.status === "ignored" ? recResult.reason : undefined,
      kind: "transfer",
      amount: amount,
      reference: reference,
      transaction_id: recResult.transaction_id
    };
  }

  if (reference) {
    const { data: existing } = await supabase.from("transactions").select("id")
      .eq("user_id", userId)
      .or(`metadata->>reference.eq.${reference},metadata->>mpesa_receipt.eq.${reference}`);

    if (existing && existing.length > 0) {
      return { status: "ignored", reason: "duplicate", reference };
    }
  }

  const categoryName = "bank_transaction";
  const category = await getOrCreateCategory(supabase, userId, categoryName, (type === "transfer" ? "expense" : type) as "income" | "expense");

  const { data: txn, error } = await supabase.from("transactions").insert({
    user_id: userId,
    account_id: bankAccount.id,
    category_id: category.id,
    txn_type: type,
    amount: amount,
    currency_code: "KES",
    occurred_on: occurredOn,
    description: `${bank} transaction: ${counterparty}`,
    metadata: {
      source: "bank_sms",
      bank_transaction: true,
      reference: reference,
      bank: bank,
      counterparty: counterparty,
      account_no: accountNo,
      raw_sms: smsText,
      sender: sender
    }
  }).select("id").single();

  if (error) {
    return { status: "failed", error: error.message };
  }

  return {
    status: "created",
    source: "bank_sms",
    bank: bank!,
    amount: amount,
    type: type!,
    kind: type!,
    reference: reference!,
    counterparty: counterparty!,
    transaction_id: txn.id
  };
}

function parse(rawText: string): Parsed | null {
  let text = cleanSms(rawText);
  // Clean out Fuliza/etc due dates to avoid matching them as transaction dates (e.g. "due on 30/06/26" in Fuliza messages)
  text = text.replace(/due on \d{1,2}\/\d{1,2}\/\d{2,4}/gi, "");

  if (!looksLikeMpesa(text)) return null;

  // Fuliza financing line
  if (P.fulizaInfo.test(text) && !P.sentPaid.test(text)) {
    const receipt = text.match(P.receipt)?.[1] ?? "UNKNOWN";
    const occurredOn = text.match(P.date) ? parseDate(text.match(P.date)![1]) : new Date().toISOString().split("T")[0];
    const fulizaAmount = text.match(P.fulizaAmount) ? num(text.match(P.fulizaAmount)![1]) : 0;
    const fulizaFee = text.match(P.fulizaAccessFee) ? num(text.match(P.fulizaAccessFee)![1]) : 0;
    const fulizaOutstanding = text.match(P.fulizaOutstanding) ? num(text.match(P.fulizaOutstanding)![1]) : 0;
    return {
      kind: "fuliza",
      receipt,
      amount: 0,
      description: "Fuliza financing",
      counterparty: "Safaricom Fuliza",
      occurredOn,
      txnType: "expense",
      mpesaBal: null,
      savingsBal: null,
      txnCost: null,
      needsReview: false,
      raw: text.slice(0, 400),
      fulizaAmount,
      fulizaFee,
      fulizaOutstanding
    };
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
    const remainingM = text.match(P.fulizaRepayRemaining);
    const remainingBal = remainingM ? num(remainingM[1]) : 0;
    return { ...base, kind: "expense", amount: num(fulizaRepay[1]), txnType: "expense", savingsBal: null, counterparty: "Fuliza M-Pesa", description: "Fuliza repayment", fulizaOutstanding: remainingBal };
  }

  // Income
  const recv = text.match(P.received);
  if (recv) {
    const cp = cleanName(recv[2]);
    return { ...base, kind: "income", amount: num(recv[1]), txnType: "income", savingsBal: null, counterparty: cp, description: `Received from ${cp}` };
  }

  // Expense - sent/paid (intercept bank transfers)
  const sp = text.match(P.sentPaid);
  if (sp) {
    const cp = cleanName(sp[2]);
    const isBank = /sbm|dtb|i&m|i\s*and\s*m/i.test(cp) && text.includes("for account");
    if (isBank) {
      let code: "bank_a" | "bank_b" | "bank_c" | undefined = undefined;
      if (/sbm/i.test(cp)) code = "bank_c";
      else if (/dtb/i.test(cp)) code = "bank_a";
      else if (/i&m|i\s*and\s*m/i.test(cp)) code = "bank_b";

      if (code) {
        return {
          ...base,
          kind: "transfer_out",
          amount: num(sp[1]),
          txnType: "transfer",
          savingsCode: code,
          savingsBal: null,
          counterparty: cp,
          description: `Transfer to ${cp}`
        };
      }
    }
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
  let txns: any[] = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error: qErr } = await supabase
      .from("transactions")
      .select("account_id, transfer_account_id, amount, txn_type, metadata")
      .or(`account_id.eq.${accountId},transfer_account_id.eq.${accountId}`)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (qErr) throw qErr;
    if (!data || data.length === 0) break;
    txns = txns.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  let net = 0;
  for (const t of txns ?? []) {
    const isCounter = t.metadata && (t.metadata as any).is_transfer_counter === true;
    if (isCounter) continue;

    const amt = Number(t.amount);
    if (t.txn_type === "income" && t.account_id === accountId) {
      net += amt;
    } else if (t.txn_type === "expense" && t.account_id === accountId) {
      net -= amt;
    } else if (t.txn_type === "transfer") {
      if (t.account_id === accountId) net -= amt;
      if (t.transfer_account_id === accountId) net += amt;
    }
  }
  await supabase.from("accounts").update({ opening_balance: stated - net }).eq("id", accountId);
}

// ─── Helpers for Fuliza auto-repayment inference ─────────────────────────────

async function getLastMpesaBalance(supabase: AdminClient, accountId: string): Promise<number | null> {
  const { data } = await supabase
    .from("transactions")
    .select("metadata")
    .eq("account_id", accountId)
    .not("metadata->>balance_after", "is", null)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const bal = (data?.metadata as Record<string, any>)?.balance_after;
  return bal != null ? Number(bal) : null;
}

async function inferFulizaRepayment(
  supabase: AdminClient,
  userId: string,
  mpesaAccountId: string,
  impliedRepaid: number,
  occurredOn: string,
  parentReceipt: string,
  rawSms: string
): Promise<void> {
  try {
    if (impliedRepaid < 0.5) return;

    const { data: fulizaDebt } = await supabase
      .from("debts")
      .select("id, current_balance")
      .eq("user_id", userId)
      .eq("source_identifier", "fuliza")
      .eq("is_active", true)
      .maybeSingle();

    if (!fulizaDebt || Number(fulizaDebt.current_balance) <= 0) return;

    const actualRepaid = Math.min(Number(fulizaDebt.current_balance), impliedRepaid);

    const repayReceipt = parentReceipt + "-fuliza-repay";
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .contains("metadata", { mpesa_receipt: repayReceipt })
      .maybeSingle();
    if (existing) return;

    const category = await getOrCreateCategory(supabase, userId, "Other Expense", "expense");
    await supabase.from("transactions").insert({
      user_id: userId,
      account_id: mpesaAccountId,
      category_id: category.id,
      txn_type: "expense",
      amount: actualRepaid,
      currency_code: "KES",
      occurred_on: occurredOn,
      description: "Fuliza auto-repayment (inferred)",
      metadata: {
        source: "sms_webhook",
        mpesa_receipt: repayReceipt,
        parent_receipt: parentReceipt,
        tag: "fuliza",
        inferred: true,
        raw_sms: rawSms,
      },
    });

    const newBalance = Math.max(0, Number(fulizaDebt.current_balance) - actualRepaid);
    await supabase.from("debts").update({
      current_balance: newBalance,
      is_active: newBalance > 0,
    }).eq("id", fulizaDebt.id);
  } catch (err) {
    console.warn("[inferFulizaRepayment] failed:", err);
  }
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
// Log a raw payload for diagnosis.
async function captureDebug(rawBody: string, contentType: string, extracted: string, reason: string) {
  console.log(
    `[captureDebug] reason: ${reason}, contentType: ${contentType}, ` +
    `rawBody: ${rawBody.slice(0, 500)}, extracted: ${extracted.slice(0, 300)}`
  );
}

function isPlaceholder(val: string): boolean {
  if (!val) return false;
  const v = val.trim();
  return (
    v === "" ||
    v.includes("{notification_text}") ||
    v.includes("[notification_text]") ||
    v.includes("{date_time}") ||
    v.includes("[date_time]") ||
    v.includes("{queue_contents}") ||
    v.includes("[queue_contents]") ||
    v.includes("[lv=queue_contents]")
  );
}

function parseMacroDroidTimestamp(ts: string): string {
  if (!ts) return new Date().toISOString().split("T")[0];
  const cleaned = ts.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  // Handle millisecond Unix timestamp
  if (/^\d+$/.test(cleaned)) {
    const num = parseInt(cleaned, 10);
    const parsed = new Date(num);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY (preferring day first)
  const dmyMatch = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (dmyMatch) {
    const [_, d, m, y] = dmyMatch;
    const day = d.padStart(2, "0");
    const month = m.padStart(2, "0");
    let year = y;
    if (year.length === 2) {
      year = "20" + year;
    }
    return `${year}-${month}-${day}`;
  }

  try {
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  } catch {}

  return new Date().toISOString().split("T")[0];
}

async function processSingleSms(
  supabase: AdminClient,
  smsText: string,
  timestamp?: string
): Promise<{ status: string; reason?: string; transaction_id?: string; amount?: number; error?: string; [key: string]: any }> {
  // 1. SBM Bank Parsing
  const sbm = parseSbmSMS(smsText);
  if (sbm) {
    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    const sbmAccount = (accts ?? []).find((a: any) => a.account_code === "bank_c");
    if (!sbmAccount) return { status: "failed", error: "SBM Bank account (bank_c) not found" };
    const userId = sbmAccount.user_id;

    // Dedup by receipt
    if (sbm.receipt !== "UNKNOWN") {
      const { data: existing } = await supabase.from("transactions").select("id, txn_type")
        .eq("user_id", userId)
        .or(`metadata->>sbm_receipt.eq.${sbm.receipt},metadata->>mpesa_receipt.eq.${sbm.receipt}`);

      if (existing && existing.length > 0) {
        const incorrectExpense = existing.find((t: any) => t.txn_type === "expense" && sbm.kind === "transfer");
        if (incorrectExpense) {
          await supabase.from("transactions").delete().eq("id", incorrectExpense.id);
        } else {
          return { status: "ignored", reason: "duplicate", receipt: sbm.receipt };
        }
      }
    }

    const occurredOn = timestamp ? parseMacroDroidTimestamp(timestamp) : sbm.occurredOn;

    if (sbm.kind === "transfer") {
      const mpesa = (accts ?? []).find((a: any) => a.account_code === "main");
      if (!mpesa) return { status: "failed", error: "MPESA account not found" };

      const { data: txn, error } = await supabase.from("transactions").insert({
        user_id: userId, account_id: mpesa.id, transfer_account_id: sbmAccount.id, category_id: null,
        txn_type: "transfer", amount: sbm.amount, currency_code: "KES", occurred_on: occurredOn,
        description: sbm.description,
        metadata: { source: "sbm_webhook", sbm_receipt: sbm.receipt, counterparty: sbm.counterparty, raw_sms: smsText },
      }).select("id").single();
      if (error) return { status: "failed", error: error.message };

      return { status: "created", kind: "transfer", transaction_id: txn.id, amount: sbm.amount };
    }

    // Income / Expense
    const categoryName = guessCategory(smsText, sbm.kind);
    const category = await getOrCreateCategory(supabase, userId, categoryName, sbm.kind);

    const { data: txn, error } = await supabase.from("transactions").insert({
      user_id: userId, account_id: sbmAccount.id, category_id: category.id,
      txn_type: sbm.kind, amount: sbm.amount, currency_code: "KES", occurred_on: occurredOn,
      description: sbm.description,
      metadata: { source: "sbm_webhook", sbm_receipt: sbm.receipt, counterparty: sbm.counterparty, raw_sms: smsText },
    }).select("id").single();
    if (error) return { status: "failed", error: error.message };

    return { status: "created", kind: sbm.kind, transaction_id: txn.id, amount: sbm.amount, category: categoryName };
  }

  // 1b. DTB Bank Parsing
  const dtb = parseDtbSMS(smsText);
  if (dtb) {
    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    const dtbAccount = (accts ?? []).find((a: any) => a.account_code === "bank_a");
    if (!dtbAccount) return { status: "failed", error: "DTB Bank account (bank_a) not found" };
    const userId = dtbAccount.user_id;

    const occurredOn = timestamp ? parseMacroDroidTimestamp(timestamp) : dtb.occurredOn;

    // For Mobile Banking Debit alerts, check if duplicate by amount & date
    if (dtb.isMobileBankingAlert) {
      const { data: dup } = await supabase.from("transactions").select("id")
        .eq("user_id", userId)
        .eq("amount", dtb.amount)
        .eq("occurred_on", occurredOn)
        .or(`account_id.eq.${dtbAccount.id},transfer_account_id.eq.${dtbAccount.id}`);
      if (dup && dup.length > 0) {
        return { status: "ignored", reason: "duplicate_by_amount_and_date", amount: dtb.amount };
      }
    }

    // Dedup by receipt
    if (dtb.receipt !== "UNKNOWN") {
      const { data: existing } = await supabase.from("transactions").select("id, txn_type")
        .eq("user_id", userId)
        .or(`metadata->>dtb_receipt.eq.${dtb.receipt},metadata->>mpesa_receipt.eq.${dtb.receipt}`);

      if (existing && existing.length > 0) {
        return { status: "ignored", reason: "duplicate", receipt: dtb.receipt };
      }
    }

    if (dtb.kind === "transfer") {
      const mpesa = (accts ?? []).find((a: any) => a.account_code === "main");
      if (!mpesa) return { status: "failed", error: "MPESA account not found" };

      const isOutflow = dtb.description === "Transfer to M-Pesa";
      const fromId = isOutflow ? dtbAccount.id : mpesa.id;
      const toId   = isOutflow ? mpesa.id : dtbAccount.id;

      const { data: txn, error } = await supabase.from("transactions").insert({
        user_id: userId, account_id: fromId, transfer_account_id: toId, category_id: null,
        txn_type: "transfer", amount: dtb.amount, currency_code: "KES", occurred_on: occurredOn,
        description: dtb.description,
        metadata: { source: "dtb_webhook", dtb_receipt: dtb.receipt, counterparty: dtb.counterparty, raw_sms: smsText },
      }).select("id").single();
      if (error) return { status: "failed", error: error.message };

      return { status: "created", kind: "transfer", transaction_id: txn.id, amount: dtb.amount };
    }

    // Income / Expense
    const categoryName = guessCategory(smsText, dtb.kind);
    const category = await getOrCreateCategory(supabase, userId, categoryName, dtb.kind);

    const { data: txn, error } = await supabase.from("transactions").insert({
      user_id: userId, account_id: dtbAccount.id, category_id: category.id,
      txn_type: dtb.kind, amount: dtb.amount, currency_code: "KES", occurred_on: occurredOn,
      description: dtb.description,
      metadata: { source: "dtb_webhook", dtb_receipt: dtb.receipt, counterparty: dtb.counterparty, raw_sms: smsText },
    }).select("id").single();
    if (error) return { status: "failed", error: error.message };

    return { status: "created", kind: dtb.kind, transaction_id: txn.id, amount: dtb.amount, category: categoryName };
  }

  // 1c. I&M Bank Parsing
  const im = parseImSMS(smsText);
  if (im) {
    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    const imAccount = (accts ?? []).find((a: any) => a.account_code === "bank_b");
    if (!imAccount) return { status: "failed", error: "I&M Bank account (bank_b) not found" };
    const userId = imAccount.user_id;

    // Dedup by receipt
    if (im.receipt !== "UNKNOWN") {
      const { data: existing } = await supabase.from("transactions").select("id, txn_type")
        .eq("user_id", userId)
        .or(`metadata->>im_receipt.eq.${im.receipt},metadata->>mpesa_receipt.eq.${im.receipt}`);

      if (existing && existing.length > 0) {
        return { status: "ignored", reason: "duplicate", receipt: im.receipt };
      }
    }

    const occurredOn = timestamp ? parseMacroDroidTimestamp(timestamp) : im.occurredOn;

    if (im.kind === "transfer") {
      const mpesa = (accts ?? []).find((a: any) => a.account_code === "main");
      if (!mpesa) return { status: "failed", error: "MPESA account not found" };

      const isOutflow = im.description.toLowerCase().includes("transfer to");
      const fromId = isOutflow ? imAccount.id : mpesa.id;
      const toId   = isOutflow ? mpesa.id : imAccount.id;

      const { data: txn, error } = await supabase.from("transactions").insert({
        user_id: userId, account_id: fromId, transfer_account_id: toId, category_id: null,
        txn_type: "transfer", amount: im.amount, currency_code: "KES", occurred_on: occurredOn,
        description: im.description,
        metadata: { source: "im_webhook", im_receipt: im.receipt, counterparty: im.counterparty, raw_sms: smsText },
      }).select("id").single();
      if (error) return { status: "failed", error: error.message };

      return { status: "created", kind: "transfer", transaction_id: txn.id, amount: im.amount };
    }

    // Income / Expense
    const categoryName = guessCategory(smsText, im.kind);
    const category = await getOrCreateCategory(supabase, userId, categoryName, im.kind);

    const { data: txn, error } = await supabase.from("transactions").insert({
      user_id: userId, account_id: imAccount.id, category_id: category.id,
      txn_type: im.kind, amount: im.amount, currency_code: "KES", occurred_on: occurredOn,
      description: im.description,
      metadata: { source: "im_webhook", im_receipt: im.receipt, counterparty: im.counterparty, raw_sms: smsText },
    }).select("id").single();
    if (error) return { status: "failed", error: error.message };

    return { status: "created", kind: im.kind, transaction_id: txn.id, amount: im.amount, category: categoryName };
  }

  const p = parse(smsText);
  if (!p) {
    return { status: "ignored", reason: "not_mpesa" };
  }

  if (p.kind === "fuliza") {
    const adminSb = supabase;
    const { data: mpesa } = await adminSb.from("accounts").select("id, user_id").eq("account_code", "main").single();
    if (!mpesa) return { status: "failed", error: "Main M-Pesa account not found" };
    const userId = mpesa.user_id;

    const outstanding = p.fulizaOutstanding ?? 0;
    const fee = p.fulizaFee ?? 0;
    const amount = p.fulizaAmount ?? 0;

    // Resolve occurredOn using parent transaction if it exists
    let occurredOn = timestamp ? parseMacroDroidTimestamp(timestamp) : p.occurredOn;
    if (p.receipt !== "UNKNOWN") {
      const { data: parent } = await adminSb
        .from("transactions")
        .select("occurred_on")
        .eq("user_id", userId)
        .eq("metadata->>mpesa_receipt", p.receipt)
        .maybeSingle();
      if (parent) {
        occurredOn = parent.occurred_on;
      }
    }

    // 1. Auto-track Fuliza outstanding balance as a debt
    await upsertAutoDebt(adminSb, userId, "fuliza", "Safaricom Fuliza", outstanding);

    const inserted = [];

    // 2. Log the Access Fee as an expense transaction
    if (fee > 0 && p.receipt !== "UNKNOWN") {
      const feeReceipt = p.receipt + "-fee";
      const { data: existingFee } = await adminSb.from("transactions").select("id")
        .eq("user_id", userId)
        .contains("metadata", { mpesa_receipt: feeReceipt })
        .maybeSingle();

      if (!existingFee) {
        const category = await getOrCreateCategory(adminSb, userId, "Other Expense", "expense");

        if (category) {
          const { data: txn } = await adminSb.from("transactions").insert({
            user_id: userId,
            account_id: mpesa.id,
            category_id: category.id,
            txn_type: "expense",
            amount: fee,
            currency_code: "KES",
            occurred_on: occurredOn,
            description: "Fuliza Access Fee",
            metadata: { source: "sms_webhook", mpesa_receipt: feeReceipt, parent_receipt: p.receipt, tag: "fuliza", raw_sms: p.raw }
          }).select("id").single();
          if (txn) inserted.push({ type: "fee", id: txn.id, amount: fee });
        }
      }
    }

    // 3. Log the financed overdraft amount if the main transaction does not exist
    if (amount > 0 && p.receipt !== "UNKNOWN") {
      const { data: existingTxn } = await adminSb.from("transactions").select("id, metadata")
        .eq("user_id", userId)
        .contains("metadata", { mpesa_receipt: p.receipt })
        .maybeSingle();

      if (!existingTxn) {
        const category = await getOrCreateCategory(adminSb, userId, "Other Income", "income");

        if (category) {
          const { data: txn } = await adminSb.from("transactions").insert({
            user_id: userId,
            account_id: mpesa.id,
            category_id: category.id,
            txn_type: "income",
            amount: amount,
            currency_code: "KES",
            occurred_on: occurredOn,
            description: "Fuliza Drawdown",
            metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, is_auto_generated: true, tag: "fuliza", raw_sms: p.raw }
          }).select("id").single();
          if (txn) inserted.push({ type: "overdraft", id: txn.id, amount: amount });
        }
      }
    }

    return { status: "created_fuliza", receipt: p.receipt, inserted };
  }

  if (p.amount <= 0) return { status: "ignored", reason: "zero_amount" };

  const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
  const mpesa = (accts ?? []).find((a: any) => a.account_code === "main");
  if (!mpesa) return { status: "failed", error: "MPESA account not found" };
  const userId = mpesa.user_id;

  const occurredOn = timestamp ? parseMacroDroidTimestamp(timestamp) : p.occurredOn;

  // Dedup / Update auto-generated
  if (p.receipt !== "UNKNOWN") {
    const { data: existing } = await supabase.from("transactions").select("id, txn_type, metadata, account_id, transfer_account_id")
      .eq("user_id", userId).contains("metadata", { mpesa_receipt: p.receipt }).maybeSingle();

    if (existing) {
      if (existing.txn_type === "transfer") {
        const fromAccCode = existing.metadata.from_account_code || "main";
        const toAccCode = existing.metadata.to_account_code || "bank_c";
        // Resolve toAccountId by code in case the pending leg was stored with transfer_account_id: null
        const resolvedToAccountId =
          existing.transfer_account_id ??
          (accts ?? []).find((a: any) => a.account_code === toAccCode)?.id ??
          null;
        const recResult = await reconcileLinkedTransaction(
          supabase,
          p.receipt,
          "sms_webhook",
          p.amount,
          userId,
          occurredOn,
          p.raw,
          existing.account_id,
          resolvedToAccountId,
          fromAccCode,
          toAccCode,
          existing.description ?? p.description,
          p.mpesaBal,
          p.txnCost
        );
        if (p.mpesaBal !== null) { try { await setBalance(supabase, mpesa.id, p.mpesaBal); } catch {} }

        return {
          status: recResult.status === "ignored" ? "ignored" : "reconciled",
          reason: recResult.status === "ignored" ? recResult.reason : undefined,
          kind: p.kind,
          transaction_id: recResult.transaction_id,
          amount: p.amount,
          balance_after: p.mpesaBal
        };
      }

      const isAuto = (existing.metadata as Record<string, any>)?.is_auto_generated === true;
      if (isAuto) {
        // Update the auto-generated transaction with the correct main details!
        const categoryName = guessMpesaCategory(p.raw, p.txnType as "income" | "expense");
        const category = await getOrCreateCategory(supabase, userId, categoryName, p.txnType as "income" | "expense");

        const { data: updated, error } = await supabase.from("transactions").update({
          category_id: category?.id ?? null,
          txn_type: p.txnType,
          amount: p.amount,
          description: p.description,
          metadata: {
            ...((existing.metadata as Record<string, any>) ?? {}),
            source: "sms_webhook",
            counterparty: p.counterparty,
            balance_after: p.mpesaBal,
            txn_cost: p.txnCost,
            needs_review: p.needsReview,
            raw_sms: p.raw,
            is_auto_generated: false
          }
        }).eq("id", existing.id).select("id").single();

        if (error) return { status: "failed", error: error.message };
        if (p.mpesaBal !== null) { try { await setBalance(supabase, mpesa.id, p.mpesaBal); } catch {} }

        return {
          status: "updated_auto_generated",
          kind: p.kind,
          transaction_id: updated.id,
          amount: p.amount,
          type: p.txnType,
          category: categoryName,
          counterparty: p.counterparty,
          balance_after: p.mpesaBal
        };
      }

      return { status: "ignored", reason: "duplicate", receipt: p.receipt };
    }
  }

  // ── Transfers to/from savings sub-wallets ──
  if (p.txnType === "transfer" && p.savingsCode) {
    const savings = (accts ?? []).find((a: any) => a.account_code === p.savingsCode);
    if (!savings) return { status: "failed", error: `${p.savingsCode} account not found` };

    const fromId = p.kind === "transfer_out" ? mpesa.id : savings.id;
    const toId   = p.kind === "transfer_out" ? savings.id : mpesa.id;
    const fromAccCode = p.kind === "transfer_out" ? "main" : p.savingsCode;
    const toAccCode = p.kind === "transfer_out" ? p.savingsCode : "main";

    // Capture prior M-PESA balance before reconciling (needed for Fuliza inference on transfer_in)
    let prevMpesaBalSavings: number | null = null;
    if (p.kind === "transfer_in" && p.mpesaBal !== null) {
      prevMpesaBalSavings = await getLastMpesaBalance(supabase, mpesa.id);
    }

    const recResult = await reconcileLinkedTransaction(
      supabase,
      p.receipt,
      "sms_webhook",
      p.amount,
      userId,
      occurredOn,
      p.raw,
      fromId,
      toId,
      fromAccCode,
      toAccCode,
      p.description,
      p.mpesaBal,
      p.txnCost
    );

    // Sync both balances from the SMS
    if (p.mpesaBal !== null)   { try { await setBalance(supabase, mpesa.id, p.mpesaBal); } catch {} }
    if (p.savingsBal !== null && p.savingsBal !== undefined) { try { await setBalance(supabase, savings.id, p.savingsBal); } catch {} }

    // Infer Fuliza auto-repayment: when KCB/M-Shwari → MPESA and balance is lower than expected
    if (p.kind === "transfer_in" && p.mpesaBal !== null && prevMpesaBalSavings !== null) {
      const expectedAfter = prevMpesaBalSavings + p.amount;
      const implied = expectedAfter - p.mpesaBal;
      if (implied >= 0.5) {
        await inferFulizaRepayment(supabase, userId, mpesa.id, implied, occurredOn, p.receipt, p.raw);
      }
    }

    return {
      status: recResult.status === "ignored" ? "ignored" : "created",
      reason: recResult.status === "ignored" ? recResult.reason : undefined,
      kind: p.kind,
      transaction_id: recResult.transaction_id,
      amount: p.amount,
      savings: p.savingsCode,
      mpesa_balance: p.mpesaBal,
      savings_balance: p.savingsBal
    };
  }

  // ── Income / Expense ──
  const categoryName = guessMpesaCategory(p.raw, p.txnType as "income" | "expense");
  const category = await getOrCreateCategory(supabase, userId, categoryName, p.txnType as "income" | "expense");

  // Capture prior M-PESA balance before inserting income (needed for Fuliza inference)
  let prevMpesaBalanceForInference: number | null = null;
  if (p.kind === "income" && p.mpesaBal !== null) {
    prevMpesaBalanceForInference = await getLastMpesaBalance(supabase, mpesa.id);
  }

  const metadata: Record<string, any> = {
    source: "sms_webhook",
    mpesa_receipt: p.receipt,
    counterparty: p.counterparty,
    balance_after: p.mpesaBal,
    txn_cost: p.txnCost,
    needs_review: p.needsReview,
    raw_sms: p.raw
  };
  if (p.description === "Fuliza repayment" || p.counterparty === "Fuliza M-Pesa") {
    metadata.tag = "fuliza";
  }

  // If this IS a Fuliza repayment SMS, delete any inferred duplicate for same day/amount
  if (p.description === "Fuliza repayment" && p.mpesaBal !== null) {
    try {
      const { data: inferred } = await supabase
        .from("transactions")
        .select("id, amount")
        .eq("user_id", userId)
        .eq("occurred_on", occurredOn)
        .eq("description", "Fuliza auto-repayment (inferred)")
        .maybeSingle();
      if (inferred && Math.abs(Number(inferred.amount) - p.amount) < 5.0) {
        await supabase.from("transactions").delete().eq("id", inferred.id);
      }
    } catch { /* non-fatal */ }
  }

  const { data: txn, error } = await supabase.from("transactions").insert({
    user_id: userId, account_id: mpesa.id, category_id: category.id,
    txn_type: p.txnType, amount: p.amount, currency_code: "KES", occurred_on: occurredOn,
    description: p.description,
    metadata: metadata,
  }).select("id").single();
  if (error) return { status: "failed", error: error.message };

  if (p.mpesaBal !== null) { try { await setBalance(supabase, mpesa.id, p.mpesaBal); } catch {} }

  // Infer Fuliza auto-repayment when income received (e.g. received from someone)
  if (p.kind === "income" && p.mpesaBal !== null && prevMpesaBalanceForInference !== null) {
    const expectedAfter = prevMpesaBalanceForInference + p.amount - (p.txnCost ?? 0);
    const implied = expectedAfter - p.mpesaBal;
    if (implied >= 0.5) {
      await inferFulizaRepayment(supabase, userId, mpesa.id, implied, occurredOn, p.receipt, p.raw);
    }
  }

  // Auto-match recurring obligations on expense txns
  if (p.txnType === "expense") {
    const searchText = `${p.description ?? ""} ${p.counterparty ?? ""} ${p.raw}`;
    await tryAutoMatchObligation(supabase, userId, txn.id, occurredOn, searchText);
  }

  // Auto-track M-Shwari Loan / KCB M-PESA Overdraft outstanding balances, and Fuliza repayments
  try {
    if (p.description === "Fuliza repayment") {
      const remaining = p.fulizaOutstanding ?? 0;
      await upsertAutoDebt(supabase, userId, "fuliza", "Safaricom Fuliza", remaining);
    }
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

  return {
    status: "created", kind: p.kind, transaction_id: txn.id, amount: p.amount, type: p.txnType,
    category: categoryName, counterparty: p.counterparty, balance_after: p.mpesaBal, needs_review: p.needsReview,
  };
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-webhook-secret") ?? request.headers.get("authorization")?.replace("Bearer ", "");
  const expectedSecret = process.env.MPESA_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Capture raw body up-front (clone so extractSmsText can still read the stream)
  const contentType = request.headers.get("content-type") ?? "none";
  let rawBody = "";
  try { rawBody = await request.clone().text(); } catch { /* */ }

  // Detailed raw console logging as requested
  console.log("[mpesa-sms webhook] Received POST request:", {
    contentType,
    rawBody: rawBody
  });

  // Try parsing rawBody as JSON
  let payload: any = null;
  try {
    if (rawBody.trim()) {
      payload = JSON.parse(rawBody);
    }
  } catch (err) {
    // Not JSON
  }

  // Check for placeholder strings in parsed payload
  if (payload) {
    const msg = payload.message || payload.body || payload.sms || payload.text || payload.msg || payload.content || payload.sms_body;
    const ts = payload.timestamp;
    const batch = payload.batch;

    if (
      (msg && isPlaceholder(msg)) ||
      (ts && isPlaceholder(ts)) ||
      (batch && (batch.trim() === "[lv=queue_contents]" || batch.trim() === "{queue_contents}" || batch.trim() === "[queue_contents]"))
    ) {
      console.warn("[mpesa-sms webhook] Rejected due to unresolved placeholders in JSON payload:", payload);
      return NextResponse.json(
        {
          error: "Unresolved MacroDroid placeholder detected in payload",
          received_payload: payload
        },
        { status: 400 }
      );
    }
  }

  const supabase = createAdminClient();

  // Handle Bank Sync batch payload
  if (payload && payload.source === "bank_sync") {
    const batchContent = payload.batch || "";
    const lines = batchContent.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
    const results = [];

    console.log(`[bank-sms webhook] Processing bank_sync batch of ${lines.length} lines`);

    for (const line of lines) {
      const parts = line.split("|||");
      const smsText = parts[0]?.trim();
      const timestamp = parts[1]?.trim();

      if (!smsText || isPlaceholder(smsText)) {
        results.push({ status: "ignored", reason: "empty_or_placeholder_line", line });
        continue;
      }

      try {
        const res = await processSingleBankSms(supabase, smsText, timestamp);
        results.push({ line, ...res });
      } catch (err: any) {
        console.error(`[bank-sms webhook] Error processing batch line: ${line}`, err);
        results.push({ line, status: "failed", error: err.message });
      }
    }

    return NextResponse.json({
      status: "processed",
      batch_size: lines.length,
      results,
      received_payload: payload
    });
  }

  // Handle Bank SMS single payload
  if (payload && payload.source === "bank_sms") {
    const smsText = payload.message || payload.body || payload.sms || payload.text || payload.msg || payload.content || payload.sms_body || "";
    const timestamp = payload.timestamp || "";
    const sender = payload.sender || "";

    if (!smsText || isPlaceholder(smsText)) {
      return NextResponse.json(
        {
          status: "ignored",
          reason: "empty_or_placeholder_body",
          received_payload: payload
        },
        { status: 400 }
      );
    }

    try {
      const res = await processSingleBankSms(supabase, smsText, timestamp, sender);
      if (res.status === "failed") {
        return NextResponse.json(
          {
            ...res,
            received_payload: payload
          },
          { status: 500 }
        );
      }
      return NextResponse.json({
        ...res,
        received_payload: payload
      });
    } catch (err: any) {
      console.error("[bank-sms webhook] Unexpected processing error:", err);
      return NextResponse.json(
        {
          status: "failed",
          error: err.message,
          received_payload: payload
        },
        { status: 500 }
      );
    }
  }

  // Handle batch payload
  if (payload && payload.batch) {
    const batchContent = payload.batch;
    const lines = batchContent.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
    const results = [];

    console.log(`[mpesa-sms webhook] Processing batch of ${lines.length} lines`);

    for (const line of lines) {
      const parts = line.split("|||");
      const smsText = parts[0]?.trim();
      const timestamp = parts[1]?.trim();

      if (!smsText || isPlaceholder(smsText)) {
        results.push({ status: "ignored", reason: "empty_or_placeholder_line", line });
        continue;
      }

      try {
        const res = await processSingleSms(supabase, smsText, timestamp);
        results.push({ line, ...res });
      } catch (err: any) {
        console.error(`[mpesa-sms webhook] Error processing batch line: ${line}`, err);
        results.push({ line, status: "failed", error: err.message });
      }
    }

    return NextResponse.json({
      status: "processed",
      batch_size: lines.length,
      results,
      received_payload: payload
    });
  }

  // Handle single message payload
  let smsText = "";
  let timestamp = "";
  if (payload) {
    smsText = payload.message || payload.body || payload.sms || payload.text || payload.msg || payload.content || payload.sms_body || "";
    timestamp = payload.timestamp || "";
  }

  // Fallback to extractSmsText for other content-types or if JSON properties didn't populate it
  if (!smsText) {
    try {
      smsText = await extractSmsText(request);
    } catch {
      return NextResponse.json(
        {
          error: "Could not read body",
          received_payload: rawBody
        },
        { status: 400 }
      );
    }
  }

  if (!smsText || isPlaceholder(smsText)) {
    await captureDebug(rawBody, contentType, smsText || "", "empty_or_placeholder_body");
    return NextResponse.json(
      {
        status: "ignored",
        reason: "empty_or_placeholder_body",
        content_type: contentType,
        received_payload: payload || rawBody
      },
      { status: 400 }
    );
  }

  try {
    const res = await processSingleSms(supabase, smsText, timestamp);
    if (res.status === "failed") {
      return NextResponse.json(
        {
          ...res,
          received_payload: payload || rawBody
        },
        { status: 500 }
      );
    }
    return NextResponse.json({
      ...res,
      received_payload: payload || rawBody
    });
  } catch (err: any) {
    console.error("[mpesa-sms webhook] Unexpected processing error:", err);
    return NextResponse.json(
      {
        status: "failed",
        error: err.message,
        received_payload: payload || rawBody
      },
      { status: 500 }
    );
  }
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
    const { data: debts } = await supabase.from("debts").select("*");
    
    const ids = accts.map((a: any) => a.id);
    const balances: Record<string, number> = {};
    for (const id of ids) balances[id] = 0;
    
    let totalBalance = accts.reduce((s: number, a: any) => s + Number(a.opening_balance), 0);
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

    const calculatedAccounts = accts.map((a: any) => ({
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
      debts: debts,
      fuliza_transactions: (txns || []).filter((t: any) => t.description?.toLowerCase().includes("fuliza")),
      transactions_summary: (txns || []).slice(0, 10).map((t: any) => ({ user_id: t.user_id, desc: t.description, amt: t.amount })),
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
    const mpesa = (accts ?? []).find((a: any) => a.account_code === "main");
    if (!mpesa) return NextResponse.json({ error: "M-Pesa account not found" }, { status: 404 });
    const userId = mpesa.user_id;

    let result = null;

    if (p.txnType === "transfer" && p.savingsCode) {
      const savings = (accts ?? []).find((a: any) => a.account_code === p.savingsCode);
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
      if (p.savingsBal !== null && p.savingsBal !== undefined) { await setBalance(supabase, savings.id, p.savingsBal); }
      result = { status: "reprocessed", id: newTxn.id, mpesa_balance: p.mpesaBal, savings_balance: p.savingsBal };
    } else {
      const categoryName = guessMpesaCategory(p.raw, p.txnType as "income" | "expense");
      const category = await getOrCreateCategory(supabase, userId, categoryName, p.txnType as "income" | "expense");

      const { data: newTxn, error } = await supabase.from("transactions").insert({
        user_id: userId, account_id: mpesa.id, category_id: category.id,
        txn_type: p.txnType, amount: p.amount, currency_code: "KES", occurred_on: p.occurredOn,
        description: p.description,
        metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, counterparty: p.counterparty, balance_after: p.mpesaBal, txn_cost: p.txnCost, needs_review: p.needsReview, raw_sms: p.raw },
      }).select("id").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      if (p.mpesaBal !== null) { await setBalance(supabase, mpesa.id, p.mpesaBal); }
      result = { status: "reprocessed", id: newTxn.id, balance_after: p.mpesaBal };
    }

    return NextResponse.json(result);
  }

  if (request.nextUrl.searchParams.get("backfill") === "1") {
    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    if (!accts || accts.length === 0) return NextResponse.json({ error: "No accounts found" }, { status: 500 });
    
    const mpesa = accts.find((a: any) => a.account_code === "main");
    const kcb = accts.find((a: any) => a.account_code === "kcb_mpesa");
    if (!mpesa || !kcb) return NextResponse.json({ error: "Main or KCB account missing" }, { status: 500 });
    const userId = mpesa.user_id;

    // 1. Delete all transactions created by the webhook or debug capturing
    await supabase.from("transactions").delete().eq("user_id", userId).or("metadata->>source.eq.sms_webhook,metadata->>source.eq.webhook_debug");
    
    // 2. Delete any manual upkeep double entry
    await supabase.from("transactions").delete().eq("user_id", userId).eq("description", "Monthly Upkeep sent by Okwembas");

    const smsList = [
      "UEULA5XIBK confirmed. You have received Ksh12,852.00 from Jenifer Akoth OkwembaGilles in US via Sendwave on 30/5/26 at 8:06 PM. New M-PESA balance is Ksh12,852.00.",
      "UEULA5XIBO Confirmed. Ksh 1142.46 from your M-PESA has been used to fully pay your outstanding Fuliza M-PESA. Available Fuliza M-PESA limit is Ksh 1500.00. Your M-PESA balance is 11709.54.",
      "UEULA5XMT4 Confirmed. Ksh500.00 sent to Gathogo  Kigotho 0708767392 on 30/5/26 at 8:10 PM. New M-PESA balance is Ksh11,202.54. Transaction cost, Ksh7.00.  Amount you can transact within the day is 498,340.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEULA5XT58 Confirmed. Ksh40.00 sent to JOSPHAT  MUTINDA on 30/5/26 at 9:12 PM. New M-PESA balance is Ksh11,162.54. Transaction cost, Ksh0.00. Amount you can transact within the day is 498,300.00. Download My OneApp on https://saf.cx/kWQpy",
      "UEULA5XW6C Confirmed. Ksh75.00 paid to Polymatt Supermarket. on 30/5/26 at 9:17 PM.New M-PESA balance is Ksh11,087.54. Transaction cost, Ksh0.00. Amount you can transact within the day is 498,225.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEULA5XWBQ Confirmed. Ksh70.00 paid to ATOMIC INC 3. on 30/5/26 at 9:25 PM.New M-PESA balance is Ksh11,017.54. Transaction cost, Ksh0.00. Amount you can transact within the day is 498,155.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEULA5XWCI Confirmed. Ksh350.00 paid to SIP AND SAVOR WINERIES. on 30/5/26 at 9:26 PM.New M-PESA balance is Ksh10,667.54. Transaction cost, Ksh0.00. Amount you can transact within the day is 497,805.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA5Z1RU Confirmed. Ksh200.00 sent to MUSA  YAVATSA 0768360370 on 31/5/26 at 10:27 AM. New M-PESA balance is Ksh10,460.54. Transaction cost, Ksh7.00.  Amount you can transact within the day is 499,800.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA5Z4SY Confirmed. Ksh100.00 sent to IAN  HOKA 0705241027 on 31/5/26 at 10:28 AM. New M-PESA balance is Ksh10,360.54. Transaction cost, Ksh0.00.  Amount you can transact within the day is 499,700.00. Download My OneApp on https://saf.cx/kWQpy",
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
      if (!p) continue;

      if (p.kind === "fuliza") {
        const outstanding = p.fulizaOutstanding ?? 0;
        const fee = p.fulizaFee ?? 0;
        const amount = p.fulizaAmount ?? 0;

        await upsertAutoDebt(supabase, userId, "fuliza", "Safaricom Fuliza", outstanding);

        if (fee > 0 && p.receipt !== "UNKNOWN") {
          const feeReceipt = p.receipt + "-fee";
          const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true })
            .eq("user_id", userId).contains("metadata", { mpesa_receipt: feeReceipt });
          if (!count || count === 0) {
            const category = await getOrCreateCategory(supabase, userId, "Other Expense", "expense");
            if (category) {
              await supabase.from("transactions").insert({
                user_id: userId, account_id: mpesa.id, category_id: category.id, txn_type: "expense",
                amount: fee, currency_code: "KES", occurred_on: p.occurredOn,
                description: "Fuliza Access Fee",
                metadata: { source: "sms_webhook", mpesa_receipt: feeReceipt, parent_receipt: p.receipt, raw_sms: p.raw }
              });
              ingested.push({ receipt: feeReceipt, kind: "expense", amount: fee, desc: "Fuliza Access Fee" });
            }
          }
        }

        if (amount > 0 && p.receipt !== "UNKNOWN") {
          const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true })
            .eq("user_id", userId).contains("metadata", { mpesa_receipt: p.receipt });
          if (!count || count === 0) {
            const category = await getOrCreateCategory(supabase, userId, "Other Expense", "expense");
            if (category) {
              await supabase.from("transactions").insert({
                user_id: userId, account_id: mpesa.id, category_id: category.id, txn_type: "expense",
                amount: amount, currency_code: "KES", occurred_on: p.occurredOn,
                description: "Fuliza transaction (auto-generated)",
                metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, is_auto_generated: true, raw_sms: p.raw }
              });
              ingested.push({ receipt: p.receipt, kind: "expense", amount: amount, desc: "Fuliza Overdraft" });
            }
          }
        }
        continue;
      }

      if (p.amount <= 0) continue;

      // Dedup / Update auto-generated
      if (p.receipt !== "UNKNOWN") {
        const { data: existing } = await supabase.from("transactions").select("id, metadata")
          .eq("user_id", userId).contains("metadata", { mpesa_receipt: p.receipt }).maybeSingle();

        if (existing) {
          const isAuto = (existing.metadata as Record<string, any>)?.is_auto_generated === true;
          if (isAuto) {
            const categoryName = guessMpesaCategory(p.raw, p.txnType as "income" | "expense");
            const category = await getOrCreateCategory(supabase, userId, categoryName, p.txnType as "income" | "expense");
            await supabase.from("transactions").update({
              category_id: category?.id ?? null,
              txn_type: p.txnType,
              amount: p.amount,
              description: p.description,
              metadata: {
                ...((existing.metadata as Record<string, any>) ?? {}),
                source: "sms_webhook",
                counterparty: p.counterparty,
                balance_after: p.mpesaBal,
                txn_cost: p.txnCost,
                needs_review: p.needsReview,
                raw_sms: p.raw,
                is_auto_generated: false
              }
            }).eq("id", existing.id);
            ingested.push({ receipt: p.receipt, kind: p.txnType, amount: p.amount, desc: "Updated auto-generated" });
          }
          continue;
        }
      }

      // Handle transfers
      if (p.txnType === "transfer" && p.savingsCode) {
        const savings = accts.find((a: any) => a.account_code === p.savingsCode);
        if (!savings) continue;
        const fromId = p.kind === "transfer_out" ? mpesa.id : savings.id;
        const toId   = p.kind === "transfer_out" ? savings.id : mpesa.id;
        const { data: txn } = await supabase.from("transactions").insert({
          user_id: userId, account_id: fromId, transfer_account_id: toId, category_id: null,
          txn_type: "transfer", amount: p.amount, currency_code: "KES", occurred_on: p.occurredOn,
          description: p.description,
          metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, counterparty: p.counterparty, balance_after: p.mpesaBal, savings_balance: p.savingsBal, raw_sms: p.raw },
        }).select("id").single();
        if (txn) {
          ingested.push({ receipt: p.receipt, kind: "transfer", amount: p.amount });
          try {
            const name = p.savingsCode === "kcb_mpesa" ? "KCB M-PESA" : "M-Shwari";
            const code = p.savingsCode;
            const mshwariM = p.raw.match(P.mshwariLoanOutstanding);
            if (mshwariM) {
              await upsertAutoDebt(supabase, userId, "mshwari_loan", "M-Shwari Loan", num(mshwariM[1]));
            }
            const kcbM = p.raw.match(P.kcbOverdraftOutstanding);
            if (kcbM) {
              await upsertAutoDebt(supabase, userId, "kcb_overdraft", "KCB M-PESA Overdraft", num(kcbM[1]));
            }
          } catch {}
        }
      } else {
        // Income / Expense
        const categoryName = guessMpesaCategory(p.raw, p.txnType as "income" | "expense");
        const category = await getOrCreateCategory(supabase, userId, categoryName, p.txnType as "income" | "expense");
        if (category) {
          const { data: txn } = await supabase.from("transactions").insert({
            user_id: userId, account_id: mpesa.id, category_id: category.id,
            txn_type: p.txnType, amount: p.amount, currency_code: "KES", occurred_on: p.occurredOn,
            description: p.description,
            metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, counterparty: p.counterparty, balance_after: p.mpesaBal, txn_cost: p.txnCost, needs_review: p.needsReview, raw_sms: p.raw },
          }).select("id").single();
          if (txn) {
            ingested.push({ receipt: p.receipt, kind: p.txnType, amount: p.amount });
            try {
              if (p.description === "Fuliza repayment") {
                const remaining = p.fulizaOutstanding ?? 0;
                await upsertAutoDebt(supabase, userId, "fuliza", "Safaricom Fuliza", remaining);
              }
              const mshwariM = p.raw.match(P.mshwariLoanOutstanding);
              if (mshwariM) {
                await upsertAutoDebt(supabase, userId, "mshwari_loan", "M-Shwari Loan", num(mshwariM[1]));
              }
              const kcbM = p.raw.match(P.kcbOverdraftOutstanding);
              if (kcbM) {
                await upsertAutoDebt(supabase, userId, "kcb_overdraft", "KCB M-PESA Overdraft", num(kcbM[1]));
              }
            } catch {}
          }
        }
      }
    }

    return NextResponse.json({ status: "backfill_complete", parsed_and_inserted: ingested.length, details: ingested });
  }

  // ?backfillsbm=1 → delete duplicates and re-ingest all pasted SBM SMS notifications!
  if (request.nextUrl.searchParams.get("backfillsbm") === "1") {
    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    if (!accts || accts.length === 0) return NextResponse.json({ error: "No accounts found" }, { status: 500 });
    
    const sbmAccount = accts.find((a: any) => a.account_code === "bank_c");
    const mpesa = accts.find((a: any) => a.account_code === "main");
    if (!sbmAccount || !mpesa) return NextResponse.json({ error: "SBM Bank or M-Pesa account missing" }, { status: 500 });
    const userId = sbmAccount.user_id;

    // 1. Delete all transactions created by the SBM webhook
    await supabase.from("transactions").delete().eq("user_id", userId).contains("metadata", { source: "sbm_webhook" });

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
          const incorrectExpense = existing.find((t: any) => t.txn_type === "expense" && sbm.kind === "transfer");
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
        const category = await getOrCreateCategory(supabase, userId, categoryName, sbm.kind);
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

    return NextResponse.json({ status: "sbm_backfill_complete", parsed_and_inserted: ingested.length, details: ingested });
  }

  // ?backfilldtb=1 → delete duplicates and re-ingest all pasted DTB SMS notifications!
  if (request.nextUrl.searchParams.get("backfilldtb") === "1") {
    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    if (!accts || accts.length === 0) return NextResponse.json({ error: "No accounts found" }, { status: 500 });

    const dtbAccount = accts.find((a: any) => a.account_code === "bank_a");
    const mpesa = accts.find((a: any) => a.account_code === "main");
    if (!dtbAccount || !mpesa) return NextResponse.json({ error: "DTB Bank or M-Pesa account missing" }, { status: 500 });
    const userId = dtbAccount.user_id;

    // 1. Delete all transactions created by the DTB webhook
    await supabase.from("transactions").delete().eq("user_id", userId).contains("metadata", { source: "dtb_webhook" });

    const dtbList = [
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 484.66 for a POS PURCHASE at Name.com, Inc 7202492374 CO  on 02/06/2026.  DTB",
      "Dear Roy otieno , you have successfully transferred KES 500.00 from your MPESA to account: 58XXXX5001. Mpesa Ref No: UEVLA5Z7JP. DTB",
      "Dear Roy otieno , you have successfully transferred KES 1,450.00 to  ROY OKOLA OTIENO 254726683835. M-PESA Ref: UDHLA10FYX. Ref No: 455402879. DTB.",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 1450 for a MOBILE BANKING TXN on 17/04/2026.  DTB",
      "Dear Roy otieno , you have successfully transferred KES 1,000.00 to  ROY OKOLA OTIENO 254726683835. M-PESA Ref: UDHLA0Z0G9. Ref No: 455289170. DTB.",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 1000 for a MOBILE BANKING TXN on 17/04/2026.  DTB",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 454.53 for a POS PURCHASE at APPLE.COM/BILL CORK IRL on 13/04/2026.  DTB",
      "Dear Roy otieno , you have successfully transferred KES 2,000.00 to  ROY OKOLA OTIENO 254726683835. M-PESA Ref: UDDLA0JJ1U. Ref No: 454160140. DTB.",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 2000 for a MOBILE BANKING TXN on 13/04/2026.  DTB",
      "Dear Roy otieno , you have successfully transferred KES 100.00 to  ROY OKOLA OTIENO 254726683835. M-PESA Ref: UD6LABNAGI. Ref No: 452046969. DTB.",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 100 for a MOBILE BANKING TXN on 07/04/2026.  DTB",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 51 for a POS PURCHASE at UBER * PENDING Vorden NLD on 27/02/2026.  DTB",
      "Dear ROY  OKOLA OTIENO , you have received KES 100 in your account 580XXXX001 from 254726683835-ROY OKOLA OTIENO. Ref UBRLA7QIOV. DTB",
      "Dear ROY OKOLA OTIENO, you have successfully transferred KES 100 from your M-PESA to account 5804605001. Ref UBRLA7QIOV. DTB",
      "Dear ROY  OKOLA OTIENO , you have received KES 105 in your account 580XXXX001 from 254726683835-ROY OKOLA OTIENO. Ref UAJLA440Q0. DTB",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 102 for a POS PURCHASE at GOOGLE *1 1 1 1 WARP S MOUNTAIN VIEW CA  on 19/01/2026.  DTB",
      "Dear ROY OKOLA OTIENO, you have successfully transferred KES 105 from your M-PESA to account 5804605001. Ref UAJLA440Q0. DTB",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 10.99 for a POS PURCHASE at GOOGLE *TikTok Videos MOUNTAIN VIEW CA  on 09/01/2026.  DTB",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 45 for a POS PURCHASE at GOOGLE *TikTok Videos MOUNTAIN VIEW CA  on 09/01/2026.  DTB",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 67.61 for a POS PURCHASE at GOOGLE *YouTube Member MOUNTAIN VIEW CA  on 05/01/2026.  DTB"
    ];

    const ingested = [];
    for (const sms of dtbList) {
      const dtb = parseDtbSMS(sms);
      if (!dtb) continue;

      // Deduplicate for mobile banking alert messages based on date and amount
      if (dtb.isMobileBankingAlert) {
        const { data: dup } = await supabase.from("transactions").select("id")
          .eq("user_id", userId)
          .eq("amount", dtb.amount)
          .eq("occurred_on", dtb.occurredOn)
          .or(`account_id.eq.${dtbAccount.id},transfer_account_id.eq.${dtbAccount.id}`);
        if (dup && dup.length > 0) {
          continue;
        }
      }

      // Dedup by receipt
      if (dtb.receipt !== "UNKNOWN") {
        const { data: existing } = await supabase.from("transactions").select("id, txn_type")
          .eq("user_id", userId)
          .or(`metadata->>dtb_receipt.eq.${dtb.receipt},metadata->>mpesa_receipt.eq.${dtb.receipt}`);

        if (existing && existing.length > 0) {
          continue;
        }
      }

      if (dtb.kind === "transfer") {
        const isOutflow = dtb.description === "Transfer to M-Pesa";
        const fromId = isOutflow ? dtbAccount.id : mpesa.id;
        const toId   = isOutflow ? mpesa.id : dtbAccount.id;

        const { data: txn } = await supabase.from("transactions").insert({
          user_id: userId, account_id: fromId, transfer_account_id: toId, category_id: null,
          txn_type: "transfer", amount: dtb.amount, currency_code: "KES", occurred_on: dtb.occurredOn,
          description: dtb.description,
          metadata: { source: "dtb_webhook", dtb_receipt: dtb.receipt, counterparty: dtb.counterparty, raw_sms: sms },
        }).select("id").single();
        if (txn) ingested.push({ receipt: dtb.receipt, kind: "transfer", amount: dtb.amount });
      } else {
        const categoryName = guessCategory(sms, dtb.kind);
        const category = await getOrCreateCategory(supabase, userId, categoryName, dtb.kind);
        if (category) {
          const { data: txn } = await supabase.from("transactions").insert({
            user_id: userId, account_id: dtbAccount.id, category_id: category.id,
            txn_type: dtb.kind, amount: dtb.amount, currency_code: "KES", occurred_on: dtb.occurredOn,
            description: dtb.description,
            metadata: { source: "dtb_webhook", dtb_receipt: dtb.receipt, counterparty: dtb.counterparty, raw_sms: sms },
          }).select("id").single();
          if (txn) ingested.push({ receipt: dtb.receipt, kind: dtb.kind, amount: dtb.amount });
        }
      }
    }

    return NextResponse.json({ status: "dtb_backfill_complete", parsed_and_inserted: ingested.length, details: ingested });
  }

  // ?backfillim=1 → delete duplicates and re-ingest all pasted I&M Bank SMS notifications!
  if (request.nextUrl.searchParams.get("backfillim") === "1") {
    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    if (!accts || accts.length === 0) return NextResponse.json({ error: "No accounts found" }, { status: 500 });

    const imAccount = accts.find((a: any) => a.account_code === "bank_b");
    const mpesa = accts.find((a: any) => a.account_code === "main");
    if (!imAccount || !mpesa) return NextResponse.json({ error: "I&M Bank or M-Pesa account missing" }, { status: 500 });
    const userId = imAccount.user_id;

    // 1. Delete all transactions created by the I&M webhook
    await supabase.from("transactions").delete().eq("user_id", userId).contains("metadata", { source: "im_webhook" });

    const imList = [
      "Dear Customer,you have successfully sent KES 700.0 to 254726683835 with M Pesa Reference Number UAGLA3TKPT I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 800.0 to 254726683835 with M Pesa Reference Number UAKLA47X0Q I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 150.0 to 254726683835 with M Pesa Reference Number UAKLA48KKZ I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 300.0 to 254726683835 with M Pesa Reference Number UAPLA4NCZV I&amp;M Bank",
      "You have received KES 500.00 from CIZRENN VYLLIN. Transaction Ref ID: 3449RNSD5689. Mpesa Ref ID: UB4LA5K6SA. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Dear Customer,you have successfully sent KES 50.0 to 254726683835 with M Pesa Reference Number UB6LA5RU78 I&amp;M Bank",
      "Dear Customer,You have received KES 35000 via PesaLink into Acc 05508402466150 Tran Ref 006000572026020917143214463567. For enquiry,call 020 3221000. IM Bank.",
      "Dear Customer,you have successfully sent KES 25000.0 to 254721656815 with M Pesa Reference Number UB9JL656WR I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 5000.0 to 254726683835 with M Pesa Reference Number UB9LA63CMS I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 3800.0 to 254746511297 with M Pesa Reference Number UB9AG69Q4D I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 1200.0 to 254726683835 with M Pesa Reference Number UBALA64O6B I&amp;M Bank",
      "Dear Customer,You have received KES 71600 via PesaLink into Acc 05508402466150 Tran Ref 006000572026021015273861210733. For enquiry,call 020 3221000. IM Bank.",
      "Bank to M-PESA transfer of KES 20,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3503OSKR6953. M-PESA Ref ID: UBALA661SH",
      "You have received KES 20,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3503OSKR6953. Mpesa Ref ID: UBALA661SH. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 1,000.00 to 254720214254 - BRIAN MUSINA BURUDI successfully processed. Transaction Ref ID: 3505KUAD0280. M-PESA Ref ID: UBACY6D82Z",
      "Bank to M-PESA transfer of KES 1,000.00 to 0796322807 - DOREEN NDINDAH MUEMA successfully processed. Transaction Ref ID: 3512YLKR9016. M-PESA Ref ID: UBBIN69TB3",
      "Bank to M-PESA transfer of KES 1,600.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3519CMTT1133. M-PESA Ref ID: UBCLA6C3NF",
      "You have received KES 1,600.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3519CMTT1133. Mpesa Ref ID: UBCLA6C3NF. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 2,500.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3547DZAO4271. M-PESA Ref ID: UBFLA6NGJA",
      "You have received KES 2,500.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3547DZAO4271. Mpesa Ref ID: UBFLA6NGJA. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 3,000.00 to 0746511297 - SONIA AKOTH OTIENO successfully processed. Transaction Ref ID: 3554ENKU3417. M-PESA Ref ID: UBGAG6WUEB",
      "Bank to M-PESA transfer of KES 2,000.00 to 254705036864 - CIZRENN VYLLIN successfully processed. Transaction Ref ID: 3554DCTB3460. M-PESA Ref ID: UBG256QQGK",
      "Bank to M-PESA transfer of KES 500.00 to 254748459641 - Nicholas Nganga Mugi successfully processed. Transaction Ref ID: 3554INQE3509. M-PESA Ref ID: UBGQS6WRD0",
      "Dear Customer,you have successfully sent KES 2000.0 to 254726683835 with M Pesa Reference Number UBHLA6SHQ9 I&amp;M Bank",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 3565LBJP8282. M-PESA Ref ID: UBHP66XQFM",
      "Bank to M-PESA transfer of KES 2,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3578KWLH9592. M-PESA Ref ID: UBJLA6YUR1",
      "You have received KES 2,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3578KWLH9592. Mpesa Ref ID: UBJLA6YUR1. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 500.00 to 0758198422 - pauline sau chamangi successfully processed. Transaction Ref ID: 3578GGEW9638. M-PESA Ref ID: UBJK672AC3",
      "M-PESA transfer of KES 3,320.00 to  successfully processed. Transaction Ref ID: 667620796801. M-PESA Ref ID: UBJS883K90",
      "You have received KES 600.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3591EWRT6052. Mpesa Ref ID: UBKLA74NEP. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 600.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3591EWRT6052. M-PESA Ref ID: UBKLA74NEP",
      "Dear Customer,you have successfully sent KES 3000.0 to 254726683835 with M Pesa Reference Number UBLLA76Y4U I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 500.0 to 254708767392 with M Pesa Reference Number UBMP67CGLK I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 2000.0 to 254726683835 with M Pesa Reference Number UBMLA79C5U I&amp;M Bank",
      "Bank to M-PESA transfer of KES 4,500.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3612MBBT8200. M-PESA Ref ID: UBNLA7BO20",
      "You have received KES 4,500.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3612MBBT8200. Mpesa Ref ID: UBNLA7BO20. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 400.00 to 254716497978 - ALEX LUVAI LUVAI successfully processed. Transaction Ref ID: 3685QCCN6583. M-PESA Ref ID: UC3077ZMH6",
      "Bank to M-PESA transfer of KES 1,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3685WURQ6612. M-PESA Ref ID: UC3LA84E39",
      "You have received KES 1,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3685WURQ6612. Mpesa Ref ID: UC3LA84E39. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 3694EJXR7588. M-PESA Ref ID: UC4P68BPQE",
      "Bank to M-PESA transfer of KES 1,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3694AYSX7552. M-PESA Ref ID: UC4LA888AS",
      "You have received KES 1,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3694AYSX7552. Mpesa Ref ID: UC4LA888AS. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 3,500.00 to 0796322807 - DOREEN NDINDAH MUEMA successfully processed. Transaction Ref ID: 3710LZKI7688. M-PESA Ref ID: UC6IN8DZXH",
      "Bank to M-PESA transfer of KES 500.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3720VMHM0518. M-PESA Ref ID: UC7LA8HXJ7",
      "You have received KES 500.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3720VMHM0518. Mpesa Ref ID: UC7LA8HXJ7. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 2,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3742KHPO7556. M-PESA Ref ID: UCALA8QLUM",
      "You have received KES 2,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3742KHPO7556. Mpesa Ref ID: UCALA8QLUM. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 3755PBKY5314. M-PESA Ref ID: UCBP68ZUZ9",
      "Bank to M-PESA transfer of KES 800.00 to 0112217747 - Donald ombok odera successfully processed. Transaction Ref ID: 3812XVRW5194. M-PESA Ref ID: UCIQW9UPKN",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 3815AFOS5807. M-PESA Ref ID: UCIP69OTBK",
      "Bank to M-PESA transfer of KES 1,200.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3824SPNP8251. M-PESA Ref ID: UCJLA9PCPR",
      "You have received KES 1,200.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3824SPNP8251. Mpesa Ref ID: UCJLA9PCPR. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 5,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3840QRFB4007. M-PESA Ref ID: UCLLA9VXCK",
      "You have received KES 5,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3840QRFB4007. Mpesa Ref ID: UCLLA9VXCK. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 2,100.00 to 0743257910 - EMMANUEL NSENGIYUMVA successfully processed. Transaction Ref ID: 3842IOSU6163. M-PESA Ref ID: UCL5ZABD0I",
      "Bank to M-PESA transfer of KES 3,700.00 to 254705131326 - OTIENO ODEK MYLES successfully processed. Transaction Ref ID: 3858JGKS8718. M-PESA Ref ID: UCNBXAFTZR",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 3863SWOS5135. M-PESA Ref ID: UCOP6A9EMD",
      "Bank to M-PESA transfer of KES 600.00 to 254748459641 - Nicholas Nganga Mugi successfully processed. Transaction Ref ID: 3894RWOR3473. M-PESA Ref ID: UCRQSASYWG",
      "You have received KES 2,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3902PNUI6111. Mpesa Ref ID: UCSLAAOA75. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 2,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3902PNUI6111. M-PESA Ref ID: UCSLAAOA75",
      "Bank to M-PESA transfer of KES 500.00 to 254748459641 - Nicholas Nganga Mugi successfully processed. Transaction Ref ID: 3908QFXD8083. M-PESA Ref ID: UCTQSAZ0TU",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 3928SOIZ2190. M-PESA Ref ID: UCVP6B3OE1",
      "You have received KES 400.00 from CIZRENN VYLLIN. Transaction Ref ID: 3969UVZI0811. Mpesa Ref ID: UD5LABJICH. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 4014CUSX2328. M-PESA Ref ID: UDAP60CERC",
      "Pesalink transfer of KES 5,000.00 to 254726683835 on 10/04/2026 17:48 processed successfully. Transaction Ref ID:060690198038",
      "Bank to M-PESA transfer of KES 18,000.00 to 254721656815 - JUDITH MAUREEN AKINYI OKWEMBA successfully processed. Transaction Ref ID: 4014HOSU2487. M-PESA Ref ID: UDAJL0AWZT",
      "Bank to M-PESA transfer of KES 2,561.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 4014NJHU3362. M-PESA Ref ID: UDALA08HSP",
      "You have received KES 2,561.00 from ROY OKOLA OTIENO. Transaction Ref ID: 4014NJHU3362. Mpesa Ref ID: UDALA08HSP. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 1,000.00 to 254705131326 - OTIENO ODEK MYLES successfully processed. Transaction Ref ID: 4014BJMU2419. M-PESA Ref ID: UDABX0KU5V",
      "Bank to M-PESA transfer of KES 6,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 4014AMTR2949. M-PESA Ref ID: UDALA08F0N",
      "You have received KES 6,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 4014AMTR2949. Mpesa Ref ID: UDALA08F0N. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 4,000.00 to 0746511297 - SONIA AKOTH OTIENO successfully processed. Transaction Ref ID: 4014AGXK2617. M-PESA Ref ID: UDAAG0I0EI",
      "Bank to M-PESA transfer of KES 500.00 to 0796322807 - DOREEN NDINDAH MUEMA successfully processed. Transaction Ref ID: 4022DEAH8038. M-PESA Ref ID: UDBIN0AKDS",
      "Bank to M-PESA transfer of KES 1,500.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 4032JKST3552. M-PESA Ref ID: UDCLA0HGLD",
      "You have received KES 1,500.00 from ROY OKOLA OTIENO. Transaction Ref ID: 4032JKST3552. Mpesa Ref ID: UDCLA0HGLD. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 4032RIVM3574. M-PESA Ref ID: UDCP60LC98",
      "Bank to M-PESA transfer of KES 200.00 to 254748459641 - Nicholas Nganga Mugi successfully processed. Transaction Ref ID: 4032SXQR3619. M-PESA Ref ID: UDCQS0QJCR",
      "Bank to M-PESA transfer of KES 600.00 to 254748459641 - Nicholas Nganga Mugi successfully processed. Transaction Ref ID: 4056ROKE5786. M-PESA Ref ID: UDFQS11DV5",
      "You have received KES 3,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 4092ADKO1333. Mpesa Ref ID: UDJLA18WEJ. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 3,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 4092ADKO1333. M-PESA Ref ID: UDJLA18WEJ",
      "Bank to M-PESA transfer of KES 1,000.00 to 0796322807 - DOREEN NDINDAH MUEMA successfully processed. Transaction Ref ID: 4096HYZR7980. M-PESA Ref ID: UDKIN189G6",
      "KES 15.00 paid to VISTACOM CYBER & PRINTS (Acc 071616) on 20/04/26 at 12:18 PM Ref: UDKLA1BJF7. Enquiries, call 0719088000.",
      "KES 30.00 paid to VISTACOM CYBER & PRINTS (Acc 071616) on 20/04/26 at 12:24 PM Ref: UDKLA1BFUW. Enquiries, call 07190"
    ];

    const ingested = [];
    for (const sms of imList) {
      const im = parseImSMS(sms);
      if (!im) continue;

      // Dedup by receipt
      if (im.receipt !== "UNKNOWN") {
        const { data: existing } = await supabase.from("transactions").select("id, txn_type")
          .eq("user_id", userId)
          .or(`metadata->>im_receipt.eq.${im.receipt},metadata->>mpesa_receipt.eq.${im.receipt}`);

        if (existing && existing.length > 0) {
          continue;
        }
      }

      if (im.kind === "transfer") {
        const isOutflow = im.description.toLowerCase().includes("transfer to");
        const fromId = isOutflow ? imAccount.id : mpesa.id;
        const toId   = isOutflow ? mpesa.id : imAccount.id;

        const { data: txn } = await supabase.from("transactions").insert({
          user_id: userId, account_id: fromId, transfer_account_id: toId, category_id: null,
          txn_type: "transfer", amount: im.amount, currency_code: "KES", occurred_on: im.occurredOn,
          description: im.description,
          metadata: { source: "im_webhook", im_receipt: im.receipt, counterparty: im.counterparty, raw_sms: sms },
        }).select("id").single();
        if (txn) ingested.push({ receipt: im.receipt, kind: "transfer", amount: im.amount });
      } else {
        const categoryName = guessCategory(sms, im.kind);
        const category = await getOrCreateCategory(supabase, userId, categoryName, im.kind);
        if (category) {
          const { data: txn } = await supabase.from("transactions").insert({
            user_id: userId, account_id: imAccount.id, category_id: category.id,
            txn_type: im.kind, amount: im.amount, currency_code: "KES", occurred_on: im.occurredOn,
            description: im.description,
            metadata: { source: "im_webhook", im_receipt: im.receipt, counterparty: im.counterparty, raw_sms: sms },
          }).select("id").single();
          if (txn) ingested.push({ receipt: im.receipt, kind: im.kind, amount: im.amount });
        }
      }
    }

    return NextResponse.json({ status: "im_backfill_complete", parsed_and_inserted: ingested.length, details: ingested });
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
