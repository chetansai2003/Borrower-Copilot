import { fail, isMissing, isUnknown, ok, requireFiniteNumber, warning } from "./result.js";

export function calculateUsableIncome(answers, rules) {
  const incomeResult = requireFiniteNumber(
    answers.monthlyIncome,
    "MONTHLY_INCOME_REQUIRED",
    "Monthly income is required for affordability calculations.",
    "monthlyIncome",
    { allowZero: false }
  );
  if (!incomeResult.ok) return incomeResult;

  const warnings = [];
  const incomeType = isMissing(answers.incomeType) || isUnknown(answers.incomeType) ? "unknown" : answers.incomeType;
  const incomeStability = isMissing(answers.incomeStability) || isUnknown(answers.incomeStability) ? "unknown" : answers.incomeStability;

  if (incomeType === "unknown") {
    warnings.push(warning("INCOME_TYPE_UNKNOWN", "Income type was not provided.", "incomeType"));
  }

  if (incomeStability === "unknown") {
    warnings.push(warning("INCOME_STABILITY_UNKNOWN", "Income stability was not provided.", "incomeStability"));
  }

  const incomeTypeHaircut = rules.income.typeHaircuts[incomeType] ?? rules.income.typeHaircuts.unknown;
  const incomeStabilityHaircut = rules.income.stabilityHaircuts[incomeStability] ?? rules.income.stabilityHaircuts.unknown;
  const appliedHaircut = Math.max(incomeTypeHaircut, incomeStabilityHaircut);
  const adjustedIncome = answers.monthlyIncome * (1 - appliedHaircut);
  let usableIncome = adjustedIncome;
  let method = appliedHaircut === 0 ? "reported_income" : "largest_relevant_haircut";

  if (incomeStability === "irregular" && !isMissing(answers.lowMonthIncome) && !isUnknown(answers.lowMonthIncome)) {
    if (typeof answers.lowMonthIncome !== "number" || !Number.isFinite(answers.lowMonthIncome) || answers.lowMonthIncome < 0) {
      return fail("LOW_MONTH_INCOME_INVALID", "Low-month income must be zero or greater.", "lowMonthIncome");
    }

    usableIncome = Math.min(adjustedIncome, answers.lowMonthIncome);
    method = "irregular_income_haircut";
  }

  return ok(usableIncome, {
    reportedIncome: answers.monthlyIncome,
    incomeType,
    incomeStability,
    incomeTypeHaircut,
    incomeStabilityHaircut,
    appliedHaircut,
    adjustedIncome,
    lowMonthIncome: answers.lowMonthIncome ?? null,
    method,
    warnings
  });
}
