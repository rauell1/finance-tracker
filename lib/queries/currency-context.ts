import { createClient } from "@/lib/supabase/server";
import { normalizeToTarget, type ExchangeRate } from "@/lib/utils";

const DEFAULT_CURRENCY = "USD";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface CurrencyContext {
  baseCurrency: string;
  rates: ExchangeRate[];
}

export async function getCurrencyContext(
  supabase: SupabaseClient
): Promise<CurrencyContext> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { baseCurrency: DEFAULT_CURRENCY, rates: [] };
  const [{ data: profile }, { data: rates }] = await Promise.all([
    supabase
      .from("profiles")
      .select("preferred_currency")
      .eq("id", user.id)
      .single(),
    supabase
      .from("exchange_rates")
      .select("base_currency, quote_currency, rate, valid_on")
      .eq("user_id", user.id),
  ]);
  return {
    baseCurrency: profile?.preferred_currency ?? DEFAULT_CURRENCY,
    rates: (rates ?? []) as ExchangeRate[],
  };
}

/**
 * Creates a normalizer function bound to a currency context.
 * Eliminates the repeated inline closure defined in each dashboard function.
 */
export function createNormalizer(ctx: CurrencyContext) {
  return (
    amount: number,
    currencyCode?: string | null,
    occurredOn?: string
  ): number =>
    normalizeToTarget(amount, currencyCode || ctx.baseCurrency, ctx.baseCurrency, {
      rates: ctx.rates,
      validOn: occurredOn,
      onMissing: "original",
    });
}
