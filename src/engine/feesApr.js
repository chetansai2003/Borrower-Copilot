import { calculateEmi } from "./loanMath.js";
import { fail, ok, requireFiniteNumber } from "./result.js";

export function calculateProcessingFees({ principal, rules }) {
  const principalResult = requireFiniteNumber(
    principal,
    "PRINCIPAL_INVALID",
    "Principal must be zero or greater.",
    "principal"
  );
  if (!principalResult.ok) return principalResult;

  const processingFee = principal * rules.fees.processingFeeRate;
  const otherMandatoryFees = rules.fees.otherMandatoryFees;
  const totalUpfrontFees = processingFee + otherMandatoryFees;
  const netDisbursal = principal - totalUpfrontFees;

  if (netDisbursal <= 0) {
    return fail(
      "NET_DISBURSAL_INVALID",
      "Upfront fees must be lower than the loan principal.",
      "principal"
    );
  }

  return ok({ processingFee, otherMandatoryFees, totalUpfrontFees, netDisbursal });
}

function presentValueOfEmis(emi, monthlyRate, tenureMonths) {
  if (monthlyRate === 0) {
    return emi * tenureMonths;
  }

  let presentValue = 0;
  for (let month = 1; month <= tenureMonths; month += 1) {
    presentValue += emi / Math.pow(1 + monthlyRate, month);
  }
  return presentValue;
}

export function calculateApr({ principal, emi, tenureMonths, upfrontFees, rules }) {
  const principalResult = requireFiniteNumber(
    principal,
    "PRINCIPAL_INVALID",
    "Principal must be greater than zero for APR.",
    "principal",
    { allowZero: false }
  );
  if (!principalResult.ok) return principalResult;

  const emiResult = requireFiniteNumber(
    emi,
    "EMI_INVALID",
    "EMI must be greater than zero for APR.",
    "emi",
    { allowZero: false }
  );
  if (!emiResult.ok) return emiResult;

  const tenureResult = requireFiniteNumber(
    tenureMonths,
    "TENURE_INVALID",
    "Tenure must be greater than zero months.",
    "tenureMonths",
    { allowZero: false }
  );
  if (!tenureResult.ok) return tenureResult;

  const feeResult = requireFiniteNumber(
    upfrontFees,
    "UPFRONT_FEES_INVALID",
    "Upfront fees must be zero or greater.",
    "upfrontFees"
  );
  if (!feeResult.ok) return feeResult;

  const netDisbursal = principal - upfrontFees;

  if (upfrontFees === 0 && Math.abs(emi * tenureMonths - principal) < 0.000001) {
    return ok(0, { monthlyRate: 0, netDisbursal, method: "zero_fee_zero_interest" });
  }

  if (netDisbursal <= 0 || emi * tenureMonths <= netDisbursal) {
    return fail(
      "APR_CASH_FLOW_INVALID",
      "APR cannot be solved from the supplied cash flows.",
      "apr"
    );
  }

  let low = rules.apr.lowerMonthlyRate;
  let high = rules.apr.upperMonthlyRate;
  let monthlyRate = null;

  for (let iteration = 0; iteration < rules.apr.maxIterations; iteration += 1) {
    const mid = (low + high) / 2;
    const presentValue = presentValueOfEmis(emi, mid, tenureMonths);
    const difference = presentValue - netDisbursal;
    monthlyRate = mid;

    if (Math.abs(difference) <= rules.apr.tolerance) {
      break;
    }

    if (difference > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  if (monthlyRate === null || !Number.isFinite(monthlyRate)) {
    return fail("APR_SOLVER_FAILED", "APR solver could not find a valid rate.", "apr");
  }

  const annualAprPercent = (Math.pow(1 + monthlyRate, 12) - 1) * 100;
  return ok(annualAprPercent, { monthlyRate, netDisbursal, method: "binary_search" });
}

export function calculateAprBand({ principal, tenureMonths, rateBand, rules }) {
  const feesResult = calculateProcessingFees({ principal, rules });
  if (!feesResult.ok) return feesResult;

  const minEmi = calculateEmi({
    principal,
    annualRatePercent: rateBand.minimum,
    tenureMonths
  });
  if (!minEmi.ok) return minEmi;

  const maxEmi = calculateEmi({
    principal,
    annualRatePercent: rateBand.maximum,
    tenureMonths
  });
  if (!maxEmi.ok) return maxEmi;

  const minimumApr = calculateApr({
    principal,
    emi: minEmi.value,
    tenureMonths,
    upfrontFees: feesResult.value.totalUpfrontFees,
    rules
  });
  if (!minimumApr.ok) return minimumApr;

  const maximumApr = calculateApr({
    principal,
    emi: maxEmi.value,
    tenureMonths,
    upfrontFees: feesResult.value.totalUpfrontFees,
    rules
  });
  if (!maximumApr.ok) return maximumApr;

  return ok({
    minimum: minimumApr.value,
    maximum: maximumApr.value
  }, {
    fees: feesResult.value,
    label: "estimate_not_lender_offer"
  });
}

