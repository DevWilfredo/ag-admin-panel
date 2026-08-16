import { expect, test } from "@playwright/test";
import { loginAsBuyer } from "./support/buyer-fixture";

test("validates the login form without calling the API", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Email is required")).toBeVisible();
  await expect(page.getByText("Password is required")).toBeVisible();
});

test("redirects an anonymous visitor away from protected pages", async ({ page }) => {
  await page.goto("/transactions");
  await page.waitForURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("signs a Buyer in and ends the session cleanly", async ({ page }) => {
  await loginAsBuyer(page);
  const remoteLogout = page.waitForResponse(
    (response) => response.url().endsWith("/auth/logout"),
  );
  await page.getByRole("button", { name: "Log out" }).click({ force: true });
  await page.waitForURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await remoteLogout;
});
