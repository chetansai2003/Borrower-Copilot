import { rules as defaultRules } from "../data/rules.js";
import {
  CONFIDENCE_LEVELS,
  CONFIDENCE_PENALTIES,
  DECISION_STATUSES,
  REPAYMENT_DIFFICULTY_TYPES,
  RISK_SEVERITIES,
  VERDICTS
} from "../data/constants.js";
import { calculateFinancialSnapshot } from "./financialSnapshot.js";
import { calculateEmi } from "./loanMath.js";
import { fail, isMissing, isUnknown } from "./result.js";

const CORE_FIELDS = Object.freeze([
  "requestedAmount",
  "preferredTenureMonths",
  "monthlyIncome",
  "essentialExpenses",
  "existingEmis"
]);

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isMissingOrUnknown(value) {
  return isMissing(value) || isUnknown(value);
}

function createMissingInformation({ code, message, field, severity = "critical" }) {
  return { code, message, field, severity };
}

function missingCoreInfo(answers) {
  const messages = {
    requestedAmount: "Requested amount is required to assess borrowing safely.",
    preferredTenureMonths: "Preferred tenure is required to assess EMI safely.",
    monthlyIncome: "Monthly income is required for affordability calculations.",
    essentialExpenses: "Essential expenses are required to protect monthly living costs.",
    existingEmis: "Existing EMI amount is required to understand current debt burden."
  };

  return CORE_FIELDS
    .filter((field) => isMissingOrUnknown(answers[field]))
    .map((field) => createMissingInformation({
      code: `${field.toUpperCase()}_MISSING`,
      message: messages[field],
      field
    }));
}

function emptyStress() {
  return {
    passed: false,
    seriousFailure: false,
    stressedIncome: null,
    stressedEmi: null,
    stressedSurplus: null,
    stressedDebtRatio: null
  };
}

function createInsufficientDataAssessment(answers, missingInformation, rules) {
  return {
    verdict: VERDICTS.DO_NOT_BORROW,
    decisionStatus: DECISION_STATUSES.INSUFFICIENT_DATA,
    primaryReasonCode: "CORE_DATA_MISSING",
    summary: "We cannot safely recommend borrowing because essential affordability information is missing.",
    requestedAmount: isFiniteNumber(answers.requestedAmount) ? answers.requestedAmount : null,
    recommendedAmount: null,
    borrowerSafeAmount: null,
    lenderLikelyAmount: null,
    safeEmi: null,
    proposedEmi: null,
    recommendedTenureMonths: null,
    closestTenureMonths: null,
    stillAboveSafeEmi: false,
    interestBand: null,
    aprBand: null,
    baselineStress: emptyStress(),
    requestedLoanStress: emptyStress(),
    risks: [],
    missingInformation,
    confidence: CONFIDENCE_LEVELS.LOW,
    confidenceReasons: [
      {
        code: "CORE_DATA_MISSING",
        message: "Essential affordability information is missing."
      }
    ],
    explanations: [
      {
        id: "insufficient-data",
        title: "More information is needed",
        message: "The recommendation is cautious because core affordability information is missing.",
        inputs: Object.fromEntries(CORE_FIELDS.map((field) => [field, answers[field] ?? null])),
        rules: { minimumRequiredFields: CORE_FIELDS, decisionStatus: rules.assessment ? DECISION_STATUSES.INSUFFICIENT_DATA : null },
        improvement: "Provide the missing affordability answers to calculate a complete recommendation."
      }
    ],
    negotiationPoints: []
  };
}

function validateRules(rules) {
  const requiredNumbers = [
    ["rules.assessment.minimumSafeEmi", rules.assessment?.minimumSafeEmi],
    ["rules.assessment.minimumBorrowerSafeAmount", rules.assessment?.minimumBorrowerSafeAmount],
    ["rules.assessment.requestedAmountToleranceRate", rules.assessment?.requestedAmountToleranceRate],
    ["rules.assessment.seriousStressDebtRatio", rules.assessment?.seriousStressDebtRatio],
    ["rules.assessment.minimumStressSurplus", rules.assessment?.minimumStressSurplus]
  ];

  const invalid = requiredNumbers.find(([, value]) => !Number.isFinite(value));
  if (invalid) {
    return {
      ok: false,
      error: {
        code: "INVALID_RULE_CONFIGURATION",
        message: `${invalid[0]} must be a finite number.`,
        field: null
      }
    };
  }

  return { ok: true };
}

