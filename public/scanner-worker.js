/* Local worker. All pixel buffers and OpenCV matrices are released per request. */
let cvReady;
let queue = Promise.resolve();
function loadCV() {
  if (!cvReady) {
    self.importScripts("vendor/opencv/opencv.js");
    cvReady = Promise.resolve(self.cv);
  }
  return cvReady;
}
async function run({ type, source, edit, size }) {
  const cv = await loadCV();
  const bitmap = await createImageBitmap(source);
  const resources = [];
  const keep = (mat) => {
    resources.push(mat);
    return mat;
  };
  try {
    const scale =
      type === "detect"
        ? Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height))
        : 1;
    const canvas = new OffscreenCanvas(
      Math.round(bitmap.width * scale),
      Math.round(bitmap.height * scale),
    );
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const src = keep(
      cv.matFromImageData(
        context.getImageData(0, 0, canvas.width, canvas.height),
      ),
    );
    if (type === "detect") {
      const gray = keep(new cv.Mat()),
        edges = keep(new cv.Mat()),
        contours = keep(new cv.MatVector()),
        hierarchy = keep(new cv.Mat());
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
      cv.Canny(gray, edges, 60, 160);
      cv.findContours(
        edges,
        contours,
        hierarchy,
        cv.RETR_LIST,
        cv.CHAIN_APPROX_SIMPLE,
      );
      let best = null,
        bestArea = canvas.width * canvas.height * 0.15;
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i),
          approx = new cv.Mat();
        try {
          cv.approxPolyDP(
            contour,
            approx,
            0.02 * cv.arcLength(contour, true),
            true,
          );
          const area = Math.abs(cv.contourArea(approx));
          if (
            approx.rows === 4 &&
            cv.isContourConvex(approx) &&
            area > bestArea &&
            area < canvas.width * canvas.height * 0.98
          ) {
            bestArea = area;
            best = Array.from({ length: 4 }, (_, i) => ({
              x: approx.data32S[i * 2] / scale,
              y: approx.data32S[i * 2 + 1] / scale,
            }));
          }
        } finally {
          contour.delete();
          approx.delete();
        }
      }
      return best;
    }
    const from = keep(
        cv.matFromArray(
          4,
          1,
          cv.CV_32FC2,
          edit.corners.flatMap((p) => [p.x, p.y]),
        ),
      ),
      to = keep(
        cv.matFromArray(4, 1, cv.CV_32FC2, [
          0,
          0,
          size.width - 1,
          0,
          size.width - 1,
          size.height - 1,
          0,
          size.height - 1,
        ]),
      );
    const transform = keep(cv.getPerspectiveTransform(from, to)),
      result = keep(new cv.Mat());
    cv.warpPerspective(
      src,
      result,
      transform,
      new cv.Size(size.width, size.height),
      cv.INTER_LINEAR,
      cv.BORDER_REPLICATE,
    );
    if (edit.mode === "grayscale") {
      cv.cvtColor(result, result, cv.COLOR_RGBA2GRAY);
      cv.cvtColor(result, result, cv.COLOR_GRAY2RGBA);
    }
    if (edit.contrast !== 1) {
      result.convertTo(result, -1, edit.contrast, 128 * (1 - edit.contrast));
    }
    if (edit.rotation) {
      cv.rotate(
        result,
        result,
        edit.rotation === 90
          ? cv.ROTATE_90_CLOCKWISE
          : edit.rotation === 180
            ? cv.ROTATE_180
            : cv.ROTATE_90_COUNTERCLOCKWISE,
      );
    }
    const output = new OffscreenCanvas(result.cols, result.rows);
    output
      .getContext("2d")
      .putImageData(
        new ImageData(
          new Uint8ClampedArray(result.data),
          result.cols,
          result.rows,
        ),
        0,
        0,
      );
    return await output.convertToBlob({ type: "image/jpeg", quality: 0.94 });
  } finally {
    for (const resource of resources.reverse()) resource.delete();
    bitmap.close();
  }
}
self.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    try {
      self.postMessage({ id: data.id, result: await run(data) });
    } catch (error) {
      self.postMessage({
        id: data.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
};
