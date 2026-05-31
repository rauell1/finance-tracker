import type { InsightItem } from "@/types/domain";
import { detectRecurringExpenses, detectSpendingSpikes, detectBudgetLeaks } from "@/lib/queries/dashboard";
export async function generateInsights(): Promise<InsightItem[]> {
  const insights: InsightItem[] = [];
  try {
    const [recurring, spikes, leaks] = await Promise.all([
      detectRecurringExpenses(), detectSpendingSpikes(), detectBudgetLeaks()
    ]);
    for (const item of recurring.slice(0, 5)) {
      insights.push({ id: `recurring-${item.description.slice(0, 20)}`, type: "recurring", severity: "info", title: "Recurring Charge Detected", message: `"${item.description}" appears ${item.count} months at ~$${item.amount.toFixed(2)}.`, recommendation: "Review if this subscription is still needed.", evidence: item, potential_savings: item.amount });
    }
    for (const item of spikes.slice(0, 3)) {
      insights.push({ id: `spike-${item.category_name}`, type: "spike", severity: item.increase_pct >= 50 ? "critical" : "warning", title: "Spending Spike Alert", message: `${item.category_name} is ${item.increase_pct.toFixed(0)}% above 3-month average.`, recommendation: `Review your ${item.category_name.toLowerCase()} expenses.`, evidence: item, potential_savings: item.current_amount - item.avg_amount });
    }
    for (const item of leaks.slice(0, 3)) {
      insights.push({ id: `leak-${item.category_name}`, type: "budget_leak", severity: "critical", title: "Chronic Budget Overspend", message: `${item.category_name} exceeded budget for ${item.consecutive_over} consecutive months.`, recommendation: `Consider revising your ${item.category_name.toLowerCase()} budget.`, evidence: item });
    }
    if (!insights.length) {
      insights.push({ id: "tip-good", type: "tip", severity: "info", title: "Financial Health Check", message: "No critical issues detected.", recommendation: "Consider increasing your emergency fund contributions.", evidence: {} });
    }
  } catch {
    insights.push({ id: "insight-error", type: "tip", severity: "info", title: "Insights Unavailable", message: "Add more transactions to unlock insights.", recommendation: "Track expenses for a few weeks.", evidence: {} });
  }
  return insights;
}
