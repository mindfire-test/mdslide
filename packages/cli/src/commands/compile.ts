import fs from 'fs';
import path from 'path';
import { Logger } from '../logger/index.js';
import { Spinner } from '../ui/spinner.js';
import { InvalidFormatError, CompileError, StdoutOutputError } from '../middleware/errors.js';
import type { CompileOptions, OutputFormat } from '../types/index.js';
import { RELOAD_SCRIPT } from '../script/reloadScript.js';
import { COMPILE_CONFIG, COMPILE_MESSAGES } from '../constants/index.js';
import { compileToPdf } from '../exports/pdfExports.js';
import { compileToScreenshotPptx, compileToEditablePptx } from '../exports/pptxExports.js';
import { isStdio, readInputSource } from '../utils/index.js';
import type { Compiler as CompilerType, CompileResult } from '@mindfiredigital/mdslide-core';
import type { Slide } from '@mindfiredigital/mdslide-shared';

// format detection (pdf, pptx, html)
function detectFormat(
  outputFile: string | undefined,
  formatFlag: string | undefined
): OutputFormat {
  if (formatFlag) {
    const f = formatFlag.toLowerCase() as OutputFormat;
    if (!COMPILE_CONFIG.SUPPORTED_FORMATS.includes(f)) throw new InvalidFormatError(formatFlag);
    return f;
  }
  if (outputFile) {
    const ext = path.extname(outputFile).toLowerCase();
    if (ext === '.pdf') return 'pdf';
    if (ext === '.pptx') return 'pptx';
  }
  return COMPILE_CONFIG.DEFAULT_FORMAT;
}

// Core compile
export async function runCompile(
  inputFile: string,
  opts: CompileOptions,
  log: Logger,
  options?: { injectReload?: boolean }
): Promise<{
  html: string;
  slideCount: number;
  warnings: string[];
  slides: Slide[];
  meta: Record<string, unknown>;
}> {
  const markdown = await readInputSource(inputFile);

  let compilerInstance: CompilerType;
  try {
    const core = await import('@mindfiredigital/mdslide-core');
    compilerInstance = new core.Compiler();
  } catch {
    throw new CompileError(COMPILE_MESSAGES.CORE_NOT_FOUND, {});
  }

  let result: CompileResult;

  try {
    result = compilerInstance.compile(markdown, { theme: opts.theme, assetUrls: opts.assetUrls });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new CompileError(message, { file: inputFile });
  }

  let html: string = result.html;
  if (options?.injectReload) {
    html = html.replace('</body>', `${RELOAD_SCRIPT}\n</body>`);
  }

  const slides = result.slides ?? [];
  const meta = result.meta ?? {};
  const slideCount = result.slides?.length ?? 0;
  const warnings = result.warnings ?? [];

  return { html, meta, slides, slideCount, warnings };
}

