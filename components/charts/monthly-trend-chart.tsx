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
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-lg px-3.5 py-2.5 text-xs backdrop-blur-md">
      <p className="font-bold text-slate-700 mb-1.5">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} className="font-bold" style={{ color: entry.color }}>
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/40">
        <div>
          <h2 className="font-bold text-slate-800 tracking-tight text-base">Cash Flow Analytics</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Monthly comparison of inflows vs outflows</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-100 p-[2px]">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMonths(opt.value)}
              className={
                months === opt.value
                  ? "px-3 py-1 text-xs font-bold bg-white text-indigo-600 rounded-md shadow-sm transition-all border border-slate-200/30"
                  : "px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
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
        <div className="flex items-center gap-4 justify-center mt-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
            Inflows
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm" />
            Outflows
          </div>
        </div>
      </div>
    </div>
  );
}
