import { describe, it, expect } from "vitest";
import { queryKeys } from "@/lib/query-keys";

describe("queryKeys", () => {
  describe("transactions", () => {
    it("returns stable all key", () => {
      expect(queryKeys.transactions.all).toEqual(["transactions"]);
    });

    it("builds list key with filters", () => {
      const filters = { page: 1, account_id: "abc" };
      expect(queryKeys.transactions.list(filters)).toEqual([
        "transactions",
        "list",
        filters,
      ]);
    });

    it("builds detail key with id", () => {
      expect(queryKeys.transactions.detail("tx-1")).toEqual([
        "transactions",
        "detail",
        "tx-1",
      ]);
    });
  });

  describe("accounts", () => {
    it("returns stable all key", () => {
      expect(queryKeys.accounts.all).toEqual(["accounts"]);
    });

    it("builds list key", () => {
      expect(queryKeys.accounts.list()).toEqual(["accounts", "list"]);
    });
  });

  describe("categories", () => {
    it("returns stable all key", () => {
      expect(queryKeys.categories.all).toEqual(["categories"]);
    });

    it("builds list key with type", () => {
      expect(queryKeys.categories.list("income")).toEqual([
        "categories",
        "list",
        "income",
      ]);
    });

    it("builds list key without type", () => {
      expect(queryKeys.categories.list()).toEqual([
        "categories",
        "list",
        undefined,
      ]);
    });
  });

  describe("budgets", () => {
    it("returns stable all key", () => {
      expect(queryKeys.budgets.all).toEqual(["budgets"]);
    });

    it("builds list key with month", () => {
      expect(queryKeys.budgets.list("2024-06")).toEqual([
        "budgets",
        "list",
        "2024-06",
      ]);
    });
  });

  describe("dashboard", () => {
    it("builds kpi key with month", () => {
      expect(queryKeys.dashboard.kpi("2024-06")).toEqual([
        "dashboard",
        "kpi",
        "2024-06",
      ]);
    });

    it("builds trend key with months count", () => {
      expect(queryKeys.dashboard.trend(6)).toEqual([
        "dashboard",
        "trend",
        6,
      ]);
    });
  });

  describe("insights", () => {
    it("returns stable all key", () => {
      expect(queryKeys.insights.all).toEqual(["insights"]);
    });
  });
});
