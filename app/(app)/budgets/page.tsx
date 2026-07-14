"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatCurrency, getMonthStart } from "@/lib/utils";
import type { Budget } from "@/types/domain";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Target, TrendingUp, Lightbulb, AlertTriangle } from "lucide-react";
type TxnTypeTab = "expense" | "income";

const progressColors = {
  safe: "bg-emerald-500",
  warning: "bg-amber-500",
  over: "bg-rose-500",
};

const statusBadge = {
  safe: "bg-emerald-50 text-emerald-700 border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  over: "bg-rose-50 text-rose-700 border-rose-100",
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

interface Projection { category_id: string; category_name: string; budget: number; spent: number; projected: number; at_risk: boolean; }
interface Suggestion { category_id: string; category_name: string; avg_spend: number; suggested_amount: number; }

export default function BudgetsPage() {
  const [month, setMonth] = useState(() => getMonthStart(new Date()));
  const [txnType, setTxnType] = useState<TxnTypeTab>("expense");

  const { data: allBudgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ["budgets", month],
    queryFn: async () => {
      const res = await fetch(`/api/budgets?month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch budgets");
      return res.json();
    },
  });

  const { data: projections = [] } = useQuery<Projection[]>({
    queryKey: ["budgets", "projections", month],
    queryFn: async () => {
      const res = await fetch(`/api/budgets?month=${month}&projections=1`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: suggestions = [] } = useQuery<Suggestion[]>({
    queryKey: ["budgets", "suggestions", month],
    queryFn: async () => {
      const res = await fetch(`/api/budgets?month=${month}&suggestions=1`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const budgets = allBudgets.filter((b) => (b.txn_type ?? "expense") === txnType);
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const overallStatus: "safe" | "warning" | "over" = totalSpent > totalBudget ? "over" : totalSpent > totalBudget * 0.8 ? "warning" : "safe";
  const today = getMonthStart(new Date());
  const isCurrentMonth = month === today;

  // Build projection lookup
  const projMap = new Map(projections.map((p) => [p.category_id, p]));

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[#EA580C]" />
          <h1 className="text-2xl font-bold text-[#0A0D27] tracking-tight">Budgets</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth((m) => addMonths(m, -1))} className="h-9 w-9 rounded-lg border border-[#DCFCE7] bg-white flex items-center justify-center hover:bg-[#FEF9C3] text-[#33375C] transition-colors"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold text-[#0A0D27] min-w-[140px] text-center">{getMonthName(month)}</span>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} disabled={isCurrentMonth} className="h-9 w-9 rounded-lg border border-[#DCFCE7] bg-white flex items-center justify-center hover:bg-[#FEF9C3] text-[#33375C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Income/Expense Tabs */}
      <div className="inline-flex p-1 rounded-xl bg-[#FEF9C3] border border-[#DCFCE7]">
        {(["expense", "income"] as const).map((t) => (
          <button key={t} onClick={() => setTxnType(t)} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors", txnType === t ? "bg-white text-[#EA580C] shadow-sm" : "text-[#33375C]/60 hover:text-[#EA580C]")}>
            {t} ({allBudgets.filter((b) => (b.txn_type ?? "expense") === t).length})
          </button>
        ))}
      </div>

      {/* Hero card */}
      {isLoading ? (
        <Skeleton className="h-36 rounded-2xl" />
      ) : budgets.length > 0 ? (
        <div className="bg-gradient-to-br from-white to-[#FEF9C3]/40 rounded-2xl border border-[#DCFCE7] shadow-sm p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#33375C]/60">Total Spent</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#0A0D27] mt-1">{formatCurrency(totalSpent)}<span className="text-sm font-semibold text-[#33375C]/50 ml-2">of {formatCurrency(totalBudget)}</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#33375C]/60">{totalRemaining >= 0 ? "Remaining" : "Overspent"}</p>
              <p className={cn("text-xl sm:text-2xl font-bold mt-1", totalRemaining >= 0 ? "text-emerald-600" : "text-rose-600")}>{formatCurrency(Math.abs(totalRemaining))}</p>
            </div>
          </div>
          <div className="h-3 w-full rounded-full bg-[#FEF9C3] overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-500", progressColors[overallStatus])} style={{ width: `${overallPct}%` }} />
          </div>
          <p className="text-xs text-[#33375C]/60 mt-2 font-semibold">{overallPct.toFixed(0)}% used · {budgets.length} budget{budgets.length === 1 ? "" : "s"}</p>
        </div>
      ) : null}

      {/* Budget cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DCFCE7] shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="h-14 w-14 rounded-full bg-[#FEF9C3] flex items-center justify-center mb-4"><Target className="h-7 w-7 text-[#EA580C]" /></div>
          <p className="text-base font-semibold text-[#0A0D27]">No budgets for {getMonthName(month)}</p>
          <p className="text-sm mt-1 text-[#33375C]/60 max-w-sm">Create a budget for a category to start tracking how you spend each month.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const proj = projMap.get(budget.category_id);
            return (
              <div key={budget.id} className="bg-white rounded-2xl border border-[#DCFCE7] shadow-sm p-5 hover:border-[#EA580C]/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: budget.category?.color ?? "#64748B" }} />
                    <span className="font-semibold text-[#0A0D27] text-sm">{budget.category?.name ?? "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {proj?.at_risk && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-100 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> At Risk
                      </span>
                    )}
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border", statusBadge[budget.status])}>{budget.status}</span>
                  </div>
                </div>
                <Progress value={budget.spent} max={budget.amount} indicatorClassName={progressColors[budget.status]} className="h-2.5" />
                <div className="flex justify-between mt-2.5 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Spent</p>
                    <p className={cn("font-bold mt-0.5", budget.status === "over" ? "text-rose-600" : "text-[#0A0D27]")}>{formatCurrency(budget.spent)}</p>
                  </div>
                  {proj && (
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Projected</p>
                      <p className={cn("font-bold mt-0.5", proj.at_risk ? "text-amber-600" : "text-[#0A0D27]")}>{formatCurrency(proj.projected)}</p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Budget</p>
                    <p className="font-bold text-[#0A0D27] mt-0.5">{formatCurrency(budget.amount)}</p>
                  </div>
                </div>
                {budget.status === "over" ? (
                  <p className="text-xs text-rose-600 font-semibold mt-2">Over by {formatCurrency(Math.abs(budget.remaining))}</p>
                ) : (
                  <p className="text-xs text-[#33375C]/60 mt-2 font-semibold">{formatCurrency(budget.remaining)} left · {(100 - budget.pct_used).toFixed(0)}%</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Budget Suggestions */}
      {suggestions.length > 0 && txnType === "expense" && (
        <div className="bg-white rounded-2xl border border-[#DCFCE7] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DCFCE7] bg-[#FEF9C3]/20 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="font-semibold text-[#0A0D27] text-sm">Suggested Budgets</h3>
            <span className="text-xs text-[#33375C]/50 ml-1">Based on last 3 months</span>
          </div>
          <div className="divide-y divide-[#DCFCE7]">
            {suggestions.slice(0, 6).map((s) => (
              <div key={s.category_id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-semibold text-[#0A0D27] text-sm">{s.category_name}</p>
                  <p className="text-xs text-[#33375C]/50 mt-0.5">Avg: {formatCurrency(s.avg_spend)}/mo</p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-[#EA580C]" />
                  <span className="font-bold text-sm text-[#0A0D27]">{formatCurrency(s.suggested_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
