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
      badgeColor: "bg-slate-100 text-slate-600",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      valueColor: "text-slate-800",
    },
    {
      title: "Monthly Income",
      value: formatCurrency(data.monthlyIncome),
      icon: TrendingUp,
      change: data.incomeChange,
      badgeColor: "bg-emerald-100 text-emerald-700",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-700",
      invertChange: false,
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(data.monthlyExpense),
      icon: TrendingDown,
      change: data.expenseChange,
      badgeColor: "bg-rose-100 text-rose-700",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      valueColor: "text-rose-700",
      invertChange: true,
    },
    {
      title: "Net Cashflow",
      value: formatCurrency(Math.abs(data.netCashflow)),
      icon: ArrowUpDown,
      change: null as number | null,
      badgeColor: data.netCashflow >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
      iconBg: data.netCashflow >= 0 ? "bg-emerald-100" : "bg-rose-100",
      iconColor: data.netCashflow >= 0 ? "text-emerald-600" : "text-rose-600",
      valueColor: data.netCashflow >= 0 ? "text-emerald-700" : "text-rose-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const invertChange = "invertChange" in card ? card.invertChange : false;
        return (
          <div key={card.title} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <div className={cn("h-9 w-9 rounded-full flex items-center justify-center", card.iconBg)}>
                <Icon className={cn("h-4 w-4", card.iconColor)} />
              </div>
            </div>
            <p className={cn("text-2xl font-bold tracking-tight", card.valueColor)}>{card.value}</p>
            {card.change !== null && (
              <div className="mt-2 flex items-center gap-1">
                {(invertChange ? card.change <= 0 : card.change >= 0) ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-rose-500" />
                )}
                <span className={cn("text-xs font-medium",
                  (invertChange ? card.change <= 0 : card.change >= 0)
                    ? "text-emerald-600"
                    : "text-rose-600"
                )}>
                  {formatPercentage(card.change)}
                </span>
                <span className="text-xs text-slate-400">vs last month</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
