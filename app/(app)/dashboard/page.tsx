import { Suspense } from "react";
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
import { PeriodSelector } from "@/components/dashboard/period-selector";

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
      {/* Heading + Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0D27] tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#33375C]/60 mt-1">Your real-time wealth overview</p>
        </div>
        <Suspense fallback={<div className="h-10 w-72 rounded-2xl bg-[#F0F0FF]/50 border border-[#E2E2FF]" />}>
          <PeriodSelector />
        </Suspense>
      </div>

      {/* KPI cards */}
      <KPICards data={kpi} period={period} />

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
