import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "../../shared/ui";
import type { ScanPage } from "./types";
import { useBlobUrl } from "./useBlobUrl";
function Thumbnail({
  page,
  index,
  selected,
  onSelect,
}: {
  page: ScanPage;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const url = useBlobUrl(page.source);
  return (
    <button
      className="thumb-select"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Editar página ${index + 1}`}
    >
      <img src={url} alt="" />
      <span>Página {index + 1}</span>
    </button>
  );
}
export function PageStrip({
  pages,
  selected,
  onSelect,
  onChange,
  disabled,
}: {
  pages: ScanPage[];
  selected: string;
  onSelect: (id: string) => void;
  onChange: (pages: ScanPage[]) => void;
  disabled: boolean;
}) {
  function move(i: number, delta: number) {
    const next = pages.slice();
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    onChange(next);
  }
  return (
    <div className="page-strip" aria-label="Páginas na ordem de envio">
      {pages.map((page, i) => (
        <div
          className={`page-thumb ${selected === page.id ? "selected" : ""}`}
          key={page.id}
        >
          <Thumbnail
            page={page}
            index={i}
            selected={selected === page.id}
            onSelect={() => onSelect(page.id)}
          />
          <div className="actions">
            <Button
              variant="ghost"
              aria-label={`Mover página ${i + 1} para antes`}
              disabled={disabled || i === 0}
              onClick={() => move(i, -1)}
            >
              <ArrowLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              aria-label={`Mover página ${i + 1} para depois`}
              disabled={disabled || i === pages.length - 1}
              onClick={() => move(i, 1)}
            >
              <ArrowRight size={16} />
            </Button>
            <Button
              variant="ghost"
              aria-label={`Remover página ${i + 1}`}
              disabled={disabled}
              onClick={() => {
                if (window.confirm(`Remover a página ${i + 1} deste lote?`))
                  onChange(pages.filter((p) => p.id !== page.id));
              }}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
