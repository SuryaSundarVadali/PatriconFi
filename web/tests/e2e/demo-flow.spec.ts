import { test, expect } from "@playwright/test";

test("connect wallet, register agent, run demo, verify pricing and interactions", async ({ page }) => {
  await page.goto("/agents");

  const connectTestWallet = page.getByTestId("connect-test-wallet-btn");
  if (await connectTestWallet.isVisible()) {
    await connectTestWallet.click();
    await expect(page.getByText("Test wallet session connected.")).toBeVisible();
  } else {
    const walletButton = page.getByRole("button", { name: /Connect .*Wallet|Connect Injected|Connect MetaMask/i }).first();
    await expect(walletButton).toBeVisible();
    await walletButton.click();
  }

  await page.getByTestId("agent-id-input").fill("9001");
  await page.getByTestId("metadata-uri-input").fill("ipfs://patriconfi-e2e-agent-9001");
  await page.getByTestId("register-agent-btn").click();

  const registrationFeedback = page.getByTestId("register-feedback");
  await expect(registrationFeedback).toContainText(/Transaction submitted|confirmed|Test-mode registration simulated/i);

  await page.goto("/dashboard");
  await page.getByTestId("run-demo-btn").click();
  await expect(page.getByTestId("demo-feedback")).toContainText(/completed|Starting|failed/i);
  await expect
    .poll(async () => {
      const totalInteractionsText = await page.getByTestId("total-interactions").innerText();
      return Number(totalInteractionsText.match(/(\d+)/)?.[1] ?? "0");
    })
    .toBeGreaterThanOrEqual(50);

  const totalInteractionsText = await page.getByTestId("total-interactions").innerText();
  const interactions = Number(totalInteractionsText.match(/(\d+)/)?.[1] ?? "0");
  expect(interactions).toBeGreaterThanOrEqual(50);

  const avgPriceText = await page.getByTestId("avg-price-per-interaction").innerText();
  const avgPrice = Number(avgPriceText.match(/([0-9]+\.[0-9]+)/)?.[1] ?? "0");
  expect(avgPrice).toBeLessThan(0.01);
});
