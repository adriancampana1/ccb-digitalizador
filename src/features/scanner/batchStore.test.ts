import { describe, it, expect } from "vitest";
import { createBatch, addPage } from "./batchStore";
import { validateImage } from "./limits";
import type { ScanPage } from "./types";
const ctx = {
  sessionId: "s",
  accessToken: "synthetic",
  roomId: "r",
  storageProvider: "google_drive",
};
const page = {
  id: "one",
  source: new Blob(),
  width: 10,
  height: 10,
  edit: {
    corners: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ],
    rotation: 0,
    mode: "color",
    contrast: 1,
  },
} as ScanPage;
describe("batch limits", () => {
  it("accepts 20 pages and rejects the next without mutating the batch", () => {
    let batch = createBatch(ctx);
    for (let i = 0; i < 20; i++)
      batch = addPage(batch, { ...page, id: String(i) });
    expect(batch.pages).toHaveLength(20);
    expect(() => addPage(batch, page)).toThrow("20");
    expect(batch.pages).toHaveLength(20);
  });
  it("rejects oversized images before decoding", () => {
    expect(() =>
      validateImage(
        new Blob([new Uint8Array(20_000_001)], { type: "image/jpeg" }),
      ),
    ).toThrow("20 MB");
  });
  it("rejects empty or unsupported files", () => {
    expect(() => validateImage(new Blob([], { type: "image/jpeg" }))).toThrow();
    expect(() =>
      validateImage(new Blob(["text"], { type: "text/plain" })),
    ).toThrow();
  });
});
it("warns before discarding an imported PDF on room change", async () => {
  const { useBatch } = await import("./batchStore");
  const { switchRoom, useRooms } = await import("../rooms/roomStore");
  const { vi } = await import("vitest");
  const confirmation = vi.spyOn(window, "confirm").mockReturnValue(false);
  const room = {
    id: "b",
    connectionStatus: "CONNECTED",
    storageProvider: "google_drive",
  } as any;
  useRooms.setState({ rooms: [room] });
  useBatch.setState({
    batch: {
      ...createBatch(ctx),
      importedPdf: new File(["%PDF-"], "ata.pdf", { type: "application/pdf" }),
    } as any,
  });
  expect(await switchRoom(room)).toBe(false);
  expect(confirmation).toHaveBeenCalledOnce();
  confirmation.mockRestore();
  useBatch.setState({ batch: null });
});
