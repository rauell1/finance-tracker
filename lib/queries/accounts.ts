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
    let txns: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error: qErr } = await supabase
        .from("transactions")
        .select("account_id, transfer_account_id, amount, txn_type, metadata")
        .or(`account_id.in.(${ids.join(",")}),transfer_account_id.in.(${ids.join(",")})`)
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (qErr) throw qErr;
      if (!data || data.length === 0) break;
      txns = txns.concat(data);
      if (data.length < pageSize) break;
      page++;
    }
    
    for (const r of txns ?? []) {
      // Ignore counter transactions to avoid double counting transfers
      const isCounter = r.metadata && (r.metadata as any).is_transfer_counter === true;
      if (isCounter) continue;

      const amt = Number(r.amount);

      if (r.txn_type === "income") {
        if (balances[r.account_id] !== undefined) {
          balances[r.account_id] += amt;
        }
      } else if (r.txn_type === "expense") {
        if (balances[r.account_id] !== undefined) {
          balances[r.account_id] -= amt;
        }
      } else if (r.txn_type === "transfer") {
        // Outflow from source account
        if (balances[r.account_id] !== undefined) {
          balances[r.account_id] -= amt;
        }
        // Inflow to destination account
        if (r.transfer_account_id && balances[r.transfer_account_id] !== undefined) {
          balances[r.transfer_account_id] += amt;
        }
      }
    }
  }
  return accounts.map((a) => ({ ...a, current_balance: Number(a.opening_balance) + (balances[a.id] ?? 0) }));
}
