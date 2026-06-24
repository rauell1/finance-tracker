import { describe, it, expect } from "vitest";
import {
  transactionSchema,
  transferSchema,
  transactionFilterSchema,
} from "@/lib/validators/transaction";

const UUID_A = "550e8400-e29b-41d4-a716-446655440000";
const UUID_B = "660e8400-e29b-41d4-a716-446655440000";

// ─── transactionSchema ───────────────────────────────────────────────────────
describe("transactionSchema", () => {
  const valid = {
    account_id: UUID_A,
    category_id: UUID_B,
    txn_type: "expense" as const,
    amount: 250,
    occurred_on: "2024-06-15",
  };

  it("accepts valid transaction with defaults", () => {
    const result = transactionSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency_code).toBe("USD");
      expect(result.data.description).toBeNull();
    }
  });

  it("accepts income type", () => {
    expect(transactionSchema.safeParse({ ...valid, txn_type: "income" }).success).toBe(true);
  });

  it("rejects transfer type", () => {
    expect(transactionSchema.safeParse({ ...valid, txn_type: "transfer" }).success).toBe(false);
  });

  it("rejects zero amount", () => {
    expect(transactionSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });

  it("rejects negative amount", () => {
    expect(transactionSchema.safeParse({ ...valid, amount: -10 }).success).toBe(false);
  });

  it("rejects amount over max", () => {
    expect(transactionSchema.safeParse({ ...valid, amount: 1000000000 }).success).toBe(false);
  });

  it("rejects invalid account_id", () => {
    expect(transactionSchema.safeParse({ ...valid, account_id: "bad" }).success).toBe(false);
  });

  it("rejects empty occurred_on", () => {
    expect(transactionSchema.safeParse({ ...valid, occurred_on: "" }).success).toBe(false);
  });

  it("accepts description up to 500 chars", () => {
    const result = transactionSchema.safeParse({
      ...valid,
      description: "A".repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it("rejects description over 500 chars", () => {
    const result = transactionSchema.safeParse({
      ...valid,
      description: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

// ─── transferSchema ──────────────────────────────────────────────────────────
describe("transferSchema", () => {
  const valid = {
    from_account_id: UUID_A,
    to_account_id: UUID_B,
    amount: 500,
    occurred_on: "2024-06-15",
  };

  it("accepts valid transfer", () => {
    const result = transferSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects same source and destination", () => {
    const result = transferSchema.safeParse({
      ...valid,
      to_account_id: UUID_A,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Source and destination must be different"
      );
    }
  });

  it("rejects zero amount", () => {
    expect(transferSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });

  it("rejects invalid from_account_id", () => {
    expect(transferSchema.safeParse({ ...valid, from_account_id: "x" }).success).toBe(false);
  });

  it("defaults currency_code to USD", () => {
    const result = transferSchema.safeParse(valid);
    if (result.success) {
      expect(result.data.currency_code).toBe("USD");
    }
  });
});

// ─── transactionFilterSchema ─────────────────────────────────────────────────
describe("transactionFilterSchema", () => {
  it("applies defaults for empty object", () => {
    const result = transactionFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.account_id).toBeNull();
      expect(result.data.category_id).toBeNull();
      expect(result.data.txn_type).toBeNull();
      expect(result.data.date_from).toBeNull();
      expect(result.data.date_to).toBeNull();
      expect(result.data.search).toBeNull();
    }
  });

  it("coerces string page/limit to numbers", () => {
    const result = transactionFilterSchema.safeParse({ page: "3", limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects page below 1", () => {
    expect(transactionFilterSchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it("rejects limit above 100", () => {
    expect(transactionFilterSchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  it("treats empty string values as null", () => {
    const result = transactionFilterSchema.safeParse({
      account_id: "",
      txn_type: "",
      search: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.account_id).toBeNull();
      expect(result.data.txn_type).toBeNull();
      expect(result.data.search).toBeNull();
    }
  });

  it("accepts valid txn_type values", () => {
    for (const t of ["income", "expense", "transfer"]) {
      const result = transactionFilterSchema.safeParse({ txn_type: t });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid txn_type", () => {
    const result = transactionFilterSchema.safeParse({ txn_type: "refund" });
    expect(result.success).toBe(false);
  });

  it("rejects search over 200 chars", () => {
    const result = transactionFilterSchema.safeParse({
      search: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});
