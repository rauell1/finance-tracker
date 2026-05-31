"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import type { AccountComparison } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountComparisonChartProps {
  data: AccountComparison[];
}

export function AccountComparisonChart({ data }: AccountComparisonChartProps) {
  const chartData = data.map((a) => ({
    name: a.account_name,
    Income: a.income,
    Expenses: a.expense,
    Balance: a.balance,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Account Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="Income" fill="#22C55E" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Expenses" fill="#EF4444" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Balance" fill="#3B82F6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
