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

  // Fetch recent 10 transactions
  const { data: txns, error } = await supabase
    .from("transactions")
    .select("id, amount, txn_type, occurred_on, description, metadata")
    .order("occurred_on", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message, details: error.details }, { status: 500 });
  }

  return NextResponse.json({ txns });
}
