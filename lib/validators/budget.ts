import { z } from "zod";
export const budgetSchema = z.object({
  category_id: z.string().uuid("Invalid category"),
  month_start: z.string().min(1, "Month is required"),
  amount: z.number({ invalid_type_error: "Budget amount is required" }).positive().max(999999999.99),
  currency_code: z.string().length(3).default("USD"),
  alert_threshold_pct: z.number().min(1).max(200).default(90),
  txn_type: z.enum(["income", "expense"]).default("expense").optional(),
});
export type BudgetInput = z.infer<typeof budgetSchema>;
