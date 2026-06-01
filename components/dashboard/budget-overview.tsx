import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { Budget } from "@/types/domain";
import { cn } from "@/lib/utils";

interface BudgetOverviewProps {
  budgets: Budget[];
}

const progressColors = {
  safe: "bg-gradient-to-r from-[#524CF2]/80 to-[#524CF2] shadow-sm shadow-[#524CF2]/20",
  warning: "bg-gradient-to-r from-amber-550 via-amber-450 to-yellow-400 shadow-sm shadow-amber-500/20",
  over: "bg-gradient-to-r from-rose-550 via-rose-500 to-red-500 shadow-sm shadow-rose-500/20",
};

const statusBadge = {
  safe: "bg-[#F0F0FF] border-[#E2E2FF] text-[#524CF2]",
  warning: "bg-amber-50 border-amber-100 text-amber-600",
  over: "bg-rose-50 border-rose-100 text-rose-600",
};

export function BudgetOverview({ budgets }: BudgetOverviewProps) {
  const displayed = budgets.slice(0, 5);
  const onTrack = displayed.filter((b) => b.status === "safe").length;

  return (
    <div className="bg-white rounded-3xl border border-[#E2E2FF] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E2FF] bg-[#F0F0FF]/20">
        <div>
          <h2 className="font-extrabold text-[#0A0D27] tracking-tight text-base">Budget Limits</h2>
          {displayed.length > 0 && (
            <p className="text-xs text-[#33375C]/60 mt-1 font-semibold">
              {onTrack} of {displayed.length} limits on track
            </p>
          )}
        </div>
        <Link href="/budgets" className="text-xs text-[#524CF2] font-black hover:text-[#625DF1] transition-colors">
          Manage →
        </Link>
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-[#F0F0FF] flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-[#524CF2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2}/><circle cx="12" cy="12" r="5" strokeWidth={2}/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>
          </div>
          <p className="text-sm font-semibold text-[#0A0D27]">No budgets yet</p>
          <p className="text-xs mt-1 text-[#33375C]/60">
            <Link href="/budgets" className="text-[#524CF2] font-semibold hover:underline">Set a limit</Link> to start controlling spend.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#E2E2FF]">
          {displayed.map((budget) => {
            const pct = Math.min(budget.pct_used, 100);
            return (
              <div key={budget.id} className="px-6 py-4.5 hover:bg-[#F0F0FF]/15 transition-all duration-200 group">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm border border-black/15"
                      style={{ backgroundColor: budget.category?.color ?? "#94a3b8" }}
                    />
                    <span className="text-sm font-bold text-[#0A0D27] group-hover:text-[#524CF2] transition-colors">{budget.category?.name ?? "Category"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#0A0D27]">{budget.pct_used.toFixed(0)}%</span>
                    <span className={cn("text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0", statusBadge[budget.status])}>
                      {budget.status}
                    </span>
                  </div>
                </div>

                {/* Progress bar slider */}
                <div className="w-full h-3 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] overflow-hidden relative p-[1.5px] shadow-inner">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", progressColors[budget.status])}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between mt-2.5 text-[10px] font-bold text-[#33375C]/65">
                  <span>{formatCurrency(budget.spent)} used</span>
                  <span className="text-[#33375C]/40">Limit: {formatCurrency(budget.amount)}</span>
                </div>
                
                {budget.status === "over" && (
                  <p className="text-[10px] text-rose-600 font-bold mt-2">
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
