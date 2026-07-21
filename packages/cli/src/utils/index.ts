import { icons } from '../assets/index.js';
import { STYLES, COLORS, COLORS_ENABLED } from '../constants/index.js';

export * from './server.js';
export * from './stdio.js';

export function c(color: string, text: string): string {
  if (!COLORS_ENABLED) return text;
  return `${color}${text}${STYLES.reset}`;
}

export function link(url: string): string {
  if (!COLORS_ENABLED) return url;
  return `${COLORS.cyan}${STYLES.bold}${url}${STYLES.reset}`;
}

export const ICONS = {
  info: c(COLORS.blue, icons.info),
  success: c(COLORS.green, icons.succcess),
  warn: c(COLORS.yellow, icons.warning),
  error: c(COLORS.red, icons.cross),
  step: c(COLORS.cyan, icons.rightArrow),
  dim: c(COLORS.grey, icons.dim),
};
