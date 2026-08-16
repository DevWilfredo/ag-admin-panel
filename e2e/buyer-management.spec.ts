import { test, expect } from "./support/buyer-fixture";

test("loads warehouses without management controls", async ({ buyerPage: page }) => {
  await page.goto("/warehouses");
  await expect(page.getByRole("heading", { name: "Warehouses" }).first()).toBeVisible();
  for (const action of ["New warehouse", "Edit", "Delete"]) {
    await expect(page.getByRole("button", { name: action })).toHaveCount(0);
  }
  await expect(page.locator("table").or(page.getByText(/No warehouses found/i))).toBeVisible();
});

test("loads inventory read-only", async ({ buyerPage: page }) => {
  await page.goto("/inventory");
  await expect(page.getByRole("heading", { name: "Inventory" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Record intake" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Manage" })).toHaveCount(0);
  await expect(page.locator("table").or(page.getByRole("heading", { name: "No inventory records yet" }))).toBeVisible();
});

test("lets a Buyer prepare a document upload without mutating data", async ({ buyerPage: page }) => {
  await page.goto("/documents");
  await expect(page.getByRole("heading", { name: "Documents" }).first()).toBeVisible();
  const upload = page.getByRole("button", { name: "Upload document" }).first();
  await expect(upload).toBeEnabled();
  await upload.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator('input[type="file"]')).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.getByRole("button", { name: /update status|delete/i })).toHaveCount(0);
});

test("loads Buyer payment visibility without settlement controls", async ({ buyerPage: page }) => {
  await page.goto("/payments");
  await expect(page.getByRole("heading", { name: "Payments & Escrow" }).first()).toBeVisible();
  for (const action of ["Create payment record", "Mark sent", "Mark received", "Distribute funds"]) {
    await expect(page.getByRole("button", { name: action })).toHaveCount(0);
  }
  await expect(
    page
      .getByText(/No payment record for this order/i)
      .or(page.getByRole("heading", { name: /We couldn.t load this information/i }))
      .or(page.getByText("SETTLED", { exact: true })),
  ).toBeVisible();
});
