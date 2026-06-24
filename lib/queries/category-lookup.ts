import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Finds an expense category for the user, preferring "Other Expense".
 * Falls back to any expense category if "Other Expense" doesn't exist.
 * Shared between debt payments and recurring obligation payments.
 */
export async function findExpenseCategory(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "expense")
    .eq("name", "Other Expense")
    .maybeSingle();

  if (cat?.id) return cat.id;

  const { data: fallback } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "expense")
    .limit(1)
    .maybeSingle();

  if (fallback?.id) return fallback.id;

  throw new Error("No expense category available");
}
