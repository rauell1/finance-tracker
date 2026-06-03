"use client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { PiggyBank } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import type { SavingsGoal } from "@/types/domain";

export function SavingsProgress() {
  const { data: goals = [] } = useQuery<SavingsGoal[]>({
    queryKey: ["savings-goals"],
    queryFn: async () => {
      const res = await fetch("/api/savings-goals");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const active = goals.filter((g) => !g.is_completed).slice(0, 3);
  if (active.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E2E2FF] bg-[#F0F0FF]/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-4 w-4 text-[#524CF2]" />
          <h3 className="font-semibold text-[#0A0D27] text-sm">Savings Goals</h3>
        </div>
        <Link href="/goals" className="text-xs font-semibold text-[#524CF2] hover:underline">View All</Link>
      </div>
      <div className="divide-y divide-[#E2E2FF]">
        {active.map((g) => (
          <div key={g.id} className="px-5 py-3.5">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-semibold text-[#0A0D27] text-xs">{g.name}</span>
              <span className="text-xs text-[#33375C]/60 font-semibold">{g.progress.toFixed(0)}%</span>
            </div>
            <Progress value={g.current_amount} max={g.target_amount} indicatorClassName="bg-[#524CF2]" className="h-2" />
            <p className="text-[10px] text-[#33375C]/50 mt-1 font-semibold">
              {formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
