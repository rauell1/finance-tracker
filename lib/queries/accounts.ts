import { createClient } from "@/lib/supabase/server";
import type { Account } from "@/types/domain";
export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data: accounts, error } = await supabase
    .from("accounts").select("*").eq("is_archived", false).order("account_code");
  if (error) throw error;
  const ids = accounts.map((a) => a.id);
  const balances: Record<string, number> = {};
  for (const id of ids) balances[id] = 0;
  if (ids.length > 0) {
    const { data: outflows } = await supabase.from("transactions").select("account_id, amount").in("account_id", ids);
    const { data: inflows } = await supabase.from("transactions").select("transfer_account_id, amount").not("transfer_account_id", "is", null).in("transfer_account_id", ids);
    for (const r of outflows ?? []) balances[r.account_id] -= Number(r.amount);
    for (const r of inflows ?? []) { if (r.transfer_account_id) balances[r.transfer_account_id] += Number(r.amount); }
  }
  return accounts.map((a) => ({ ...a, current_balance: Number(a.opening_balance) + (balances[a.id] ?? 0) }));
}
