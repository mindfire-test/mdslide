import path from 'path';
import { Logger } from '../logger/index.js';
import { STYLES, COLORS, ERASE, CURSOR } from '../constants/index.js';
import { InteractiveResult } from '../types/index.js';
import { outputFormat, themeTypes } from '../constants/formats.js';
import { c } from './helper/helper.js';
import { confirm, input, select } from './helper/index.js';

// Interactive Prompt FLow Orchastrator
export async function runInteractivePrompt(
  inputFile: string,
  promptOpts: { auto?: boolean; silent?: boolean } = {}
): Promise<InteractiveResult> {
  const log = new Logger(promptOpts.silent ? 'silent' : 'info');
  const name = path.basename(inputFile);

  if (promptOpts.auto) {
    const format = outputFormat[0]!.value;
    const theme = themeTypes[0]!.value;
    const output = `output.${format}`;
    log.raw('');
    log.raw(
      `  ${c(COLORS.magenta + STYLES.bold, '✦ mdslide')}  ${c(COLORS.grey, `→ ${name} (auto-accepted defaults)`)}`
    );
    log.raw(`  ${c(COLORS.grey, 'format')}  ${c(COLORS.cyan + STYLES.bold, format.toUpperCase())}`);
    log.raw(`  ${c(COLORS.grey, 'theme ')}  ${c(COLORS.cyan + STYLES.bold, theme)}`);
    log.raw(`  ${c(COLORS.grey, 'output')}  ${c(COLORS.cyan + STYLES.bold, output)}`);
    log.raw('');
    return { format, theme, output, watch: false, open: false, pptxMode: 'screenshot' };
  }

  log.raw('');
  log.raw(`  ${c(COLORS.magenta + STYLES.bold, '✦ mdslide')}  ${c(COLORS.grey, `→ ${name}`)}`);
  log.raw(`  ${c(COLORS.grey, '─'.repeat(40))}`);

  // Outpur Format
  const format = await select<string>('Output format', outputFormat, { color: true });

  // Themes
  const theme = await select<string>('Theme', themeTypes, { color: true });

  // output File
  const defaultOut = `output.${format}`;
  const output = await input('Output file', defaultOut);

  // pptx mode
  let pptxMode: 'screenshot' | 'editable' = 'screenshot';
  if (format === 'pptx') {
    const pptxModeChoices = [
      {
        label: 'Screenshot',
        value: 'screenshot' as const,
        hint: 'Pixel-perfect rendering',
        color: COLORS.green,
      },
      {
        label: 'Editable/Normal',
        value: 'editable' as const,
        hint: 'Drag and drop native elements',
        color: COLORS.blue,
      },
    ];
    pptxMode = await select<'screenshot' | 'editable'>('PPTX mode', pptxModeChoices, {
      color: true,
    });
  }

  // watch mode
  let watch = false;
  if (format === 'html') {
    watch = await confirm('Start live-reload watch server?', false);
  }

  // open after Compilation
  const open = await confirm('Open after compile?', true);

  // Summary
  log.raw('');
  log.raw(`  ${c(COLORS.grey, '─'.repeat(40))}`);
  log.raw(`  ${c(COLORS.grey, 'format')}  ${c(COLORS.cyan + STYLES.bold, format.toUpperCase())}`);
  if (format === 'pptx') {
    log.raw(`  ${c(COLORS.grey, 'pptxMode')}  ${c(COLORS.cyan + STYLES.bold, pptxMode)}`);
  }
  log.raw(`  ${c(COLORS.grey, 'theme ')}  ${c(COLORS.cyan + STYLES.bold, theme)}`);
  log.raw(`  ${c(COLORS.grey, 'output')}  ${c(COLORS.cyan + STYLES.bold, output)}`);
  if (format === 'html') {
    log.raw(`  ${c(COLORS.grey, 'watch ')}  ${c(COLORS.cyan + STYLES.bold, watch ? 'yes' : 'no')}`);
  }
  log.raw(`  ${c(COLORS.grey, 'open  ')}  ${c(COLORS.cyan + STYLES.bold, open ? 'yes' : 'no')}`);
  log.raw('');

  const go = await confirm('Compile now?', true);
  if (!go) {
    log.raw(`\n  ${c(COLORS.grey, 'Cancelled.')}\n`);
    process.exit(0);
  }

  log.raw('');
  return { format, theme, output, watch, open, pptxMode };
}
