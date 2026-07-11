import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  // 1. Enforce user session authentication
  const userClient = await createClient();
  const { data: { user }, error: userErr } = await userClient.auth.getUser();

  const adminEmails = [
    (process.env.ALLOWED_EMAIL || "royokola3@gmail.com").toLowerCase(),
    "info@rauell.systems"
  ];
  if (userErr || !user || !user.email || !adminEmails.includes(user.email.toLowerCase())) {
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

  // Fetch all active accounts
  const { data: accounts, error: acctsErr } = await supabase
    .from("accounts")
    .select("id, name, account_code, opening_balance")
    .eq("is_archived", false);

  if (acctsErr) {
    return NextResponse.json({ error: acctsErr.message }, { status: 500 });
  }

  const ids = accounts.map((a: any) => a.id);
  if (ids.length === 0) {
    return NextResponse.json({ accounts, txnsCount: 0, analysis: "No active accounts" });
  }

  // Fetch all transactions paginated
  let txns: any[] = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error: qErr } = await supabase
      .from("transactions")
      .select("account_id, transfer_account_id, amount, txn_type, currency_code, occurred_on, metadata, description")
      .or(`account_id.in.(${ids.join(",")}),transfer_account_id.in.(${ids.join(",")})`)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (qErr) {
      return NextResponse.json({ error: qErr.message }, { status: 500 });
    }
    if (!data || data.length === 0) break;
    txns = txns.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  // Perform balance calculation comparison for All Time
  let kpiTotalAllTime = accounts.reduce((s: number, a: any) => s + Number(a.opening_balance), 0);
  const accountBalancesAllTime: Record<string, number> = {};
  accounts.forEach((a: any) => {
    accountBalancesAllTime[a.id] = Number(a.opening_balance);
  });

  for (const t of txns) {
    const isCounter = t.metadata && (t.metadata as any).is_transfer_counter === true;
    if (isCounter) continue;

    const amt = Number(t.amount);
    const isSourceActive = ids.includes(t.account_id);
    const isDestActive = t.transfer_account_id ? ids.includes(t.transfer_account_id) : false;

    // KPI total balance calculation
    if (t.txn_type === "income") {
      if (isSourceActive) kpiTotalAllTime += amt;
    } else if (t.txn_type === "expense") {
      if (isSourceActive) kpiTotalAllTime -= amt;
    } else if (t.txn_type === "transfer") {
      if (isSourceActive) kpiTotalAllTime -= amt;
      if (isDestActive) kpiTotalAllTime += amt;
    }

    // Individual account balance calculation
    if (t.txn_type === "income" && isSourceActive) {
      accountBalancesAllTime[t.account_id] += amt;
    } else if (t.txn_type === "expense" && isSourceActive) {
      accountBalancesAllTime[t.account_id] -= amt;
    } else if (t.txn_type === "transfer") {
      if (isSourceActive) {
        accountBalancesAllTime[t.account_id] -= amt;
      }
      if (isDestActive && t.transfer_account_id) {
        accountBalancesAllTime[t.transfer_account_id] += amt;
      }
    }
  }

  const sumOfAccountBalancesAllTime = accounts.reduce((s: number, a: any) => s + (accountBalancesAllTime[a.id] ?? 0), 0);

  // Perform balance check for Month (June 2026)
  const endStrJune = "2026-07-01";
  let kpiTotalJune = accounts.reduce((s: number, a: any) => s + Number(a.opening_balance), 0);
  const accountBalancesJune: Record<string, number> = {};
  accounts.forEach((a: any) => {
    accountBalancesJune[a.id] = Number(a.opening_balance);
  });

  for (const t of txns) {
    if (t.occurred_on >= endStrJune) continue;

    const isCounter = t.metadata && (t.metadata as any).is_transfer_counter === true;
    if (isCounter) continue;

    const amt = Number(t.amount);
    const isSourceActive = ids.includes(t.account_id);
    const isDestActive = t.transfer_account_id ? ids.includes(t.transfer_account_id) : false;

    // KPI total balance calculation
    if (t.txn_type === "income") {
      if (isSourceActive) kpiTotalJune += amt;
    } else if (t.txn_type === "expense") {
      if (isSourceActive) kpiTotalJune -= amt;
    } else if (t.txn_type === "transfer") {
      if (isSourceActive) kpiTotalJune -= amt;
      if (isDestActive) kpiTotalJune += amt;
    }

    // Individual account balance calculation
    if (t.txn_type === "income" && isSourceActive) {
      accountBalancesJune[t.account_id] += amt;
    } else if (t.txn_type === "expense" && isSourceActive) {
      accountBalancesJune[t.account_id] -= amt;
    } else if (t.txn_type === "transfer") {
      if (isSourceActive) {
        accountBalancesJune[t.account_id] -= amt;
      }
      if (isDestActive && t.transfer_account_id) {
        accountBalancesJune[t.transfer_account_id] += amt;
      }
    }
  }

  const sumOfAccountBalancesJune = accounts.reduce((s: number, a: any) => s + (accountBalancesJune[a.id] ?? 0), 0);

  return NextResponse.json({
    accounts: accounts.map((a: any) => ({
      name: a.name,
      code: a.account_code,
      opening: a.opening_balance,
      calculatedAllTime: accountBalancesAllTime[a.id],
      calculatedJune: accountBalancesJune[a.id]
    })),
    txnsCount: txns.length,
    futureTxns: txns.filter((t) => t.occurred_on > "2026-06-03"),
    allTimeAnalysis: {
      kpiTotal: kpiTotalAllTime,
      sumOfAccounts: sumOfAccountBalancesAllTime,
      discrepancy: kpiTotalAllTime - sumOfAccountBalancesAllTime
    },
    juneAnalysis: {
      kpiTotal: kpiTotalJune,
      sumOfAccounts: sumOfAccountBalancesJune,
      discrepancy: kpiTotalJune - sumOfAccountBalancesJune
    }
  });
}

