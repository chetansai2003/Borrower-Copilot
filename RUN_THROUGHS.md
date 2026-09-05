# Borrower Copilot Run-Throughs

These run-throughs were generated from the current persona fixtures and `runAssessment(persona.answers)`. Values are rounded for readability. The engine output is the source of truth.

All examples are educational affordability estimates, not lender approvals or financial guarantees.

## Priya: Stable Salaried Income

Priya represents a borrower with stable salaried income and a requested amount inside the borrower-safe range.

### Input Information

| Field | Value |
| --- | --- |
| Purpose | Wedding |
| Requested amount | Approximately INR 2,00,000 |
| Preferred tenure | 36 months |
| Income type | Salaried |
| Monthly take-home income | Approximately INR 1,50,000 |
| Income stability | Stable |
| Essential expenses | Approximately INR 45,000 |
| Existing monthly EMIs | Approximately INR 5,000 |
| Outstanding debt | Approximately INR 90,000 |
| Emergency savings | Approximately INR 1,80,000 |
| Recent repayment difficulty | None |

### Questions Shown

1. What will this borrowing be used for?
2. How much do you want to borrow?
3. What repayment tenure are you considering?
4. How do you earn most of your income?
5. What is your average monthly take-home income?
6. How stable is this income across months?
7. How much do essential household expenses cost each month?
8. How much do you already pay each month toward EMIs or debt?
9. How many months of essential expenses are saved for emergencies?
10. Have you had any recent repayment or credit difficulty?
11. About how much debt is still outstanding?

Adaptive follow-up: outstanding debt amount, because Priya has existing EMI payments.

### Calculation Summary

| Output | Value |
| --- | --- |
| Verdict | BORROW |
| Decision status | COMPLETE |
| Primary reason | REQUEST_WITHIN_SAFE_CAPACITY |
| Requested amount | Approximately INR 2,00,000 |
| Recommended amount | Approximately INR 2,00,000 |
| Borrower-safe amount | Approximately INR 12,02,658 |
| Lender-likely comparison amount | Approximately INR 17,72,338 |
| Safe EMI | Approximately INR 47,500 |
| Proposed EMI | Approximately INR 7,899 |
| Recommended tenure | 12 months |
| Interest band | Approximately 12.3% to 24.5% |
| All-in APR band | Approximately 14.6% to 29.4% |
| Processing fee | Approximately INR 4,000 |
| Net disbursal | Approximately INR 1,96,000 |
| Confidence | HIGH |
| Missing information | None |
| Risks | None |

This is a comparison estimate only. It is not an approval estimate and does not control the safety recommendation.

### Stress Result

| Stress check | Result |
| --- | --- |
| Baseline stress | Passed; stressed surplus approximately INR 70,000; stressed debt ratio approximately 4.2%. |
| Requested-loan stress | Passed; stressed EMI approximately INR 8,111; stressed surplus approximately INR 61,889; stressed debt ratio approximately 10.9%. |

### Explanation

Priya's requested amount is much lower than the borrower-safe amount. Her proposed EMI is below the safe EMI, baseline stress passes, requested-loan stress passes, and no critical repayment risk is reported.

### Negotiation Advice

- Ask for the Key Facts Statement before accepting any offer.
- Compare all-in APR, not only the advertised interest rate.
- Keep the lender EMI at or below approximately INR 47,500.
- Ask whether insurance is optional, whether the rate is fixed or floating, and what prepayment charges apply.

## Ravi: Self-Employed Borrower With Variable Income

Ravi represents a borrower where some borrowing appears possible, but the requested amount is higher than the borrower-safe range.

### Input Information

| Field | Value |
| --- | --- |
| Purpose | Business |
| Requested amount | Approximately INR 9,00,000 |
| Preferred tenure | 60 months |
| Income type | Self-employed |
| Monthly take-home income | Approximately INR 80,000 |
| Income stability | Variable |
| Business age | 36 months |
| Essential expenses | Approximately INR 38,000 |
| Existing monthly EMIs | Approximately INR 5,000 |
| Outstanding debt | Unknown |
| Emergency savings | Unknown |
| Recent repayment difficulty | None |

