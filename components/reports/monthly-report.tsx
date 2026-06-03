"use client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Download, Printer, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportData {
  month: string;
  income: { total: number; count: number };
  expense: { total: number; count: number; byCategory: { name: string; color: string; amount: number }[] };
  net: number;
  topMerchants: { name: string; amount: number }[];
  accounts: { name: string; code: string; balance: number }[];
  budgetPerformance: { category: string; budget: number; spent: number; remaining: number }[];
  savingsGoals: { name: string; target: number; current: number; progress: number }[];
  transactionCount: number;
  transactions: { date: string; description: string; type: string; amount: number; category: string; account: string }[];
}

export function MonthlyReport({ month }: { month: string }) {
  const { data: report, isLoading } = useQuery<ReportData>({
    queryKey: ["report", "monthly", month],
    queryFn: async () => {
      const res = await fetch(`/api/reports/monthly?month=${month}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  function handlePrint() {
    window.print();
  }

  function handleCSV() {
    if (!report) return;
    const header = "Date,Description,Type,Amount,Category,Account";
    const rows = report.transactions.map((t) =>
      `${t.date},"${(t.description ?? "").replace(/"/g, '""')}",${t.type},${t.amount},"${t.category}","${t.account}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fintrack-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!report) return <p className="text-sm text-[#33375C]/60">No data available</p>;

  const monthLabel = new Date(month + "-01T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5 print:space-y-4">
      {/* Actions */}
      <div className="flex gap-2 no-print">
        <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-[#E2E2FF] text-[#33375C] hover:bg-[#F0F0FF] transition-colors">
          <Printer className="h-4 w-4" /> Print / PDF
        </button>
        <button onClick={handleCSV} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-[#E2E2FF] text-[#33375C] hover:bg-[#F0F0FF] transition-colors">
          <Download className="h-4 w-4" /> Download CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#33375C]/60">Income</p>
          </div>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(report.income.total)}</p>
          <p className="text-xs text-[#33375C]/50 mt-1">{report.income.count} transactions</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#33375C]/60">Expenses</p>
          </div>
          <p className="text-xl font-bold text-rose-600">{formatCurrency(report.expense.total)}</p>
          <p className="text-xs text-[#33375C]/50 mt-1">{report.expense.count} transactions</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-[#524CF2]" />
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#33375C]/60">Net</p>
          </div>
          <p className={cn("text-xl font-bold", report.net >= 0 ? "text-emerald-600" : "text-rose-600")}>{report.net >= 0 ? "+" : "-"}{formatCurrency(Math.abs(report.net))}</p>
          <p className="text-xs text-[#33375C]/50 mt-1">{report.transactionCount} total</p>
        </div>
      </div>

      {/* Expense by Category */}
      {report.expense.byCategory.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E2FF] bg-[#F0F0FF]/20">
            <h3 className="font-semibold text-[#0A0D27] text-sm">Expenses by Category</h3>
          </div>
          <div className="divide-y divide-[#E2E2FF]">
            {report.expense.byCategory.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm font-semibold text-[#0A0D27]">{c.name}</span>
                </div>
                <span className="text-sm font-bold text-[#0A0D27]">{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Merchants */}
      {report.topMerchants.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E2FF] bg-[#F0F0FF]/20">
            <h3 className="font-semibold text-[#0A0D27] text-sm">Top Merchants</h3>
          </div>
          <div className="divide-y divide-[#E2E2FF]">
            {report.topMerchants.map((m, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-[#0A0D27]">{m.name}</span>
                <span className="text-sm font-bold text-[#0A0D27]">{formatCurrency(m.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Performance */}
      {report.budgetPerformance.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm overflow-hidden print-break">
          <div className="px-5 py-4 border-b border-[#E2E2FF] bg-[#F0F0FF]/20">
            <h3 className="font-semibold text-[#0A0D27] text-sm">Budget Performance</h3>
          </div>
          <div className="divide-y divide-[#E2E2FF]">
            {report.budgetPerformance.map((b, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-[#0A0D27]">{b.category}</span>
                <div className="text-right">
                  <span className={cn("text-sm font-bold", b.remaining < 0 ? "text-rose-600" : "text-[#0A0D27]")}>{formatCurrency(b.spent)}</span>
                  <span className="text-xs text-[#33375C]/50 ml-1">/ {formatCurrency(b.budget)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Savings Goals */}
      {report.savingsGoals.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E2FF] bg-[#F0F0FF]/20">
            <h3 className="font-semibold text-[#0A0D27] text-sm">Savings Goals Progress</h3>
          </div>
          <div className="divide-y divide-[#E2E2FF]">
            {report.savingsGoals.map((g, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-[#0A0D27]">{g.name}</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#0A0D27]">{g.progress}%</span>
                  <span className="text-xs text-[#33375C]/50 ml-1">{formatCurrency(g.current)} / {formatCurrency(g.target)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
