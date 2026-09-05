import { calculateMaxPrincipal } from "./loanMath.js";
import { fail, isMissing, isUnknown, ok, requireFiniteNumber } from "./result.js";

function requireKnownNonNegative(value, code, message, field) {
  return requireFiniteNumber(value, code, message, field);
}

export function calculateMonthlySurplus({ usableIncome, essentialExpenses, existingEmis }) {
  const incomeResult = requireKnownNonNegative(
    usableIncome,
    "USABLE_INCOME_REQUIRED",
    "Usable income is required for surplus calculations.",
    "usableIncome"
  );
  if (!incomeResult.ok) return incomeResult;

  const expensesResult = requireKnownNonNegative(
    essentialExpenses,
    "ESSENTIAL_EXPENSES_REQUIRED",
    "Essential expenses are required for surplus calculations.",
    "essentialExpenses"
  );
  if (!expensesResult.ok) return expensesResult;

  const emiResult = requireKnownNonNegative(
    existingEmis,
    "EXISTING_EMIS_REQUIRED",
    "Existing EMI amount is required for surplus calculations.",
    "existingEmis"
  );
  if (!emiResult.ok) return emiResult;

  return ok(usableIncome - essentialExpenses - existingEmis, {
    usableIncome,
    essentialExpenses,
    existingEmis
  });
}

export function calculateDebtBurdenRatio({ existingEmis, proposedEmi, usableIncome }) {
  const incomeResult = requireFiniteNumber(
    usableIncome,
    "USABLE_INCOME_REQUIRED",
    "Usable income is required for debt-burden calculations.",
    "usableIncome",
    { allowZero: false }
  );
  if (!incomeResult.ok) return incomeResult;

  const existingResult = requireKnownNonNegative(
    existingEmis,
    "EXISTING_EMIS_REQUIRED",
    "Existing EMI amount is required for debt-burden calculations.",
    "existingEmis"
  );
  if (!existingResult.ok) return existingResult;

  const proposedResult = requireKnownNonNegative(
    proposedEmi,
    "PROPOSED_EMI_REQUIRED",
    "Proposed EMI is required for debt-burden calculations.",
    "proposedEmi"
  );
  if (!proposedResult.ok) return proposedResult;

  return ok((existingEmis + proposedEmi) / usableIncome, {
    existingEmis,
    proposedEmi,
    usableIncome
  });
}

export function calculateSafeEmi({ usableIncome, essentialExpenses, existingEmis, rules }) {
  if (isMissing(existingEmis) || isUnknown(existingEmis)) {
    return fail("EXISTING_EMIS_REQUIRED", "Existing EMI must be known for safe EMI calculations.", "existingEmis");
  }

  const surplusResult = calculateMonthlySurplus({ usableIncome, essentialExpenses, existingEmis });
  if (!surplusResult.ok) return surplusResult;

  const rawSurplus = surplusResult.value;
  const debtCapacity = usableIncome * rules.affordability.safeDebtRatio - existingEmis;
  const minimumProtectedBuffer = usableIncome * rules.affordability.minimumMonthlyBufferRate;
  const surplusCapacity = Math.min(
    rawSurplus * rules.affordability.surplusUseRate,
    rawSurplus - minimumProtectedBuffer
  );
  const safeEmi = Math.max(0, Math.min(debtCapacity, surplusCapacity));

  return ok(safeEmi, {
    rawSurplus,
    debtCapacity,
    minimumProtectedBuffer,
    surplusCapacity,
    formula: "max(0, min(debtCapacity, surplusCapacity))"
  });
}

export function calculateBorrowingLimits({ usableIncome, existingEmis, safeEmi, preferredTenureMonths, rateBand, rules }) {
  if (isMissing(existingEmis) || isUnknown(existingEmis)) {
    return fail("EXISTING_EMIS_REQUIRED", "Existing EMI must be known for borrowing-limit calculations.", "existingEmis");
  }

  const tenureResult = requireFiniteNumber(
    preferredTenureMonths,
    "TENURE_INVALID",
    "Preferred tenure must be greater than zero months.",
    "preferredTenureMonths",
    { allowZero: false }
  );
  if (!tenureResult.ok) return tenureResult;

  const borrowerMax = calculateMaxPrincipal({
    emi: safeEmi,
    annualRatePercent: rateBand.maximum,
    tenureMonths: preferredTenureMonths
  });
  if (!borrowerMax.ok) return borrowerMax;

  const lenderEmiCapacity = Math.max(0, usableIncome * rules.affordability.lenderDebtRatio - existingEmis);
  const lenderMax = calculateMaxPrincipal({
    emi: lenderEmiCapacity,
    annualRatePercent: rateBand.maximum,
    tenureMonths: preferredTenureMonths
  });
  if (!lenderMax.ok) return lenderMax;

  return ok({
    borrowerSafeAmount: borrowerMax.value,
    lenderLikelyAmount: lenderMax.value,
    safeEmi,
    lenderEmiCapacity,
    rateUsed: rateBand.maximum,
    tenureMonths: preferredTenureMonths
  });
}
