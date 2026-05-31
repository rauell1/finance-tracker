export interface Account {
  id: string;
  user_id: string;
  account_code: "main" | "kcb_mpesa" | "mshwari" | "bank_a" | "bank_b" | "bank_c";
  name: string;
  currency_code: string;
  opening_balance: number;
  is_archived: boolean;
  current_balance: number;
  created_at: string;
  updated_at: string;
}
export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}
export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  transfer_account_id: string | null;
  category_id: string | null;
  txn_type: "income" | "expense" | "transfer";
  amount: number;
  currency_code: string;
  occurred_on: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  account?: Pick<Account, "id" | "name" | "account_code">;
  category?: Pick<Category, "id" | "name" | "type" | "color">;
  transfer_account?: Pick<Account, "id" | "name" | "account_code">;
}
export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month_start: string;
  amount: number;
  currency_code: string;
  alert_threshold_pct: number;
  created_at: string;
  updated_at: string;
  spent: number;
  remaining: number;
  pct_used: number;
  status: "safe" | "warning" | "over";
  category?: Pick<Category, "id" | "name" | "color">;
}
export interface KPIData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netCashflow: number;
  incomeChange: number;
  expenseChange: number;
}
export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
  net: number;
}
export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  color: string;
  amount: number;
  percentage: number;
}
export interface AccountComparison {
  account_id: string;
  account_name: string;
  account_code: string;
  income: number;
  expense: number;
  net: number;
  balance: number;
}
export type InsightSeverity = "info" | "warning" | "critical";
export interface InsightItem {
  id: string;
  type: "recurring" | "spike" | "budget_leak" | "tip";
  severity: InsightSeverity;
  title: string;
  message: string;
  recommendation: string;
  evidence: Record<string, unknown>;
  potential_savings?: number;
}
export interface TransactionFilter {
  page?: number;
  limit?: number;
  account_id?: string | null;
  category_id?: string | null;
  txn_type?: "income" | "expense" | "transfer" | null;
  date_from?: string | null;
  date_to?: string | null;
  search?: string | null;
}
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
