import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ParsedRow } from "../route";

interface ConfirmBody {
  rows: ParsedRow[];
  account_id: string;
}

// Recompute an account's opening_balance so its computed balance equals `stated`.
async function setBalance(supabase: any, accountId: string, stated: number) {
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
    .select("id, account_code, currency_code")
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

  // Load existing transactions in the range of imported dates for advanced reconciliation
  const dates = rows.map(r => new Date(r.date).getTime()).filter(Boolean);
  let existingTxns: any[] = [];
  if (dates.length > 0) {
    const minDate = new Date(Math.min(...dates) - 2 * 24 * 3600 * 1000).toISOString().split("T")[0];
    const maxDate = new Date(Math.max(...dates) + 2 * 24 * 3600 * 1000).toISOString().split("T")[0];
    
    const { data } = await supabase
      .from("transactions")
      .select("id, amount, occurred_on, txn_type, metadata")
      .eq("user_id", user.id)
      .eq("account_id", account_id)
      .gte("occurred_on", minDate)
      .lte("occurred_on", maxDate);
      
    existingTxns = data ?? [];
  }

  const inserts: object[] = [];
  const errors: string[] = [];
  let duplicates = 0;
  const matchedExistingIds = new Set<string>();

  for (const row of rows) {
    if (!row.date || !row.amount || row.amount <= 0) {
      errors.push(`Row ${row.raw_index}: invalid date or amount`);
      continue;
    }

    // Advanced Deduplication matching (Checking Date +/- 1 Day & Amount & Type)
    const isDuplicate = existingTxns.some(t => {
      if (matchedExistingIds.has(t.id)) return false;
      const isSameAmount = Math.abs(Number(t.amount) - row.amount) < 0.01;
      const isSameType = t.txn_type === row.txn_type ||
        (t.txn_type === "transfer" && (
          (row.txn_type === "income" && t.transfer_account_id === account_id) ||
          (row.txn_type === "expense" && t.account_id === account_id)
        ));
      
      const tTime = new Date(t.occurred_on).getTime();
      const rowTime = new Date(row.date).getTime();
      const isCloseDate = Math.abs(tTime - rowTime) <= 1 * 24 * 3600 * 1000;
      
      // Also match if metadata receipt matches exactly
      const tMpesaReceipt = t.metadata?.mpesa_receipt;
      const tSbmReceipt = t.metadata?.sbm_receipt;
      const isReceiptMatch = row.receipt && (tMpesaReceipt === row.receipt || tSbmReceipt === row.receipt);
      
      if (isReceiptMatch || (isSameAmount && isSameType && isCloseDate)) {
        matchedExistingIds.add(t.id);
        return true;
      }
      return false;
    });

    if (isDuplicate) {
      duplicates++;
      continue;
    }

    let cat = catMap.get(row.category_name.toLowerCase());
    if (!cat) {
      const colorMap: Record<string, string> = {
        "funds received": "#10B981",
        "other income": "#84CC16",
        "other expense": "#64748B",
        "utilities": "#EC4899",
        "food & dining": "#F97316",
        "transport": "#3B82F6",
        "housing": "#8B5CF6",
        "healthcare": "#EF4444",
        "subscriptions": "#D946EF",
      };
      const color = colorMap[row.category_name.toLowerCase()] ?? (row.txn_type === "income" ? "#10B981" : "#64748B");
      
      const { data: newCat } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: row.category_name,
          type: row.txn_type,
          color,
          is_system: false,
        })
        .select("id, name, type")
        .maybeSingle();

      if (newCat) {
        cat = { id: newCat.id, type: newCat.type };
        catMap.set(row.category_name.toLowerCase(), cat);
      } else {
        cat = row.txn_type === "income"
          ? (fallbackIncome ? { id: fallbackIncome.id, type: fallbackIncome.type } : undefined)
          : (fallbackExpense ? { id: fallbackExpense.id, type: fallbackExpense.type } : undefined);
      }
    }

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
  }

  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from("transactions").insert(inserts);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // Calibrate running balances using the latest balance_after if present in rows
  const rowsWithBalance = rows.filter(r => r.balance_after !== null && r.balance_after !== undefined);
  if (rowsWithBalance.length > 0) {
    // Get the latest row by date
    const latestRow = rowsWithBalance.reduce((latest, current) => {
      return new Date(current.date) > new Date(latest.date) ? current : latest;
    }, rowsWithBalance[0]);
    if (latestRow.balance_after !== null && latestRow.balance_after !== undefined) {
      await setBalance(supabase, account_id, latestRow.balance_after);
    }
  }

  return NextResponse.json({
    imported: inserts.length,
    duplicates,
    skipped: rows.length - inserts.length - errors.length - duplicates,
    errors,
  });
}
