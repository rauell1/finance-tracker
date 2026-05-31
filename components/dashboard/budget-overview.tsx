import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Budget } from "@/types/domain";
import { cn } from "@/lib/utils";

interface BudgetOverviewProps {
  budgets: Budget[];
}

const statusColors = {
  safe: "text-green-600",
  warning: "text-yellow-600",
  over: "text-red-600",
};

const progressColors = {
  safe: "bg-green-500",
  warning: "bg-yellow-500",
  over: "bg-red-500",
};

export function BudgetOverview({ budgets }: BudgetOverviewProps) {
  const displayed = budgets.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Budget Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {displayed.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No budgets set for this month</p>
        ) : (
          <div className="space-y-4">
            {displayed.map((budget) => (
              <div key={budget.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: budget.category?.color ?? "#64748B" }}
                    />
                    <span className="font-medium">{budget.category?.name ?? "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-semibold", statusColors[budget.status])}>
                      {budget.pct_used.toFixed(0)}%
                    </span>
                    <Badge variant={budget.status === "safe" ? "success" : budget.status === "warning" ? "warning" : "destructive"} className="text-xs">
                      {budget.status}
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={budget.spent}
                  max={budget.amount}
                  indicatorClassName={progressColors[budget.status]}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Spent: {formatCurrency(budget.spent)}</span>
                  <span>Budget: {formatCurrency(budget.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
