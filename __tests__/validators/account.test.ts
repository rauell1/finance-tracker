import { describe, it, expect } from "vitest";
import { accountUpdateSchema } from "@/lib/validators/account";

describe("accountUpdateSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(accountUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid name", () => {
    const result = accountUpdateSchema.safeParse({ name: "Savings" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = accountUpdateSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 100 characters", () => {
    const result = accountUpdateSchema.safeParse({ name: "A".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("accepts valid 3-letter currency code", () => {
    const result = accountUpdateSchema.safeParse({ currency_code: "USD" });
    expect(result.success).toBe(true);
  });

  it("rejects currency code not exactly 3 characters", () => {
    expect(accountUpdateSchema.safeParse({ currency_code: "US" }).success).toBe(false);
    expect(accountUpdateSchema.safeParse({ currency_code: "USDX" }).success).toBe(false);
  });

  it("accepts boolean is_archived", () => {
    expect(accountUpdateSchema.safeParse({ is_archived: true }).success).toBe(true);
    expect(accountUpdateSchema.safeParse({ is_archived: false }).success).toBe(true);
  });

  it("rejects non-boolean is_archived", () => {
    expect(accountUpdateSchema.safeParse({ is_archived: "yes" }).success).toBe(false);
  });

  it("accepts all fields together", () => {
    const result = accountUpdateSchema.safeParse({
      name: "Main Account",
      currency_code: "KES",
      is_archived: false,
    });
    expect(result.success).toBe(true);
  });
});
