import { describe, expect, it } from "vitest";
import { formatINR, parseCurrencyNumber } from "../utils/money.js";

describe("money utilities", () => {
  it.each([
    ["-100", -100],
    ["-100.50", -100.5],
    ["100.50", 100.5],
    ["0", 0],
    ["1,50,000", 150000],
    ["150,000", 150000],
    ["-\u20b91,000", -1000]
  ])("preserves the numeric meaning of %s", (input, expected) => {
    expect(parseCurrencyNumber(input)).toBe(expected);
  });

  it.each(["", null, undefined, "-", "abc", "100abc", "1e3", "1,2", "--100", "100.123", "9".repeat(400)])(
    "rejects incomplete, malformed or non-finite input %s",
    (input) => expect(parseCurrencyNumber(input)).toBe("")
  );

  it("retains paise in formatted editable amounts", () => {
    expect(parseCurrencyNumber(formatINR(-100.5))).toBe(-100.5);
  });
  it("formats INR for display", () => {
    expect(formatINR(50000)).toBe("₹50,000");
  });

  it("parses formatted values into clean numbers", () => {
    expect(parseCurrencyNumber("₹50,000")).toBe(50000);
  });
});
