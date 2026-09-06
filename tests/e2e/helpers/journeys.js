import { expect } from "@playwright/test";

export async function startAssessment(page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
  await page.getByRole("button", { name: /start assessment/i }).click();
}

export async function chooseSelect(page, label, value) {
  await page.getByLabel(label).selectOption(value);
  await page.getByRole("button", { name: /continue/i }).click();
}

export async function chooseRadio(page, label, buttonName = /continue/i) {
  await page.getByLabel(label).click();
  await page.getByRole("button", { name: buttonName }).click();
}

export async function fillCurrency(page, label, value, buttonName = /continue/i) {
  const field = page.getByLabel(label);
  await field.fill(String(value));
  await page.getByRole("button", { name: buttonName }).click();
}

export async function fillPriya(page) {
  await startAssessment(page);
  await chooseSelect(page, /what will this borrowing be used for/i, "wedding");
  await fillCurrency(page, /how much do you want to borrow/i, 200000);
  await chooseSelect(page, /what repayment tenure are you considering/i, "36");
  await chooseRadio(page, /salaried/i);
  await fillCurrency(page, /average monthly take-home income/i, 150000);
  await chooseRadio(page, /mostly stable/i);
  await fillCurrency(page, /essential household expenses/i, 45000);
  await fillCurrency(page, /already pay each month/i, 5000);
  await fillCurrency(page, /how much emergency savings/i, 180000);
  await chooseRadio(page, /no recent difficulty/i);
  await fillCurrency(page, /debt is still outstanding/i, 90000, /complete questionnaire/i);
}

export async function fillRavi(page) {
  await startAssessment(page);
  await chooseSelect(page, /what will this borrowing be used for/i, "business");
  await fillCurrency(page, /how much do you want to borrow/i, 900000);
  await chooseSelect(page, /what repayment tenure are you considering/i, "60");
  await chooseRadio(page, /self-employed/i);
  await fillCurrency(page, /average monthly take-home income/i, 80000);
  await chooseRadio(page, /somewhat variable/i);
  await fillCurrency(page, /essential household expenses/i, 38000);
  await fillCurrency(page, /already pay each month/i, 5000);
  await page.getByRole("button", { name: /i do not know/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await chooseRadio(page, /no recent difficulty/i);
  await chooseRadio(page, /3 years or more/i);
  await page.getByRole("button", { name: /i do not know/i }).click();
  await page.getByRole("button", { name: /complete questionnaire/i }).click();
}

export async function fillAnita(page) {
  await startAssessment(page);
  await chooseSelect(page, /what will this borrowing be used for/i, "medical");
  await fillCurrency(page, /how much do you want to borrow/i, 250000);
  await chooseSelect(page, /what repayment tenure are you considering/i, "24");
  await chooseRadio(page, /informal or mixed income/i);
  await fillCurrency(page, /average monthly take-home income/i, 50000);
  await chooseRadio(page, /irregular or seasonal/i);
  await fillCurrency(page, /essential household expenses/i, 28000);
  await fillCurrency(page, /already pay each month/i, 18000);
  await fillCurrency(page, /how much emergency savings/i, 5000);
  await chooseRadio(page, /bank bounce/i);
  await fillCurrency(page, /lower-income month/i, 45000);
  await fillCurrency(page, /debt is still outstanding/i, 85000);
  await chooseRadio(page, /last 30 days/i);
  await chooseRadio(page, /immediate/i, /complete questionnaire/i);
}

export async function expectNoUnsafeDisplayText(page) {
  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toContain("?NaN");
  expect(bodyText).not.toContain("undefined");
  expect(bodyText).not.toContain("Infinity");
  expect(bodyText).not.toContain("[object Object]");
}
