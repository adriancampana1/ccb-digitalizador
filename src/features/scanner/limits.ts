export const MAX_PAGES = 20,
  MAX_IMAGE_BYTES = 20_000_000,
  MAX_PDF_BYTES = 25_000_000,
  MAX_SIDE = 3000;
export function validateImage(file: Blob) {
  if (file.size > MAX_IMAGE_BYTES)
    throw new Error("Cada imagem deve ter até 20 MB.");
  if (!file.size || !["image/jpeg", "image/png"].includes(file.type))
    throw new Error(
      "Selecione uma imagem JPG ou PNG válida. HEIC não é suportado; converta para JPG antes de importar.",
    );
}
