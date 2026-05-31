import { getBudgets, getCategories } from "@/lib/queries";
import { formatCurrency, getMonthStart } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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

export default async function BudgetsPage() {
  const month = getMonthStart(new Date());
  const [budgets, categories] = await Promise.all([getBudgets(month), getCategories("expense")]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Budgets</h1>
        <p className="text-muted-foreground">Track your spending limits</p>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No budgets set for this month. Create a budget to start tracking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <Card key={budget.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: budget.category?.color ?? "#64748B" }} />
                    <CardTitle className="text-sm">{budget.category?.name ?? "Unknown"}</CardTitle>
                  </div>
                  <Badge variant={budget.status === "safe" ? "success" : budget.status === "warning" ? "warning" : "destructive"}>
                    {budget.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress
                  value={budget.spent}
                  max={budget.amount}
                  indicatorClassName={progressColors[budget.status]}
                />
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Spent</p>
                    <p className={cn("font-semibold", statusColors[budget.status])}>{formatCurrency(budget.spent)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Budget</p>
                    <p className="font-semibold">{formatCurrency(budget.amount)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {budget.remaining >= 0 ? `${formatCurrency(budget.remaining)} remaining` : `${formatCurrency(Math.abs(budget.remaining))} over budget`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
