import { LogLevel } from '../types/index.js';

function detectColorSupport(): boolean {
  const env = process.env;
  if (env['FORCE_COLOR'] !== undefined && env['FORCE_COLOR'] !== '0') return true;
  if (env['NO_COLOR'] !== undefined && env['NO_COLOR'] !== '') return false;
  if (env['TERM'] === 'dumb') return false;
  return Boolean(process.stdout.isTTY);
}

export const COLORS_ENABLED = detectColorSupport();

const code = (escape: string): string => (COLORS_ENABLED ? escape : '');

// Text Styling
export const STYLES = {
  reset: code('\x1b[0m'),
  bold: code('\x1b[1m'),
  dim: code('\x1b[2m'),
};

// Standard Foreground Colors
export const COLORS = {
  cyan: code('\x1b[36m'),
  green: code('\x1b[32m'),
  yellow: code('\x1b[33m'),
  magenta: code('\x1b[35m'),
  blue: code('\x1b[34m'),
  red: code('\x1b[31m'),
  grey: code('\x1b[90m'),
  white: code('\x1b[37m'),
};

export const ERASE = {
  line: '\x1b[2K', // Erases the entire current line
};

// Cursor Control Sequences
export const CURSOR = {
  up: (n = 1) => `\x1b[${n}A`, // Moves cursor up by n lines
  hide: '\x1b[?25l', // Private Mode: Hides cursor
  show: '\x1b[?25h', // Private Mode: Shows cursor
  carriageReturn: '\r', // Moves cursor to the start of the line
};

export const LEVELS: Record<LogLevel, number> = {
  silent: 0,
  info: 1,
  verbose: 2,
};
