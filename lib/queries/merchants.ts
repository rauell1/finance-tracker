import { createClient } from "@/lib/supabase/server";
import { getMonthStart } from "@/lib/utils";

export interface MerchantSpend {
  merchant: string;
  total: number;
  count: number;
  category_name: string | null;
  category_color: string | null;
  avg: number;
}

export interface AccountSpend {
  account_id: string;
  account_name: string;
  account_code: string;
  income: number;
  expense: number;
  txn_count: number;
}

/**
 * Derive the merchant/establishment name for a transaction.
 * Priority: metadata.counterparty (webhook + rich CSV) → cleaned description.
 */
function deriveMerchant(t: {
  description: string | null;
  metadata: Record<string, unknown> | null;
}): string {
  const cp = t.metadata?.counterparty as string | undefined;
  if (cp && cp !== "Unknown") return normaliseMerchant(cp);
  if (t.description) {
    // Strip leading verbs like "Paid to ", "Received from ", "Withdrawal at "
    const cleaned = t.description
      .replace(/^(paid to|received from|withdrawal at|sent to|bought from)\s+/i, "")
      .trim();
    return normaliseMerchant(cleaned || t.description);
  }
  return "Unknown";
}

/** Collapse phone numbers, casing, and till noise so the same merchant groups together. */
function normaliseMerchant(raw: string): string {
  return raw
    .replace(/\b\d{9,12}\b/g, "")        // strip phone numbers
    .replace(/\b\d{5,7}\b/g, "")         // strip till/paybill numbers
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, 40) || "UNKNOWN";
}

/** Top establishments by spend for a given month (defaults to current). */
export async function getMerchantSpend(
  month?: string,
  limit = 15
): Promise<MerchantSpend[]> {
  const supabase = await createClient();
  const targetMonth = month ?? getMonthStart(new Date());
  const end = new Date(targetMonth + "T00:00:00");
  end.setMonth(end.getMonth() + 1);

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, description, metadata, category:categories!category_id(name, color)")
    .eq("txn_type", "expense")
    .gte("occurred_on", targetMonth)
    .lt("occurred_on", end.toISOString().split("T")[0]);

  if (error) throw error;

  const map = new Map<string, MerchantSpend>();
  for (const row of data ?? []) {
    const merchant = deriveMerchant({
      description: row.description,
      metadata: row.metadata as Record<string, unknown> | null,
    });
    const cat = Array.isArray(row.category) ? row.category[0] : row.category;
    const amt = Number(row.amount);
    const existing = map.get(merchant);
    if (existing) {
      existing.total += amt;
      existing.count += 1;
      existing.avg = existing.total / existing.count;
    } else {
      map.set(merchant, {
        merchant,
        total: amt,
        count: 1,
        avg: amt,
        category_name: cat?.name ?? null,
        category_color: cat?.color ?? null,
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/** Spend + income grouped per account for a given month. */
export async function getAccountSpend(month?: string): Promise<AccountSpend[]> {
  const supabase = await createClient();
  const targetMonth = month ?? getMonthStart(new Date());
  const end = new Date(targetMonth + "T00:00:00");
  end.setMonth(end.getMonth() + 1);
  const endStr = end.toISOString().split("T")[0];

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, account_code")
    .eq("is_archived", false)
    .order("account_code");
  if (!accounts) return [];

  const { data: txns } = await supabase
    .from("transactions")
    .select("account_id, amount, txn_type")
    .gte("occurred_on", targetMonth)
    .lt("occurred_on", endStr)
    .in("txn_type", ["income", "expense"]);

  return accounts.map((a) => {
    const rows = (txns ?? []).filter((t) => t.account_id === a.id);
    return {
      account_id: a.id,
      account_name: a.name,
      account_code: a.account_code,
      income: rows.filter((r) => r.txn_type === "income").reduce((s, r) => s + Number(r.amount), 0),
      expense: rows.filter((r) => r.txn_type === "expense").reduce((s, r) => s + Number(r.amount), 0),
      txn_count: rows.length,
    };
  });
}
