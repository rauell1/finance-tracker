import type { AccountComparison } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AccountBalanceCardsProps {
  accounts: AccountComparison[];
}

const accountStyles: Record<string, { bg: string; text: string; dot: string; badge: string }> = {
  main: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
  },
  bank_a: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  bank_b: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    dot: "bg-violet-500",
    badge: "bg-violet-100 text-violet-700",
  },
  bank_c: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
  },
};

const defaultStyle = {
  bg: "bg-slate-50",
  text: "text-slate-700",
  dot: "bg-slate-400",
  badge: "bg-slate-100 text-slate-600",
};

export function AccountBalanceCards({ accounts }: AccountBalanceCardsProps) {
  if (accounts.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm col-span-full text-center text-slate-400 text-sm py-8">
          No accounts found
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {accounts.map((account) => {
        const style = accountStyles[account.account_code] ?? defaultStyle;
        return (
          <div key={account.account_id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", style.dot)} />
                <p className="text-sm font-medium text-slate-700 truncate">{account.account_name}</p>
              </div>
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full shrink-0", style.badge)}>
                {account.account_code}
              </span>
            </div>
            <p className={cn("text-xl font-bold tracking-tight", style.text)}>
              {formatCurrency(account.balance)}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="text-emerald-500">↑</span>
                {formatCurrency(account.income)}
              </span>
              <span className="flex items-center gap-1">
                <span className="text-rose-500">↓</span>
                {formatCurrency(account.expense)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
