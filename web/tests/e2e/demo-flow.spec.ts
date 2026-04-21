import { test, expect } from "@playwright/test";

test("demo flow renders landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("PatriconFi")).toBeVisible();
});
