import { test, expect } from "@playwright/test";
test("imports, sends, finds and downloads a document in the selected room", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Telefone").fill("43999999999");
  await page.getByLabel("Senha", { exact: true }).fill("exemplo");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page
    .getByRole("link", { name: "Digitalizar", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Importar imagens")
    .setInputFiles("src/test/images/page.jpg");
  await expect(
    page.getByRole("button", { name: "Editar página 1" }),
  ).toBeVisible();
  await page.getByLabel("Nome do documento").fill("Jornada sintética");
  await page
    .getByRole("button", { name: "Enviar para a sala", exact: true })
    .click();
  await expect(
    page.getByText("Documento enviado para a sala.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ver documentos", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: "Jornada sintética" });
  await expect(row).toBeVisible();
  const download = page.waitForEvent("download");
  await row.getByRole("button", { name: /Baixar/ }).click();
  expect((await download).suggestedFilename()).toBe("Jornada sintética.pdf");
  await page.getByRole("link", { name: "Minhas salas", exact: true }).click();
  await page
    .locator(".room-row")
    .filter({ hasText: "Jardim das Oliveiras" })
    .getByRole("button", { name: "Entrar", exact: true })
    .click();
  await expect(
    page.getByText("Jornada sintética", { exact: true }),
  ).not.toBeVisible();
  await page
    .getByRole("link", { name: "Minha conta", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page.getByLabel("Senha", { exact: true })).toBeVisible();
});
