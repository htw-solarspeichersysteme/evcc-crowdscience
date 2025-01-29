import { expect, test } from "@playwright/test";

import { LoginPage } from "./login.po";

test("has title", async ({ page }) => {
  await page.goto("/dashboard");

  const loginPage = new LoginPage(page);
  // Expect a title "to contain" a substring.
  await expect(loginPage.usernameInputfield).toBeVisible();
  await loginPage.usernameInputfield.fill("admin");
  await expect(loginPage.passwordInputfield).toBeVisible();
  await loginPage.passwordInputfield.fill("admin");
  await expect(loginPage.loginButton).toBeVisible();
  await loginPage.loginButton.click();
});
