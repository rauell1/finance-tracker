import type { AccountComparison } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Smartphone, Landmark, PiggyBank, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface AccountBalanceCardsProps {
  accounts: AccountComparison[];
}

const accountMeta: Record<string, { label: string; icon: typeof Wallet; accent: string }> = {
  main:      { label: "M-Pesa",     icon: Smartphone, accent: "text-emerald-600 bg-emerald-50" },
  kcb_mpesa: { label: "KCB M-Pesa", icon: PiggyBank,  accent: "text-green-600 bg-green-50" },
  mshwari:   { label: "M-Shwari",   icon: PiggyBank,  accent: "text-teal-600 bg-teal-50" },
  bank_a:    { label: "DTB Bank",   icon: Landmark,   accent: "text-blue-600 bg-blue-50" },
  bank_b:    { label: "I&M Bank",   icon: Landmark,   accent: "text-violet-600 bg-violet-50" },
  bank_c:    { label: "SBM Bank",   icon: Landmark,   accent: "text-amber-600 bg-amber-50" },
};

const defaultMeta = { label: "Account", icon: Wallet, accent: "text-[#524CF2] bg-[#F0F0FF]" };

function healthAccent(balance: number): { bar: string; tag: string | null; tagStyle: string } {
  if (balance < 0) return { bar: "bg-rose-500", tag: "Overdraft active", tagStyle: "bg-rose-50 text-rose-600" };
  if (balance < 100) return { bar: "bg-amber-400", tag: "Low balance", tagStyle: "bg-amber-50 text-amber-600" };
  return { bar: "bg-emerald-400/70", tag: null, tagStyle: "" };
}

export function AccountBalanceCards({ accounts }: AccountBalanceCardsProps) {
  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E2E2FF] p-10 text-center shadow-card">
        <Wallet className="h-10 w-10 text-[#524CF2]/30 mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#0A0D27]">No accounts yet</p>
        <p className="text-xs text-[#33375C]/60 mt-1">Connect an account to see balances here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map((account) => {
        const meta = accountMeta[account.account_code] ?? defaultMeta;
        const Icon = meta.icon;
        const balance = Number(account.balance);
        const health = healthAccent(balance);
        const balanceStr = formatCurrency(balance);
        const parts = balanceStr.split(" ");
        const currency = parts.length > 1 ? parts[0] : "";
        const amount = parts.length > 1 ? parts[1] : balanceStr;

        const income = Number(account.income);
        const expense = Number(account.expense);

        return (
          <div
            key={account.account_id}
            className="group relative overflow-hidden bg-white rounded-2xl border border-[#E2E2FF] p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            {/* Health accent bar */}
            <div className={cn("absolute left-0 top-4 bottom-4 w-1 rounded-r-full", health.bar)} />

            <div className="flex items-center justify-between mb-4 pl-1.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", meta.accent)}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0A0D27] truncate">{meta.label}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">{account.account_code}</p>
                </div>
              </div>
              {health.tag && (
                <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0", health.tagStyle)}>
                  {health.tag}
                </span>
              )}
            </div>

            <p className={cn(
              "text-2xl font-extrabold tracking-tight flex items-baseline pl-1.5",
              balance < 0 ? "text-rose-600" : "text-[#0A0D27]"
            )}>
              {currency && (
                <span className="text-xs font-semibold text-[#33375C]/40 uppercase mr-1.5 tracking-wider">{currency}</span>
              )}
              <span>{amount}</span>
            </p>

            {/* Net change */}
            <div className="mt-3 pl-1.5">
              <span className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-bold",
                income > expense ? "text-emerald-600" : "text-rose-600"
              )}>
                {income > expense ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                Net {formatCurrency(income - expense)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
