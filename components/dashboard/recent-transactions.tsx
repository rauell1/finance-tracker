import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types/domain";
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const typeConfig = {
  income: { pill: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600", amountColor: "text-emerald-600", prefix: "+" },
  expense: { pill: "bg-rose-55/10 border-rose-200/50 text-rose-600", amountColor: "text-rose-600", prefix: "−" },
  transfer: { pill: "bg-[#F0F0FF] border-[#E2E2FF] text-[#524CF2]", amountColor: "text-[#524CF2]", prefix: "" },
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="bg-white rounded-3xl border border-[#E2E2FF] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E2FF] bg-[#F0F0FF]/20">
        <h2 className="font-extrabold text-[#0A0D27] tracking-tight text-base">Recent Activity</h2>
        <Link href="/transactions" className="text-xs text-[#524CF2] font-black hover:text-[#625DF1] transition-colors flex items-center gap-0.5 group">
          View all <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-[#F0F0FF] flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-[#524CF2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h4m-7 4h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <p className="text-sm font-semibold text-[#0A0D27]">No activity yet</p>
          <p className="text-xs mt-1 text-[#33375C]/60 max-w-xs">Transactions you log or sync from M-Pesa will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#E2E2FF]">
          {transactions.map((txn) => {
            const config = typeConfig[txn.txn_type];
            return (
              <div key={txn.id} className="flex items-center gap-4 px-6 py-4.5 hover:bg-[#F0F0FF]/15 transition-all duration-200 group">
                {/* Category icon circle */}
                <div
                  className="h-10 w-10 rounded-[10px] flex items-center justify-center shrink-0 text-white text-xs font-black shadow-sm border border-black/10 group-hover:scale-105 transition-transform duration-200 tracking-wider"
                  style={{ backgroundColor: txn.category?.color ?? "#94a3b8" }}
                >
                  {(txn.category?.name ?? "?").slice(0, 2).toUpperCase()}
                </div>

                {/* Description + account */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#0A0D27] truncate group-hover:text-[#524CF2] transition-colors">
                    {txn.description ?? txn.category?.name ?? "Transaction"}
                  </p>
                  <p className="text-xs text-[#33375C]/50 mt-0.5 flex items-center gap-2 font-bold">
                    <span className="truncate max-w-[120px]">{txn.account?.name ?? "—"}</span>
                    {txn.metadata?.source === "sms_webhook" && (
                      <span className="text-[8px] bg-[#F0F0FF] border border-[#E2E2FF] text-[#524CF2] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 select-none">
                        Webhook
                      </span>
                    )}
                  </p>
                </div>

                {/* Date badge */}
                <span className="text-xs font-bold text-[#33375C]/40 shrink-0 hidden sm:block">
                  {formatDate(txn.occurred_on)}
                </span>

                {/* Amount + type pill */}
                <div className="text-right shrink-0 ml-2">
                  <p className={cn("text-sm font-black tracking-tight", config.amountColor)}>
                    {config.prefix}{formatCurrency(txn.amount)}
                  </p>
                  <span className={cn("inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 mt-1", config.pill)}>
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
