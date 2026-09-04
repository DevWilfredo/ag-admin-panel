import { test, expect } from "./support/admin-fixture";

test("exposes the complete ADMIN navigation and management entry points", async ({ adminPage: page }) => {
  for (const label of ["Dashboard", "Transactions", "Warehouses", "Inventory", "Documents", "Payments", "Users", "Data Analytics"]) {
    await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
  }
  await page.goto("/transactions");
  await expect(page.getByRole("button", { name: "New transaction" })).toBeVisible();
  await page.goto("/warehouses");
  await expect(page.getByRole("button", { name: "New warehouse" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" }).first()).toBeVisible();
  await page.goto("/inventory");
  await expect(page.getByRole("button", { name: "Record intake" })).toBeVisible();
  await page.goto("/documents");
  await expect(page.getByRole("button", { name: "Upload document" }).first()).toBeEnabled();
  await page.goto("/payments");
  await expect(
    page
      .getByRole("button", { name: "Create payment record" })
      .or(page.getByRole("button", { name: "Mark sent" }))
      .or(page.getByText("Funds distributed", { exact: true })),
  ).toBeVisible();
  await page.goto("/users");
  await expect(page.getByRole("button", { name: "New user" })).toBeVisible();
});

test("exposes every functional ADMIN quick action", async ({ adminPage: page }) => {
  await page.goto("/dashboard");

  for (const action of [
    "Create Transaction",
    "Open Users",
    "Open Analytics",
    "Open Documents",
  ]) {
    await expect(page.getByText(action, { exact: true })).toBeVisible();
  }

  await expect(page.getByRole("link", { name: "Open user management" })).toHaveAttribute("href", "/users");
});

test("renders all live analytics modules without mock price data", async ({ adminPage: page }) => {
  await page.goto("/data-analytics");
  await expect(page.getByRole("link", { name: "Export report" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Shipment Status Distribution" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Order Execution Timelines" })).toBeVisible();
  await expect(page.getByLabel("Operations summary")).toContainText("Total orders");
  await page.getByRole("link", { name: "Flow" }).click();
  await expect(page.getByRole("heading", { name: "Capital Flow" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Transaction Volume Over Time" })).toBeVisible();
  await page.getByRole("link", { name: "Market" }).click();
  await expect(page.getByRole("heading", { name: "Commodity Exposure" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Geographic Flow Overview" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Price Evolution" })).toHaveCount(0);
});

test("opens ADMIN forms without submitting mutations", async ({ adminPage: page }) => {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Create transaction" }).click();
  await expect(page).toHaveURL(/\/transactions\?action=create/);
  await expect(page.getByRole("dialog")).toContainText("Create transaction");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.goto("/users");
  await page.getByRole("button", { name: "New user" }).click();
  await expect(page.getByRole("dialog")).toContainText("Create user");
  await expect(page.getByLabel("Full name")).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.goto("/warehouses");
  await page.getByRole("button", { name: "New warehouse" }).click();
  await expect(page.getByRole("dialog")).toContainText("New warehouse");
  await expect(page.getByLabel("Address search")).toBeVisible();
  await expect(page.getByRole("button", { name: "Search address" })).toBeVisible();
  await expect(page.getByLabel("Latitude")).toBeVisible();
  await expect(page.getByLabel("Longitude")).toBeVisible();
  await expect(page.getByText("Click the map to place the warehouse.")).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
});
