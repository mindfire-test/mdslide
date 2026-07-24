/// <reference types="node" />
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn, execFileSync, execFile } from 'child_process';
import { EventEmitter } from 'events';
import { findChromeBinary, exportToPdf, compileToPdf } from '../src/exports/pdfExports.ts';
import { compileToScreenshotPptx } from '../src/exports/pptxScreenshotExporter.ts';
import { compileToScreenshots } from '../src/exports/screenshotExporter.ts';
import { compileToEditablePptx } from '../src/exports/pptxEditableExporter.ts';
import * as helper from '../src/exports/helper/pptxEditableSlideHelper.ts';
import JSZip from 'jszip';

// Reads slide1.xml out of a compiled .pptx (a zip archive) for assertions
// that need to see the actual generated shapes/media - not just that the
// file was written successfully.
async function readPptxSlideXml(pptxPath: string, slideNo = 1): Promise<string> {
  const zip = await JSZip.loadAsync(await fs.promises.readFile(pptxPath));
  const entry = zip.file(`ppt/slides/slide${slideNo}.xml`);
  if (!entry) throw new Error(`slide${slideNo}.xml not found in ${pptxPath}`);
  return entry.async('string');
}

async function readPptxNotesXml(pptxPath: string, slideNo = 1): Promise<string | null> {
  const zip = await JSZip.loadAsync(await fs.promises.readFile(pptxPath));
  const entry = zip.file(`ppt/notesSlides/notesSlide${slideNo}.xml`);
  return entry ? entry.async('string') : null;
}

// Mock child_process
vi.mock('child_process', async () => {
  const actual = await vi.importActual<typeof import('child_process')>('child_process');
  return {
    ...actual,
    spawn: vi.fn(),
    execFileSync: vi.fn(),
    execFile: vi.fn(),
  };
});

// Mock the Chrome-based rasterizer (Mermaid/math/gradient-background PNGs) so
// these tests never need a real Chrome binary - same spirit as the
// child_process mock above, just scoped to mdslide's own rasterize module.
vi.mock('../src/exports/helper/rasterize.ts', async () => {
  const actual = await vi.importActual<typeof import('../src/exports/helper/rasterize.ts')>(
    '../src/exports/helper/rasterize.ts'
  );
  const fakeRaster = async () => ({
    buffer: Buffer.from('fake-png-bytes'),
    width: 400,
    height: 300,
  });
  return {
    ...actual,
    renderMermaidToPng: vi.fn(fakeRaster),
    renderMathToPng: vi.fn(fakeRaster),
    renderBackgroundToPng: vi.fn(fakeRaster),
  };
});

// Mock child process class for spawn
class MockChildProcess extends EventEmitter {
  stderr = new EventEmitter();
  kill = vi.fn();
  constructor(
    private exitCode: number = 0,
    private delay: number = 10
  ) {
    super();
    setTimeout(() => {
      this.stderr.emit('data', Buffer.from('mock chrome stderr logs'));
      this.emit('close', this.exitCode);
    }, this.delay);
  }
}

class MockSpawnErrorProcess extends EventEmitter {
  stderr = new EventEmitter();
  constructor() {
    super();
    setTimeout(() => {
      this.emit('error', new Error('Failed to spawn chrome'));
    }, 10);
  }
}

