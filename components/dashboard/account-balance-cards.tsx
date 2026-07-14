import type { AccountComparison } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Smartphone, Landmark, PiggyBank, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface AccountBalanceCardsProps {
  accounts: AccountComparison[];
}

const accountMeta: Record<string, { label: string; icon: typeof Wallet; accent: string }> = {
  main:      { label: "M-Pesa",     icon: Smartphone, accent: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20" },
  kcb_mpesa: { label: "KCB M-Pesa", icon: PiggyBank,  accent: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/20" },
  mshwari:   { label: "M-Shwari",   icon: PiggyBank,  accent: "text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/20" },
  bank_a:    { label: "DTB Bank",   icon: Landmark,   accent: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20" },
  bank_b:    { label: "I&M Bank",   icon: Landmark,   accent: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/20" },
  bank_c:    { label: "SBM Bank",   icon: Landmark,   accent: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20" },
};

const defaultMeta = { label: "Account", icon: Wallet, accent: "text-[#EA580C] bg-[#FEF9C3] dark:text-primary dark:bg-primary/10" };

function healthAccent(balance: number): { dot: string; tag: string | null; tagStyle: string } {
  if (balance < 0) return { dot: "bg-rose-500", tag: "Overdraft Active", tagStyle: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30" };
  if (balance < 100) return { dot: "bg-amber-400", tag: "Low Balance", tagStyle: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30" };
  return { dot: "bg-emerald-500", tag: null, tagStyle: "" };
}

export function AccountBalanceCards({ accounts }: AccountBalanceCardsProps) {
  if (accounts.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 p-10 text-center shadow-sm">
        <Wallet className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-bold text-foreground">No accounts yet</p>
        <p className="text-xs text-muted-foreground mt-1">Connect an account to see balances here</p>
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
            className={cn(
              "group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
              balance < 0
                ? "border-rose-200/60 bg-rose-500/[0.01] dark:border-rose-900/30"
                : "border-border/50 bg-card"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", meta.accent)}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{meta.label}</p>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-bold">{account.account_code}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {health.tag && (
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", health.tagStyle)}>
                    {health.tag}
                  </span>
                )}
                <span className={cn("h-1.5 w-1.5 rounded-full", health.dot)} />
              </div>
            </div>

            <p className={cn(
              "text-2xl font-black tracking-tight flex items-baseline",
              balance < 0 ? "text-rose-600 dark:text-rose-500" : "text-foreground"
            )}>
              {currency && (
                <span className="text-xs font-bold text-muted-foreground/45 uppercase mr-1.5 tracking-wider">{currency}</span>
              )}
              <span>{amount}</span>
            </p>

            {/* Net change */}
            <div className="mt-3">
              <span className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-bold",
                income > expense ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"
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
