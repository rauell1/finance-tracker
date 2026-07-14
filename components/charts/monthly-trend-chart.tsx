"use client";
import { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import type { MonthlyTrend } from "@/types/domain";
import { getMonthLabel, formatCurrency } from "@/lib/utils";

interface MonthlyTrendChartProps {
  data: MonthlyTrend[];
  defaultMonths?: number;
}

const PERIOD_OPTIONS = [
  { label: "3M", value: 3 },
  { label: "6M", value: 6 },
  { label: "12M", value: 12 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 border border-border rounded-xl shadow-xl px-4 py-3 text-xs backdrop-blur-md relative z-20">
      <p className="font-extrabold text-foreground mb-1.5">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} className="font-bold flex items-center gap-1.5 mt-1" style={{ color: entry.color }}>
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function MonthlyTrendChart({ data, defaultMonths = 6 }: MonthlyTrendChartProps) {
  const [months, setMonths] = useState(defaultMonths);

  const sliced = data.slice(-months);
  const chartData = sliced.map((d) => ({
    month: getMonthLabel(d.month + "-01"),
    Income: d.income,
    Expenses: d.expense,
  }));

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
        <div>
          <h2 className="font-bold text-foreground tracking-tight text-base">Income vs Expenses</h2>
          <p className="text-xs text-muted-foreground/60 mt-1 font-medium">How your money flows month by month</p>
        </div>
        <div className="flex rounded-xl border border-border/50 overflow-hidden bg-secondary/50 p-[2px]">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMonths(opt.value)}
              className={
                months === opt.value
                  ? "px-3.5 py-1.5 text-xs font-black bg-card text-primary rounded-lg shadow-sm transition-all border border-border/50"
                  : "px-3.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.25} />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: "currentColor", className: "text-muted-foreground/80 font-bold" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 9, fill: "currentColor", className: "text-muted-foreground/80 font-bold" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="Income"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#incomeGradient)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="Expenses"
              stroke="#F43F5E"
              strokeWidth={2}
              fill="url(#expenseGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 justify-center mt-3 border-t border-border/50 pt-3 text-[10px] font-bold text-muted-foreground/75">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm" />
            Inflows
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-rose-500 shadow-sm" />
            Outflows
          </div>
        </div>
      </div>
    </div>
  );
}