// Compiler the commands
export async function compileCommand(inputFile: string, opts: CompileOptions): Promise<void> {
  const isStdin = isStdio(inputFile);
  const isStdoutOutput = isStdio(opts.output);

  // --json and a stdout-piped output both want to own stdout; refuse the
  // combo up front instead of interleaving a JSON envelope with raw HTML.
  if (opts.json && isStdoutOutput) {
    const err = new StdoutOutputError(
      'Cannot combine --json with --output - (both write to stdout).'
    );
    new Logger('info').error(err);
    throw err;
  }

  // --json keeps stdout parseable: human logs are silenced, errors are
  // emitted as a JSON object instead. Streaming the compiled file to stdout
  // needs the same silence, so decorated logs don't corrupt the piped output.
  const log = new Logger(opts.json || isStdoutOutput ? 'silent' : (opts.logLevel ?? 'info'));
  const spinner = new Spinner(log);
  const absInput = isStdin ? '<stdin>' : path.resolve(inputFile);

  const reportError = (err: unknown): void => {
    const e = err instanceof Error ? err : new Error(String(err));
    if (opts.json) {
      process.stdout.write(
        `${JSON.stringify(
          {
            file: absInput,
            success: false,
            error: e.message,
            code: (e as any).code,
            hint: (e as any).hint,
          },
          null,
          2
        )}\n`
      );
    } else if (isStdoutOutput) {
      process.stderr.write(`${e.message}\n`);
    } else {
      log.error(err);
    }
  };

  let format: OutputFormat;
  try {
    format = detectFormat(opts.output, opts.format);
  } catch (err) {
    reportError(err);
    throw err;
  }

  if (isStdoutOutput && format !== 'html') {
    const err = new StdoutOutputError(
      `Cannot stream "${format}" output to stdout - only html supports it.`
    );
    reportError(err);
    throw err;
  }

  const outputFile = opts.output ?? `output.${format}`;
  const absOutput = isStdoutOutput ? '<stdout>' : path.resolve(outputFile);

  spinner.start(
    COMPILE_MESSAGES.SPINNER_START(isStdin ? '<stdin>' : path.basename(absInput), format)
  );

  let html: string;
  let slideCount: number;
  let warnings: string[];
  let deck: { slides: Slide[]; meta: Record<string, unknown> };

  try {
    const compileResult = await runCompile(isStdin ? inputFile : absInput, opts, log);
    html = compileResult.html;
    slideCount = compileResult.slideCount;
    warnings = compileResult.warnings;
    deck = { slides: compileResult.slides, meta: compileResult.meta };
  } catch (err) {
    spinner.fail();
    reportError(err);
    throw err;
  }

  const baseDir = isStdin ? process.cwd() : path.dirname(absInput);

  try {
    if (opts.dryRun) {
      // Full compile ran (so errors/warnings are real); skip every side effect.
    } else if (isStdoutOutput) {
      process.stdout.write(html);
    } else if (format === 'html') {
      await fs.promises.mkdir(path.dirname(absOutput), { recursive: true });
      await fs.promises.writeFile(absOutput, html);
    } else if (format === 'pdf') {
      spinner.update('Launching Chrome for PDF export...');
      await compileToPdf(html, absOutput, {
        chromePath: process.env['CHROME_PATH'],
        timeoutMs: opts.pdfTimeoutMs ?? 30_000,
        baseDir,
      });
    } else if (format === 'pptx') {
      const pptxMode = opts.pptxMode ?? 'screenshot';
      spinner.update(`Building PPTX (${pptxMode} mode)...`);
      await fs.promises.mkdir(path.dirname(absOutput), { recursive: true });
      if (pptxMode === 'editable') {
        await compileToEditablePptx(deck, absOutput, {
          theme: opts.theme,
          baseDir,
        });
      } else {
        await compileToScreenshotPptx(html, slideCount, absOutput, {
          theme: opts.theme,
          baseDir,
        });
      }
    }
  } catch (err) {
    spinner.fail();
    reportError(err);
    throw err;
  }

  const relOutput = isStdoutOutput ? '<stdout>' : path.relative(process.cwd(), absOutput);
  spinner.succeed(
    opts.dryRun
      ? COMPILE_MESSAGES.DRY_RUN_SUMMARY(relOutput, slideCount, warnings.length)
      : COMPILE_MESSAGES.SUCCESS_SUMMARY(relOutput, slideCount, warnings.length)
  );

  if (warnings.length) {
    if (isStdoutOutput) {
      for (const w of warnings) process.stderr.write(`${w}\n`);
    } else {
      for (const w of warnings) log.warn(w);
    }
  }

  const strictFailed = Boolean(opts.strict) && warnings.length > 0;

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          file: absInput,
          output: absOutput,
          format,
          slides: slideCount,
          warnings,
          dryRun: Boolean(opts.dryRun),
          written: !opts.dryRun,
          success: !strictFailed,
          ...(strictFailed
            ? {
                error: `Compiled with ${warnings.length} warning${warnings.length !== 1 ? 's' : ''} (--strict).`,
              }
            : {}),
        },
        null,
        2
      )}\n`
    );
  }

  if (strictFailed) {
    const err = new CompileError(
      `Compiled with ${warnings.length} warning${warnings.length !== 1 ? 's' : ''} (--strict).`,
      { file: inputFile }
    );
    if (isStdoutOutput) {
      process.stderr.write(`${err.message}\n`);
    } else if (!opts.json) {
      log.error(err);
    }
    throw err;
  }

  if (opts.open && !opts.dryRun && !isStdoutOutput) {
    const { default: open } = await import('open').catch(() => ({ default: null }));
    if (open) open(absOutput).catch(() => {});
  }
}
