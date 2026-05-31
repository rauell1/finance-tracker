"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferSchema, type TransferInput } from "@/lib/validators/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Account } from "@/types/domain";

interface TransferFormProps {
  accounts: Account[];
  onSubmit: (data: TransferInput) => Promise<void>;
  isLoading?: boolean;
}

export function TransferForm({ accounts, onSubmit, isLoading }: TransferFormProps) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<TransferInput>({
    resolver: zodResolver(transferSchema),
    defaultValues: { currency_code: "USD" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>From Account</Label>
        <Select onValueChange={(v) => setValue("from_account_id", v)}>
          <SelectTrigger><SelectValue placeholder="Select source account" /></SelectTrigger>
          <SelectContent>
            {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.from_account_id && <p className="text-xs text-destructive">{errors.from_account_id.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>To Account</Label>
        <Select onValueChange={(v) => setValue("to_account_id", v)}>
          <SelectTrigger><SelectValue placeholder="Select destination account" /></SelectTrigger>
          <SelectContent>
            {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.to_account_id && <p className="text-xs text-destructive">{errors.to_account_id.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Amount</Label>
        <Input type="number" step="0.01" placeholder="0.00" {...register("amount", { valueAsNumber: true })} />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Date</Label>
        <Input type="date" {...register("occurred_on")} />
        {errors.occurred_on && <p className="text-xs text-destructive">{errors.occurred_on.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Note (optional)</Label>
        <Input placeholder="Transfer note..." {...register("description")} />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Transferring..." : "Transfer Funds"}
      </Button>
    </form>
  );
}
