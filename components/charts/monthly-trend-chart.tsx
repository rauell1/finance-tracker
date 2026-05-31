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
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} style={{ color: entry.color }}>
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="font-semibold text-slate-800">Cash Flow Trend</h2>
          <p className="text-xs text-slate-400 mt-0.5">Income vs Expenses over time</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMonths(opt.value)}
              className={
                months === opt.value
                  ? "px-3 py-1 text-xs font-semibold bg-emerald-600 text-white"
                  : "px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50"
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e11d48" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="Income"
              stroke="#059669"
              strokeWidth={2}
              fill="url(#incomeGradient)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="Expenses"
              stroke="#e11d48"
              strokeWidth={2}
              fill="url(#expenseGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 justify-center mt-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            Income
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            Expenses
          </div>
        </div>
      </div>
    </div>
  );
}
