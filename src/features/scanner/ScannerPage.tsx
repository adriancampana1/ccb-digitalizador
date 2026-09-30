import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FileImage, FileUp, Trash2 } from "lucide-react";
import { Button, Notice } from "../../shared/ui";
import { captureRoomContext, useRooms } from "../rooms/roomStore";
import { useSession } from "../auth/sessionStore";
import { isDemo } from "../../shared/api/client";
import { useBatch, createBatch, addPage, disposeBatch } from "./batchStore";
import { importImage } from "./importImage";
import { CameraView } from "./CameraView";
import { PageEditor } from "./PageEditor";
import { PageStrip } from "./PageStrip";
import { SaveDocument } from "./SaveDocument";
import { detectCorners, disposeEngine } from "./processing/engine";
import { validateQuad } from "./processing/geometry";
import { validatePdf } from "./upload";
import type { ScanPage } from "./types";
export default function ScannerPage() {
  const batch = useBatch((s) => s.batch);
  const [selected, setSelected] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [note, setNote] = useState(""),
    [success, setSuccess] = useState(false),
    [replace, setReplace] = useState(false);
  const pdf = batch?.importedPdf ?? null;
  const generation = useRef(0);
  const locked =
    busy || batch?.phase === "processing" || batch?.phase === "uploading";
  const page = batch?.pages.find((p) => p.id === selected) ?? batch?.pages[0];
  const importedType = isDemo
    ? "demo_imported_pdf"
    : import.meta.env.VITE_IMPORTED_DOCUMENT_TYPE;
  useEffect(
    () => () => {
      generation.current++;
      disposeEngine();
    },
    [],
  );
  async function addImages(files: Blob[]) {
    if (locked) return;
    setBusy(true);
    setError("");
    setNote("");
    setSuccess(false);
    const ctx = captureRoomContext(),
      revision = generation.current;
    try {
      for (const file of files) {
        let current = useBatch.getState().batch ?? createBatch(ctx);
        if (!replace && current.pages.length >= 20)
          throw new Error("O lote pode ter até 20 páginas.");
        const imported = await importImage(file);
        try {
          const corners = await detectCorners(imported.source);
          if (corners && validateQuad(corners, imported.width, imported.height))
            imported.edit.corners = corners;
          else
            setNote(
              "Revise os cantos: nem todas as bordas foram identificadas automaticamente.",
            );
        } catch {
          setNote(
            "Detecção automática indisponível. Ajuste os cantos manualmente ou use os originais.",
          );
        }
        if (
          revision !== generation.current ||
          useSession.getState().session?.sessionId !== ctx.sessionId ||
          useRooms.getState().activeRoomId !== ctx.roomId
        )
          return;
        current = useBatch.getState().batch ?? current;
        if (current.context.roomId !== ctx.roomId) return;
        useBatch.setState({
          batch:
            replace && page
              ? {
                  ...current,
                  pages: current.pages.map((p) =>
                    p.id === page.id ? imported : p,
                  ),
                }
              : addPage(current, imported),
        });
        setSelected(imported.id);

        if (replace) {
          setReplace(false);
          break;
        }
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível importar este arquivo.",
      );
    } finally {
      if (revision === generation.current) setBusy(false);
    }
  }
  function changePages(pages: ScanPage[]) {
    if (batch && !locked) useBatch.setState({ batch: { ...batch, pages } });
  }
  function finish() {
    setSuccess(true);
    setSelected("");
    setError("");
    setNote("");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Digitalizar documento</h1>
          <p>Capture, revise e guarde na sala da congregação.</p>
        </div>
        {batch?.pages.length ? (
          <Button
            variant="ghost"
            disabled={locked}
            onClick={() => {
              if (window.confirm("Descartar todas as páginas deste lote?")) {
                disposeBatch();

                setReplace(false);
              }
            }}
          >
            <Trash2 size={17} />
            <span className="desktop-label">Descartar</span>
          </Button>
        ) : null}
      </div>
      {success && (
        <Notice kind="success">
          Documento enviado para a sala.{" "}
          <Link to="/documents">Ver documentos</Link>
        </Notice>
      )}
      {error && <Notice>{error}</Notice>}
      {note && <Notice kind="info">{note}</Notice>}
      {replace && (
        <Notice kind="info">
          A próxima imagem substituirá a página selecionada.{" "}
          <Button variant="ghost" onClick={() => setReplace(false)}>
            Cancelar substituição
          </Button>
        </Notice>
      )}
      <div className="scanner-layout">
        <div>
          <div className="surface surface-pad capture-panel">
            <h2>
              {batch?.pages.length
                ? "Adicionar páginas"
                : "Como deseja começar?"}
            </h2>
            <p className="muted">
              Use a câmera ou selecione imagens JPG e PNG. Até 20 páginas e 20
              MB por imagem.
            </p>
            <CameraView
              onCapture={(blob) => addImages([blob])}
              disabled={!!locked || !!pdf}
            />
            <div className="import-field">
              <label htmlFor="images-input" className="icon-label">
                <FileImage size={18} />
                Importar imagens
              </label>
              <input
                id="images-input"
                type="file"
                accept="image/jpeg,image/png"
                multiple={!replace}
                disabled={!!locked || !!pdf}
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.currentTarget.value = "";
                  void addImages(files);
                }}
              />
            </div>
            {!batch?.pages.length && (
              <details>
                <summary>
                  <FileUp size={17} />
                  Enviar um PDF existente
                </summary>
                <p className="muted">
                  Até 25 MB. O arquivo será enviado sem alterações.
                </p>
                {!importedType ? (
                  <Notice kind="info">
                    A importação de PDF será habilitada após confirmar o tipo de
                    documento aceito pelo servidor.
                  </Notice>
                ) : (
                  <>
                    <label htmlFor="pdf-input">Importar PDF</label>
                    <input
                      id="pdf-input"
                      type="file"
                      accept="application/pdf"
                      disabled={!!locked}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.currentTarget.value = "";
                        if (!file) return;
                        try {
                          const context = captureRoomContext();
                          const revision = generation.current;
                          await validatePdf(file);
                          if (
                            revision !== generation.current ||
                            useSession.getState().session?.sessionId !==
                              context.sessionId ||
                            useRooms.getState().activeRoomId !== context.roomId
                          )
                            return;
                          useBatch.setState({
                            batch: {
                              ...createBatch(context),
                              importedPdf: file,
                            },
                          });

                          setError("");
                          setSuccess(false);
                        } catch (e) {
                          setError(
                            e instanceof Error ? e.message : "PDF inválido.",
                          );
                        }
                      }}
                    />
                  </>
                )}
              </details>
            )}
          </div>
          {busy && (
            <p role="status" className="stat-line">
              Importando e procurando as bordas…
            </p>
          )}
          {batch && !!batch.pages.length && (
            <>
              <PageStrip
                pages={batch.pages}
                selected={page?.id ?? ""}
                onSelect={setSelected}
                onChange={changePages}
                disabled={!!locked}
              />
              {page && (
                <>
                  <div className="review-heading">
                    <h2>Revisar página {batch.pages.indexOf(page) + 1}</h2>
                    <Button
                      variant="ghost"
                      disabled={!!locked}
                      onClick={() => setReplace(true)}
                    >
                      Refazer página
                    </Button>
                  </div>
                  <PageEditor
                    key={page.id}
                    page={page}
                    disabled={!!locked}
                    onChange={(edited) =>
                      changePages(
                        batch.pages.map((p) =>
                          p.id === edited.id ? edited : p,
                        ),
                      )
                    }
                  />
                </>
              )}
            </>
          )}
        </div>
        <aside>
          {batch && (batch.pages.length > 0 || pdf) ? (
            <SaveDocument
              key={pdf?.name ?? batch.context.roomId}
              batch={batch}
              pdf={pdf ?? undefined}
              documentType={importedType}
              disabled={!!locked}
              onSuccess={finish}
            />
          ) : (
            <div className="scan-guide">
              <span className="eyebrow">UMA BOA DIGITALIZAÇÃO</span>
              <h2>O papel bem visível.</h2>
              <ol>
                <li>Coloque o documento sobre uma superfície contrastante.</li>
                <li>Use luz uniforme, sem sombras sobre o texto.</li>
                <li>Confira os cantos e a legibilidade antes de enviar.</li>
              </ol>
              <p>
                As páginas ficam apenas nesta aba. Fechar ou sair da conta
                descarta o que não foi enviado.
              </p>
            </div>
          )}
          {pdf && (
            <Button
              variant="ghost"
              disabled={!!locked}
              onClick={() => {
                disposeBatch();
              }}
            >
              Remover PDF selecionado
            </Button>
          )}
        </aside>
      </div>
    </>
  );
}
