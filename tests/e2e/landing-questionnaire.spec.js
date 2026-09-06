import { expect, test } from "@playwright/test";
import { fillCurrency, startAssessment } from "./helpers/journeys.js";

test.describe("landing and questionnaire", () => {
  test("landing screen has privacy copy, accessible controls, and no approval guarantee", async ({ page }) => {
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto("/");

    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
    await expect(page.getByText(/not saved or sent to a server/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /start assessment/i })).toBeVisible();
    await expect(page.getByText(/guaranteed approval|instant approval/i)).toHaveCount(0);
    await expect(page.getByRole("link", { name: /skip to content/i })).toHaveAttribute("href", "#main-content");
    expect(consoleErrors).toEqual([]);
  });

  test("required validation, malformed currency, Enter submit, and refresh privacy", async ({ page }) => {
    await startAssessment(page);

    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByText(/answer this question to continue/i)).toBeVisible();

    await page.getByLabel(/what will this borrowing be used for/i).selectOption("home_repair");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: /how much do you want to borrow/i })).toBeFocused();

    await page.getByLabel(/how much do you want to borrow/i).fill("abc");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByLabel(/how much do you want to borrow/i)).toHaveAttribute("aria-invalid", "true");

    const amount = page.getByLabel(/how much do you want to borrow/i);
    await amount.fill("");
    await amount.pressSequentially("-100");
    await amount.press("Enter");
    await expect(amount).toHaveAttribute("aria-invalid", "true");
    await expect(amount).toHaveAccessibleDescription(/enter a requested amount greater than zero/i);
    await expect(amount).toHaveValue("-100");

    await page.getByLabel(/how much do you want to borrow/i).fill("150000");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: /what repayment tenure/i })).toBeFocused();

    await page.reload();
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
  });

  test("back navigation follows the visited adaptive path and preserves answers", async ({ page }) => {
    await startAssessment(page);
    await page.getByLabel(/what will this borrowing be used for/i).selectOption("business");
    await page.getByRole("button", { name: /continue/i }).click();
    await fillCurrency(page, /how much do you want to borrow/i, 200000);
    await page.getByLabel(/what repayment tenure/i).selectOption("12");
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByLabel(/self-employed/i).click();
    await page.getByRole("button", { name: /continue/i }).click();
    await fillCurrency(page, /average monthly take-home income/i, 60000);
    await page.getByLabel(/irregular or seasonal/i).click();
    await page.getByRole("button", { name: /continue/i }).click();
    await fillCurrency(page, /essential household expenses/i, 25000);
    await fillCurrency(page, /already pay each month/i, 5000);
    await fillCurrency(page, /how much emergency savings/i, 25000);
    await page.getByLabel(/bank bounce/i).click();
    await page.getByRole("button", { name: /continue/i }).click();

    await expect(page.getByRole("heading", { name: /lower-income month/i })).toBeVisible();
    await page.getByRole("button", { name: /back/i }).click();
    await expect(page.getByLabel(/bank bounce/i)).toBeChecked();
  });
});

