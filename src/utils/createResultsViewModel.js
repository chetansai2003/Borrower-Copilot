import { CONFIDENCE_LEVELS, DECISION_STATUSES, VERDICTS } from "../data/constants.js";
import { formatCurrency, formatPercent, formatPercentBand, formatTenure } from "./formatResults.js";

const verdictCopy = {
  [VERDICTS.BORROW]: {
    [DECISION_STATUSES.COMPLETE]: {
      title: "This amount appears manageable",
      message: "The requested amount appears within your borrower-safe range based on the answers provided.",
      tone: "support"
    }
  },
  [VERDICTS.BORROW_LESS]: {
    [DECISION_STATUSES.COMPLETE]: {
      title: "A smaller loan would be safer",
      message: "A smaller loan would give you a safer monthly buffer and reduce repayment stress.",
      tone: "caution"
    }
  },
  [VERDICTS.DO_NOT_BORROW]: {
    [DECISION_STATUSES.COMPLETE]: {
      title: "Borrowing is not recommended right now",
      message: "The available financial information indicates that a new loan could place your essential expenses at risk.",
      tone: "danger"
    },
    [DECISION_STATUSES.INSUFFICIENT_DATA]: {
      title: "We cannot make a safe recommendation yet",
      message: "Some essential information is missing, so we cannot safely estimate an affordable loan.",
      tone: "caution"
    }
  }
};

function getVerdictCopy(verdict, decisionStatus) {
  return (
    verdictCopy[verdict]?.[decisionStatus] ?? {
      title: "Assessment unavailable",
      message: "We could not prepare a recommendation from the current information.",
      tone: "neutral"
    }
  );
}

function formatRecommendedAmount(assessment) {
  if (assessment?.recommendedAmount === null) {
    return "No borrowing amount is currently recommended.";
  }

  return formatCurrency(assessment?.recommendedAmount);
}

function buildTenureMessage(assessment) {
  if (!assessment) return "Not available";

  if (assessment.recommendedTenureMonths) {
    return formatTenure(assessment.recommendedTenureMonths);
  }

  if (assessment.closestTenureMonths) {
    return `${formatTenure(assessment.closestTenureMonths)} is the closest option, but it is still above the safe EMI.`;
  }

  return "No tenure is currently recommended.";
}

function scalePercent(value) {
  return Number.isFinite(value) ? value * 100 : null;
}

function confidenceLabel(confidence) {
  if (confidence === CONFIDENCE_LEVELS.HIGH) return "High confidence";
  if (confidence === CONFIDENCE_LEVELS.MEDIUM) return "Medium confidence";
  if (confidence === CONFIDENCE_LEVELS.LOW) return "Low confidence";
  return "Confidence unavailable";
}

export function createResultsViewModel(assessment) {
  const verdict = getVerdictCopy(assessment?.verdict, assessment?.decisionStatus);
  const requestedAmount = formatCurrency(assessment?.requestedAmount);
  const borrowerSafeAmount = formatCurrency(assessment?.borrowerSafeAmount);
  const lenderLikelyAmount = formatCurrency(assessment?.lenderLikelyAmount);
  const recommendedAmount = formatRecommendedAmount(assessment);

  return {
    verdict,
    summary: assessment?.summary ?? verdict.message,
    requestedAmount,
    recommendedAmount,
    borrowerSafeAmount,
    lenderLikelyAmount,
    safeEmi: formatCurrency(assessment?.safeEmi),
    proposedEmi: formatCurrency(assessment?.proposedEmi),
    aprBand: formatPercentBand(assessment?.aprBand),
    interestBand: formatPercentBand(assessment?.interestBand),
    recommendedTenure: buildTenureMessage(assessment),
    processingFeeRate: formatPercent(scalePercent(assessment?.feeSummary?.processingFeeRate)),
    processingFeeAmount: formatCurrency(assessment?.feeSummary?.processingFeeAmount),
    totalUpfrontFees: formatCurrency(assessment?.feeSummary?.totalUpfrontFees),
    netDisbursal: formatCurrency(assessment?.feeSummary?.netDisbursal),
    baselineStress: assessment?.baselineStress ?? {},
    requestedLoanStress: assessment?.requestedLoanStress ?? {},
    stressSurplus: formatCurrency(assessment?.requestedLoanStress?.stressedSurplus),
    stressedEmi: formatCurrency(assessment?.requestedLoanStress?.stressedEmi),
    stressedDebtRatio: formatPercent(scalePercent(assessment?.requestedLoanStress?.stressedDebtRatio)),
    confidence: confidenceLabel(assessment?.confidence),
    risks: Array.isArray(assessment?.risks) ? assessment.risks : [],
    missingInformation: Array.isArray(assessment?.missingInformation) ? assessment.missingInformation : [],
    confidenceReasons: Array.isArray(assessment?.confidenceReasons) ? assessment.confidenceReasons : [],
    explanations: Array.isArray(assessment?.explanations) ? assessment.explanations : [],
    negotiationPoints: Array.isArray(assessment?.negotiationPoints) ? assessment.negotiationPoints : [],
    tenureComparison: Array.isArray(assessment?.tenureComparison) ? assessment.tenureComparison : [],
    comparisonAriaLabel: `Requested amount ${requestedAmount}. Borrower-safe amount ${borrowerSafeAmount}. Lender-likely estimate ${lenderLikelyAmount}.`,
    hasNoRecommendedAmount: assessment?.recommendedAmount === null
  };
}
