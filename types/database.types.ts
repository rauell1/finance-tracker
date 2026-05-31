export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; preferred_currency: string; timezone: string; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string | null; preferred_currency?: string; timezone?: string };
        Update: { full_name?: string | null; preferred_currency?: string; timezone?: string };
      };
      accounts: {
        Row: { id: string; user_id: string; account_code: "main"|"kcb_mpesa"|"mshwari"|"bank_a"|"bank_b"|"bank_c"; name: string; currency_code: string; opening_balance: number; is_archived: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; account_code: "main"|"kcb_mpesa"|"mshwari"|"bank_a"|"bank_b"|"bank_c"; name: string; currency_code?: string; opening_balance?: number; is_archived?: boolean };
        Update: { name?: string; currency_code?: string; opening_balance?: number; is_archived?: boolean };
      };
      categories: {
        Row: { id: string; user_id: string; name: string; type: CategoryType; color: string; icon: string|null; is_system: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; name: string; type: CategoryType; color?: string; icon?: string|null; is_system?: boolean };
        Update: { name?: string; type?: CategoryType; color?: string; icon?: string|null };
      };
      transactions: {
        Row: { id: string; user_id: string; account_id: string; transfer_account_id: string|null; category_id: string|null; txn_type: TransactionType; amount: number; currency_code: string; occurred_on: string; description: string|null; metadata: Json; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; account_id: string; transfer_account_id?: string|null; category_id?: string|null; txn_type: TransactionType; amount: number; currency_code?: string; occurred_on: string; description?: string|null; metadata?: Json };
        Update: { account_id?: string; category_id?: string|null; txn_type?: TransactionType; amount?: number; currency_code?: string; occurred_on?: string; description?: string|null; metadata?: Json };
      };
      budgets: {
        Row: { id: string; user_id: string; category_id: string; month_start: string; amount: number; currency_code: string; alert_threshold_pct: number; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; category_id: string; month_start: string; amount: number; currency_code?: string; alert_threshold_pct?: number };
        Update: { amount?: number; alert_threshold_pct?: number };
      };
      exchange_rates: {
        Row: { id: number; user_id: string; base_currency: string; quote_currency: string; rate: number; valid_on: string; created_at: string };
        Insert: { user_id: string; base_currency: string; quote_currency: string; rate: number; valid_on: string };
        Update: { rate?: number };
      };
    };
    Enums: { transaction_type: TransactionType; category_type: CategoryType };
  };
}
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
