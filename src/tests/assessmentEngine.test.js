import { describe, expect, it } from "vitest";
import { personas } from "../data/personas.js";
import { rules } from "../data/rules.js";
import {
  CONFIDENCE_LEVELS,
  DECISION_STATUSES,
  REPAYMENT_DIFFICULTY_TYPES,
  VERDICTS,
  chooseRecommendedTenure,
  determineVerdict,
  runAssessment
} from "../engine/assessmentEngine.js";

function personaAnswers(id) {
  return personas.find((persona) => persona.id === id).answers;
}

function assess(answers) {
  const result = runAssessment(answers, rules);
  expect(result.ok).toBe(true);
  return result.value;
}

function expectNoNonFiniteNumbers(value) {
  if (typeof value === "number") {
    expect(Number.isFinite(value)).toBe(true);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(expectNoNonFiniteNumbers);
    return;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach(expectNoNonFiniteNumbers);
  }
}

describe("runAssessment", () => {
  it("returns exactly one valid verdict", () => {
    const assessment = assess(personaAnswers("priya"));

    expect(Object.values(VERDICTS)).toContain(assessment.verdict);
    expect(Object.values(VERDICTS).filter((verdict) => verdict === assessment.verdict)).toHaveLength(1);
  });

  it("returns BORROW for Priya", () => {
    const assessment = assess(personaAnswers("priya"));

    expect(assessment.verdict).toBe(VERDICTS.BORROW);
    expect(assessment.recommendedAmount).toBe(assessment.requestedAmount);
    expect(assessment.decisionStatus).toBe(DECISION_STATUSES.COMPLETE);
  });

  it("returns BORROW_LESS for Ravi", () => {
    const assessment = assess(personaAnswers("ravi"));

    expect(assessment.verdict).toBe(VERDICTS.BORROW_LESS);
    expect(assessment.recommendedAmount).toBeGreaterThan(0);
    expect(assessment.recommendedAmount).toBeLessThanOrEqual(assessment.borrowerSafeAmount);
    expect(assessment.recommendedAmount).toBeLessThan(assessment.requestedAmount);
  });

  it("returns DO_NOT_BORROW for Anita", () => {
    const assessment = assess(personaAnswers("anita"));

    expect(assessment.verdict).toBe(VERDICTS.DO_NOT_BORROW);
    expect(assessment.recommendedAmount).toBeNull();
    expect(assessment.primaryReasonCode).toBe("CRITICAL_REPAYMENT_RISK");
    expect(assessment.risks.some((risk) => risk.code === "RECENT_PAYMENT_BOUNCE")).toBe(true);
  });

  it("treats missing core data as a valid insufficient-data assessment", () => {
    const result = runAssessment({ ...personaAnswers("priya"), monthlyIncome: null }, rules);

    expect(result.ok).toBe(true);
    expect(result.value.verdict).toBe(VERDICTS.DO_NOT_BORROW);
    expect(result.value.decisionStatus).toBe(DECISION_STATUSES.INSUFFICIENT_DATA);
    expect(result.value.primaryReasonCode).toBe("CORE_DATA_MISSING");
    expect(result.value.confidence).toBe(CONFIDENCE_LEVELS.LOW);
    expect(result.value.summary).toMatch(/cannot safely recommend/i);
  });

  it("returns BORROW_LESS when requested loan stress fails but a smaller amount is affordable", () => {
    const assessment = assess(personaAnswers("ravi"));

    expect(assessment.baselineStress.seriousFailure).toBe(false);
    expect(assessment.requestedLoanStress.passed).toBe(false);
    expect(assessment.verdict).toBe(VERDICTS.BORROW_LESS);
  });

  it("returns DO_NOT_BORROW when existing finances fail stress before adding the new loan", () => {
    const assessment = assess({
      borrowingPurpose: "home_repair",
      requestedAmount: 50000,
      preferredTenureMonths: 36,
      incomeType: "salaried",
      monthlyIncome: 60000,
      incomeStability: "stable",
      essentialExpenses: 42000,
      existingEmis: 10000,
      emergencySavings: 100000,
      recentRepaymentDifficulty: REPAYMENT_DIFFICULTY_TYPES.NONE
    });

    expect(assessment.safeEmi).toBeGreaterThanOrEqual(rules.assessment.minimumSafeEmi);
    expect(assessment.borrowerSafeAmount).toBeGreaterThanOrEqual(rules.assessment.minimumBorrowerSafeAmount);
    expect(assessment.baselineStress.seriousFailure).toBe(true);
    expect(assessment.verdict).toBe(VERDICTS.DO_NOT_BORROW);
    expect(assessment.primaryReasonCode).toBe("BASELINE_STRESS_FAILED");
  });

  it("can return high confidence for a negative verdict when complete data is confirmed", () => {
    const assessment = assess(personaAnswers("anita"));

    expect(assessment.verdict).toBe(VERDICTS.DO_NOT_BORROW);
    expect(assessment.confidence).toBe(CONFIDENCE_LEVELS.HIGH);
    expect(assessment.confidenceReasons).toEqual([]);
  });

  it("keeps lender-likely amount out of verdict selection", () => {
    const assessment = assess(personaAnswers("ravi"));

    expect(assessment.lenderLikelyAmount).toBeGreaterThan(assessment.requestedAmount);
    expect(assessment.borrowerSafeAmount).toBeLessThan(assessment.requestedAmount);
    expect(assessment.verdict).toBe(VERDICTS.BORROW_LESS);
  });

  it("applies tolerance to both amount and EMI", () => {
    const base = {
      hasBlockingCoreData: false,
      hasCriticalRepaymentRisk: false,
      baselineStress: { seriousFailure: false },
      requestedLoanStress: { passed: true },
      safeEmi: 10000,
      borrowerSafeAmount: 100000,
      rules
    };

    expect(determineVerdict({ ...base, requestedAmount: 102000, proposedEmi: 10200 })).toBe(VERDICTS.BORROW);
    expect(determineVerdict({ ...base, requestedAmount: 102001, proposedEmi: 10000 })).toBe(VERDICTS.BORROW_LESS);
    expect(determineVerdict({ ...base, requestedAmount: 100000, proposedEmi: 10201 })).toBe(VERDICTS.BORROW_LESS);
  });

  it("treats the configured minimum safe EMI as meaningful at the exact boundary", () => {
    const verdict = determineVerdict({
      hasBlockingCoreData: false,
      hasCriticalRepaymentRisk: false,
      baselineStress: { seriousFailure: false },
      requestedLoanStress: { passed: true },
      safeEmi: rules.assessment.minimumSafeEmi,
      borrowerSafeAmount: 50000,
      requestedAmount: 50000,
      proposedEmi: rules.assessment.minimumSafeEmi,
      rules
    });

    expect(verdict).toBe(VERDICTS.BORROW);
  });

  it("does not label an unsafe tenure as recommended", () => {
    const choice = chooseRecommendedTenure({
      principal: 1000000,
      safeEmi: 100,
      interestRate: 24,
      tenureOptions: [12, 24, 84]
    });

    expect(choice.recommendedTenureMonths).toBeNull();
    expect(choice.closestTenureMonths).toBe(84);
    expect(choice.stillAboveSafeEmi).toBe(true);
  });

  it("never returns NaN or Infinity in assessment output", () => {
    for (const persona of personas) {
      expectNoNonFiniteNumbers(assess(persona.answers));
    }
  });

  it("includes explanation, negotiation, risk, missing information, and confidence collections", () => {
    const assessment = assess(personaAnswers("priya"));

    expect(Array.isArray(assessment.risks)).toBe(true);
    expect(Array.isArray(assessment.missingInformation)).toBe(true);
    expect(Array.isArray(assessment.confidenceReasons)).toBe(true);
    expect(assessment.explanations.length).toBeGreaterThan(0);
    expect(assessment.explanations[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      title: expect.any(String),
      message: expect.any(String),
      inputs: expect.any(Object),
      rules: expect.any(Object),
      improvement: expect.any(String)
    }));
    expect(assessment.negotiationPoints.length).toBeGreaterThan(0);
  });
});
