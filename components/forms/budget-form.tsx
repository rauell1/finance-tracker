"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { budgetSchema, type BudgetInput } from "@/lib/validators/budget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category } from "@/types/domain";

interface BudgetFormProps {
  categories: Category[];
  onSubmit: (data: BudgetInput) => Promise<void>;
  defaultValues?: Partial<BudgetInput>;
  isLoading?: boolean;
}

export function BudgetForm({ categories, onSubmit, defaultValues, isLoading }: BudgetFormProps) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { currency_code: "USD", alert_threshold_pct: 90, ...defaultValues },
  });

  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select onValueChange={(v) => setValue("category_id", v)} defaultValue={defaultValues?.category_id}>
          <SelectTrigger><SelectValue placeholder="Select expense category" /></SelectTrigger>
          <SelectContent>
            {expenseCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Month</Label>
        <Input type="month" {...register("month_start")} />
        {errors.month_start && <p className="text-xs text-destructive">{errors.month_start.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Budget Amount</Label>
        <Input type="number" step="0.01" placeholder="0.00" {...register("amount", { valueAsNumber: true })} />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Alert Threshold (%)</Label>
        <Input type="number" min={1} max={200} {...register("alert_threshold_pct", { valueAsNumber: true })} />
        {errors.alert_threshold_pct && <p className="text-xs text-destructive">{errors.alert_threshold_pct.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Budget"}
      </Button>
    </form>
  );
}
