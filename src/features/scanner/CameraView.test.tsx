import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CameraView } from "./CameraView";
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("keeps a usable preview when device enumeration is unavailable, and releases tracks on exit", async () => {
  const stop = vi.fn();
  const track = { stop, addEventListener: vi.fn() };
  const stream = { getTracks: () => [track], getVideoTracks: () => [track] };
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: async () => stream,
      enumerateDevices: async () => {
        throw new Error("unsupported");
      },
    },
  });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const { unmount } = render(
    <CameraView disabled={false} onCapture={async () => {}} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Abrir câmera" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Prévia da câmera")).toBeInTheDocument(),
  );
  expect(screen.getByRole("button", { name: "Fechar câmera" })).toBeEnabled();
  unmount();
  expect(stop).toHaveBeenCalledOnce();
});
