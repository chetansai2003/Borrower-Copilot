# Borrower Copilot Rules

This document describes the configured product assumptions used by Borrower Copilot. These thresholds are not lender approval guarantees, underwriting rules, legal advice, or financial advice. They are transparent borrower-protection assumptions used to produce an educational affordability estimate.

## Answer Semantics

The questionnaire keeps three values separate:

| Value | Meaning |
| --- | --- |
| `null` | Unanswered. |
| `"unknown"` | The borrower explicitly does not know. |
| `0` | Confirmed zero. |

The engine must not silently convert `null` or `"unknown"` to zero.

## Income Treatment

Usable income starts from monthly take-home income and applies the largest relevant haircut. Haircuts are not added together.

```js
appliedHaircut = Math.max(
  incomeTypeHaircut,
  incomeStabilityHaircut
);

adjustedIncome = monthlyIncome * (1 - appliedHaircut);
```

For irregular income with low-month income:

```js
usableIncome = Math.min(
  monthlyIncome * (1 - appliedHaircut),
  lowMonthIncome
);
```

Income type haircuts:

| Income type | Haircut |
| --- | ---: |
| Salaried | 0% |
| Self-employed | 10% |
| Informal | 20% |
| Unknown | 10% |

Income stability haircuts:

| Stability | Haircut |
| --- | ---: |
| Stable | 0% |
| Variable | 15% |
| Irregular | 25% |
| Unknown | 10% |

This protects the borrower by avoiding an EMI based only on optimistic income assumptions.

## Safe EMI Formula

Safe EMI must satisfy both a debt-burden check and a monthly-surplus check.

```text
Raw surplus =
  usable income - essential expenses - existing EMIs

Debt capacity =
  usable income x 35% - existing EMIs

Protected buffer =
  usable income x 10%

Surplus capacity =
  minimum(
    raw surplus x 75%,
    raw surplus - protected buffer
  )

Safe EMI =
  maximum(
    0,
    minimum(debt capacity, surplus capacity)
  )
```

Configured affordability assumptions:

| Rule | Value |
| --- | ---: |
| Safe debt ratio | 35% |
| Lender comparison debt ratio | 50% |
| Minimum protected monthly buffer | 10% of usable income |
| Surplus use rate | 75% |

The lender comparison ratio is used only to estimate possible lender capacity. It is not an approval estimate and does not control the safety recommendation.

## Borrowing Limits

Borrower-safe amount converts safe EMI into a maximum principal using the maximum estimated interest-rate band and the preferred tenure.

Lender-likely comparison amount uses:

```text
max(0, usable income x 50% - existing EMIs)
```

That EMI capacity is converted to principal using the same maximum estimated interest-rate band. It is shown only for comparison.

## Interest-Rate Bands and Pricing Modifiers

Pricing starts with a base nominal interest band of `12%` to `24%`. The engine applies configured modifiers, then clamps the nominal band to `10%` to `36%`.

```text
base rate -> apply modifiers -> clamp to 10%-36%
```

The result is an estimate, not a lender offer.

### Income Stability Modifiers

| Condition | Minimum modifier | Maximum modifier |
| --- | ---: | ---: |
| Stable | -0.5 points | -1 point |
| Variable | +1 point | +2 points |
| Irregular | +2 points | +4 points |
| Unknown | +0.5 points | +2 points |

### Income Type Modifiers

| Condition | Minimum modifier | Maximum modifier |
| --- | ---: | ---: |
| Salaried | -0.25 points | -0.5 points |
| Self-employed | +0.75 points | +1.5 points |
| Informal | +1.5 points | +3 points |
| Unknown | +0.5 points | +1.5 points |

### Repayment Difficulty Modifiers

| Condition | Minimum modifier | Maximum modifier |
| --- | ---: | ---: |
| None | 0 points | 0 points |
| Late payment | +1.5 points | +3 points |
| Bounce | +2 points | +4 points |
| Collection | +3 points | +6 points |
| Unknown | +0.75 points | +2 points |

### Purpose Modifiers

| Purpose | Minimum modifier | Maximum modifier |
| --- | ---: | ---: |
| Home repair | 0 points | +0.5 points |
| Business | +0.5 points | +1.5 points |
| Education | -0.25 points | +0.75 points |
| Medical | +1 point | +2 points |
| Wedding | +1 point | +2 points |
| Debt consolidation | +1.5 points | +3 points |
| Vehicle | -0.25 points | +0.5 points |

### Business Age Modifiers

| Business age | Minimum modifier | Maximum modifier |
| --- | ---: | ---: |
| Newer than 12 months | +1 point | +2.5 points |
| 12 to 35 months | +0.5 points | +1 point |
| 36 months or more | -0.25 points | -0.5 points |
| Unknown | +0.5 points | +1.5 points |

The rules intentionally do not use gender, religion, caste, name, location stereotypes, or hidden demographic proxies.

## Fees and Net Disbursal

Configured fees:

| Fee | Value |
| --- | ---: |
| Processing fee | 2% of principal |
| Other mandatory fees | INR 0 |

```text
Total upfront fees = processing fee + other mandatory fees
Net disbursal = principal - total upfront fees
```

Taxes and insurance are not automatically added unless explicitly configured. Current other mandatory fees are `0`.

