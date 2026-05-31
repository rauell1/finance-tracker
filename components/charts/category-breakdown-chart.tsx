"use client";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { CategoryBreakdown } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

interface CategoryBreakdownChartProps {
  data: CategoryBreakdown[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as CategoryBreakdown;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700">{d.category_name}</p>
      <p className="text-slate-500">{formatCurrency(d.amount)} ({d.percentage.toFixed(1)}%)</p>
    </div>
  );
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">Spending Breakdown</h2>
        <p className="text-xs text-slate-400 mt-0.5">Expenses by category this month</p>
      </div>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <span className="text-4xl mb-3">📊</span>
          <p className="text-sm">No expenses this month</p>
        </div>
      ) : (
        <div className="p-4">
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="category_name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {data.map((entry) => (
                    <Cell key={entry.category_id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-sm font-bold text-slate-800">{formatCurrency(total)}</p>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-3 space-y-2">
            {data.map((entry) => (
              <div key={entry.category_id} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-slate-600 flex-1 truncate">{entry.category_name}</span>
                <span className="text-xs font-medium text-slate-700">{formatCurrency(entry.amount)}</span>
                <span className="text-xs text-slate-400 w-9 text-right">{entry.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
