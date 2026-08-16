import { test, expect } from "./support/buyer-fixture";

const allowedNavigation = ["Dashboard", "Transactions", "Warehouses", "Inventory", "Documents", "Payments"];

test("shows only Buyer navigation and a role-derived profile", async ({ buyerPage: page }) => {
  for (const label of allowedNavigation) await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Data Analytics" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Messages" })).toHaveCount(0);
  await page.locator('button[aria-label$=" profile"]').click();
  await expect(page.getByText("Buyer - AgroTrust Backoffice")).toBeVisible();
});

test("blocks a Buyer from opening the analytics route directly", async ({ buyerPage: page }) => {
  await page.goto("/data-analytics");
  await page.waitForURL(/\/dashboard(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Dashboard" }).first()).toBeVisible();
});

test("keeps Buyer permissions intact in the mobile navigation", async ({ buyerPage: page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  for (const label of allowedNavigation) await expect(page.getByRole("link", { name: label }).last()).toBeVisible();
  await expect(page.getByRole("link", { name: "Data Analytics" })).toHaveCount(0);
});
