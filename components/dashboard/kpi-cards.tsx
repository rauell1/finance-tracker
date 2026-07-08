import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { KPIData } from "@/types/domain";
import { TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardsProps {
  data: KPIData;
  period?: "month" | "quarter" | "year" | "all";
}

export function KPICards({ data, period = "month" }: KPICardsProps) {
  const periodWord = period === "quarter" ? "Quarterly" : period === "year" ? "Yearly" : period === "all" ? "Total" : "Monthly";
  const vsLabel = period === "quarter" ? "vs last quarter" : period === "year" ? "vs last year" : "vs last month";

  const cards = [
    {
      title: `${periodWord} Income`,
      value: formatCurrency(data.monthlyIncome),
      icon: TrendingUp,
      change: data.incomeChange as number | null,
      accent: "emerald" as const,
      invertChange: false,
    },
    {
      title: `${periodWord} Expenses`,
      value: formatCurrency(data.monthlyExpense),
      icon: TrendingDown,
      change: data.expenseChange as number | null,
      accent: "rose" as const,
      invertChange: true,
    },
    {
      title: "Net Cashflow",
      value: formatCurrency(data.netCashflow),
      icon: ArrowUpDown,
      change: null as number | null,
      accent: data.netCashflow >= 0 ? ("indigo" as const) : ("rose" as const),
      invertChange: false,
    },
  ];

  const accentStyles = {
    emerald: {
      iconBg: "bg-emerald-50 text-emerald-600",
      topBar: "bg-emerald-500",
      valueColor: "text-[#0A0D27]",
    },
    rose: {
      iconBg: "bg-rose-50 text-rose-600",
      topBar: "bg-rose-500",
      valueColor: "text-[#0A0D27]",
    },
    indigo: {
      iconBg: "bg-[#F0F0FF] text-[#524CF2]",
      topBar: "bg-[#524CF2]",
      valueColor: "text-[#524CF2]",
    },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const styles = accentStyles[card.accent];
        const parts = card.value.split(" ");
        const currency = parts.length > 1 ? parts[0] : "";
        const amount = parts.length > 1 ? parts[1] : card.value;
        const changeGood = card.change !== null && (card.invertChange ? card.change <= 0 : card.change >= 0);

        return (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded-2xl border border-[#E2E2FF] bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            {/* Accent top bar */}
            <div className={cn("absolute top-0 left-5 right-5 h-[3px] rounded-b-full opacity-70", styles.topBar)} />

            <div className="flex items-center justify-between mb-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#33375C]/50">{card.title}</p>
              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", styles.iconBg)}>
                <Icon className="h-4.5 w-4.5" />
              </div>
            </div>

            <p className={cn("text-2xl sm:text-[1.7rem] font-extrabold tracking-tight flex items-baseline", styles.valueColor)}>
              {currency && (
                <span className="text-xs font-bold text-[#33375C]/40 uppercase mr-1.5 select-none tracking-wider">{currency}</span>
              )}
              <span>{amount}</span>
            </p>

            {card.change !== null && (
              <div className="mt-2.5 flex items-center gap-2">
                <span className={cn(
                  "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold",
                  changeGood ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {changeGood ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {formatPercentage(card.change)}
                </span>
                <span className="text-[10px] font-semibold text-[#33375C]/40">{vsLabel}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
