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
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-xs backdrop-blur-md">
      <p className="font-bold text-slate-705">{d.category_name}</p>
      <p className="font-bold text-rose-600 mt-1">{formatCurrency(d.amount)} ({d.percentage.toFixed(1)}%)</p>
    </div>
  );
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/40">
        <h2 className="font-bold text-slate-800 tracking-tight text-base">Category Allocation</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Breakdown of outbound payments this month</p>
      </div>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <span className="text-4xl mb-3">📊</span>
          <p className="text-sm font-semibold text-slate-450">No data compiled</p>
        </div>
      ) : (
        <div className="p-5">
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="category_name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {data.map((entry) => (
                    <Cell key={entry.category_id} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-5px]">
              <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Spent</p>
              <p className="text-base font-extrabold text-slate-800 mt-0.5">{formatCurrency(total)}</p>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {data.map((entry) => (
              <div key={entry.category_id} className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded-md transition-colors">
                <div className="h-2 w-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-semibold text-slate-600 flex-1 truncate">{entry.category_name}</span>
                <span className="text-xs font-bold text-slate-700">{formatCurrency(entry.amount)}</span>
                <span className="text-[9px] font-bold text-slate-500 w-8 text-right bg-slate-55/20 border border-slate-200 px-1 py-0.2 rounded">{entry.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
