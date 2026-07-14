"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { RecurringObligation } from "@/types/domain";

interface Props {
  obligations: RecurringObligation[];
}

function pillForDueIn(days: number | null) {
  if (days === null) return { label: "-", className: "bg-secondary text-muted-foreground border-border/50" };
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, className: "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400" };
  if (days === 0) return { label: "Today", className: "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400" };
  if (days <= 3) return { label: `${days}d`, className: "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400" };
  return { label: `${days}d`, className: "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400" };
}

export function UpcomingBills({ obligations }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [paying, setPaying] = useState<string | null>(null);

  async function handlePay(id: string) {
    setPaying(id);
    try {
      const res = await fetch(`/api/recurring/${id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed");
      }
      toast.success("Marked as paid");
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(String(err));
    } finally {
      setPaying(null);
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-foreground tracking-tight text-base">Due This Week</h2>
        </div>
        <Link href="/recurring" className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors">
          View all →
        </Link>
      </div>

      {obligations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-foreground">All clear</p>
          <p className="text-xs mt-1 text-muted-foreground/60">Nothing due in the next 7 days.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {obligations.map((o) => {
            const pill = pillForDueIn(o.due_in_days);
            return (
              <div key={o.id} className="px-6 py-4 flex items-center justify-between gap-3 hover:bg-secondary/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground truncate">{o.name}</span>
                    <span className={cn("text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0", pill.className)}>
                      {pill.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 font-semibold capitalize">
                    {o.obligation_type} · {formatCurrency(Number(o.amount))}
                  </p>
                </div>
                <button
                  onClick={() => handlePay(o.id)}
                  disabled={paying === o.id || pending}
                  className="shrink-0 h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {paying === o.id ? "..." : "Pay"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
