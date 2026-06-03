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
    const { data: txns } = await supabase
      .from("transactions")
      .select("account_id, amount, txn_type, metadata")
      .in("account_id", ids);
    for (const r of txns ?? []) {
      const amt = Number(r.amount);
      if (r.txn_type === "income") {
        balances[r.account_id] += amt;
      } else if (r.txn_type === "expense") {
        balances[r.account_id] -= amt;
      } else if (r.txn_type === "transfer") {
        const isCounter = r.metadata && (r.metadata as any).is_transfer_counter === true;
        if (isCounter) {
          balances[r.account_id] += amt;
        } else {
          balances[r.account_id] -= amt;
        }
      }
    }
  }
  return accounts.map((a) => ({ ...a, current_balance: Number(a.opening_balance) + (balances[a.id] ?? 0) }));
}