### Questions Shown

1. What will this borrowing be used for?
2. How much do you want to borrow?
3. What repayment tenure are you considering?
4. How do you earn most of your income?
5. What is your average monthly take-home income?
6. How stable is this income across months?
7. How much do essential household expenses cost each month?
8. How much do you already pay each month toward EMIs or debt?
9. How many months of essential expenses are saved for emergencies?
10. Have you had any recent repayment or credit difficulty?
11. How long has the business operated?
12. About how much debt is still outstanding?

Adaptive follow-ups: business age, because Ravi is self-employed; outstanding debt amount, because Ravi has existing EMI payments.

### Calculation Summary

| Output | Value |
| --- | --- |
| Verdict | BORROW_LESS |
| Decision status | COMPLETE |
| Primary reason | REQUEST_EXCEEDS_SAFE_CAPACITY |
| Requested amount | Approximately INR 9,00,000 |
| Recommended amount | Approximately INR 5,78,914 |
| Borrower-safe amount | Approximately INR 5,78,914 |
| Lender-likely comparison amount | Approximately INR 9,22,446 |
| Safe EMI | Approximately INR 18,200 |
| Proposed EMI | Approximately INR 28,294 |
| Recommended tenure | 84 months |
| Interest band | Approximately 14.0% to 28.5% |
| All-in APR band | Approximately 16.0% to 33.9% |
| Processing fee | Approximately INR 18,000 |
| Net disbursal | Approximately INR 8,82,000 |
| Confidence | LOW |
| Missing information | Emergency savings unknown; outstanding debt unknown. |
| Risks | None |

This is a comparison estimate only. It is not an approval estimate and does not control the safety recommendation.

### Stress Result

| Stress check | Result |
| --- | --- |
| Baseline stress | Passed; stressed surplus approximately INR 11,400; stressed debt ratio approximately 9.2%. |
| Requested-loan stress | Failed; stressed EMI approximately INR 29,395; stressed surplus approximately -INR 17,995; stressed debt ratio approximately 63.2%. |

### Explanation

Ravi's existing finances pass baseline stress, so the engine does not reject all borrowing. The requested loan fails the requested-loan stress test and exceeds the borrower-safe amount, so the result is `BORROW_LESS` rather than `DO_NOT_BORROW`.

Confidence is low because emergency savings and outstanding debt were unknown. Confidence is about data quality, not whether Ravi is a good or bad borrower.

### Negotiation Advice

- Ask for the Key Facts Statement before accepting any offer.
- Compare all-in APR, not only the advertised interest rate.
- Keep the lender EMI at or below approximately INR 18,200.
- Negotiate a safer amount near the borrower-safe estimate instead of the original request.
- Ask about prepayment charges, optional insurance, and fixed or floating rate terms.

## Anita: Existing Obligations and Recent Repayment Difficulty

Anita represents a complete profile where borrowing is not recommended because existing obligations, stress results, and a recent repayment bounce show high risk.

### Input Information

| Field | Value |
| --- | --- |
| Purpose | Medical |
| Emergency urgency | Immediate |
| Requested amount | Approximately INR 2,50,000 |
| Preferred tenure | 24 months |
| Income type | Informal |
| Monthly take-home income | Approximately INR 50,000 |
| Income stability | Irregular |
| Low-month income | Approximately INR 45,000 |
| Essential expenses | Approximately INR 28,000 |
| Existing monthly EMIs | Approximately INR 18,000 |
| Outstanding debt | Approximately INR 85,000 |
| Emergency savings | Approximately INR 5,000 |
| Recent repayment difficulty | Bounce in the last 30 days |

### Questions Shown

