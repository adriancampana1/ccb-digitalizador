import { test, expect } from "@playwright/test";
test("login is accessible before private navigation", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Telefone")).toBeVisible();
  await page.getByLabel("Telefone").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Senha")).toBeFocused();
});
