import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "income" | "expense" | null;
    const categories = await getCategories(type ?? undefined);
    return NextResponse.json(categories);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch categories";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const category = await createCategory(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create category";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
