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
    
    // Simulating getCurrencyContext
    const { data: accountsRaw } = await supabase.from("accounts").select("id, opening_balance, currency_code, account_code, name").eq("is_archived", false);
    if (!accountsRaw) throw new Error("No accounts found");

    // Fetch profile and rates
    const userId = "4a49b47d-7020-4752-9daa-616da026d3f7"; // Roy Okola Otieno
    const [{ data: profile }, { data: rates }] = await Promise.all([
      supabase.from("profiles").select("preferred_currency").eq("id", userId).single(),
      supabase.from("exchange_rates").select("base_currency, quote_currency, rate, valid_on").eq("user_id", userId),
    ]);

    const baseCurrency = profile?.preferred_currency ?? DEFAULT_CURRENCY;
    const exchangeRates = (rates ?? []) as ExchangeRate[];

    const normalizeAmount = (amount: number, currencyCode?: string | null, occurredOn?: string) =>
      normalizeToTarget(amount, currencyCode || baseCurrency, baseCurrency, {
        rates: exchangeRates,
        validOn: occurredOn,
        onMissing: "original",
      });

    const targetMonth = getMonthStart(new Date());
    const end = new Date(targetMonth + "T00:00:00");
    end.setMonth(end.getMonth() + 1);
    const endStr = end.toISOString().split("T")[0];

    // Calculate Accounts
    const ids = accountsRaw.map((a) => a.id);
    const { data: txns } = await supabase
      .from("transactions")
      .select("account_id, transfer_account_id, amount, txn_type, currency_code, occurred_on, description, metadata")
      .or(`account_id.in.(${ids.join(",")}),transfer_account_id.in.(${ids.join(",")})`)
      .lt("occurred_on", endStr);

    const accountComparison: any[] = [];
    for (const a of accountsRaw) {
      let income = 0;
      let expense = 0;
      let lifetimeIncome = 0;
      let lifetimeExpense = 0;

      for (const t of txns ?? []) {
        const isCounter = t.metadata && (t.metadata as any).is_transfer_counter === true;
        if (isCounter) continue;

        const amt = normalizeAmount(Number(t.amount), t.currency_code, t.occurred_on);
        const isCurrentMonth = t.occurred_on >= targetMonth;

        if (t.txn_type === "income" && t.account_id === a.id) {
          lifetimeIncome += amt;
          if (isCurrentMonth) income += amt;
        } else if (t.txn_type === "expense" && t.account_id === a.id) {
          if (t.description !== "Fuliza repayment") {
            lifetimeExpense += amt;
            if (isCurrentMonth) expense += amt;
          } else {
            lifetimeExpense += amt;
          }
        } else if (t.txn_type === "transfer") {
          if (t.account_id === a.id) {
            lifetimeExpense += amt;
            if (isCurrentMonth) expense += amt;
          }
          if (t.transfer_account_id === a.id) {
            lifetimeIncome += amt;
            if (isCurrentMonth) income += amt;
          }
        }
      }

      const openingBalance = normalizeAmount(Number(a.opening_balance), a.currency_code, endStr);
      accountComparison.push({
        name: a.name,
        code: a.account_code,
        opening_balance: Number(a.opening_balance),
        openingBalance,
        lifetimeIncome,
        lifetimeExpense,
        income,
        expense,
        balance: openingBalance + lifetimeIncome - lifetimeExpense,
      });
    }

    return NextResponse.json({
      targetMonth,
      endStr,
      accountComparison
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
