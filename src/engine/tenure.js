import { calculateApr, calculateProcessingFees } from "./feesApr.js";
import { calculateEmi } from "./loanMath.js";
import { ok } from "./result.js";

export function compareTenures({ principal, rateBand, tenureOptions, rules }) {
  const feesResult = calculateProcessingFees({ principal, rules });
  if (!feesResult.ok) return feesResult;

  const options = [];
  for (const tenureMonths of tenureOptions) {
    const emiResult = calculateEmi({
      principal,
      annualRatePercent: rateBand.maximum,
      tenureMonths
    });
    if (!emiResult.ok) return emiResult;

    const aprResult = calculateApr({
      principal,
      emi: emiResult.value,
      tenureMonths,
      upfrontFees: feesResult.value.totalUpfrontFees,
      rules
    });
    if (!aprResult.ok) return aprResult;

    const totalRepayment = emiResult.value * tenureMonths;
    options.push({
      tenureMonths,
      emi: emiResult.value,
      totalRepayment,
      totalInterest: totalRepayment - principal,
      annualRatePercent: rateBand.maximum,
      aprPercent: aprResult.value
    });
  }

  return ok(options, { rateUsed: rateBand.maximum, label: "maximum_rate_band_used" });
}
