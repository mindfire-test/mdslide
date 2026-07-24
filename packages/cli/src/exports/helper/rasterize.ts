import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import katex from 'katex';
import sharp from 'sharp';
import { DEFAULT_ASSET_URLS } from '@mindfiredigital/mdslide-core';
import { findChromeBinary } from '../pdfExports.js';
import { screenshotSlide } from '../screenshotUtils.js';
import { createStaticServer, getFreePort } from '../../utils/index.js';

const require = createRequire(import.meta.url);

const TRANSPARENT_CHROME_ARGS = ['--default-background-color=00000000'];

let cachedKatexCss: string | null = null;
function getKatexCss(): string {
  if (cachedKatexCss === null) {
    try {
      cachedKatexCss = fs.readFileSync(require.resolve('katex/dist/katex.min.css'), 'utf-8');
    } catch {
      cachedKatexCss = '';
    }
  }
  return cachedKatexCss;
}

export interface RasterOptions {
  chromePath?: string | null;
  timeoutMs?: number;
  /** FIX: Accept custom user asset mappings to enable offline execution */
  assetUrls?: Record<string, string>;
}

export interface RasterResult {
  buffer: Buffer;
  width: number;
  height: number;
}

async function requireChrome(opts: RasterOptions): Promise<string> {
  const chromeBin = opts.chromePath ?? (await findChromeBinary());
  if (!chromeBin) {
    throw new Error(
      'Rendering Mermaid diagrams, math formulas, or gradient theme backgrounds into the ' +
        'editable PPTX requires Google Chrome or Chromium.\n' +
        '  → Install Chrome/Chromium, or set the CHROME_PATH environment variable.'
    );
  }
  return chromeBin;
}

async function screenshotHtml(
  html: string,
  windowWidth: number,
  windowHeight: number,
  opts: RasterOptions,
  extraChromeArgs: string[] = []
): Promise<Buffer> {
  const chromeBin = await requireChrome(opts);
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'mdslide-raster-'));
  const pngPath = path.join(tmpDir, 'snippet.png');
  const serverPort = await getFreePort();
  const server = createStaticServer(() => html, tmpDir);

  await new Promise<void>((resolve, reject) => {
    server.listen(serverPort, '127.0.0.1', () => resolve());
    server.once('error', reject);
  });

  try {
    const url = `http://127.0.0.1:${serverPort}/`;
    await screenshotSlide(
      chromeBin,
      url,
      pngPath,
      windowWidth,
      windowHeight,
      opts.timeoutMs ?? 15_000,
      extraChromeArgs
    );
    return await fs.promises.readFile(pngPath);
  } finally {
    // Gracefully clean up the static asset server binding loop
    await new Promise<void>((resolve) => server.close(() => resolve()));

    //  Catch errors explicitly and forward them to console or trace instead of swallowing silently
    await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch((err) => {
      console.error(`Failed to clean up transient raster directory at "${tmpDir}":`, err.message);
    });
  }
}

export async function renderHtmlSnippetToPng(
  bodyHtml: string,
  extraHead = '',
  opts: RasterOptions = {}
): Promise<RasterResult> {
  const canvasWidth = 1600;
  const canvasHeight = 1200;
  const html = `<!doctype html>
<html><head><meta charset="utf-8">
<style>html, body { margin:0; padding:0; background:transparent; }</style>
${extraHead}
</head><body>${bodyHtml}</body></html>`;

  const rawPng = await screenshotHtml(
    html,
    canvasWidth,
    canvasHeight,
    opts,
    TRANSPARENT_CHROME_ARGS
  );
  const trimmed = await sharp(rawPng).trim({ threshold: 12 }).png().toBuffer();
  const meta = await sharp(trimmed).metadata();
  return {
    buffer: trimmed,
    width: meta.width ?? canvasWidth,
    height: meta.height ?? canvasHeight,
  };
}

export async function renderMermaidToPng(
  source: string,
  isDarkTheme: boolean,
  opts: RasterOptions = {}
): Promise<RasterResult> {
  const escaped = source.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Look up mapping context for custom asset configurations dynamically
  const mermaidAssetUrl = opts.assetUrls?.['mermaidJs'] ?? DEFAULT_ASSET_URLS.mermaidJs;

  const body = `<div class="mermaid">${escaped}</div>
<script type="module">
  import mermaid from '${mermaidAssetUrl}';
  mermaid.initialize({
    startOnLoad: true,
    theme: ${isDarkTheme ? "'dark'" : "'default'"},
    flowchart: { htmlLabels: false },
    class: { htmlLabels: false },
    state: { htmlLabels: false },
  });
</script>`;
  return renderHtmlSnippetToPng(body, '', opts);
}

export async function renderMathToPng(
  formula: string,
  textColor: string,
  opts: RasterOptions = {}
): Promise<RasterResult> {
  let html: string;
  try {
    html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
  } catch {
    html = formula;
  }
  const extraHead = `<style>${getKatexCss()}\nbody{color:#${textColor.replace('#', '')};font-size:32px;}</style>`;
  return renderHtmlSnippetToPng(html, extraHead, opts);
}

export async function renderBackgroundToPng(
  cssBackground: string,
  widthPx: number,
  heightPx: number,
  opts: RasterOptions = {}
): Promise<RasterResult> {
  const html = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  html, body { margin:0; padding:0; width:${widthPx}px; height:${heightPx}px; overflow:hidden; }
  body { background: ${cssBackground}; }
</style>
</head><body></body></html>`;

  const rawPng = await screenshotHtml(html, widthPx, heightPx, opts);
  const meta = await sharp(rawPng).metadata();
  return { buffer: rawPng, width: meta.width ?? widthPx, height: meta.height ?? heightPx };
}

export function isGradientCss(value: string | undefined): boolean {
  return !!value && value.includes('gradient(');
}
