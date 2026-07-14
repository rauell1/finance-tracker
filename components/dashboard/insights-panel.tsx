"use client";
import { useState } from "react";
import type { InsightItem } from "@/types/domain";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, Info, AlertTriangle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface InsightsPanelProps {
  insights: InsightItem[];
}

const severityRank = { critical: 0, warning: 1, info: 2 } as const;

const severityConfig = {
  info: {
    bg: "bg-sky-50/60 border-sky-100 dark:bg-sky-500/10 dark:border-sky-500/20",
    icon: Info,
    iconColor: "text-sky-500",
  },
  warning: {
    bg: "bg-amber-50/60 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  critical: {
    bg: "bg-rose-50/60 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20",
    icon: AlertCircle,
    iconColor: "text-rose-500",
  },
};

function InsightCard({ insight }: { insight: InsightItem }) {
  const [open, setOpen] = useState(false);
  const { bg, icon: Icon, iconColor } = severityConfig[insight.severity];

  return (
    <div className={cn("rounded-2xl border overflow-hidden transition-all duration-200 shadow-sm", bg)}>
      <button
        className="w-full flex items-start gap-3.5 p-4 text-left focus:outline-none"
        onClick={() => setOpen(!open)}
      >
        <Icon className={cn("h-4.5 w-4.5 mt-0.5 shrink-0", iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-foreground">{insight.title}</p>
            {(insight.potential_savings ?? 0) > 0 && (
              <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                Save {formatCurrency(insight.potential_savings!)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">{insight.message}</p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="bg-background/80 rounded-xl px-4 py-3 border border-border/20">
            <p className="text-[10px] uppercase font-bold tracking-wider text-primary mb-1">Recommendation</p>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">{insight.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const sorted = [...insights].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-foreground tracking-tight text-base">Insights</h2>
          <p className="text-xs text-muted-foreground/80 mt-0.5 font-medium">
            {sorted.length === 0 ? "Personalized tips for your money" : `${sorted.length} tip${sorted.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Sparkles className="h-4.5 w-4.5 text-primary" />
      </div>
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">All caught up</p>
          <p className="text-xs mt-1 text-muted-foreground/60">Insights will populate as you track expenses.</p>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
