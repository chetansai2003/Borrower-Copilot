import { describe, expect, it } from "vitest";
import { rules } from "../data/rules.js";
import {
  calculateApr,
  calculateAprBand,
  calculateBorrowingLimits,
  calculateDebtBurdenRatio,
  calculateEmergencyBufferImpact,
  calculateEmi,
  calculateFinancialSnapshot,
  calculateInterestRateBand,
  calculateMaxPrincipal,
  calculateMonthlySurplus,
  calculateProcessingFees,
  calculateRepaymentSummary,
  calculateSafeEmi,
  calculateStressCase,
  calculateUsableIncome,
  compareTenures
} from "../engine/index.js";

const baseAnswers = {
  borrowingPurpose: "home_repair",
  requestedAmount: 500000,
  preferredTenureMonths: 36,
  incomeType: "salaried",
  monthlyIncome: 100000,
  incomeStability: "stable",
  essentialExpenses: 40000,
  existingEmis: 10000,
  emergencySavings: 150000,
  recentRepaymentDifficulty: "none"
};

describe("loan math", () => {
  it("calculates EMI with normal rates", () => {
    const result = calculateEmi({ principal: 500000, annualRatePercent: 12, tenureMonths: 36 });

    expect(result.ok).toBe(true);
    expect(result.value).toBeCloseTo(16607.15, 2);
  });

  it("handles zero-interest EMI", () => {
    const result = calculateEmi({ principal: 120000, annualRatePercent: 0, tenureMonths: 12 });

    expect(result.value).toBeCloseTo(10000, 2);
    expect(result.details.method).toBe("zero_interest");
  });

  it("keeps EMI and max-principal inverse calculations consistent", () => {
    const input = { principal: 750000, annualRatePercent: 14, tenureMonths: 48 };
    const emiResult = calculateEmi(input);
    const principalResult = calculateMaxPrincipal({
      emi: emiResult.value,
      annualRatePercent: input.annualRatePercent,
      tenureMonths: input.tenureMonths
    });

    expect(principalResult.value).toBeCloseTo(input.principal, 2);
  });

  it("returns structured errors for invalid inputs", () => {
    expect(calculateEmi({ principal: -1, annualRatePercent: 12, tenureMonths: 36 }).error.code).toBe("PRINCIPAL_INVALID");
    expect(calculateMaxPrincipal({ emi: 1000, annualRatePercent: 12, tenureMonths: 0 }).error.code).toBe("TENURE_INVALID");
  });
});

describe("income and affordability", () => {
  it("uses full stable salaried income", () => {
    const result = calculateUsableIncome(baseAnswers, rules);

    expect(result.value).toBe(100000);
    expect(result.details.appliedHaircut).toBe(0);
  });

  it("uses the largest relevant haircut without stacking reductions", () => {
    const result = calculateUsableIncome({
      ...baseAnswers,
      incomeType: "self_employed",
      incomeStability: "irregular",
      monthlyIncome: 50000
    }, rules);

    expect(result.value).toBe(37500);
    expect(result.details.appliedHaircut).toBe(0.25);
  });

  it("uses low-month income for irregular profiles when lower", () => {
    const result = calculateUsableIncome({
      ...baseAnswers,
      incomeStability: "irregular",
      monthlyIncome: 50000,
      lowMonthIncome: 30000
    }, rules);

    expect(result.value).toBe(30000);
    expect(result.details.method).toBe("irregular_income_haircut");
  });

  it("never treats null or unknown income as zero", () => {
    expect(calculateUsableIncome({ ...baseAnswers, monthlyIncome: null }, rules).error.code).toBe("MONTHLY_INCOME_REQUIRED");
    expect(calculateUsableIncome({ ...baseAnswers, monthlyIncome: "unknown" }, rules).error.code).toBe("MONTHLY_INCOME_REQUIRED");
  });

  it("calculates monthly surplus", () => {
    const result = calculateMonthlySurplus({ usableIncome: 50000, essentialExpenses: 25000, existingEmis: 0 });

    expect(result.value).toBe(25000);
  });

  it("calculates debt burden ratio", () => {
    const result = calculateDebtBurdenRatio({ usableIncome: 50000, existingEmis: 5000, proposedEmi: 10000 });

    expect(result.value).toBeCloseTo(0.3, 5);
  });

  it("uses the defined safe EMI formula", () => {
    const result = calculateSafeEmi({ usableIncome: 50000, essentialExpenses: 25000, existingEmis: 5000, rules });

    expect(result.value).toBeCloseTo(12500, 2);
    expect(result.details.debtCapacity).toBeCloseTo(12500, 2);
    expect(result.details.surplusCapacity).toBeCloseTo(15000, 2);
  });

  it("returns zero safe EMI when borrowing is unaffordable", () => {
    const result = calculateSafeEmi({ usableIncome: 30000, essentialExpenses: 28000, existingEmis: 10000, rules });

    expect(result.value).toBe(0);
  });
});

