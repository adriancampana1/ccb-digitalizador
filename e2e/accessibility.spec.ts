import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
test("responsive screens remain usable at desktop, mobile and narrow widths", async ({
  page,
}) => {
  await mkdir(".impeccable/review", { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: ".impeccable/review/login-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("Telefone").fill("43999999999");
  await page.getByLabel("Senha", { exact: true }).fill("exemplo");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByText("Ata da reunião administrativa", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".impeccable/review/mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Digitalizar", exact: true })
    .last()
    .click();
  await page
    .getByLabel("Importar imagens")
    .setInputFiles("src/test/images/documento-sintetico.jpg");
  await expect(
    page.getByRole("button", { name: "Editar página 1" }),
  ).toBeVisible();
  await page.getByLabel("Nome do documento").fill("Registro da reunião");
  await page.screenshot({
    path: ".impeccable/review/scanner-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: ".impeccable/review/scanner-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.screenshot({
    path: ".impeccable/review/narrow.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Canto superior esquerdo" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "Canto superior esquerdo" }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Escolher pasta", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Escolher pasta", exact: true }),
  ).toBeFocused();
});
