"use client";

import { useState, Fragment } from "react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { TransactionDetailSheet } from "./transaction-detail-sheet";
import type { Transaction, Category } from "@/types/domain";
import { Smartphone, Search } from "lucide-react";

interface TransactionsClientProps {
  transactions: Transaction[];
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
  params: Record<string, string>;
}

function buildFilterUrl(params: Record<string, string>, overrides: Record<string, string | undefined>) {
  const next = { ...params, ...overrides };
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(next).filter(([, v]) => v != null && v !== "")) as Record<string, string>
  );
  return `/transactions?${qs.toString()}`;
}

const typeConfig: Record<string, string> = {
  income:   "bg-emerald-50 text-emerald-700 border-emerald-100",
  expense:  "bg-rose-50 text-rose-700 border-rose-100",
  transfer: "bg-[#F0F0FF] text-[#524CF2] border-[#E2E2FF]",
};

function formatDateHeader(dateStr: string) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

export function TransactionsClient({
  transactions,
  categories,
  total,
  page,
  totalPages,
  params,
}: TransactionsClientProps) {
  const filterUrl = (overrides: Record<string, string | undefined>) => buildFilterUrl(params, overrides);
  const [selected, setSelected] = useState<Transaction | null>(null);

  // Group transactions by occurred_on date
  const groupedTransactions = transactions.reduce((acc, txn) => {
    const dateStr = txn.occurred_on;
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(txn);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Sorted date keys from latest to oldest
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm overflow-hidden">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="h-12 w-12 rounded-full bg-[#F0F0FF] flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-[#524CF2]" />
            </div>
            <p className="text-sm font-semibold text-[#0A0D27]">No transactions found</p>
            <p className="text-xs mt-1 text-[#33375C]/60 max-w-xs">Try adjusting your filters or add a new transaction using the button in the topbar.</p>
          </div>
        ) : (
          <>
            {/* Mobile card list grouped by date */}
            <div className="md:hidden divide-y divide-[#E2E2FF]">
              {sortedDates.map((dateStr) => (
                <div key={dateStr} className="space-y-0">
                  <div className="bg-[#F0F0FF]/50 dark:bg-[#161A3E]/30 px-4 py-2 text-xs font-bold text-[#33375C]/70 border-b border-[#E2E2FF]">
                    {formatDateHeader(dateStr)}
                  </div>
                  <ul className="divide-y divide-[#E2E2FF]">
                    {groupedTransactions[dateStr].map((txn) => {
                      const meta = txn.metadata as Record<string, unknown>;
                      const isWebhook = meta?.source === "sms_webhook";
                      return (
                        <li
                          key={txn.id}
                          onClick={() => setSelected(txn)}
                          className="px-4 py-3.5 active:bg-[#F0F0FF]/40 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {isWebhook && <Smartphone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                                <p className="text-sm font-semibold text-[#0A0D27] truncate">{txn.description ?? "-"}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-[#33375C]/60">{txn.account?.name ?? "-"}</span>
                                {txn.category && (
                                  <span className="text-xs text-[#33375C]/60 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: txn.category.color }} />
                                    {txn.category.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={cn(
                                "text-sm font-bold whitespace-nowrap",
                                txn.txn_type === "income" ? "text-emerald-600" : txn.txn_type === "expense" ? "text-rose-600" : "text-[#524CF2]"
                              )}>
                                {txn.txn_type === "income" ? "+" : txn.txn_type === "expense" ? "−" : ""}{formatCurrency(txn.amount)}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {/* Desktop table grouped by date */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E2FF] bg-[#F0F0FF]/30">
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">Account</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">Description</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">Category</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">Type</th>
                    <th className="text-right px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E2FF]">
                  {sortedDates.map((dateStr) => (
                    <Fragment key={dateStr}>
                      <tr className="bg-[#F0F0FF]/45 border-y border-[#E2E2FF] pointer-events-none select-none">
                        <td colSpan={5} className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#33375C]/60 bg-[#F0F0FF]/15">
                          {formatDateHeader(dateStr)}
                        </td>
                      </tr>
                      {groupedTransactions[dateStr].map((txn) => {
                        const meta = txn.metadata as Record<string, unknown>;
                        const isWebhook = meta?.source === "sms_webhook";
                        const balanceAfter = meta?.balance_after as number | null | undefined;

                        return (
                          <tr
                            key={txn.id}
                            onClick={() => setSelected(txn)}
                            className="hover:bg-[#F0F0FF]/30 transition-colors cursor-pointer group"
                          >
                            <td className="px-5 py-3.5 text-sm text-[#33375C]/70 whitespace-nowrap font-semibold">
                              {txn.account?.name ?? "-"}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-start gap-2">
                                {isWebhook && (
                                  <span title="Auto-imported via M-Pesa SMS">
                                    <Smartphone className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                  </span>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-[#0A0D27] truncate max-w-[340px] group-hover:text-[#524CF2] transition-colors">
                                    {txn.description ?? "-"}
                                  </p>
                                  {balanceAfter != null && (
                                    <p className="text-xs text-[#33375C]/40 mt-0.5">
                                      bal: {formatCurrency(balanceAfter)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              {txn.category ? (
                                <span className="flex items-center gap-1.5 text-sm text-[#33375C]">
                                  <span
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: txn.category.color }}
                                  />
                                  {txn.category.name}
                                </span>
                              ) : (
                                <span className="text-[#33375C]/30 text-sm">-</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                                typeConfig[txn.txn_type]
                              )}>
                                {txn.txn_type}
                              </span>
                            </td>
                            <td className={cn(
                              "px-5 py-3.5 text-right font-bold text-sm whitespace-nowrap",
                              txn.txn_type === "income" ? "text-emerald-600" : txn.txn_type === "expense" ? "text-rose-600" : "text-[#524CF2]"
                            )}>
                              {txn.txn_type === "income" ? "+" : txn.txn_type === "expense" ? "−" : ""}
                              {formatCurrency(txn.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-[#E2E2FF] bg-[#F0F0FF]/20">
            <span className="text-xs sm:text-sm text-[#33375C]/70">
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={filterUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#33375C] border border-[#E2E2FF] rounded-lg hover:bg-white transition-colors"
                >
                  ← Prev
                </a>
              )}
              {page < totalPages && (
                <a
                  href={filterUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#524CF2] border border-[#E2E2FF] bg-white rounded-lg hover:bg-[#F0F0FF] transition-colors"
                >
                  Next →
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <TransactionDetailSheet
        transaction={selected}
        categories={categories}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
