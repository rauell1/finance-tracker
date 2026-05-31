import { getTransactions, getAccounts, getCategories } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ImportTrigger } from "@/components/forms/import-trigger";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

const typeConfig = {
  income: "bg-emerald-100 text-emerald-700",
  expense: "bg-rose-100 text-rose-700",
  transfer: "bg-slate-100 text-slate-600",
};

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [{ data: transactions, total, page, totalPages }, accounts, categories] = await Promise.all([
    getTransactions(params),
    getAccounts(),
    getCategories(),
  ]);

  // Build filter URL helper
  function filterUrl(overrides: Record<string, string | undefined>) {
    const next = { ...params, ...overrides };
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(next).filter(([, v]) => v != null && v !== "")) as Record<string, string>
    );
    return `/transactions?${qs.toString()}`;
  }

  const hasFilters = !!(params.search || params.account_id || params.category_id || params.txn_type || params.date_from || params.date_to);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Transactions</h1>
          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ImportTrigger accounts={accounts} />
        </div>
      </div>

      {/* Filter bar */}
      <form method="GET" action="/transactions" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <input
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search description…"
            className="flex-1 min-w-[180px] h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <select
            name="account_id"
            defaultValue={params.account_id ?? ""}
            className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select
            name="category_id"
            defaultValue={params.category_id ?? ""}
            className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            name="txn_type"
            defaultValue={params.txn_type ?? ""}
            className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>
          <input
            name="date_from"
            type="date"
            defaultValue={params.date_from ?? ""}
            className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            name="date_to"
            type="date"
            defaultValue={params.date_to ?? ""}
            className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="h-9 px-4 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Filter
          </button>
          {hasFilters && (
            <a
              href="/transactions"
              className="h-9 px-4 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center"
            >
              Clear
            </a>
          )}
        </div>
      </form>

      {/* Table */}
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
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                      {formatDate(txn.occurred_on)}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-800 truncate max-w-[200px]">
                        {txn.description ?? "—"}
                      </p>
                      <p className="text-xs text-slate-400">{txn.account?.name ?? "—"}</p>
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
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
    </div>
  );
}
