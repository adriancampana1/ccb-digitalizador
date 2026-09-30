import { it, expect, vi, afterEach } from "vitest";
import { startCamera, stopCamera } from "./camera";
afterEach(() => vi.unstubAllGlobals());
it("stops every track", () => {
  const a = vi.fn(),
    b = vi.fn();
  stopCamera({
    getTracks: () => [{ stop: a }, { stop: b }],
  } as unknown as MediaStream);
  expect(a).toHaveBeenCalledOnce();
  expect(b).toHaveBeenCalledOnce();
});
it("requests rear camera and propagates denied permission", async () => {
  const getUserMedia = vi
    .fn()
    .mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
  await expect(startCamera()).rejects.toMatchObject({
    name: "NotAllowedError",
  });
  expect(getUserMedia).toHaveBeenCalledWith({
    audio: false,
    video: { facingMode: { ideal: "environment" } },
  });
});
