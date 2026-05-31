"use client";

import { useState } from "react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { TransactionDetailSheet } from "./transaction-detail-sheet";
import type { Transaction, Category } from "@/types/domain";
import { Smartphone } from "lucide-react";

interface TransactionsClientProps {
  transactions: Transaction[];
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
  filterUrl: (overrides: Record<string, string | undefined>) => string;
}

const typeConfig = {
  income:   "bg-emerald-100 text-emerald-700",
  expense:  "bg-rose-100 text-rose-700",
  transfer: "bg-slate-100 text-slate-600",
};

export function TransactionsClient({
  transactions,
  categories,
  total,
  page,
  totalPages,
  filterUrl,
}: TransactionsClientProps) {
  const [selected, setSelected] = useState<Transaction | null>(null);

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="text-5xl mb-4">🔍</span>
            <p className="text-base font-medium text-slate-600">No transactions found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a transaction</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((txn) => {
                  const meta = txn.metadata as Record<string, unknown>;
                  const isWebhook = meta?.source === "sms_webhook";
                  const balanceAfter = meta?.balance_after as number | null | undefined;

                  return (
                    <tr
                      key={txn.id}
                      onClick={() => setSelected(txn)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                        {formatDate(txn.occurred_on)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-start gap-2">
                          {isWebhook && (
                            <span title="Auto-imported via M-Pesa SMS">
                              <Smartphone className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate max-w-[200px] group-hover:text-emerald-700 transition-colors">
                              {txn.description ?? "—"}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs text-slate-400">{txn.account?.name ?? "—"}</p>
                              {balanceAfter != null && (
                                <p className="text-xs text-slate-300">
                                  bal: {formatCurrency(balanceAfter)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        {txn.category ? (
                          <span className="flex items-center gap-1.5 text-sm text-slate-600">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: txn.category.color }}
                            />
                            {txn.category.name}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          typeConfig[txn.txn_type]
                        )}>
                          {txn.txn_type}
                        </span>
                      </td>
                      <td className={cn(
                        "px-5 py-3.5 text-right font-semibold text-sm whitespace-nowrap",
                        txn.txn_type === "income" ? "text-emerald-600" : txn.txn_type === "expense" ? "text-rose-600" : "text-slate-600"
                      )}>
                        {txn.txn_type === "income" ? "+" : txn.txn_type === "expense" ? "−" : ""}
                        {formatCurrency(txn.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={filterUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-white transition-colors"
                >
                  ← Prev
                </a>
              )}
              {page < totalPages && (
                <a
                  href={filterUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 text-sm text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  Next →
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail / edit sheet */}
      <TransactionDetailSheet
        transaction={selected}
        categories={categories}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
