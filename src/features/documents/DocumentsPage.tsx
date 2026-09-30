import { Thumbnail } from "./Thumbnail";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ScanLine,
  Download,
  ExternalLink,
  Trash2,
  RefreshCw,
} from "lucide-react";
import type { RoomContext } from "../../shared/api/context";
import type { DocumentResponse } from "../../shared/api/contracts";
import { Button, Notice, Loading, EmptyState, Dialog } from "../../shared/ui";
import { queryClient } from "../../app/queryClient";
import { errorMessage } from "../../shared/api/error";
import { captureRoomContext, roomKey, useActiveRoom } from "../rooms/roomStore";
import {
  listDocuments,
  searchDocuments,
  downloadDocument,
  deleteDocument,
  refreshThumbnail,
  safeExternalUrl,
} from "./documentApi";
function size(bytes: number) {
  return bytes >= 1000000
    ? `${(bytes / 1000000).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1000))} KB`;
}
export function DocumentList({
  ctx,
  folderPath,
}: {
  ctx: RoomContext;
  folderPath?: string;
}) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [target, setTarget] = useState<DocumentResponse | null>(null);
  const room = useActiveRoom();
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const result = useQuery({
    queryKey: roomKey(ctx, "documents", folderPath ?? null, debounced, page),
    queryFn: async ({ signal }) =>
      debounced
        ? {
            content: await searchDocuments(ctx, debounced, signal),
            last: true,
            page: 0,
            totalElements: undefined,
          }
        : listDocuments(ctx, { page, size: 10, folderPath }, signal),
  });
  async function action(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input
            aria-label="Buscar documentos"
            placeholder="Buscar por nome ou conteúdo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          onClick={() => result.refetch()}
          aria-label="Atualizar documentos"
        >
          <RefreshCw size={17} />
        </Button>
      </div>
      {folderPath !== undefined && debounced && (
        <p className="stat-line">A busca consulta toda a sala ativa.</p>
      )}
      {error && <Notice>{error}</Notice>}
      {result.isError ? (
        <Notice>
          {errorMessage(result.error)}{" "}
          <Button variant="ghost" onClick={() => result.refetch()}>
            Tentar novamente
          </Button>
        </Notice>
      ) : result.isLoading ? (
        <Loading />
      ) : !result.data?.content.length ? (
        <EmptyState
          title={
            debounced
              ? "Nenhum documento encontrado"
              : "Ainda não há documentos"
          }
          action={
            !debounced ? (
              <Link to="/scan" className="button primary">
                <ScanLine size={18} />
                Digitalizar documento
              </Link>
            ) : undefined
          }
        >
          {debounced
            ? "Tente outro nome ou trecho do documento."
            : "Digitalize o primeiro documento para começar a organizar esta sala."}
        </EmptyState>
      ) : (
        <div className="surface">
          <table className="table">
            <thead>
              <tr>
                <th>Documento</th>
                <th className="desktop-meta">Pasta</th>
                <th>Data</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {result.data.content.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div className="file-cell">
                      <Thumbnail url={doc.thumbnailUrl} />
                      <div>
                        <strong>{doc.title}</strong>
                        <small>
                          {doc.fileMetadata.mimeType.includes("pdf")
                            ? "PDF"
                            : "Imagem"}{" "}
                          · {size(doc.fileMetadata.fileSize)}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td className="desktop-col desktop-meta">
                    {doc.folderPath || "Pasta principal"}
                  </td>
                  <td className="desktop-col no-wrap">
                    {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="mobile-actions">
                    <div className="row-actions">
                      <Button
                        variant="ghost"
                        disabled={!!busy}
                        aria-label={`Baixar ${doc.title}`}
                        onClick={() =>
                          action(doc.id, () =>
                            downloadDocument(
                              ctx,
                              doc.id,
                              doc.fileMetadata.originalFileName,
                            ),
                          )
                        }
                      >
                        <Download size={17} />
                      </Button>
                      {safeExternalUrl(doc.storageUrl) && (
                        <a
                          className="button ghost"
                          href={safeExternalUrl(doc.storageUrl)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Abrir ${doc.title} no provedor`}
                        >
                          <ExternalLink size={17} />
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        aria-label={`Atualizar miniatura de ${doc.title}`}
                        disabled={!!busy}
                        onClick={() =>
                          action(doc.id, async () => {
                            await refreshThumbnail(ctx, doc.id);
                            await result.refetch();
                          })
                        }
                      >
                        <RefreshCw size={16} />
                      </Button>
                      {room?.role === "MASTER" && (
                        <Button
                          variant="ghost"
                          aria-label={`Excluir ${doc.title}`}
                          disabled={!!busy}
                          onClick={() => setTarget(doc)}
                        >
                          <Trash2 size={17} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <span>
              {debounced
                ? `${result.data.content.length} resultados`
                : `Página ${page + 1}`}
            </span>
            <div className="actions">
              <Button
                variant="ghost"
                disabled={page === 0 || !!debounced}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                disabled={result.data.last || !!debounced}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      )}
      {target && (
        <Dialog
          title="Excluir documento?"
          onClose={() => !busy && setTarget(null)}
        >
          <p>
            O documento <strong>{target.title}</strong> será excluído. Esta ação
            depende das permissões do armazenamento.
          </p>
          <div className="actions end">
            <Button
              variant="ghost"
              disabled={!!busy}
              onClick={() => setTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              busy={!!busy}
              onClick={() =>
                action(target.id, async () => {
                  await deleteDocument(ctx, target.id);
                  setTarget(null);
                  await queryClient.invalidateQueries({
                    queryKey: roomKey(ctx, "documents"),
                  });
                })
              }
            >
              Excluir documento
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
export default function DocumentsPage() {
  const ctx = captureRoomContext();
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Documentos</h1>
          <p>Tudo organizado. Pronto para quando precisar.</p>
        </div>
        <Link
          className="button primary"
          to="/scan"
          aria-label="Digitalizar documento"
        >
          <ScanLine size={18} />
          <span className="desktop-label">Digitalizar</span>
        </Link>
      </div>
      <DocumentList key={`${ctx.sessionId}:${ctx.roomId}`} ctx={ctx} />
    </>
  );
}
