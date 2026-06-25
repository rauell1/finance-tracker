"use client";

import { useState } from "react";
import { Smartphone, Landmark, PiggyBank, Wallet, Check, Loader2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Account } from "@/types/domain";

const FULIZA_MAX = 1500;
const MPESA_CODE = "main";

const accountMeta: Record<string, { label: string; icon: typeof Wallet; accent: string; ring: string; bg: string }> = {
  main:      { label: "M-Pesa",    icon: Smartphone, accent: "text-emerald-600", ring: "bg-emerald-500", bg: "bg-emerald-50" },
  kcb_mpesa: { label: "KCB M-Pesa", icon: PiggyBank, accent: "text-green-600",   ring: "bg-green-500",   bg: "bg-green-50" },
  mshwari:   { label: "M-Shwari",  icon: PiggyBank,  accent: "text-teal-600",    ring: "bg-teal-500",    bg: "bg-teal-50" },
  bank_a:    { label: "DTB Bank",  icon: Landmark,   accent: "text-blue-600",    ring: "bg-blue-500",    bg: "bg-blue-50" },
  bank_b:    { label: "I&M Bank",  icon: Landmark,   accent: "text-violet-600",  ring: "bg-violet-500",  bg: "bg-violet-50" },
  bank_c:    { label: "SBM Bank",  icon: Landmark,   accent: "text-amber-600",   ring: "bg-amber-500",   bg: "bg-amber-50" },
};
const defaultMeta = { label: "Account", icon: Wallet, accent: "text-[#524CF2]", ring: "bg-[#524CF2]", bg: "bg-[#F0F0FF]" };

function fmt(n: number) {
  return new Intl.NumberFormat("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function AccountCard({ account, onUpdated }: { account: Account; onUpdated: (id: string, newBalance: number) => void }) {
  const meta = accountMeta[account.account_code] ?? defaultMeta;
  const Icon = meta.icon;

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(fmt(account.current_balance));
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setValue(String(account.current_balance));
    setEditing(true);
  }

  function cancel() {
    setValue(fmt(account.current_balance));
    setEditing(false);
  }

  async function save() {
    const target = parseFloat(value.replace(/,/g, ""));
    if (isNaN(target)) {
      toast.error("Enter a valid number");
      return;
    }
    if (account.account_code !== MPESA_CODE && target < 0) {
      toast.error("Bank accounts cannot have a negative balance");
      return;
    }
    if (account.account_code === MPESA_CODE && target < -FULIZA_MAX) {
      toast.error(`M-PESA cannot go below −KES ${FULIZA_MAX} (Fuliza limit)`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/adjust-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: account.id, target_balance: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onUpdated(account.id, target);
      setValue(fmt(target));
      setEditing(false);
      toast.success(`${meta.label} updated to KES ${fmt(target)}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E2FF] p-5 hover:border-[#524CF2]/30 hover:shadow-md hover:shadow-[#524CF2]/[0.04] transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", meta.bg, meta.accent)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#0A0D27] truncate">{meta.label}</p>
            <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">{account.account_code}</p>
          </div>
        </div>
        <span className={cn("h-2 w-2 rounded-full shrink-0", meta.ring)} />
      </div>

      {/* Current balance display / edit input */}
      {editing ? (
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-semibold tracking-wider text-[#33375C]/50">
            Set balance to (KES)
          </label>
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") cancel();
            }}
            autoFocus
            className="w-full rounded-lg border border-[#524CF2]/40 bg-[#F8F8FF] px-3 py-2.5 text-lg font-bold text-[#0A0D27] focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30 focus:border-[#524CF2]"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                "bg-[#524CF2] text-white hover:bg-[#3f3acc] disabled:opacity-50"
              )}
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
              <p className="text-[10px] uppercase font-semibold tracking-wider text-[#33375C]/50 mb-1">Current Balance</p>
              <p className="text-2xl font-bold tracking-tight text-[#0A0D27] flex items-baseline gap-1">
                <span className="text-xs font-semibold text-[#33375C]/40 uppercase tracking-wider">KES</span>
                <span>{fmt(account.current_balance)}</span>
              </p>
            </div>
            <button
              onClick={startEdit}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors shrink-0",
                "border border-[#E2E2FF] text-[#524CF2] hover:bg-[#F0F0FF] hover:border-[#524CF2]/30"
              )}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E2FF] grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] uppercase font-semibold text-[#33375C]/50 tracking-wider">Opening</p>
              <p className="text-[#33375C]/70 font-semibold mt-0.5 truncate">KES {fmt(account.opening_balance)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-[#33375C]/50 tracking-wider">Txn delta</p>
              <p className={cn("font-semibold mt-0.5 truncate", account.current_balance - account.opening_balance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {account.current_balance - account.opening_balance >= 0 ? "+" : ""}KES {fmt(account.current_balance - account.opening_balance)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function BalanceEditor({ accounts: initial }: { accounts: Account[] }) {
  const [accounts, setAccounts] = useState(initial);

  function handleUpdated(id: string, newBalance: number) {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, current_balance: newBalance } : a))
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map((a) => (
        <AccountCard key={a.id} account={a} onUpdated={handleUpdated} />
      ))}
    </div>
  );
}
