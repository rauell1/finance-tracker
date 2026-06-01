import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== "cLS4oOhHsVYmA8wiv1tG3PWZReyu06zK") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rqyikracpmpjhjvdtbxi.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY missing" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch all accounts
  const { data: accounts, error: aErr } = await supabase.from("accounts").select("*");
  // Fetch all debts
  const { data: debts, error: dErr } = await supabase.from("debts").select("*");

  return NextResponse.json({
    accounts,
    debts,
    errors: { aErr: aErr?.message, dErr: dErr?.message }
  });
}
