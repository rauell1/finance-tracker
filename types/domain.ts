export interface Account {
  id: string;
  user_id: string;
  account_code: string;
  name: string;
  currency_code: string;
  opening_balance: number;
  is_archived: boolean;
  current_balance: number;
  fuliza_limit?: number | null;
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
  txn_type: "income" | "expense";
  created_at: string;
  updated_at: string;
  spent: number;
  remaining: number;
  pct_used: number;
  status: "safe" | "warning" | "over";
  category?: Pick<Category, "id" | "name" | "color">;
}
export type ObligationType = "bill" | "subscription";
export type Recurrence = "weekly" | "monthly" | "quarterly" | "yearly";
export interface RecurringObligation {
  id: string;
  user_id: string;
  obligation_type: ObligationType;
  name: string;
  category_id: string | null;
  account_id: string | null;
  amount: number;
  currency_code: string;
  recurrence: Recurrence;
  due_day_of_month: number | null;
  next_due_date: string | null;
  match_keywords: string | null;
  notes: string | null;
  is_active: boolean;
  last_paid_date: string | null;
  last_transaction_id: string | null;
  created_at: string;
  updated_at: string;
  due_in_days: number | null;
  category?: Pick<Category, "id" | "name" | "color"> | null;
  account?: Pick<Account, "id" | "name" | "account_code"> | null;
}
export type DebtType =
  | "loan" | "overdraft" | "credit_card" | "fuliza"
  | "mshwari_loan" | "kcb_overdraft" | "other";
export interface Debt {
  id: string;
  user_id: string;
  creditor: string;
  debt_type: DebtType;
  principal: number;
  current_balance: number;
  interest_rate: number | null;
  monthly_payment: number | null;
  due_date: string | null;
  currency_code: string;
  notes: string | null;
  is_active: boolean;
  auto_tracked: boolean;
  source_identifier: string | null;
  created_at: string;
  updated_at: string;
}
export interface KPIData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netCashflow: number;
  incomeChange: number;
  expenseChange: number;
  fulizaLimit?: number;
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
  fuliza_limit?: number;
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
export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  account_id: string | null;
  is_completed: boolean;
  currency_code: string;
  created_at: string;
  updated_at: string;
  progress: number;
  account?: Pick<Account, "id" | "name" | "account_code"> | null;
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
