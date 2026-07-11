import { createAdminClient } from "@/lib/supabase/admin";

export type AdminClient = ReturnType<typeof createAdminClient>;

// ─── Patterns ────────────────────────────────────────────────────────────────
export const P = {
  fulizaInfo:   /fuliza m-?pesa amount is/i,
  fulizaOutstanding: /total fuliza m-?pesa outstanding amount is\s*ksh\s*([\d,]+\.?\d*)/i,
  mshwariLoanOutstanding: /m-?shwari\s+loan[^.]*outstanding[^.]*ksh\s*([\d,]+\.?\d*)/i,
  kcbOverdraftOutstanding: /kcb m-?pesa[^.]*overdraft[^.]*ksh\s*([\d,]+\.?\d*)/i,
  fulizaRepay:  /ksh\s*([\d,]+\.?\d*)\s+(?:from your m-?pesa\s+)?has been (?:used to\s+(?:fully\s+|partially\s+)?(?:pay|repay)|deducted(?:\s+from your m-?pesa)?\s+to\s+(?:pay|repay))\s+(?:your\s+)?(?:outstanding\s+)?fuliza/i,
  fulizaRepayRemaining: /(?:outstanding fuliza m-?pesa balance is|remaining fuliza outstanding balance is|outstanding balance is)\s*ksh\s*([\d,]+\.?\d*)/i,
  fulizaFullyRepaid:   /available fuliza m-?pesa limit is\s*ksh\s*([\d,]+\.?\d*)/i,
  fulizaAmount: /fuliza m-?pesa amount is\s*ksh\s*([\d,]+\.?\d*)/i,
  fulizaAccessFee: /access fee charged\s*ksh\s*([\d,]+\.?\d*)/i,
  received:     /received ksh([\d,]+\.?\d*) from ([^.]+?)(?=\s*\d{6,}|\s+on \d|\.)/i,
  sentPaid:     /ksh([\d,]+\.?\d*) (?:sent|paid) to ([^.]+?)(?=\s+for account|\s+on \d|\.)/i,
  withdrawn:    /ksh([\d,]+\.?\d*) withdrawn from ([^.]+?)(?=\s+on \d|\.|new m-?pesa)/i,
  giveCash:     /give ksh([\d,]+\.?\d*) cash to ([^.]+?)(?=\.|new m-?pesa)/i,
  airtime:      /(?:bought ksh([\d,]+\.?\d*) of airtime|airtime purchase of ksh([\d,]+\.?\d*))/i,
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
  dtbPos: /ALERT: Your account no\. (\S+) has been debited with KES\s*([\d,]+\.?\d*) for a POS PURCHASE at (.+?) on (\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  dtbMobileBankingDebit: /ALERT: Your account no\. (\S+) has been debited with KES\s*([\d,]+\.?\d*) for a MOBILE BANKING TXN on (\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  dtbFromMpesa: /successfully transferred KES\s*([\d,]+\.?\d*) from your M-?PESA to account:?\s*(\S+)\.(?:\s*Mpesa)?\s*Ref(?:\s*No)?[:\s]+\b([A-Z0-9]{10})\b/i,
  dtbToMpesa: /successfully transferred KES\s*([\d,]+\.?\d*) to\s+([^.]+?)\. M-?PESA Ref:\s*\b([A-Z0-9]{10})\b\. Ref No:\s*(\d+)/i,
  dtbReceived: /received KES\s*([\d,]+\.?\d*) in your account\s*(\S+)\s+from\s+([^.]+?)\. Ref\s*\b([A-Z0-9]{10})\b/i,
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

export function guessCategory(text: string, t: "income" | "expense"): string {
  for (const r of CATEGORY_RULES) if (r.type === t && r.pattern.test(text)) return r.category;
  return t === "income" ? "Other Income" : "Other Expense";
}

export function guessMpesaCategory(text: string, t: "income" | "expense"): string {
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

export async function getOrCreateCategory(
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

export const num = (s: string) => parseFloat(s.replace(/,/g, ""));
export function parseDate(s: string): string {
  const [d, m, y] = s.split("/").map(Number);
  const yr = y < 100 ? 2000 + y : y;
  return `${yr}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
export function cleanName(raw: string): string {
  return raw
    .replace(/\b\d{9,12}\b/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.\s]+$/, "")
    .trim() || "Unknown";
}
export function containsOtp(text: string): boolean {
  if (!text) return false;
  const otpKeywords = /verification code|one[- ]time|otp|security code|activation code|activation key|auth code|verification pin|passcode|secret pin/i;
  const otpPatterns = [
    otpKeywords,
    /\b(?:code|pin|otp)\b.*\b\d{4,8}\b/i,
    /\b\d{4,8}\b.*\b(?:code|pin|otp)\b/i
  ];
  return otpPatterns.some(pat => pat.test(text));
}

export function scrubSensitiveData(text: string): string {
  if (!text) return "";
  let scrubbed = text;
  scrubbed = scrubbed.replace(/(?:\+?254|0)[71]\d{8}\b/g, "[PHONE]");
  scrubbed = scrubbed.replace(/\b\d{4}\*+\d{4}\b/g, "[CARD]");
  scrubbed = scrubbed.replace(/\bcard\s+\*?(\d{4})\b/gi, "card *[CARD]");
  scrubbed = scrubbed.replace(/\bcard\s+ending\s+(\d{4})\b/gi, "card ending [CARD]");
  scrubbed = scrubbed.replace(/(?:account|acc(?:\.)?|a\/c)\s+(\d{5,12})\b/gi, "account [ACCOUNT]");
  scrubbed = scrubbed.replace(/\b\d{4,8}\b/g, "[CODE]");
  return scrubbed;
}

export function cleanSms(raw: string): string {
  return raw.replace(/^From\s*:\s*.+[\r\n]+/i, "").trim();
}
export function looksLikeMpesa(t: string): boolean {
  return (/confirmed/i.test(t) && /ksh\s?[\d,]/i.test(t)) || P.mpesaBal.test(t) || /\b[A-Z0-9]{10}\b\s+confirmed/i.test(t);
}

export type Kind = "income" | "expense" | "transfer_out" | "transfer_in" | "fuliza" | "skip";
export interface Parsed {
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

export function hashString(str: string): string {
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

export interface ParsedSbm {
  kind: "income" | "expense" | "transfer";
  receipt: string;
  amount: number;
  description: string;
  counterparty: string;
  occurredOn: string;
  isMobileBankingAlert?: boolean;
}

export function parseSbmSMS(text: string): ParsedSbm | null {
  if (/maintenance| OTP |declined|closed tomorrow|resumed|reminder|observed/i.test(text)) return null;

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

export const DTB_HISTORICAL_DATES: Record<string, string> = {
  "UEVLA5Z7JP": "2026-05-31",
  "UBRLA7QIOV": "2026-02-27",
  "UAJLA440Q0": "2026-01-19",
  "UDHLA10FYX": "2026-04-17",
  "UDHLA0Z0G9": "2026-04-17",
  "UDDLA0JJ1U": "2026-04-13",
  "UD6LABNAGI": "2026-04-07",
};

export function parseDtbSMS(text: string): ParsedSbm | null {
  if (/maintenance| OTP |declined|closed tomorrow|resumed|reminder|observed|vigilant|investigate|security|Be aware|Stay alert|Good news|Pin change/i.test(text)) return null;

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

export const IM_HISTORICAL_DATES: Record<string, string> = {
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

export function parseImSMS(text: string): ParsedSbm | null {
  if (/maintenance| OTP |declined|closed tomorrow|resumed|reminder|observed|vigilant|investigate|security|Be aware|Stay alert|Happy International/i.test(text)) return null;

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

export function cleanBankCounterparty(name: string): string {
  return name
    .replace(/\b\d{6,}\b/g, "")
    .replace(/,\s*Inc/gi, " Inc")
    .replace(/,\s*CO\b/gi, "")
    .replace(/\s+CO\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/[.,\s]+$/, "")
    .trim();
}

export interface ParsedBankResult {
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

export function parseBankSms(message: string, sender?: string): ParsedBankResult | null {
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

export async function reconcileLinkedTransaction(
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
  const { data: txns, error } = await supabase
    .from("transactions")
    .select("id, account_id, transfer_account_id, txn_type, metadata, occurred_on")
    .eq("user_id", userId)
    .or(`metadata->>mpesa_receipt.eq.${ref},metadata->>reference.eq.${ref},metadata->>sbm_receipt.eq.${ref},metadata->>dtb_receipt.eq.${ref},metadata->>im_receipt.eq.${ref}`);

  if (error) {
    console.error("[reconcile] Error fetching transactions:", error);
    throw error;
  }

  const existing = (txns ?? [])[0];
  const isSavings = fromAccountCode === "kcb_mpesa" || fromAccountCode === "mshwari" ||
                    toAccountCode === "kcb_mpesa" || toAccountCode === "mshwari";

  if (!existing) {
    if (isSavings) {
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

  if (existing.txn_type === "transfer") {
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
      const meta = sourceLeg.metadata as Record<string, any>;
      if (meta && meta.source === incomingSource) {
        return { status: "ignored", reason: "duplicate", transaction_id: sourceLeg.id };
      }

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

export interface NvidiaParsedResult {
  is_transaction: boolean;
  amount: number;
  currency: string;
  type: "income" | "expense" | "transfer";
  counterparty: string;
  reference: string;
  bank_name: string;
  bank_code: string;
  from_account_code?: string;
  to_account_code?: string;
  stated_balance: number | null;
  transaction_cost: number | null;
  occurred_on?: string;
}

export async function parseBankSmsWithNvidia(smsText: string, sender?: string): Promise<NvidiaParsedResult | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.log("[nvidia-parser] NVIDIA_API_KEY is missing. Skipping LLM parser.");
    return null;
  }

  const transactionKeywords = [
    "ksh", "kes", "usd", "eur", "gbp", "confirmed", "sent to", "paid to", 
    "transferred", "debited", "credited", "withdrawn", "received", "payment", 
    "alert", "tx", "txn", "reference", "ref:", "buy goods", "paybill"
  ];
  const hasKeyword = transactionKeywords.some(kw => smsText.toLowerCase().includes(kw));
  if (!hasKeyword) {
    console.log("[nvidia-parser] Message does not contain transaction keywords. Skipping LLM.");
    return null;
  }

  const systemPrompt = `You are a financial transaction parser. You receive SMS alerts from banks or mobile money in Kenya.
Your job is to parse the transaction details into a strict JSON format.

Output JSON schema:
{
  "is_transaction": boolean,
  "amount": number,
  "currency": "KES" or other currency code,
  "type": "income" | "expense" | "transfer",
  "counterparty": string,
  "reference": string,
  "bank_name": string,
  "bank_code": string,
  "from_account_code": string | null,
  "to_account_code": string | null,
  "stated_balance": number | null,
  "transaction_cost": number | null
}

Rules:
1. Respond ONLY with a valid JSON block.
2. If the text does not contain a financial transaction, set "is_transaction" to false.
3. Be highly accurate with figures and names.`;

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `SMS Sender: ${sender || "Unknown"}\nSMS Text: "${smsText}"` }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[nvidia-parser] NVIDIA API returned error:", res.status, errText);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("[nvidia-parser] NVIDIA output did not contain JSON block:", content);
      return null;
    }

    const parsed: NvidiaParsedResult = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (err) {
    console.error("[nvidia-parser] Unexpected parsing error:", err);
    return null;
  }
}

export async function processSingleBankSms(
  supabase: AdminClient,
  smsText: string,
  targetUserId: string,
  timestamp?: string,
  sender?: string
): Promise<{ status: string; reason?: string; transaction_id?: string; amount?: number; error?: string; [key: string]: any }> {
  let parsed = parseBankSms(smsText, sender);
  let isLlmParsed = false;

  if (!parsed) {
    const llmRes = await parseBankSmsWithNvidia(smsText, sender);
    if (llmRes && llmRes.is_transaction && llmRes.amount > 0) {
      parsed = {
        amount: llmRes.amount,
        reference: llmRes.reference || "UNKNOWN",
        counterparty: llmRes.counterparty || "Unknown Merchant",
        bank: llmRes.bank_name || "Unknown Bank",
        bankCode: llmRes.bank_code || "unknown_bank",
        type: llmRes.type || "expense",
        occurredOn: timestamp ? parseMacroDroidTimestamp(timestamp) : (llmRes.occurred_on || new Date().toISOString().split("T")[0]),
        fromAccountCode: llmRes.type === "transfer" ? (llmRes.from_account_code || "bank_c") : undefined,
        toAccountCode: llmRes.type === "transfer" ? (llmRes.to_account_code || "main") : undefined,
        isIgnored: false,
        reason: "",
        currency: llmRes.currency || "KES",
        stated_balance: llmRes.stated_balance,
        transaction_cost: llmRes.transaction_cost
      } as any;
      isLlmParsed = true;
    } else {
      return { status: "ignored", reason: "not_bank_sms" };
    }
  }

  const parsedResult = parsed!;

  if (parsedResult.isIgnored) {
    return { status: "ignored", reason: parsedResult.reason };
  }

  const { amount, reference, counterparty, bank, type, accountNo, occurredOn: parsedDate } = parsedResult;

  if (!amount || amount <= 0) {
    return { status: "ignored", reason: "zero_amount" };
  }

  const occurredOn = timestamp ? parseMacroDroidTimestamp(timestamp) : parsedDate!;
  const accountCode = isLlmParsed ? (parsedResult as any).bankCode : (bank === "DTB" ? "bank_a" : bank === "IANDMBANK" ? "bank_b" : "bank_c");

  const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code, name").eq("user_id", targetUserId);
  let bankAccount = (accts ?? []).find((a: any) => a.account_code === accountCode);
  
  if (!bankAccount) {
    if (isLlmParsed) {
      const friendlyName = (parsedResult as any).bank || `${accountCode.toUpperCase()} Bank`;
      const { data: newAcc, error: createAccErr } = await supabase
        .from("accounts")
        .insert({
          user_id: targetUserId,
          account_code: accountCode,
          name: friendlyName,
          currency_code: (parsedResult as any).currency || "KES",
          opening_balance: 0,
          current_balance: 0
        })
        .select("id, name, user_id")
        .single();

      if (createAccErr) {
        return { status: "failed", error: `Failed to auto-create account for ${friendlyName}: ${createAccErr.message}` };
      }
      bankAccount = { id: newAcc.id, name: newAcc.name, user_id: newAcc.user_id, account_code: accountCode };
    } else {
      return { status: "failed", error: `${bank} account (${accountCode}) not found` };
    }
  }
  const userId = bankAccount.user_id;

  if (type === "transfer" && parsedResult.fromAccountCode && parsedResult.toAccountCode) {
    let fromAcc = (accts ?? []).find((a: any) => a.account_code === parsedResult.fromAccountCode);
    if (!fromAcc && isLlmParsed) {
      const fromName = parsedResult.fromAccountCode === "main" ? "MPESA" : `${parsedResult.fromAccountCode.toUpperCase()} Bank`;
      const { data: newAcc, error: err } = await supabase.from("accounts").insert({
        user_id: targetUserId,
        account_code: parsedResult.fromAccountCode,
        name: fromName,
        currency_code: (parsedResult as any).currency || "KES",
        opening_balance: 0,
        current_balance: 0
      }).select("id, name").single();
      if (err) return { status: "failed", error: `Failed to auto-create source account: ${err.message}` };
      fromAcc = { id: newAcc.id, name: newAcc.name, account_code: parsedResult.fromAccountCode };
    }

    let toAcc = (accts ?? []).find((a: any) => a.account_code === parsedResult.toAccountCode);
    if (!toAcc && isLlmParsed) {
      const toName = parsedResult.toAccountCode === "main" ? "MPESA" : `${parsedResult.toAccountCode.toUpperCase()} Bank`;
      const { data: newAcc, error: err } = await supabase.from("accounts").insert({
        user_id: targetUserId,
        account_code: parsedResult.toAccountCode,
        name: toName,
        currency_code: (parsedResult as any).currency || "KES",
        opening_balance: 0,
        current_balance: 0
      }).select("id, name").single();
      if (err) return { status: "failed", error: `Failed to auto-create destination account: ${err.message}` };
      toAcc = { id: newAcc.id, name: newAcc.name, account_code: parsedResult.toAccountCode };
    }

    if (!fromAcc || !toAcc) {
      return { status: "failed", error: `Transfer accounts not found for ${parsedResult.fromAccountCode} -> ${parsedResult.toAccountCode}` };
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
      parsedResult.fromAccountCode,
      parsedResult.toAccountCode,
      `Transfer: ${fromAcc.name ?? parsedResult.fromAccountCode} → ${toAcc.name ?? parsedResult.toAccountCode}`,
      (parsedResult as any).stated_balance ?? null,
      (parsedResult as any).transaction_cost ?? null
    );

    try {
      await logWebhook(supabase, smsText, "text/plain", smsText, `llm_learned:${accountCode}`, targetUserId);
    } catch (e) {
      console.warn("[bank-sms webhook] Failed to save learning log:", e);
    }

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
    currency_code: (parsedResult as any).currency || "KES",
    occurred_on: occurredOn,
    description: isLlmParsed ? `${(parsedResult as any).bank} transaction: ${counterparty}` : `${bank} transaction: ${counterparty}`,
    metadata: {
      source: "bank_sms",
      bank_transaction: true,
      reference: reference,
      bank: isLlmParsed ? accountCode : bank,
      counterparty: counterparty,
      account_no: accountNo,
      raw_sms: scrubSensitiveData(smsText),
      sender: sender,
      parsed_by_llm: isLlmParsed,
      llm_model: isLlmParsed ? "meta/llama-3.1-70b-instruct" : undefined
    }
  }).select("id").single();

  if (error) {
    return { status: "failed", error: error.message };
  }

  try {
    await logWebhook(supabase, smsText, "text/plain", smsText, `llm_learned:${accountCode}`, targetUserId);
  } catch (e) {
    console.warn("[bank-sms webhook] Failed to save learning log:", e);
  }

  return {
    status: "created",
    source: "bank_sms",
    bank: isLlmParsed ? (parsedResult as any).bank : bank!,
    amount: amount,
    type: type!,
    kind: type!,
    reference: reference!,
    counterparty: counterparty!,
    transaction_id: txn.id
  };
}

export function parse(rawText: string): Parsed | null {
  let text = cleanSms(rawText);
  text = text.replace(/due on \d{1,2}\/\d{1,2}\/\d{2,4}/gi, "");

  if (!looksLikeMpesa(text)) return null;

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

  const toSav = text.match(P.toSavings);
  if (toSav) {
    const code = savingsCodeFor(toSav[2]);
    const savBal = code === "kcb_mpesa"
      ? (text.match(P.kcbBal) ? num(text.match(P.kcbBal)![1]) : null)
      : (text.match(P.mshwariBal) ? num(text.match(P.mshwariBal)![1]) : null);
    const name = code === "kcb_mpesa" ? "KCB M-PESA" : "M-Shwari";
    return { ...base, kind: "transfer_out", amount: num(toSav[1]), txnType: "transfer", savingsCode: code, savingsBal: savBal, counterparty: name, description: `Transfer to ${name}` };
  }

  const fromSav = text.match(P.fromSavings);
  if (fromSav) {
    const code = savingsCodeFor(fromSav[2]);
    const savBal = code === "kcb_mpesa"
      ? (text.match(P.kcbBal) ? num(text.match(P.kcbBal)![1]) : null)
      : (text.match(P.mshwariBal) ? num(text.match(P.mshwariBal)![1]) : null);
    const name = code === "kcb_mpesa" ? "KCB M-PESA" : "M-Shwari";
    return { ...base, kind: "transfer_in", amount: num(fromSav[1]), txnType: "transfer", savingsCode: code, savingsBal: savBal, counterparty: name, description: `Transfer from ${name}` };
  }

  const fulizaRepay = text.match(P.fulizaRepay);
  if (fulizaRepay) {
    const remainingM   = text.match(P.fulizaRepayRemaining);
    const availLimitM  = text.match(P.fulizaFullyRepaid);
    let remainingBal = 0;
    if (remainingM) {
      remainingBal = num(remainingM[1]);
    } else if (availLimitM) {
      remainingBal = Math.max(0, 1500 - num(availLimitM[1]));
    }
    return { ...base, kind: "expense", amount: num(fulizaRepay[1]), txnType: "expense", savingsBal: null, counterparty: "Fuliza M-Pesa", description: "Fuliza repayment", fulizaOutstanding: remainingBal };
  }

  const recv = text.match(P.received);
  if (recv) {
    const cp = cleanName(recv[2]);
    return { ...base, kind: "income", amount: num(recv[1]), txnType: "income", savingsBal: null, counterparty: cp, description: `Received from ${cp}` };
  }

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

  const wd = text.match(P.withdrawn) ?? text.match(P.giveCash);
  if (wd) {
    const cp = cleanName(wd[2]);
    return { ...base, kind: "expense", amount: num(wd[1]), txnType: "expense", savingsBal: null, counterparty: cp, description: `Withdrawal at ${cp}` };
  }

  const air = text.match(P.airtime);
  if (air) {
    return { ...base, kind: "expense", amount: num(air[1] ?? air[2]), txnType: "expense", savingsBal: null, counterparty: "Safaricom", description: "Airtime purchase" };
  }

  const any = text.match(P.anyAmount);
  if (any) {
    const isInc = /received|deposit|refund|reversal|credited/i.test(text);
    return { ...base, kind: isInc ? "income" : "expense", amount: num(any[1]), txnType: isInc ? "income" : "expense", savingsBal: null, counterparty: "Unknown", description: isInc ? "M-Pesa income (review)" : "M-Pesa expense (review)", needsReview: true };
  }
  return null;
}

export function extractSmsText(rawBody: string, contentType: string): string {
  const aliases = ["body", "message", "sms", "text", "msg", "content", "sms_body"];
  const fromJson = (j: Record<string, unknown>) => {
    for (const k of aliases) if (typeof j[k] === "string" && (j[k] as string).length > 0) return j[k] as string;
    const f = Object.values(j).find((v) => typeof v === "string" && (v as string).length > 10);
    return (f as string) ?? "";
  };
  if (contentType.includes("application/json")) {
    try { return fromJson(JSON.parse(rawBody)); } catch { return ""; }
  }
  if (contentType.includes("urlencoded") || contentType.includes("multipart/form-data")) {
    try {
      const params = new URLSearchParams(rawBody);
      for (const k of aliases) { const v = params.get(k); if (v) return v; }
      for (const [, v] of params.entries()) if (typeof v === "string" && looksLikeMpesa(v)) return v;
    } catch { /* */ }
    return "";
  }
  if (rawBody.trimStart().startsWith("{")) {
    try { const ex = fromJson(JSON.parse(rawBody)); if (ex) return ex; } catch { /* */ }
  }
  return rawBody;
}

export async function setBalance(supabase: AdminClient, accountId: string, stated: number) {
  const { data: acc, error: accErr } = await supabase
    .from("accounts")
    .select("user_id, opening_balance, currency_code")
    .eq("id", accountId)
    .single();

  if (accErr || !acc) {
    throw new Error(`Account ${accountId} not found for balance recalibration`);
  }

  const openingBalance = Number(acc.opening_balance);
  const userId = acc.user_id;
  const currencyCode = acc.currency_code;

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

  const computedBalance = openingBalance + net;
  const diff = stated - computedBalance;

  if (Math.abs(diff) < 0.01) {
    return;
  }

  const txnType = diff > 0 ? "income" : "expense";
  const category = await getOrCreateCategory(supabase, userId, "Balance Adjustment", txnType);
  const occurredOn = new Date().toISOString().split("T")[0];

  const { error: insertErr } = await supabase.from("transactions").insert({
    user_id: userId,
    account_id: accountId,
    category_id: category.id,
    txn_type: txnType,
    amount: Math.abs(diff),
    currency_code: currencyCode,
    occurred_on: occurredOn,
    description: "Reconciliation Adjustment (Stated balance sync)",
    metadata: {
      source: "reconciliation_sync",
      stated_balance: stated,
      computed_balance: computedBalance,
      original_net: net,
      is_reconciliation: true,
      mpesa_receipt: `ADJ-${Date.now()}-${Math.abs(Math.round(diff * 100))}`
    }
  });

  if (insertErr) {
    throw insertErr;
  }
}

export async function getLastMpesaBalance(supabase: AdminClient, accountId: string): Promise<number | null> {
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

export async function inferFulizaRepayment(
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

export async function upsertAutoDebt(
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

export async function captureDebug(rawBody: string, contentType: string, extracted: string, reason: string) {
  console.log(
    `[captureDebug] reason: ${reason}, contentType: ${contentType}, ` +
    `rawBody: ${rawBody.slice(0, 500)}, extracted: ${extracted.slice(0, 300)}`
  );
}

export async function logWebhook(
  supabase: AdminClient,
  rawBody: string,
  contentType: string,
  smsText: string,
  reason: string,
  targetUserId?: string
) {
  try {
    let cleanRaw = rawBody;
    let cleanSms = smsText;
    
    if (containsOtp(smsText)) {
      cleanRaw = "[REDACTED OTP BODY]";
      cleanSms = "[REDACTED OTP SMS]";
    } else {
      cleanRaw = scrubSensitiveData(rawBody);
      cleanSms = scrubSensitiveData(smsText);
    }

    const { error } = await supabase.from("webhook_logs").insert({
      raw_body: cleanRaw.slice(0, 4000),
      content_type: contentType,
      sms_text: cleanSms.slice(0, 2000),
      reason,
      user_id: targetUserId || null,
    });
    if (error) console.warn("[logWebhook] insert failed:", error.message);
  } catch (err) {
    console.warn("[logWebhook] failed to persist webhook log:", err);
  }
}

export function isPlaceholder(val: string): boolean {
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

export function parseMacroDroidTimestamp(ts: string): string {
  if (!ts) return new Date().toISOString().split("T")[0];
  const cleaned = ts.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  if (/^\d+$/.test(cleaned)) {
    const num = parseInt(cleaned, 10);
    const parsed = new Date(num);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

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

export async function processSingleSms(
  supabase: AdminClient,
  smsText: string,
  targetUserId: string,
  timestamp?: string
): Promise<{ status: string; reason?: string; transaction_id?: string; amount?: number; error?: string; [key: string]: any }> {
  const { data: accts, error: acctsErr } = await supabase
    .from("accounts")
    .select("id, user_id, account_code")
    .eq("user_id", targetUserId);

  if (acctsErr || !accts) {
    return { status: "failed", error: `Failed to load accounts for user: ${acctsErr?.message}` };
  }

  const sbm = parseSbmSMS(smsText);
  if (sbm) {
    const sbmAccount = accts.find((a: any) => a.account_code === "bank_c");
    if (!sbmAccount) return { status: "failed", error: "SBM Bank account (bank_c) not found" };
    const userId = sbmAccount.user_id;

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

  const dtb = parseDtbSMS(smsText);
  if (dtb) {
    const dtbAccount = accts.find((a: any) => a.account_code === "bank_a");
    if (!dtbAccount) return { status: "failed", error: "DTB Bank account (bank_a) not found" };
    const userId = dtbAccount.user_id;

    const occurredOn = timestamp ? parseMacroDroidTimestamp(timestamp) : dtb.occurredOn;

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

  const im = parseImSMS(smsText);
  if (im) {
    const imAccount = accts.find((a: any) => a.account_code === "bank_b");
    if (!imAccount) return { status: "failed", error: "I&M Bank account (bank_b) not found" };
    const userId = imAccount.user_id;

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
    const mpesa = accts.find((a: any) => a.account_code === "main");
    if (!mpesa) return { status: "failed", error: "Main M-Pesa account not found" };
    const userId = mpesa.user_id;

    const outstanding = p.fulizaOutstanding ?? 0;
    const fee = p.fulizaFee ?? 0;
    const amount = p.fulizaAmount ?? 0;

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

    await upsertAutoDebt(adminSb, userId, "fuliza", "Safaricom Fuliza", outstanding);

    const inserted = [];

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
            metadata: { source: "sms_webhook", mpesa_receipt: feeReceipt, parent_receipt: p.receipt, tag: "fuliza", raw_sms: p.raw, fuliza_amount: amount, fuliza_fee: fee }
          }).select("id").single();
          if (txn) inserted.push({ type: "fee", id: txn.id, amount: fee });
        }
      }
    }

    // Do NOT create a separate "Fuliza Drawdown" income transaction.
    // The drawdown funds the outgoing payment (sent/paid) which arrives as a separate SMS.
    // We only record the fee and update the debt balance via upsertAutoDebt.
    // The payment SMS will carry the fuliza metadata via its receipt match.

    return { status: "created_fuliza", receipt: p.receipt, inserted };
  }

  if (p.amount <= 0) return { status: "ignored", reason: "zero_amount" };

  const mpesa = accts.find((a: any) => a.account_code === "main");
  if (!mpesa) return { status: "failed", error: "MPESA account not found" };
  const userId = mpesa.user_id;

  const occurredOn = timestamp ? parseMacroDroidTimestamp(timestamp) : p.occurredOn;

  if (p.receipt !== "UNKNOWN") {
    const { data: existing } = await supabase.from("transactions").select("id, txn_type, metadata, account_id, transfer_account_id")
      .eq("user_id", userId).contains("metadata", { mpesa_receipt: p.receipt }).maybeSingle();

    if (existing) {
      if (existing.txn_type === "transfer") {
        const fromAccCode = existing.metadata.from_account_code || "main";
        const toAccCode = existing.metadata.to_account_code || "bank_c";
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

  if (p.txnType === "transfer" && p.savingsCode) {
    const savings = (accts ?? []).find((a: any) => a.account_code === p.savingsCode);
    if (!savings) return { status: "failed", error: `${p.savingsCode} account not found` };

    const fromId = p.kind === "transfer_out" ? mpesa.id : savings.id;
    const toId   = p.kind === "transfer_out" ? savings.id : mpesa.id;
    const fromAccCode = p.kind === "transfer_out" ? "main" : p.savingsCode;
    const toAccCode = p.kind === "transfer_out" ? p.savingsCode : "main";

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

    if (p.mpesaBal !== null)   { try { await setBalance(supabase, mpesa.id, p.mpesaBal); } catch {} }
    if (p.savingsBal !== null && p.savingsBal !== undefined) { try { await setBalance(supabase, savings.id, p.savingsBal); } catch {} }

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

  const categoryName = guessMpesaCategory(p.raw, p.txnType as "income" | "expense");
  const category = await getOrCreateCategory(supabase, userId, categoryName, p.txnType as "income" | "expense");

  // If this is a sent/paid expense, check if it was funded by a Fuliza drawdown
  // (look for a Fuliza Access Fee transaction with the same parent receipt)
  let fulizaAmount: number | null = null;
  let fulizaFee: number | null = null;
  if (p.txnType === "expense" && p.receipt !== "UNKNOWN") {
    const { data: feeTxn } = await supabase
      .from("transactions")
      .select("amount, metadata")
      .eq("user_id", userId)
      .contains("metadata", { parent_receipt: p.receipt, tag: "fuliza" })
      .maybeSingle();
    if (feeTxn) {
      // Find the fuliza drawdown info from the fee transaction's metadata
      const meta = feeTxn.metadata as Record<string, any>;
      if (meta.fuliza_amount) fulizaAmount = meta.fuliza_amount;
      if (meta.fuliza_fee) fulizaFee = meta.fuliza_fee;
      // Also try to get from the debt table
      if (!fulizaAmount) {
        const { data: debt } = await supabase
          .from("debts")
          .select("metadata")
          .eq("user_id", userId)
          .eq("source_identifier", "fuliza")
          .maybeSingle();
        if (debt) {
          const dmeta = debt.metadata as Record<string, any>;
          if (dmeta.fuliza_amount) fulizaAmount = dmeta.fuliza_amount;
          if (dmeta.fuliza_fee) fulizaFee = dmeta.fuliza_fee;
        }
      }
    }
  }

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
  if (fulizaAmount !== null) metadata.fuliza_amount = fulizaAmount;
  if (fulizaFee !== null) metadata.fuliza_fee = fulizaFee;
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

  if (p.kind === "income" && p.mpesaBal !== null && prevMpesaBalanceForInference !== null) {
    const expectedAfter = prevMpesaBalanceForInference + p.amount - (p.txnCost ?? 0);
    const implied = expectedAfter - p.mpesaBal;
    if (implied >= 0.5) {
      await inferFulizaRepayment(supabase, userId, mpesa.id, implied, occurredOn, p.receipt, p.raw);
    }
  }

  if (p.txnType === "expense") {
    const searchText = `${p.description ?? ""} ${p.counterparty ?? ""} ${p.raw}`;
    await tryAutoMatchObligation(supabase, userId, txn.id, occurredOn, searchText);
  }

  try {
    if (p.description === "Fuliza repayment") {
      const remaining = p.fulizaOutstanding ?? 0;
      await upsertAutoDebt(supabase, userId, "fuliza", "Safaricom Fuliza", remaining);
    } else if (p.mpesaBal !== null && p.mpesaBal >= 1) {
      await upsertAutoDebt(supabase, userId, "fuliza", "Safaricom Fuliza", 0);
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
