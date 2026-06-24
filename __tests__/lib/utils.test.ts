import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatPercentage,
  formatDate,
  getMonthStart,
  getMonthLabel,
  normalizeDescription,
  normalizeToTarget,
  type ExchangeRate,
} from "@/lib/utils";

// ─── cn ───────────────────────────────────────────────────────────────────────
describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("text-red-500", false && "bg-blue-500")).toBe("text-red-500");
  });

  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });
});

// ─── formatCurrency ───────────────────────────────────────────────────────────
describe("formatCurrency", () => {
  it("formats KES amounts with currency code and two decimals", () => {
    const result = formatCurrency(1234.5);
    expect(result).toMatch(/KES/);
    expect(result).toContain("1,234.50");
  });

  it("uses absolute value for negative amounts", () => {
    const result = formatCurrency(-500);
    expect(result).toMatch(/KES/);
    expect(result).toContain("500.00");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/KES/);
    expect(result).toContain("0.00");
  });

  it("accepts a different currency", () => {
    const result = formatCurrency(100, "USD");
    expect(result).toMatch(/USD/);
    expect(result).toContain("100.00");
  });

  it("handles large numbers with comma grouping", () => {
    const result = formatCurrency(1000000);
    expect(result).toContain("1,000,000.00");
  });
});

// ─── formatPercentage ─────────────────────────────────────────────────────────
describe("formatPercentage", () => {
  it("adds + for positive values", () => {
    expect(formatPercentage(12.34)).toBe("+12.3%");
  });

  it("adds - for negative values (no + prefix)", () => {
    expect(formatPercentage(-5.67)).toBe("-5.7%");
  });

  it("formats zero with + prefix", () => {
    expect(formatPercentage(0)).toBe("+0.0%");
  });

  it("rounds to one decimal place", () => {
    expect(formatPercentage(3.456)).toBe("+3.5%");
  });
});

// ─── formatDate ───────────────────────────────────────────────────────────────
describe("formatDate", () => {
  it("formats ISO date string to US short format", () => {
    const result = formatDate("2024-01-15");
    expect(result).toBe("Jan 15, 2024");
  });

  it("handles full ISO datetime strings", () => {
    const result = formatDate("2024-12-25T10:30:00Z");
    expect(result).toMatch(/Dec 25, 2024/);
  });
});

// ─── getMonthStart ────────────────────────────────────────────────────────────
describe("getMonthStart", () => {
  it("returns first day of the month in YYYY-MM-DD format", () => {
    const result = getMonthStart(new Date(2024, 5, 15)); // June 15, 2024
    expect(result).toBe("2024-06-01");
  });

  it("handles January correctly", () => {
    const result = getMonthStart(new Date(2024, 0, 31)); // Jan 31, 2024
    expect(result).toBe("2024-01-01");
  });

  it("handles December correctly", () => {
    const result = getMonthStart(new Date(2024, 11, 25)); // Dec 25, 2024
    expect(result).toBe("2024-12-01");
  });
});

// ─── getMonthLabel ────────────────────────────────────────────────────────────
describe("getMonthLabel", () => {
  it("returns month and year label from date string", () => {
    const result = getMonthLabel("2024-06-01");
    expect(result).toBe("Jun 2024");
  });

  it("handles different months", () => {
    expect(getMonthLabel("2024-01-15")).toBe("Jan 2024");
    expect(getMonthLabel("2024-12-01")).toBe("Dec 2024");
  });
});

// ─── normalizeDescription ─────────────────────────────────────────────────────
describe("normalizeDescription", () => {
  it("lowercases and trims", () => {
    expect(normalizeDescription("  Hello World  ")).toBe("hello world");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeDescription("foo   bar   baz")).toBe("foo bar baz");
  });

  it("returns empty string for null", () => {
    expect(normalizeDescription(null)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(normalizeDescription("")).toBe("");
  });
});

// ─── normalizeToTarget (currency conversion) ──────────────────────────────────
describe("normalizeToTarget", () => {
  const rates: ExchangeRate[] = [
    { base_currency: "USD", quote_currency: "KES", rate: 130, valid_on: "2024-01-01" },
    { base_currency: "EUR", quote_currency: "KES", rate: 145, valid_on: "2024-01-01" },
    { base_currency: "USD", quote_currency: "KES", rate: 135, valid_on: "2024-06-01" },
  ];

  it("returns amount unchanged when from === to", () => {
    expect(normalizeToTarget(100, "KES", "KES")).toBe(100);
  });

  it("converts using direct rate", () => {
    const result = normalizeToTarget(10, "USD", "KES", { rates });
    expect(result).toBe(10 * 135); // uses latest rate
  });

  it("converts using inverse rate", () => {
    const result = normalizeToTarget(1350, "KES", "USD", { rates });
    expect(result).toBe(1350 / 135);
  });

  it("picks rate matching validOn date", () => {
    const result = normalizeToTarget(10, "USD", "KES", {
      rates,
      validOn: "2024-01-15",
    });
    expect(result).toBe(10 * 130); // exact match or < validOn → Jan rate
  });

  it("returns original amount when no rate found (default onMissing)", () => {
    const result = normalizeToTarget(100, "GBP", "KES", { rates });
    expect(result).toBe(100);
  });

  it("throws when onMissing is 'throw' and rate is missing", () => {
    expect(() =>
      normalizeToTarget(100, "GBP", "KES", { rates, onMissing: "throw" })
    ).toThrowError(/Missing exchange rate from GBP to KES/);
  });

  it("includes validOn in error message when specified", () => {
    expect(() =>
      normalizeToTarget(100, "GBP", "KES", {
        rates,
        onMissing: "throw",
        validOn: "2024-03-01",
      })
    ).toThrowError(/for 2024-03-01/);
  });

  it("handles rate as string", () => {
    const stringRates: ExchangeRate[] = [
      { base_currency: "USD", quote_currency: "KES", rate: "130", valid_on: "2024-01-01" },
    ];
    const result = normalizeToTarget(10, "USD", "KES", { rates: stringRates });
    expect(result).toBe(1300);
  });

  it("handles empty rates array gracefully", () => {
    const result = normalizeToTarget(100, "USD", "KES", { rates: [] });
    expect(result).toBe(100);
  });
});
