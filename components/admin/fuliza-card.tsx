"use client";

import { useState } from "react";
import { Zap, Pencil, Check, X, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Debt } from "@/types/domain";

const FULIZA_MAX = 1500;

function fmt(n: number) {
  return new Intl.NumberFormat("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

interface Props {
  initialDebt: Debt | null;
}

export function FulizaCard({ initialDebt }: Props) {
  const [debt, setDebt] = useState<Debt | null>(initialDebt);
  const outstanding = debt ? Number(debt.current_balance) : 0;

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(outstanding));
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setValue(String(outstanding));
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
  }

  async function save() {
    const target = parseFloat(value.replace(/,/g, ""));
    if (isNaN(target) || target < 0 || target > FULIZA_MAX) {
      toast.error(`Fuliza balance must be between 0 and KES ${FULIZA_MAX}`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/adjust-fuliza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDebt((prev) => ({
        ...(prev ?? ({} as Debt)),
        current_balance: target,
        is_active: target > 0,
      }));
      setEditing(false);
      toast.success(target === 0 ? "Fuliza fully repaid - marked as cleared" : `Fuliza outstanding set to KES ${fmt(target)}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const toPayOff = outstanding;
  const usedPct = Math.min(100, (outstanding / FULIZA_MAX) * 100);

  return (
    <div className="max-w-md">
      <div className="bg-white rounded-2xl border border-[#E2E2FF] p-5 hover:border-rose-300/50 hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center">
              <Zap className="h-4 w-4 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0A0D27]">Safaricom Fuliza</p>
              <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Overdraft · Limit KES {fmt(FULIZA_MAX)}</p>
            </div>
          </div>
          <span className={cn("h-2 w-2 rounded-full shrink-0", outstanding > 0 ? "bg-rose-500" : "bg-emerald-500")} />
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex justify-between text-[10px] font-semibold text-[#33375C]/50 uppercase tracking-wider mb-1.5">
            <span>Used</span>
            <span>{usedPct.toFixed(0)}% of limit</span>
          </div>
          <div className="h-2 rounded-full bg-[#F0F0FF] overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", outstanding > 0 ? "bg-rose-500" : "bg-emerald-500")}
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>

        {editing ? (
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-semibold tracking-wider text-[#33375C]/50">
              Set outstanding Fuliza (KES 0 - {FULIZA_MAX})
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              max={FULIZA_MAX}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
              autoFocus
              className="w-full rounded-lg border border-rose-300/60 bg-rose-50/40 px-3 py-2.5 text-lg font-bold text-[#0A0D27] focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
            />
            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Apply
              </button>
              <button
                onClick={cancel}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#33375C] border border-[#E2E2FF] hover:bg-[#F0F0FF] disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase font-semibold tracking-wider text-[#33375C]/50 mb-1">
                  {outstanding > 0 ? "Outstanding (what you owe)" : "Status"}
                </p>
                {outstanding > 0 ? (
                  <p className="text-2xl font-bold tracking-tight text-rose-600 flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">KES</span>
                    <span>{fmt(outstanding)}</span>
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-base font-bold">Fully repaid</span>
                  </div>
                )}
              </div>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border border-[#E2E2FF] text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors shrink-0"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            </div>

            {outstanding > 0 && (
              <div className="mt-4 pt-3 border-t border-[#E2E2FF] grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-[#33375C]/50 tracking-wider">To pay off</p>
                  <p className="text-rose-600 font-bold mt-0.5">KES {fmt(toPayOff)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-[#33375C]/50 tracking-wider">Remaining limit</p>
                  <p className="text-[#33375C]/70 font-semibold mt-0.5">KES {fmt(FULIZA_MAX - outstanding)}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-[#33375C]/50 mt-3 px-1 leading-relaxed">
        Updating this syncs the Fuliza debt in the <strong>Debts</strong> page. Set to <strong>0</strong> when you&apos;ve fully repaid Safaricom.
      </p>
    </div>
  );
}
