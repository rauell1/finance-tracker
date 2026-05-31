"use client";
import { useState } from "react";
import type { InsightItem } from "@/types/domain";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, Info, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

interface InsightsPanelProps {
  insights: InsightItem[];
}

const severityConfig = {
  info: {
    border: "border-l-sky-400",
    icon: Info,
    iconColor: "text-sky-500",
    bg: "bg-white",
  },
  warning: {
    border: "border-l-amber-400",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    bg: "bg-white",
  },
  critical: {
    border: "border-l-rose-400",
    icon: AlertCircle,
    iconColor: "text-rose-500",
    bg: "bg-white",
  },
};

function InsightCard({ insight }: { insight: InsightItem }) {
  const [open, setOpen] = useState(false);
  const { border, icon: Icon, iconColor } = severityConfig[insight.severity];

  return (
    <div className={cn("rounded-xl border border-slate-200 border-l-4 shadow-sm overflow-hidden", border)}>
      <button
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-800">{insight.title}</p>
            {(insight.potential_savings ?? 0) > 0 && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                Save {formatCurrency(insight.potential_savings!)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{insight.message}</p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5">
            <p className="text-xs font-semibold text-emerald-700 mb-1">Recommendation</p>
            <p className="text-xs text-emerald-600">{insight.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">Smart Insights</h2>
        <p className="text-xs text-slate-400 mt-0.5">Personalized recommendations</p>
      </div>
      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <span className="text-4xl mb-3">✨</span>
          <p className="text-sm">No insights available yet</p>
          <p className="text-xs mt-1">Keep tracking to unlock recommendations</p>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
