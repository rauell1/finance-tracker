import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ONE-TIME: Import SBM bank statement + set all account balances + create Fuliza debt.
// DELETE after running.
export const maxDuration = 60;

type TxnInput = {
  date: string; amount: number; type: "income" | "expense";
  desc: string; cat: string;
};

// Parsed from SBM JIVUNIE CURRENT 0322417860001 — Feb 14 to Jun 1 2026
// Each MPESA withdrawal consolidated with its bank charges/excise/safaricom fee into one row.
const SBM_TRANSACTIONS: TxnInput[] = [
  // ── FEB 2026 ──────────────────────────────────────────────────────
  { date: "2026-02-16", amount: 2026.25, type: "expense", desc: "MPESA Withdrawal - Agent", cat: "Other Expense" },
  { date: "2026-02-16", amount: 1516.50, type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  { date: "2026-02-16", amount: 149.00,  type: "expense", desc: "Truecaller Subscription", cat: "Subscriptions" },
  { date: "2026-02-28", amount: 800.00,  type: "income",  desc: "MPESA Deposit to SBM",    cat: "Other Income" },
  { date: "2026-02-28", amount: 745.00,  type: "expense", desc: "ChatGPT Subscription",     cat: "Subscriptions" },
  { date: "2026-02-28", amount: 400.00,  type: "income",  desc: "MPESA Deposit to SBM",    cat: "Other Income" },
  { date: "2026-02-28", amount: 375.00,  type: "expense", desc: "Canva AI Subscription",    cat: "Subscriptions" },
  // ── MAR 2026 ──────────────────────────────────────────────────────
  { date: "2026-03-06", amount: 47500.00, type: "income",  desc: "Salary - Roam Electric Limited", cat: "Salary" },
  { date: "2026-03-06", amount: 2026.25,  type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  { date: "2026-03-07", amount: 15074.25, type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  { date: "2026-03-07", amount: 2026.25,  type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  { date: "2026-03-09", amount: 2026.25,  type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  { date: "2026-03-10", amount: 5049.25,  type: "expense", desc: "MPESA Withdrawal - Agent",         cat: "Other Expense" },
  { date: "2026-03-10", amount: 289.00,   type: "expense", desc: "YouTube Premium Subscription",      cat: "Subscriptions" },
  { date: "2026-03-12", amount: 2026.25,  type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  { date: "2026-03-14", amount: 2026.25,  type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  { date: "2026-03-16", amount: 149.00,   type: "expense", desc: "Truecaller Subscription",           cat: "Subscriptions" },
  { date: "2026-03-16", amount: 3037.75,  type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  { date: "2026-03-16", amount: 3037.75,  type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  { date: "2026-03-18", amount: 1014.20,  type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  { date: "2026-03-18", amount: 2026.25,  type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  { date: "2026-03-21", amount: 2026.25,  type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  { date: "2026-03-23", amount: 2026.25,  type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  { date: "2026-03-23", amount: 1014.20,  type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  { date: "2026-03-23", amount: 2737.75,  type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  // ── APR 2026 ──────────────────────────────────────────────────────
  { date: "2026-04-01", amount: 1850.00,  type: "income",  desc: "MPESA Deposit to SBM",             cat: "Other Income" },
  { date: "2026-04-01", amount: 750.00,   type: "expense", desc: "Canva AI Subscription",             cat: "Subscriptions" },
  { date: "2026-04-01", amount: 745.00,   type: "expense", desc: "ChatGPT Subscription",              cat: "Subscriptions" },
  { date: "2026-04-10", amount: 47500.00, type: "income",  desc: "Salary - Roam Electric Limited",   cat: "Salary" },
  { date: "2026-04-10", amount: 289.00,   type: "expense", desc: "YouTube Premium Subscription",      cat: "Subscriptions" },
  { date: "2026-04-10", amount: 47023.00, type: "expense", desc: "PesaLink Transfer to I&M Savings", cat: "Other Expense" },
  { date: "2026-04-15", amount: 149.00,   type: "expense", desc: "Truecaller Subscription",           cat: "Subscriptions" },
  { date: "2026-04-25", amount: 411.90,   type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
  // ── MAY 2026 ──────────────────────────────────────────────────────
  { date: "2026-05-08", amount: 3000.00,  type: "income",  desc: "PesaLink Transfer from Savings",   cat: "Other Income" },
  { date: "2026-05-08", amount: 2995.44,  type: "expense", desc: "Claude.ai Subscription",            cat: "Subscriptions" },
  { date: "2026-05-11", amount: 900.00,   type: "income",  desc: "PesaLink Transfer (Fuel expenses)", cat: "Other Income" },
  { date: "2026-05-11", amount: 289.00,   type: "expense", desc: "YouTube Premium Subscription",      cat: "Subscriptions" },
  { date: "2026-05-15", amount: 149.00,   type: "expense", desc: "Truecaller Subscription",           cat: "Subscriptions" },
  { date: "2026-05-25", amount: 461.90,   type: "expense", desc: "MPESA Withdrawal to MPESA Wallet", cat: "Other Expense" },
];

async function setBalance(
  supabase: ReturnType<typeof createAdminClient>,
  accountId: string,
  stated: number
) {
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

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const log: string[] = [];

  // 1. Fetch accounts
  const { data: accounts } = await supabase.from("accounts").select("id, account_code, user_id");
  const sbm    = accounts?.find(a => a.account_code === "bank_c");
  const dtb    = accounts?.find(a => a.account_code === "bank_a");
  const im     = accounts?.find(a => a.account_code === "bank_b");
  const mpesa  = accounts?.find(a => a.account_code === "main");
  if (!sbm || !dtb || !im || !mpesa) return NextResponse.json({ error: "Accounts not found" }, { status: 404 });
  const userId = sbm.user_id;

  // 2. Fetch category IDs
  const { data: cats } = await supabase.from("categories").select("id, name, type").eq("user_id", userId);
  function catId(name: string, type: "income" | "expense"): string | null {
    return cats?.find(c => c.name === name && c.type === type)?.id
      ?? cats?.find(c => c.type === type)?.id
      ?? null;
  }

  // 2b. Clear any previously-imported SBM transactions to avoid duplicates
  const { count: cleared } = await supabase
    .from("transactions")
    .delete({ count: "exact" })
    .eq("account_id", sbm.id)
    .contains("metadata", { bank: "sbm" });
  log.push(`Cleared existing SBM imports: ${cleared}`);

  // 3. Insert SBM transactions
  const rows = SBM_TRANSACTIONS.map(t => ({
    user_id:       userId,
    account_id:    sbm.id,
    category_id:   catId(t.cat, t.type),
    txn_type:      t.type,
    amount:        t.amount,
    currency_code: "KES",
    occurred_on:   t.date,
    description:   t.desc,
    metadata:      { source: "csv_import", bank: "sbm" },
  }));
  const { error: insertErr, count: inserted } = await supabase
    .from("transactions").insert(rows, { count: "exact" });
  if (insertErr) return NextResponse.json({ error: insertErr.message, log }, { status: 500 });
  log.push(`SBM transactions inserted: ${inserted}`);

  // 4. Set account balances
  // SBM: statement opening was 3751.60; all statement txns now in DB so opening_balance = 3751.60
  // gives computed = 3751.60 + (101950 - 105688.14) = 13.46 ✓
  await supabase.from("accounts").update({ opening_balance: 3751.60 }).eq("id", sbm.id);
  log.push("SBM opening_balance → 3751.60 (computed current = 13.46)");

  // DTB/I&M: no transactions in DB → opening_balance = stated current balance
  await supabase.from("accounts").update({ opening_balance: 52.20 }).eq("id", dtb.id);
  log.push("DTB balance → 52.20");
  await supabase.from("accounts").update({ opening_balance: 0.20 }).eq("id", im.id);
  log.push("I&M balance → 0.20");

  // MPESA: use setBalance so it accounts for 78 existing webhook transactions
  await setBalance(supabase, mpesa.id, 0.00);
  log.push("MPESA balance → 0.00 (via setBalance)");

  // 5. Fuliza debt — delete existing and re-insert cleanly
  await supabase.from("debts").delete().eq("user_id", userId).eq("source_identifier", "fuliza");
  const { error: debtErr } = await supabase.from("debts").insert({
    user_id:           userId,
    creditor:          "Safaricom Fuliza",
    debt_type:         "fuliza",
    principal:         1500.00,
    current_balance:   1375.32,
    currency_code:     "KES",
    is_active:         true,
    auto_tracked:      true,
    source_identifier: "fuliza",
    notes:             "Fuliza M-PESA overdraft. Limit KES 1,500. Auto-updated from SMS.",
  });
  if (debtErr) log.push("Fuliza insert error: " + debtErr.message);
  else log.push("Fuliza debt created: KES 1375.32 / 1500");

  // 6. Verify final state
  const { data: finalAccts } = await supabase
    .from("accounts").select("account_code, name, opening_balance").order("account_code");
  const { count: txnCount } = await supabase
    .from("transactions").select("id", { count: "exact", head: true });
  const { data: debts } = await supabase
    .from("debts").select("creditor, current_balance, is_active").eq("user_id", userId);

  return NextResponse.json({ status: "done", log, accounts: finalAccts, transaction_count: txnCount, debts });
}
