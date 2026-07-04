// ─── Regular Expression Patterns ────────────────────────────────────────────────
export const P = {
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
  toSavings:    /(?:you\s+have\s+)?(?:transfer(?:r)?ed\s+)?ksh\s*([\d,]+\.?\d*)\s+(?:transfer(?:r)?ed\s+)?to\s+(?:your\s+)?(kcb m-?pesa|m-?shwari)(?:\s+account)?/i,
  fromSavings:  /(?:you\s+have\s+)?(?:transfer(?:r)?ed\s+)?ksh\s*([\d,]+\.?\d*)\s+(?:transfer(?:r)?ed\s+)?from\s+(?:your\s+)?(kcb m-?pesa|m-?shwari)(?:\s+account)?/i,
  receipt:      /\b([A-Z0-9]{10})\b/,
  date:         /on (\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  mpesaBal:     /(?:new\s+|your\s+)?m-?pesa\s+balance\s+is\s+(?:ksh\s?)?([\d,]+\.?\d*)/i,
  kcbBal:       /(?:new\s+)?kcb m-?pesa[^.]*balance is\s+(?:ksh\s?)?([\d,]+\.?\d*)/i,
  mshwariBal:   /(?:new\s+)?m-shwari[^.]*balance is\s+(?:ksh\s?)?([\d,]+\.?\d*)/i,
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

export const CATEGORY_RULES: { pattern: RegExp; category: string; type: "income" | "expense" }[] = [
  { pattern: /kplc|kenya power|umeme|power|token|stima/i, category: "Utilities", type: "expense" },
  { pattern: /safaricom|airtel|telkom|faiba|airtime|bundle|data/i, category: "Utilities", type: "expense" },
  { pattern: /water|nawasco|gas|k-?gas|progas/i, category: "Utilities", type: "expense" },
  { pattern: /naivas|carrefour|quickmart|chandarana|tuskys|uchumi|cleanshelf|eatery|eateries|restaurant|cafe|wineries|savor|kitchen|food|grill|fries/i, category: "Food & Dining", type: "expense" },
  { pattern: /uber|bolt|faras|little|indriver|matatu|fare|sgr|fuel|petrol|shell|total|rubis/i, category: "Transport", type: "expense" },
  { pattern: /netflix|spotify|showmax|dstv|gotv|youtube|subscription/i, category: "Subscriptions", type: "expense" },
  { pattern: /nhif|sha|hospital|clinic|pharmacy|chemist|medical|dawa/i, category: "Healthcare", type: "expense" },
  { pattern: /school|fees|university|college|tuition|academy/i, category: "Education", type: "expense" },
  { pattern: /airbnb|hotel|lodge|kenya airways|jambojet|flight/i, category: "Travel", type: "expense" },
  { pattern: /rent|landlord|caretaker/i, category: "Housing", type: "expense" },
  { pattern: /salary|payroll|wages|payslip/i, category: "Salary", type: "income" },
  { pattern: /freelance|upwork|fiverr|consult/i, category: "Freelance", type: "income" },
  { pattern: /dividend|interest|investment|returns|sacco/i, category: "Investment", type: "income" },
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

export const num = (s: string) => parseFloat(s.replace(/,/g, ""));

export function parseDate(s: string): string {
  const [d, m, y] = s.split("/").map(Number);
  const yr = y < 100 ? 2000 + y : y;
  return `${yr}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function cleanName(raw: string): string {
  return raw
    .replace(/\b\d{9,12}\b/g, "")     // phone numbers
    .replace(/\s+/g, " ")
    .replace(/[.\s]+$/, "")            // trailing dot/space
    .trim() || "Unknown";
}

export function cleanSms(raw: string): string {
  return raw.replace(/^From\s*:\s*.+[\r\n]+/i, "").trim();
}

export function looksLikeMpesa(t: string): boolean {
  return (/confirmed/i.test(t) && /ksh\s?[\d,]/i.test(t)) || P.mpesaBal.test(t) || /\b[A-Z0-9]{10}\b\s+confirmed/i.test(t);
}

export function parseSbmDate(s: string): string {
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

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function savingsCodeFor(label: string): "kcb_mpesa" | "mshwari" {
  return /kcb/i.test(label) ? "kcb_mpesa" : "mshwari";
}

export interface ParsedBankResult {
  isIgnored: boolean;
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

  // 5. Merchant Payments (Expense)
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
      description: `Payment to ${cp}`,
      counterparty: cp,
      occurredOn: date,
    };
  }

  return null;
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

export function parse(rawText: string): Parsed | null {
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

export function parseMacroDroidTimestamp(ts: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(ts)) {
    return ts.split(" ")[0];
  }
  const d = new Date(ts);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return new Date().toISOString().split("T")[0];
}
