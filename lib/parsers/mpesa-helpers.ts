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

export function cleanSms(raw: string): string {
  return raw.replace(/^From\s*:\s*.+[\r\n]+/i, "").trim();
}

export function looksLikeMpesa(t: string): boolean {
  return (/confirmed/i.test(t) && /ksh\s?[\d,]/i.test(t)) || /(?:new\s+|your\s+)?m-?pesa\s+balance\s+is\s+(?:ksh\s?)?([\d,]+\.?\d*)/i.test(t) || /\b[A-Z0-9]{10}\b\s+confirmed/i.test(t);
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
