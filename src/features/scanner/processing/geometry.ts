import type { Quad, Point } from "../types";
import { MAX_SIDE } from "../limits";
export function validateQuad(quad: Quad, width: number, height: number) {
  if (
    quad.length !== 4 ||
    quad.some(
      (p) =>
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        p.x < 0 ||
        p.y < 0 ||
        p.x > width ||
        p.y > height,
    )
  )
    return false;
  let area = 0;
  for (let i = 0; i < 4; i++) {
    const a = quad[i],
      b = quad[(i + 1) % 4],
      c = quad[(i + 2) % 4];
    if ((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) <= 1)
      return false;
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2 >= Math.max(100, width * height * 0.005);
}
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export function outputSize(q: Quad) {
  const width = Math.max(distance(q[0], q[1]), distance(q[3], q[2]));
  const height = Math.max(distance(q[0], q[3]), distance(q[1], q[2]));
  const ratio = Math.min(1, MAX_SIDE / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}
export const fullQuad = (width: number, height: number): Quad => [
  { x: 0, y: 0 },
  { x: width, y: 0 },
  { x: width, y: height },
  { x: 0, y: height },
];
export function orderCorners(points: Point[]): Quad {
  const center = {
    x: points.reduce((n, p) => n + p.x, 0) / 4,
    y: points.reduce((n, p) => n + p.y, 0) / 4,
  };
  const ordered = points
    .slice()
    .sort(
      (a, b) =>
        Math.atan2(a.y - center.y, a.x - center.x) -
        Math.atan2(b.y - center.y, b.x - center.x),
    );
  const start = ordered.reduce(
    (best, p, i) => (p.x + p.y < ordered[best].x + ordered[best].y ? i : best),
    0,
  );
  return [...ordered.slice(start), ...ordered.slice(0, start)] as Quad;
}
