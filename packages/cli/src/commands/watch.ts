import fs from 'fs';
import http from 'http';
import path from 'path';
import net from 'net';
import chokidar from 'chokidar';
import { Logger } from '../logger/index.js';
import { Spinner } from '../ui/spinner.js';
import { onShutdown } from '../middleware/signals.js';
import { InputNotFoundError, PortInUseError, StdinUnsupportedError } from '../middleware/errors.js';
import { runCompile } from './compile.js';
import type { WatchOptions } from '../types/index.js';
import { link, createStaticServer, isStdio } from '../utils/index.js';
import { WATCH_CONFIG, WATCH_MESSAGES, ERROR_OVERLAY_TEMPLATE } from '../constants/index.js';

function buildErrorHtml(err: unknown): string {
  const e = err instanceof Error ? err : new Error(String(err));
  const hint = (e as any).hint as string | undefined;
  const escaped = e.message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return ERROR_OVERLAY_TEMPLATE(escaped, hint);
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port);
  });
}

async function findPort(preferred: number): Promise<number> {
  for (let p = preferred; p < preferred + WATCH_CONFIG.PORT_SCAN_RANGE; p++) {
    if (await isPortFree(p)) return p;
  }
  throw new PortInUseError(preferred);
}

export async function watchCommand(inputFile: string, opts: WatchOptions): Promise<void> {
  const log = new Logger(opts.json ? 'silent' : (opts.logLevel ?? 'info'));
  const absInput = path.resolve(inputFile);

  const reportError = (err: unknown): void => {
    if (opts.json) {
      const e = err instanceof Error ? err : new Error(String(err));
      process.stdout.write(
        `${JSON.stringify({ file: absInput, success: false, error: e.message, code: (e as any).code }, null, 2)}\n`
      );
    } else {
      log.error(err);
    }
  };

  if (isStdio(inputFile)) {
    const err = new StdinUnsupportedError(
      'watch does not support stdin input: there is nothing on disk to watch for changes.',
      'Save the deck to a file and pass its path, e.g. mdslide watch slides.md'
    );
    reportError(err);
    throw err;
  }

  try {
    await fs.promises.access(absInput);
  } catch {
    const err = new InputNotFoundError(absInput);
    reportError(err);
    throw err;
  }

  let cachedHtml = '';
  const clients: http.ServerResponse[] = [];

  const spinner = new Spinner(log);
  spinner.start(WATCH_MESSAGES.SPINNER_START(path.basename(absInput)));

  let initialSlideCount = 0;
  try {
    const { html, slideCount } = await runCompile(absInput, opts, log, { injectReload: true });
    cachedHtml = html;
    initialSlideCount = slideCount;
    spinner.succeed(WATCH_MESSAGES.SPINNER_READY);
  } catch (err) {
    spinner.fail(WATCH_MESSAGES.SPINNER_FAIL);
    reportError(err);
    throw err;
  }

  // --dry-run: prove the deck compiles, but never start a server.
  if (opts.dryRun) {
    if (opts.json) {
      process.stdout.write(
        `${JSON.stringify(
          { file: absInput, success: true, dryRun: true, slides: initialSlideCount },
          null,
          2
        )}\n`
      );
    } else {
      log.step('[dry-run] compile OK - server not started.');
    }
    return;
  }

  const preferredPort = opts.port ?? WATCH_CONFIG.PORT;
  let port: number;
  try {
    port = await findPort(preferredPort);
  } catch (err) {
    reportError(err);
    throw err;
  }

  const liveReloadHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(': connected\n\n');
    clients.push(res);

    const heartbeat = setInterval(
      () => res.write(': ping\n\n'),
      WATCH_CONFIG.SSE_HEARTBEAT_INTERVAL_MS
    );
    req.on('close', () => {
      clearInterval(heartbeat);
      const i = clients.indexOf(res);
      if (i !== -1) clients.splice(i, 1);
    });
  };

  const baseDir = path.dirname(absInput);
  const server = createStaticServer(
    () => cachedHtml,
    baseDir,
    WATCH_CONFIG.LIVE_RELOAD_PATH,
    liveReloadHandler
  );

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      const url = `http://localhost:${port}`;
      if (opts.json) {
        // NDJSON: one compact JSON object per line so a supervising process
        // can parse the stream incrementally. This is the first line; a
        // {"event":"recompile",...} line follows every subsequent save.
        process.stdout.write(
          `${JSON.stringify({ success: true, url, port, watching: absInput })}\n`
        );
      } else {
        log.raw('');
        log.raw(`  ${link(url)}`);
        log.raw('');
        log.step(WATCH_MESSAGES.WATCHING_FILE(path.relative(process.cwd(), absInput)));
        log.raw('');
      }
      resolve();
    });
  }).catch((err) => {
    reportError(err);
    throw err;
  });

  onShutdown(() => {
    server.close();
    clients.forEach((c) => c.end());
    watcher.close().catch(() => {});
    log.raw('');
    log.step(WATCH_MESSAGES.SERVER_STOPPED);
  });

  if (opts.open && !opts.dryRun) {
    const { default: open } = await import('open').catch(() => ({ default: null }));
    if (open) open(`http://localhost:${port}`).catch(() => {});
  }

  let debounce: NodeJS.Timeout | null = null;

  const watcher = chokidar.watch(absInput, {
    ignoreInitial: true,
  });

  watcher.on('error', (err) => {
    log.verbose(`Watcher encountered an error: ${(err as unknown as Error).message}`);
  });

  watcher.on('change', () => {
    if (debounce) clearTimeout(debounce);
    // Used debounce delay timing variable here
    debounce = setTimeout(async () => {
      log.verbose(WATCH_MESSAGES.CHANGE_DETECTED);

      try {
        const { html, slideCount, warnings } = await runCompile(absInput, opts, log, {
          injectReload: true,
        });
        cachedHtml = html;
        if (opts.json) {
          process.stdout.write(
            `${JSON.stringify({ event: 'recompile', success: true, slides: slideCount, warnings })}\n`
          );
        } else {
          log.success(WATCH_MESSAGES.RECOMPILE_SUCCESS(slideCount));
        }
      } catch (err) {
        if (opts.json) {
          const e = err instanceof Error ? err : new Error(String(err));
          process.stdout.write(
            `${JSON.stringify({ event: 'recompile', success: false, error: e.message, code: (e as any).code })}\n`
          );
        } else {
          log.error(err);
        }
        cachedHtml = buildErrorHtml(err);
      }

      for (let i = clients.length - 1; i >= 0; i--) {
        try {
          clients[i].write('data: reload\n\n');
        } catch {
          clients.splice(i, 1);
        }
      }
    }, WATCH_CONFIG.DEBOUNCE_DELAY_MS);
  });
}
