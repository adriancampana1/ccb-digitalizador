import { test, expect } from "@playwright/test";
test("timeout preserves the batch and draft while the user checks documents", async ({
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
  await page.getByLabel("Nome do documento").fill("Preservar esta ata");
  await page
    .getByRole("button", { name: "Escolher pasta", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Atas e reuniões Abrir pasta" })
    .click();
  await page
    .getByRole("button", { name: "Selecionar esta pasta", exact: true })
    .click();
  await page.evaluate(async () => {
    const { client } = await import("/src/shared/api/client.ts");
    const adapter = client.defaults.adapter as any;
    (window as any).uploadAttempts = 0;
    client.defaults.adapter = async (config: any) => {
      if (config.url === "/document" && config.method === "post") {
        (window as any).uploadAttempts++;
        throw {
          isAxiosError: true,
          code: "ECONNABORTED",
          message: "synthetic timeout",
        };
      }
      return adapter(config);
    };
  });
  await page
    .getByRole("button", { name: "Enviar para a sala", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível confirmar",
  );
  await expect(
    page.getByRole("button", { name: "Editar página 1" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Conferir documentos", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Digitalizar", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Nome do documento")).toHaveValue(
    "Preservar esta ata",
  );
  await expect(page.locator(".destination")).toContainText("Atas e reuniões");
  expect(await page.evaluate(() => (window as any).uploadAttempts)).toBe(1);
});
