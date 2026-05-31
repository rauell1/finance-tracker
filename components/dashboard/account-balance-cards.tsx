import type { AccountComparison } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CreditCard } from "lucide-react";

interface AccountBalanceCardsProps {
  accounts: AccountComparison[];
}

const accountStyles: Record<string, { bg: string; border: string; glow: string; text: string; label: string; badge: string }> = {
  main: {
    bg: "from-slate-900/90 via-emerald-950/20 to-slate-950/95",
    border: "border-slate-800/40 hover:border-emerald-500/30",
    glow: "shadow-emerald-950/10",
    text: "text-emerald-400",
    label: "M-Pesa / Primary Wallet",
    badge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
  },
  bank_a: {
    bg: "from-slate-900/90 via-blue-950/20 to-slate-950/95",
    border: "border-slate-800/40 hover:border-blue-500/30",
    glow: "shadow-blue-950/10",
    text: "text-blue-400",
    label: "Bank Account A",
    badge: "bg-blue-500/10 border-blue-500/25 text-blue-400",
  },
  bank_b: {
    bg: "from-slate-900/90 via-violet-950/20 to-slate-950/95",
    border: "border-slate-800/40 hover:border-violet-500/30",
    glow: "shadow-violet-950/10",
    text: "text-violet-400",
    label: "Bank Account B",
    badge: "bg-violet-500/10 border-violet-500/25 text-violet-400",
  },
  bank_c: {
    bg: "from-slate-900/90 via-amber-950/20 to-slate-950/95",
    border: "border-slate-800/40 hover:border-amber-500/30",
    glow: "shadow-amber-950/10",
    text: "text-amber-400",
    label: "Bank Account C",
    badge: "bg-amber-500/10 border-amber-500/25 text-amber-400",
  },
};

const defaultStyle = {
  bg: "from-slate-900/90 via-slate-850/20 to-slate-950/95",
  border: "border-slate-800/40 hover:border-indigo-500/30",
  glow: "shadow-indigo-950/10",
  text: "text-indigo-400",
  label: "Other Account",
  badge: "bg-indigo-500/10 border-indigo-500/25 text-indigo-400",
};

export function AccountBalanceCards({ accounts }: AccountBalanceCardsProps) {
  if (accounts.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-8 col-span-full text-center text-slate-400 text-sm">
          No accounts found
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {accounts.map((account) => {
        const style = accountStyles[account.account_code] ?? defaultStyle;
        return (
          <div
            key={account.account_id}
            className={cn(
              "group relative overflow-hidden bg-gradient-to-br rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
              style.bg,
              style.border,
              style.glow
            )}
          >
            {/* Holographic Chip Visual Accent */}
            <div className="absolute right-6 top-6 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-300">
              <CreditCard className="h-10 w-10 text-white" />
            </div>

            {/* Simulating Physical Card Layout */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Source</p>
                <p className="text-sm font-semibold text-slate-200 truncate mt-0.5">{style.label}</p>
              </div>
              <span className={cn("text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border shrink-0", style.badge)}>
                {account.account_code}
              </span>
            </div>

            {/* Card Chip Simulation */}
            <div className="w-8 h-6 rounded-md bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 border border-yellow-500/30 mb-4 opacity-75 flex flex-col justify-between p-1">
              <div className="w-full h-px bg-yellow-500/10" />
              <div className="w-full h-px bg-yellow-500/10" />
            </div>

            <p className={cn("text-2xl font-bold tracking-tight", style.text)}>
              {formatCurrency(account.balance)}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-900/60 flex items-center gap-4 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                <span className="text-emerald-500">In</span>
                <span>{formatCurrency(account.income)}</span>
              </span>
              <span className="flex items-center gap-1 hover:text-rose-400 transition-colors">
                <span className="text-rose-500">Out</span>
                <span>{formatCurrency(account.expense)}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
