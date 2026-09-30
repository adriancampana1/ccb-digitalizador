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
test("a removed room keeps the draft available for local download without choosing another destination", async ({
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
  await page.getByLabel("Nome do documento").fill("Ata preservada");
  await page.evaluate(async () => {
    const { applyRooms, useRooms } =
      await import("/src/features/rooms/roomStore.ts");
    const { useSession } = await import("/src/features/auth/sessionStore.ts");
    applyRooms(
      useSession.getState().session!.sessionId,
      useRooms.getState().rooms.filter((r: any) => r.id !== "central"),
    );
  });
  await expect(
    page.getByText("A sala deste lote está indisponível.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enviar para a sala", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Baixar arquivo", exact: true }),
  ).toBeEnabled();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Baixar arquivo", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("Ata preservada.pdf");
});
