import {
  getKPIData, getMonthlyTrend, getCategoryBreakdown, getAccountComparison,
  getRecentTransactions, getBudgets, generateInsights,
  getUpcomingObligations, getDebts, getSavingsGoals,
} from "@/lib/queries";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { AccountBalanceCards } from "@/components/dashboard/account-balance-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { UpcomingBills } from "@/components/dashboard/upcoming-bills";
import { DebtSummary } from "@/components/dashboard/debt-summary";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { Wallet } from "lucide-react";
import { SavingsProgress } from "@/components/dashboard/savings-progress";
import { HeroBanner } from "@/components/dashboard/hero-banner";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const period = (params.period as "month" | "quarter" | "year" | "all") ?? "month";

  const [kpi, trend, categoryBreakdown, accountComparison, recentTxns, budgets, insights, upcoming, debts, savingsGoals] = await Promise.all([
    getKPIData(undefined, period),
    getMonthlyTrend(6),
    getCategoryBreakdown(undefined, period),
    getAccountComparison(undefined, period),
    getRecentTransactions(8),
    getBudgets(),
    generateInsights(),
    getUpcomingObligations(7).catch(() => []),
    getDebts().catch(() => []),
    getSavingsGoals().catch(() => []),
  ]);

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Hero: greeting + net worth + Fuliza status */}
      <HeroBanner
        totalBalance={kpi.totalBalance}
        debts={debts}
      />

      {/* KPI cards */}
      <KPICards data={kpi} period={period} />

      {/* Account balances */}
      <section>
        <div className="flex items-center gap-2 mb-3.5">
          <Wallet className="h-4 w-4 text-[#524CF2]" />
          <h2 className="text-sm font-bold text-[#0A0D27]">Account Balances</h2>
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

      {/* Upcoming bills + Debts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <UpcomingBills obligations={upcoming} />
        <DebtSummary debts={debts} />
      </div>

      {/* Savings Goals */}
      <SavingsProgress goals={savingsGoals} />

      {/* Insights */}
      <InsightsPanel insights={insights} />
    </div>
  );
}
