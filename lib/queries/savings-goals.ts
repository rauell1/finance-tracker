import { createClient } from "@/lib/supabase/server";
import type { SavingsGoal } from "@/types/domain";

const SELECT = "id, user_id, name, target_amount, current_amount, target_date, account_id, is_completed, currency_code, created_at, updated_at, account:accounts!account_id(id, name, account_code)";

export async function getSavingsGoals(includeCompleted = false): Promise<SavingsGoal[]> {
  const supabase = await createClient();
  let q = supabase.from("savings_goals").select(SELECT).order("created_at", { ascending: false });
  if (!includeCompleted) q = q.eq("is_completed", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((g) => {
    const acct = Array.isArray(g.account) ? g.account[0] ?? null : g.account ?? null;
    return {
      ...g,
      account: acct,
      target_amount: Number(g.target_amount),
      current_amount: Number(g.current_amount),
      progress: Number(g.target_amount) > 0 ? Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100) : 0,
    } as SavingsGoal;
  });
}

export async function createSavingsGoal(input: {
  user_id: string;
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string | null;
  account_id?: string | null;
  currency_code?: string;
}): Promise<SavingsGoal> {
  const supabase = await createClient();
  const payload = {
    user_id: input.user_id,
    name: input.name,
    target_amount: input.target_amount,
    current_amount: input.current_amount ?? 0,
    target_date: input.target_date ?? null,
    account_id: input.account_id ?? null,
    currency_code: input.currency_code ?? "KES",
  };
  const { data, error } = await supabase.from("savings_goals").insert(payload).select(SELECT).single();
  if (error) throw error;
  const acct = Array.isArray(data.account) ? data.account[0] ?? null : data.account ?? null;
  return { ...data, account: acct, target_amount: Number(data.target_amount), current_amount: Number(data.current_amount), progress: 0 } as SavingsGoal;
}

export async function updateSavingsGoal(id: string, updates: Record<string, unknown>): Promise<void> {
  const supabase = await createClient();
  // Check if goal is completed
  if (typeof updates.current_amount === "number" && typeof updates.target_amount !== "number") {
    const { data: goal } = await supabase.from("savings_goals").select("target_amount").eq("id", id).single();
    if (goal && Number(updates.current_amount) >= Number(goal.target_amount)) {
      updates.is_completed = true;
    }
  }
  const { error } = await supabase.from("savings_goals").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("savings_goals").delete().eq("id", id);
  if (error) throw error;
}