export function detectRisks(answers) {
  const risks = [];
  const type = answers.recentRepaymentDifficulty;
  const recency = answers.repaymentDifficultyRecency ?? null;

  if (type === REPAYMENT_DIFFICULTY_TYPES.COLLECTION) {
    risks.push({
      code: "COLLECTION_PRESSURE_REPORTED",
      severity: RISK_SEVERITIES.CRITICAL,
      title: "Collection pressure reported",
      message: "Collection calls or settlement pressure were reported.",
      evidence: { type, recency }
    });
  }

  if (type === REPAYMENT_DIFFICULTY_TYPES.BOUNCE && recency === "last_30_days") {
    risks.push({
      code: "RECENT_PAYMENT_BOUNCE",
      severity: RISK_SEVERITIES.CRITICAL,
      title: "Recent repayment difficulty",
      message: "A repayment bounce was reported within the last 30 days.",
      evidence: { type, recency }
    });
  } else if (type === REPAYMENT_DIFFICULTY_TYPES.BOUNCE) {
    risks.push({
      code: "PAYMENT_BOUNCE_REPORTED",
      severity: RISK_SEVERITIES.WARNING,
      title: "Repayment difficulty reported",
      message: "A repayment bounce was reported, but it was not marked as within the last 30 days.",
      evidence: { type, recency }
    });
  }

  if (type === REPAYMENT_DIFFICULTY_TYPES.LATE_PAYMENT) {
    risks.push({
      code: "LATE_PAYMENT_REPORTED",
      severity: RISK_SEVERITIES.WARNING,
      title: "Late payment reported",
      message: "A late or missed payment was reported.",
      evidence: { type, recency }
    });
  }

  return risks;
}

export function hasCriticalRepaymentRisk(risks) {
  return risks.some((risk) => risk.severity === RISK_SEVERITIES.CRITICAL);
}

export function calculateBaselineStress({ usableIncome, essentialExpenses, existingEmis, rules }) {
  const stressedIncome = usableIncome * (1 - rules.stress.incomeReductionRate);
  const stressedSurplus = stressedIncome - essentialExpenses - existingEmis;
  const stressedDebtRatio = stressedIncome > 0 ? existingEmis / stressedIncome : null;
  const seriousFailure =
    stressedSurplus < rules.assessment.minimumStressSurplus ||
    stressedDebtRatio === null ||
    stressedDebtRatio > rules.assessment.seriousStressDebtRatio;

  return {
    passed: !seriousFailure,
    seriousFailure,
    stressedIncome,
    stressedEmi: 0,
    stressedSurplus,
    stressedDebtRatio
  };
}

export function normalizeRequestedLoanStress(stressCase, rules) {
  const stress = stressCase.value;
  const seriousFailure =
    stress.stressedSurplus < rules.assessment.minimumStressSurplus ||
    stress.stressedDebtRatio > rules.assessment.seriousStressDebtRatio;

  return {
    passed: stress.affordable,
    seriousFailure,
    stressedIncome: stress.stressedIncome,
    stressedRate: stress.stressedRate,
    stressedEmi: stress.stressedEmi,
    stressedSurplus: stress.stressedSurplus,
    stressedDebtRatio: stress.stressedDebtRatio
  };
}

export function determineVerdict({
  hasBlockingCoreData,
  hasCriticalRepaymentRisk: hasCriticalRisk,
  baselineStress,
  requestedLoanStress,
  safeEmi,
  borrowerSafeAmount,
  requestedAmount,
  proposedEmi,
  rules
}) {
  if (hasBlockingCoreData) return VERDICTS.DO_NOT_BORROW;
  if (hasCriticalRisk) return VERDICTS.DO_NOT_BORROW;

  if (
    safeEmi < rules.assessment.minimumSafeEmi ||
    borrowerSafeAmount < rules.assessment.minimumBorrowerSafeAmount
  ) {
    return VERDICTS.DO_NOT_BORROW;
  }

  if (baselineStress.seriousFailure) return VERDICTS.DO_NOT_BORROW;

  const amountLimit = borrowerSafeAmount * (1 + rules.assessment.requestedAmountToleranceRate);
  const emiLimit = safeEmi * (1 + rules.assessment.requestedAmountToleranceRate);

  if (requestedAmount > amountLimit || proposedEmi > emiLimit || !requestedLoanStress.passed) {
    return VERDICTS.BORROW_LESS;
  }

  return VERDICTS.BORROW;
}

export function calculateRecommendedAmount({ verdict, requestedAmount, borrowerSafeAmount }) {
  if (verdict === VERDICTS.BORROW) return requestedAmount;
  if (verdict === VERDICTS.BORROW_LESS) return Math.min(requestedAmount, borrowerSafeAmount);
  return null;
}

