import { ok, warning } from "./result.js";

function addModifier(total, modifier) {
  return {
    minimum: total.minimum + (modifier?.minimum ?? 0),
    maximum: total.maximum + (modifier?.maximum ?? 0)
  };
}

function businessAgeModifier(businessAgeMonths, rules) {
  if (businessAgeMonths === "unknown" || businessAgeMonths === null || businessAgeMonths === undefined) {
    return rules.pricing.modifiers.businessAgeMonths.unknown;
  }

  if (businessAgeMonths < 12) return rules.pricing.modifiers.businessAgeMonths.newerThan12;
  if (businessAgeMonths < 36) return rules.pricing.modifiers.businessAgeMonths.twelveToThirtyFive;
  return rules.pricing.modifiers.businessAgeMonths.thirtySixOrMore;
}

export function calculateInterestRateBand(answers, rules) {
  let band = {
    minimum: rules.pricing.baseMinimumRate,
    maximum: rules.pricing.baseMaximumRate
  };
  const modifiers = [];

  const incomeStabilityModifier = rules.pricing.modifiers.incomeStability[answers.incomeStability ?? "unknown"];
  band = addModifier(band, incomeStabilityModifier);
  modifiers.push({ source: "incomeStability", value: answers.incomeStability ?? "unknown", modifier: incomeStabilityModifier });

  const incomeTypeModifier = rules.pricing.modifiers.incomeType[answers.incomeType ?? "unknown"];
  band = addModifier(band, incomeTypeModifier);
  modifiers.push({ source: "incomeType", value: answers.incomeType ?? "unknown", modifier: incomeTypeModifier });

  const repaymentModifier = rules.pricing.modifiers.repaymentDifficulty[answers.recentRepaymentDifficulty ?? "unknown"];
  band = addModifier(band, repaymentModifier);
  modifiers.push({ source: "recentRepaymentDifficulty", value: answers.recentRepaymentDifficulty ?? "unknown", modifier: repaymentModifier });

  const purposeModifier = rules.pricing.modifiers.purpose[answers.borrowingPurpose] ?? { minimum: 0, maximum: 0 };
  band = addModifier(band, purposeModifier);
  modifiers.push({ source: "borrowingPurpose", value: answers.borrowingPurpose ?? "unknown", modifier: purposeModifier });

  if (answers.incomeType === "self_employed") {
    const modifier = businessAgeModifier(answers.businessAgeMonths, rules);
    band = addModifier(band, modifier);
    modifiers.push({ source: "businessAgeMonths", value: answers.businessAgeMonths ?? "unknown", modifier });
  }

  const clampedBand = {
    minimum: Math.max(rules.pricing.absoluteMinimumRate, band.minimum),
    maximum: Math.min(rules.pricing.absoluteMaximumRate, band.maximum)
  };

  return ok(clampedBand, {
    unclampedBand: band,
    modifiers,
    label: "estimate_not_lender_offer",
    warnings: [warning(rules.pricing.estimateWarning.code, rules.pricing.estimateWarning.message, rules.pricing.estimateWarning.field)]
  });
}
