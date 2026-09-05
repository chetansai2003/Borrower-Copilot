import { describe, expect, it } from "vitest";
import { formatINR, parseCurrencyNumber } from "../utils/money.js";

describe("money utilities", () => {
  it("formats INR for display", () => {
    expect(formatINR(50000)).toBe("₹50,000");
  });

  it("parses formatted values into clean numbers", () => {
    expect(parseCurrencyNumber("₹50,000")).toBe(50000);
  });
});
