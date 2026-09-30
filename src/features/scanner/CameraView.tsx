import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button, Notice } from "../../shared/ui";
import { startCamera, stopCamera, captureFrame } from "./camera";
export function CameraView({
  onCapture,
  disabled,
}: {
  onCapture: (blob: Blob) => Promise<void>;
  disabled: boolean;
}) {
  const stream = useRef<MediaStream | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const generation = useRef(0);
  const [active, setActive] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  function close() {
    generation.current++;
    stopCamera(stream.current);
    stream.current = null;
    setActive(false);
  }
  useEffect(
    () => () => {
      generation.current++;
      stopCamera(stream.current);
    },
    [],
  );
  async function open(id?: string) {
    const current = ++generation.current;
    stopCamera(stream.current);
    setBusy(true);
    setError("");
    try {
      const next = await startCamera(id);
      if (current !== generation.current) {
        stopCamera(next);
        return;
      }
      stream.current = next;
      next.getVideoTracks().forEach((t) =>
        t.addEventListener("ended", () => {
          if (stream.current === next) {
            close();
            setError(
              "A câmera foi interrompida. Abra novamente ou importe uma imagem.",
            );
          }
        }),
      );
      setActive(true);
      setDevices(
        (await navigator.mediaDevices.enumerateDevices()).filter(
          (d) => d.kind === "videoinput",
        ),
      );
    } catch (e) {
      setActive(false);
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Sem permissão para acessar a câmera. Autorize no navegador ou importe uma imagem."
          : "Não foi possível abrir a câmera. Verifique se ela está disponível ou importe uma imagem.",
      );
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }
  useEffect(() => {
    if (active && video.current) {
      video.current.srcObject = stream.current;
      void video.current
        .play()
        .catch(() => setError("Toque no vídeo para iniciar a câmera."));
    }
  }, [active, devices]);
  return (
    <section aria-label="Captura pela câmera">
      {error && <Notice>{error}</Notice>}
      {active ? (
        <>
          <div className="camera-box">
            <video
              ref={video}
              autoPlay
              playsInline
              muted
              onClick={() => video.current?.play()}
              aria-label="Prévia da câmera"
            />
          </div>
          {devices.length > 1 && (
            <div className="field">
              <label htmlFor="camera-device">Câmera</label>
              <select
                id="camera-device"
                onChange={(e) => open(e.target.value)}
                disabled={busy}
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || "Câmera disponível"}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="camera-actions">
            <Button
              busy={busy}
              disabled={disabled}
              onClick={async () => {
                if (!video.current || busy) return;
                setBusy(true);
                try {
                  await onCapture(await captureFrame(video.current));
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Falha na captura.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Camera size={18} />
              Capturar página
            </Button>
            <Button variant="secondary" onClick={close}>
              <X size={18} />
              Fechar câmera
            </Button>
          </div>
        </>
      ) : (
        <Button
          variant="secondary"
          onClick={() => open()}
          busy={busy}
          disabled={disabled}
        >
          <Camera size={18} />
          Abrir câmera
        </Button>
      )}
    </section>
  );
}