1. What will this borrowing be used for?
2. How much do you want to borrow?
3. What repayment tenure are you considering?
4. How do you earn most of your income?
5. What is your average monthly take-home income?
6. How stable is this income across months?
7. How much do essential household expenses cost each month?
8. How much do you already pay each month toward EMIs or debt?
9. How many months of essential expenses are saved for emergencies?
10. Have you had any recent repayment or credit difficulty?
11. How much do you earn in a lower-income month?
12. About how much debt is still outstanding?
13. How recent was the repayment difficulty?
14. How urgent is the medical or emergency need?

Adaptive follow-ups: low-month income, outstanding debt amount, repayment difficulty recency, and emergency urgency.

### Calculation Summary

| Output | Value |
| --- | --- |
| Verdict | DO_NOT_BORROW |
| Decision status | COMPLETE |
| Primary reason | CRITICAL_REPAYMENT_RISK |
| Requested amount | Approximately INR 2,50,000 |
| Recommended amount | No borrowing amount is currently recommended. |
| Borrower-safe amount | INR 0 |
| Lender-likely comparison amount | Approximately INR 12,702 |
| Safe EMI | INR 0 |
| Proposed EMI | Approximately INR 14,762 |
| Recommended tenure | None |
| Interest band | Approximately 18.5% to 36.0% |
| All-in APR band | Approximately 22.7% to 45.7% |
| Processing fee | Approximately INR 5,000 |
| Net disbursal | Approximately INR 2,45,000 |
| Confidence | HIGH |
| Missing information | None |
| Risks | Recent repayment bounce within the last 30 days. |

This is a comparison estimate only. It is not an approval estimate and does not control the safety recommendation.

### Stress Result

| Stress check | Result |
| --- | --- |
| Baseline stress | Failed; stressed surplus approximately -INR 16,000; stressed debt ratio approximately 60.0%. |
| Requested-loan stress | Failed; stressed EMI approximately INR 15,028; stressed surplus approximately -INR 31,028; stressed debt ratio approximately 110.1%. |

### Explanation

Anita has complete information, so the confidence is high even though the recommendation is negative. The verdict is `DO_NOT_BORROW` because a repayment bounce was reported within the last 30 days, safe EMI is zero, baseline stress fails, and the requested-loan stress result is severe.

### Negotiation Advice

- Avoid taking a new EMI until essential expenses and existing obligations are safer.
- Ask lenders or current creditors about restructuring, hardship support, or lower-payment options before taking new debt.
- If an emergency loan is unavoidable, ask for the Key Facts Statement and all compulsory charges before signing.
- Do not treat lender capacity as safety. The lender-likely amount is only a comparison estimate.

## Five-Minute Demonstration Script

### 0:00-0:45 - Problem and Product Goal

Explain that borrowers often hear how much they might get from a lender before they understand what is safer for their household. Borrower Copilot is a private, borrower-side tool that estimates a safer borrowing range and prepares lender questions.

### 0:45-1:30 - Questionnaire

Show the one-question-at-a-time flow. Point out that answers are kept in React memory only, adaptive follow-ups appear only when relevant, and `unknown` is not treated as zero.

### 1:30-2:30 - Recommendation and Financial Reasoning

Load Priya to show `BORROW`, Ravi to show `BORROW_LESS`, and Anita to show `DO_NOT_BORROW`. Explain requested amount, recommended amount, borrower-safe amount, lender-likely comparison, safe EMI, and proposed EMI.

### 2:30-3:30 - APR, Stress Case, and Explanations

Show that all-in APR appears before advertised interest. Open a "How we calculated this" panel and explain safe EMI, APR, and stress. Highlight the difference between baseline stress and requested-loan stress.

### 3:30-4:15 - Negotiation Card

Scroll to the Negotiation Card. Show requested amount, recommended amount, safe EMI, APR, fees, questions to ask the lender, warning signs, and disclaimers. Use the print button to show that printing is handled locally with `window.print()`.

### 4:15-5:00 - Architecture, Tests, Privacy, and Limitations

Summarize the architecture: React UI, reducer state, config-driven questions, pure engines, view model, and print CSS. Mention tests, no persistence, no backend, no lender approval guarantee, and simplified educational assumptions.
