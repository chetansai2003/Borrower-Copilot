import { expect, test } from "@playwright/test";
import { fillPriya } from "./helpers/journeys.js";

test.describe("privacy and responsive behavior", () => {
  test("borrower answers stay out of storage, cookies, URLs, and API requests", async ({ page }) => {
    const suspiciousRequests = [];
    page.on("request", (request) => {
      const url = request.url();
      if (/150000|200000|45000|90000/.test(url) || request.method() !== "GET") {
        suspiciousRequests.push({ method: request.method(), url });
      }
    });

    await fillPriya(page);

    expect(page.url()).not.toMatch(/150000|200000|45000|90000/);
    expect(await page.evaluate(() => localStorage.length)).toBe(0);
    expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
    expect(await page.context().cookies()).toEqual([]);
    expect(suspiciousRequests).toEqual([]);
  });

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 }
  ]) {
    test(`no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await fillPriya(page);
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    });
  }
});
