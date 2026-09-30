import { PDFDocument } from "pdf-lib";
import type { ScanPage, OutputFormat } from "./types";
import { renderPage } from "./processing/engine";
export function sanitizeFileName(name: string) {
  return (
    name
      // eslint-disable-next-line no-control-regex -- strip unsafe filename control characters
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .replace(/^\.+/, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "Documento"
  );
}
export async function buildFiles(
  pages: ScanPage[],
  name: string,
  format: OutputFormat,
  onProgress?: (completed: number, total: number) => void,
  originals = false,
): Promise<File[]> {
  if (!pages.length) throw new Error("Adicione pelo menos uma página.");
  const base = sanitizeFileName(name);
  const pdf = format === "pdf" ? await PDFDocument.create() : null;
  const files: File[] = [];
  for (const [index, page] of pages.entries()) {
    const image = originals ? page.source : await renderPage(page);
    if (pdf) {
      const jpg = await pdf.embedJpg(await image.arrayBuffer());
      const size = [jpg.width * 0.75, jpg.height * 0.75] as [number, number];
      pdf
        .addPage(size)
        .drawImage(jpg, { x: 0, y: 0, width: size[0], height: size[1] });
    } else
      files.push(
        new File([image], `${base}-${index + 1}.jpg`, { type: "image/jpeg" }),
      );
    onProgress?.(index + 1, pages.length);
  }
  if (pdf)
    files.push(
      new File([new Uint8Array(await pdf.save())], `${base}.pdf`, {
        type: "application/pdf",
      }),
    );
  return files;
}
