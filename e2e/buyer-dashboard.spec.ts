import { test, expect } from "./support/buyer-fixture";

test("renders the Buyer dashboard from live, role-filtered data", async ({ buyerPage: page }) => {
  await expect(page.getByRole("heading", { name: "Quick Actions" })).toBeVisible();
  await expect(page.getByText("Open Documents", { exact: true })).toBeVisible();
  for (const metric of ["Visible Transactions", "Active Contracts", "Visible Volume"]) {
    await expect(page.getByText(metric, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Recent Transactions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent Activity" })).toBeVisible();
  await expect(page.getByText("Revenue Overview", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Create Transaction", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Open Analytics", { exact: true })).toHaveCount(0);
});

test("supports deterministic empty and error dashboard states", async ({ buyerPage: page }) => {
  await page.goto("/dashboard?state=empty");
  await expect(page.getByRole("heading", { name: "No dashboard data yet" })).toBeVisible();
  await page.goto("/dashboard?state=error");
  await expect(page.getByRole("heading", { name: "Dashboard data unavailable" })).toBeVisible();
});
