import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordPayment } from "@/lib/queries";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    if (!body.amount || !body.account_id) {
      return NextResponse.json({ error: "Missing amount or account_id" }, { status: 400 });
    }
    const result = await recordPayment(id, Number(body.amount), String(body.account_id), body.occurred_on);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
