import fs from 'fs';
import path from 'path';
import os from 'os';
import pptxgen from 'pptxgenjs';
import { findChromeBinary } from './pdfExports.js';
import { fileExists, screenshotSlide, injectSlideSelector } from './screenshotUtils.js';
import { ScreenshotPptxOptions } from '../types/index.js';
import { createStaticServer, getFreePort } from '../utils/index.js';

export async function compileToScreenshotPptx(
  html: string,
  slideCount: number,
  outputPath: string,
  opts: ScreenshotPptxOptions = {}
): Promise<void> {
  const chromeBin = opts.chromePath ?? (await findChromeBinary());
  if (!chromeBin) {
    throw new Error(
      'Screenshot PPTX export requires Google Chrome or Chromium.\n' +
        '  → Install Chrome/Chromium, or set CHROME_PATH environment variable.'
    );
  }
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const width = opts.width ?? 1920;
  const height = opts.height ?? 1080;

  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'mdslide-pptx-'));
  const cleanup = async () => {
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  };

  const modifiedHtml = injectSlideSelector(html);

  // Start local HTTP server directly out of system RAM memory
  const serverPort = await getFreePort();
  const server = createStaticServer(() => modifiedHtml, opts.baseDir ?? process.cwd());

  await new Promise<void>((resolve, reject) => {
    server.listen(serverPort, '127.0.0.1', () => resolve());
    server.once('error', reject);
  });

  const baseUrl = `http://127.0.0.1:${serverPort}`;
  const pngPaths: string[] = [];

  try {
    // Screenshot each slide sequentially to avoid CPU/resource overload
    for (let i = 0; i < slideCount; i++) {
      const pngPath = path.join(tmpDir, `slide-${i}.png`);
      const url = `${baseUrl}/?slide=${i}`;
      pngPaths.push(pngPath);

      await screenshotSlide(chromeBin, url, pngPath, width, height, timeoutMs);
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  try {
    // Build PPTX with screenshots as full-bleed images
    const pptx = new (pptxgen as any)();
    pptx.layout = 'LAYOUT_WIDE';

    for (let i = 0; i < pngPaths.length; i++) {
      const pngPath = pngPaths[i]!;
      if (!(await fileExists(pngPath))) continue;

      const slide = pptx.addSlide();
      slide.addImage({
        path: pngPath,
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
      });
    }

    await fs.promises.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
    await pptx.writeFile({ fileName: path.resolve(outputPath) });
  } finally {
    await cleanup();
  }
}
