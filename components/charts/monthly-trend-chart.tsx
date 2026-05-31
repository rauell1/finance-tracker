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
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl shadow-xl px-3.5 py-2.5 text-xs backdrop-blur-md">
      <p className="font-bold text-slate-200 mb-1.5">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} className="font-semibold" style={{ color: entry.color }}>
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
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/60 shadow-lg shadow-black/20 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/50 bg-slate-900/20">
        <div>
          <h2 className="font-bold text-slate-100 tracking-tight text-base">Cash Flow Analytics</h2>
          <p className="text-xs text-slate-400 mt-1">Monthly comparison of inflows vs outflows</p>
        </div>
        <div className="flex rounded-lg border border-slate-800 overflow-hidden bg-slate-950/40 p-[2px]">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMonths(opt.value)}
              className={
                months === opt.value
                  ? "px-3 py-1 text-xs font-semibold bg-indigo-600/90 text-white rounded-md shadow-sm transition-all"
                  : "px-3 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
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
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748B", fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748B", fontWeight: 600 }}
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
        <div className="flex items-center gap-4 justify-center mt-3 border-t border-slate-800/40 pt-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />
            Inflows
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/30" />
            Outflows
          </div>
        </div>
      </div>
    </div>
  );
}