describe("limits, pricing, fees, and APR", () => {
  it("calculates borrower-safe and lender-likely limits using the maximum rate band", () => {
    const rateBand = { minimum: 12, maximum: 24 };
    const result = calculateBorrowingLimits({
      usableIncome: 100000,
      existingEmis: 10000,
      safeEmi: 25000,
      preferredTenureMonths: 36,
      rateBand,
      rules
    });

    expect(result.value.rateUsed).toBe(24);
    expect(result.value.borrowerSafeAmount).toBeGreaterThan(0);
    expect(result.value.lenderLikelyAmount).toBeGreaterThan(result.value.borrowerSafeAmount);
  });

  it("keeps pricing transparent, clamped, and labelled as estimate", () => {
    const result = calculateInterestRateBand({
      ...baseAnswers,
      incomeType: "informal",
      incomeStability: "irregular",
      recentRepaymentDifficulty: "bounce",
      borrowingPurpose: "medical"
    }, rules);

    expect(result.value.minimum).toBeGreaterThanOrEqual(rules.pricing.absoluteMinimumRate);
    expect(result.value.maximum).toBeLessThanOrEqual(rules.pricing.absoluteMaximumRate);
    expect(result.details.label).toBe("estimate_not_lender_offer");
  });

  it("returns processing fee, mandatory fees, total upfront fees, and net disbursal", () => {
    const result = calculateProcessingFees({ principal: 500000, rules });

    expect(result.value.processingFee).toBe(10000);
    expect(result.value.otherMandatoryFees).toBe(0);
    expect(result.value.totalUpfrontFees).toBe(10000);
    expect(result.value.netDisbursal).toBe(490000);
  });

  it("calculates APR above nominal effective rate when upfront fees exist", () => {
    const emi = calculateEmi({ principal: 500000, annualRatePercent: 12, tenureMonths: 36 }).value;
    const apr = calculateApr({ principal: 500000, emi, tenureMonths: 36, upfrontFees: 10000, rules });

    expect(apr.ok).toBe(true);
    expect(apr.value).toBeGreaterThan(12);
  });

  it("handles zero-fee zero-interest APR", () => {
    const apr = calculateApr({ principal: 120000, emi: 10000, tenureMonths: 12, upfrontFees: 0, rules });

    expect(apr.value).toBe(0);
  });

  it("returns APR solver errors for impossible cash flows", () => {
    const apr = calculateApr({ principal: 100000, emi: 1, tenureMonths: 12, upfrontFees: 0, rules });

    expect(apr.ok).toBe(false);
    expect(apr.error.code).toBe("APR_CASH_FLOW_INVALID");
  });

  it("returns an APR band from the rate band", () => {
    const result = calculateAprBand({ principal: 500000, tenureMonths: 36, rateBand: { minimum: 12, maximum: 24 }, rules });

    expect(result.value.minimum).toBeLessThan(result.value.maximum);
    expect(result.details.fees.totalUpfrontFees).toBe(10000);
  });

  it("returns repayment summary and tenure comparison", () => {
    const summary = calculateRepaymentSummary({ principal: 500000, annualRatePercent: 24, tenureMonths: 36, rules });
    const comparison = compareTenures({ principal: 500000, rateBand: { minimum: 12, maximum: 24 }, tenureOptions: [12, 24], rules });

    expect(summary.value.totalRepayment).toBeCloseTo(summary.value.emi * 36, 2);
    expect(summary.value.totalInterest).toBeGreaterThan(0);
    expect(comparison.value).toHaveLength(2);
    expect(comparison.value[0]).toHaveProperty("aprPercent");
  });
});

