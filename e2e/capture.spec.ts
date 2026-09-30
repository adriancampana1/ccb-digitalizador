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
test("captures from a simulated video stream and stops tracks when closed", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = "#fff";
      ctx.fillRect(80, 40, 480, 400);
      const stream = canvas.captureStream(10);
      (window as any).testCameraStream = stream;
      return stream;
    };
    navigator.mediaDevices.enumerateDevices = async () => [];
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
  await expect
    .poll(() =>
      page
        .locator("video")
        .evaluate((video: HTMLVideoElement) => video.videoWidth),
    )
    .toBe(640);
  await page
    .getByRole("button", { name: "Capturar página", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Editar página 1" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Fechar câmera", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      (window as any).testCameraStream
        .getTracks()
        .every((t: MediaStreamTrack) => t.readyState === "ended"),
    ),
  ).toBe(true);
});
