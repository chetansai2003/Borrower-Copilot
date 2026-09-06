import { z } from "zod";
import { REPAYMENT_DIFFICULTY_TYPES } from "./constants.js";

const requiredChoice = (message) => z.string({ message }).min(1, message);
const positiveNumber = (message) => z.number({ message }).positive(message);
const nonNegativeNumber = (message) => z.number({ message }).nonnegative(message);

export const questions = [
  {
    id: "borrowingPurpose",
    tier: "essential",
    label: "What will this borrowing be used for?",
    helperText: "The purpose can change the kind of product, repayment risk, and follow-up questions.",
    type: "choice",
    required: true,
    unknownAllowed: false,
    options: [
      { value: "home_repair", label: "Home repair" },
      { value: "business", label: "Business need" },
      { value: "education", label: "Education" },
      { value: "medical", label: "Medical or emergency" },
      { value: "wedding", label: "Wedding or family event" },
      { value: "debt_consolidation", label: "Debt consolidation" },
      { value: "vehicle", label: "Vehicle" }
    ],
    schema: requiredChoice("Choose the purpose of borrowing."),
    appliesWhen: () => true,
    impactAreas: ["productRoute", "risk", "confidence"]
  },
  {
    id: "requestedAmount",
    tier: "essential",
    label: "How much do you want to borrow?",
    helperText: "Use the amount you plan to request from a lender.",
    type: "currency",
    required: true,
    unknownAllowed: false,
    options: [],
    schema: positiveNumber("Enter a requested amount greater than zero."),
    appliesWhen: () => true,
    impactAreas: ["maximumAmount", "safeEmi", "verdict"]
  },
  {
    id: "preferredTenureMonths",
    tier: "essential",
    label: "What repayment tenure are you considering?",
    helperText: "Tenure changes the monthly EMI and the total amount repaid.",
    type: "choice",
    required: true,
    unknownAllowed: false,
    options: [
      { value: "12", label: "12 months" },
      { value: "24", label: "24 months" },
      { value: "36", label: "36 months" },
      { value: "48", label: "48 months" },
      { value: "60", label: "60 months" },
      { value: "84", label: "84 months" }
    ],
    schema: positiveNumber("Choose a repayment tenure."),
    appliesWhen: () => true,
    impactAreas: ["safeEmi", "totalRepayment"]
  },
  {
    id: "incomeType",
    tier: "essential",
    label: "How do you earn most of your income?",
    helperText: "Different income types need different evidence and confidence treatment.",
    type: "choice",
    required: true,
    unknownAllowed: false,
    options: [
      { value: "salaried", label: "Salaried" },
      { value: "self_employed", label: "Self-employed or business owner" },
      { value: "informal", label: "Informal or mixed income" }
    ],
    schema: requiredChoice("Choose the closest income type."),
    appliesWhen: () => true,
    impactAreas: ["incomeEvidence", "confidence"]
  },
  {
    id: "monthlyIncome",
    tier: "essential",
    label: "What is your average monthly take-home income?",
    helperText: "Use the amount you normally receive after deductions.",
    type: "currency",
    required: true,
    unknownAllowed: false,
    options: [],
    schema: positiveNumber("Enter a monthly income greater than zero."),
    appliesWhen: () => true,
    impactAreas: ["affordability", "safeEmi", "maximumAmount"]
  },
  {
    id: "incomeStability",
    tier: "essential",
    label: "How stable is this income across months?",
    helperText: "This helps keep the future EMI comfortable, not only affordable in a good month.",
    type: "choice",
    required: true,
    unknownAllowed: false,
    options: [
      { value: "stable", label: "Mostly stable" },
      { value: "variable", label: "Somewhat variable" },
      { value: "irregular", label: "Irregular or seasonal" }
    ],
    schema: requiredChoice("Choose how stable the income is."),
    appliesWhen: () => true,
    impactAreas: ["usableIncome", "stressTest", "confidence"]
  },
  {
    id: "essentialExpenses",
    tier: "essential",
    label: "How much do essential household expenses cost each month?",
    helperText: "Include rent, food, school fees, utilities, medicines, and transport.",
    type: "currency",
    required: true,
    unknownAllowed: true,
    options: [],
    schema: nonNegativeNumber("Expenses cannot be negative."),
    appliesWhen: () => true,
    impactAreas: ["safeEmi", "surplus", "confidence"]
  },
  {
    id: "existingEmis",
    tier: "essential",
    label: "How much do you already pay each month toward EMIs or debt?",
    helperText: "Enter zero only if you have confirmed there are no current EMI or debt payments.",
    type: "currency",
    required: true,
    unknownAllowed: true,
    options: [],
    schema: nonNegativeNumber("Existing EMI cannot be negative."),
    appliesWhen: () => true,
    impactAreas: ["debtBurden", "safeEmi", "maximumAmount"]
  },
  {
    id: "emergencySavings",
    tier: "essential",
    label: "How much emergency savings do you have available?",
    helperText: "Enter the total amount in rupees available for emergencies. Enter zero only if you have none, or choose I do not know if you are unsure.",
    type: "currency",
    required: true,
    unknownAllowed: true,
    options: [],
    schema: nonNegativeNumber("Emergency savings cannot be negative."),
    appliesWhen: () => true,
    impactAreas: ["stressTest", "confidence"]
  },
  {
    id: "recentRepaymentDifficulty",
    tier: "essential",
    label: "Have you had any recent repayment or credit difficulty?",
    helperText: "This is asked to avoid suggesting a payment that could worsen an already difficult month.",
    type: "choice",
    required: true,
    unknownAllowed: true,
    options: [
      { value: REPAYMENT_DIFFICULTY_TYPES.NONE, label: "No recent difficulty" },
      { value: REPAYMENT_DIFFICULTY_TYPES.LATE_PAYMENT, label: "Missed or late payment" },
      { value: REPAYMENT_DIFFICULTY_TYPES.BOUNCE, label: "Bank bounce or failed auto-debit" },
      { value: REPAYMENT_DIFFICULTY_TYPES.COLLECTION, label: "Collection calls or settlement pressure" }
    ],
    schema: requiredChoice("Choose the repayment difficulty status."),
    appliesWhen: () => true,
    impactAreas: ["risk", "confidence"]
  },
  {
    id: "lowMonthIncome",
    tier: "follow_up",
    triggerSummary: "Irregular or seasonal income",
    label: "How much do you earn in a lower-income month?",
    helperText: "This helps avoid recommending an EMI based only on good months.",
    type: "currency",
    required: true,
    unknownAllowed: true,
    options: [],
    schema: nonNegativeNumber("Low-month income cannot be negative."),
    appliesWhen: (answers) => answers.incomeStability === "irregular",
    impactAreas: ["usableIncome", "stressTest", "confidence"]
  },
  {
    id: "businessAgeMonths",
    tier: "follow_up",
    triggerSummary: "Self-employed or business income",
    label: "How long has the business operated?",
    helperText: "Business age helps later distinguish a newer business from a more established one.",
    type: "choice",
    required: true,
    unknownAllowed: true,
    options: [
      { value: "6", label: "Less than 1 year" },
      { value: "18", label: "1 to 2 years" },
      { value: "36", label: "3 years or more" }
    ],
    schema: positiveNumber("Choose how long the business has operated."),
    appliesWhen: (answers) => answers.incomeType === "self_employed",
    impactAreas: ["incomeEvidence", "confidence", "productRoute"]
  },
  {
    id: "outstandingDebtAmount",
    tier: "follow_up",
    triggerSummary: "Existing EMI or debt payments above zero",
    label: "About how much debt is still outstanding?",
    helperText: "This helps later separate a small monthly EMI from a larger remaining obligation.",
    type: "currency",
    required: true,
    unknownAllowed: true,
    options: [],
    schema: nonNegativeNumber("Outstanding debt cannot be negative."),
    appliesWhen: (answers) => typeof answers.existingEmis === "number" && answers.existingEmis > 0,
    impactAreas: ["debtBurden", "confidence"]
  },
  {
    id: "repaymentDifficultyRecency",
    tier: "follow_up",
    triggerSummary: "Recent repayment or credit difficulty",
    label: "How recent was the repayment difficulty?",
    helperText: "Recent problems usually need a more cautious next step than older, resolved issues.",
    type: "choice",
    required: true,
    unknownAllowed: true,
    options: [
      { value: "last_30_days", label: "In the last 30 days" },
      { value: "last_6_months", label: "In the last 6 months" },
      { value: "older", label: "Older than 6 months" }
    ],
    schema: requiredChoice("Choose when the difficulty happened."),
    appliesWhen: (answers) =>
      Boolean(answers.recentRepaymentDifficulty) &&
      answers.recentRepaymentDifficulty !== REPAYMENT_DIFFICULTY_TYPES.NONE &&
      answers.recentRepaymentDifficulty !== REPAYMENT_DIFFICULTY_TYPES.UNKNOWN,
    impactAreas: ["risk", "confidence"]
  },
  {
    id: "courseOrJobExpectation",
    tier: "follow_up",
    triggerSummary: "Education borrowing purpose",
    label: "Is the education expected to improve income soon?",
    helperText: "This helps later distinguish a cost-only loan from one with a likely income path.",
    type: "choice",
    required: true,
    unknownAllowed: true,
    options: [
      { value: "confirmed", label: "Yes, with a clear job or income path" },
      { value: "possible", label: "Possibly, but not confirmed" },
      { value: "no", label: "No clear income change expected" }
    ],
    schema: requiredChoice("Choose the closest education income expectation."),
    appliesWhen: (answers) => answers.borrowingPurpose === "education",
    impactAreas: ["purposeRisk", "confidence"]
  },
  {
    id: "emergencyUrgency",
    tier: "follow_up",
    triggerSummary: "Medical or emergency borrowing purpose",
    label: "How urgent is the medical or emergency need?",
    helperText: "Urgency helps later prioritize safer immediate options and repayment flexibility.",
    type: "choice",
    required: true,
    unknownAllowed: false,
    options: [
      { value: "immediate", label: "Immediate" },
      { value: "this_month", label: "This month" },
      { value: "can_compare", label: "I can compare options first" }
    ],
    schema: requiredChoice("Choose the urgency of the need."),
    appliesWhen: (answers) => answers.borrowingPurpose === "medical",
    impactAreas: ["purposeRisk", "productRoute"]
  }
];



