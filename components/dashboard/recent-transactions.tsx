import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types/domain";
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: txn.category?.color ?? "#64748B" }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{txn.description ?? txn.category?.name ?? "Transaction"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(txn.occurred_on)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={cn("text-sm font-semibold", txn.txn_type === "income" ? "text-green-600" : "text-red-600")}>
                    {txn.txn_type === "income" ? "+" : "-"}{formatCurrency(txn.amount)}
                  </span>
                  <Badge variant={txn.txn_type === "income" ? "success" : "destructive"} className="hidden sm:inline-flex text-xs">
                    {txn.txn_type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
