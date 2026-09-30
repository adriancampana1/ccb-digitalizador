import { beforeEach, it, expect, vi } from "vitest";
import { submitBatch } from "./upload";
import { createBatch, useBatch } from "./batchStore";
import { installSession, clearSession } from "../auth/sessionStore";
import { applyRooms, captureRoomContext, useRooms } from "../rooms/roomStore";
import { uploadDocuments } from "../documents/documentApi";
import { buildFiles } from "./export";
import { ApiError } from "../../shared/api/error";
import type { Room } from "../../shared/api/contracts";
vi.mock("../documents/documentApi", () => ({ uploadDocuments: vi.fn() }));
vi.mock("./export", () => ({ buildFiles: vi.fn() }));
const input = { name: "Ata", format: "pdf" as const, folderPath: "Atas/2026" };
function batch() {
  const session = installSession({
    accessToken: "synthetic",
    name: "Teste",
    phone: "43999999999",
    canCreateRooms: true,
  } as any);
  applyRooms(session.sessionId, [
    {
      id: "a",
      connectionStatus: "CONNECTED",
      storageProvider: "google_drive",
    } as Room,
  ]);
  const batch = createBatch(captureRoomContext());
  batch.pages = [
    {
      id: "p",
      source: new Blob(["synthetic"]),
      width: 10,
      height: 20,
      edit: { corners: [], rotation: 0, mode: "color", contrast: 1 },
    } as any,
  ];
  useBatch.setState({ batch });
  return batch;
}
beforeEach(() => {
  vi.resetAllMocks();
  clearSession();
  vi.mocked(buildFiles).mockResolvedValue([new File(["synthetic"], "Ata.pdf")]);
  vi.mocked(uploadDocuments).mockResolvedValue([]);
});
it("makes only one attempt on timeout and keeps pages for recovery", async () => {
  const original = batch();
  vi.mocked(uploadDocuments).mockRejectedValue(
    new ApiError("Timeout", "timeout"),
  );
  const result = await submitBatch(original, input);
  expect(result.status).toBe("uncertain");
  expect(uploadDocuments).toHaveBeenCalledOnce();
  expect(vi.mocked(uploadDocuments).mock.calls[0][0].storageProvider).toBe(
    "google_drive",
  );
  expect(useBatch.getState().batch?.pages).toHaveLength(1);
});
it("rejects double submit while processing", async () => {
  const original = batch();
  let finish!: (files: File[]) => void;
  vi.mocked(buildFiles).mockImplementation(
    () =>
      new Promise((r) => {
        finish = r;
      }),
  );
  const first = submitBatch(original, input);
  const second = await submitBatch(original, input);
  expect(second.status).toBe("failed");
  finish([new File(["synthetic"], "Ata.pdf")]);
  expect((await first).status).toBe("success");
  expect(uploadDocuments).toHaveBeenCalledOnce();
});
it("never sends after the active room changes during processing", async () => {
  const original = batch();
  vi.mocked(buildFiles).mockImplementation(async () => {
    useRooms.setState({ activeRoomId: "b" });
    return [new File(["synthetic"], "Ata.pdf")];
  });
  expect((await submitBatch(original, input)).status).toBe("failed");
  expect(uploadDocuments).not.toHaveBeenCalled();
  expect(useBatch.getState().batch?.context.roomId).toBe("a");
});
it("does not resurrect a batch when the session expires during upload", async () => {
  const original = batch();
  vi.mocked(uploadDocuments).mockImplementation(async () => {
    clearSession();
    throw new ApiError("Sessão expirada", "http", 401);
  });
  await submitBatch(original, input);
  expect(useBatch.getState().batch).toBeNull();
});
