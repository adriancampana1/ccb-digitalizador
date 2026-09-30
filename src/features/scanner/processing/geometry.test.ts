import { it, expect } from "vitest";
import { validateQuad, outputSize } from "./geometry";
import type { Quad } from "../types";
const rect: Quad = [
  { x: 0, y: 0 },
  { x: 6000, y: 0 },
  { x: 6000, y: 4000 },
  { x: 0, y: 4000 },
];
it("rejects crossed, degenerate and out-of-bounds corners", () => {
  expect(validateQuad([rect[0], rect[2], rect[1], rect[3]], 6000, 4000)).toBe(
    false,
  );
  expect(validateQuad([rect[0], rect[0], rect[2], rect[3]], 6000, 4000)).toBe(
    false,
  );
  expect(validateQuad(rect, 5000, 4000)).toBe(false);
  expect(validateQuad(rect, 6000, 4000)).toBe(true);
});
it("limits output to 3000 while retaining the rectangle aspect", () => {
  expect(outputSize(rect)).toEqual({ width: 3000, height: 2000 });
});
