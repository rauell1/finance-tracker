import { z } from "zod";
export const transactionSchema = z.object({
  account_id: z.string().uuid("Invalid account"),
  category_id: z.string().uuid("Invalid category"),
  txn_type: z.enum(["income", "expense"]),
  amount: z.number({ invalid_type_error: "Amount is required" }).positive("Amount must be positive").max(999999999.99),
  currency_code: z.string().length(3).default("USD"),
  occurred_on: z.string().min(1, "Date is required"),
  description: z.string().max(500).nullable().default(null),
});
export const transferSchema = z.object({
  from_account_id: z.string().uuid("Invalid source account"),
  to_account_id: z.string().uuid("Invalid destination account"),
  amount: z.number({ invalid_type_error: "Amount is required" }).positive().max(999999999.99),
  currency_code: z.string().length(3).default("USD"),
  occurred_on: z.string().min(1, "Date is required"),
  description: z.string().max(500).nullable().default(null),
}).refine((d) => d.from_account_id !== d.to_account_id, {
  message: "Source and destination must be different",
  path: ["to_account_id"],
});
export const transactionFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  account_id: z.preprocess((val) => (val === "" ? null : val), z.string().uuid().nullable().default(null)),
  category_id: z.preprocess((val) => (val === "" ? null : val), z.string().uuid().nullable().default(null)),
  txn_type: z.preprocess((val) => (val === "" ? null : val), z.enum(["income", "expense", "transfer"]).nullable().default(null)),
  date_from: z.preprocess((val) => (val === "" ? null : val), z.string().nullable().default(null)),
  date_to: z.preprocess((val) => (val === "" ? null : val), z.string().nullable().default(null)),
  search: z.preprocess((val) => (val === "" ? null : val), z.string().max(200).nullable().default(null)),
});
export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;
