#!/usr/bin/env node

import { createRequire } from 'module';
import { compileCommand } from './commands/compile.js';
import { watchCommand } from './commands/watch.js';
import { initCommand } from './commands/init.js';
import { validateCommand } from './commands/validate.js';
import { inspectCommand } from './commands/inspect.js';
import { screenshotCommand } from './commands/screenshot.js';
import { llmsCommand } from './commands/llms.js';
import { runInteractivePrompt } from './interactiveCommands/index.js';
import { resolveGlobalFlags, armTimeout } from './middleware/globalFlags.js';
import { InvalidAssetUrlsError } from './middleware/errors.js';
import { Logger } from './logger/index.js';
import { icons } from './assets/index.js';
import { ICONS, STDIO_PLACEHOLDER } from './utils/index.js';
import { COLORS, STYLES } from './constants/terminalEscapeCode.js';
import { type GlobalFlags } from './types/index.js';

const require = createRequire(import.meta.url);

let version = '0.0.0';
try {
  const pkg = require('../package.json');
  version = pkg.version ?? '0.0.0';
} catch {}

let cac: any;
try {
  cac = (await import('cac')).default;
} catch {
  console.error(
    `\n  ${icons.cross}  Missing dependency: cac\n  ${icons.rightArrow} Run: npm install cac\n`
  );
  process.exit(1);
}

const cli = cac('mdslide');

cli.version(version);
cli.usage('<input> [options]');
cli.help();

// Global flags: available on every command.
cli.option('--json', 'Machine-readable JSON output on stdout (for tooling & AI agents)');
cli.option('--no-input', 'Never prompt; use defaults and explicit flags only (CI & agents)');
cli.option('--dry-run', 'Run without writing files, opening apps, or starting servers');
cli.option('--yes', 'Auto-accept all interactive prompts with their defaults');
cli.option('--timeout <ms>', 'Abort if the command runs longer than <ms> milliseconds (exit 124)');

cli.example('  mdslide slides.md                     # Interactive mode (runs wizard)');
cli.example('  mdslide slides.md -i                  # Explicit interactive mode');
cli.example('  mdslide slides.md -t dark --open      # Manual flags mode (bypasses wizard)');
cli.example('  mdslide slides.md --no-input --json   # Agent mode (no prompts, JSON result)');

// Resolves the global flags and arms the --timeout watchdog for one command run.
function globalsOf(opts: Record<string, unknown>): GlobalFlags {
  const flags = resolveGlobalFlags(opts);
  armTimeout(flags);
  return flags;
}

function reportAndExit(err: InvalidAssetUrlsError, jsonMode: boolean): never {
  if (jsonMode) {
    process.stdout.write(
      `${JSON.stringify({ success: false, error: err.message, code: err.code, hint: err.hint })}\n`
    );
  } else {
    new Logger('info').error(err);
  }
  process.exit(1);
}

// Parses --asset-urls <json> into the map compilerInstance.compile() expects,
// exiting with ERR_INVALID_ASSET_URLS on malformed input instead of letting a
// raw JSON.parse exception crash the process.
function parseAssetUrlsFlag(raw: unknown, jsonMode: boolean): Record<string, string> | undefined {
  if (raw === undefined) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw));
  } catch {
    reportAndExit(new InvalidAssetUrlsError('not valid JSON'), jsonMode);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    reportAndExit(new InvalidAssetUrlsError('expected a JSON object'), jsonMode);
  }

  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== 'string') {
      reportAndExit(new InvalidAssetUrlsError(`value for "${key}" must be a string`), jsonMode);
    }
  }

  return parsed as Record<string, string>;
}

