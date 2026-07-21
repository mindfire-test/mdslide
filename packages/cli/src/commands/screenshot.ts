import path from 'path';
import { Logger } from '../logger/index.js';
import { Spinner } from '../ui/spinner.js';
import { CompileError } from '../middleware/errors.js';
import type { ScreenshotOptions } from '../types/index.js';
import { compileToScreenshots } from '../exports/screenshotExporter.js';
import { isStdio } from '../utils/index.js';
import { runCompile } from './compile.js';

export async function screenshotCommand(inputFile: string, opts: ScreenshotOptions): Promise<void> {
  const isStdin = isStdio(inputFile);
  const log = new Logger(opts.json ? 'silent' : (opts.logLevel ?? 'info'));
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
    } else {
      log.error(err);
    }
  };

  spinner.start(`Compiling ${isStdin ? '<stdin>' : path.basename(absInput)}...`);

  let html: string;
  let slideCount: number;
  let warnings: string[];
  try {
    const result = await runCompile(isStdin ? inputFile : absInput, opts, log);
    html = result.html;
    slideCount = result.slideCount;
    warnings = result.warnings;
  } catch (err) {
    spinner.fail();
    reportError(err);
    throw err;
  }

  if (opts.slide !== undefined && (opts.slide < 1 || opts.slide > slideCount)) {
    spinner.fail();
    const err = new CompileError(
      `--slide ${opts.slide} is out of range: this deck has ${slideCount} slide${slideCount === 1 ? '' : 's'}.`,
      { file: absInput }
    );
    reportError(err);
    throw err;
  }

  const outputDir = opts.output ?? 'screenshots';
  const absOutputDir = path.resolve(outputDir);
  const baseDir = isStdin ? process.cwd() : path.dirname(absInput);
  const shotCount = opts.slide !== undefined ? 1 : slideCount;

  let pngPaths: string[] = [];
  if (!opts.dryRun) {
    spinner.update('Launching Chrome to capture slide screenshots...');
    try {
      pngPaths = await compileToScreenshots(html, slideCount, absOutputDir, {
        theme: opts.theme,
        width: opts.width,
        height: opts.height,
        slide: opts.slide,
        baseDir,
      });
    } catch (err) {
      spinner.fail();
      reportError(err);
      throw err;
    }
  }

  const relOutputDir = path.relative(process.cwd(), absOutputDir) || '.';
  spinner.succeed(
    opts.dryRun
      ? `[dry-run] would capture ${shotCount} screenshot${shotCount === 1 ? '' : 's'} to ${relOutputDir}/`
      : `Captured ${shotCount} screenshot${shotCount === 1 ? '' : 's'} to ${relOutputDir}/`
  );

  if (warnings.length) {
    for (const w of warnings) log.warn(w);
  }

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          file: absInput,
          outputDir: absOutputDir,
          slides: slideCount,
          screenshots: pngPaths,
          warnings,
          dryRun: Boolean(opts.dryRun),
          success: true,
        },
        null,
        2
      )}\n`
    );
  }
}
