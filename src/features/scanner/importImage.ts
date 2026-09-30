import { imageDimensions } from "./imageDimensions";
import { validateImage, MAX_SIDE } from "./limits";
import type { ScanPage } from "./types";
import { fullQuad } from "./processing/geometry";
export async function importImage(file: Blob): Promise<ScanPage> {
  validateImage(file);
  const dimensions = await imageDimensions(file);
  if (
    !dimensions.width ||
    !dimensions.height ||
    dimensions.width * dimensions.height > 60_000_000
  )
    throw new Error(
      "Imagem muito grande para editar com segurança. Reduza para até 60 megapixels.",
    );
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "Não foi possível ler a imagem. Selecione um JPG ou PNG válido.",
    );
  }
  try {
    if (
      !bitmap.width ||
      !bitmap.height ||
      bitmap.width * bitmap.height > 60_000_000
    )
      throw new Error(
        "Imagem muito grande para editar com segurança. Reduza para até 60 megapixels.",
      );
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale),
      height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Este navegador não permite processar imagens.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    const source = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b
            ? resolve(b)
            : reject(new Error("Não foi possível importar a imagem.")),
        "image/jpeg",
        0.95,
      ),
    );
    return {
      id: crypto.randomUUID(),
      source,
      width,
      height,
      edit: {
        corners: fullQuad(width, height),
        rotation: 0,
        mode: "color",
        contrast: 1,
      },
    };
  } finally {
    bitmap.close();
  }
}
