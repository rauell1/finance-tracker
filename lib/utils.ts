import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
const DEFAULT_LOCALE = "en-KE";

export function formatCurrency(amount: number, currency = "KES"): string {
  const formatter = new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const parts = formatter.formatToParts(Math.abs(amount));
  const code = parts.find((part) => part.type === "currency")?.value ?? currency;
  const number = parts
    .filter((part) => part.type !== "currency")
    .map((part) => part.value)
    .join("")
    .trim();
  return `${code} ${number}`.trim();
}
export function formatPercentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
export function getMonthStart(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}
export function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}
export function normalizeDescription(desc: string | null): string {
  if (!desc) return "";
  return desc.toLowerCase().trim().replace(/\s+/g, " ");
}

export interface ExchangeRate {
  base_currency: string;
  quote_currency: string;
  rate: number | string;
  valid_on: string;
}

interface NormalizeOptions {
  rates?: ExchangeRate[];
  validOn?: string;
  onMissing?: "throw" | "original";
}

function pickRate(
  rates: ExchangeRate[],
  base: string,
  quote: string,
  validOn?: string
): ExchangeRate | undefined {
  const candidates = rates
    .filter((rate) => rate.base_currency === base && rate.quote_currency === quote)
    .sort((a, b) => b.valid_on.localeCompare(a.valid_on));
  if (!candidates.length) return undefined;
  if (!validOn) return candidates[0];
  const exact = candidates.find((rate) => rate.valid_on === validOn);
  if (exact) return exact;
  return candidates.find((rate) => rate.valid_on < validOn);
}

export function normalizeToTarget(
  amount: number,
  from: string,
  to: string,
  options: NormalizeOptions = {}
): number {
  if (from === to) return amount;
  const rates = options.rates ?? [];
  const validOn = options.validOn;
  const direct = pickRate(rates, from, to, validOn);
  if (direct) return amount * Number(direct.rate);
  const inverse = pickRate(rates, to, from, validOn);
  if (inverse) return amount / Number(inverse.rate);
  const message = `Missing exchange rate from ${from} to ${to}${validOn ? ` for ${validOn}` : ""}.`;
  if (options.onMissing === "throw") {
    throw new Error(message);
  }
  console.warn(message);
  return amount;
}
