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
    border: "border-l-sky-400 border-slate-200",
    icon: Info,
    iconColor: "text-sky-500",
    glow: "shadow-sm",
  },
  warning: {
    border: "border-l-amber-400 border-slate-200",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    glow: "shadow-sm",
  },
  critical: {
    border: "border-l-rose-400 border-slate-200",
    icon: AlertCircle,
    iconColor: "text-rose-500",
    glow: "shadow-sm",
  },
};

function InsightCard({ insight }: { insight: InsightItem }) {
  const [open, setOpen] = useState(false);
  const { border, icon: Icon, iconColor, glow } = severityConfig[insight.severity];

  return (
    <div className={cn("rounded-2xl border border-l-4 overflow-hidden bg-white transition-all duration-200 hover:bg-slate-50/50", border, glow)}>
      <button
        className="w-full flex items-start gap-3 p-4.5 text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-700">{insight.title}</p>
            {(insight.potential_savings ?? 0) > 0 && (
              <span className="text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                Save {formatCurrency(insight.potential_savings!)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{insight.message}</p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <div className="px-4.5 pb-4.5">
          <div className="bg-emerald-50/60 border border-emerald-100/70 rounded-xl px-4 py-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 mb-1">Recommendation</p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">{insight.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/40">
        <h2 className="font-bold text-slate-800 tracking-tight text-base">Smart Finance Insights</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Personalized wealth-optimization tips</p>
      </div>
      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <span className="text-4xl mb-3 animate-pulse">💡</span>
          <p className="text-sm font-semibold text-slate-500">All caught up</p>
          <p className="text-xs mt-1 text-slate-400">Insights will populate as you track expenses</p>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/20">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
