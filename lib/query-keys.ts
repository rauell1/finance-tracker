export const queryKeys = {
  transactions: {
    all: ["transactions"] as const,
    list: (filters: Record<string, unknown>) => ["transactions", "list", filters] as const,
    detail: (id: string) => ["transactions", "detail", id] as const,
  },
  accounts: {
    all: ["accounts"] as const,
    list: () => ["accounts", "list"] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: (type?: string) => ["categories", "list", type] as const,
  },
  budgets: {
    all: ["budgets"] as const,
    list: (month?: string) => ["budgets", "list", month] as const,
  },
  dashboard: {
    kpi: (month?: string) => ["dashboard", "kpi", month] as const,
    trend: (months?: number) => ["dashboard", "trend", months] as const,
  },
  insights: {
    all: ["insights"] as const,
  },
};
