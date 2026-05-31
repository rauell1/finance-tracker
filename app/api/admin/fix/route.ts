import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ONE-TIME fix endpoint — rename accounts + clean test data
// DELETE THIS FILE after running once
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results: Record<string, unknown> = {};

  // 1. Rename accounts
  const renames = [
    { code: "main",   name: "MPESA"    },
    { code: "bank_a", name: "DTB Bank" },
    { code: "bank_b", name: "I&M Bank" },
    { code: "bank_c", name: "SBM Bank" },
  ];

  for (const r of renames) {
    const { error } = await supabase
      .from("accounts")
      .update({ name: r.name })
      .eq("account_code", r.code);
    results[`rename_${r.code}`] = error ? `ERROR: ${error.message}` : "ok";
  }

  // 2. Delete test transaction (receipt UEVLA5ZFU3 inserted during debugging)
  const { error: delErr, count } = await supabase
    .from("transactions")
    .delete({ count: "exact" })
    .contains("metadata", { mpesa_receipt: "UEVLA5ZFU3" });
  results.delete_test_txn = delErr ? `ERROR: ${delErr.message}` : `deleted ${count} rows`;

  // 3. Verify
  const { data: accounts } = await supabase
    .from("accounts")
    .select("account_code, name")
    .order("account_code");
  results.accounts = accounts;

  const { count: txnCount } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true });
  results.transaction_count = txnCount;

  return NextResponse.json({ status: "done", results });
}
