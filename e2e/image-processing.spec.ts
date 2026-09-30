import { test, expect } from "@playwright/test";
test("real OpenCV worker detects paper and preserves colored corner marks through warp", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { renderPage, detectCorners, disposeEngine } =
      await import("/src/features/scanner/processing/engine.ts");
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, 600, 800);
    ctx.fillStyle = "#fff";
    ctx.fillRect(60, 80, 480, 640);
    const marks = [
      { x: 75, y: 95, color: "#ff0000" },
      { x: 495, y: 95, color: "#00ff00" },
      { x: 495, y: 675, color: "#0000ff" },
      { x: 75, y: 675, color: "#ffff00" },
    ];
    for (const m of marks) {
      ctx.fillStyle = m.color;
      ctx.fillRect(m.x, m.y, 30, 30);
    }
    const source = await new Promise<Blob>((r) =>
      canvas.toBlob((b) => r(b!), "image/png"),
    );
    const detected = await detectCorners(source);
    const blob = await renderPage({
      id: "synthetic",
      source,
      width: 600,
      height: 800,
      edit: {
        corners: [
          { x: 60, y: 80 },
          { x: 540, y: 80 },
          { x: 540, y: 720 },
          { x: 60, y: 720 },
        ],
        rotation: 0,
        mode: "color",
        contrast: 1,
      },
    });
    const bitmap = await createImageBitmap(blob);
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    ctx.drawImage(bitmap, 0, 0);
    const samples = [
      [30, 30],
      [450, 30],
      [450, 610],
      [30, 610],
    ].map(([x, y]) =>
      Array.from(ctx.getImageData(x, y, 1, 1).data).slice(0, 3),
    );
    bitmap.close();
    disposeEngine();
    return { detected, width: canvas.width, height: canvas.height, samples };
  });
  expect(result.detected).toHaveLength(4);
  expect(result.width).toBe(480);
  expect(result.height).toBe(640);
  for (const [i, color] of [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 0],
  ].entries())
    for (let c = 0; c < 3; c++)
      expect(Math.abs(result.samples[i][c] - color[c])).toBeLessThan(20);
});
