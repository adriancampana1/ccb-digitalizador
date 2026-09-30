import { test, expect } from "@playwright/test";
test("provider catalog drives credential fields and OAuth never fakes a connection", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Telefone").fill("43999999999");
  await page.getByLabel("Senha", { exact: true }).fill("exemplo");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("link", { name: "Minhas salas", exact: true }).click();
  await page.getByRole("link", { name: "Criar sala", exact: true }).click();
  await page.getByLabel("Nome da sala").fill("Sala de teste");
  await page.getByLabel("SharePoint", { exact: false }).check();
  await expect(page.getByLabel("Client secret")).toHaveAttribute(
    "type",
    "password",
  );
  await page.getByLabel("Google Drive", { exact: false }).check();
  await expect(page.getByLabel("Client secret")).toHaveCount(0);
  await page.getByRole("button", { name: "Criar sala", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sala de teste", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Aguardando conexão", { exact: true }),
  ).toBeVisible();
});
