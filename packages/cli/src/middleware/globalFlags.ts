import { Logger } from '../logger/index.js';
import { MdSlideError } from './errors.js';
import type { GlobalFlags, LogLevel } from '../types/index.js';

export const TIMEOUT_EXIT_CODE = 124;

export function resolveGlobalFlags(opts: Record<string, unknown>): GlobalFlags {
  const json = Boolean(opts['json']);

  let timeoutMs: number | undefined;
  if (opts['timeout'] !== undefined && opts['timeout'] !== true) {
    const n = Number(opts['timeout']);
    if (!Number.isFinite(n) || n <= 0) {
      throw new MdSlideError({
        code: 'ERR_INVALID_TIMEOUT',
        message: `Invalid --timeout value: "${String(opts['timeout'])}"`,
        hint: 'Pass a positive number of milliseconds, e.g. --timeout 60000',
      });
    }
    timeoutMs = n;
  }

  const logLevel: LogLevel =
    json || opts['silent'] ? 'silent' : opts['verbose'] ? 'verbose' : 'info';

  return {
    json,
    dryRun: Boolean(opts['dryRun']),
    yes: Boolean(opts['yes']),
    noInput: opts['input'] === false,
    timeoutMs,
    logLevel,
  };
}

export function armTimeout(flags: GlobalFlags): () => void {
  if (!flags.timeoutMs) {
    return () => {};
  }

  const timer = setTimeout(() => {
    if (flags.json) {
      process.stdout.write(
        `${JSON.stringify({
          success: false,
          error: `Timed out after ${flags.timeoutMs}ms (--timeout).`,
          code: 'ERR_TIMEOUT',
        })}\n`
      );
    } else {
      new Logger('info').error(
        new MdSlideError({
          code: 'ERR_TIMEOUT',
          message: `Timed out after ${flags.timeoutMs}ms (--timeout).`,
          hint: 'Increase --timeout or investigate what is hanging.',
        })
      );
    }
    process.exit(TIMEOUT_EXIT_CODE);
  }, flags.timeoutMs);

  timer.unref();

  return () => {
    clearTimeout(timer);
  };
}
