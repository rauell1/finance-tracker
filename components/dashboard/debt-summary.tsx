import Link from "next/link";
import { Landmark, Zap } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Debt } from "@/types/domain";

interface Props {
  debts: Debt[];
}

export function DebtSummary({ debts }: Props) {
  const total = debts.reduce((s, d) => s + Number(d.current_balance), 0);
  const displayed = debts.slice(0, 5);

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-foreground tracking-tight text-base">Outstanding Debts</h2>
          </div>
          {debts.length > 0 && (
            <p className={cn("text-lg font-bold mt-1.5", total > 0 ? "text-rose-600 dark:text-rose-500" : "text-emerald-600 dark:text-emerald-500")}>
              {formatCurrency(total)}
            </p>
          )}
        </div>
        <Link href="/debts" className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors">
          Manage →
        </Link>
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
            <Landmark className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-foreground">No active debts - nice 💪</p>
          <p className="text-xs mt-1 text-muted-foreground/60">You&apos;re debt-free.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {displayed.map((d) => {
            const owed = Number(d.current_balance);
            const limit = Number(d.principal);
            const isCreditLine = ["fuliza", "overdraft", "kcb_overdraft", "credit_card"].includes(d.debt_type);
            const available = isCreditLine ? Math.max(0, limit - owed) : null;
            return (
              <div key={d.id} className="px-6 py-4 flex items-center justify-between gap-3 hover:bg-secondary/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-foreground truncate">{d.creditor}</span>
                    {d.auto_tracked && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 inline-flex items-center gap-0.5 shrink-0">
                        <Zap className="h-2.5 w-2.5" /> Auto
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider">
                    {isCreditLine ? `Credit line · ${formatCurrency(limit)} limit` : d.debt_type.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("text-sm font-bold", owed > 0 ? "text-rose-600 dark:text-rose-500" : "text-emerald-600 dark:text-emerald-500")}>
                    {owed > 0 ? formatCurrency(owed) : isCreditLine ? "Nothing owed" : formatCurrency(0)}
                  </p>
                  {available !== null && (
                    <p className="text-[10px] text-muted-foreground/60 font-semibold mt-0.5">
                      {formatCurrency(available)} available
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
