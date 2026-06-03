import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Polyfill DOMMatrix for pdf-parse server-side compatibility in Node.js environment
if (typeof global !== "undefined" && !(global as any).DOMMatrix) {
  (global as any).DOMMatrix = class DOMMatrix {};
}

export interface ParsedRow {
  date: string;         // YYYY-MM-DD
  description: string;
  amount: number;
  txn_type: "income" | "expense";
  category_name: string;
  raw_index: number;
  counterparty?: string;   // establishment / merchant / person
  receipt?: string;        // M-Pesa receipt code
  balance_after?: number | null;
}

// Extract the establishment/merchant from an M-Pesa "Details" string.
// e.g. "Pay Bill to KPLC PREPAID" → "KPLC PREPAID"
//      "Customer Transfer to JOHN DOE" → "JOHN DOE"
//      "Merchant Payment to NAIVAS" → "NAIVAS"
function extractCounterparty(details: string): string {
  if (!details) return "Unknown";
  const cleaned = details
    .replace(/^(pay bill (online )?to|merchant payment (online )?to|customer (transfer|payment) (of funds )?(to|from)|funds received from|business payment from|buy goods (and services )?to|withdrawal (charge|at)|airtime purchase|m-?shwari|kcb m-?pesa)\s*/i, "")
    .replace(/\b\d{9,12}\b/g, "")
    .replace(/-\s*\d+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || details.trim();
}

const MAX_ROWS = 500;

// ── M-Pesa auto-categorisation ────────────────────────────────────────────────
function categorise(description: string, txnType: "income" | "expense", isMpesa = false): string {
  const d = description.toLowerCase();
  if (/kplc|kenya power|safaricom|airtel|telkom/.test(d)) return "Utilities";
  if (/naivas|carrefour|quickmart|chandarana/.test(d)) return "Food & Dining";
  if (/uber|bolt|faras|matatu/.test(d)) return "Transport";
  if (/netflix|spotify|showmax|dstv/.test(d)) return "Subscriptions";
  if (/nhif|hospital|clinic|pharmacy|chemist/.test(d)) return "Healthcare";
  if (/school|fees|university|college|tuition/.test(d)) return "Education";
  if (/airbnb|hotel|flight|kenya airways|jambojet/.test(d)) return "Travel";
  if (/salary|payroll|wages/.test(d)) return "Salary";
  if (/freelance|upwork|fiverr/.test(d)) return "Freelance";
  return txnType === "income" ? (isMpesa ? "Funds received" : "Other Income") : "Other Expense";
}

// ── Date parsing ──────────────────────────────────────────────────────────────
// ── Date parsing ──────────────────────────────────────────────────────────────
function parseDateStr(s: string): string | null {
  s = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  
  // DD-MMM-YYYY (e.g. 15-May-2026)
  const dMmmY = s.match(/^(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{4})/);
  if (dMmmY) {
    const [, d, mStr, y] = dMmmY;
    const months: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
    };
    const m = months[mStr.toLowerCase()];
    if (m) return `${y}-${m}-${d.padStart(2, "0")}`;
  }
  
  // DD/MM/YYYY or DD-MM-YYYY
  const parts = s.split(/[-/]/).map(Number);
  if (parts.length === 3) {
    if (parts[0] > 100) {
      return `${parts[0]}-${String(parts[1]).padStart(2, "0")}-${String(parts[2]).padStart(2, "0")}`;
    }
    const [d, m, y] = parts;
    const yr = y < 100 ? 2000 + y : y;
    return `${yr}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  
  return null;
}

function parseDate(raw: string): string | null {
  return parseDateStr(raw);
}

// ── CSV parser (handles quoted fields) ────────────────────────────────────────
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  return { headers, rows };
}

// ── M-Pesa CSV parser ─────────────────────────────────────────────────────────────
function parseMpesa(headers: string[], rows: string[][]): ParsedRow[] {
  const hi = (name: string) => headers.findIndex((h) => h.trim() === name);
  const iDate = hi("Completion Time");
  const iDetails = hi("Details");
  const iStatus = hi("Transaction Status");
  const iPaidIn = hi("Paid In");
  const iWithdrawn = hi("Withdrawn");
  const iReceipt = hi("Receipt No.");
  const iBalance = hi("Balance");

  const parsed: ParsedRow[] = [];
  rows.forEach((row, idx) => {
    if (iStatus >= 0 && row[iStatus]?.trim().toLowerCase() !== "completed") return;
    const date = parseDateStr(row[iDate] ?? "");
    if (!date) return;
    const description = row[iDetails]?.trim() ?? "";
    const paidIn = parseFloat((row[iPaidIn] ?? "").replace(/,/g, "")) || 0;
    const withdrawn = parseFloat((row[iWithdrawn] ?? "").replace(/,/g, "")) || 0;
    if (paidIn === 0 && withdrawn === 0) return;
    const txn_type: "income" | "expense" = paidIn > 0 ? "income" : "expense";
    const amount = txn_type === "income" ? paidIn : withdrawn;
    const counterparty = extractCounterparty(description);
    const balanceRaw = iBalance >= 0 ? parseFloat((row[iBalance] ?? "").replace(/,/g, "")) : NaN;
    parsed.push({
      date,
      description: txn_type === "income" ? `Received from ${counterparty}` : `Paid to ${counterparty}`,
      amount,
      txn_type,
      category_name: categorise(description, txn_type, true),
      raw_index: idx,
      counterparty,
      receipt: iReceipt >= 0 ? row[iReceipt]?.trim() : undefined,
      balance_after: Number.isNaN(balanceRaw) ? null : balanceRaw,
    });
  });
  return parsed.slice(0, MAX_ROWS);
}

// ── Generic Bank CSV statement parser ─────────────────────────────────────────
function parseBankCsv(headers: string[], rows: string[][], accountCode: string): ParsedRow[] {
  const hi = (names: string[]) => headers.findIndex((h) => names.some(name => h.trim().toLowerCase().includes(name)));
  
  const iDate = hi(["date", "txn date", "transaction date", "value date"]);
  const iDetails = hi(["description", "details", "narrative", "transaction details"]);
  const iDebit = hi(["debit", "withdrawal", "paid out", "amount dr", "dr"]);
  const iCredit = hi(["credit", "deposit", "paid in", "amount cr", "cr"]);
  const iAmount = hi(["amount"]);
  const iBalance = hi(["balance", "running balance"]);

  const parsed: ParsedRow[] = [];
  rows.forEach((row, idx) => {
    const rawDate = row[iDate] ?? "";
    const date = parseDateStr(rawDate);
    if (!date) return;
    
    const description = row[iDetails]?.trim() ?? "";
    if (!description) return;
    
    let paidIn = 0;
    let withdrawn = 0;
    let amount = 0;
    let txn_type: "income" | "expense" = "expense";
    
    if (iDebit >= 0 || iCredit >= 0) {
      withdrawn = parseFloat((row[iDebit] ?? "").replace(/,/g, "")) || 0;
      paidIn = parseFloat((row[iCredit] ?? "").replace(/,/g, "")) || 0;
      if (paidIn === 0 && withdrawn === 0) return;
      txn_type = paidIn > 0 ? "income" : "expense";
      amount = txn_type === "income" ? paidIn : withdrawn;
    } else if (iAmount >= 0) {
      const amtRaw = parseFloat((row[iAmount] ?? "").replace(/,/g, "")) || 0;
      if (amtRaw === 0) return;
      txn_type = amtRaw > 0 ? "income" : "expense";
      amount = Math.abs(amtRaw);
    } else {
      return;
    }
    
    const counterparty = extractCounterparty(description);
    const balanceRaw = iBalance >= 0 ? parseFloat((row[iBalance] ?? "").replace(/,/g, "")) : NaN;
    
    parsed.push({
      date,
      description: txn_type === "income" ? `Received from ${counterparty}` : `Paid to ${counterparty}`,
      amount,
      txn_type,
      category_name: categorise(description, txn_type),
      raw_index: idx,
      counterparty,
      balance_after: Number.isNaN(balanceRaw) ? null : balanceRaw,
    });
  });
  
  return parsed.slice(0, MAX_ROWS);
}

// ── PDF statement parser ──────────────────────────────────────────────────────
function parsePdfStatement(text: string, accountCode: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const parsed: ParsedRow[] = [];
  
  const dateRegex = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}[-/][A-Za-z]{3}[-/]\d{2,4}|\d{4}-\d{2}-\d{2})\b/;
  const amountRegex = /(-?\b\d[\d,]*\.\d{2}\b)/g;

  lines.forEach((line, idx) => {
    const dateMatch = line.match(dateRegex);
    if (!dateMatch) return;
    
    const dateStr = dateMatch[1];
    const date = parseDateStr(dateStr);
    if (!date) return;
    
    let rest = line.replace(dateStr, "").trim();
    const amounts = rest.match(amountRegex);
    if (!amounts || amounts.length === 0) return;
    
    let amount = parseFloat(amounts[0].replace(/,/g, ""));
    let balance_after: number | null = null;
    if (amounts.length > 1) {
      amount = parseFloat(amounts[amounts.length - 2].replace(/,/g, ""));
      balance_after = parseFloat(amounts[amounts.length - 1].replace(/,/g, ""));
    }
    
    let txn_type: "income" | "expense" = "expense";
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes("cr") || lowerLine.includes("credit") || lowerLine.includes("deposit") || lowerLine.includes("received") || lowerLine.includes("refund")) {
      txn_type = "income";
    } else if (lowerLine.includes("dr") || lowerLine.includes("debit") || lowerLine.includes("paid") || lowerLine.includes("charge") || amount < 0) {
      txn_type = "expense";
    }
    
    let description = rest;
    amounts.forEach(amt => {
      description = description.replace(amt, "");
    });
    description = description
      .replace(/\b(dr|cr|debit|credit|bal|balance)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
      
    const counterparty = extractCounterparty(description);
    
    parsed.push({
      date,
      description: txn_type === "income" ? `Received from ${counterparty}` : `Paid to ${counterparty}`,
      amount: Math.abs(amount),
      txn_type,
      category_name: categorise(description, txn_type, accountCode === "main"),
      raw_index: idx,
      counterparty,
      balance_after,
    });
  });
  
  return parsed;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const accountId = formData.get("accountId") as string | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  let accountCode = "generic";
  if (accountId) {
    const { data: account } = await supabase.from("accounts").select("account_code").eq("id", accountId).single();
    if (account) accountCode = account.account_code;
  }

  // Handle PDF files
  if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
    try {
      const { PDFParse } = require("pdf-parse");
      const buffer = Buffer.from(await file.arrayBuffer());
      const parser = new PDFParse({ data: buffer });
      const pdfData = await parser.getText();
      const parsed = parsePdfStatement(pdfData.text, accountCode);
      return NextResponse.json({ rows: parsed, format: accountCode, headers: ["Date", "Description", "Amount", "Balance"] });
    } catch (err: any) {
      return NextResponse.json({ error: `Failed to parse PDF statement: ${err.message}` }, { status: 400 });
    }
  }

  const text = await file.text();
  const { headers, rows } = parseCsv(text);

  if (headers.length === 0) return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

  const isMpesa = headers.some((h) => h.includes("Receipt No.") || h.includes("Completion Time"));

  if (isMpesa) {
    const parsed = parseMpesa(headers, rows);
    return NextResponse.json({ rows: parsed, format: "mpesa", headers });
  }

  const parsed = parseBankCsv(headers, rows, accountCode);
  return NextResponse.json({ rows: parsed, format: accountCode, headers });
}
