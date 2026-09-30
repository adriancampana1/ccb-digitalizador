import { test, expect } from "@playwright/test";
test("denied camera keeps image import available", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Denied", "NotAllowedError");
    };
  });
  await page.goto("/");
  await page.getByLabel("Telefone").fill("43999999999");
  await page.getByLabel("Senha", { exact: true }).fill("exemplo");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page
    .getByRole("link", { name: "Digitalizar", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Abrir câmera", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("permissão");
  await expect(page.getByLabel("Importar imagens")).toBeEnabled();
});
