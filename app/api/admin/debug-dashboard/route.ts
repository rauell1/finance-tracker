import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMonthStart, normalizeToTarget, type ExchangeRate } from "@/lib/utils";

const DEFAULT_CURRENCY = "USD";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.MPESA_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    
    const { data: accountsRaw } = await supabase.from("accounts").select("id, opening_balance, currency_code, account_code, name").eq("is_archived", false);
    if (!accountsRaw) throw new Error("No accounts found");

    const userId = "4a49b47d-7020-4752-9daa-616da026d3f7"; // Roy Okola Otieno
    const [{ data: profile }, { data: rates }] = await Promise.all([
      supabase.from("profiles").select("preferred_currency").eq("id", userId).single(),
      supabase.from("exchange_rates").select("base_currency, quote_currency, rate, valid_on").eq("user_id", userId),
    ]);

    const baseCurrency = profile?.preferred_currency ?? DEFAULT_CURRENCY;
    const exchangeRates = (rates ?? []) as ExchangeRate[];

    const targetMonth = getMonthStart(new Date());
    const end = new Date(targetMonth + "T00:00:00");
    end.setMonth(end.getMonth() + 1);
    const endStr = end.toISOString().split("T")[0];

    const ids = accountsRaw.map((a) => a.id);
    const { data: txns } = await supabase
      .from("transactions")
      .select("id, account_id, transfer_account_id, amount, txn_type, currency_code, occurred_on, description, metadata")
      .or(`account_id.in.(${ids.join(",")}),transfer_account_id.in.(${ids.join(",")})`)
      .lt("occurred_on", endStr);

    const imId = "74055b50-8b26-44dd-a9e1-2cc05db2341f";
    const imTxnsFromQuery = txns?.filter(t => t.account_id === imId || t.transfer_account_id === imId) ?? [];

    return NextResponse.json({
      targetMonth,
      endStr,
      queryTxnsCount: txns?.length ?? 0,
      imTxnsCount: imTxnsFromQuery.length,
      imTxns: imTxnsFromQuery.slice(0, 10), // return first 10 for inspection
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
