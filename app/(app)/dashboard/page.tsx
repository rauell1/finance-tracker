import { getKPIData, getMonthlyTrend, getRecentTransactions, getBudgets, generateInsights } from "@/lib/queries";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";

export default async function DashboardPage() {
  const [kpi, trend, recent, budgets, insights] = await Promise.all([
    getKPIData(),
    getMonthlyTrend(6),
    getRecentTransactions(5),
    getBudgets(),
    generateInsights(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your financial overview</p>
      </div>
      <KPICards data={kpi} />
      <MonthlyTrendChart data={trend} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions transactions={recent} />
        <BudgetOverview budgets={budgets} />
      </div>
      <InsightsPanel insights={insights} />
    </div>
  );
}
