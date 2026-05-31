import { getMonthlyTrend, getCategoryBreakdown, getAccountComparison, getKPIData, getMerchantSpend, getAccountSpend } from "@/lib/queries";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { AccountComparisonChart } from "@/components/charts/account-comparison-chart";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACCOUNT_COLORS: Record<string, string> = {
  main: "#10B981", bank_a: "#3B82F6", bank_b: "#8B5CF6", bank_c: "#F59E0B",
};

export default async function AnalyticsPage() {
  const [trend, breakdown, accounts, kpi, merchants, accountSpend] = await Promise.all([
    getMonthlyTrend(12),
    getCategoryBreakdown(),
    getAccountComparison(),
    getKPIData(),
    getMerchantSpend(),
    getAccountSpend(),
  ]);

  const maxMerchant = merchants[0]?.total ?? 1;

  // Last month KPI for comparison
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  now.setDate(1);
  const lastMonthStr = now.toISOString().split("T")[0];
  const lastKpi = await getKPIData(lastMonthStr);

  const statCards = [
    {
      label: "This Month Income",
      value: formatCurrency(kpi.monthlyIncome),
      sub: `vs ${formatCurrency(lastKpi.monthlyIncome)} last month`,
      color: "text-emerald-600",
    },
    {
      label: "This Month Expenses",
      value: formatCurrency(kpi.monthlyExpense),
      sub: `vs ${formatCurrency(lastKpi.monthlyExpense)} last month`,
      color: "text-rose-600",
    },
    {
      label: "Net Cashflow",
      value: formatCurrency(Math.abs(kpi.netCashflow)),
      sub: kpi.netCashflow >= 0 ? "Positive cashflow" : "Negative cashflow",
      color: kpi.netCashflow >= 0 ? "text-emerald-600" : "text-rose-600",
    },
    {
      label: "Total Balance",
      value: formatCurrency(kpi.totalBalance),
      sub: "Across all accounts",
      color: "text-slate-700",
    },
  ];

  // Top spending categories
  const topCategories = breakdown.slice(0, 5);
  const maxAmount = topCategories[0]?.amount ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <p className="text-sm text-slate-400 mt-0.5">Deep dive into your financial patterns</p>
      </div>

      {/* Stat comparison cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 mb-2">{card.label}</p>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Spending by account this month */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Spending by Account</h2>
          <p className="text-xs text-slate-400 mt-0.5">This month, per account</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {accountSpend.map((a) => (
            <div key={a.account_id} className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACCOUNT_COLORS[a.account_code] ?? "#64748B" }} />
                <span className="text-sm font-semibold text-slate-700">{a.account_name}</span>
              </div>
              <p className="text-lg font-bold text-rose-600">{formatCurrency(a.expense)}</p>
              <p className="text-xs text-slate-400 mt-0.5">spent · {a.txn_count} txns</p>
              {a.income > 0 && (
                <p className="text-xs text-emerald-600 mt-1">+{formatCurrency(a.income)} in</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Spending by establishment / merchant */}
      {merchants.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Spending by Establishment</h2>
            <p className="text-xs text-slate-400 mt-0.5">Where your money went this month</p>
          </div>
          <div className="divide-y divide-slate-50">
            {merchants.map((m, idx) => (
              <div key={m.merchant} className={`px-5 py-3.5 ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{m.merchant}</p>
                    <div className="flex items-center gap-2">
                      {m.category_color && (
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: m.category_color }} />
                      )}
                      <p className="text-xs text-slate-400">
                        {m.category_name ?? "Uncategorised"} · {m.count} {m.count === 1 ? "visit" : "visits"} · avg {formatCurrency(m.avg)}
                      </p>
                    </div>
                  </div>
                  <div className="w-24 hidden sm:block">
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-rose-400" style={{ width: `${(m.total / maxMerchant) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-28 text-right">
                    {formatCurrency(m.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 12-month trend full width */}
      <MonthlyTrendChart data={trend} defaultMonths={12} />

      {/* Donut + Account comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdownChart data={breakdown} />
        <AccountComparisonChart data={accounts} />
      </div>

      {/* Top spending categories table */}
      {topCategories.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Top Spending Categories</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {topCategories.map((cat, idx) => (
              <div key={cat.category_id} className={`px-5 py-3.5 ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}</span>
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium text-slate-700 flex-1">{cat.category_name}</span>
                  <div className="w-32 hidden sm:block">
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(cat.amount / maxAmount) * 100}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-28 text-right">
                    {formatCurrency(cat.amount)}
                  </span>
                  <span className="text-xs text-slate-400 w-10 text-right">
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly summary table */}
      {trend.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Monthly Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Month</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Income</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expenses</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...trend].reverse().map((row, idx) => (
                  <tr key={row.month} className={idx % 2 === 1 ? "bg-slate-50/50" : ""}>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {new Date(row.month + "-01T00:00:00").toLocaleDateString("en-KE", { month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-sm text-right text-emerald-600 font-medium">
                      {formatCurrency(row.income)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right text-rose-600 font-medium">
                      {formatCurrency(row.expense)}
                    </td>
                    <td className={`px-5 py-3 text-sm text-right font-semibold ${row.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {row.net >= 0 ? "+" : "−"}{formatCurrency(Math.abs(row.net))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