describe("stress and emergency buffer", () => {
  it("returns stress facts for the requested loan", () => {
    const result = calculateStressCase({
      requestedAmount: 500000,
      preferredTenureMonths: 36,
      usableIncome: 50000,
      essentialExpenses: 25000,
      existingEmis: 5000,
      baseAnnualRatePercent: 18,
      rules
    });

    expect(result.value.stressedIncome).toBe(40000);
    expect(result.value.stressedRate).toBe(20);
    expect(result.value.stressedEmi).toBeGreaterThan(0);
    expect(result.value.stressedDebtRatio).toBeGreaterThan(0);
  });

  it("categorizes emergency buffer months from savings amount and monthly expenses", () => {
    expect(calculateEmergencyBufferImpact({ emergencySavings: 150000, essentialExpenses: 50000 }, rules).value.category).toBe("adequate");
    expect(calculateEmergencyBufferImpact({ emergencySavings: 75000, essentialExpenses: 50000 }, rules).value.category).toBe("limited");
    expect(calculateEmergencyBufferImpact({ emergencySavings: 10000, essentialExpenses: 50000 }, rules).value.category).toBe("low");
  });

  it("warns when emergency savings are unknown or expenses are zero", () => {
    const unknown = calculateEmergencyBufferImpact({ emergencySavings: "unknown", essentialExpenses: 50000 }, rules);
    const zeroExpenses = calculateEmergencyBufferImpact({ emergencySavings: 10000, essentialExpenses: 0 }, rules);

    expect(unknown.details.warnings[0].code).toBe("EMERGENCY_SAVINGS_UNKNOWN");
    expect(zeroExpenses.details.warnings[0].code).toBe("EMERGENCY_BUFFER_NOT_MEANINGFUL");
  });
});

describe("financial snapshot", () => {
  it("returns a complete calculation snapshot with warnings", () => {
    const result = calculateFinancialSnapshot(baseAnswers, rules);

    expect(result.ok).toBe(true);
    expect(result.value.usableIncome.value).toBe(100000);
    expect(result.value.safeEmi.value).toBeGreaterThan(0);
    expect(result.value.borrowingLimits.value.borrowerSafeAmount).toBeGreaterThan(0);
    expect(result.value.aprBand.value.minimum).toBeLessThan(result.value.aprBand.value.maximum);
    expect(result.details.warnings.some((item) => item.code === "PRICING_ESTIMATE_ONLY")).toBe(true);
  });

  it("separates blocking errors from warnings", () => {
    const missingIncome = calculateFinancialSnapshot({ ...baseAnswers, monthlyIncome: null }, rules);
    const unknownEmergency = calculateFinancialSnapshot({ ...baseAnswers, emergencySavings: "unknown" }, rules);

    expect(missingIncome.ok).toBe(false);
    expect(missingIncome.error.code).toBe("MONTHLY_INCOME_REQUIRED");
    expect(unknownEmergency.ok).toBe(true);
    expect(unknownEmergency.details.warnings.some((item) => item.code === "EMERGENCY_SAVINGS_UNKNOWN")).toBe(true);
  });

  it("does not treat unknown required affordability values as zero", () => {
    const result = calculateFinancialSnapshot({ ...baseAnswers, existingEmis: "unknown" }, rules);

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("EXISTING_EMIS_REQUIRED");
  });
});
