import { isMissing, isUnknown, ok, requireFiniteNumber, warning } from "./result.js";

export function calculateEmergencyBufferImpact(answers, rules) {
  if (isMissing(answers.emergencySavings) || isUnknown(answers.emergencySavings)) {
    return ok({ category: "unknown", emergencyBufferMonths: null }, {
      warnings: [warning("EMERGENCY_SAVINGS_UNKNOWN", "Emergency savings were not provided.", "emergencySavings")]
    });
  }

  const savingsResult = requireFiniteNumber(
    answers.emergencySavings,
    "EMERGENCY_SAVINGS_INVALID",
    "Emergency savings must be zero or greater.",
    "emergencySavings"
  );
  if (!savingsResult.ok) return savingsResult;

  const expensesResult = requireFiniteNumber(
    answers.essentialExpenses,
    "ESSENTIAL_EXPENSES_REQUIRED",
    "Essential expenses are required for emergency-buffer calculations.",
    "essentialExpenses"
  );
  if (!expensesResult.ok) return expensesResult;

  if (answers.essentialExpenses === 0) {
    return ok({ category: "unknown", emergencyBufferMonths: null }, {
      warnings: [warning("EMERGENCY_BUFFER_NOT_MEANINGFUL", "Coverage months cannot be calculated when essential expenses are zero.", "essentialExpenses")]
    });
  }

  const emergencyBufferMonths = answers.emergencySavings / answers.essentialExpenses;
  let category = "low";

  if (emergencyBufferMonths >= rules.emergencyBuffer.adequateMonthsAtLeast) {
    category = "adequate";
  } else if (emergencyBufferMonths >= rules.emergencyBuffer.lowMonthsBelow) {
    category = "limited";
  }

  return ok({ category, emergencyBufferMonths }, { thresholds: rules.emergencyBuffer });
}
