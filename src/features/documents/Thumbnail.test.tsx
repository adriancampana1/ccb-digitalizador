import { it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Thumbnail } from "./Thumbnail";
it("shows a safe thumbnail and falls back when storage rejects it", () => {
  const { container } = render(
    <Thumbnail url="https://example.test/thumbnail.jpg" />,
  );
  const img = container.querySelector("img");
  expect(img).not.toBeNull();
  fireEvent.error(img!);
  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByLabelText("Miniatura indisponível")).toBeInTheDocument();
});
