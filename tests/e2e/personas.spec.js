import { expect, test } from "@playwright/test";
import { expectNoUnsafeDisplayText, fillAnita, fillPriya, fillRavi } from "./helpers/journeys.js";

test.describe("persona journeys", () => {
  test("Priya completes questionnaire and receives BORROW", async ({ page }) => {
    await fillPriya(page);

    await expect(page.getByRole("heading", { name: /your borrowing assessment/i })).toBeFocused();
    await expect(page.getByRole("heading", { name: /this amount appears manageable/i })).toBeVisible();
    await expect(page.getByText(/recommended amount/i).first()).toBeVisible();
    await expect(page.getByText(/no critical repayment risks/i)).toBeVisible();
    await expectNoUnsafeDisplayText(page);
  });

  test("Ravi receives BORROW_LESS through adaptive business follow-ups", async ({ page }) => {
    await fillRavi(page);

    await expect(page.getByRole("heading", { name: /a smaller loan would be safer/i })).toBeVisible();
    await expect(page.getByText(/negotiate a safer amount or tenure/i)).toBeVisible();
    await expect(page.getByText(/emergency savings were not provided/i).first()).toBeVisible();
    await expectNoUnsafeDisplayText(page);
  });

  test("Anita receives DO_NOT_BORROW without rendering null as zero", async ({ page }) => {
    await fillAnita(page);

    await expect(page.getByRole("heading", { name: /borrowing is not recommended right now/i })).toBeVisible();
    await expect(page.getByText(/repayment bounce was reported within the last 30 days/i).first()).toBeVisible();
    await expect(page.getByText(/no borrowing amount is currently recommended/i).first()).toBeVisible();
    await expectNoUnsafeDisplayText(page);
  });
});
