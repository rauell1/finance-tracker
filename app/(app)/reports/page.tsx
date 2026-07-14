"use client";
import { useState } from "react";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { MonthlyReport } from "@/components/reports/monthly-report";

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ReportsPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const current = getCurrentMonth();

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#EA580C]" />
          <h1 className="text-2xl font-bold text-[#0A0D27] tracking-tight">Monthly Report</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth((m) => addMonths(m, -1))} className="h-9 w-9 rounded-lg border border-[#DCFCE7] bg-white flex items-center justify-center hover:bg-[#FEF9C3] text-[#33375C] transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-[#0A0D27] min-w-[140px] text-center">{getMonthLabel(month)}</span>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} disabled={month === current} className="h-9 w-9 rounded-lg border border-[#DCFCE7] bg-white flex items-center justify-center hover:bg-[#FEF9C3] text-[#33375C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <MonthlyReport month={month} />
    </div>
  );
}
