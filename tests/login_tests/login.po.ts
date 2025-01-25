import type { Page } from "playwright/test";

export class LoginPage {
  readonly usernameInputfield = this.page.getByLabel("Username (Email)");
  readonly passwordInputfield = this.page.getByLabel("Password");
  readonly loginButton = this.page.getByRole("button", { name: "Login" });

  constructor(readonly page: Page) {}
}
