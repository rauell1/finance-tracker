"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import type { Transaction, Category } from "@/types/domain";
import { toast } from "sonner";
import {
  Smartphone, Building2, Receipt, Calendar, Tag, Pencil,
  TrendingUp, TrendingDown, ArrowLeftRight, Banknote, Info,
  AlertCircle, CheckCircle2
} from "lucide-react";

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  categories: Category[];
  onClose: () => void;
}

const TYPE_LABELS = {
  income:   { label: "Income",   icon: TrendingUp,       color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  expense:  { label: "Expense",  icon: TrendingDown,     color: "text-rose-600",    bg: "bg-rose-50 border-rose-200" },
  transfer: { label: "Transfer", icon: ArrowLeftRight,   color: "text-slate-600",   bg: "bg-slate-50 border-slate-200" },
};

export function TransactionDetailSheet({
  transaction,
  categories,
  onClose,
}: TransactionDetailSheetProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState(transaction?.description ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const [txnType, setTxnType] = useState<"income" | "expense">(
    (transaction?.txn_type as "income" | "expense") ?? "expense"
  );
  const [amount, setAmount] = useState(String(transaction?.amount ?? ""));

  if (!transaction) return null;

  const meta = transaction.metadata as Record<string, unknown>;
  const isWebhook = meta?.source === "sms_webhook";
  const balanceAfter = meta?.balance_after as number | null | undefined;
  const txnCost = meta?.txn_cost as number | null | undefined;
  const counterparty = meta?.counterparty as string | undefined;
  const mpesaReceipt = meta?.mpesa_receipt as string | undefined;
  const rawSms = meta?.raw_sms as string | undefined;

  const typeConfig = TYPE_LABELS[transaction.txn_type] ?? TYPE_LABELS.expense;
  const TypeIcon = typeConfig.icon;

  const filteredCategories = categories.filter((c) => c.type === txnType);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description || null,
          category_id: categoryId || null,
          txn_type: txnType,
          amount: Number(amount),
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Transaction updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.kpi() });
      setEditing(false);
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this transaction? This cannot be undone.")) return;
    setSaving(true);
    try {
      await fetch(`/api/transactions/${transaction.id}`, { method: "DELETE" });
      toast.success("Transaction deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      onClose();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!transaction} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isWebhook ? (
              <Smartphone className="h-4 w-4 text-emerald-600" />
            ) : (
              <Building2 className="h-4 w-4 text-slate-500" />
            )}
            Transaction Details
            {isWebhook && (
              <Badge variant="secondary" className="text-[10px] ml-1">M-Pesa Auto</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            View and edit this transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount + type hero */}
          <div className={`rounded-lg border p-4 ${typeConfig.bg}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Amount</p>
                <p className={`text-3xl font-bold mt-0.5 ${typeConfig.color}`}>
                  {transaction.txn_type === "income" ? "+" : transaction.txn_type === "expense" ? "-" : ""}
                  {formatCurrency(transaction.amount)}
                </p>
                {txnCost != null && txnCost > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    + {formatCurrency(txnCost)} transaction fee
                  </p>
                )}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${typeConfig.bg}`}>
                <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
                <span className={`text-sm font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
              </div>
            </div>

            {balanceAfter != null && (
              <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                <Banknote className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">
                  Balance after: <span className="font-semibold text-slate-800">{formatCurrency(balanceAfter)}</span>
                </span>
              </div>
            )}
          </div>

          {/* M-Pesa receipt + counterparty */}
          {isWebhook && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" /> M-Pesa Details
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {mpesaReceipt && (
                  <div>
                    <p className="text-xs text-slate-400">Receipt</p>
                    <p className="font-mono font-medium text-slate-800">{mpesaReceipt}</p>
                  </div>
                )}
                {counterparty && (
                  <div>
                    <p className="text-xs text-slate-400">{transaction.txn_type === "income" ? "From" : "To"}</p>
                    <p className="font-medium text-slate-800">{counterparty}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Editable fields */}
          {editing ? (
            <div className="space-y-4">
              {/* Type toggle */}
              {transaction.txn_type !== "transfer" && (
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={txnType === "income" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => { setTxnType("income"); setCategoryId(""); }}
                    >
                      <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Income
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={txnType === "expense" ? "destructive" : "outline"}
                      className="flex-1"
                      onClick={() => { setTxnType("expense"); setCategoryId(""); }}
                    >
                      <TrendingDown className="mr-1.5 h-3.5 w-3.5" /> Expense
                    </Button>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div className="space-y-1.5">
                <Label>Amount (KES)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select key={txnType} value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label>Description / Note</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a note (e.g. groceries, rent payment)"
                />
              </div>
            </div>
          ) : (
            /* Read-only view */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date
                  </p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {formatDate(transaction.occurred_on)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Account
                  </p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {transaction.account?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Category
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {transaction.category && (
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: transaction.category.color }}
                      />
                    )}
                    <p className="text-sm font-medium text-slate-800">
                      {transaction.category?.name ?? "Uncategorised"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Info className="h-3 w-3" /> Source
                  </p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {isWebhook ? "M-Pesa SMS" : "Manual entry"}
                  </p>
                </div>
              </div>

              {transaction.description && (
                <div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Pencil className="h-3 w-3" /> Note
                  </p>
                  <p className="text-sm text-slate-700 mt-0.5 bg-slate-50 rounded-md px-3 py-2 border border-slate-100">
                    {transaction.description}
                  </p>
                </div>
              )}

              {/* Raw SMS (collapsible) */}
              {rawSms && (
                <details className="group">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 flex items-center gap-1 select-none">
                    <Receipt className="h-3 w-3" /> View original SMS
                  </summary>
                  <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-md px-3 py-2 border border-slate-100 font-mono leading-relaxed">
                    {rawSms}
                  </p>
                </details>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)} disabled={saving} className="sm:mr-auto">
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={saving}>
                Delete
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} className="sm:mr-auto">
                Close
              </Button>
              {transaction.txn_type !== "transfer" && (
                <Button
                  onClick={() => setEditing(true)}
                  className="gap-2"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit Transaction
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
