// @vitest-environment node
import { it, expect, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildFiles, sanitizeFileName } from "./export";
import type { ScanPage } from "./types";
// Tiny synthetic JPEGs from a deterministic fixture; renderer is the expensive browser boundary.
import { readFileSync } from "node:fs";
vi.mock("./processing/engine", () => ({
  renderPage: async (page: ScanPage) => page.source,
}));
const bytes = readFileSync("src/test/images/page.jpg");
const makePage = (id: string) =>
  ({
    id,
    source: new Blob([bytes]),
    width: 10,
    height: 20,
    edit: { corners: [], rotation: 0, mode: "color", contrast: 1 },
  }) as unknown as ScanPage;
it("builds a multipage PDF and reports progress in page order", async () => {
  const progress: number[] = [];
  const files = await buildFiles(
    [makePage("first"), makePage("second")],
    "Ata",
    "pdf",
    (n) => progress.push(n),
  );
  expect(files).toHaveLength(1);
  const pdf = await PDFDocument.load(await files[0].arrayBuffer());
  expect(pdf.getPageCount()).toBe(2);
  expect(progress).toEqual([1, 2]);
});
it("numbers JPEG files and keeps readable accents in safe filenames", async () => {
  const files = await buildFiles(
    [makePage("a"), makePage("b")],
    "Ata da reunião",
    "jpeg",
  );
  expect(files.map((f) => f.name)).toEqual([
    "Ata da reunião-1.jpg",
    "Ata da reunião-2.jpg",
  ]);
  expect(sanitizeFileName("../Ata: reunião?")).toBe("Ata reunião");
  expect(sanitizeFileName("  ")).toBe("Documento");
});
