export const personas = [
  {
    id: "priya",
    name: "Priya",
    description: "Salaried profile with stable income and no recent repayment stress.",
    answers: {
      borrowingPurpose: "wedding",
      requestedAmount: 600000,
      preferredTenureMonths: 36,
      incomeType: "salaried",
      monthlyIncome: 95000,
      incomeStability: "stable",
      essentialExpenses: 42000,
      existingEmis: 12000,
      outstandingDebtAmount: 240000,
      emergencySavings: 3,
      recentRepaymentDifficulty: "none"
    }
  },
  {
    id: "ravi",
    name: "Ravi",
    description: "Self-employed borrower with variable business income.",
    answers: {
      borrowingPurpose: "business",
      requestedAmount: 900000,
      preferredTenureMonths: 60,
      incomeType: "self_employed",
      monthlyIncome: 80000,
      incomeStability: "variable",
      businessAgeMonths: 36,
      essentialExpenses: 38000,
      existingEmis: "unknown",
      emergencySavings: "unknown",
      recentRepaymentDifficulty: "unknown"
    }
  },
  {
    id: "anita",
    name: "Anita",
    description: "Informal-income emergency borrower with recent repayment pressure.",
    answers: {
      borrowingPurpose: "medical",
      emergencyUrgency: "immediate",
      requestedAmount: 250000,
      preferredTenureMonths: 24,
      incomeType: "informal",
      monthlyIncome: 38000,
      incomeStability: "irregular",
      lowMonthIncome: 18000,
      essentialExpenses: 30000,
      existingEmis: 7000,
      outstandingDebtAmount: 85000,
      emergencySavings: 0,
      recentRepaymentDifficulty: "bounce",
      repaymentDifficultyRecency: "last_30_days"
    }
  }
];
