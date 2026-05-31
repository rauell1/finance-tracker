import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { Budget } from "@/types/domain";
import { cn } from "@/lib/utils";

interface BudgetOverviewProps {
  budgets: Budget[];
}

const progressColors = {
  safe: "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20",
  warning: "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-lg shadow-amber-500/20",
  over: "bg-gradient-to-r from-rose-500 to-red-400 shadow-lg shadow-rose-500/20",
};

const statusBadge = {
  safe: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  over: "bg-rose-500/10 border-rose-500/20 text-rose-400",
};

export function BudgetOverview({ budgets }: BudgetOverviewProps) {
  const displayed = budgets.slice(0, 5);
  const onTrack = displayed.filter((b) => b.status === "safe").length;

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/60 shadow-lg shadow-black/20 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/50 bg-slate-900/20">
        <div>
          <h2 className="font-bold text-slate-100 tracking-tight text-base">Budget Tracking</h2>
          {displayed.length > 0 && (
            <p className="text-xs text-slate-400 mt-1">
              {onTrack} of {displayed.length} limits on track
            </p>
          )}
        </div>
        <Link href="/budgets" className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
          Manage →
        </Link>
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <span className="text-4xl mb-3 animate-pulse">🎯</span>
          <p className="text-sm font-semibold text-slate-400">No limits active</p>
          <p className="text-xs mt-1 text-slate-500">
            <Link href="/budgets" className="text-indigo-400 hover:underline">Set a limit</Link> to control spending
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/40">
          {displayed.map((budget) => {
            const pct = Math.min(budget.pct_used, 100);
            return (
              <div key={budget.id} className="px-6 py-4.5 hover:bg-slate-800/10 transition-colors group">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm border border-black/10"
                      style={{ backgroundColor: budget.category?.color ?? "#94a3b8" }}
                    />
                    <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{budget.category?.name ?? "Category"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">{budget.pct_used.toFixed(0)}%</span>
                    <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0", statusBadge[budget.status])}>
                      {budget.status}
                    </span>
                  </div>
                </div>

                {/* Glassmorphic progress slider container */}
                <div className="w-full h-2.5 rounded-full bg-slate-950/80 border border-slate-800/60 overflow-hidden relative p-[1px]">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", progressColors[budget.status])}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between mt-2 text-[11px] font-semibold text-slate-400">
                  <span>{formatCurrency(budget.spent)} used</span>
                  <span className="text-slate-500">Limit: {formatCurrency(budget.amount)}</span>
                </div>
                
                {budget.status === "over" && (
                  <p className="text-[10px] text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> Overspend: {formatCurrency(Math.abs(budget.remaining))}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
