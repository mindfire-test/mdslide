import fs from 'fs';
import path from 'path';
import { findChromeBinary } from './pdfExports.js';
import { screenshotSlide, injectSlideSelector } from './screenshotUtils.js';
import { ScreenshotExportOptions } from '../types/index.js';
import { createStaticServer, getFreePort } from '../utils/index.js';

export async function compileToScreenshots(
  html: string,
  slideCount: number,
  outputDir: string,
  opts: ScreenshotExportOptions = {}
): Promise<string[]> {
  const chromeBin = opts.chromePath ?? (await findChromeBinary());
  if (!chromeBin) {
    throw new Error(
      'Screenshot export requires Google Chrome or Chromium.\n' +
        '  → Install Chrome/Chromium, or set CHROME_PATH environment variable.'
    );
  }
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const width = opts.width ?? 1920;
  const height = opts.height ?? 1080;

  const modifiedHtml = injectSlideSelector(html);

  const serverPort = await getFreePort();
  const server = createStaticServer(() => modifiedHtml, opts.baseDir ?? process.cwd());

  await new Promise<void>((resolve, reject) => {
    server.listen(serverPort, '127.0.0.1', () => resolve());
    server.once('error', reject);
  });

  const baseUrl = `http://127.0.0.1:${serverPort}`;
  const absOutputDir = path.resolve(outputDir);
  await fs.promises.mkdir(absOutputDir, { recursive: true });

  const slideIndexes =
    opts.slide !== undefined ? [opts.slide - 1] : Array.from({ length: slideCount }, (_, i) => i);

  const pngPaths: string[] = [];

  try {
    // Screenshot each slide sequentially to avoid CPU/resource overload
    for (const i of slideIndexes) {
      const pngPath = path.join(absOutputDir, `slide-${i + 1}.png`);
      const url = `${baseUrl}/?slide=${i}`;
      await screenshotSlide(chromeBin, url, pngPath, width, height, timeoutMs);
      pngPaths.push(pngPath);
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  return pngPaths;
}
