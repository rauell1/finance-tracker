import { describe, it, expect } from "vitest";
import { budgetSchema } from "@/lib/validators/budget";

describe("budgetSchema", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";
  const valid = {
    category_id: validUUID,
    month_start: "2024-06-01",
    amount: 5000,
  };

  it("accepts valid budget with defaults", () => {
    const result = budgetSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency_code).toBe("USD");
      expect(result.data.alert_threshold_pct).toBe(90);
    }
  });

  it("accepts explicit currency and threshold", () => {
    const result = budgetSchema.safeParse({
      ...valid,
      currency_code: "KES",
      alert_threshold_pct: 75,
    });
    expect(result.success).toBe(true);
  });

  it("accepts txn_type income", () => {
    const result = budgetSchema.safeParse({ ...valid, txn_type: "income" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid category_id (not UUID)", () => {
    const result = budgetSchema.safeParse({ ...valid, category_id: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects empty month_start", () => {
    const result = budgetSchema.safeParse({ ...valid, month_start: "" });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = budgetSchema.safeParse({ ...valid, amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = budgetSchema.safeParse({ ...valid, amount: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects amount over max", () => {
    const result = budgetSchema.safeParse({ ...valid, amount: 1000000000 });
    expect(result.success).toBe(false);
  });

  it("rejects alert_threshold_pct below 1", () => {
    const result = budgetSchema.safeParse({ ...valid, alert_threshold_pct: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects alert_threshold_pct above 200", () => {
    const result = budgetSchema.safeParse({ ...valid, alert_threshold_pct: 201 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid txn_type", () => {
    const result = budgetSchema.safeParse({ ...valid, txn_type: "transfer" });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric amount", () => {
    const result = budgetSchema.safeParse({ ...valid, amount: "five" });
    expect(result.success).toBe(false);
  });
});
