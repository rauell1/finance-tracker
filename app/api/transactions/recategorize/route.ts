import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_RULES } from "@/lib/parsers/sms";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Load user's category_mappings (learned from edits) - check these FIRST
    const { data: mappings } = await supabase
      .from("category_mappings")
      .select("counterparty_pattern, category_id")
      .eq("user_id", user.id);

    // Load all categories for this user
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, type")
      .eq("user_id", user.id);
    if (!categories) return NextResponse.json({ error: "No categories" }, { status: 500 });

    const catByNameType = new Map<string, string>();
    for (const c of categories) catByNameType.set(`${c.name}|${c.type}`, c.id);

    // Load all non-transfer transactions
    const { data: txns } = await supabase
      .from("transactions")
      .select("id, description, metadata, txn_type, category_id")
      .eq("user_id", user.id)
      .in("txn_type", ["income", "expense"]);

    if (!txns) return NextResponse.json({ updated: 0 });

    let updated = 0;

    for (const txn of txns) {
      const desc = txn.description ?? "";
      const meta = (txn.metadata ?? {}) as Record<string, unknown>;
      const counterparty = (meta.counterparty as string) ?? "";
      const searchText = `${desc} ${counterparty}`.toLowerCase();
      const txnType = txn.txn_type as "income" | "expense";

      let newCategoryId: string | null = null;

      // 1. Check learned category_mappings first
      if (mappings && mappings.length > 0) {
        for (const m of mappings) {
          if (searchText.includes(m.counterparty_pattern.toLowerCase())) {
            newCategoryId = m.category_id;
            break;
          }
        }
      }

      // 2. Fall back to regex rules
      if (!newCategoryId) {
        for (const rule of CATEGORY_RULES) {
          if (rule.type === txnType && rule.pattern.test(searchText)) {
            newCategoryId = catByNameType.get(`${rule.category}|${rule.type}`) ?? null;
            break;
          }
        }
      }

      // 3. Update if we found a better match and it differs
      if (newCategoryId && newCategoryId !== txn.category_id) {
        await supabase
          .from("transactions")
          .update({ category_id: newCategoryId })
          .eq("id", txn.id);
        updated++;
      }
    }

    return NextResponse.json({ updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
