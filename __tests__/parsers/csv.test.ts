import { describe, it, expect } from "vitest";
import { parseCsvLine, parseCsv } from "@/lib/parsers/csv";

describe("parseCsvLine", () => {
  it("splits a simple comma-separated line", () => {
    expect(parseCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("trims whitespace from fields", () => {
    expect(parseCsvLine("  foo , bar , baz  ")).toEqual(["foo", "bar", "baz"]);
  });

  it("handles quoted fields containing commas", () => {
    expect(parseCsvLine('"hello, world",test')).toEqual(["hello, world", "test"]);
  });

  it("handles escaped double quotes inside quoted fields", () => {
    expect(parseCsvLine('"he said ""hi""",ok')).toEqual(['he said "hi"', "ok"]);
  });

  it("returns single element for a line with no commas", () => {
    expect(parseCsvLine("single")).toEqual(["single"]);
  });

  it("handles empty fields", () => {
    expect(parseCsvLine("a,,c")).toEqual(["a", "", "c"]);
  });

  it("handles empty string", () => {
    expect(parseCsvLine("")).toEqual([""]);
  });
});

describe("parseCsv", () => {
  it("parses headers and data rows", () => {
    const input = "Name,Amount,Date\nAlice,100,2024-01-01\nBob,200,2024-02-01";
    const result = parseCsv(input);
    expect(result.headers).toEqual(["Name", "Amount", "Date"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual(["Alice", "100", "2024-01-01"]);
    expect(result.rows[1]).toEqual(["Bob", "200", "2024-02-01"]);
  });

  it("returns empty for empty input", () => {
    expect(parseCsv("")).toEqual({ headers: [], rows: [] });
  });

  it("returns headers with no rows for header-only input", () => {
    const result = parseCsv("col1,col2");
    expect(result.headers).toEqual(["col1", "col2"]);
    expect(result.rows).toEqual([]);
  });

  it("handles Windows-style line endings (\\r\\n)", () => {
    const input = "A,B\r\n1,2\r\n3,4";
    const result = parseCsv(input);
    expect(result.headers).toEqual(["A", "B"]);
    expect(result.rows).toHaveLength(2);
  });

  it("skips blank lines", () => {
    const input = "H1,H2\n\nval1,val2\n\n";
    const result = parseCsv(input);
    expect(result.rows).toHaveLength(1);
  });
});
