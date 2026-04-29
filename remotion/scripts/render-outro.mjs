import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const compId = process.argv[2];
const outPath = process.argv[3];
if (!compId || !outPath) {
  console.error("Usage: node render-outro.mjs <compositionId> <outputPath>");
  process.exit(1);
}

console.log("Bundling...");
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/indexOutro.ts"),
  webpackOverride: (c) => c,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: compId,
  puppeteerInstance: browser,
});

console.log(`Rendering ${compId} ${composition.width}x${composition.height} ${composition.durationInFrames}f`);

await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: outPath,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
  onProgress: ({ progress }) => {
    if (Math.round(progress * 100) % 10 === 0) process.stdout.write(`\r${Math.round(progress * 100)}%`);
  },
});

await browser.close({ silent: false });
console.log(`\nDone: ${outPath}`);
