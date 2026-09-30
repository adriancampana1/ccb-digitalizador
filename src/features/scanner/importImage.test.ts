// @vitest-environment node
import { it, expect, vi, afterEach } from "vitest";
import { importImage } from "./importImage";
afterEach(() => vi.unstubAllGlobals());
it("rejects excessive decoded dimensions before allocating a bitmap", async () => {
  const decode = vi.fn().mockRejectedValue(new Error("decode called"));
  vi.stubGlobal("createImageBitmap", decode);
  const header = new Uint8Array(24);
  header.set([137, 80, 78, 71, 13, 10, 26, 10]);
  new DataView(header.buffer).setUint32(16, 100000);
  new DataView(header.buffer).setUint32(20, 100000);
  await expect(
    importImage(new Blob([header], { type: "image/png" })),
  ).rejects.toThrow("60 megapixels");
  expect(decode).not.toHaveBeenCalled();
});
