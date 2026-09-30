import { useEffect, useRef, useState } from "react";
import { RotateCw, ScanLine, Undo2 } from "lucide-react";
import { Button, Notice } from "../../shared/ui";
import type { ScanPage, Quad } from "./types";
import { useBlobUrl } from "./useBlobUrl";
import { detectCorners, renderPage } from "./processing/engine";
import { fullQuad, validateQuad } from "./processing/geometry";
export function PageEditor({
  page,
  onChange,
  disabled,
}: {
  page: ScanPage;
  onChange: (page: ScanPage) => void;
  disabled: boolean;
}) {
  const source = useBlobUrl(page.source);
  const [preview, setPreview] = useState<Blob | null>(null),
    [view, setView] = useState<"corners" | "result" | "original">("corners"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [zoom, setZoom] = useState(1);
  const result = useBlobUrl(preview);
  const wrap = useRef<HTMLDivElement>(null);
  const edit = page.edit;
  const valid = validateQuad(edit.corners, page.width, page.height);
  useEffect(() => {
    let cancelled = false;
    setPreview(null);
    if (view !== "result" || !valid) return;
    setBusy(true);
    const timer = setTimeout(() => {
      renderPage(page)
        .then((b) => {
          if (!cancelled) {
            setPreview(b);
            setError("");
          }
        })
        .catch((e) => {
          if (!cancelled) setError(e.message);
        })
        .finally(() => {
          if (!cancelled) setBusy(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [page, view, valid]);
  function corner(index: number, x: number, y: number) {
    const corners = edit.corners.map((p, i) =>
      i === index
        ? {
            x: Math.max(0, Math.min(page.width, x)),
            y: Math.max(0, Math.min(page.height, y)),
          }
        : p,
    ) as Quad;
    onChange({ ...page, edit: { ...edit, corners } });
  }
  const names = [
    "superior esquerdo",
    "superior direito",
    "inferior direito",
    "inferior esquerdo",
  ];
  return (
    <section className="surface editor-panel" aria-label="Editor da página">
      <div className="actions editor-tabs">
        <Button
          variant={view === "corners" ? "primary" : "ghost"}
          onClick={() => setView("corners")}
        >
          Ajustar cantos
        </Button>
        <Button
          variant={view === "result" ? "primary" : "ghost"}
          onClick={() => setView("result")}
          disabled={!valid}
        >
          Resultado
        </Button>
        <Button
          variant={view === "original" ? "primary" : "ghost"}
          onClick={() => setView("original")}
        >
          Original
        </Button>
      </div>
      <p className="stat-line">
        Arraste os quatro cantos até as bordas do papel. Pelo teclado, use as
        setas; Shift move em passos maiores.
      </p>
      <div className="editor-scroll">
        <div
          className="editor-wrap"
          ref={wrap}
          style={{
            width: zoom > 1 ? `${zoom * 100}%` : "auto",
            maxWidth: zoom > 1 ? "none" : "100%",
          }}
        >
          <img
            src={view === "result" && result ? result : source}
            alt={
              view === "result"
                ? "Página corrigida"
                : "Página original para revisão"
            }
            style={zoom > 1 ? { maxHeight: "none", width: "100%" } : undefined}
          />
          {view === "corners" && (
            <>
              <svg
                viewBox={`0 0 ${page.width} ${page.height}`}
                aria-hidden="true"
                preserveAspectRatio="none"
              >
                <polygon
                  points={edit.corners.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="#003d5c1a"
                  stroke={valid ? "#007baf" : "#b52c32"}
                  strokeWidth={Math.max(page.width / 250, 2)}
                />
              </svg>
              {edit.corners.map((p, i) => (
                <button
                  className="corner"
                  key={i}
                  aria-label={`Canto ${names[i]}`}
                  disabled={disabled}
                  style={{
                    left: `${(p.x / page.width) * 100}%`,
                    top: `${(p.y / page.height) * 100}%`,
                  }}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                    const rect = wrap.current!.getBoundingClientRect();
                    corner(
                      i,
                      ((e.clientX - rect.left) / rect.width) * page.width,
                      ((e.clientY - rect.top) / rect.height) * page.height,
                    );
                  }}
                  onKeyDown={(e) => {
                    const step = e.shiftKey ? 20 : 2;
                    const move: Record<string, [number, number]> = {
                      ArrowLeft: [-step, 0],
                      ArrowRight: [step, 0],
                      ArrowUp: [0, -step],
                      ArrowDown: [0, step],
                    };
                    if (move[e.key]) {
                      e.preventDefault();
                      corner(i, p.x + move[e.key][0], p.y + move[e.key][1]);
                    }
                  }}
                />
              ))}
            </>
          )}
        </div>
      </div>
      {view === "result" && busy && <p role="status">Preparando a prévia…</p>}
      {!valid && (
        <Notice>
          Os cantos estão cruzados ou muito próximos. Ajuste-os antes de
          continuar.
        </Notice>
      )}
      {error && <Notice>{error} O original continua disponível.</Notice>}
      <div className="editor-controls">
        <Button
          variant="secondary"
          disabled={disabled || busy}
          onClick={async () => {
            setBusy(true);
            try {
              const corners = await detectCorners(page.source);
              if (corners && validateQuad(corners, page.width, page.height)) {
                onChange({ ...page, edit: { ...edit, corners } });
                setError("");
              } else
                setError(
                  "Bordas não identificadas com segurança. Ajuste os cantos manualmente.",
                );
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Detecção indisponível.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <ScanLine size={17} />
          Detectar bordas
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          onClick={() =>
            onChange({
              ...page,
              edit: {
                ...edit,
                rotation: ((edit.rotation + 90) % 360) as 0 | 90 | 180 | 270,
              },
            })
          }
        >
          <RotateCw size={17} />
          Girar {edit.rotation}°
        </Button>
        <Button
          variant="ghost"
          disabled={disabled}
          onClick={() =>
            onChange({
              ...page,
              edit: {
                corners: fullQuad(page.width, page.height),
                rotation: 0,
                mode: "color",
                contrast: 1,
              },
            })
          }
        >
          <Undo2 size={17} />
          Restaurar
        </Button>
      </div>
      <div className="filter-controls">
        <label>
          Cor
          <select
            value={edit.mode}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...page,
                edit: {
                  ...edit,
                  mode: e.target.value as "color" | "grayscale",
                },
              })
            }
          >
            <option value="color">Colorido</option>
            <option value="grayscale">Escala de cinza</option>
          </select>
        </label>
        <label>
          Contraste · {edit.contrast.toFixed(1)}
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={edit.contrast}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...page,
                edit: { ...edit, contrast: Number(e.target.value) },
              })
            }
          />
        </label>
        <label>
          Zoom · {Math.round(zoom * 100)}%
          <input
            type="range"
            min="1"
            max="2"
            step="0.25"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
      </div>
    </section>
  );
}
