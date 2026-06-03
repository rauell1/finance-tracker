import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.MPESA_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const [
    { data: accounts },
    { data: profiles },
    { data: authUsers }
  ] = await Promise.all([
    supabase.from("accounts").select("id, name, account_code, opening_balance, user_id"),
    supabase.from("profiles").select("*"),
    supabase.auth.admin.listUsers()
  ]);

  return NextResponse.json({
    accounts,
    profiles,
    authUsers: authUsers?.users?.map(u => ({ id: u.id, email: u.email }))
  });
}
