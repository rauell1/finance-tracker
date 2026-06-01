import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
function categorise(description: string, txnType: "income" | "expense"): string {
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
  return txnType === "income" ? "Other Income" : "Other Expense";
}

// ── Date parsing ──────────────────────────────────────────────────────────────
function parseDate(raw: string): string | null {
  raw = raw.trim();
  // DD/MM/YYYY HH:mm:ss  or  DD/MM/YYYY
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // YYYY-MM-DD
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  return null;
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

// ── M-Pesa parser ─────────────────────────────────────────────────────────────
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
    const date = parseDate(row[iDate] ?? "");
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
      category_name: categorise(description, txn_type),
      raw_index: idx,
      counterparty,
      receipt: iReceipt >= 0 ? row[iReceipt]?.trim() : undefined,
      balance_after: Number.isNaN(balanceRaw) ? null : balanceRaw,
    });
  });
  return parsed.slice(0, MAX_ROWS);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();
  const { headers, rows } = parseCsv(text);

  if (headers.length === 0) return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

  const isMpesa = headers.some((h) => h.includes("Receipt No.") || h.includes("Completion Time"));

  if (isMpesa) {
    const parsed = parseMpesa(headers, rows);
    return NextResponse.json({ rows: parsed, format: "mpesa", headers });
  }

  // Generic - return headers so the client can map them
  return NextResponse.json({ rows: [], format: "generic", headers, rawRows: rows.slice(0, MAX_ROWS) });
}
