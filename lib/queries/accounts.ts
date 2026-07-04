import { createClient } from "@/lib/supabase/server";
import type { Account } from "@/types/domain";
export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("is_archived", false)
    .order("account_code");
  if (error) throw error;
  return (accounts ?? []).map((a) => ({
    ...a,
    current_balance: Number(a.current_balance ?? a.opening_balance),
  }));
}
