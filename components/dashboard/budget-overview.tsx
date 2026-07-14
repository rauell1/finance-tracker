import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { Budget } from "@/types/domain";
import { cn } from "@/lib/utils";

interface BudgetOverviewProps {
  budgets: Budget[];
}

const progressColors = {
  safe: "bg-gradient-to-r from-primary/80 to-primary shadow-sm shadow-primary/10",
  warning: "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-sm shadow-amber-500/10",
  over: "bg-gradient-to-r from-rose-600 to-red-500 shadow-sm shadow-rose-500/10",
};

const statusBadge = {
  safe: "bg-[#FEF9C3] border-[#DCFCE7] text-[#EA580C] dark:bg-primary/10 dark:border-primary/20 dark:text-primary",
  warning: "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400",
  over: "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400",
};

export function BudgetOverview({ budgets }: BudgetOverviewProps) {
  const displayed = budgets.slice(0, 5);
  const onTrack = displayed.filter((b) => b.status === "safe").length;

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
        <div>
          <h2 className="font-bold text-foreground tracking-tight text-base">Budget Limits</h2>
          {displayed.length > 0 && (
            <p className="text-xs text-muted-foreground/80 mt-1 font-semibold">
              {onTrack} of {displayed.length} limits on track
            </p>
          )}
        </div>
        <Link href="/budgets" className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors">
          Manage →
        </Link>
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2}/><circle cx="12" cy="12" r="5" strokeWidth={2}/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>
          </div>
          <p className="text-sm font-bold text-foreground">No budgets yet</p>
          <p className="text-xs mt-1 text-muted-foreground/60">
            <Link href="/budgets" className="text-primary font-semibold hover:underline">Set a limit</Link> to start controlling spend.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {displayed.map((budget) => {
            const pct = Math.min(budget.pct_used, 100);
            return (
              <div key={budget.id} className="px-6 py-4.5 hover:bg-secondary/40 transition-all duration-200 group">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm border border-black/15"
                      style={{ backgroundColor: budget.category?.color ?? "#94a3b8" }}
                    />
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{budget.category?.name ?? "Category"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-foreground">{budget.pct_used.toFixed(0)}%</span>
                    <span className={cn("text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0", statusBadge[budget.status])}>
                      {budget.status}
                    </span>
                  </div>
                </div>

                {/* Progress bar slider */}
                <div className="w-full h-2.5 rounded-full bg-secondary border border-border/40 overflow-hidden relative p-[1px] shadow-inner">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", progressColors[budget.status])}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between mt-2 text-[10px] font-bold text-muted-foreground/75">
                  <span>{formatCurrency(budget.spent)} used</span>
                  <span className="text-muted-foreground/45">Limit: {formatCurrency(budget.amount)}</span>
                </div>
                
                {budget.status === "over" && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-500 font-bold mt-2">
                    Overspent by {formatCurrency(Math.abs(budget.remaining))}
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
