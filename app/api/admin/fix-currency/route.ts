import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ONE-TIME: Set KES as default currency across accounts + profile
// DELETE THIS FILE after running once
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results: Record<string, unknown> = {};

  // Update all accounts to KES
  const { error: accErr, count: accCount } = await supabase
    .from("accounts")
    .update({ currency_code: "KES" })
    .neq("id", "00000000-0000-0000-0000-000000000000"); // update all
  results.accounts_updated = accErr ? `ERROR: ${accErr.message}` : `${accCount} rows`;

  // Update profile preferred_currency to KES
  const { error: profErr, count: profCount } = await supabase
    .from("profiles")
    .update({ preferred_currency: "KES" })
    .neq("id", "00000000-0000-0000-0000-000000000000");
  results.profiles_updated = profErr ? `ERROR: ${profErr.message}` : `${profCount} rows`;

  // Update all existing budgets to KES
  const { error: budErr, count: budCount } = await supabase
    .from("budgets")
    .update({ currency_code: "KES" })
    .neq("id", "00000000-0000-0000-0000-000000000000");
  results.budgets_updated = budErr ? `ERROR: ${budErr.message}` : `${budCount} rows`;

  // Verify
  const { data: accounts } = await supabase
    .from("accounts")
    .select("account_code, name, currency_code")
    .order("account_code");
  results.accounts = accounts;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, preferred_currency")
    .single();
  results.profile = profile;

  return NextResponse.json({ status: "done", results });
}
