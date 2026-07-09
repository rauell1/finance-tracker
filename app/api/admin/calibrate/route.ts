import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  // 1. Enforce user session authentication
  const userClient = await createClient();
  const { data: { user }, error: userErr } = await userClient.auth.getUser();

  const allowedEmail = (process.env.ALLOWED_EMAIL || "royokola3@gmail.com").toLowerCase();
  if (userErr || !user || user.email?.toLowerCase() !== allowedEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Validate token securely if provided (timing-attack resistant)
  const secret = request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-webhook-secret");
  const expectedSecret = process.env.MPESA_WEBHOOK_SECRET;
  
  if (expectedSecret && secret) {
    const a = Buffer.from(secret);
    const b = Buffer.from(expectedSecret);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }
  } else if (!expectedSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const supabase = createAdminClient();

  // Fetch all accounts
  const { data: accounts } = await supabase.from("accounts").select("id, user_id, account_code, name, opening_balance, currency_code");
  if (!accounts) {
    return NextResponse.json({ error: "No accounts found" }, { status: 404 });
  }

  const results: Record<string, any> = {};

  const calibrationPromises = accounts.map(async (acct: any) => {
    const paramVal = request.nextUrl.searchParams.get(acct.account_code);
    
    // Compute the net change for this account using the consistent logic
    let txns: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error: qErr } = await supabase
        .from("transactions")
        .select("account_id, transfer_account_id, amount, txn_type, metadata")
        .or(`account_id.eq.${acct.id},transfer_account_id.eq.${acct.id}`)
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (qErr) throw qErr;
      if (!data || data.length === 0) break;
      txns = txns.concat(data);
      if (data.length < pageSize) break;
      page++;
    }

    let net = 0;
    for (const t of txns ?? []) {
      const isCounter = t.metadata && (t.metadata as any).is_transfer_counter === true;
      if (isCounter) continue;

      const amt = Number(t.amount);
      if (t.txn_type === "income" && t.account_id === acct.id) {
        net += amt;
      } else if (t.txn_type === "expense" && t.account_id === acct.id) {
        net -= amt;
      } else if (t.txn_type === "transfer") {
        if (t.account_id === acct.id) net -= amt;
        if (t.transfer_account_id === acct.id) net += amt;
      }
    }

    const calculated_balance = Number(acct.opening_balance) + net;

    if (paramVal !== null) {
      const stated = parseFloat(paramVal);
      if (isNaN(stated)) {
        throw new Error(`Invalid numeric value for parameter ${acct.account_code}: ${paramVal}`);
      }
      
      const diff = stated - calculated_balance;
      let reconciliationApplied = false;

      if (Math.abs(diff) >= 0.01) {
        const txnType = diff > 0 ? "income" : "expense";
        const cat = await getOrCreateCategory(supabase, acct.user_id, "Balance Adjustment", txnType);
        
        const { error: insertErr } = await supabase.from("transactions").insert({
          user_id: acct.user_id,
          account_id: acct.id,
          category_id: cat.id,
          txn_type: txnType,
          amount: Math.abs(diff),
          currency_code: acct.currency_code,
          occurred_on: new Date().toISOString().split("T")[0],
          description: "Reconciliation Adjustment (API calibrate sync)",
          metadata: {
            source: "api_calibration",
            stated_balance: stated,
            computed_balance: calculated_balance,
            original_net: net,
            is_reconciliation: true,
            mpesa_receipt: `ADJ-CAL-${Date.now()}`
          }
        });
        if (insertErr) throw insertErr;
        reconciliationApplied = true;
      }
      
      results[acct.account_code] = {
        mutated: reconciliationApplied,
        stated_target: stated,
        net_change: net,
        old_opening_balance: Number(acct.opening_balance),
        new_opening_balance: Number(acct.opening_balance), // remains unchanged
        calculated_balance: stated,
        reconciliation_applied: reconciliationApplied,
        reconciliation_amount: Math.abs(diff)
      };
    } else {
      results[acct.account_code] = {
        mutated: false,
        net_change: net,
        opening_balance: Number(acct.opening_balance),
        calculated_balance
      };
    }
  });

  try {
    await Promise.all(calibrationPromises);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Fetch all accounts to verify
  const { data: updatedAccounts } = await supabase.from("accounts").select("id, name, account_code, opening_balance");

  return NextResponse.json({
    message: "Accounts calibrated/calculated successfully",
    results,
    accounts: updatedAccounts?.map((a: any) => ({ name: a.name, code: a.account_code, opening: a.opening_balance }))
  });
}

async function getOrCreateCategory(
  supabase: any,
  userId: string,
  categoryName: string,
  type: "income" | "expense"
): Promise<{ id: string }> {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("name", categoryName)
    .eq("type", type)
    .maybeSingle();

  if (existing) return existing;

  const color = type === "income" ? "#10B981" : "#64748B";
  const { data: created } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: categoryName,
      type: type,
      color: color,
      is_system: false,
    })
    .select("id")
    .maybeSingle();

  if (created) return created;

  const { data: fb } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .limit(1)
    .maybeSingle();

  if (fb) return fb;
  throw new Error(`Category ${categoryName} could not be resolved`);
}
