import { readFile, mkdir, copyFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const source = "node_modules/@techstark/opencv-js";
const pkg = JSON.parse(await readFile(`${source}/package.json`, "utf8"));
const bytes = await readFile(`${source}/dist/opencv.js`);
await mkdir("public/vendor/opencv", { recursive: true });
await copyFile(`${source}/dist/opencv.js`, "public/vendor/opencv/opencv.js");
await writeFile(
  "public/vendor/opencv/NOTICE.txt",
  `OpenCV.js via @techstark/opencv-js ${pkg.version}\nSource: ${pkg.repository.url}\nLicense: Apache-2.0\nThe WebAssembly binary is embedded in opencv.js. No runtime CDN.\nSHA-256: ${createHash("sha256").update(bytes).digest("hex")}\n`,
);
