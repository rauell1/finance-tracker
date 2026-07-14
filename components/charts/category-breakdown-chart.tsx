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
    <div className="bg-card/95 border border-border rounded-xl shadow-xl px-4 py-3 text-xs backdrop-blur-md relative z-20">
      <p className="font-extrabold text-foreground">{d.category_name}</p>
      <p className="font-bold text-rose-600 dark:text-rose-450 mt-1 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
        {formatCurrency(d.amount)} ({d.percentage.toFixed(1)}%)
      </p>
    </div>
  );
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border/50">
        <h2 className="font-bold text-foreground tracking-tight text-base">Where Your Money Goes</h2>
        <p className="text-xs text-muted-foreground/60 mt-1 font-medium">How your spending is split this month</p>
      </div>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
          <span className="text-4xl mb-3">📊</span>
          <p className="text-sm font-black text-foreground">No data compiled</p>
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
                    <Cell key={entry.category_id} fill={entry.color} stroke="currentColor" className="text-card" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-5px]">
              <p className="text-[10px] uppercase font-black text-muted-foreground/45 tracking-wider">Spent</p>
              <p className="text-base font-black text-foreground mt-0.5">{formatCurrency(total)}</p>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-border/50 space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {data.map((entry) => (
              <div key={entry.category_id} className="flex items-center gap-2 hover:bg-secondary/40 p-1.5 rounded-xl transition-all duration-200 group">
                <div className="h-2 w-2 rounded-full shrink-0 shadow-sm border border-black/5" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-bold text-muted-foreground/80 flex-1 truncate group-hover:text-primary transition-colors">{entry.category_name}</span>
                <span className="text-xs font-black text-foreground">{formatCurrency(entry.amount)}</span>
                <span className="text-[9px] font-black text-muted-foreground/60 w-8 text-right bg-secondary border border-border/50 px-1 py-0.2 rounded-md">{entry.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
