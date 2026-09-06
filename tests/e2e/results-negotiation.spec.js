import { expect, test } from "@playwright/test";
import { fillPriya } from "./helpers/journeys.js";

test.describe("results and negotiation card", () => {
  test("results order, explanations, APR prominence, card content, print CSS, and restart", async ({ page }) => {
    await fillPriya(page);

    const aprHeading = page.getByRole("heading", { name: /all-in apr estimate/i });
    const interestHeading = page.getByRole("heading", { name: /advertised interest-rate estimate/i });
    await expect(aprHeading).toBeVisible();
    await expect(interestHeading).toBeVisible();
    expect(await aprHeading.evaluate((apr, interest) => Boolean(apr.compareDocumentPosition(interest) & Node.DOCUMENT_POSITION_FOLLOWING), await interestHeading.elementHandle())).toBe(true);

    await expect(page.getByRole("img", { name: /requested amount .* borrower-safe amount .* lender-likely estimate/i })).toBeVisible();
    await expect(page.getByText(/not an approval estimate or safety recommendation/i).first()).toBeVisible();

    const details = page.getByText(/how we calculated this: safe emi/i);
    await details.click();
    await expect(page.getByText(/inputs used/i).first()).toBeVisible();
    await expect(page.getByText(/rule applied/i).first()).toBeVisible();

    const card = page.locator("#negotiation-card");
    await expect(card).toBeVisible();
    await expect(card.getByText(/educational affordability estimate/i)).toBeVisible();
    await expect(card.getByText(/share it only with people or institutions you trust/i)).toBeVisible();
    await expect(card.getByText(/key facts statement/i).first()).toBeVisible();
    await expect(card.getByText(/prepayment/i).first()).toBeVisible();
    await expect(card.getByText(/fixed or floating/i).first()).toBeVisible();

    await page.emulateMedia({ media: "print" });
    await expect(card).toBeVisible();
    await expect(page.locator("header")).toBeHidden();
    await expect(page.getByRole("button", { name: /print negotiation card/i })).toBeHidden();
    await page.emulateMedia({ media: "screen" });

    let printed = false;
    await page.evaluate(() => {
      window.print = () => { window.__printed = true; };
    });
    await page.getByRole("button", { name: /print negotiation card/i }).click();
    printed = await page.evaluate(() => window.__printed === true);
    expect(printed).toBe(true);

    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /restart/i }).click();
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
  });
});
