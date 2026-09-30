import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Send, FolderOpen } from "lucide-react";
import { Button, Field, Notice } from "../../shared/ui";
import { FolderPicker } from "../folders/FoldersPage";
import { useRooms } from "../rooms/roomStore";
import type { ScanBatch, OutputFormat } from "./types";
import { buildFiles } from "./export";
import { saveBlob } from "../documents/documentApi";
import { submitBatch } from "./upload";
import { useSession } from "../auth/sessionStore";
import { useBatch } from "./batchStore";
export function SaveDocument({
  batch,
  disabled,
  onSuccess,
  pdf,
  documentType,
}: {
  batch: ScanBatch;
  disabled: boolean;
  onSuccess: () => void;
  pdf?: File;
  documentType?: string;
}) {
  const [name, setName] = useState(
      batch.draft?.name ?? pdf?.name.replace(/\.pdf$/i, "") ?? "",
    ),
    [format, setFormat] = useState<OutputFormat>(batch.draft?.format ?? "pdf"),
    [folder, setFolder] = useState(batch.draft?.folderPath ?? ""),
    [picking, setPicking] = useState(false),
    [originals, setOriginals] = useState(batch.draft?.originals ?? false),
    [localBusy, setLocalBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [error, setError] = useState("");
  const room = useRooms((s) =>
    s.rooms.find((r) => r.id === batch.context.roomId),
  );
  useEffect(() => {
    const current = useBatch.getState().batch;
    if (current?.context === batch.context)
      useBatch.setState({
        batch: {
          ...current,
          draft: { name, format, folderPath: folder, originals },
        },
      });
  }, [name, format, folder, originals, batch.context]);
  const locked = disabled || localBusy;
  const onProgress = (n: number, total: number) =>
    setProgress(Math.round((n / total) * 100));
  return (
    <section className="surface surface-pad save-panel">
      <h2>Salvar documento</h2>
      <p className="muted">
        {pdf
          ? "PDF original, sem alterações."
          : `${batch.pages.length} ${batch.pages.length === 1 ? "página pronta" : "páginas prontas"} para revisar e salvar.`}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (locked) return;
          if (
            batch.phase === "uncertain" &&
            !window.confirm(
              "Você conferiu os documentos da sala? Um novo envio pode criar uma duplicata. Continuar?",
            )
          )
            return;
          setError("");
          setProgress(0);
          setLocalBusy(true);
          const result = await submitBatch(batch, {
            name,
            format,
            folderPath: folder,
            originals,
            onProgress,
            pdf,
            documentType,
          });
          setLocalBusy(false);
          if (result.status === "success") onSuccess();
          else setError(result.message ?? "Não foi possível enviar.");
        }}
      >
        <Field
          label="Nome do documento"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
          disabled={locked}
        />
        {!pdf && (
          <>
            <div className="field">
              <label htmlFor="output-format">Formato</label>
              <select
                id="output-format"
                value={format}
                onChange={(e) => setFormat(e.target.value as OutputFormat)}
                disabled={locked}
              >
                <option value="pdf">PDF · todas as páginas</option>
                <option value="jpeg">JPEG · um arquivo por página</option>
              </select>
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                checked={originals}
                onChange={(e) => setOriginals(e.target.checked)}
                disabled={locked}
              />
              Usar imagens originais, sem correções
            </label>
          </>
        )}
        <div className="destination">
          <span className="eyebrow">DESTINO DO ENVIO</span>
          <strong>{room?.name ?? "Sala selecionada"}</strong>
          <small>{room?.storageProvider}</small>
          <p>{folder || "Pasta principal"}</p>
          <Button
            type="button"
            variant="ghost"
            disabled={locked}
            onClick={() => setPicking(true)}
          >
            <FolderOpen size={17} />
            Escolher pasta
          </Button>
        </div>
        {(error || batch.phase === "uncertain") && (
          <Notice>
            {error ||
              "Não foi possível confirmar o envio. Confira os documentos antes de tentar novamente para evitar duplicatas."}
            {batch.phase === "uncertain" && (
              <>
                {" "}
                <Link to="/documents">Conferir documentos</Link>
              </>
            )}
          </Notice>
        )}
        {locked && (
          <div role="status">
            <p>
              {batch.phase === "uploading"
                ? "Enviando para a sala…"
                : `Preparando arquivos… ${progress}%`}
            </p>
            <progress
              className="progress"
              max={100}
              value={batch.phase === "uploading" ? undefined : progress}
            />
          </div>
        )}
        <div className="save-actions">
          <Button
            type="submit"
            disabled={locked || !name.trim() || (!pdf && !batch.pages.length)}
          >
            <Send size={17} />
            {batch.phase === "uncertain"
              ? "Enviar novamente"
              : "Enviar para a sala"}
          </Button>
          {!pdf && (
            <Button
              type="button"
              variant="secondary"
              disabled={locked || !name.trim()}
              onClick={async () => {
                setLocalBusy(true);
                setError("");
                setProgress(0);
                useBatch.setState({ batch: { ...batch, phase: "processing" } });
                try {
                  const files = await buildFiles(
                    batch.pages,
                    name,
                    format,
                    onProgress,
                    originals,
                  );
                  if (
                    useSession.getState().session?.sessionId !==
                    batch.context.sessionId
                  )
                    return;
                  for (const file of files) saveBlob(file, file.name);
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Não foi possível gerar os arquivos.",
                  );
                } finally {
                  if (useBatch.getState().batch?.context === batch.context)
                    useBatch.setState({
                      batch: { ...batch, phase: "editing" },
                    });
                  setLocalBusy(false);
                }
              }}
            >
              <Download size={17} />
              Baixar arquivo
            </Button>
          )}
        </div>
      </form>
      {picking && (
        <FolderPicker
          ctx={batch.context}
          onClose={() => setPicking(false)}
          onSelect={(path) => {
            setFolder(path);
            setPicking(false);
          }}
        />
      )}
    </section>
  );
}
