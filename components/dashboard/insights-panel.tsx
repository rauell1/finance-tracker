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
    border: "border-l-sky-400 border-slate-800/40",
    icon: Info,
    iconColor: "text-sky-400",
    glow: "shadow-sky-950/5",
  },
  warning: {
    border: "border-l-amber-400 border-slate-800/40",
    icon: AlertTriangle,
    iconColor: "text-amber-400",
    glow: "shadow-amber-950/5",
  },
  critical: {
    border: "border-l-rose-400 border-slate-800/40",
    icon: AlertCircle,
    iconColor: "text-rose-400",
    glow: "shadow-rose-950/5",
  },
};

function InsightCard({ insight }: { insight: InsightItem }) {
  const [open, setOpen] = useState(false);
  const { border, icon: Icon, iconColor, glow } = severityConfig[insight.severity];

  return (
    <div className={cn("rounded-2xl border border-l-4 overflow-hidden bg-slate-950/30 transition-all duration-200 hover:bg-slate-950/50", border, glow)}>
      <button
        className="w-full flex items-start gap-3 p-4.5 text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-200">{insight.title}</p>
            {(insight.potential_savings ?? 0) > 0 && (
              <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                Save {formatCurrency(insight.potential_savings!)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">{insight.message}</p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <div className="px-4.5 pb-4.5">
          <div className="bg-emerald-950/30 border border-emerald-800/20 rounded-xl px-4 py-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 mb-1">Recommendation</p>
            <p className="text-xs text-slate-300 leading-relaxed">{insight.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/60 shadow-lg shadow-black/20 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800/50 bg-slate-900/20">
        <h2 className="font-bold text-slate-100 tracking-tight text-base">Smart Finance Insights</h2>
        <p className="text-xs text-slate-400 mt-1">Personalized wealth-optimization tips</p>
      </div>
      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <span className="text-4xl mb-3 animate-pulse">💡</span>
          <p className="text-sm font-semibold text-slate-400">All caught up</p>
          <p className="text-xs mt-1 text-slate-500">Insights will populate as you track expenses</p>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
