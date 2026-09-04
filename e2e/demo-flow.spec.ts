import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./support/admin-fixture";
import { loginAsBuyer } from "./support/buyer-fixture";

const demoOrderNumber = process.env.AGROTRUST_DEMO_ORDER_NUMBER;

async function openDemoOrder(page: import("@playwright/test").Page) {
  if (!demoOrderNumber) throw new Error("AGROTRUST_DEMO_ORDER_NUMBER is missing.");
  await page.getByRole("link", { name: "Transactions" }).first().click();
  await page.getByRole("textbox", { name: "Transaction number" }).fill(demoOrderNumber);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await page.getByText(demoOrderNumber, { exact: true }).first().click();
  await expect(page.getByText(demoOrderNumber, { exact: true }).first()).toBeVisible();
}

async function expectCompletedDemo(page: import("@playwright/test").Page) {
  await expect(page.getByLabel("Progress", { exact: true }).getByText("100% complete", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Key information").getByText(/^\d+\/\d+ uploaded$/)).toBeVisible();
  await expect(page.getByText("Settled", { exact: true })).toBeVisible();
  await expect(page.getByText(/AGROTRUST DEMO VESSEL/).first()).toBeVisible();
  await expect(page.getByText(/Puerto Cabello - DEMO POSITION/)).toBeVisible();
  await expect(page.getByLabel("Live vessel map")).toBeVisible();
  await expect(page.getByLabel("Warehouse location map")).toBeVisible();
  await expect(page.getByRole("link", { name: "Vessel tracker" }).last()).toBeVisible();
  await expect(page.getByRole("link", { name: "Warehouse tracker" }).last()).toBeVisible();
  await expect(page.getByText("MANUAL_POSITION", { exact: true })).toBeVisible();
  await expect(page.getByText("Funds Distributed", { exact: true }).first()).toBeVisible();
}

test("Buyer can review the complete populated demo flow", async ({ page }) => {
  await loginAsBuyer(page);
  await openDemoOrder(page);
  await expectCompletedDemo(page);
  await expect(page.getByRole("button", { name: /set manual position|retry tracking/i })).toHaveCount(0);
});

test("Admin can review the same demo and access tracking controls", async ({ page }) => {
  await loginAsAdmin(page);
  await openDemoOrder(page);
  await expectCompletedDemo(page);
  await expect(page.getByRole("button", { name: "Set manual position" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry tracking" })).toBeVisible();
  await page.getByRole("button", { name: "Preview location for B/L" }).hover();
  await expect(page.getByRole("link", { name: "View tracker" })).toBeVisible();
  await page.getByRole("button", { name: "Preview location for Inventory" }).hover();
  await expect(page.getByRole("link", { name: "Warehouse location" })).toBeVisible();
  await page.getByText("Alerts", { exact: true }).last().hover();
  await expect(page.getByRole("button", { name: "Close location preview" })).toHaveCount(0);
  const glassButton = page.getByRole("link", { name: "Vessel tracker" }).last();
  await expect(glassButton).toHaveCSS("backdrop-filter", /blur/);
});