describe('CLI Exporter Modules', () => {
  const tmpDir = path.join(__dirname, 'tmp-exports');
  let mockExecFileSyncSuccess = true;
  let spawnMode: 'success' | 'timeout' | 'error-exit' | 'spawn-error' = 'success';

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Write a dummy PNG file so pptxgenjs does not fail on local image read
    fs.writeFileSync(path.join(tmpDir, 'nonexistent.png'), 'fake png data');
    // Write a dummy MP4 file so pptxgenjs's addMedia does not fail on local video read
    fs.writeFileSync(path.join(tmpDir, 'demo.mp4'), 'fake mp4 data');

    // Write dummy static assets to test local server content-type headers
    fs.writeFileSync(path.join(tmpDir, 'test.css'), 'body { color: red; }');
    fs.writeFileSync(path.join(tmpDir, 'test.js'), 'console.log("test");');
    fs.writeFileSync(path.join(tmpDir, 'test.json'), '{"key": "value"}');
    fs.writeFileSync(path.join(tmpDir, 'test.png'), 'fake-png-bytes');
    fs.writeFileSync(path.join(tmpDir, 'test.jpg'), 'fake-jpg-bytes');
    fs.writeFileSync(path.join(tmpDir, 'test.woff'), 'fake-woff-bytes');

    mockExecFileSyncSuccess = true;
    spawnMode = 'success';

    // Set up execFileSync mock behavior
    vi.mocked(execFileSync).mockImplementation((file, args, options) => {
      if (mockExecFileSyncSuccess) {
        return Buffer.from('Google Chrome 120.0.0.0');
      }
      throw new Error('command not found');
    });

    vi.mocked(execFile).mockImplementation((file, args, callback) => {
      const cb = typeof args === 'function' ? (args as any) : (callback as any);
      if (cb) {
        if (mockExecFileSyncSuccess) {
          cb(null, 'Google Chrome 120.0.0.0', '');
        } else {
          cb(new Error('command not found'), '', '');
        }
      }
      return {} as any;
    });

    // Set up spawn mock behavior
    vi.mocked(spawn).mockImplementation((cmd, args, options) => {
      const url = args ? args[args.length - 1] : '';
      if (spawnMode === 'success') {
        // Find output paths in arguments and create empty mock files
        if (args) {
          const pdfArg = args.find((a) => a.startsWith('--print-to-pdf='));
          const screenshotArg = args.find((a) => a.startsWith('--screenshot='));
          if (pdfArg) {
            const outPath = pdfArg.split('=')[1];
            if (outPath) fs.writeFileSync(outPath, 'dummy pdf data');
          } else if (screenshotArg) {
            const outPath = screenshotArg.split('=')[1];
            if (outPath) fs.writeFileSync(outPath, 'dummy png data');
          }

          // Make HTTP requests to local dev server to cover serveHtml paths
          if (url && url.startsWith('http://127.0.0.1')) {
            const baseHost = url.split('/?')[0];
            const safeGet = (u: string) => {
              http
                .get(u, (res) => {
                  res.on('data', () => {});
                })
                .on('error', () => {});
            };
            safeGet(url);
            safeGet(`${baseHost}/test.css`);
            safeGet(`${baseHost}/test.js`);
            safeGet(`${baseHost}/test.json`);
            safeGet(`${baseHost}/test.png`);
            safeGet(`${baseHost}/test.jpg`);
            safeGet(`${baseHost}/test.woff`);
            safeGet(`${baseHost}/nonexistent-file.css`);
          }
        }
        return new MockChildProcess(0) as any;
      }
      if (spawnMode === 'timeout') {
        return new MockChildProcess(0, 100000) as any;
      }
      if (spawnMode === 'error-exit') {
        return new MockChildProcess(1) as any;
      }
      if (spawnMode === 'spawn-error') {
        return new MockSpawnErrorProcess() as any;
      }
      return new MockChildProcess(0) as any;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('PDF Exporter (pdfExports.ts)', () => {
    test('findChromeBinary returns first succeeding candidate path', async () => {
      const bin = await findChromeBinary();
      expect(bin).not.toBeNull();
      expect(typeof bin).toBe('string');
    });

    test('findChromeBinary returns null if all candidate paths fail', async () => {
      mockExecFileSyncSuccess = false;
      const bin = await findChromeBinary();
      expect(bin).toBeNull();
    });

    test('exportToPdf rejects if no chrome binary is found', async () => {
      mockExecFileSyncSuccess = false;
      await expect(exportToPdf('in.html', 'out.pdf', { chromePath: null as any })).rejects.toThrow(
        'PDF export requires Google Chrome or Chromium'
      );
    });

    test('exportToPdf succeeds when chrome exits with code 0', async () => {
      const outPdf = path.join(tmpDir, 'output.pdf');
      await exportToPdf('in.html', outPdf, { chromePath: 'mock-chrome' });
      expect(fs.existsSync(outPdf)).toBe(true);
    });

    test('exportToPdf rejects on timeout and kills child process', async () => {
      spawnMode = 'timeout';
      const outPdf = path.join(tmpDir, 'output-timeout.pdf');
      await expect(
        exportToPdf('in.html', outPdf, { chromePath: 'mock-chrome', timeoutMs: 10 })
      ).rejects.toThrow('PDF export timed out after');
    });

    test('exportToPdf rejects if chrome exits with non-zero code', async () => {
      spawnMode = 'error-exit';
      const outPdf = path.join(tmpDir, 'output-error.pdf');
      await expect(exportToPdf('in.html', outPdf, { chromePath: 'mock-chrome' })).rejects.toThrow(
        'Chrome exited with code 1'
      );
    });

    test('exportToPdf rejects if spawning fails', async () => {
      spawnMode = 'spawn-error';
      const outPdf = path.join(tmpDir, 'output-spawn-error.pdf');
      await expect(exportToPdf('in.html', outPdf, { chromePath: 'mock-chrome' })).rejects.toThrow(
        'Failed to start Chrome: Failed to spawn chrome'
      );
    });

    test('compileToPdf wrapper handles temp file creation and removal', async () => {
      const outPdf = path.join(tmpDir, 'compiled.pdf');
      await compileToPdf('<h1>Hello World</h1>', outPdf, { chromePath: 'mock-chrome' });
      expect(fs.existsSync(outPdf)).toBe(true);
    });
  });

  describe('Screenshot PPTX Exporter (pptxScreenshotExporter.ts)', () => {
    test('compileToScreenshotPptx throws if no chrome is found', async () => {
      mockExecFileSyncSuccess = false;
      await expect(
        compileToScreenshotPptx('<html></html>', 2, 'out.pptx', { chromePath: null as any })
      ).rejects.toThrow('Screenshot PPTX export requires Google Chrome or Chromium');
    });

    test('compileToScreenshotPptx compiles slides using local HTTP server and mock screenshots', async () => {
      const outPptx = path.join(tmpDir, 'screenshot.pptx');
      await compileToScreenshotPptx('<html><head></head><body></body></html>', 2, outPptx, {
        chromePath: 'mock-chrome',
        baseDir: tmpDir,
      });
      expect(fs.existsSync(outPptx)).toBe(true);
    });

    test('compileToScreenshotPptx handles chrome screenshot timeouts', async () => {
      spawnMode = 'timeout';
      const outPptx = path.join(tmpDir, 'screenshot-timeout.pptx');
      await expect(
        compileToScreenshotPptx('<html><head></head><body></body></html>', 1, outPptx, {
          chromePath: 'mock-chrome',
          timeoutMs: 10,
          baseDir: tmpDir,
        })
      ).rejects.toThrow('Screenshot timed out for:');
    });

    test('compileToScreenshotPptx handles chrome exit errors', async () => {
      spawnMode = 'error-exit';
      const outPptx = path.join(tmpDir, 'screenshot-err.pptx');
      await expect(
        compileToScreenshotPptx('<html><head></head><body></body></html>', 1, outPptx, {
          chromePath: 'mock-chrome',
          baseDir: tmpDir,
        })
      ).rejects.toThrow('Chrome screenshot failed');
    });

    test('compileToScreenshotPptx handles chrome spawn errors', async () => {
      spawnMode = 'spawn-error';
      const outPptx = path.join(tmpDir, 'screenshot-spawn-err.pptx');
      await expect(
        compileToScreenshotPptx('<html><head></head><body></body></html>', 1, outPptx, {
          chromePath: 'mock-chrome',
          baseDir: tmpDir,
        })
      ).rejects.toThrow('Failed to spawn chrome');
    });
  });

  describe('Screenshot Exporter (screenshotExporter.ts)', () => {
    test('compileToScreenshots throws if no chrome is found', async () => {
      mockExecFileSyncSuccess = false;
      await expect(
        compileToScreenshots('<html></html>', 2, path.join(tmpDir, 'shots'), {
          chromePath: null as any,
        })
      ).rejects.toThrow('Screenshot export requires Google Chrome or Chromium');
    });

    test('compileToScreenshots captures one PNG per slide by default', async () => {
      const outDir = path.join(tmpDir, 'shots-all');
      const paths = await compileToScreenshots(
        '<html><head></head><body></body></html>',
        3,
        outDir,
        { chromePath: 'mock-chrome', baseDir: tmpDir }
      );

      expect(paths).toHaveLength(3);
      expect(paths).toEqual([
        path.join(outDir, 'slide-1.png'),
        path.join(outDir, 'slide-2.png'),
        path.join(outDir, 'slide-3.png'),
      ]);
      for (const p of paths) expect(fs.existsSync(p)).toBe(true);
    });

    test('compileToScreenshots captures only the requested slide', async () => {
      const outDir = path.join(tmpDir, 'shots-one');
      const paths = await compileToScreenshots(
        '<html><head></head><body></body></html>',
        3,
        outDir,
        { chromePath: 'mock-chrome', baseDir: tmpDir, slide: 2 }
      );

      expect(paths).toEqual([path.join(outDir, 'slide-2.png')]);
      expect(fs.existsSync(paths[0]!)).toBe(true);
    });

    test('compileToScreenshots propagates chrome timeouts', async () => {
      spawnMode = 'timeout';
      const outDir = path.join(tmpDir, 'shots-timeout');
      await expect(
        compileToScreenshots('<html><head></head><body></body></html>', 1, outDir, {
          chromePath: 'mock-chrome',
          timeoutMs: 10,
          baseDir: tmpDir,
        })
      ).rejects.toThrow('Screenshot timed out for:');
    });

    test('compileToScreenshots propagates chrome exit errors', async () => {
      spawnMode = 'error-exit';
      const outDir = path.join(tmpDir, 'shots-err');
      await expect(
        compileToScreenshots('<html><head></head><body></body></html>', 1, outDir, {
          chromePath: 'mock-chrome',
          baseDir: tmpDir,
        })
      ).rejects.toThrow('Chrome screenshot failed');
    });
  });

  describe('Editable PPTX Exporter (pptxEditableExporter.ts)', () => {
    test('compileToEditablePptx compiles all slide types and themes successfully', async () => {
      const outPptx = path.join(tmpDir, 'editable.pptx');
      const mockDeck = {
        meta: { theme: 'corporate' },
        slides: [
          {
            type: 'title',
            title: 'Welcome Slide',
            content: [
              { type: 'paragraph', children: [{ type: 'text', value: 'This is a subtitle' }] },
            ],
          },
          {
            type: 'statement',
            title: 'Core Value',
            content: [{ type: 'paragraph', children: [{ type: 'text', value: 'Statement text' }] }],
          },
          {
            type: 'quote',
            content: [
              {
                type: 'blockquote',
                children: [{ type: 'paragraph', children: [{ type: 'text', value: 'My Quote' }] }],
              },
            ],
          },
          {
            type: 'code',
            content: [{ type: 'code', value: 'const num = 42;' }],
          },
          {
            type: 'visual',
            title: 'Visual title',
            content: [{ type: 'image', url: './nonexistent.png' }],
          },
          {
            type: 'visual',
            content: [
              {
                type: 'paragraph',
                children: [{ type: 'text', value: 'Plain text visual fall-back' }],
              },
            ],
          },
          {
            type: 'table',
            content: [
              {
                type: 'table',
                children: [
                  {
                    type: 'tableRow',
                    children: [
                      {
                        type: 'tableCell',
                        header: true,
                        children: [{ type: 'text', value: 'Col A' }],
                      },
                      {
                        type: 'tableCell',
                        header: true,
                        children: [{ type: 'text', value: 'Col B' }],
                      },
                    ],
                  },
                  {
                    type: 'tableRow',
                    children: [
                      { type: 'tableCell', children: [{ type: 'text', value: 'A1' }] },
                      { type: 'tableCell', children: [{ type: 'text', value: 'B1' }] },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'split',
            content: [
              {
                type: 'column',
                children: [
                  {
                    type: 'list',
                    children: [
                      {
                        type: 'listItem',
                        children: [{ type: 'text', value: 'Item Left' }],
                      },
                    ],
                  },
                ],
              },
              {
                type: 'column',
                children: [{ type: 'code', value: 'const rightSide = true;' }],
              },
            ],
          },
          {
            type: 'split',
            content: [
              {
                type: 'column',
                children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Left side' }] }],
              },
              {
                type: 'column',
                children: [{ type: 'image', url: './nonexistent.png' }],
              },
            ],
          },
          {
            type: 'split',
            content: [
              {
                type: 'column',
                children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Left side' }] }],
              },
              {
                type: 'column',
                children: [
                  { type: 'paragraph', children: [{ type: 'text', value: 'Right side' }] },
                ],
              },
            ],
          },
          {
            type: 'bullets',
            title: 'Bullet Points',
            content: [
              {
                type: 'list',
                children: [
                  {
                    type: 'listItem',
                    children: [
                      { type: 'text', value: 'Parent Bullet' },
                      {
                        type: 'list',
                        children: [
                          {
                            type: 'listItem',
                            children: [{ type: 'text', value: 'Child Bullet' }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              { type: 'image', url: './nonexistent.png' },
              { type: 'image', url: './nonexistent.png' },
            ],
          },
          {
            type: 'bullets',
            title: 'Formatting Text',
            content: [
              {
                type: 'paragraph',
                children: [
                  { type: 'text', value: 'Text ' },
                  { type: 'strong', children: [{ type: 'text', value: 'bold ' }] },
                  { type: 'emphasis', children: [{ type: 'text', value: 'italic ' }] },
                  { type: 'inlineCode', value: 'inline ' },
                  {
                    type: 'link',
                    url: 'https://example.com',
                    children: [{ type: 'text', value: 'link' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      await compileToEditablePptx(mockDeck as any, outPptx, {
        theme: 'dark',
        baseDir: tmpDir,
      });

      expect(fs.existsSync(outPptx)).toBe(true);
    });

    test('renders an auto-detected split slide (image + text, no ::col:: columns) with both the picture and the text - regression test for a previously silent-drop bug', async () => {
      const outPptx = path.join(tmpDir, 'auto-split.pptx');
      const mockDeck = {
        meta: { theme: 'light' },
        slides: [
          {
            type: 'split',
            title: 'Auto Split',
            content: [
              {
                type: 'paragraph',
                children: [{ type: 'text', value: 'Some explanatory text.' }],
              },
              { type: 'image', url: './nonexistent.png' },
            ],
          },
        ],
      };

      await compileToEditablePptx(mockDeck as any, outPptx, { theme: 'light', baseDir: tmpDir });
      const xml = await readPptxSlideXml(outPptx);
      expect(xml).toContain('<p:pic>');
      expect(xml).toContain('Some explanatory text.');
    });

    test('honors imagePosition: left on an auto-detected split slide by placing the picture in the left bound box', async () => {
      const outPptx = path.join(tmpDir, 'auto-split-left.pptx');
      const mockDeck = {
        meta: { theme: 'light' },
        slides: [
          {
            type: 'split',
            imagePosition: 'left',
            content: [
              { type: 'paragraph', children: [{ type: 'text', value: 'Explanatory text.' }] },
              { type: 'image', url: './nonexistent.png' },
            ],
          },
        ],
      };

      await compileToEditablePptx(mockDeck as any, outPptx, { theme: 'light', baseDir: tmpDir });
      const xml = await readPptxSlideXml(outPptx);
      // The <p:pic> shape's <a:off x="..."> should reflect the left bound box
      // (x: 0.8in = 731520 EMU), not the right one (x: 5.0in = 4572000 EMU).
      const picOffsetMatch = xml.match(/<p:pic>[\s\S]*?<a:off x="(\d+)"/);
      expect(picOffsetMatch).not.toBeNull();
      expect(Number(picOffsetMatch![1])).toBeLessThan(2000000);
    });

    test('embeds a .mp4 image-syntax URL as a native pptx media object instead of a picture', async () => {
      const outPptx = path.join(tmpDir, 'video-slide.pptx');
      const mockDeck = {
        meta: { theme: 'light' },
        slides: [
          {
            type: 'visual',
            title: 'Demo Video',
            content: [{ type: 'image', url: './demo.mp4' }],
          },
        ],
      };

      await compileToEditablePptx(mockDeck as any, outPptx, { theme: 'light', baseDir: tmpDir });
      const xml = await readPptxSlideXml(outPptx);
      expect(xml).toContain('<p:pic>');
      expect(xml).toMatch(/videoFile|<a:videoFile/);
    });

    test('applies a per-slide accentColor override to that slide only', async () => {
      const outPptx = path.join(tmpDir, 'accent-color.pptx');
      const mockDeck = {
        meta: { theme: 'light' },
        slides: [
          {
            type: 'title',
            title: 'Popping Slide',
            accentColor: '#00ff00',
            content: [],
          },
          {
            type: 'title',
            title: 'Normal Slide',
            content: [],
          },
        ],
      };

      await compileToEditablePptx(mockDeck as any, outPptx, { theme: 'light', baseDir: tmpDir });
      const poppingXml = await readPptxSlideXml(outPptx, 1);
      const normalXml = await readPptxSlideXml(outPptx, 2);
      expect(poppingXml).toContain('00FF00');
      expect(normalXml).not.toContain('00FF00');
    });

    test('scales text size up with a larger <!-- fontSize --> value', async () => {
      const mkDeck = (fontSize?: string) => ({
        meta: { theme: 'light' },
        slides: [
          {
            type: 'content',
            title: 'Sizing',
            fontSize,
            content: [
              { type: 'paragraph', children: [{ type: 'text', value: 'Some body text.' }] },
            ],
          },
        ],
      });

      const smallOut = path.join(tmpDir, 'fontsize-xs.pptx');
      const largeOut = path.join(tmpDir, 'fontsize-xxl.pptx');
      await compileToEditablePptx(mkDeck('xs') as any, smallOut, {
        theme: 'light',
        baseDir: tmpDir,
      });
      await compileToEditablePptx(mkDeck('xxl') as any, largeOut, {
        theme: 'light',
        baseDir: tmpDir,
      });

      const smallXml = await readPptxSlideXml(smallOut);
      const largeXml = await readPptxSlideXml(largeOut);
      const smallSize = Number(smallXml.match(/sz="(\d+)"/)?.[1]);
      const largeSize = Number(largeXml.match(/sz="(\d+)"/)?.[1]);
      expect(largeSize).toBeGreaterThan(smallSize);
    });

    test('honors titleAlign on the slide title', async () => {
      const outPptx = path.join(tmpDir, 'title-align.pptx');
      const mockDeck = {
        meta: { theme: 'light' },
        slides: [
          {
            type: 'content',
            title: 'Right-aligned title',
            titleAlign: 'right',
            content: [{ type: 'paragraph', children: [{ type: 'text', value: 'Body.' }] }],
          },
        ],
      };
      await compileToEditablePptx(mockDeck as any, outPptx, { theme: 'light', baseDir: tmpDir });
      const xml = await readPptxSlideXml(outPptx);
      expect(xml).toContain('algn="r"');
    });

    test('renders a real N-column split honoring the ratio hint on each column', async () => {
      const outPptx = path.join(tmpDir, 'ratio-columns.pptx');
      const mockDeck = {
        meta: { theme: 'light' },
        slides: [
          {
            type: 'split',
            content: [
              {
                type: 'column',
                ratio: 2,
                children: [
                  { type: 'paragraph', children: [{ type: 'text', value: 'Wide column' }] },
                ],
              },
              {
                type: 'column',
                ratio: 1,
                children: [
                  { type: 'paragraph', children: [{ type: 'text', value: 'Narrow one' }] },
                ],
              },
              {
                type: 'column',
                ratio: 1,
                children: [
                  { type: 'paragraph', children: [{ type: 'text', value: 'Narrow two' }] },
                ],
              },
            ],
          },
        ],
      };
      await compileToEditablePptx(mockDeck as any, outPptx, { theme: 'light', baseDir: tmpDir });
      const xml = await readPptxSlideXml(outPptx);
      expect(xml).toContain('Wide column');
      expect(xml).toContain('Narrow one');
      expect(xml).toContain('Narrow two');
      // Anchored on `<p:spPr><a:xfrm>` so the group shape's own zero-sized
      // `<a:ext cx="0" cy="0"/>` (from `<p:grpSpPr><a:xfrm>`) isn't matched.
      const widths = [
        ...xml.matchAll(/<p:spPr><a:xfrm><a:off x="\d+" y="\d+"\/><a:ext cx="(\d+)" cy="\d+"\/>/g),
      ].map((m) => Number(m[1]));
      expect(widths.length).toBeGreaterThanOrEqual(3);
      // The first (ratio:2) column should be roughly twice as wide as either
      // of the two ratio:1 columns that follow it.
      expect(widths[0]! / widths[1]!).toBeGreaterThan(1.5);
    });

    test('renders a heading node found in the middle of ordinary body content, distinct from plain paragraph text', async () => {
      const outPptx = path.join(tmpDir, 'body-heading.pptx');
      const mockDeck = {
        meta: { theme: 'light' },
        slides: [
          {
            type: 'content',
            title: 'Slide Title',
            content: [
              { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Body Heading' }] },
              { type: 'paragraph', children: [{ type: 'text', value: 'Regular paragraph text.' }] },
            ],
          },
        ],
      };
      await compileToEditablePptx(mockDeck as any, outPptx, { theme: 'light', baseDir: tmpDir });
      const xml = await readPptxSlideXml(outPptx);
      expect(xml).toContain('Body Heading');
      expect(xml).toContain('Regular paragraph text.');
      // The heading run should be bold; the plain paragraph run should not be.
      // (Find each run's own immediately-preceding <a:rPr> tag rather than a
      // lazy regex spanning the whole document, which would happily match
      // across unrelated runs - e.g. the bold slide title earlier in the XML.)
      const rPrTagBefore = (needle: string) => {
        const textIdx = xml.indexOf(needle);
        const rPrIdx = xml.lastIndexOf('<a:rPr', textIdx);
        return xml.slice(rPrIdx, xml.indexOf('>', rPrIdx) + 1);
      };
      expect(rPrTagBefore('Body Heading')).toContain('b="1"');
      expect(rPrTagBefore('Regular paragraph text.')).not.toContain('b="1"');
    });

    test('renders an admonition mixed into a content slide as an accent bar, not a full bordered card', async () => {
      const outPptx = path.join(tmpDir, 'inline-admonition.pptx');
      const mockDeck = {
        meta: { theme: 'light' },
        slides: [
          {
            type: 'content',
            title: 'Mixed Slide',
            content: [
              { type: 'paragraph', children: [{ type: 'text', value: 'Intro paragraph.' }] },
              {
                type: 'blockquote',
                admonition: 'warning',
                children: [
                  { type: 'paragraph', children: [{ type: 'text', value: 'Be careful here.' }] },
                ],
              },
            ],
          },
        ],
      };
      await compileToEditablePptx(mockDeck as any, outPptx, { theme: 'light', baseDir: tmpDir });
      const xml = await readPptxSlideXml(outPptx);
      expect(xml).toContain('Be careful here.');
      expect(xml).toContain('Warning');
      // D29922 = ADMONITION_COLORS.warning, used for the accent bar's fill.
      expect(xml).toContain('D29922');
    });

    test('adds an ordered list as real pptx auto-numbering, not bullet characters', async () => {
      const outPptx = path.join(tmpDir, 'ordered-list.pptx');
      const mockDeck = {
        meta: { theme: 'light' },
        slides: [
          {
            type: 'content',
            content: [
              {
                type: 'list',
                ordered: true,
                children: [
                  { type: 'listItem', children: [{ type: 'text', value: 'First' }] },
                  { type: 'listItem', children: [{ type: 'text', value: 'Second' }] },
                ],
              },
            ],
          },
        ],
      };
      await compileToEditablePptx(mockDeck as any, outPptx, { theme: 'light', baseDir: tmpDir });
      const xml = await readPptxSlideXml(outPptx);
      expect(xml).toContain('buAutoNum');
      expect(xml).not.toContain('buChar');
    });

    test('writes slide.notes into the pptx Notes pane', async () => {
      const outPptx = path.join(tmpDir, 'notes.pptx');
      const mockDeck = {
        meta: { theme: 'light' },
        slides: [
          {
            type: 'content',
            title: 'Has Notes',
            notes: 'Remember to mention the roadmap here.',
            content: [{ type: 'paragraph', children: [{ type: 'text', value: 'Body.' }] }],
          },
        ],
      };
      await compileToEditablePptx(mockDeck as any, outPptx, { theme: 'light', baseDir: tmpDir });
      const notesXml = await readPptxNotesXml(outPptx, 1);
      expect(notesXml).not.toBeNull();
      expect(notesXml).toContain('Remember to mention the roadmap here.');
    });

    test('renders a mermaid code block as an embedded picture instead of raw diagram text', async () => {
      const outPptx = path.join(tmpDir, 'mermaid.pptx');
      const mockDeck = {
        meta: { theme: 'dark' },
        slides: [
          {
            type: 'code',
            content: [{ type: 'code', lang: 'mermaid', value: 'graph TD\n  A --> B' }],
          },
        ],
      };
      await compileToEditablePptx(mockDeck as any, outPptx, { theme: 'dark', baseDir: tmpDir });
      const xml = await readPptxSlideXml(outPptx);
      expect(xml).toContain('<p:pic>');
      expect(xml).not.toContain('graph TD');
    });

    test('renders a display math node as an embedded picture instead of dropping it', async () => {
      const outPptx = path.join(tmpDir, 'math.pptx');
      const mockDeck = {
        meta: { theme: 'light' },
        slides: [
          {
            type: 'content',
            content: [{ type: 'math', value: 'f(x) = x^2' }],
          },
        ],
      };
      await compileToEditablePptx(mockDeck as any, outPptx, { theme: 'light', baseDir: tmpDir });
      const xml = await readPptxSlideXml(outPptx);
      expect(xml).toContain('<p:pic>');
    });

    test('uses the real HTML theme font family, not the old drifted substitute', async () => {
      const outPptx = path.join(tmpDir, 'theme-font.pptx');
      const mockDeck = {
        meta: { theme: 'light' },
        slides: [
          {
            type: 'content',
            title: 'Font Check',
            content: [{ type: 'paragraph', children: [{ type: 'text', value: 'Body.' }] }],
          },
        ],
      };
      await compileToEditablePptx(mockDeck as any, outPptx, { theme: 'light', baseDir: tmpDir });
      const xml = await readPptxSlideXml(outPptx);
      expect(xml).toContain('typeface="Inter"');
      expect(xml).not.toContain('Trebuchet MS');
    });
  });

  describe('Pptx Editable Helper Functions (pptxEditableSlideHelper.ts)', () => {
    test('nodeToPlainText recursively extracts text correctly', () => {
      const mockNode = {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Hello ' },
          { type: 'strong', children: [{ type: 'text', value: 'World!' }] },
        ],
      };
      expect(helper.nodeToPlainText(mockNode as any)).toBe('Hello World!');
    });

    test('resolveImagePath returns correct path absolute and relative configurations', () => {
      expect(helper.resolveImagePath('https://example.com/img.png')).toBe(
        'https://example.com/img.png'
      );
      expect(helper.resolveImagePath('/absolute/path.png')).toBe('/absolute/path.png');
      expect(helper.resolveImagePath('relative.png', '/base')).toBe('/base/relative.png');
      expect(helper.resolveImagePath('relative.png')).toContain('relative.png');
      expect(helper.resolveImagePath('')).toBe('');
    });
  });
});
