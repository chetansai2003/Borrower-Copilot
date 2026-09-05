export const rules = Object.freeze({
  affordability: Object.freeze({
    safeDebtRatio: 0.35,
    lenderDebtRatio: 0.5,
    minimumMonthlyBufferRate: 0.1,
    surplusUseRate: 0.75
  }),
  income: Object.freeze({
    typeHaircuts: Object.freeze({
      salaried: 0,
      self_employed: 0.1,
      informal: 0.2,
      unknown: 0.1
    }),
    stabilityHaircuts: Object.freeze({
      stable: 0,
      variable: 0.15,
      irregular: 0.25,
      unknown: 0.1
    })
  }),
  pricing: Object.freeze({
    baseMinimumRate: 12,
    baseMaximumRate: 24,
    absoluteMinimumRate: 10,
    absoluteMaximumRate: 36,
    estimateWarning: Object.freeze({
      code: "PRICING_ESTIMATE_ONLY",
      message: "The interest-rate band is an estimate, not a lender offer.",
      field: "pricing"
    }),
    modifiers: Object.freeze({
      incomeStability: Object.freeze({
        stable: Object.freeze({ minimum: -0.5, maximum: -1 }),
        variable: Object.freeze({ minimum: 1, maximum: 2 }),
        irregular: Object.freeze({ minimum: 2, maximum: 4 }),
        unknown: Object.freeze({ minimum: 0.5, maximum: 2 })
      }),
      incomeType: Object.freeze({
        salaried: Object.freeze({ minimum: -0.25, maximum: -0.5 }),
        self_employed: Object.freeze({ minimum: 0.75, maximum: 1.5 }),
        informal: Object.freeze({ minimum: 1.5, maximum: 3 }),
        unknown: Object.freeze({ minimum: 0.5, maximum: 1.5 })
      }),
      repaymentDifficulty: Object.freeze({
        none: Object.freeze({ minimum: 0, maximum: 0 }),
        missed_payment: Object.freeze({ minimum: 1.5, maximum: 3 }),
        bounce: Object.freeze({ minimum: 2, maximum: 4 }),
        collection: Object.freeze({ minimum: 3, maximum: 6 }),
        unknown: Object.freeze({ minimum: 0.75, maximum: 2 })
      }),
      purpose: Object.freeze({
        home_repair: Object.freeze({ minimum: 0, maximum: 0.5 }),
        business: Object.freeze({ minimum: 0.5, maximum: 1.5 }),
        education: Object.freeze({ minimum: -0.25, maximum: 0.75 }),
        medical: Object.freeze({ minimum: 1, maximum: 2 }),
        wedding: Object.freeze({ minimum: 1, maximum: 2 }),
        debt_consolidation: Object.freeze({ minimum: 1.5, maximum: 3 }),
        vehicle: Object.freeze({ minimum: -0.25, maximum: 0.5 })
      }),
      businessAgeMonths: Object.freeze({
        newerThan12: Object.freeze({ minimum: 1, maximum: 2.5 }),
        twelveToThirtyFive: Object.freeze({ minimum: 0.5, maximum: 1 }),
        thirtySixOrMore: Object.freeze({ minimum: -0.25, maximum: -0.5 }),
        unknown: Object.freeze({ minimum: 0.5, maximum: 1.5 })
      })
    })
  }),
  fees: Object.freeze({
    processingFeeRate: 0.02,
    otherMandatoryFees: 0
  }),
  stress: Object.freeze({
    incomeReductionRate: 0.2,
    interestIncreasePoints: 2
  }),
  emergencyBuffer: Object.freeze({
    lowMonthsBelow: 1,
    adequateMonthsAtLeast: 3
  }),
  apr: Object.freeze({
    maxIterations: 100,
    tolerance: 0.0000001,
    lowerMonthlyRate: 0,
    upperMonthlyRate: 1
  }),
  tenureOptions: Object.freeze([12, 24, 36, 48, 60, 84])
});
