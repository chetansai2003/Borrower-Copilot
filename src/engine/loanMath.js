import { ok, requireFiniteNumber } from "./result.js";

function validateRateAndTenure({ annualRatePercent, tenureMonths }) {
  const rate = requireFiniteNumber(
    annualRatePercent,
    "ANNUAL_RATE_INVALID",
    "Annual interest rate must be zero or greater.",
    "annualRatePercent"
  );
  if (!rate.ok) return rate;

  const tenure = requireFiniteNumber(
    tenureMonths,
    "TENURE_INVALID",
    "Tenure must be greater than zero months.",
    "tenureMonths",
    { allowZero: false }
  );
  if (!tenure.ok) return tenure;

  return ok({ annualRatePercent, tenureMonths });
}

export function calculateEmi({ principal, annualRatePercent, tenureMonths }) {
  const principalResult = requireFiniteNumber(
    principal,
    "PRINCIPAL_INVALID",
    "Principal must be zero or greater.",
    "principal"
  );
  if (!principalResult.ok) return principalResult;

  const rateAndTenure = validateRateAndTenure({ annualRatePercent, tenureMonths });
  if (!rateAndTenure.ok) return rateAndTenure;

  if (principal === 0) {
    return ok(0, { monthlyRate: annualRatePercent / 12 / 100, method: "zero_principal" });
  }

  if (annualRatePercent === 0) {
    return ok(principal / tenureMonths, { monthlyRate: 0, method: "zero_interest" });
  }

  const monthlyRate = annualRatePercent / 12 / 100;
  const growth = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * growth) / (growth - 1);

  return ok(emi, { monthlyRate, method: "standard_annuity" });
}

export function calculateMaxPrincipal({ emi, annualRatePercent, tenureMonths }) {
  const emiResult = requireFiniteNumber(
    emi,
    "EMI_INVALID",
    "EMI must be zero or greater.",
    "emi"
  );
  if (!emiResult.ok) return emiResult;

  const rateAndTenure = validateRateAndTenure({ annualRatePercent, tenureMonths });
  if (!rateAndTenure.ok) return rateAndTenure;

  if (emi === 0) {
    return ok(0, { monthlyRate: annualRatePercent / 12 / 100, method: "zero_emi" });
  }

  if (annualRatePercent === 0) {
    return ok(emi * tenureMonths, { monthlyRate: 0, method: "zero_interest" });
  }

  const monthlyRate = annualRatePercent / 12 / 100;
  const growth = Math.pow(1 + monthlyRate, tenureMonths);
  const principal = emi * ((growth - 1) / (monthlyRate * growth));

  return ok(principal, { monthlyRate, method: "inverse_annuity" });
}

export function calculateRepaymentSummary({ principal, annualRatePercent, tenureMonths, rules }) {
  const emiResult = calculateEmi({ principal, annualRatePercent, tenureMonths });
  if (!emiResult.ok) return emiResult;

  const totalRepayment = emiResult.value * tenureMonths;
  const totalInterest = totalRepayment - principal;

  return ok({
    principal,
    annualRatePercent,
    tenureMonths,
    emi: emiResult.value,
    totalRepayment,
    totalInterest
  }, {
    feeAssumptions: rules?.fees,
    method: emiResult.details.method
  });
}

