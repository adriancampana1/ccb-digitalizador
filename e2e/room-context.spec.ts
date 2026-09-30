import { test, expect } from "@playwright/test";
test("login, browse documents and switch room without leaking prior results", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Telefone").fill("43999999999");
  await page.getByLabel("Senha").fill("exemplo");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Documentos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Ata da reunião administrativa", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Minhas salas", exact: true }).click();
  await page
    .locator(".room-row")
    .filter({ hasText: "Jardim das Oliveiras" })
    .getByRole("button", { name: "Entrar", exact: true })
    .click();
  await expect(
    page.getByText("Ata da reunião administrativa — Jardim", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Ata da reunião administrativa", { exact: true }),
  ).toHaveCount(0);
});