export function chooseRecommendedTenure({ principal, safeEmi, interestRate, tenureOptions }) {
  if (principal === null) {
    return { recommendedTenureMonths: null, closestTenureMonths: null, stillAboveSafeEmi: false };
  }

  let closest = null;
  for (const tenureMonths of tenureOptions) {
    const emiResult = calculateEmi({ principal, annualRatePercent: interestRate, tenureMonths });
    if (!emiResult.ok) return emiResult;

    closest = { tenureMonths, emi: emiResult.value };
    if (emiResult.value <= safeEmi) {
      return { recommendedTenureMonths: tenureMonths, closestTenureMonths: null, stillAboveSafeEmi: false };
    }
  }

  return {
    recommendedTenureMonths: null,
    closestTenureMonths: closest?.tenureMonths ?? null,
    stillAboveSafeEmi: true
  };
}

function uniqueByCode(reasons) {
  const seen = new Set();
  return reasons.filter((reason) => {
    if (seen.has(reason.code)) return false;
    seen.add(reason.code);
    return true;
  });
}

export function calculateConfidence({ answers, missingInformation, warnings, rules }) {
  if (missingInformation.some((item) => item.severity === "critical")) {
    return {
      confidence: CONFIDENCE_LEVELS.LOW,
      confidenceReasons: [{ code: "CORE_DATA_MISSING", message: "Essential affordability information is missing." }],
      penaltyPoints: Infinity
    };
  }

  const reasons = [];

  for (const item of warnings) {
    if (item.code === "PRICING_ESTIMATE_ONLY") continue;
    const penalty = item.code.includes("UNKNOWN") ? CONFIDENCE_PENALTIES.importantUnknown : CONFIDENCE_PENALTIES.optionalUnknown;
    reasons.push({ code: item.code, message: item.message, penalty });
  }

  if (answers.incomeStability === "irregular" && isMissingOrUnknown(answers.lowMonthIncome)) {
    reasons.push({
      code: "LOW_MONTH_INCOME_MISSING",
      message: "Irregular income was reported without a lower-income month amount.",
      penalty: CONFIDENCE_PENALTIES.irregularIncomeWithoutLowMonth
    });
  }

  if (answers.incomeType === "self_employed" && isFiniteNumber(answers.businessAgeMonths) && answers.businessAgeMonths < 12) {
    reasons.push({
      code: "LIMITED_BUSINESS_HISTORY",
      message: "The business has operated for less than 12 months.",
      penalty: CONFIDENCE_PENALTIES.limitedIncomeHistory
    });
  }

  const uniqueReasons = uniqueByCode(reasons);
  const penaltyPoints = uniqueReasons.reduce((total, reason) => total + reason.penalty, 0);
  let confidence = CONFIDENCE_LEVELS.LOW;

  if (penaltyPoints <= rules.assessment.confidenceThresholds.highMaximumPenalty) {
    confidence = CONFIDENCE_LEVELS.HIGH;
  } else if (penaltyPoints <= rules.assessment.confidenceThresholds.mediumMaximumPenalty) {
    confidence = CONFIDENCE_LEVELS.MEDIUM;
  }

  return {
    confidence,
    confidenceReasons: uniqueReasons.map(({ code, message }) => ({ code, message })),
    penaltyPoints
  };
}

export function findMissingInformation(warnings) {
  return warnings
    .filter((item) => item.code !== "PRICING_ESTIMATE_ONLY")
    .map((item) => createMissingInformation({
      code: item.code,
      message: item.message,
      field: item.field ?? null,
      severity: "warning"
    }));
}

