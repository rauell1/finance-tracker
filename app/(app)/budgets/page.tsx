"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatCurrency, getMonthStart } from "@/lib/utils";
import type { Budget } from "@/types/domain";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const progressColors = {
  safe: "bg-emerald-500",
  warning: "bg-amber-500",
  over: "bg-rose-500",
};

const statusBadge = {
  safe: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  over: "bg-rose-100 text-rose-700",
};

function getMonthName(monthStr: string): string {
  const d = new Date(monthStr + "T00:00:00");
  return d.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
}

function addMonths(monthStr: string, delta: number): string {
  const d = new Date(monthStr + "T00:00:00");
  d.setMonth(d.getMonth() + delta);
  return getMonthStart(d);
}

export default function BudgetsPage() {
  const [month, setMonth] = useState(() => getMonthStart(new Date()));

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ["budgets", month],
    queryFn: async () => {
      const res = await fetch(`/api/budgets?month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch budgets");
      return res.json();
    },
  });

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const today = getMonthStart(new Date());
  const isCurrentMonth = month === today;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Budgets</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track your monthly spending limits</p>
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMonth((m) => addMonths(m, -1))}
          className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-base font-semibold text-slate-700 min-w-[160px] text-center">
          {getMonthName(month)}
        </span>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          disabled={isCurrentMonth}
          className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Summary stat cards */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">Total Budget</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">Total Spent</p>
            <p className="text-xl font-bold text-rose-600">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">Remaining</p>
            <p className={cn("text-xl font-bold", totalRemaining >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {formatCurrency(Math.abs(totalRemaining))}
            </p>
          </div>
        </div>
      )}

      {/* Budget cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 h-40 animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-16 text-slate-400">
          <span className="text-5xl mb-4">🎯</span>
          <p className="text-base font-medium text-slate-600">No budgets for this month</p>
          <p className="text-sm mt-1">Create a budget to start tracking spending</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => (
            <div key={budget.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: budget.category?.color ?? "#64748B" }}
                  />
                  <span className="font-semibold text-slate-800">{budget.category?.name ?? "Unknown"}</span>
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusBadge[budget.status])}>
                  {budget.status}
                </span>
              </div>
              <Progress
                value={budget.spent}
                max={budget.amount}
                indicatorClassName={progressColors[budget.status]}
                className="h-2.5"
              />
              <div className="flex justify-between mt-2 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Spent</p>
                  <p className={cn("font-semibold", budget.status === "over" ? "text-rose-600" : "text-slate-700")}>
                    {formatCurrency(budget.spent)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Budget</p>
                  <p className="font-semibold text-slate-700">{formatCurrency(budget.amount)}</p>
                </div>
              </div>
              {budget.status === "over" ? (
                <p className="text-xs text-rose-600 font-medium mt-2">
                  Over by {formatCurrency(Math.abs(budget.remaining))}
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-2">
                  {formatCurrency(budget.remaining)} remaining ({(100 - budget.pct_used).toFixed(0)}% left)
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
