import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateBudget, deleteBudget } from "@/lib/queries";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    await updateBudget(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update budget";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await deleteBudget(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete budget";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
