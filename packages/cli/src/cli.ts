#!/usr/bin/env node

import { createRequire } from 'module';
import { compileCommand } from './commands/compile.js';
import { watchCommand } from './commands/watch.js';
import { initCommand } from './commands/init.js';
import { validateCommand } from './commands/validate.js';
import { llmsCommand } from './commands/llms.js';
import { runInteractivePrompt } from './interactiveCommands/index.js';
import { Logger } from './logger/index.js';
import { icons } from './assets/index.js';
import { ICONS } from './utils/index.js';
import { COLORS, STYLES } from './constants/terminalEscapeCode.js';

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

cli.example('  mdslide slides.md                     # Interactive mode (runs wizard)');
cli.example('  mdslide slides.md -i                  # Explicit interactive mode');
cli.example('  mdslide slides.md -t dark --open      # Manual flags mode (bypasses wizard)');

cli
  .command('compile <input>', 'Compile a Markdown presentation to HTML, PDF, or PPTX')
  .option(
    '-t, --theme <theme>',
    'Theme: light | dark | notion | terminal | gradient | corporate | solarized'
  )
  .option('-o, --output <file>', 'Output file path  (default: output.<format>)')
  .option('-f, --format <format>', 'Format: html | pdf | pptx  (auto-detected from -o extension)')
  .option('--pptx-mode <mode>', 'PPTX mode: screenshot | editable (default: screenshot)')
  .option('-i, --interactive', 'Run compile interactively')
  .option('--open', 'Open the output file after compile')
  .option('--strict', 'Exit with error on warnings')
  .option('--verbose', 'Verbose log output')
  .option('--silent', 'Suppress all output')
  .example('  mdslide compile slides.md')
  .example('  mdslide compile slides.md -i')
  .example('  mdslide compile slides.md -t dark -o dist/deck.html')
  .example('  mdslide compile slides.md -f pptx -o deck.pptx')
  .action(async (input: string, opts: any) => {
    const logLevel = opts.verbose ? 'verbose' : opts.silent ? 'silent' : 'info';
    if (opts.interactive) {
      const answers = await runInteractivePrompt(input);
      if (answers.watch) {
        await watchCommand(input, {
          theme: answers.theme,
          open: answers.open,
          logLevel,
        }).catch(() => process.exit(1));
      } else {
        await compileCommand(input, {
          theme: answers.theme,
          output: answers.output,
          format: answers.format as any,
          open: answers.open,
          pptxMode: answers.pptxMode,
          logLevel,
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
      logLevel,
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
    await watchCommand(input, {
      theme: opts.theme,
      port: Number(opts.port) || 3500,
      open: opts.open ?? false,
      logLevel: opts.verbose ? 'verbose' : opts.silent ? 'silent' : 'info',
    }).catch(() => process.exit(1));
  });

// init
cli
  .command('init', 'Scaffold a new presentation in the current directory')
  .option('--force', 'Overwrite existing files')
  .option('--silent', 'Suppress all output')
  .example('  mdslide init')
  .example('  mdslide init --force')
  .action(async (opts: any) => {
    await initCommand({
      force: opts.force ?? false,
      logLevel: opts.silent ? 'silent' : 'info',
    });
  });

// validate
cli
  .command('validate <input>', 'Lint a Markdown presentation for issues')
  .option('--strict', 'Exit with error on warnings')
  .option('--verbose', 'Verbose log output')
  .option('--silent', 'Suppress all output')
  .example('  mdslide validate slides.md')
  .example('  mdslide validate slides.md --strict')
  .action(async (input: string, opts: any) => {
    await validateCommand(input, {
      strict: opts.strict ?? false,
      logLevel: opts.verbose ? 'verbose' : opts.silent ? 'silent' : 'info',
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
  .action(() => {
    llmsCommand();
  });

// interactive
cli
  .command('interactive <input>', 'Compile a presentation using the interactive wizard')
  .option('--verbose', 'Verbose log output')
  .option('--silent', 'Suppress all output')
  .example('  mdslide interactive slides.md')
  .action(async (input: string, opts: any) => {
    const logLevel = opts.verbose ? 'verbose' : opts.silent ? 'silent' : 'info';
    const answers = await runInteractivePrompt(input);

    if (answers.watch) {
      await watchCommand(input, {
        theme: answers.theme,
        open: answers.open,
        logLevel,
      }).catch(() => process.exit(1));
    } else {
      await compileCommand(input, {
        theme: answers.theme,
        output: answers.output,
        format: answers.format as any,
        open: answers.open,
        logLevel,
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
    const logLevel = opts.verbose ? 'verbose' : opts.silent ? 'silent' : 'info';
    const hasFlags = opts.theme || opts.output || opts.format || opts.watch || opts.open;

    // interactive prompt
    if (opts.interactive || !hasFlags) {
      const answers = await runInteractivePrompt(input);

      if (answers.watch) {
        await watchCommand(input, {
          theme: answers.theme,
          open: answers.open,
          logLevel,
        }).catch(() => process.exit(1));
      } else {
        await compileCommand(input, {
          theme: answers.theme,
          output: answers.output,
          format: answers.format as any,
          open: answers.open,
          pptxMode: answers.pptxMode,
          logLevel,
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
        logLevel,
      }).catch(() => process.exit(1));
    } else {
      await compileCommand(input, {
        theme: opts.theme,
        output: opts.output,
        format: opts.format,
        open: opts.open ?? false,
        pptxMode: opts.pptxMode,
        logLevel,
      }).catch(() => process.exit(1));
    }
  });

// parse all the commands
try {
  if (process.argv.length <= 2) {
    cli.outputHelp();
    process.exit(0);
  }
  cli.parse(process.argv);
} catch (err: any) {
  const log = new Logger('info');
  log.raw('');
  log.raw(`  ${ICONS.error}  ${err.message}`);
  log.raw(`     ${ICONS.step} ${COLORS.cyan}Run \`mdslide --help\` to see usage.${STYLES.reset}`);
  log.raw('');
  process.exit(1);
}
