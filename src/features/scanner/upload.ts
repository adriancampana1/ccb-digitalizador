import type { ScanBatch, OutputFormat } from "./types";
import { buildFiles } from "./export";
import { uploadDocuments } from "../documents/documentApi";
import { useSession, registerSessionCleanup } from "../auth/sessionStore";
import { useRooms, roomKey } from "../rooms/roomStore";
import { useBatch, disposeBatch } from "./batchStore";
import { queryClient } from "../../app/queryClient";
import { ApiError, errorMessage } from "../../shared/api/error";
import { disposeEngine } from "./processing/engine";
import { MAX_PDF_BYTES } from "./limits";
export type SubmitInput = {
  name: string;
  format: OutputFormat;
  folderPath: string;
  originals?: boolean;
  onProgress?: (completed: number, total: number) => void;
  pdf?: File;
  documentType?: string;
};
let operation: AbortController | null = null;
registerSessionCleanup(() => {
  operation?.abort();
  operation = null;
  disposeEngine();
});
export async function validatePdf(file: File) {
  if (file.size > MAX_PDF_BYTES) throw new Error("O PDF deve ter até 25 MB.");
  if (
    file.type !== "application/pdf" ||
    file.size < 5 ||
    new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()) !== "%PDF-"
  )
    throw new Error("Selecione um arquivo PDF válido.");
}
export async function submitBatch(
  batch: ScanBatch,
  input: SubmitInput,
): Promise<{ status: "success" | "failed" | "uncertain"; message?: string }> {
  if (operation)
    return { status: "failed", message: "Há um envio em andamento." };
  const controller = new AbortController();
  operation = controller;
  let sent = false;
  const valid = () =>
    !controller.signal.aborted &&
    useSession.getState().session?.sessionId === batch.context.sessionId &&
    useRooms.getState().activeRoomId === batch.context.roomId &&
    useRooms
      .getState()
      .rooms.some(
        (r) =>
          r.id === batch.context.roomId && r.connectionStatus === "CONNECTED",
      );
  const phase = (value: ScanBatch["phase"]) => {
    if (useBatch.getState().batch?.context === batch.context)
      useBatch.setState({ batch: { ...batch, phase: value } });
  };
  try {
    if (!valid())
      throw new Error(
        "A sala ou a sessão mudou. Selecione novamente o destino.",
      );
    phase("processing");
    if (input.pdf) {
      await validatePdf(input.pdf);
      if (!input.documentType)
        throw new Error(
          "Importação de PDF ainda não configurada para este servidor.",
        );
    }
    const files = input.pdf
      ? [input.pdf]
      : await buildFiles(
          batch.pages,
          input.name,
          input.format,
          input.onProgress,
          input.originals,
        );
    if (!valid())
      throw new Error(
        "A sala ou a sessão mudou durante o processamento. Nenhum arquivo foi enviado.",
      );
    phase("uploading");
    sent = true;
    await uploadDocuments(
      batch.context,
      {
        files,
        title: input.name.trim(),
        documentType: input.pdf ? input.documentType! : "scanned",
        folderPath: input.folderPath,
      },
      controller.signal,
    );
    if (!valid())
      return {
        status: "failed",
        message:
          "A sessão mudou. Confira os documentos antes de repetir o envio.",
      };
    disposeBatch();
    void queryClient
      .invalidateQueries({ queryKey: roomKey(batch.context) })
      .catch(() => {});
    return { status: "success" };
  } catch (error) {
    const uncertain =
      sent &&
      (!(error instanceof ApiError) ||
        error.kind === "network" ||
        error.kind === "timeout" ||
        error.kind === "cancelled" ||
        (error.status ?? 0) >= 500);
    phase(uncertain ? "uncertain" : "editing");
    return {
      status: uncertain ? "uncertain" : "failed",
      message: uncertain
        ? "Não foi possível confirmar o envio. As páginas foram preservadas. Confira os documentos desta sala antes de tentar novamente para evitar duplicatas."
        : errorMessage(error),
    };
  } finally {
    if (operation === controller) operation = null;
  }
}
