import { formatCurrency } from "@/lib/utils";
import { PiggyBank } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import type { SavingsGoal } from "@/types/domain";

interface SavingsProgressProps {
  goals: SavingsGoal[];
}

export function SavingsProgress({ goals }: SavingsProgressProps) {
  const active = goals.filter((g) => !g.is_completed).slice(0, 3);
  if (active.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-foreground text-sm">Savings Goals</h3>
        </div>
        <Link href="/goals" className="text-xs font-semibold text-primary hover:underline">View All</Link>
      </div>
      <div className="divide-y divide-border/50">
        {active.map((g) => (
          <div key={g.id} className="px-5 py-3.5 hover:bg-secondary/20 transition-all">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-bold text-foreground text-xs">{g.name}</span>
              <span className="text-xs text-muted-foreground/80 font-semibold">{g.progress.toFixed(0)}%</span>
            </div>
            <Progress value={g.current_amount} max={g.target_amount} indicatorClassName="bg-primary" className="h-2" />
            <p className="text-[10px] text-muted-foreground/60 mt-1 font-semibold">
              {formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
