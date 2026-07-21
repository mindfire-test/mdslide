import fs from 'fs';
import path from 'path';
import { Logger } from '../logger/index.js';
import type { InitOptions } from '../types/index.js';
import { SAMPLE_SLIDES } from '../constants/sampleSlide.js';
import { SAMPLE_CONFIG } from '../constants/sampleConfig.js';
import { DEV_COMMANDS, FILE_NAME, INIT_MESSAGES } from '../constants/logs/initCommandLogs.js';

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function initCommand(opts: InitOptions): Promise<void> {
  const log = new Logger(opts.json ? 'silent' : (opts.logLevel ?? 'info'));
  const dryRun = Boolean(opts.dryRun);
  const cwd = process.cwd();
  const slidesPath = path.join(cwd, FILE_NAME.SAMPLE_FILE_NAME);
  const configPath = path.join(cwd, FILE_NAME.SAMPLE_CONFIG_FILE_NAME);

  const created: string[] = [];
  const skipped: string[] = [];
  let scriptsAdded = false;

  const scaffold = async (
    filePath: string,
    name: string,
    content: string,
    messages: { created: string; exists: string }
  ): Promise<void> => {
    if (!(await fileExists(filePath)) || opts.force) {
      if (!dryRun) await fs.promises.writeFile(filePath, content);
      created.push(name);
      log.success(dryRun ? `[dry-run] would create ${name}` : messages.created);
    } else {
      skipped.push(name);
      log.warn(messages.exists);
    }
  };

  await scaffold(slidesPath, FILE_NAME.SAMPLE_FILE_NAME, SAMPLE_SLIDES, {
    created: INIT_MESSAGES.SLIDES_CREATED,
    exists: INIT_MESSAGES.SLIDES_EXISTS,
  });
  await scaffold(configPath, FILE_NAME.SAMPLE_CONFIG_FILE_NAME, SAMPLE_CONFIG, {
    created: INIT_MESSAGES.CONFIG_CREATED,
    exists: INIT_MESSAGES.CONFIG_EXISTS,
  });

  const pkgPath = path.join(cwd, FILE_NAME.PACKAGE_NAME);
  if (await fileExists(pkgPath)) {
    try {
      const pkg = JSON.parse(await fs.promises.readFile(pkgPath, 'utf8'));
      if (!pkg.scripts?.dev) {
        pkg.scripts = {
          ...pkg.scripts,
          dev: DEV_COMMANDS.DEV,
          build: DEV_COMMANDS.BUILD,
        };
        if (!dryRun) await fs.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        scriptsAdded = true;
        log.success(
          dryRun
            ? `[dry-run] would add "dev" and "build" scripts to package.json`
            : INIT_MESSAGES.SCRIPTS_ADDED
        );
      }
    } catch {}
  }

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify({ success: true, dryRun, created, skipped, scriptsAdded }, null, 2)}\n`
    );
    return;
  }

  if (created.length > 0) {
    log.raw('');
    log.step(INIT_MESSAGES.NEXT_STEPS);
    log.raw('');
  }
}