export function buildExplanations({ answers, snapshot, assessment, rules }) {
  return [
    {
      id: "safe-emi",
      title: "Safe EMI",
      message: "Safe EMI uses the lower of debt-ratio capacity and surplus capacity after protecting a monthly buffer.",
      inputs: {
        usableIncome: snapshot.usableIncome.value,
        essentialExpenses: answers.essentialExpenses,
        existingEmis: answers.existingEmis
      },
      rules: {
        safeDebtRatio: rules.affordability.safeDebtRatio,
        surplusUseRate: rules.affordability.surplusUseRate,
        minimumMonthlyBufferRate: rules.affordability.minimumMonthlyBufferRate
      },
      improvement: "Lower existing EMIs, reduce the requested EMI, or increase verified income to improve this number."
    },
    {
      id: "borrower-safe-amount",
      title: "Borrower-safe amount",
      message: "The borrower-safe amount converts the safe EMI into a loan amount using the maximum estimated interest rate.",
      inputs: {
        safeEmi: assessment.safeEmi,
        tenureMonths: answers.preferredTenureMonths,
        interestRate: assessment.interestBand.maximum
      },
      rules: { conservativeRate: "maximum_interest_band" },
      improvement: "Request a lower amount, a lower rate, or a tenure that keeps EMI within the safe EMI."
    },
    {
      id: "lender-likely-amount",
      title: "Lender-likely amount",
      message: "The lender-likely amount estimates capacity using a higher debt-ratio assumption and is shown only for comparison.",
      inputs: {
        usableIncome: snapshot.usableIncome.value,
        existingEmis: answers.existingEmis
      },
      rules: { lenderDebtRatio: rules.affordability.lenderDebtRatio },
      improvement: "Do not rely only on lender capacity; compare any offer against the borrower-safe amount."
    },
    {
      id: "interest-apr",
      title: "Interest and APR estimate",
      message: "The APR band includes configured mandatory upfront fees deducted from the loan disbursal.",
      inputs: {
        interestBand: assessment.interestBand,
        totalUpfrontFees: snapshot.fees.value.totalUpfrontFees
      },
      rules: {
        processingFeeRate: rules.fees.processingFeeRate,
        otherMandatoryFees: rules.fees.otherMandatoryFees
      },
      improvement: "Ask the lender for the Key Facts Statement and all compulsory charges before comparing offers."
    },
    {
      id: "stress-case",
      title: "Stress case",
      message: "The requested-loan stress case reduces income and increases the interest rate before checking EMI pressure.",
      inputs: assessment.requestedLoanStress,
      rules: {
        incomeReductionRate: rules.stress.incomeReductionRate,
        interestIncreasePoints: rules.stress.interestIncreasePoints,
        seriousStressDebtRatio: rules.assessment.seriousStressDebtRatio
      },
      improvement: "A smaller loan amount or lower EMI can make the stress case easier to pass."
    }
  ];
}

export function buildNegotiationPoints(assessment) {
  const points = [
    {
      id: "kfs",
      title: "Ask for the Key Facts Statement",
      message: "Request the KFS before accepting any offer so the headline rate and all-in APR can be compared."
    },
    {
      id: "fees-apr",
      title: "Confirm all compulsory fees",
      message: "Ask which charges are deducted upfront and how they affect APR."
    },
    {
      id: "safe-emi",
      title: "Compare the offer EMI with your safe EMI",
      message: `Keep the lender EMI at or below the safe EMI estimate of ${assessment.safeEmi ?? "the calculated safe amount"}.`
    },
    {
      id: "terms",
      title: "Check prepayment, insurance, and rate terms",
      message: "Ask whether insurance is optional, whether the rate is fixed or floating, and what prepayment charges apply."
    }
  ];

  if (assessment.verdict === VERDICTS.BORROW_LESS) {
    points.splice(3, 0, {
      id: "lower-amount-or-tenure",
      title: "Negotiate a safer amount or tenure",
      message: "Ask whether a lower amount or a different tenure can keep EMI within the safe limit."
    });
  }

  return points;
}

function summarizeDecision(verdict, primaryReasonCode) {
  const summaries = {
    BORROW: "The requested amount appears within the borrower-safe range based on the provided answers.",
    BORROW_LESS: "Some borrowing appears possible, but the requested amount or EMI is above the safer range.",
    DO_NOT_BORROW: "Borrowing is not recommended right now based on the provided risk and affordability signals."
  };

  if (primaryReasonCode === "CORE_DATA_MISSING") {
    return "We cannot safely recommend borrowing because essential affordability information is missing.";
  }

  return summaries[verdict];
}

function primaryReasonFor({ verdict, hasCriticalRisk, baselineStress, requestedLoanStress, safeEmi, borrowerSafeAmount, requestedAmount, proposedEmi, rules }) {
  if (hasCriticalRisk) return "CRITICAL_REPAYMENT_RISK";
  if (safeEmi < rules.assessment.minimumSafeEmi) return "SAFE_EMI_TOO_LOW";
  if (borrowerSafeAmount < rules.assessment.minimumBorrowerSafeAmount) return "SAFE_AMOUNT_TOO_LOW";
  if (baselineStress.seriousFailure) return "BASELINE_STRESS_FAILED";
  if (verdict === VERDICTS.BORROW_LESS) {
    const amountLimit = borrowerSafeAmount * (1 + rules.assessment.requestedAmountToleranceRate);
    const emiLimit = safeEmi * (1 + rules.assessment.requestedAmountToleranceRate);
    if (requestedAmount > amountLimit) return "REQUEST_EXCEEDS_SAFE_CAPACITY";
    if (proposedEmi > emiLimit) return "EMI_EXCEEDS_SAFE_CAPACITY";
    if (!requestedLoanStress.passed) return "REQUESTED_LOAN_STRESS_FAILED";
  }
  return verdict === VERDICTS.BORROW ? "REQUEST_WITHIN_SAFE_CAPACITY" : "BORROWING_NOT_RECOMMENDED";
}

