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
      bgStyle: "bg-white border-slate-250/60 hover:border-indigo-500/20 shadow-sm",
      glowColor: "group-hover:bg-indigo-500/[0.02]",
      iconBg: "bg-indigo-50 border-indigo-100 text-indigo-600",
      valueColor: "text-slate-800",
    },
    {
      title: "Monthly Income",
      value: formatCurrency(data.monthlyIncome),
      icon: TrendingUp,
      change: data.incomeChange,
      bgStyle: "bg-white border-slate-250/60 hover:border-emerald-500/20 shadow-sm",
      glowColor: "group-hover:bg-emerald-500/[0.02]",
      iconBg: "bg-emerald-50 border-emerald-100 text-emerald-600",
      valueColor: "text-emerald-600",
      invertChange: false,
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(data.monthlyExpense),
      icon: TrendingDown,
      change: data.expenseChange,
      bgStyle: "bg-white border-slate-250/60 hover:border-rose-500/20 shadow-sm",
      glowColor: "group-hover:bg-rose-500/[0.02]",
      iconBg: "bg-rose-50 border-rose-100 text-rose-650",
      valueColor: "text-rose-600",
      invertChange: true,
    },
    {
      title: "Net Cashflow",
      value: formatCurrency(Math.abs(data.netCashflow)),
      icon: ArrowUpDown,
      change: null as number | null,
      bgStyle: data.netCashflow >= 0
        ? "bg-white border-slate-250/60 hover:border-teal-500/20 shadow-sm"
        : "bg-white border-slate-250/60 hover:border-rose-500/20 shadow-sm",
      glowColor: data.netCashflow >= 0 ? "group-hover:bg-teal-500/[0.02]" : "group-hover:bg-rose-500/[0.02]",
      iconBg: data.netCashflow >= 0
        ? "bg-teal-50 border-teal-100 text-teal-600"
        : "bg-rose-50 border-rose-100 text-rose-650",
      valueColor: data.netCashflow >= 0 ? "text-teal-600" : "text-rose-650",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const invertChange = "invertChange" in card ? card.invertChange : false;
        return (
          <div
            key={card.title}
            className={cn(
              "group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/50",
              card.bgStyle
            )}
          >
            {/* Background Glow element */}
            <div className={cn("absolute inset-0 transition-colors duration-300 pointer-events-none", card.glowColor)} />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">{card.title}</p>
              <div className={cn("h-10 w-10 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-105", card.iconBg)}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            
            <p className={cn("text-2xl font-extrabold tracking-tight relative z-10", card.valueColor)}>
              {card.value}
            </p>

            {card.change !== null && (
              <div className="mt-3 flex items-center gap-1.5 relative z-10">
                <div className={cn(
                  "flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold",
                  (invertChange ? card.change <= 0 : card.change >= 0)
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-rose-50 text-rose-600 border border-rose-100"
                )}>
                  {(invertChange ? card.change <= 0 : card.change >= 0) ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{formatPercentage(card.change)}</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400">vs last month</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
