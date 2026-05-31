"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, type TransactionInput } from "@/lib/validators/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Account, Category } from "@/types/domain";

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  onSubmit: (data: TransactionInput) => Promise<void>;
  defaultValues?: Partial<TransactionInput>;
  isLoading?: boolean;
}

export function TransactionForm({ accounts, categories, onSubmit, defaultValues, isLoading }: TransactionFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { txn_type: "expense", currency_code: "USD", ...defaultValues },
  });

  const txnType = watch("txn_type");
  const filteredCategories = categories.filter((c) => c.type === txnType);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={txnType} onValueChange={(v) => setValue("txn_type", v as "income"|"expense")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input type="number" step="0.01" placeholder="0.00" {...register("amount", { valueAsNumber: true })} />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Account</Label>
        <Select onValueChange={(v) => setValue("account_id", v)}>
          <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
          <SelectContent>
            {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.account_id && <p className="text-xs text-destructive">{errors.account_id.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select onValueChange={(v) => setValue("category_id", v)}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {filteredCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Date</Label>
        <Input type="date" {...register("occurred_on")} />
        {errors.occurred_on && <p className="text-xs text-destructive">{errors.occurred_on.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Input placeholder="Add a note..." {...register("description")} />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Transaction"}
      </Button>
    </form>
  );
}
