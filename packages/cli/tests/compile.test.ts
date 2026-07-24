/// <reference types="node" />
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { runCompile, compileCommand } from '../src/commands/compile.ts';
import { Logger } from '../src/logger/index.ts';
import { Compiler } from '@mindfiredigital/mdslide-core';
import process from 'process';

// Temporarily replaces process.stdin with a readable stream yielding `content`,
// returning a restore function so tests don't leak the fake stream.
function mockStdin(content: string): () => void {
  const original = process.stdin;
  const stream = Readable.from([Buffer.from(content, 'utf8')]);
  Object.defineProperty(process, 'stdin', { value: stream, configurable: true });
  return () => Object.defineProperty(process, 'stdin', { value: original, configurable: true });
}

// Mock exporter modules to avoid spawning chrome
vi.mock('../src/exports/pdfExports.js', () => ({
  compileToPdf: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../src/exports/pptxExports.js', () => ({
  compileToScreenshotPptx: vi.fn().mockResolvedValue(undefined),
  compileToEditablePptx: vi.fn().mockResolvedValue(undefined),
}));

// Mock open package
vi.mock('open', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Setup conditional mock for mdslide-core dynamic import error
let mockCoreThrow = false;
vi.mock('@mindfiredigital/mdslide-core', async () => {
  const actual = await vi.importActual<any>('@mindfiredigital/mdslide-core');
  return {
    ...actual,
    get Compiler() {
      if (mockCoreThrow) {
        throw new Error('mock core load error');
      }
      return actual.Compiler;
    },
  };
});

describe('CLI Compile Command', () => {
  const tmpDir = path.join(__dirname, 'tmp-compile');
  const sampleMd = path.join(tmpDir, 'slides.md');
  const outputHtml = path.join(tmpDir, 'output.html');

  let exitSpy: any;
  let logSpy: any;

  beforeEach(() => {
    mockCoreThrow = false;
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(sampleMd, '# Title\nContent\n');

    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((code?: string | number | null | undefined) => {
        throw new Error(`process.exit called with code: ${code}`);
      });
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    exitSpy.mockRestore();
    logSpy.mockRestore();
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('runCompile compiles markdown to HTML successfully', async () => {
    const log = new Logger('silent');
    const result = await runCompile(sampleMd, { theme: 'light' }, log);

    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('Title');
    expect(result.slideCount).toBe(1);
    expect(result.warnings).toEqual([]);
  });

  test('runCompile throws InputNotFoundError if input file does not exist', async () => {
    const log = new Logger('silent');
    await expect(runCompile('nonexistent.md', {}, log)).rejects.toThrow();
  });

  test('runCompile throws CompileError if core Compiler fails to import', async () => {
    mockCoreThrow = true;
    const log = new Logger('silent');
    await expect(runCompile(sampleMd, {}, log)).rejects.toThrow(
      'Cannot find @mindfiredigital/mdslide-core'
    );
  });

  test('runCompile throws CompileError if compiler compile method throws', async () => {
    const log = new Logger('silent');
    vi.spyOn(Compiler.prototype, 'compile').mockImplementation(() => {
      throw new Error('Internal compilation error');
    });

    await expect(runCompile(sampleMd, {}, log)).rejects.toThrow('Internal compilation error');
  });

  test('compileCommand creates output HTML file', async () => {
    await compileCommand(sampleMd, {
      theme: 'dark',
      output: outputHtml,
      format: 'html',
      logLevel: 'silent',
    });

    expect(fs.existsSync(outputHtml)).toBe(true);
    const content = fs.readFileSync(outputHtml, 'utf8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('data-theme="dark"');
  });

  test('compileCommand handles invalid formats and exits', async () => {
    await expect(
      compileCommand(sampleMd, {
        format: 'invalid' as any,
        output: 'out.invalid',
        logLevel: 'silent',
      })
    ).rejects.toThrow('Unknown output format');
  });

  test('compileCommand auto-detects format from output file extension', async () => {
    const outputPdf = path.join(tmpDir, 'output.pdf');
    const outputPptx = path.join(tmpDir, 'output.pptx');
    const { compileToPdf } = await import('../src/exports/pdfExports.js');
    const { compileToEditablePptx } = await import('../src/exports/pptxExports.js');

    //  pdf auto-detection
    await compileCommand(sampleMd, {
      output: outputPdf,
      logLevel: 'silent',
    });
    expect(compileToPdf).toHaveBeenCalled();

    //  pptx auto-detection
    await compileCommand(sampleMd, {
      output: outputPptx,
      pptxMode: 'editable',
      logLevel: 'silent',
    });
    expect(compileToEditablePptx).toHaveBeenCalled();
  });

  test('compileCommand calls compileToScreenshotPptx in screenshot mode', async () => {
    const outputPptx = path.join(tmpDir, 'output-ss.pptx');
    const { compileToScreenshotPptx } = await import('../src/exports/pptxExports.js');

    await compileCommand(sampleMd, {
      output: outputPptx,
      format: 'pptx',
      pptxMode: 'screenshot',
      logLevel: 'silent',
    });
    expect(compileToScreenshotPptx).toHaveBeenCalled();
  });

  test('compileCommand logs compiler warnings', async () => {
    vi.spyOn(Compiler.prototype, 'compile').mockReturnValue({
      html: '<div>compiled</div>',
      slides: [],
      warnings: ['Mock Compiler Warning Message'],
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await compileCommand(sampleMd, {
      output: outputHtml,
      format: 'html',
      logLevel: 'info',
    });

    const outputLog = warnSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(outputLog).toContain('Mock Compiler Warning Message');
  });

  test('compileCommand opens the output file in browser if open option is true', async () => {
    const { default: open } = await import('open');

    await compileCommand(sampleMd, {
      output: outputHtml,
      format: 'html',
      open: true,
      logLevel: 'silent',
    });

    expect(open).toHaveBeenCalledWith(path.resolve(outputHtml));
  });

  test('compileCommand throws error if an error is thrown in export phase', async () => {
    const { compileToPdf } = await import('../src/exports/pdfExports.js');
    vi.mocked(compileToPdf).mockRejectedValueOnce(new Error('PDF export failed'));

    await expect(
      compileCommand(sampleMd, {
        output: 'out.pdf',
        format: 'pdf',
        logLevel: 'silent',
      })
    ).rejects.toThrow('PDF export failed');
  });

  describe('stdin/stdout piping', () => {
    test('runCompile reads Markdown from stdin when input is "-"', async () => {
      const restore = mockStdin('# From Stdin\nHello\n');
      try {
        const log = new Logger('silent');
        const result = await runCompile('-', { theme: 'light' }, log);
        expect(result.html).toContain('From Stdin');
        expect(result.slideCount).toBe(1);
      } finally {
        restore();
      }
    });

    test('compileCommand compiles stdin input to a real output file', async () => {
      const restore = mockStdin('# Stdin To File\n');
      try {
        await compileCommand('-', { output: outputHtml, format: 'html', logLevel: 'silent' });
        expect(fs.existsSync(outputHtml)).toBe(true);
        expect(fs.readFileSync(outputHtml, 'utf8')).toContain('Stdin To File');
      } finally {
        restore();
      }
    });

    test('compileCommand streams html to stdout when --output is "-"', async () => {
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      await compileCommand(sampleMd, { output: '-', format: 'html', logLevel: 'silent' });

      const written = writeSpy.mock.calls.map((c: any) => c[0]).join('');
      expect(written).toContain('<!DOCTYPE html>');
      expect(fs.existsSync(path.join(tmpDir, '-'))).toBe(false);
    });

    test('compileCommand rejects non-html format when --output is "-"', async () => {
      await expect(
        compileCommand(sampleMd, { output: '-', format: 'pdf', logLevel: 'silent' })
      ).rejects.toThrow(/only html/);
    });

    test('compileCommand rejects combining --json with --output "-"', async () => {
      await expect(
        compileCommand(sampleMd, { output: '-', format: 'html', json: true })
      ).rejects.toThrow(/stdout/);
    });
  });
});
