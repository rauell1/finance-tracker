import type { AccountComparison } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CreditCard } from "lucide-react";

interface AccountBalanceCardsProps {
  accounts: AccountComparison[];
}

const accountStyles: Record<string, { bg: string; border: string; glow: string; text: string; label: string; badge: string }> = {
  main: {
    bg: "from-white via-emerald-50/[0.04] to-emerald-50/30",
    border: "border-slate-200/80 hover:border-emerald-300",
    glow: "shadow-sm hover:shadow-md hover:shadow-emerald-100/50",
    text: "text-emerald-600",
    label: "M-Pesa / Primary Wallet",
    badge: "bg-emerald-50 border-emerald-100 text-emerald-650",
  },
  kcb_mpesa: {
    bg: "from-white via-green-50/[0.04] to-green-50/30",
    border: "border-slate-200/80 hover:border-green-300",
    glow: "shadow-sm hover:shadow-md hover:shadow-green-100/50",
    text: "text-green-700",
    label: "KCB M-PESA Savings",
    badge: "bg-green-50 border-green-100 text-green-700",
  },
  mshwari: {
    bg: "from-white via-teal-50/[0.04] to-teal-50/30",
    border: "border-slate-200/80 hover:border-teal-300",
    glow: "shadow-sm hover:shadow-md hover:shadow-teal-100/50",
    text: "text-teal-700",
    label: "M-Shwari Savings",
    badge: "bg-teal-50 border-teal-100 text-teal-700",
  },
  bank_a: {
    bg: "from-white via-blue-50/[0.04] to-blue-50/30",
    border: "border-slate-200/80 hover:border-blue-300",
    glow: "shadow-sm hover:shadow-md hover:shadow-blue-100/50",
    text: "text-blue-600",
    label: "DTB Bank",
    badge: "bg-blue-50 border-blue-100 text-blue-650",
  },
  bank_b: {
    bg: "from-white via-violet-50/[0.04] to-violet-50/30",
    border: "border-slate-200/80 hover:border-violet-300",
    glow: "shadow-sm hover:shadow-md hover:shadow-violet-100/50",
    text: "text-violet-650",
    label: "I&M Bank",
    badge: "bg-violet-50 border-violet-100 text-violet-650",
  },
  bank_c: {
    bg: "from-white via-amber-50/[0.04] to-amber-50/30",
    border: "border-slate-200/80 hover:border-amber-300",
    glow: "shadow-sm hover:shadow-md hover:shadow-amber-100/50",
    text: "text-amber-600",
    label: "SBM Bank",
    badge: "bg-amber-50 border-amber-100 text-amber-650",
  },
};

const defaultStyle = {
  bg: "from-white via-slate-50/[0.04] to-slate-50/30",
  border: "border-slate-200/80 hover:border-indigo-300",
  glow: "shadow-sm hover:shadow-md hover:shadow-indigo-100/50",
  text: "text-indigo-650",
  label: "Other Account",
  badge: "bg-indigo-50 border-indigo-100 text-indigo-600",
};

export function AccountBalanceCards({ accounts }: AccountBalanceCardsProps) {
  if (accounts.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 col-span-full text-center text-slate-400 text-sm">
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
              "group relative overflow-hidden bg-gradient-to-br rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5",
              style.bg,
              style.border,
              style.glow
            )}
          >
            {/* Holographic Chip Visual Accent */}
            <div className="absolute right-6 top-6 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-300">
              <CreditCard className="h-10 w-10 text-slate-700" />
            </div>

            {/* Simulating Physical Card Layout */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col min-w-0">
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Source</p>
                <p className="text-sm font-bold text-slate-700 truncate mt-0.5">{style.label}</p>
              </div>
              <span className={cn("text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border shrink-0", style.badge)}>
                {account.account_code}
              </span>
            </div>

            {/* Card Chip Simulation */}
            <div className="w-8 h-6 rounded-md bg-gradient-to-br from-yellow-500/10 to-yellow-600/25 border border-yellow-500/20 mb-4 opacity-75 flex flex-col justify-between p-1">
              <div className="w-full h-px bg-yellow-500/10" />
              <div className="w-full h-px bg-yellow-500/10" />
            </div>

            <p className={cn("text-2xl font-extrabold tracking-tight", style.text)}>
              {formatCurrency(account.balance)}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                <span className="text-emerald-500">In</span>
                <span>{formatCurrency(account.income)}</span>
              </span>
              <span className="flex items-center gap-1 hover:text-rose-650 transition-colors">
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
