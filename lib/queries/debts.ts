import { createClient } from "@/lib/supabase/server";
import type { Debt, DebtType } from "@/types/domain";
import { findExpenseCategory } from "@/lib/queries/category-lookup";

export async function getDebts(includeInactive = false): Promise<Debt[]> {
  const supabase = await createClient();
  let q = supabase.from("debts").select("*").order("current_balance", { ascending: false });
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Debt[];
}

export async function createDebt(input: {
  user_id: string;
  creditor: string;
  debt_type?: DebtType;
  principal?: number;
  current_balance?: number;
  interest_rate?: number | null;
  monthly_payment?: number | null;
  due_date?: string | null;
  currency_code?: string;
  notes?: string | null;
}): Promise<Debt> {
  const supabase = await createClient();
  const payload = {
    user_id: input.user_id,
    creditor: input.creditor,
    debt_type: input.debt_type ?? "loan",
    principal: input.principal ?? 0,
    current_balance: input.current_balance ?? input.principal ?? 0,
    interest_rate: input.interest_rate ?? null,
    monthly_payment: input.monthly_payment ?? null,
    due_date: input.due_date ?? null,
    currency_code: input.currency_code ?? "KES",
    notes: input.notes ?? null,
  };
  const { data, error } = await supabase.from("debts").insert(payload).select("*").single();
  if (error) throw error;
  return data as Debt;
}

export async function updateDebt(id: string, updates: Record<string, unknown>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("debts").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteDebt(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("debts").delete().eq("id", id);
  if (error) throw error;
}

export async function recordPayment(
  id: string,
  amount: number,
  accountId: string,
  occurredOn?: string
): Promise<{ debt_id: string; transaction_id: string; new_balance: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  if (amount <= 0) throw new Error("Amount must be positive");

  const { data: debt, error: debtErr } = await supabase.from("debts").select("*").eq("id", id).single();
  if (debtErr || !debt) throw debtErr ?? new Error("Debt not found");

  const categoryId = await findExpenseCategory(supabase, user.id);

  const occurred = occurredOn ?? new Date().toISOString().split("T")[0];

  const { data: txn, error: txnErr } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      account_id: accountId,
      category_id: categoryId,
      txn_type: "expense",
      amount,
      currency_code: debt.currency_code,
      occurred_on: occurred,
      description: `Debt payment: ${debt.creditor}`,
      metadata: { source: "debt_payment", debt_id: id },
    })
    .select("id")
    .single();
  if (txnErr) throw txnErr;

  const newBalance = Math.max(0, Number(debt.current_balance) - amount);
  const updates: Record<string, unknown> = { current_balance: newBalance };
  if (newBalance === 0) updates.is_active = false;

  const { error: updErr } = await supabase.from("debts").update(updates).eq("id", id);
  if (updErr) throw updErr;

  return { debt_id: id, transaction_id: txn.id, new_balance: newBalance };
}
