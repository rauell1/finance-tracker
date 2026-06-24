import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseCsvLine, parseCsv } from "@/lib/parsers/csv";
import { parseDateStr } from "@/lib/parsers/date";
import { categorise, extractCounterparty } from "@/lib/parsers/categorise";

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



const MAX_ROWS = 500;







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
