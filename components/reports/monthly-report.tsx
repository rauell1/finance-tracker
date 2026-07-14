"use client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Download, Printer, TrendingDown, TrendingUp, Wallet, Sparkles } from "lucide-react";
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
      {/* Print-only Header */}
      <div className="hidden print:block border-b-2 border-primary pb-4 mb-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black text-foreground">FINTRACK STATEMENT REPORT</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Automated Statement Analysis & Financial Intelligence</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-foreground">{monthLabel}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Prepared for Roy Okola Otieno</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 no-print">
        <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-[#E2E2FF] text-[#33375C] hover:bg-[#F0F0FF] transition-colors">
          <Download className="h-4 w-4" /> Download PDF Report
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

      {/* NVIDIA AI Insights */}
      <AIInsightsCard month={month} />

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

function AIInsightsCard({ month }: { month: string }) {
  const { data, isLoading, error, refetch } = useQuery<{ insight: string }>({
    queryKey: ["report", "insights", month],
    queryFn: async () => {
      const res = await fetch(`/api/reports/insights?month=${month}`);
      if (!res.ok) throw new Error("Failed to load insights");
      return res.json();
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const content = data?.insight;
  const parsedHtml = content ? parseMarkdownToHtml(content) : "";

  return (
    <div className="bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/60 border border-indigo-100 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4 relative">
      <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-40 w-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100/80 p-2 rounded-xl text-indigo-600">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-[#0A0D27] text-sm">NVIDIA AI Financial Insights</h3>
            <p className="text-[10px] text-indigo-600 font-medium">Llama-3.1 Powered Advisory</p>
          </div>
        </div>
        {content && !isLoading && (
          <button 
            onClick={() => refetch()} 
            className="text-[10px] text-[#33375C]/60 hover:text-indigo-600 font-semibold px-2 py-1 border border-[#E2E2FF] rounded-md bg-white hover:bg-[#F0F0FF] transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-3">
          <div className="relative flex items-center justify-center">
            <div className="h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <Sparkles className="absolute h-4 w-4 text-indigo-500 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-[#0A0D27]">NVIDIA AI is analyzing your statement...</p>
            <p className="text-[10px] text-[#33375C]/50 mt-0.5">Synthesizing category patterns and budget compliance</p>
          </div>
        </div>
      ) : error ? (
        <div className="py-4 text-center">
          <p className="text-xs font-semibold text-rose-600">Could not generate AI insights</p>
          <button onClick={() => refetch()} className="mt-2 text-xs font-semibold text-indigo-600 underline">Try again</button>
        </div>
      ) : (
        <div 
          className="text-xs text-[#33375C] space-y-1 prose max-w-none" 
          dangerouslySetInnerHTML={{ __html: parsedHtml }} 
        />
      )}
    </div>
  );
}

function parseMarkdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  let inList = false;
  const resultLines: string[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      if (inList) {
        resultLines.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (line.startsWith("### ")) {
      if (inList) { resultLines.push("</ul>"); inList = false; }
      resultLines.push(`<h4 class="text-sm font-bold text-[#0A0D27] mt-4 mb-2 select-none">${line.slice(4)}</h4>`);
    } else if (line.startsWith("## ")) {
      if (inList) { resultLines.push("</ul>"); inList = false; }
      resultLines.push(`<h3 class="text-base font-extrabold text-[#0A0D27] mt-5 mb-2.5 select-none">${line.slice(3)}</h3>`);
    } else if (line.startsWith("# ")) {
      if (inList) { resultLines.push("</ul>"); inList = false; }
      resultLines.push(`<h2 class="text-lg font-black text-[#0A0D27] mt-6 mb-3 select-none">${line.slice(2)}</h2>`);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) {
        resultLines.push('<ul class="list-disc pl-5 space-y-1.5 mb-3 text-[#33375C]">');
        inList = true;
      }
      const itemContent = line.slice(2)
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#0A0D27]">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
      resultLines.push(`<li class="text-xs leading-relaxed">${itemContent}</li>`);
    } else {
      if (inList) { resultLines.push("</ul>"); inList = false; }
      const paraContent = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#0A0D27]">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
      resultLines.push(`<p class="text-xs text-[#33375C]/90 leading-relaxed mb-2.5">${paraContent}</p>`);
    }
  }

  if (inList) {
    resultLines.push("</ul>");
  }

  return resultLines.join("\n");
}