## APR Calculation

APR includes configured mandatory upfront fees. The borrower receives less than the principal when upfront fees are deducted.

```text
Month 0: borrower receives net disbursal
Month 1-N: borrower pays EMI
```

The APR solver finds the monthly rate where:

```text
net disbursal = sum of EMI / (1 + monthlyRate)^month
```

Then it annualizes:

```text
annual APR percent = ((1 + monthlyRate)^12 - 1) x 100
```

APR solver configuration:

| Rule | Value |
| --- | ---: |
| Maximum iterations | 100 |
| Tolerance | 0.0000001 |
| Lower monthly rate bound | 0 |
| Upper monthly rate bound | 1 |

The APR estimate may exceed the maximum nominal interest rate because APR includes configured mandatory upfront fees. It is still only an educational estimate and may not include every lender-specific charge. The calculation is not described as officially regulatory-compliant.

## Tenure Recommendation

Configured tenure options are `12`, `24`, `36`, `48`, `60`, and `84` months.

The assessment chooses the shortest tenure where the EMI for the recommended amount is within safe EMI. If no tenure is affordable, no tenure is labelled as recommended; the longest configured tenure may be shown only as the closest option and marked as still above safe EMI.

## Stress Tests

Stress assumptions:

| Rule | Value |
| --- | ---: |
| Income reduction | 20% |
| Interest increase | +2 percentage points |
| Serious stress debt ratio | 55% |
| Minimum stress surplus | INR 0 |

Borrower Copilot runs two stress checks.

### Baseline Stress

Baseline stress tests whether the borrower can manage existing expenses and debts after the configured income reduction, before adding the new loan.

A serious baseline failure can produce `DO_NOT_BORROW`.

### Requested-Loan Stress

Requested-loan stress adds the proposed loan EMI and the increased interest rate.

A requested-loan stress failure can produce `BORROW_LESS` when some borrowing remains affordable. This avoids incorrectly rejecting all borrowing only because the requested amount is too high.

## Emergency Savings

Emergency savings are compared with essential expenses to estimate months of coverage.

The questionnaire collects `emergencySavings` as a total INR amount, not a number of months. Coverage is `emergencySavings / essentialExpenses`. A confirmed zero is `0`, an unanswered field is `null`, and an explicit unknown is `"unknown"`; neither missing nor unknown savings is converted to zero.

| Category | Rule |
| --- | --- |
| Low | Below 1 month |
| Limited | 1 month to under 3 months |
| Adequate | 3 months or more |
| Unknown | Borrower selected `"unknown"` |

If essential expenses are zero, the engine returns a warning because months of coverage cannot be meaningfully calculated.

## Verdict Rules

The assessment returns exactly one primary verdict: `BORROW`, `BORROW_LESS`, or `DO_NOT_BORROW`.

Verdict precedence:

1. Missing core information -> `DO_NOT_BORROW` with `INSUFFICIENT_DATA`.
2. Critical recent repayment event -> `DO_NOT_BORROW`.
3. No meaningful safe capacity -> `DO_NOT_BORROW`.
4. Existing finances fail baseline stress seriously -> `DO_NOT_BORROW`.
5. Requested amount exceeds safe amount by more than the 2% tolerance -> `BORROW_LESS`.
6. Proposed EMI exceeds safe EMI by more than the 2% tolerance -> `BORROW_LESS`.
7. Requested loan fails stress but some borrowing remains possible -> `BORROW_LESS`.
8. All safety conditions pass -> `BORROW`.

Assessment thresholds:

| Rule | Value |
| --- | ---: |
| Minimum meaningful safe EMI | INR 1,000 |
| Minimum meaningful borrower-safe amount | INR 25,000 |
| Requested amount tolerance | 2% |
| Proposed EMI tolerance | 2% |

The lender-likely amount never controls the verdict.

## Confidence Rules

Confidence describes the quality and completeness of information. It does not describe whether the borrower is financially strong.

For example, Anita can receive `DO_NOT_BORROW` with `HIGH` confidence because the negative result is based on complete and clear information.

Penalties:

| Reason | Penalty |
| --- | ---: |
| Optional unknown | 1 |
| Important unknown | 2 |
| Irregular income without low-month income | 2 |
| Limited business history | 1 |

Thresholds:

| Total penalty | Confidence |
| --- | --- |
| 0-1 | HIGH |
| 2-3 | MEDIUM |
| 4 or more | LOW |
| Core missing data | LOW |

Duplicate warnings are counted only once.

## Missing Data Treatment

Core missing data means the app cannot safely assess affordability. The result is conservative:

```text
verdict: DO_NOT_BORROW
decisionStatus: INSUFFICIENT_DATA
```

This means the app cannot safely assess. It does not mean the borrower is definitely unable to afford a loan.

Non-core missing values, such as unknown emergency savings or unknown outstanding debt, become warnings and may reduce confidence without automatically blocking the calculation.

## Why These Rules Protect the Borrower

The rules prioritize the borrower's monthly safety over maximum approval size. They protect living costs, avoid treating unknowns as zero, stress-test income and rate changes, make APR more visible than advertised interest, and keep lender-likely capacity separate from borrower-safe recommendations.
