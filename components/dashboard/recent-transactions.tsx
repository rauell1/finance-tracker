import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types/domain";
import { cn } from "@/lib/utils";
import {
  ShoppingCart, Utensils, Zap, Bus, GraduationCap, HeartPulse, Home,
  Clapperboard, Repeat, Plane, Briefcase, Coins, PiggyBank, Landmark,
  ArrowLeftRight, Receipt, type LucideIcon
} from "lucide-react";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const typeConfig = {
  income: { amountColor: "text-emerald-600", prefix: "+", dot: "bg-emerald-500" },
  expense: { amountColor: "text-rose-600", prefix: "−", dot: "bg-rose-500" },
  transfer: { amountColor: "text-[#524CF2]", prefix: "", dot: "bg-[#524CF2]" },
};

const categoryIcons: { pattern: RegExp; icon: LucideIcon }[] = [
  { pattern: /shopping/i, icon: ShoppingCart },
  { pattern: /food|dining/i, icon: Utensils },
  { pattern: /utilit/i, icon: Zap },
  { pattern: /transport/i, icon: Bus },
  { pattern: /education/i, icon: GraduationCap },
  { pattern: /health/i, icon: HeartPulse },
  { pattern: /housing|rent/i, icon: Home },
  { pattern: /entertainment/i, icon: Clapperboard },
  { pattern: /subscription/i, icon: Repeat },
  { pattern: /travel/i, icon: Plane },
  { pattern: /salary|freelance/i, icon: Briefcase },
  { pattern: /invest/i, icon: Coins },
  { pattern: /saving/i, icon: PiggyBank },
  { pattern: /loan|debt/i, icon: Landmark },
];

function iconFor(categoryName: string | undefined, txnType: string): LucideIcon {
  if (txnType === "transfer") return ArrowLeftRight;
  if (categoryName) {
    for (const { pattern, icon } of categoryIcons) {
      if (pattern.test(categoryName)) return icon;
    }
  }
  return Receipt;
}

function relativeDate(iso: string): string {
  const then = new Date(iso + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayDiff = Math.round((today.getTime() - then.getTime()) / 86400000);
  if (dayDiff <= 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return `${dayDiff}d ago`;
  return then.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
        <h2 className="font-bold text-foreground tracking-tight text-base">Recent Activity</h2>
        <Link href="/transactions" className="text-xs text-primary font-semibold hover:text-primary/85 transition-colors flex items-center gap-0.5 group">
          View all <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">No activity yet</p>
          <p className="text-xs mt-1 text-muted-foreground/80 max-w-xs">Transactions you log or sync from M-Pesa will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {transactions.map((txn) => {
            const config = typeConfig[txn.txn_type];
            const Icon = iconFor(txn.category?.name, txn.txn_type);
            return (
              <div key={txn.id} className="flex items-center gap-4 px-6 py-4 hover:bg-secondary/40 transition-colors duration-150 group">
                {/* Category icon */}
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm group-hover:scale-105 transition-transform duration-200"
                  style={{ backgroundColor: txn.category?.color ?? (txn.txn_type === "transfer" ? "#524CF2" : "#94a3b8") }}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>

                {/* Description + account */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {txn.description ?? txn.category?.name ?? "Transaction"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5 flex items-center gap-2 font-medium">
                    <span className="truncate max-w-[140px]">{txn.account?.name ?? "-"}</span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="shrink-0">{relativeDate(txn.occurred_on)}</span>
                    {txn.metadata?.source === "sms_webhook" && (
                      <span className="text-[8px] bg-secondary text-primary font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 select-none">
                        Auto
                      </span>
                    )}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0 ml-2 flex items-center gap-2.5">
                  <p className={cn("text-sm font-extrabold tracking-tight", config.amountColor)}>
                    {config.prefix}{formatCurrency(txn.amount)}
                  </p>
                  <span className={cn("h-2 w-2 rounded-full shrink-0", config.dot)} title={txn.txn_type} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
