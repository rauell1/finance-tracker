import { describe, it, expect } from "vitest";
import {
  num,
  parseDate,
  cleanName,
  cleanSms,
  looksLikeMpesa,
  hashString,
  savingsCodeFor,
  parseSbmDate,
  guessCategory,
  guessMpesaCategory,
} from "@/lib/parsers/mpesa-helpers";

describe("num", () => {
  it("parses plain number string", () => {
    expect(num("1234.56")).toBe(1234.56);
  });

  it("strips commas", () => {
    expect(num("1,234,567.89")).toBe(1234567.89);
  });

  it("handles string with no decimals", () => {
    expect(num("500")).toBe(500);
  });
});

describe("parseDate", () => {
  it("parses DD/MM/YYYY", () => {
    expect(parseDate("15/06/2024")).toBe("2024-06-15");
  });

  it("handles 2-digit year", () => {
    expect(parseDate("1/1/24")).toBe("2024-01-01");
  });

  it("pads single-digit day/month", () => {
    expect(parseDate("5/3/2024")).toBe("2024-03-05");
  });
});

describe("cleanName", () => {
  it("removes phone numbers", () => {
    expect(cleanName("JOHN DOE 0712345678")).toBe("JOHN DOE");
  });

  it("collapses multiple spaces", () => {
    expect(cleanName("JANE   DOE")).toBe("JANE DOE");
  });

  it("strips trailing dots and spaces", () => {
    expect(cleanName("ACME Corp. ")).toBe("ACME Corp");
  });

  it("returns Unknown for empty after cleaning", () => {
    expect(cleanName("0712345678")).toBe("Unknown");
  });
});

describe("cleanSms", () => {
  it("strips From: header line", () => {
    expect(cleanSms("From: MPESA\nHello world")).toBe("Hello world");
  });

  it("returns trimmed text when no From header", () => {
    expect(cleanSms("  Hello world  ")).toBe("Hello world");
  });
});

describe("looksLikeMpesa", () => {
  it("detects confirmed + ksh pattern", () => {
    expect(looksLikeMpesa("ABC123 confirmed. Ksh500 sent to John")).toBe(true);
  });

  it("detects M-Pesa balance pattern", () => {
    expect(looksLikeMpesa("Your M-PESA balance is Ksh1,234")).toBe(true);
  });

  it("detects 10-char receipt + confirmed", () => {
    expect(looksLikeMpesa("ABCDE12345 confirmed something")).toBe(true);
  });

  it("rejects non-mpesa text", () => {
    expect(looksLikeMpesa("Your bank transfer was successful")).toBe(false);
  });
});

describe("hashString", () => {
  it("returns a string", () => {
    expect(typeof hashString("test")).toBe("string");
  });

  it("returns consistent hash for same input", () => {
    expect(hashString("hello")).toBe(hashString("hello"));
  });

  it("returns different hashes for different inputs", () => {
    expect(hashString("a")).not.toBe(hashString("b"));
  });

  it("handles empty string", () => {
    expect(hashString("")).toBe("0");
  });
});

describe("savingsCodeFor", () => {
  it("returns kcb_mpesa for KCB label", () => {
    expect(savingsCodeFor("KCB M-PESA")).toBe("kcb_mpesa");
  });

  it("returns mshwari for M-Shwari label", () => {
    expect(savingsCodeFor("M-Shwari")).toBe("mshwari");
  });

  it("is case-insensitive", () => {
    expect(savingsCodeFor("kcb savings")).toBe("kcb_mpesa");
  });
});

describe("parseSbmDate", () => {
  it("returns ISO date unchanged", () => {
    expect(parseSbmDate("2024-06-15")).toBe("2024-06-15");
  });

  it("parses DD/MM/YYYY", () => {
    expect(parseSbmDate("15/06/2024")).toBe("2024-06-15");
  });

  it("parses DD-MM-YYYY with DD > 12", () => {
    expect(parseSbmDate("25-06-2024")).toBe("2024-06-25");
  });

  it("strips time portion (space separated)", () => {
    expect(parseSbmDate("2024-06-15 10:30:00")).toBe("2024-06-15");
  });

  it("handles 2-digit year", () => {
    expect(parseSbmDate("15/06/24")).toBe("2024-06-15");
  });

  it("handles YYYY/MM/DD when first part > 100", () => {
    expect(parseSbmDate("2024/06/15")).toBe("2024-06-15");
  });
});

describe("guessCategory", () => {
  it("categorises KPLC as Utilities expense", () => {
    expect(guessCategory("KPLC prepaid", "expense")).toBe("Utilities");
  });

  it("categorises salary as income", () => {
    expect(guessCategory("Monthly salary", "income")).toBe("Salary");
  });

  it("categorises Naivas as Food & Dining", () => {
    expect(guessCategory("Purchase at Naivas", "expense")).toBe("Food & Dining");
  });

  it("categorises Uber as Transport", () => {
    expect(guessCategory("Uber trip", "expense")).toBe("Transport");
  });

  it("categorises Netflix as Subscriptions", () => {
    expect(guessCategory("Netflix monthly", "expense")).toBe("Subscriptions");
  });

  it("categorises hospital as Healthcare", () => {
    expect(guessCategory("Hospital visit payment", "expense")).toBe("Healthcare");
  });

  it("categorises school as Education", () => {
    expect(guessCategory("School fees", "expense")).toBe("Education");
  });

  it("categorises hotel as Travel", () => {
    expect(guessCategory("Hotel booking", "expense")).toBe("Travel");
  });

  it("categorises rent as Housing", () => {
    expect(guessCategory("Rent payment landlord", "expense")).toBe("Housing");
  });

  it("categorises freelance as income", () => {
    expect(guessCategory("Upwork earnings", "income")).toBe("Freelance");
  });

  it("categorises investment/dividend as income", () => {
    expect(guessCategory("Dividend payment", "income")).toBe("Investment");
  });

  it("defaults to Other Expense for unrecognised expense", () => {
    expect(guessCategory("random item", "expense")).toBe("Other Expense");
  });

  it("defaults to Other Income for unrecognised income", () => {
    expect(guessCategory("random deposit", "income")).toBe("Other Income");
  });
});

describe("guessMpesaCategory", () => {
  it("returns Send Money for personal transfers (expense)", () => {
    expect(guessMpesaCategory("sent to John 0712345678", "expense")).toBe("Send Money");
  });

  it("returns Bill Payment for Lipa na KCB", () => {
    expect(guessMpesaCategory("Lipa na KCB payment", "expense")).toBe("Bill Payment");
  });

  it("returns Airtime for airtime purchase", () => {
    expect(guessMpesaCategory("Airtime purchase", "expense")).toBe("Airtime");
  });

  it("returns Remittance for WorldRemit income", () => {
    expect(guessMpesaCategory("WorldRemit transfer", "income")).toBe("Remittance");
  });

  it("returns Funds received for generic mpesa income", () => {
    expect(guessMpesaCategory("Received from John", "income")).toBe("Funds received");
  });

  it("returns Salary for salary income via mpesa", () => {
    expect(guessMpesaCategory("Salary payment", "income")).toBe("Salary");
  });

  it("falls back to guessCategory for general expense", () => {
    expect(guessMpesaCategory("KPLC payment", "expense")).toBe("Utilities");
  });
});
