import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { Budget } from "@/types/domain";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface BudgetOverviewProps {
  budgets: Budget[];
}

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

export function BudgetOverview({ budgets }: BudgetOverviewProps) {
  const displayed = budgets.slice(0, 5);
  const onTrack = displayed.filter((b) => b.status === "safe").length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="font-semibold text-slate-800">Budget Overview</h2>
          {displayed.length > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">
              {onTrack} of {displayed.length} budgets on track
            </p>
          )}
        </div>
        <Link href="/budgets" className="text-xs text-emerald-600 font-medium hover:text-emerald-700">
          Manage →
        </Link>
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <span className="text-4xl mb-3">🎯</span>
          <p className="text-sm font-medium">No budgets set</p>
          <p className="text-xs mt-1">
            <Link href="/budgets" className="text-emerald-600 hover:underline">Create a budget</Link> to track spending
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {displayed.map((budget) => (
            <div key={budget.id} className="px-5 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: budget.category?.color ?? "#64748B" }}
                  />
                  <span className="text-sm font-medium text-slate-700">{budget.category?.name ?? "Unknown"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{budget.pct_used.toFixed(0)}%</span>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", statusBadge[budget.status])}>
                    {budget.status}
                  </span>
                </div>
              </div>
              <Progress
                value={budget.spent}
                max={budget.amount}
                indicatorClassName={progressColors[budget.status]}
              />
              <div className="flex justify-between mt-1.5 text-xs text-slate-500">
                <span>{formatCurrency(budget.spent)}</span>
                <span className="font-medium">{formatCurrency(budget.amount)}</span>
              </div>
              {budget.status === "over" && (
                <p className="text-xs text-rose-600 font-medium mt-1">
                  Over by {formatCurrency(Math.abs(budget.remaining))}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
