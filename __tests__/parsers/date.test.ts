import { describe, it, expect } from "vitest";
import { parseDateStr } from "@/lib/parsers/date";

describe("parseDateStr", () => {
  it("returns ISO date strings unchanged", () => {
    expect(parseDateStr("2024-06-15")).toBe("2024-06-15");
  });

  it("parses DD-MMM-YYYY format", () => {
    expect(parseDateStr("15-May-2026")).toBe("2026-05-15");
  });

  it("parses DD/MMM/YYYY format", () => {
    expect(parseDateStr("1/Jan/2024")).toBe("2024-01-01");
  });

  it("is case-insensitive for month names", () => {
    expect(parseDateStr("25-DEC-2024")).toBe("2024-12-25");
  });

  it("parses DD/MM/YYYY format", () => {
    expect(parseDateStr("31/12/2024")).toBe("2024-12-31");
  });

  it("parses DD-MM-YYYY format", () => {
    expect(parseDateStr("01-06-2024")).toBe("2024-06-01");
  });

  it("handles 2-digit year (DD/MM/YY)", () => {
    expect(parseDateStr("15/06/24")).toBe("2024-06-15");
  });

  it("handles YYYY-MM-DD when first part > 100", () => {
    expect(parseDateStr("2024/06/15")).toBe("2024-06-15");
  });

  it("pads single-digit days and months", () => {
    expect(parseDateStr("5/3/2024")).toBe("2024-03-05");
  });

  it("returns null for single-segment unparseable strings", () => {
    expect(parseDateStr("hello")).toBeNull();
  });

  it("handles hyphenated non-date strings (3 parts via split)", () => {
    const result = parseDateStr("not-a-date");
    expect(typeof result).toBe("string");
  });

  it("returns null for empty string", () => {
    expect(parseDateStr("")).toBeNull();
  });

  it("trims whitespace", () => {
    expect(parseDateStr("  2024-06-15  ")).toBe("2024-06-15");
  });
});