function hasOnlyFiniteNumbers(value) {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(hasOnlyFiniteNumbers);
  if (value && typeof value === "object") return Object.values(value).every(hasOnlyFiniteNumbers);
  return true;
}

export function runAssessment(answers = {}, rules = defaultRules) {
  const ruleValidation = validateRules(rules);
  if (!ruleValidation.ok) return ruleValidation;

  const coreMissing = missingCoreInfo(answers);
  if (coreMissing.length > 0) {
    return { ok: true, value: createInsufficientDataAssessment(answers, coreMissing, rules) };
  }

  const snapshotResult = calculateFinancialSnapshot(answers, rules);
  if (!snapshotResult.ok) {
    return fail("ASSESSMENT_CALCULATION_FAILED", snapshotResult.error.message, snapshotResult.error.field);
  }

  const snapshot = snapshotResult.value;
  const warnings = snapshotResult.details?.warnings ?? [];
  const risks = detectRisks(answers);
  const criticalRisk = hasCriticalRepaymentRisk(risks);
  const baselineStress = calculateBaselineStress({
    usableIncome: snapshot.usableIncome.value,
    essentialExpenses: answers.essentialExpenses,
    existingEmis: answers.existingEmis,
    rules
  });
  const requestedLoanStress = normalizeRequestedLoanStress(snapshot.stressCase, rules);
  const borrowerSafeAmount = snapshot.borrowingLimits.value.borrowerSafeAmount;
  const lenderLikelyAmount = snapshot.borrowingLimits.value.lenderLikelyAmount;
  const safeEmi = snapshot.safeEmi.value;
  const proposedEmi = snapshot.proposedEmi.value;
  const requestedAmount = answers.requestedAmount;

  const verdict = determineVerdict({
    hasBlockingCoreData: false,
    hasCriticalRepaymentRisk: criticalRisk,
    baselineStress,
    requestedLoanStress,
    safeEmi,
    borrowerSafeAmount,
    requestedAmount,
    proposedEmi,
    rules
  });
  const recommendedAmount = calculateRecommendedAmount({ verdict, requestedAmount, borrowerSafeAmount });
  const tenureChoice = chooseRecommendedTenure({
    principal: recommendedAmount,
    safeEmi,
    interestRate: snapshot.rateBand.value.maximum,
    tenureOptions: rules.tenureOptions
  });
  if (tenureChoice.ok === false) return tenureChoice;

  const nonBlockingMissing = findMissingInformation(warnings);
  const confidenceResult = calculateConfidence({
    answers,
    missingInformation: nonBlockingMissing,
    warnings,
    rules
  });
  const primaryReasonCode = primaryReasonFor({
    verdict,
    hasCriticalRisk: criticalRisk,
    baselineStress,
    requestedLoanStress,
    safeEmi,
    borrowerSafeAmount,
    requestedAmount,
    proposedEmi,
    rules
  });

  const assessment = {
    verdict,
    decisionStatus: DECISION_STATUSES.COMPLETE,
    primaryReasonCode,
    summary: summarizeDecision(verdict, primaryReasonCode),
    requestedAmount,
    recommendedAmount,
    borrowerSafeAmount,
    lenderLikelyAmount,
    safeEmi,
    proposedEmi,
    recommendedTenureMonths: tenureChoice.recommendedTenureMonths,
    closestTenureMonths: tenureChoice.closestTenureMonths,
    stillAboveSafeEmi: tenureChoice.stillAboveSafeEmi,
    interestBand: snapshot.rateBand.value,
    aprBand: snapshot.aprBand.value,
    baselineStress,
    requestedLoanStress,
    risks,
    missingInformation: nonBlockingMissing,
    confidence: confidenceResult.confidence,
    confidenceReasons: confidenceResult.confidenceReasons,
    explanations: [],
    negotiationPoints: []
  };

  assessment.explanations = buildExplanations({ answers, snapshot, assessment, rules });
  assessment.negotiationPoints = buildNegotiationPoints(assessment);

  if (!hasOnlyFiniteNumbers(assessment)) {
    return fail("NON_FINITE_ASSESSMENT_RESULT", "The assessment produced a non-finite numeric result.", "assessment");
  }

  return { ok: true, value: assessment };
}

export { CONFIDENCE_LEVELS, DECISION_STATUSES, REPAYMENT_DIFFICULTY_TYPES, RISK_SEVERITIES, VERDICTS };


