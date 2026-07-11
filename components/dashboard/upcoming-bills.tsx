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
  if (days === null) return { label: "-", className: "bg-[#F0F0FF] text-[#33375C] border-[#E2E2FF]" };
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, className: "bg-rose-50 text-rose-700 border-rose-200" };
  if (days === 0) return { label: "Today", className: "bg-rose-50 text-rose-700 border-rose-200" };
  if (days <= 3) return { label: `${days}d`, className: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: `${days}d`, className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
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
    <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E2FF]">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-[#524CF2]" />
          <h2 className="font-bold text-[#0A0D27] tracking-tight text-base">Due This Week</h2>
        </div>
        <Link href="/recurring" className="text-xs text-[#524CF2] font-semibold hover:text-[#625DF1] transition-colors">
          View all →
        </Link>
      </div>

      {obligations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-[#0A0D27]">All clear</p>
          <p className="text-xs mt-1 text-[#33375C]/60">Nothing due in the next 7 days.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#E2E2FF]">
          {obligations.map((o) => {
            const pill = pillForDueIn(o.due_in_days);
            return (
              <div key={o.id} className="px-6 py-4 flex items-center justify-between gap-3 hover:bg-[#F0F0FF]/15 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-[#0A0D27] truncate">{o.name}</span>
                    <span className={cn("text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0", pill.className)}>
                      {pill.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#33375C]/60 font-semibold capitalize">
                    {o.obligation_type} · {formatCurrency(Number(o.amount))}
                  </p>
                </div>
                <button
                  onClick={() => handlePay(o.id)}
                  disabled={paying === o.id || pending}
                  className="shrink-0 h-8 px-3 rounded-lg bg-[#524CF2] hover:bg-[#625DF1] text-white text-xs font-bold transition-colors disabled:opacity-50"
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
