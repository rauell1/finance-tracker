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
import { Wallet } from "lucide-react";

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
    <div className="space-y-6 sm:space-y-7">
      {/* Heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0D27] tracking-tight">Dashboard</h1>
        <p className="text-sm text-[#33375C]/60 mt-1">Your real-time wealth overview</p>
      </div>

      {/* KPI cards */}
      <KPICards data={kpi} />

      {/* Account balances */}
      <section>
        <div className="flex items-center gap-2 mb-3.5">
          <Wallet className="h-4 w-4 text-[#524CF2]" />
          <h2 className="text-sm font-semibold text-[#0A0D27]">Account Balances</h2>
        </div>
        <AccountBalanceCards accounts={accountComparison} />
      </section>

      {/* Trend chart + Category donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
        <div className="lg:col-span-3">
          <MonthlyTrendChart data={trend} defaultMonths={6} />
        </div>
        <div className="lg:col-span-2">
          <CategoryBreakdownChart data={categoryBreakdown} />
        </div>
      </div>

      {/* Recent transactions + Budget overview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
        <div className="lg:col-span-3">
          <RecentTransactions transactions={recentTxns} />
        </div>
        <div className="lg:col-span-2">
          <BudgetOverview budgets={budgets} />
        </div>
      </div>

      {/* Insights */}
      <InsightsPanel insights={insights} />
    </div>
  );
}
