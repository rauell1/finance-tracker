import {
  getKPIData, getMonthlyTrend, getCategoryBreakdown, getAccountComparison,
  getRecentTransactions, getBudgets, generateInsights
} from "@/lib/queries";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { AccountBalanceCards } from "@/components/dashboard/account-balance-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [kpi, trend, categoryBreakdown, accountComparison, recentTxns, budgets, insights] = await Promise.all([
    getKPIData(),
    getMonthlyTrend(6),
    getCategoryBreakdown(),
    getAccountComparison(),
    getRecentTransactions(8),
    getBudgets(),
    generateInsights(),
  ]);

  return (
    <div className="space-y-6">
      {/* Row 1: heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Your financial overview</p>
        </div>
      </div>

      {/* Row 2: KPI cards */}
      <KPICards data={kpi} />

      {/* Row 3: Account balance cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Account Balances</h2>
        <AccountBalanceCards accounts={accountComparison} />
      </div>

      {/* Row 4: Trend chart + Category donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <MonthlyTrendChart data={trend} defaultMonths={6} />
        </div>
        <div className="lg:col-span-2">
          <CategoryBreakdownChart data={categoryBreakdown} />
        </div>
      </div>

      {/* Row 5: Recent transactions + Budget overview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RecentTransactions transactions={recentTxns} />
        </div>
        <div className="lg:col-span-2">
          <BudgetOverview budgets={budgets} />
        </div>
      </div>

      {/* Row 6: Insights */}
      <InsightsPanel insights={insights} />
    </div>
  );
}
