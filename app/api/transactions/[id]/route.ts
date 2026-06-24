import { withAuth } from "@/lib/api-utils";
import { updateTransaction, deleteTransaction } from "@/lib/queries";
import { NextResponse } from "next/server";

export const PATCH = withAuth(async ({ user, supabase, request, params }) => {
  const body = await request.json();

  // If category_id is being changed, learn from this edit
  if (body.category_id) {
    const { data: txn } = await supabase
      .from("transactions")
      .select("category_id, metadata")
      .eq("id", params.id)
      .single();

    if (txn && txn.category_id !== body.category_id) {
      const meta = (txn.metadata ?? {}) as Record<string, unknown>;
      const counterparty = (meta.counterparty as string) ?? null;
      if (counterparty && counterparty.length > 1) {
        const pattern = counterparty.toLowerCase().trim();
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

  const result = await updateTransaction(params.id, body);
  return NextResponse.json(result);
}, "Failed to update transaction");

export const DELETE = withAuth(async ({ params }) => {
  await deleteTransaction(params.id);
  return new NextResponse(null, { status: 204 });
}, "Failed to delete transaction");
