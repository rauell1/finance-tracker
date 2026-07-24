import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Debt } from "@/types/domain";
import { ShieldCheck, ShieldAlert } from "lucide-react";

interface HeroBannerProps {
  totalBalance: number;
  debts: Debt[];
  userName?: string;
  fulizaLimit?: number;
}

function greeting(): string {
  const hourInNairobi = Number(
    new Intl.DateTimeFormat("en-KE", { hour: "numeric", hour12: false, timeZone: "Africa/Nairobi" }).format(new Date())
  );
  if (hourInNairobi < 12) return "Good morning";
  if (hourInNairobi < 17) return "Good afternoon";
  return "Good evening";
}

export function HeroBanner({ totalBalance, debts, userName = "Roy", fulizaLimit = 1900 }: HeroBannerProps) {
  const fuliza = debts.find((d) => d.source_identifier === "fuliza");
  const fulizaOwed = fuliza ? Number(fuliza.current_balance) : 0;
  const fulizaAvailable = Math.max(0, fulizaLimit - fulizaOwed);
  const balanceStr = formatCurrency(totalBalance);
  const parts = balanceStr.split(" ");
  const currency = parts.length > 1 ? parts[0] : "";
  const amount = parts.length > 1 ? parts[1] : balanceStr;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-[#4A44E0] to-[#2D279B] text-white shadow-md shadow-primary/10">
      {/* Subtle organic light ray */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      
      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-xs font-bold text-white/60 tracking-wide">{greeting()}, {userName}</p>
            <p className="text-[10px] font-bold text-white/40 mt-3 uppercase tracking-wider">Net Worth Today</p>
            <p className="mt-1 flex items-baseline gap-1.5 animate-rise">
              {currency && (
                <span className="text-sm font-bold text-white/50 uppercase tracking-wider select-none">{currency}</span>
              )}
              <span className="text-3xl sm:text-4xl font-black tracking-tight">{amount}</span>
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border backdrop-blur-md",
                fulizaOwed > 0
                  ? "bg-rose-500/10 border-rose-400/20 text-rose-200"
                  : "bg-emerald-500/10 border-emerald-400/20 text-emerald-200"
              )}>
                {fulizaOwed > 0 ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                {fulizaOwed > 0
                  ? `Fuliza: ${formatCurrency(fulizaOwed)} owed`
                  : `Fuliza clear · ${formatCurrency(fulizaAvailable)} available`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
