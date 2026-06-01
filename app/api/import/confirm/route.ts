import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ParsedRow } from "../route";

interface ConfirmBody {
  rows: ParsedRow[];
  account_id: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: ConfirmBody = await request.json();
  const { rows, account_id } = body;

  if (!account_id) return NextResponse.json({ error: "account_id required" }, { status: 400 });
  if (!rows?.length) return NextResponse.json({ imported: 0, skipped: 0, errors: [] });

  // Verify account belongs to user
  const { data: account } = await supabase
    .from("accounts")
    .select("id, currency_code")
    .eq("id", account_id)
    .eq("user_id", user.id)
    .single();
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  // Load categories for this user
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", user.id);

  const catMap = new Map<string, { id: string; type: string }>();
  (categories ?? []).forEach((c) => catMap.set(c.name.toLowerCase(), { id: c.id, type: c.type }));

  // Fallback: first income / expense category
  const fallbackIncome = (categories ?? []).find((c) => c.type === "income");
  const fallbackExpense = (categories ?? []).find((c) => c.type === "expense");

  // Existing M-Pesa receipts for this user - to skip duplicates on re-import
  const { data: existing } = await supabase
    .from("transactions")
    .select("metadata")
    .eq("user_id", user.id)
    .not("metadata->>mpesa_receipt", "is", null);
  const existingReceipts = new Set(
    (existing ?? [])
      .map((t) => (t.metadata as Record<string, unknown>)?.mpesa_receipt as string | undefined)
      .filter(Boolean)
  );

  const inserts: object[] = [];
  const errors: string[] = [];
  let duplicates = 0;

  for (const row of rows) {
    if (!row.date || !row.amount || row.amount <= 0) {
      errors.push(`Row ${row.raw_index}: invalid date or amount`);
      continue;
    }

    // Skip if this receipt already exists (webhook or earlier import)
    if (row.receipt && existingReceipts.has(row.receipt)) {
      duplicates++;
      continue;
    }

    const cat = catMap.get(row.category_name.toLowerCase())
      ?? (row.txn_type === "income"
        ? (fallbackIncome ? { id: fallbackIncome.id } : null)
        : (fallbackExpense ? { id: fallbackExpense.id } : null));

    if (!cat) {
      errors.push(`Row ${row.raw_index}: no matching category`);
      continue;
    }

    inserts.push({
      user_id: user.id,
      account_id,
      category_id: cat.id,
      txn_type: row.txn_type,
      amount: row.amount,
      currency_code: account.currency_code ?? "KES",
      occurred_on: row.date,
      description: row.description || null,
      metadata: {
        source: "csv_import",
        counterparty: row.counterparty ?? null,
        mpesa_receipt: row.receipt ?? null,
        balance_after: row.balance_after ?? null,
      },
    });
    if (row.receipt) existingReceipts.add(row.receipt);
  }

  if (inserts.length === 0) {
    return NextResponse.json({ imported: 0, skipped: rows.length, duplicates, errors });
  }

  const { error: insertError } = await supabase.from("transactions").insert(inserts);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: inserts.length,
    duplicates,
    skipped: rows.length - inserts.length - errors.length - duplicates,
    errors,
  });
}
