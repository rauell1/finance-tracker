import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      change: null,
      color: "text-blue-600",
    },
    {
      title: "Monthly Income",
      value: formatCurrency(data.monthlyIncome),
      icon: TrendingUp,
      change: data.incomeChange,
      color: "text-green-600",
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(data.monthlyExpense),
      icon: TrendingDown,
      change: data.expenseChange,
      color: "text-red-600",
      invertChange: true,
    },
    {
      title: "Net Cashflow",
      value: formatCurrency(data.netCashflow),
      icon: ArrowUpDown,
      change: null,
      color: data.netCashflow >= 0 ? "text-green-600" : "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <Icon className={cn("h-4 w-4", card.color)} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", card.color)}>{card.value}</div>
              {card.change !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={card.invertChange
                    ? (card.change <= 0 ? "text-green-600" : "text-red-600")
                    : (card.change >= 0 ? "text-green-600" : "text-red-600")
                  }>
                    {formatPercentage(card.change)}
                  </span>
                  {" "}vs last month
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
