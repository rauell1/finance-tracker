import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types/domain";
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const typeConfig = {
  income: { pill: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", amountColor: "text-emerald-400", prefix: "+" },
  expense: { pill: "bg-rose-500/10 border-rose-500/20 text-rose-400", amountColor: "text-rose-400", prefix: "−" },
  transfer: { pill: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400", amountColor: "text-indigo-400", prefix: "" },
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/60 shadow-lg shadow-black/20 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/50 bg-slate-900/20">
        <h2 className="font-bold text-slate-100 tracking-tight text-base">Recent Activity</h2>
        <Link href="/transactions" className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors flex items-center gap-0.5">
          View all <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <span className="text-4xl mb-3 animate-bounce">📊</span>
          <p className="text-sm font-semibold text-slate-400">No activity yet</p>
          <p className="text-xs mt-1 text-slate-500">Transactions you log will show up here</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/40">
          {transactions.map((txn) => {
            const config = typeConfig[txn.txn_type];
            return (
              <div key={txn.id} className="flex items-center gap-4 px-6 py-4.5 hover:bg-slate-800/25 transition-all duration-200 group">
                {/* Category icon circle */}
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-extrabold shadow-sm border border-black/10 group-hover:scale-105 transition-transform duration-200"
                  style={{ backgroundColor: txn.category?.color ?? "#475569" }}
                >
                  {(txn.category?.name ?? "?").slice(0, 2).toUpperCase()}
                </div>

                {/* Description + account */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                    {txn.description ?? txn.category?.name ?? "Transaction"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span>{txn.account?.name ?? "—"}</span>
                    {txn.metadata?.source === "sms_webhook" && (
                      <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold px-1 rounded-sm uppercase tracking-wider scale-95 shrink-0">
                        SMS Webhook
                      </span>
                    )}
                  </p>
                </div>

                {/* Date badge */}
                <span className="text-xs font-medium text-slate-500 shrink-0 hidden sm:block">
                  {formatDate(txn.occurred_on)}
                </span>

                {/* Amount + type pill */}
                <div className="text-right shrink-0 ml-2">
                  <p className={cn("text-sm font-bold tracking-tight", config.amountColor)}>
                    {config.prefix}{formatCurrency(txn.amount)}
                  </p>
                  <span className={cn("inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 mt-1", config.pill)}>
                    {txn.txn_type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
