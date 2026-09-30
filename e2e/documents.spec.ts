import { test, expect } from "@playwright/test";
test("search and folder CRUD use the current room", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Telefone").fill("43999999999");
  await page.getByLabel("Senha", { exact: true }).fill("exemplo");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByLabel("Buscar documentos").fill("manutenção");
  await expect(
    page.getByRole("row").filter({ hasText: "Relatório de manutenção" }),
  ).toBeVisible();
  await expect(
    page.getByText("Ata da reunião administrativa", { exact: true }),
  ).not.toBeVisible();
  await page.getByRole("link", { name: "Pastas", exact: true }).first().click();
  await page.getByRole("button", { name: "Nova pasta", exact: true }).click();
  await page.getByLabel("Nome da pasta").fill("Teste acentuação");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Teste acentuação Abrir pasta" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Excluir pasta Teste acentuação",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Excluir pasta", exact: true })
    .click();
  await expect(
    page.getByText("Teste acentuação", { exact: true }),
  ).not.toBeVisible();
});
