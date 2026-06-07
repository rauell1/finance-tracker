import { createClient } from "@/lib/supabase/server";
import type { Transaction, PaginatedResponse } from "@/types/domain";
import { transactionFilterSchema } from "@/lib/validators/transaction";

// Explicit FK hints prevent PGRST201 (ambiguous FK) since transactions has
// two FK columns pointing to accounts (account_id and transfer_account_id).
const TXN_SELECT =
  "id, user_id, account_id, transfer_account_id, category_id, txn_type, amount, currency_code, occurred_on, description, metadata, created_at, updated_at, " +
  "account:accounts!account_id(id, name, account_code), " +
  "category:categories!category_id(id, name, type, color), " +
  "transfer_account:accounts!transfer_account_id(id, name, account_code)";

export async function getTransactions(rawFilter = {}): Promise<PaginatedResponse<Transaction>> {
  const supabase = await createClient();
  const filter = transactionFilterSchema.parse(rawFilter);
  const offset = (filter.page - 1) * filter.limit;

  let query = supabase
    .from("transactions")
    .select(TXN_SELECT, { count: "exact" })
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + filter.limit - 1)
    .or("metadata->>is_transfer_counter.is.null,metadata->>is_transfer_counter.neq.true")
    .or("metadata->>source.is.null,metadata->>source.neq.webhook_debug");

  if (filter.account_id) query = query.eq("account_id", filter.account_id);
  if (filter.category_id) query = query.eq("category_id", filter.category_id);
  if (filter.txn_type) query = query.eq("txn_type", filter.txn_type);
  if (filter.date_from) query = query.gte("occurred_on", filter.date_from);
  if (filter.date_to) {
    query = query.lte("occurred_on", filter.date_to);
  } else {
    // Default: only show transactions up to today in East Africa Time (UTC+3)
    const eatOffset = 3 * 60 * 60 * 1000;
    const today = new Date(Date.now() + eatOffset).toISOString().split("T")[0];
    query = query.lte("occurred_on", today);
  }
  if (filter.search) query = query.ilike("description", `%${filter.search}%`);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data as unknown as Transaction[],
    total: count ?? 0,
    page: filter.page,
    limit: filter.limit,
    totalPages: Math.ceil((count ?? 0) / filter.limit),
  };
}

export async function createTransaction(input: {
  user_id: string;
  account_id: string;
  category_id: string;
  txn_type: "income" | "expense";
  amount: number;
  currency_code: string;
  occurred_on: string;
  description: string | null;
}): Promise<Transaction> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: input.user_id,
      account_id: input.account_id,
      category_id: input.category_id,
      txn_type: input.txn_type,
      amount: input.amount,
      currency_code: input.currency_code,
      occurred_on: input.occurred_on,
      description: input.description,
    })
    .select("*, account:accounts!account_id(id, name, account_code), category:categories!category_id(id, name, type, color)")
    .single();
  if (error) throw error;
  return data as unknown as Transaction;
}

export async function createTransfer(input: {
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  currency_code: string;
  occurred_on: string;
  description: string | null;
}): Promise<{ from: Transaction; to: Transaction }> {
  const supabase = await createClient();
  const groupId = crypto.randomUUID();
  const { data, error } = await supabase
    .from("transactions")
    .insert([
      {
        user_id: input.user_id,
        account_id: input.from_account_id,
        transfer_account_id: input.to_account_id,
        txn_type: "transfer",
        amount: input.amount,
        currency_code: input.currency_code,
        occurred_on: input.occurred_on,
        description: input.description,
        metadata: { transfer_group_id: groupId },
      },
      {
        user_id: input.user_id,
        account_id: input.to_account_id,
        transfer_account_id: input.from_account_id,
        txn_type: "transfer",
        amount: input.amount,
        currency_code: input.currency_code,
        occurred_on: input.occurred_on,
        description: input.description,
        metadata: { transfer_group_id: groupId, is_transfer_counter: true },
      },
    ])
    .select(
      "*, account:accounts!account_id(id, name, account_code), transfer_account:accounts!transfer_account_id(id, name, account_code)"
    );
  if (error) throw error;
  return { from: data[0] as unknown as Transaction, to: data[1] as unknown as Transaction };
}

export async function updateTransaction(id: string, updates: Record<string, unknown>): Promise<Transaction> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .select("*, account:accounts!account_id(id, name, account_code), category:categories!category_id(id, name, type, color)")
    .single();
  if (error) throw error;
  return data as unknown as Transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: txn } = await supabase.from("transactions").select("txn_type, metadata").eq("id", id).single();
  if (txn?.txn_type === "transfer" && txn.metadata) {
    const meta = txn.metadata as Record<string, unknown>;
    if (meta.transfer_group_id) {
      await supabase
        .from("transactions")
        .delete()
        .eq("txn_type", "transfer")
        .contains("metadata", { transfer_group_id: meta.transfer_group_id });
      return;
    }
  }
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}

export async function getRecentTransactions(limit = 5): Promise<Transaction[]> {
  const supabase = await createClient();
  const eatOffset = 3 * 60 * 60 * 1000;
  const today = new Date(Date.now() + eatOffset).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("transactions")
    .select("*, account:accounts!account_id(id, name, account_code), category:categories!category_id(id, name, type, color)")
    .neq("txn_type", "transfer")
    .lte("occurred_on", today)
    .or("metadata->>source.is.null,metadata->>source.neq.webhook_debug")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as unknown as Transaction[];
}
