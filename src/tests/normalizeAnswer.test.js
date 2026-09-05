import { describe, expect, it } from "vitest";
import { questions } from "../data/questions.js";
import { normalizeAnswer } from "../utils/normalizeAnswer.js";

const questionById = (id) => questions.find((question) => question.id === id);

describe("normalizeAnswer", () => {
  it("keeps unknown, null, and zero distinct", () => {
    const existingEmis = questionById("existingEmis");

    expect(normalizeAnswer(existingEmis, "unknown")).toBe("unknown");
    expect(normalizeAnswer(existingEmis, "")).toBeNull();
    expect(normalizeAnswer(existingEmis, "0")).toBe(0);
  });

  it("converts numeric browser strings before storing", () => {
    expect(normalizeAnswer(questionById("requestedAmount"), "50000")).toBe(50000);
    expect(normalizeAnswer(questionById("preferredTenureMonths"), "24")).toBe(24);
  });

  it("keeps non-numeric choice values as strings", () => {
    expect(normalizeAnswer(questionById("incomeType"), "salaried")).toBe("salaried");
  });
});
