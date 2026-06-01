"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/forms/transaction-form";
import type { Account, Category } from "@/types/domain";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface QuickAddTransactionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddTransaction({ open, onOpenChange }: QuickAddTransactionProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open || accounts.length > 0) return;
    setLoading(true);
    Promise.all([
      fetch("/api/accounts").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([accs, cats]) => {
        setAccounts(accs ?? []);
        setCategories(cats ?? []);
      })
      .catch(() => toast.error("Failed to load form data"))
      .finally(() => setLoading(false));
  }, [open, accounts.length]);

  async function handleSubmit(data: Parameters<React.ComponentProps<typeof TransactionForm>["onSubmit"]>[0]) {
    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to create transaction");
        return;
      }
      toast.success("Transaction added");
      onOpenChange(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-[#E2E2FF] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0A0D27]">Quick Add Transaction</DialogTitle>
          <DialogDescription>Log income or expense in seconds.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="py-10 text-center text-sm text-[#33375C]/60">Loading…</div>
        ) : (
          <TransactionForm
            accounts={accounts}
            categories={categories}
            onSubmit={handleSubmit}
            isLoading={saving}
            defaultValues={{
              occurred_on: new Date().toISOString().slice(0, 10),
              currency_code: "KES",
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
