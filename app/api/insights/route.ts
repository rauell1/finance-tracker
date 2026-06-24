import { NextResponse } from "next/server";
import { generateInsights } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const insights = await generateInsights();
    return NextResponse.json(insights);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to generate insights";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
