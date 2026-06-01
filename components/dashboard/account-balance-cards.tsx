import type { AccountComparison } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Smartphone, Landmark, PiggyBank, Wallet } from "lucide-react";

interface AccountBalanceCardsProps {
  accounts: AccountComparison[];
}

const accountMeta: Record<string, { label: string; icon: typeof Wallet; accent: string; ring: string }> = {
  main:      { label: "M-Pesa",          icon: Smartphone, accent: "text-emerald-600", ring: "bg-emerald-500" },
  kcb_mpesa: { label: "KCB M-Pesa",      icon: PiggyBank,  accent: "text-green-600",   ring: "bg-green-500" },
  mshwari:   { label: "M-Shwari",        icon: PiggyBank,  accent: "text-teal-600",    ring: "bg-teal-500" },
  bank_a:    { label: "DTB Bank",        icon: Landmark,   accent: "text-blue-600",    ring: "bg-blue-500" },
  bank_b:    { label: "I&M Bank",        icon: Landmark,   accent: "text-violet-600",  ring: "bg-violet-500" },
  bank_c:    { label: "SBM Bank",        icon: Landmark,   accent: "text-amber-600",   ring: "bg-amber-500" },
};

const defaultMeta = { label: "Account", icon: Wallet, accent: "text-[#524CF2]", ring: "bg-[#524CF2]" };

export function AccountBalanceCards({ accounts }: AccountBalanceCardsProps) {
  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E2E2FF] p-10 text-center">
        <Wallet className="h-10 w-10 text-[#524CF2]/30 mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#0A0D27]">No accounts yet</p>
        <p className="text-xs text-[#33375C]/60 mt-1">Connect an account to see balances here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
      {accounts.map((account) => {
        const meta = accountMeta[account.account_code] ?? defaultMeta;
        const Icon = meta.icon;
        const balanceStr = formatCurrency(account.balance);
        const parts = balanceStr.split(" ");
        const currency = parts.length > 1 ? parts[0] : "";
        const amount = parts.length > 1 ? parts[1] : balanceStr;

        return (
          <div
            key={account.account_id}
            className="group bg-white rounded-2xl border border-[#E2E2FF] p-5 transition-all hover:border-[#524CF2]/30 hover:shadow-md hover:shadow-[#524CF2]/[0.04]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn("h-9 w-9 rounded-lg bg-[#F0F0FF] flex items-center justify-center shrink-0", meta.accent)}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0A0D27] truncate">{meta.label}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">{account.account_code}</p>
                </div>
              </div>
              <span className={cn("h-2 w-2 rounded-full", meta.ring)} />
            </div>

            <p className="text-2xl font-bold tracking-tight text-[#0A0D27] flex items-baseline">
              {currency && (
                <span className="text-xs font-semibold text-[#33375C]/40 uppercase mr-1.5 tracking-wider">{currency}</span>
              )}
              <span>{amount}</span>
            </p>

            <div className="mt-4 pt-3 border-t border-[#E2E2FF] grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] uppercase font-semibold text-[#33375C]/50 tracking-wider">In</p>
                <p className="text-emerald-600 font-semibold mt-0.5 truncate">{formatCurrency(account.income)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-[#33375C]/50 tracking-wider">Out</p>
                <p className="text-rose-600 font-semibold mt-0.5 truncate">{formatCurrency(account.expense)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
