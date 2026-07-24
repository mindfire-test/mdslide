/// <reference types="node" />
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { screenshotCommand } from '../src/commands/screenshot.ts';
import process from 'process';

function mockStdin(content: string): () => void {
  const original = process.stdin;
  const stream = Readable.from([Buffer.from(content, 'utf8')]);
  Object.defineProperty(process, 'stdin', { value: stream, configurable: true });
  return () => Object.defineProperty(process, 'stdin', { value: original, configurable: true });
}

vi.mock('../src/exports/screenshotExporter.js', () => ({
  compileToScreenshots: vi.fn(
    async (_html: string, slideCount: number, outputDir: string, opts: any) => {
      await fs.promises.mkdir(outputDir, { recursive: true });
      const indexes =
        opts?.slide !== undefined
          ? [opts.slide - 1]
          : Array.from({ length: slideCount }, (_, i) => i);
      const paths: string[] = [];
      for (const i of indexes) {
        const p = path.join(outputDir, `slide-${i + 1}.png`);
        await fs.promises.writeFile(p, 'fake png data');
        paths.push(p);
      }
      return paths;
    }
  ),
}));

describe('CLI Screenshot Command', () => {
  const tmpDir = path.join(__dirname, 'tmp-screenshot');
  const sampleMd = path.join(tmpDir, 'slides.md');
  const missingMd = path.join(tmpDir, 'missing.md');

  let logSpy: any;

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(sampleMd, '# Title\n\n---\n\n## Second\n\nContent\n');
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('captures one PNG per slide into the default output directory', async () => {
    const outputDir = path.join(tmpDir, 'screenshots');
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await screenshotCommand(sampleMd, { output: outputDir, json: true, logLevel: 'silent' });

    const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
    expect(payload.slides).toBe(2);
    expect(payload.screenshots).toHaveLength(2);
    expect(payload.success).toBe(true);
    for (const p of payload.screenshots) expect(fs.existsSync(p)).toBe(true);
  });

  test('captures only the requested --slide', async () => {
    const outputDir = path.join(tmpDir, 'one-slide');
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await screenshotCommand(sampleMd, {
      output: outputDir,
      slide: 2,
      json: true,
      logLevel: 'silent',
    });

    const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
    expect(payload.screenshots).toEqual([path.join(path.resolve(outputDir), 'slide-2.png')]);
  });

  test('rejects an out-of-range --slide', async () => {
    await expect(screenshotCommand(sampleMd, { slide: 99, logLevel: 'silent' })).rejects.toThrow(
      'out of range'
    );
  });

  test('dry-run skips capture and reports zero writes', async () => {
    const outputDir = path.join(tmpDir, 'dry-run');
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await screenshotCommand(sampleMd, {
      output: outputDir,
      dryRun: true,
      json: true,
      logLevel: 'silent',
    });

    const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
    expect(payload.dryRun).toBe(true);
    expect(payload.screenshots).toEqual([]);
    expect(fs.existsSync(outputDir)).toBe(false);
  });

  test('fails and throws if input file does not exist', async () => {
    await expect(screenshotCommand(missingMd, { logLevel: 'silent' })).rejects.toThrow(
      'Input file not found'
    );
  });

  test('reads Markdown piped in on stdin', async () => {
    const restore = mockStdin('# From Stdin\n\nContent here.\n');
    try {
      const outputDir = path.join(tmpDir, 'stdin-shots');
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      await screenshotCommand('-', { output: outputDir, json: true, logLevel: 'silent' });
      const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
      expect(payload.file).toBe('<stdin>');
      expect(payload.slides).toBe(1);
    } finally {
      restore();
    }
  });

  test('propagates errors raised during capture', async () => {
    const { compileToScreenshots } = await import('../src/exports/screenshotExporter.js');
    vi.mocked(compileToScreenshots).mockRejectedValueOnce(
      new Error('Screenshot export requires Google Chrome or Chromium')
    );

    await expect(
      screenshotCommand(sampleMd, { output: path.join(tmpDir, 'fail'), logLevel: 'silent' })
    ).rejects.toThrow('Screenshot export requires Google Chrome or Chromium');
  });
});