cli
  .command('compile <input>', 'Compile a Markdown presentation to HTML, PDF, or PPTX')
  .option(
    '-t, --theme <theme>',
    'Theme: light | dark | notion | terminal | gradient | corporate | solarized'
  )
  .option('-o, --output <file>', 'Output file path  (default: output.<format>)')
  .option('-f, --format <format>', 'Format: html | pdf | pptx  (auto-detected from -o extension)')
  .option('--pptx-mode <mode>', 'PPTX mode: screenshot | editable (default: screenshot)')
  .option(
    '--pdf-timeout <ms>',
    'Abort PDF export if Chrome takes longer than <ms> (default: 30000)'
  )
  .option(
    '--asset-urls <json>',
    'JSON map overriding Prism/KaTeX/Mermaid CDN URLs (offline/CSP embedding)'
  )
  .option('-i, --interactive', 'Run compile interactively')
  .option('--open', 'Open the output file after compile')
  .option('--strict', 'Exit with error on warnings')
  .option('--verbose', 'Verbose log output')
  .option('--silent', 'Suppress all output')
  .example('  mdslide compile slides.md')
  .example('  mdslide compile slides.md -i')
  .example('  mdslide compile slides.md -t dark -o dist/deck.html')
  .example('  mdslide compile slides.md -f pptx -o deck.pptx')
  .example('  mdslide compile slides.md -f pdf --pdf-timeout 60000')
  .example('  mdslide compile slides.md --json --dry-run')
  .example(`  mdslide compile slides.md --asset-urls '{"katexCss":"/vendor/katex.css"}'`)
  .example('  cat slides.md | mdslide compile - -o - -f html   # stdin -> stdout')
  .action(async (input: string, opts: any) => {
    const g = globalsOf(opts);
    const assetUrls = parseAssetUrlsFlag(opts.assetUrls, g.json);
    if (opts.interactive && !g.noInput) {
      const answers = await runInteractivePrompt(input, {
        auto: g.yes,
        silent: g.logLevel === 'silent',
      });
      if (answers.watch) {
        await watchCommand(input, {
          theme: answers.theme,
          open: answers.open,
          ...g,
        }).catch(() => process.exit(1));
      } else {
        await compileCommand(input, {
          theme: answers.theme,
          output: answers.output,
          format: answers.format as any,
          open: answers.open,
          pptxMode: answers.pptxMode,
          ...g,
        }).catch(() => process.exit(1));
      }
      return;
    }

    await compileCommand(input, {
      theme: opts.theme,
      output: opts.output,
      format: opts.format,
      open: opts.open ?? false,
      strict: opts.strict ?? false,
      pptxMode: opts.pptxMode,
      pdfTimeoutMs: opts.pdfTimeout !== undefined ? Number(opts.pdfTimeout) : undefined,
      assetUrls,
      ...g,
    }).catch(() => process.exit(1));
  });

// watch
cli
  .command('watch <input>', 'Start a live-reload preview server')
  .option('-t, --theme <theme>', 'Theme override')
  .option('-p, --port <port>', 'Port for the dev server  (default: 3500)', { default: 3500 })
  .option('--open', 'Open the browser automatically')
  .option('--verbose', 'Verbose log output')
  .option('--silent', 'Suppress all output')
  .example('  mdslide watch slides.md')
  .example('  mdslide watch slides.md --port 4000 --open')
  .action(async (input: string, opts: any) => {
    const g = globalsOf(opts);
    await watchCommand(input, {
      theme: opts.theme,
      port: Number(opts.port) || 3500,
      open: opts.open ?? false,
      ...g,
    }).catch(() => process.exit(1));
  });

// init
cli
  .command('init', 'Scaffold a new presentation in the current directory')
  .option('--force', 'Overwrite existing files')
  .option('--silent', 'Suppress all output')
  .example('  mdslide init')
  .example('  mdslide init --force')
  .example('  mdslide init --dry-run --json')
  .action(async (opts: any) => {
    const g = globalsOf(opts);
    await initCommand({
      force: opts.force ?? false,
      ...g,
    }).catch(() => process.exit(1));
  });

// validate
cli
  .command('validate <input>', 'Lint a Markdown presentation for issues')
  .option('--strict', 'Exit with error on warnings')
  .option('--fix', 'Auto-repair mechanical issues (unclosed fences/notes, stray tags)')
  .option('--verbose', 'Verbose log output')
  .option('--silent', 'Suppress all output')
  .example('  mdslide validate slides.md')
  .example('  mdslide validate slides.md --strict')
  .example('  mdslide validate slides.md --json')
  .example('  mdslide validate slides.md --fix')
  .example('  cat slides.md | mdslide validate - --json   # read from stdin')
  .action(async (input: string, opts: any) => {
    const g = globalsOf(opts);
    await validateCommand(input, {
      strict: opts.strict ?? false,
      fix: opts.fix ?? false,
      ...g,
    }).catch(() => process.exit(1));
  });

// inspect
cli
  .command(
    'inspect <input>',
    'Dump the parsed slide structure (layout, why, element counts, height)'
  )
  .example('  mdslide inspect slides.md')
  .example('  mdslide inspect slides.md --json')
  .action(async (input: string, opts: any) => {
    const g = globalsOf(opts);
    await inspectCommand(input, { ...g }).catch(() => process.exit(1));
  });

// screenshot
cli
  .command(
    'screenshot <input>',
    'Render each slide to a PNG image (for visual review by AI agents & LLMs)'
  )
  .option('-t, --theme <theme>', 'Theme override')
  .option('-o, --output <dir>', 'Output directory for PNGs  (default: ./screenshots)')
  .option('--slide <n>', 'Only capture slide <n> (1-based); default captures every slide')
  .option('--width <px>', 'Viewport width in pixels  (default: 1920)')
  .option('--height <px>', 'Viewport height in pixels  (default: 1080)')
  .option('--verbose', 'Verbose log output')
  .option('--silent', 'Suppress all output')
  .example('  mdslide screenshot slides.md')
  .example('  mdslide screenshot slides.md -o ./previews')
  .example('  mdslide screenshot slides.md --slide 3 --json')
  .action(async (input: string, opts: any) => {
    const g = globalsOf(opts);
    await screenshotCommand(input, {
      theme: opts.theme,
      output: opts.output,
      slide: opts.slide !== undefined ? Number(opts.slide) : undefined,
      width: opts.width !== undefined ? Number(opts.width) : undefined,
      height: opts.height !== undefined ? Number(opts.height) : undefined,
      ...g,
    }).catch(() => process.exit(1));
  });

