import { withAuth } from "@/lib/api-utils";
import { getTransactions, createTransaction, createTransfer } from "@/lib/queries";
import { transactionSchema, transferSchema } from "@/lib/validators/transaction";
import { NextResponse } from "next/server";

export const GET = withAuth(async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const filters = Object.fromEntries(searchParams.entries());
  const result = await getTransactions(filters);
  return NextResponse.json(result);
}, "Failed to fetch transactions");

export const POST = withAuth(async ({ user, request }) => {
  const body = await request.json();

  if (body.txn_type === "transfer") {
    const parsed = transferSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const result = await createTransfer({ user_id: user.id, ...parsed.data, description: parsed.data.description ?? null });
    return NextResponse.json(result, { status: 201 });
  }

  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const result = await createTransaction({ user_id: user.id, ...parsed.data, description: parsed.data.description ?? null });
  return NextResponse.json(result, { status: 201 });
}, "Failed to create transaction");
