export const VERDICTS = Object.freeze({
  BORROW: "BORROW",
  BORROW_LESS: "BORROW_LESS",
  DO_NOT_BORROW: "DO_NOT_BORROW"
});

export const DECISION_STATUSES = Object.freeze({
  COMPLETE: "COMPLETE",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA"
});

export const CONFIDENCE_LEVELS = Object.freeze({
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW"
});

export const RISK_SEVERITIES = Object.freeze({
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical"
});

export const REPAYMENT_DIFFICULTY_TYPES = Object.freeze({
  NONE: "none",
  BOUNCE: "bounce",
  COLLECTION: "collection",
  LATE_PAYMENT: "late_payment",
  UNKNOWN: "unknown"
});

export const CONFIDENCE_PENALTIES = Object.freeze({
  optionalUnknown: 1,
  importantUnknown: 2,
  irregularIncomeWithoutLowMonth: 2,
  limitedIncomeHistory: 1
});
