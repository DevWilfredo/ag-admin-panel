import { test, expect } from "./support/buyer-fixture";

test("lists, filters, opens, and clears a Buyer-visible transaction", async ({ buyerPage: page }) => {
  await page.goto("/transactions");
  await expect(page.getByRole("heading", { name: "Transactions" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "New order" })).toHaveCount(0);
  const auditedOrderId = process.env.AGROTRUST_AUDIT_ORDER_ID;
  const firstOrder = auditedOrderId
    ? page.locator(`a[href*="orderId=${auditedOrderId}"]`).first()
    : page.locator('a[href*="orderId="]').filter({ hasNotText: "Closed" }).first();
  await expect(firstOrder).toBeVisible();
  const orderNumber = (await firstOrder.locator("h3").textContent())?.trim();
  expect(orderNumber).toBeTruthy();
  await page.getByPlaceholder("Search order number").fill(orderNumber!);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await page.waitForURL(/orderNumber=/);
  await expect(page.getByText(orderNumber!, { exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "Clear" }).click();
  const detailOrder = auditedOrderId
    ? page.locator(`a[href*="orderId=${auditedOrderId}"]`).first()
    : page.locator('a[href*="orderId="]').filter({ hasNotText: "Closed" }).first();
  await detailOrder.click();
  for (const heading of ["Documents", "Payment", "Audit Timeline", "Vessel tracking"]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  await expect(page.getByText("Lifecycle control", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Advance stage" })).toBeVisible();
  await expect(page.getByRole("button", { name: /assign vessel|update position|retry tracking/i })).toHaveCount(0);
  await expect(page.getByText(/Live position pending|Live vessel position/i)).toBeVisible();
});

test("renders transaction empty and error branches", async ({ buyerPage: page }) => {
  await page.goto("/transactions?state=empty");
  await expect(page.getByText("No transactions found")).toBeVisible();
  await page.goto("/transactions?state=error");
  await expect(page.getByText("Transactions unavailable")).toBeVisible();
});
