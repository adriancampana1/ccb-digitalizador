import type { Quad, ScanPage, Point } from "../types";
import { orderCorners, validateQuad, outputSize } from "./geometry";
let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<
  number,
  {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }
>();
export function disposeEngine() {
  worker?.terminate();
  worker = null;
  for (const entry of pending.values()) {
    clearTimeout(entry.timer);
    entry.reject(
      new Error(
        "Processamento interrompido. As imagens originais foram preservadas.",
      ),
    );
  }
  pending.clear();
}
function run<T>(payload: object): Promise<T> {
  if (!worker) {
    if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined")
      return Promise.reject(
        new Error(
          "Correção indisponível neste navegador. Você pode exportar as imagens originais.",
        ),
      );
    worker = new Worker(`${import.meta.env.BASE_URL}scanner-worker.js`);
    worker.onmessage = ({ data }) => {
      const entry = pending.get(data.id);
      if (!entry) return;
      clearTimeout(entry.timer);
      pending.delete(data.id);
      if (data.error)
        entry.reject(
          new Error("Não foi possível processar a imagem. " + data.error),
        );
      else entry.resolve(data.result);
    };
    worker.onerror = () => disposeEngine();
  }
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, {
      resolve,
      reject,
      timer: setTimeout(() => disposeEngine(), 45000),
    });
    worker!.postMessage({ id, ...payload });
  });
}
export async function detectCorners(source: Blob): Promise<Quad | null> {
  const points = await run<Point[] | null>({ type: "detect", source });
  return points ? orderCorners(points) : null;
}
export async function renderPage(page: ScanPage): Promise<Blob> {
  if (!validateQuad(page.edit.corners, page.width, page.height))
    throw new Error("Ajuste os quatro cantos sem cruzar as linhas.");
  return run<Blob>({
    type: "render",
    source: page.source,
    edit: page.edit,
    size: outputSize(page.edit.corners),
  });
}
