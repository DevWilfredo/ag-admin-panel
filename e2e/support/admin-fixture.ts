import { expect, test as base, type Page } from "@playwright/test";
import { getAdminCredentials } from "./environment";

export async function loginAsAdmin(page: Page) {
  const credentials = getAdminCredentials();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByLabel("Email").fill(credentials.email);
  await page.locator("#password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Dashboard" }).first()).toBeVisible();
}

export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ page }, provide) => { await loginAsAdmin(page); await provide(page); },
});
export { expect } from "@playwright/test";
