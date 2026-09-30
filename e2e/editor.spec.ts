import { test, expect } from "@playwright/test";
test("imports two pages, reviews rotation, reorders and downloads a PDF", async ({
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
    .setInputFiles(["src/test/images/page.jpg", "src/test/images/page.jpg"]);
  await expect(
    page.getByRole("button", { name: "Editar página 2", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Girar 0°" }).click();
  await expect(page.getByRole("button", { name: "Girar 90°" })).toBeVisible();
  await page.getByRole("button", { name: "Mover página 2 para antes" }).click();
  await page.getByRole("button", { name: "Resultado", exact: true }).click();
  await expect(page.getByAltText("Página corrigida")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  await page.getByLabel("Nome do documento").fill("Ata de teste");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Baixar arquivo", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("Ata de teste.pdf");
});
