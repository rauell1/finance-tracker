import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types/domain";
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const typeConfig = {
  income: { pill: "bg-emerald-100 text-emerald-700", amountColor: "text-emerald-600", prefix: "+" },
  expense: { pill: "bg-rose-100 text-rose-700", amountColor: "text-rose-600", prefix: "−" },
  transfer: { pill: "bg-slate-100 text-slate-600", amountColor: "text-slate-600", prefix: "" },
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">Recent Transactions</h2>
        <Link href="/transactions" className="text-xs text-emerald-600 font-medium hover:text-emerald-700">
          View all →
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <span className="text-4xl mb-3">💰</span>
          <p className="text-sm font-medium">No transactions yet</p>
          <p className="text-xs mt-1">Start tracking by adding a transaction</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {transactions.map((txn) => {
            const config = typeConfig[txn.txn_type];
            return (
              <div key={txn.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                {/* Category icon circle */}
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                  style={{ backgroundColor: txn.category?.color ?? "#94a3b8" }}
                >
                  {(txn.category?.name ?? "?").charAt(0).toUpperCase()}
                </div>

                {/* Description + account */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {txn.description ?? txn.category?.name ?? "Transaction"}
                  </p>
                  <p className="text-xs text-slate-400">{txn.account?.name ?? "—"}</p>
                </div>

                {/* Date badge */}
                <span className="text-xs text-slate-400 shrink-0 hidden sm:block">
                  {formatDate(txn.occurred_on)}
                </span>

                {/* Amount + type pill */}
                <div className="text-right shrink-0 ml-2">
                  <p className={cn("text-sm font-semibold", config.amountColor)}>
                    {config.prefix}{formatCurrency(txn.amount)}
                  </p>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", config.pill)}>
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