// llms
cli
  .command(
    'llms',
    'Print the complete Markdown syntax & CLI reference as plain markdown (for AI agents & LLMs)'
  )
  .example('  mdslide llms')
  .example('  mdslide llms > SYNTAX.md')
  .action((opts: any) => {
    // Output is already plain machine-readable markdown; the global flags are
    // accepted but only --timeout has an effect here.
    globalsOf(opts);
    llmsCommand();
  });

// interactive
cli
  .command('interactive <input>', 'Compile a presentation using the interactive wizard')
  .option('--verbose', 'Verbose log output')
  .option('--silent', 'Suppress all output')
  .example('  mdslide interactive slides.md')
  .action(async (input: string, opts: any) => {
    const g = globalsOf(opts);
    const answers = await runInteractivePrompt(input, {
      auto: g.yes || g.noInput,
      silent: g.logLevel === 'silent',
    });

    if (answers.watch) {
      await watchCommand(input, {
        theme: answers.theme,
        open: answers.open,
        ...g,
      }).catch(() => process.exit(1));
    } else {
      await compileCommand(input, {
        theme: answers.theme,
        output: answers.output,
        format: answers.format as any,
        open: answers.open,
        ...g,
      }).catch(() => process.exit(1));
    }
  });

// default command
cli
  .command('<input>', 'Compile a presentation (runs interactively or with manual flags)')
  .option('-t, --theme <theme>', 'Theme override')
  .option('-o, --output <file>', 'Output file path')
  .option('-f, --format <format>', 'Output format: html | pdf | pptx')
  .option('--pptx-mode <mode>', 'PPTX mode: screenshot | editable')
  .option(
    '--pdf-timeout <ms>',
    'Abort PDF export if Chrome takes longer than <ms> (default: 30000)'
  )
  .option(
    '--asset-urls <json>',
    'JSON map overriding Prism/KaTeX/Mermaid CDN URLs (offline/CSP embedding)'
  )
  .option('-i, --interactive', 'Run interactively')
  .option('-w, --watch', 'Start live-reload watch server')
  .option('-p, --port <port>', 'Watch server port  (default: 3500)')
  .option('--open', 'Open output after compile')
  .option('--verbose', 'Verbose log output')
  .option('--silent', 'Suppress all output')
  .example('  mdslide slides.md                     # Interactive mode (runs wizard)')
  .example('  mdslide slides.md -i                  # Explicit interactive mode')
  .example('  mdslide slides.md -t dark --open      # Manual flags mode (bypasses wizard)')
  .action(async (input: string, opts: any) => {
    const g = globalsOf(opts);
    const assetUrls = parseAssetUrlsFlag(opts.assetUrls, g.json);
    const hasFlags = opts.theme || opts.output || opts.format || opts.watch || opts.open;

    // interactive prompt (--no-input always bypasses the wizard)
    if ((opts.interactive || !hasFlags) && !g.noInput) {
      const answers = await runInteractivePrompt(input, {
        auto: g.yes,
        silent: g.logLevel === 'silent',
      });

      if (answers.watch) {
        await watchCommand(input, {
          theme: answers.theme,
          open: answers.open,
          ...g,
        }).catch(() => process.exit(1));
      } else {
        await compileCommand(input, {
          theme: answers.theme,
          output: answers.output,
          format: answers.format as any,
          open: answers.open,
          pptxMode: answers.pptxMode,
          ...g,
        }).catch(() => process.exit(1));
      }
      return;
    }

    // flag's present
    if (opts.watch) {
      await watchCommand(input, {
        theme: opts.theme,
        port: Number(opts.port) || 3500,
        open: opts.open ?? false,
        ...g,
      }).catch(() => process.exit(1));
    } else {
      await compileCommand(input, {
        theme: opts.theme,
        output: opts.output,
        format: opts.format,
        open: opts.open ?? false,
        pptxMode: opts.pptxMode,
        pdfTimeoutMs: opts.pdfTimeout !== undefined ? Number(opts.pdfTimeout) : undefined,
        assetUrls,
        ...g,
      }).catch(() => process.exit(1));
    }
  });

// parse all the commands
try {
  if (process.argv.length <= 2) {
    cli.outputHelp();
    process.exit(0);
  }

  const argv = process.argv.map((arg) => (arg === '-' ? STDIO_PLACEHOLDER : arg));
  cli.parse(argv);
} catch (err: any) {
  const log = new Logger('info');
  log.raw('');
  log.raw(`  ${ICONS.error}  ${err.message}`);
  log.raw(`     ${ICONS.step} ${COLORS.cyan}Run \`mdslide --help\` to see usage.${STYLES.reset}`);
  log.raw('');
  process.exit(1);
}
