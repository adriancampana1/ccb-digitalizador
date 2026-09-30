import { create } from "zustand";
import type { RoomContext } from "../../shared/api/context";
import type { ScanBatch, ScanPage } from "./types";
import { MAX_PAGES } from "./limits";
import { registerSessionCleanup } from "../auth/sessionStore";
import { registerRoomTransitionGuard } from "../rooms/roomStore";
export function createBatch(context: RoomContext): ScanBatch {
  return {
    context: Object.freeze({ ...context }),
    pages: [],
    phase: "editing",
  };
}
export function addPage(batch: ScanBatch, page: ScanPage): ScanBatch {
  if (batch.pages.length >= MAX_PAGES)
    throw new Error("O lote pode ter até 20 páginas.");
  return { ...batch, pages: [...batch.pages, page] };
}
export const useBatch = create<{ batch: ScanBatch | null }>(() => ({
  batch: null,
}));
export function disposeBatch() {
  useBatch.setState({ batch: null });
}
registerSessionCleanup(disposeBatch);
registerRoomTransitionGuard(async () => {
  const batch = useBatch.getState().batch;
  if (!batch) return true;
  if (batch.phase === "processing" || batch.phase === "uploading") return false;
  if (
    (batch.pages.length || batch.importedPdf) &&
    !window.confirm("Trocar de sala e descartar as páginas deste lote?")
  )
    return false;
  disposeBatch();
  return true;
});

window.addEventListener("beforeunload", (event) => {
  const batch = useBatch.getState().batch;
  if (batch && (batch.pages.length || batch.importedPdf)) {
    event.preventDefault();
    event.returnValue = "";
  }
});
