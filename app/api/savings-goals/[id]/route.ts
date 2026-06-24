import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateSavingsGoal, deleteSavingsGoal } from "@/lib/queries";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    await updateSavingsGoal(id, body);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update goal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await deleteSavingsGoal(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete goal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
