import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { KPIData } from "@/types/domain";
import { TrendingUp, TrendingDown, Wallet, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardsProps {
  data: KPIData;
}

export function KPICards({ data }: KPICardsProps) {
  const cards = [
    {
      title: "Total Balance",
      value: formatCurrency(data.totalBalance),
      icon: Wallet,
      change: null as number | null,
      bgStyle: "bg-gradient-to-br from-white to-[#F0F0FF]/30 border-[#E2E2FF] hover:border-[#524CF2]/40 shadow-sm",
      glowColor: "group-hover:bg-[#524CF2]/[0.02]",
      iconBg: "bg-[#F0F0FF] border-[#E2E2FF] text-[#524CF2] shadow-sm shadow-[#524CF2]/5",
      valueColor: "text-[#0A0D27]",
    },
    {
      title: "Monthly Income",
      value: formatCurrency(data.monthlyIncome),
      icon: TrendingUp,
      change: data.incomeChange,
      bgStyle: "bg-gradient-to-br from-white to-emerald-50/[0.15] border-[#E2E2FF] hover:border-emerald-500/40 shadow-sm",
      glowColor: "group-hover:bg-emerald-500/[0.02]",
      iconBg: "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm shadow-emerald-500/5",
      valueColor: "text-[#0A0D27]",
      invertChange: false,
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(data.monthlyExpense),
      icon: TrendingDown,
      change: data.expenseChange,
      bgStyle: "bg-gradient-to-br from-white to-rose-50/[0.15] border-[#E2E2FF] hover:border-rose-500/40 shadow-sm",
      glowColor: "group-hover:bg-rose-500/[0.02]",
      iconBg: "bg-rose-50 border-rose-100 text-rose-600 shadow-sm shadow-rose-500/5",
      valueColor: "text-[#0A0D27]",
      invertChange: true,
    },
    {
      title: "Net Cashflow",
      value: formatCurrency(data.netCashflow),
      icon: ArrowUpDown,
      change: null as number | null,
      bgStyle: data.netCashflow >= 0
        ? "bg-gradient-to-br from-white to-[#F0F0FF]/30 border-[#E2E2FF] hover:border-[#524CF2]/40 shadow-sm"
        : "bg-gradient-to-br from-white to-rose-50/[0.15] border-[#E2E2FF] hover:border-rose-500/40 shadow-sm",
      glowColor: data.netCashflow >= 0 ? "group-hover:bg-[#524CF2]/[0.02]" : "group-hover:bg-rose-500/[0.02]",
      iconBg: data.netCashflow >= 0
        ? "bg-[#F0F0FF] border-[#E2E2FF] text-[#524CF2] shadow-sm shadow-[#524CF2]/5"
        : "bg-rose-50 border-rose-100 text-rose-600 shadow-sm shadow-rose-500/5",
      valueColor: data.netCashflow >= 0 ? "text-[#524CF2]" : "text-rose-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const invertChange = "invertChange" in card ? card.invertChange : false;
        
        // Split value into KES and amount to format currency symbol smaller & lighter
        const parts = card.value.split(" ");
        const currency = parts.length > 1 ? parts[0] : "";
        const amount = parts.length > 1 ? parts[1] : card.value;

        return (
          <div
            key={card.title}
            className={cn(
              "group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#524CF2]/[0.04]",
              card.bgStyle
            )}
          >
            {/* Fine geometric backdrop grids */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E2FF_1px,transparent_1px),linear-gradient(to_bottom,#E2E2FF_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-[0.08] pointer-events-none" />

            {/* Background Glow element */}
            <div className={cn("absolute inset-0 transition-colors duration-300 pointer-events-none", card.glowColor)} />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#33375C]/60">{card.title}</p>
              <div className={cn("h-10 w-10 rounded-2xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-105", card.iconBg)}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            
            <p className={cn("text-2xl sm:text-3xl font-bold tracking-tight relative z-10 flex items-baseline", card.valueColor)}>
              {currency && (
                <span className="text-sm font-bold text-[#33375C]/40 uppercase mr-1 select-none tracking-wider">{currency}</span>
              )}
              <span>{amount}</span>
            </p>

            {card.change !== null && (
              <div className="mt-3 flex items-center gap-2 relative z-10">
                <div className={cn(
                  "flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  (invertChange ? card.change <= 0 : card.change >= 0)
                    ? "bg-emerald-55/10 text-emerald-600 border-emerald-200/50"
                    : "bg-rose-55/10 text-rose-600 border-rose-200/50"
                )}>
                  {(invertChange ? card.change <= 0 : card.change >= 0) ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{formatPercentage(card.change)}</span>
                </div>
                <span className="text-[10px] font-bold text-[#33375C]/40">vs last month</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
