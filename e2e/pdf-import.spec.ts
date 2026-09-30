import { test, expect } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
test("retains an imported PDF across navigation and uploads its unchanged bytes in demo", async ({
  page,
}) => {
  const pdf = await PDFDocument.create();
  pdf.addPage([200, 300]);
  const original = Buffer.from(await pdf.save());
  await page.goto("/");
  await page.getByLabel("Telefone").fill("43999999999");
  await page.getByLabel("Senha", { exact: true }).fill("exemplo");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page
    .getByRole("link", { name: "Digitalizar", exact: true })
    .first()
    .click();
  await page.getByText("Enviar um PDF existente", { exact: true }).click();
  await page
    .getByLabel("Importar PDF", { exact: true })
    .setInputFiles({
      name: "Ata importada.pdf",
      mimeType: "application/pdf",
      buffer: original,
    });
  await expect(page.getByLabel("Nome do documento")).toHaveValue(
    "Ata importada",
  );
  await page
    .getByRole("link", { name: "Documentos", exact: true })
    .first()
    .click();
  await page
    .getByRole("link", { name: "Digitalizar", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Nome do documento")).toHaveValue(
    "Ata importada",
  );
  await page
    .getByRole("button", { name: "Enviar para a sala", exact: true })
    .click();
  await page.getByRole("link", { name: "Ver documentos", exact: true }).click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("row")
    .filter({ hasText: "Ata importada" })
    .getByRole("button", { name: "Baixar Ata importada", exact: true })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("Ata importada.pdf");
  expect(await readFile((await file.path())!)).toEqual(original);
});
