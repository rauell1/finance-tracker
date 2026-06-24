import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateTransaction, deleteTransaction } from "@/lib/queries";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();

    // If category_id is being changed, learn from this edit
    if (body.category_id) {
      const { data: txn } = await supabase
        .from("transactions")
        .select("category_id, metadata")
        .eq("id", id)
        .single();

      if (txn && txn.category_id !== body.category_id) {
        const meta = (txn.metadata ?? {}) as Record<string, unknown>;
        const counterparty = (meta.counterparty as string) ?? null;
        if (counterparty && counterparty.length > 1) {
          const pattern = counterparty.toLowerCase().trim();
          // Upsert: delete any existing mapping for same pattern, then insert
          await supabase
            .from("category_mappings")
            .delete()
            .eq("user_id", user.id)
            .eq("counterparty_pattern", pattern);
          await supabase
            .from("category_mappings")
            .insert({
              user_id: user.id,
              counterparty_pattern: pattern,
              category_id: body.category_id,
            });
        }
      }
    }

    const result = await updateTransaction(id, body);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update transaction";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await deleteTransaction(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete transaction";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
