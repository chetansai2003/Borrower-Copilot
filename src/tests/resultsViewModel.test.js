import { describe, expect, it } from "vitest";
import { DECISION_STATUSES, VERDICTS } from "../data/constants.js";
import { personas } from "../data/personas.js";
import { runAssessment } from "../engine/assessmentEngine.js";
import { createResultsViewModel } from "../utils/createResultsViewModel.js";
import { formatCurrency, formatPercentBand, formatTenure } from "../utils/formatResults.js";

describe("result formatters", () => {
  it("formats currency safely", () => {
    expect(formatCurrency(50000)).toMatch(/50,000/);
    expect(formatCurrency(null)).toBe("Not available");
    expect(formatCurrency(Number.NaN)).toBe("Not available");
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe("Not available");
  });

  it("formats percent bands and tenure safely", () => {
    expect(formatPercentBand({ minimum: 14.2, maximum: 18.8 })).toBe("14.2% to 18.8%");
    expect(formatPercentBand({ minimum: Number.NaN, maximum: 18 })).toBe("Not available");
    expect(formatTenure(48)).toBe("4 years");
    expect(formatTenure(null)).toBe("Not available");
  });
});

describe("createResultsViewModel", () => {
  it("uses distinct insufficient-data verdict copy", () => {
    const viewModel = createResultsViewModel({
      verdict: VERDICTS.DO_NOT_BORROW,
      decisionStatus: DECISION_STATUSES.INSUFFICIENT_DATA,
      recommendedAmount: null
    });

    expect(viewModel.verdict.title).toBe("We cannot make a safe recommendation yet");
    expect(viewModel.verdict.message).toMatch(/essential information is missing/i);
  });

  it("does not render a zero amount for null recommendations", () => {
    const viewModel = createResultsViewModel({
      verdict: VERDICTS.DO_NOT_BORROW,
      decisionStatus: DECISION_STATUSES.COMPLETE,
      recommendedAmount: null
    });

    expect(viewModel.recommendedAmount).toBe("No borrowing amount is currently recommended.");
  });

  it("adapts assessment fee and tenure data without importing rules into UI", () => {
    const assessment = runAssessment(personas.find((persona) => persona.id === "priya").answers).value;
    const viewModel = createResultsViewModel(assessment);

    expect(assessment.feeSummary).toEqual(expect.objectContaining({
      processingFeeRate: expect.any(Number),
      processingFeeAmount: expect.any(Number),
      totalUpfrontFees: expect.any(Number),
      netDisbursal: expect.any(Number)
    }));
    expect(assessment.tenureComparison[0]).toEqual(expect.objectContaining({
      tenureMonths: expect.any(Number),
      emi: expect.any(Number),
      totalInterest: expect.any(Number),
      withinSafeEmi: expect.any(Boolean)
    }));
    expect(viewModel.processingFeeRate).toMatch(/%/);
  });
});
