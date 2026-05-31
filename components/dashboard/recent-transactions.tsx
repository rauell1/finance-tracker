import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types/domain";
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const typeConfig = {
  income: { pill: "bg-emerald-50 border-emerald-100 text-emerald-600", amountColor: "text-emerald-600", prefix: "+" },
  expense: { pill: "bg-rose-50 border-rose-100 text-rose-650", amountColor: "text-rose-650", prefix: "−" },
  transfer: { pill: "bg-indigo-50 border-indigo-100 text-indigo-650", amountColor: "text-indigo-650", prefix: "" },
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/40">
        <h2 className="font-bold text-slate-800 tracking-tight text-base">Recent Activity</h2>
        <Link href="/transactions" className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 transition-colors flex items-center gap-0.5 group">
          View all <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <span className="text-4xl mb-3 animate-bounce">💰</span>
          <p className="text-sm font-semibold text-slate-500">No activity yet</p>
          <p className="text-xs mt-1 text-slate-400">Transactions you log will show up here</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100/60">
          {transactions.map((txn) => {
            const config = typeConfig[txn.txn_type];
            return (
              <div key={txn.id} className="flex items-center gap-4 px-6 py-4.5 hover:bg-slate-50/50 transition-all duration-250 group">
                {/* Category icon circle */}
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-extrabold shadow-sm border border-black/10 group-hover:scale-105 transition-transform duration-200"
                  style={{ backgroundColor: txn.category?.color ?? "#94a3b8" }}
                >
                  {(txn.category?.name ?? "?").slice(0, 2).toUpperCase()}
                </div>

                {/* Description + account */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                    {txn.description ?? txn.category?.name ?? "Transaction"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                    <span>{txn.account?.name ?? "—"}</span>
                    {txn.metadata?.source === "sms_webhook" && (
                      <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-600 font-bold px-1 rounded-sm uppercase tracking-wider scale-95 shrink-0">
                        SMS Webhook
                      </span>
                    )}
                  </p>
                </div>

                {/* Date badge */}
                <span className="text-xs font-semibold text-slate-400 shrink-0 hidden sm:block">
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
