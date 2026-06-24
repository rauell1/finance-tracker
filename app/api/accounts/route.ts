import { NextResponse } from "next/server";
import { getAccounts } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const accounts = await getAccounts();
    return NextResponse.json(accounts);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch accounts";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
