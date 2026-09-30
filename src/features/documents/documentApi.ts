import { request } from "../../shared/api/client";
import type { RoomContext } from "../../shared/api/context";
import type {
  DocumentResponse,
  PagedResponse,
} from "../../shared/api/contracts";
export const listDocuments = (
  ctx: RoomContext,
  params: { page: number; size: number; folderPath?: string },
  signal?: AbortSignal,
) =>
  request<PagedResponse<DocumentResponse>>(ctx, {
    url: "/document",
    params,
    signal,
  });
export const searchDocuments = (
  ctx: RoomContext,
  searchText: string,
  signal?: AbortSignal,
) =>
  request<DocumentResponse[]>(ctx, {
    url: "/document/search",
    params: { searchText },
    signal,
  });
export const deleteDocument = (ctx: RoomContext, id: string) =>
  request<void>(ctx, {
    url: `/document/${encodeURIComponent(id)}`,
    method: "DELETE",
  });
export const refreshThumbnail = (ctx: RoomContext, id: string) =>
  request<DocumentResponse>(ctx, {
    url: `/document/${encodeURIComponent(id)}/thumbnail/refresh`,
    method: "POST",
  });
export function parseFilename(header: string, fallback: string) {
  const extended = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)?.[1];
  let name = fallback;
  try {
    name = extended
      ? decodeURIComponent(extended)
      : (header.match(/filename\s*=\s*"?([^";]+)/i)?.[1] ?? fallback);
  } catch {
    /* use fallback */
  }
  // eslint-disable-next-line no-control-regex -- remove unsafe header control characters
  return name.replace(/[\\/\r\n\x00-\x1f]/g, "_").trim() || "documento";
}
export const getDownload = (ctx: RoomContext, id: string) =>
  request<{ blob: Blob; disposition: string }>(ctx, {
    url: `/document/${encodeURIComponent(id)}/download`,
    responseType: "blob",
    transformResponse: [
      (blob, headers) => ({
        blob,
        disposition: String(headers["content-disposition"] ?? ""),
      }),
    ],
  });
export async function downloadDocument(
  ctx: RoomContext,
  id: string,
  fallbackName: string,
) {
  const { blob, disposition } = await getDownload(ctx, id);
  if (!blob.size) throw new Error("O servidor retornou um arquivo vazio.");
  saveBlob(blob, parseFilename(disposition, fallbackName));
}
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function safeExternalUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export function uploadDocuments(
  ctx: RoomContext,
  input: {
    files: File[];
    title?: string;
    documentType: string;
    folderPath?: string;
  },
  signal?: AbortSignal,
) {
  const data = new FormData();
  for (const file of input.files) data.append("files", file);
  if (input.title) data.append("title", input.title);
  data.append("storageProvider", ctx.storageProvider);
  data.append("documentType", input.documentType);
  if (input.folderPath) data.append("folderPath", input.folderPath);
  return request<DocumentResponse[]>(ctx, {
    url: "/document",
    method: "POST",
    data,
    signal,
    timeout: 120000,
  });
}
