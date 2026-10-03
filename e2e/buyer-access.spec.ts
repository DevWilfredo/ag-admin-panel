import { test, expect } from "./support/buyer-fixture";

const allowedNavigation = ["Dashboard", "Transactions", "Warehouses", "Inventory", "Documents", "Payments", "Data Analytics"];

test("shows only Buyer navigation and a role-derived profile", async ({ buyerPage: page }) => {
  for (const label of allowedNavigation) await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Messages" })).toHaveCount(0);
  await page.locator('button[aria-label$=" profile"]').click();
  await expect(page.getByText("Buyer - AgroTrust Backoffice")).toBeVisible();
});

test("allows a Buyer to open role-scoped analytics", async ({ buyerPage: page }) => {
  await page.goto("/data-analytics");
  await page.waitForURL(/\/data-analytics(?:\?|$)/);
  await expect(page.getByRole("link", { name: "Operations" })).toBeVisible();
  await expect(page.getByText("Admin analytics filters")).toHaveCount(0);
});

test("keeps Buyer permissions intact in the mobile navigation", async ({ buyerPage: page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  for (const label of allowedNavigation) await expect(page.getByRole("link", { name: label }).last()).toBeVisible();
});
