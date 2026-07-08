import { Suspense } from "react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Debt } from "@/types/domain";
import { PeriodSelector } from "./period-selector";
import { ShieldCheck, ShieldAlert, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface HeroBannerProps {
  totalBalance: number;
  netCashflow: number;
  debts: Debt[];
  period: "month" | "quarter" | "year" | "all";
}

function greeting(): string {
  const hourInNairobi = Number(
    new Intl.DateTimeFormat("en-KE", { hour: "numeric", hour12: false, timeZone: "Africa/Nairobi" }).format(new Date())
  );
  if (hourInNairobi < 12) return "Good morning";
  if (hourInNairobi < 17) return "Good afternoon";
  return "Good evening";
}

export function HeroBanner({ totalBalance, netCashflow, debts, period }: HeroBannerProps) {
  const fuliza = debts.find((d) => d.source_identifier === "fuliza");
  const fulizaOwed = fuliza ? Number(fuliza.current_balance) : 0;
  const balanceStr = formatCurrency(totalBalance);
  const parts = balanceStr.split(" ");
  const currency = parts.length > 1 ? parts[0] : "";
  const amount = parts.length > 1 ? parts[1] : balanceStr;
  const periodLabel = period === "quarter" ? "this quarter" : period === "year" ? "this year" : period === "all" ? "all time" : "this month";

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#524CF2] via-[#4A44E0] to-[#332DA8] text-white shadow-lg shadow-[#524CF2]/20">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-white/[0.06] blur-3xl" />
      {/* Fine grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-white/70">{greeting()}, Roy</p>
            <p className="text-xs font-semibold text-white/50 mt-3 uppercase tracking-[0.14em]">Net worth today</p>
            <p className="mt-1 flex items-baseline gap-2 animate-rise">
              {currency && (
                <span className="text-base font-bold text-white/50 uppercase tracking-wider select-none">{currency}</span>
              )}
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">{amount}</span>
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {/* Fuliza status pill */}
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border backdrop-blur-sm",
                fulizaOwed > 0
                  ? "bg-rose-500/25 border-rose-300/30 text-rose-100"
                  : "bg-emerald-500/25 border-emerald-300/30 text-emerald-100"
              )}>
                {fulizaOwed > 0 ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                {fulizaOwed > 0
                  ? `Fuliza: ${formatCurrency(fulizaOwed)} owed`
                  : "Fuliza clear · KES 1,500 available"}
              </span>

              {/* Net cashflow pill */}
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border backdrop-blur-sm",
                netCashflow >= 0
                  ? "bg-emerald-500/25 border-emerald-300/30 text-emerald-100"
                  : "bg-rose-500/25 border-rose-300/30 text-rose-100"
              )}>
                {netCashflow >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {netCashflow >= 0 ? "+" : "−"}{formatCurrency(Math.abs(netCashflow))} {periodLabel}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <Suspense fallback={<div className="h-10 w-64 rounded-2xl bg-white/10" />}>
              <PeriodSelector variant="hero" />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
