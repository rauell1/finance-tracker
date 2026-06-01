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
    border: "border-l-sky-400 border-[#E2E2FF]",
    icon: Info,
    iconColor: "text-sky-500",
    glow: "shadow-sm",
  },
  warning: {
    border: "border-l-amber-400 border-[#E2E2FF]",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    glow: "shadow-sm",
  },
  critical: {
    border: "border-l-rose-400 border-[#E2E2FF]",
    icon: AlertCircle,
    iconColor: "text-rose-500",
    glow: "shadow-sm",
  },
};

function InsightCard({ insight }: { insight: InsightItem }) {
  const [open, setOpen] = useState(false);
  const { border, icon: Icon, iconColor, glow } = severityConfig[insight.severity];

  return (
    <div className={cn("rounded-2xl border border-l-4 overflow-hidden bg-white transition-all duration-200 hover:bg-[#F0F0FF]/10", border, glow)}>
      <button
        className="w-full flex items-start gap-3.5 p-4.5 text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <Icon className={cn("h-4.5 w-4.5 mt-0.5 shrink-0", iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-extrabold text-[#0A0D27]">{insight.title}</p>
            {(insight.potential_savings ?? 0) > 0 && (
              <span className="text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-black">
                Save {formatCurrency(insight.potential_savings!)}
              </span>
            )}
          </div>
          <p className="text-xs text-[#33375C] mt-1 font-semibold leading-relaxed">{insight.message}</p>
        </div>
        {open ? (
          <ChevronUp className="h-4.5 w-4.5 text-[#33375C]/50 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="h-4.5 w-4.5 text-[#33375C]/50 shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <div className="px-4.5 pb-4.5">
          <div className="bg-[#F0F0FF] border border-[#E2E2FF] rounded-xl px-4 py-3.5">
            <p className="text-[10px] uppercase font-black tracking-wider text-[#524CF2] mb-1.5">Recommendation</p>
            <p className="text-xs text-[#33375C] leading-relaxed font-semibold">{insight.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="bg-white rounded-3xl border border-[#E2E2FF] shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-[#E2E2FF] bg-[#F0F0FF]/20">
        <h2 className="font-extrabold text-[#0A0D27] tracking-tight text-base">Smart Finance Insights</h2>
        <p className="text-xs text-[#33375C]/70 mt-1 font-semibold">Personalized wealth-optimization tips</p>
      </div>
      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-[#F0F0FF] flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-[#524CF2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <p className="text-sm font-semibold text-[#0A0D27]">All caught up</p>
          <p className="text-xs mt-1 text-[#33375C]/60">Insights will populate as you track expenses.</p>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F0F0FF]/5">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
