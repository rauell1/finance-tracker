import { getTransactions, getAccounts, getCategories } from "@/lib/queries";
import { ImportTrigger } from "@/components/forms/import-trigger";
import { TransactionsClient } from "@/components/forms/transactions-client";
import { ArrowLeftRight, Search, X } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

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

  const activeFilters: { label: string; href: string }[] = [];
  if (params.search) activeFilters.push({ label: `"${params.search}"`, href: filterUrl({ search: undefined }) });
  if (params.account_id) {
    const a = accounts.find((x) => x.id === params.account_id);
    if (a) activeFilters.push({ label: a.name, href: filterUrl({ account_id: undefined }) });
  }
  if (params.category_id) {
    const c = categories.find((x) => x.id === params.category_id);
    if (c) activeFilters.push({ label: c.name, href: filterUrl({ category_id: undefined }) });
  }
  if (params.txn_type) activeFilters.push({ label: params.txn_type, href: filterUrl({ txn_type: undefined }) });
  if (params.date_from) activeFilters.push({ label: `from ${params.date_from}`, href: filterUrl({ date_from: undefined }) });
  if (params.date_to) activeFilters.push({ label: `to ${params.date_to}`, href: filterUrl({ date_to: undefined }) });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-[#524CF2]" />
            <h1 className="text-2xl font-bold text-[#0A0D27] tracking-tight">Transactions</h1>
          </div>
          <span className="bg-[#F0F0FF] text-[#524CF2] text-xs font-semibold px-2.5 py-1 rounded-full">
            {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ImportTrigger accounts={accounts} />
        </div>
      </div>

      {/* Filter bar */}
      <form method="GET" action="/transactions" className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm p-3 sm:p-4">
        <div className="flex flex-wrap gap-2.5">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#33375C]/40" />
            <input
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Search description…"
              className="w-full h-9 pl-8 pr-3 text-sm border border-[#E2E2FF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30 focus:border-[#524CF2]"
            />
          </div>
          <select
            name="account_id"
            defaultValue={params.account_id ?? ""}
            className="h-9 px-3 text-sm border border-[#E2E2FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30 bg-white"
          >
            <option value="">All accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select
            name="category_id"
            defaultValue={params.category_id ?? ""}
            className="h-9 px-3 text-sm border border-[#E2E2FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30 bg-white"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            name="txn_type"
            defaultValue={params.txn_type ?? ""}
            className="h-9 px-3 text-sm border border-[#E2E2FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30 bg-white"
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
            className="h-9 px-3 text-sm border border-[#E2E2FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30"
          />
          <input
            name="date_to"
            type="date"
            defaultValue={params.date_to ?? ""}
            className="h-9 px-3 text-sm border border-[#E2E2FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30"
          />
          <button
            type="submit"
            className="h-9 px-4 text-sm font-semibold bg-[#524CF2] text-white rounded-lg hover:bg-[#625DF1] transition-colors"
          >
            Apply
          </button>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#E2E2FF]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#33375C]/60">Active:</span>
            {activeFilters.map((f) => (
              <Link
                key={f.label}
                href={f.href}
                className="inline-flex items-center gap-1 bg-[#F0F0FF] text-[#524CF2] text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-[#E2E2FF] transition-colors"
              >
                {f.label}
                <X className="h-3 w-3" />
              </Link>
            ))}
            <Link href="/transactions" className="text-xs text-[#33375C]/60 font-semibold hover:text-[#524CF2] ml-1">Clear all</Link>
          </div>
        )}
      </form>

      {/* Table */}
      <TransactionsClient
        transactions={transactions}
        categories={categories}
        total={total}
        page={page}
        totalPages={totalPages}
        params={params}
      />
    </div>
  );
}
