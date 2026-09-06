import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { fillPriya } from "./helpers/journeys.js";

test.describe("accessibility", () => {
  test("landing and results have no axe violations", async ({ page }) => {
    await page.goto("/");
    let scan = await new AxeBuilder({ page }).analyze();
    expect(scan.violations).toEqual([]);

    await fillPriya(page);
    scan = await new AxeBuilder({ page }).analyze();
    expect(scan.violations).toEqual([]);

    await page.setViewportSize({ width: 320, height: 780 });
    scan = await new AxeBuilder({ page }).analyze();
    expect(scan.violations).toEqual([]);
    const tenureTable = page.getByRole("region", { name: "Tenure comparison" });
    await tenureTable.focus();
    await page.keyboard.press("ArrowRight");
    await expect(tenureTable).toBeFocused();
  });

  test("keyboard reaches details, print, and restart controls", async ({ page }) => {
    await fillPriya(page);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.getByText(/how we calculated this/i).first()).toBeVisible();

    const safeEmiSummary = page.locator("summary").filter({ hasText: /how we calculated this: safe emi/i });
    await safeEmiSummary.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("details[open]").filter({ hasText: /how we calculated this: safe emi/i }).getByText(/inputs used/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /print negotiation card/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /restart/i })).toBeVisible();
  });
});
