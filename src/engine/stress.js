import { calculateEmi } from "./loanMath.js";
import { ok, requireFiniteNumber } from "./result.js";

export function calculateStressCase({
  requestedAmount,
  preferredTenureMonths,
  usableIncome,
  essentialExpenses,
  existingEmis,
  baseAnnualRatePercent,
  rules
}) {
  const amountResult = requireFiniteNumber(
    requestedAmount,
    "REQUESTED_AMOUNT_REQUIRED",
    "Requested amount is required for stress calculations.",
    "requestedAmount",
    { allowZero: false }
  );
  if (!amountResult.ok) return amountResult;

  const stressedIncome = usableIncome * (1 - rules.stress.incomeReductionRate);
  const stressedRate = baseAnnualRatePercent + rules.stress.interestIncreasePoints;
  const stressedEmiResult = calculateEmi({
    principal: requestedAmount,
    annualRatePercent: stressedRate,
    tenureMonths: preferredTenureMonths
  });
  if (!stressedEmiResult.ok) return stressedEmiResult;

  const stressedEmi = stressedEmiResult.value;
  const stressedSurplus = stressedIncome - essentialExpenses - existingEmis - stressedEmi;
  const stressedDebtRatio = stressedIncome > 0 ? (existingEmis + stressedEmi) / stressedIncome : Infinity;

  return ok({
    affordable: stressedSurplus >= 0 && stressedDebtRatio <= rules.affordability.safeDebtRatio,
    stressedIncome,
    stressedRate,
    stressedEmi,
    stressedSurplus,
    stressedDebtRatio
  });
}
