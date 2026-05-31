import { getTransactions, getAccounts, getCategories } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ImportTrigger } from "@/components/forms/import-trigger";
import { TransactionsClient } from "@/components/forms/transactions-client";
import { Smartphone } from "lucide-react";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

const typeConfig = {
  income:   "bg-emerald-100 text-emerald-700",
  expense:  "bg-rose-100 text-rose-700",
  transfer: "bg-slate-100 text-slate-600",
};

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [{ data: transactions, total, page, totalPages }, accounts, categories] = await Promise.all([
    getTransactions(params),
    getAccounts(),
    getCategories(),
  ]);

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

      {/* Table — clickable rows open detail sheet (client wrapper) */}
      <TransactionsClient
        transactions={transactions}
        categories={categories}
        total={total}
        page={page}
        totalPages={totalPages}
        filterUrl={filterUrl}
      />
    </div>
  );
}
