import { describe, it, expect } from "vitest";
import { categorise, extractCounterparty } from "@/lib/parsers/categorise";

describe("categorise", () => {
  it("detects Utilities from KPLC", () => {
    expect(categorise("Pay Bill to KPLC PREPAID", "expense")).toBe("Utilities");
  });

  it("detects Utilities from Safaricom", () => {
    expect(categorise("Safaricom airtime", "expense")).toBe("Utilities");
  });

  it("detects Food & Dining from Naivas", () => {
    expect(categorise("Merchant Payment to NAIVAS", "expense")).toBe("Food & Dining");
  });

  it("detects Transport from Uber", () => {
    expect(categorise("Uber ride", "expense")).toBe("Transport");
  });

  it("detects Subscriptions from Netflix", () => {
    expect(categorise("Netflix monthly", "expense")).toBe("Subscriptions");
  });

  it("detects Healthcare from hospital", () => {
    expect(categorise("Hospital visit", "expense")).toBe("Healthcare");
  });

  it("detects Education from school fees", () => {
    expect(categorise("School fees payment", "expense")).toBe("Education");
  });

  it("detects Travel from Airbnb", () => {
    expect(categorise("Airbnb booking", "expense")).toBe("Travel");
  });

  it("detects Salary income", () => {
    expect(categorise("Monthly salary deposit", "income")).toBe("Salary");
  });

  it("detects Freelance income", () => {
    expect(categorise("Upwork payment", "income")).toBe("Freelance");
  });

  it("returns Other Expense for unrecognized expense", () => {
    expect(categorise("Random purchase", "expense")).toBe("Other Expense");
  });

  it("returns Other Income for unrecognized income (non-mpesa)", () => {
    expect(categorise("Random deposit", "income", false)).toBe("Other Income");
  });

  it("returns Funds received for unrecognized income (mpesa)", () => {
    expect(categorise("Random deposit", "income", true)).toBe("Funds received");
  });

  it("is case-insensitive", () => {
    expect(categorise("KPLC PREPAID", "expense")).toBe("Utilities");
    expect(categorise("naivas supermarket", "expense")).toBe("Food & Dining");
  });
});

describe("extractCounterparty", () => {
  it("strips Pay Bill prefix", () => {
    expect(extractCounterparty("Pay Bill to KPLC PREPAID")).toBe("KPLC PREPAID");
  });

  it("strips Merchant Payment prefix", () => {
    expect(extractCounterparty("Merchant Payment to NAIVAS")).toBe("NAIVAS");
  });

  it("strips Customer Transfer prefix", () => {
    expect(extractCounterparty("Customer Transfer to JOHN DOE")).toBe("JOHN DOE");
  });

  it("strips Funds received prefix", () => {
    expect(extractCounterparty("Funds received from JANE")).toBe("JANE");
  });

  it("removes phone numbers (9-12 digits)", () => {
    expect(extractCounterparty("JOHN DOE 0712345678")).toBe("JOHN DOE");
  });

  it("returns Unknown for empty string", () => {
    expect(extractCounterparty("")).toBe("Unknown");
  });

  it("returns original trimmed if cleaning removes everything meaningful", () => {
    const result = extractCounterparty("Customer Transfer to 0712345678");
    expect(result).toBeTruthy();
    expect(result).not.toBe("");
  });
});
