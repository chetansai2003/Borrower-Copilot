import { REPAYMENT_DIFFICULTY_TYPES, VERDICTS } from "./constants.js";

export const personas = [
  {
    id: "priya",
    name: "Priya",
    description: "Stable salaried profile with a requested amount inside safe capacity.",
    expectedVerdict: VERDICTS.BORROW,
    answers: {
      borrowingPurpose: "wedding",
      requestedAmount: 200000,
      preferredTenureMonths: 36,
      incomeType: "salaried",
      monthlyIncome: 150000,
      incomeStability: "stable",
      essentialExpenses: 45000,
      existingEmis: 5000,
      outstandingDebtAmount: 90000,
      emergencySavings: 180000,
      recentRepaymentDifficulty: REPAYMENT_DIFFICULTY_TYPES.NONE
    }
  },
  {
    id: "ravi",
    name: "Ravi",
    description: "Self-employed borrower where a smaller amount is safer than the request.",
    expectedVerdict: VERDICTS.BORROW_LESS,
    answers: {
      borrowingPurpose: "business",
      requestedAmount: 900000,
      preferredTenureMonths: 60,
      incomeType: "self_employed",
      monthlyIncome: 80000,
      incomeStability: "variable",
      businessAgeMonths: 36,
      essentialExpenses: 38000,
      existingEmis: 5000,
      outstandingDebtAmount: "unknown",
      emergencySavings: "unknown",
      recentRepaymentDifficulty: REPAYMENT_DIFFICULTY_TYPES.NONE
    }
  },
  {
    id: "anita",
    name: "Anita",
    description: "Complete high-risk profile with a recent repayment bounce.",
    expectedVerdict: VERDICTS.DO_NOT_BORROW,
    answers: {
      borrowingPurpose: "medical",
      emergencyUrgency: "immediate",
      requestedAmount: 250000,
      preferredTenureMonths: 24,
      incomeType: "informal",
      monthlyIncome: 50000,
      incomeStability: "irregular",
      lowMonthIncome: 45000,
      essentialExpenses: 28000,
      existingEmis: 18000,
      outstandingDebtAmount: 85000,
      emergencySavings: 5000,
      recentRepaymentDifficulty: REPAYMENT_DIFFICULTY_TYPES.BOUNCE,
      repaymentDifficultyRecency: "last_30_days"
    }
  }
];

