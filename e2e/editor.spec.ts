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
test("late edge detection cannot restore a page removed while it was running", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      delayed = new Set<number>();
      postMessage(data: any) {
        if (data.type === "detect" && (window as any).delayDetection) {
          this.delayed.add(data.id);
          (window as any).delayDetection = false;
        }
        super.postMessage(data);
      }
      set onmessage(handler: any) {
        super.onmessage = (event) => {
          if (this.delayed.has(event.data.id)) {
            setTimeout(() => {
              event.data.result = [
                { x: 0, y: 0 },
                { x: 900, y: 0 },
                { x: 900, y: 1200 },
                { x: 0, y: 1200 },
              ];
              handler(event);
              (window as any).delayedDelivered = true;
            }, 800);
          } else handler(event);
        };
      }
    } as any;
  });
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
    .setInputFiles("src/test/images/documento-sintetico.jpg");
  await expect(
    page.getByRole("button", { name: "Editar página 1" }),
  ).toBeVisible();
  await page.evaluate(() => ((window as any).delayDetection = true));
  await page
    .getByRole("button", { name: "Detectar bordas", exact: true })
    .click();
  page.on("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Remover página 1", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => (window as any).delayedDelivered))
    .toBe(true);
  await expect(
    page.getByRole("button", { name: "Editar página 1" }),
  ).toHaveCount(0);
});
