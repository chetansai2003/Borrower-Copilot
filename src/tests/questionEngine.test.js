import { describe, expect, it } from "vitest";
import { questions } from "../data/questions.js";
import {
  getActiveAnswers,
  getNextQuestion,
  getPreviousQuestionId,
  getVisibleQuestions,
  validateQuestion,
  validateVisibleQuestions
} from "../engine/questionEngine.js";

const questionById = (id) => questions.find((question) => question.id === id);

describe("questionEngine", () => {
  it("shows self-employed follow-up only for self-employed income", () => {
    expect(getVisibleQuestions(questions, { incomeType: "self_employed" }).map((q) => q.id)).toContain("businessAgeMonths");
    expect(getVisibleQuestions(questions, { incomeType: "salaried" }).map((q) => q.id)).not.toContain("businessAgeMonths");
  });

  it("shows low-month income only for irregular income", () => {
    expect(getVisibleQuestions(questions, { incomeStability: "irregular" }).map((q) => q.id)).toContain("lowMonthIncome");
    expect(getVisibleQuestions(questions, { incomeStability: "stable" }).map((q) => q.id)).not.toContain("lowMonthIncome");
  });

  it("shows debt outstanding only when EMI is a confirmed positive number", () => {
    expect(getVisibleQuestions(questions, { existingEmis: 2500 }).map((q) => q.id)).toContain("outstandingDebtAmount");
    expect(getVisibleQuestions(questions, { existingEmis: 0 }).map((q) => q.id)).not.toContain("outstandingDebtAmount");
    expect(getVisibleQuestions(questions, { existingEmis: "unknown" }).map((q) => q.id)).not.toContain("outstandingDebtAmount");
  });

  it("shows repayment recency only for real repayment difficulty", () => {
    expect(getVisibleQuestions(questions, { recentRepaymentDifficulty: "bounce" }).map((q) => q.id)).toContain("repaymentDifficultyRecency");
    expect(getVisibleQuestions(questions, { recentRepaymentDifficulty: "none" }).map((q) => q.id)).not.toContain("repaymentDifficultyRecency");
    expect(getVisibleQuestions(questions, { recentRepaymentDifficulty: "unknown" }).map((q) => q.id)).not.toContain("repaymentDifficultyRecency");
  });

  it("validates null, unknown, zero, and invalid positive amounts distinctly", () => {
    const requestedAmount = questionById("requestedAmount");
    const existingEmis = questionById("existingEmis");

    expect(validateQuestion(requestedAmount, null).isValid).toBe(false);
    expect(validateQuestion(requestedAmount, "unknown").isValid).toBe(false);
    expect(validateQuestion(requestedAmount, 0).isValid).toBe(false);
    expect(validateQuestion(existingEmis, "unknown").isValid).toBe(true);
    expect(validateQuestion(existingEmis, 0).isValid).toBe(true);
  });

  it("excludes hidden answers from active output while preserving them in raw answers", () => {
    const answers = {
      incomeType: "salaried",
      businessAgeMonths: 36,
      borrowingPurpose: "home_repair"
    };

    expect(getActiveAnswers(questions, answers)).toEqual({
      incomeType: "salaried",
      borrowingPurpose: "home_repair"
    });
  });

  it("validates only visible questions", () => {
    const visibleQuestions = getVisibleQuestions(questions, { incomeType: "salaried" });
    const errors = validateVisibleQuestions(visibleQuestions, {
      incomeType: "salaried",
      businessAgeMonths: null
    });

    expect(errors.businessAgeMonths).toBeUndefined();
    expect(errors.borrowingPurpose).toBe("Answer this question to continue.");
  });

  it("finds next and previous question IDs without React", () => {
    const visibleQuestions = getVisibleQuestions(questions, {});

    expect(getNextQuestion(visibleQuestions, "borrowingPurpose").id).toBe("requestedAmount");
    expect(getPreviousQuestionId(["borrowingPurpose", "requestedAmount"])).toBe("requestedAmount");
  });
});
