import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InsightItem } from "@/types/domain";
import { cn } from "@/lib/utils";
import { AlertCircle, Info, AlertTriangle, Lightbulb } from "lucide-react";

interface InsightsPanelProps {
  insights: InsightItem[];
}

const severityConfig = {
  info: { icon: Info, color: "text-blue-600", badgeVariant: "secondary" as const },
  warning: { icon: AlertTriangle, color: "text-yellow-600", badgeVariant: "warning" as const },
  critical: { icon: AlertCircle, color: "text-red-600", badgeVariant: "destructive" as const },
};

const typeIcons = {
  recurring: Lightbulb,
  spike: AlertTriangle,
  budget_leak: AlertCircle,
  tip: Info,
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Smart Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No insights available</p>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => {
              const { icon: SeverityIcon, color, badgeVariant } = severityConfig[insight.severity];
              return (
                <div key={insight.id} className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                  <SeverityIcon className={cn("h-4 w-4 mt-0.5 shrink-0", color)} />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{insight.title}</p>
                      <Badge variant={badgeVariant} className="text-xs">{insight.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.message}</p>
                    <p className="text-xs text-primary font-medium">{insight.recommendation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
