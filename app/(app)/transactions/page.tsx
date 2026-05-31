import { getTransactions, getAccounts, getCategories } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ImportTrigger } from "@/components/forms/import-trigger";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [{ data: transactions, total, page, totalPages }, accounts, categories] = await Promise.all([
    getTransactions(params),
    getAccounts(),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">{total} total transactions</p>
        </div>
        <ImportTrigger accounts={accounts} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="text-sm">{formatDate(txn.occurred_on)}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{txn.description ?? "—"}</TableCell>
                    <TableCell className="text-sm">{txn.account?.name ?? "—"}</TableCell>
                    <TableCell>
                      {txn.category ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: txn.category.color }} />
                          {txn.category.name}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={txn.txn_type === "income" ? "success" : txn.txn_type === "expense" ? "destructive" : "secondary"}>
                        {txn.txn_type}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold", txn.txn_type === "income" ? "text-green-600" : "text-red-600")}>
                      {txn.txn_type === "income" ? "+" : "-"}{formatCurrency(txn.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
              <span>Page {page} of {totalPages}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
