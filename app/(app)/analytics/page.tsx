import { getMonthlyTrend, getCategoryBreakdown, getAccountComparison } from "@/lib/queries";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { AccountComparisonChart } from "@/components/charts/account-comparison-chart";

export default async function AnalyticsPage() {
  const [trend, breakdown, accounts] = await Promise.all([
    getMonthlyTrend(12),
    getCategoryBreakdown(),
    getAccountComparison(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your financial patterns</p>
      </div>
      <MonthlyTrendChart data={trend} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdownChart data={breakdown} />
        <AccountComparisonChart data={accounts} />
      </div>
    </div>
  );
}
