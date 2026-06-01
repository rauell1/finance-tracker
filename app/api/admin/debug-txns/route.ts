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

  // Find MPESA account
  const { data: mpesaAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("account_code", "main")
    .single();

  if (!mpesaAccount) {
    return NextResponse.json({ error: "M-Pesa account not found" }, { status: 404 });
  }

  // Fetch recent 30 transactions for MPESA
  const { data: txns, error } = await supabase
    .from("transactions")
    .select("id, amount, txn_type, occurred_on, description, metadata, created_at")
    .eq("account_id", mpesaAccount.id)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ txns });
}
