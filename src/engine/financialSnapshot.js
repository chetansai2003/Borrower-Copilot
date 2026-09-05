import { rules as defaultRules } from "../data/rules.js";
import { calculateSafeEmi, calculateBorrowingLimits, calculateMonthlySurplus } from "./affordability.js";
import { calculateAprBand, calculateProcessingFees } from "./feesApr.js";
import { calculateUsableIncome } from "./income.js";
import { calculateEmi, calculateRepaymentSummary } from "./loanMath.js";
import { calculateInterestRateBand } from "./pricing.js";
import { calculateEmergencyBufferImpact } from "./emergencyBuffer.js";
import { calculateStressCase } from "./stress.js";
import { compareTenures } from "./tenure.js";
import { fail, isMissing, isUnknown, ok, warning } from "./result.js";

function requireKnown(value, code, message, field) {
  if (isMissing(value) || isUnknown(value)) {
    return fail(code, message, field);
  }
  return ok(value);
}

function collectWarnings(...results) {
  return results.flatMap((result) => result.details?.warnings ?? []);
}

export function calculateFinancialSnapshot(activeAnswers, rules = defaultRules) {
  const requestedAmount = requireKnown(
    activeAnswers.requestedAmount,
    "REQUESTED_AMOUNT_REQUIRED",
    "Requested amount is required for borrowing calculations.",
    "requestedAmount"
  );
  if (!requestedAmount.ok) return requestedAmount;

  const preferredTenureMonths = requireKnown(
    activeAnswers.preferredTenureMonths,
    "TENURE_INVALID",
    "Preferred tenure is required for borrowing calculations.",
    "preferredTenureMonths"
  );
  if (!preferredTenureMonths.ok) return preferredTenureMonths;

  const essentialExpenses = requireKnown(
    activeAnswers.essentialExpenses,
    "ESSENTIAL_EXPENSES_REQUIRED",
    "Essential expenses are required for affordability calculations.",
    "essentialExpenses"
  );
  if (!essentialExpenses.ok) return essentialExpenses;

  const existingEmis = requireKnown(
    activeAnswers.existingEmis,
    "EXISTING_EMIS_REQUIRED",
    "Existing EMI must be known for affordability calculations.",
    "existingEmis"
  );
  if (!existingEmis.ok) return existingEmis;

  const usableIncome = calculateUsableIncome(activeAnswers, rules);
  if (!usableIncome.ok) return usableIncome;

  const rateBand = calculateInterestRateBand(activeAnswers, rules);
  if (!rateBand.ok) return rateBand;

  const monthlySurplus = calculateMonthlySurplus({
    usableIncome: usableIncome.value,
    essentialExpenses: activeAnswers.essentialExpenses,
    existingEmis: activeAnswers.existingEmis
  });
  if (!monthlySurplus.ok) return monthlySurplus;

  const safeEmi = calculateSafeEmi({
    usableIncome: usableIncome.value,
    essentialExpenses: activeAnswers.essentialExpenses,
    existingEmis: activeAnswers.existingEmis,
    rules
  });
  if (!safeEmi.ok) return safeEmi;

  const borrowingLimits = calculateBorrowingLimits({
    usableIncome: usableIncome.value,
    existingEmis: activeAnswers.existingEmis,
    safeEmi: safeEmi.value,
    preferredTenureMonths: activeAnswers.preferredTenureMonths,
    rateBand: rateBand.value,
    rules
  });
  if (!borrowingLimits.ok) return borrowingLimits;

  const fees = calculateProcessingFees({ principal: activeAnswers.requestedAmount, rules });
  if (!fees.ok) return fees;

  const aprBand = calculateAprBand({
    principal: activeAnswers.requestedAmount,
    tenureMonths: activeAnswers.preferredTenureMonths,
    rateBand: rateBand.value,
    rules
  });
  if (!aprBand.ok) return aprBand;

  const tenureComparison = compareTenures({
    principal: activeAnswers.requestedAmount,
    rateBand: rateBand.value,
    tenureOptions: rules.tenureOptions,
    rules
  });
  if (!tenureComparison.ok) return tenureComparison;

  const proposedEmi = calculateEmi({
    principal: activeAnswers.requestedAmount,
    annualRatePercent: rateBand.value.maximum,
    tenureMonths: activeAnswers.preferredTenureMonths
  });
  if (!proposedEmi.ok) return proposedEmi;

  const repaymentSummary = calculateRepaymentSummary({
    principal: activeAnswers.requestedAmount,
    annualRatePercent: rateBand.value.maximum,
    tenureMonths: activeAnswers.preferredTenureMonths,
    rules
  });
  if (!repaymentSummary.ok) return repaymentSummary;

  const stressCase = calculateStressCase({
    requestedAmount: activeAnswers.requestedAmount,
    preferredTenureMonths: activeAnswers.preferredTenureMonths,
    usableIncome: usableIncome.value,
    essentialExpenses: activeAnswers.essentialExpenses,
    existingEmis: activeAnswers.existingEmis,
    baseAnnualRatePercent: rateBand.value.maximum,
    rules
  });
  if (!stressCase.ok) return stressCase;

  const emergencyBuffer = calculateEmergencyBufferImpact(activeAnswers, rules);
  if (!emergencyBuffer.ok) return emergencyBuffer;

  const optionalWarnings = [];
  if (isUnknown(activeAnswers.outstandingDebtAmount)) {
    optionalWarnings.push(warning("OUTSTANDING_DEBT_UNKNOWN", "Outstanding debt amount was not provided.", "outstandingDebtAmount"));
  }
  if (activeAnswers.incomeType === "self_employed" && isUnknown(activeAnswers.businessAgeMonths)) {
    optionalWarnings.push(warning("BUSINESS_AGE_UNKNOWN", "Business age was not provided.", "businessAgeMonths"));
  }

  return ok({
    usableIncome,
    monthlySurplus,
    safeEmi,
    borrowingLimits,
    rateBand,
    fees,
    aprBand,
    proposedEmi,
    repaymentSummary,
    tenureComparison: tenureComparison.value,
    stressCase,
    emergencyBuffer
  }, {
    warnings: [
      ...collectWarnings(usableIncome, rateBand, emergencyBuffer),
      ...optionalWarnings
    ]
  });
}
