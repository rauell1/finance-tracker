import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTransactions, createTransaction, createTransfer } from "@/lib/queries";
import { transactionSchema, transferSchema } from "@/lib/validators/transaction";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filters = Object.fromEntries(searchParams.entries());
    const result = await getTransactions(filters);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch transactions";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create transaction";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
