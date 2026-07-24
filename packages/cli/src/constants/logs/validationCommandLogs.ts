import { COLORS, STYLES } from '../terminalEscapeCode.js';

export const VALID_THEMES = [
  'light',
  'dark',
  'notion',
  'terminal',
  'gradient',
  'corporate',
  'solarized',
] as const;

export const VALID_GLOBAL_FLAGS = [
  '--json',
  '--no-input',
  '--yes',
  '--dry-run',
  '--timeout <ms>',
] as const;

export const VALIDATION_MESSAGES = {
  NO_SEPARATORS: {
    message: 'No slide separators (---) found.',
    hint: 'Separate slides with a line containing only ---',
  },
  EMPTY_SLIDE: {
    message: 'Slide is empty.',
  },
  NO_HEADING: {
    message: 'Slide has no heading.',
    hint: 'Add a # heading to give the slide a title.',
  },
  UNCLOSED_CODE_FENCE: {
    message: 'Unclosed code fence (```).',
    hint: 'Make sure every opening ``` has a matching closing ```.',
  },

  OVERFLOW: (opts: { heightPx: number; maxHeightPx: number; excessItems: number }) => ({
    message: `Slide content is ~${opts.heightPx - opts.maxHeightPx}px over the visible slide height (~${opts.heightPx}px of a ~${opts.maxHeightPx}px budget) - may overflow in the browser.`,
    hint: `Move or trim the last ${opts.excessItems} block${opts.excessItems !== 1 ? 's' : ''} to a new slide, or add "<!-- overflow: split -->" to auto-continue.`,
  }),

  INVALID_FRONTMATTER: (reason: string) => ({
    message: 'Failed to parse frontmatter.',
    hint: reason,
  }),

  INVALID_THEME: (theme: string) => ({
    message: `Theme "${theme}" is not a built-in theme.`,
    hint: `Supported themes: ${VALID_THEMES.join(', ')}`,
  }),

  // `layouts` comes from mdslide-core's VALID_SLIDE_TYPES rather than a
  // hand-duplicated copy here, so the hint can't drift from reality.
  INVALID_LAYOUT: (layout: string, layouts: readonly string[]) => ({
    message: `Invalid layout override "${layout}".`,
    hint: layouts.length ? `Supported layouts: ${layouts.join(', ')}` : undefined,
  }),

  MULTIPLE_LAYOUTS: {
    message: 'Multiple layout overrides found on a single slide.',
    hint: 'Only one layout override should be specified per slide.',
  },

  MULTIPLE_COLUMN_LAYOUTS: {
    message: 'Multiple layout overrides found in a single ::split::/::col:: column.',
    hint: 'Only one <!-- layout: ... --> comment should be specified per column.',
  },

  // `kinds` comes from mdslide-core's VALID_ADMONITION_KINDS rather than a
  // hand-duplicated copy here, so the hint can't drift from reality.
  INVALID_ADMONITION: (kind: string, kinds: readonly string[]) => ({
    message: `Unrecognized admonition marker "[!${kind}]".`,
    hint: kinds.length ? `Supported kinds: ${kinds.join(', ')}` : undefined,
  }),

  // `types` comes from mdslide-core's VALID_CHART_TYPES rather than a
  // hand-duplicated copy here, so the hint can't drift from reality.
  INVALID_CHART_TYPE: (chartType: string, types: readonly string[]) => ({
    message: `Invalid chart type "${chartType}".`,
    hint: types.length ? `Supported chart types: ${types.join(', ')}` : undefined,
  }),

  MISPLACED_CHART_DIRECTIVE: {
    message: 'A <!-- chart: ... --> directive must immediately precede a markdown table.',
    hint: 'Move the directive so it sits directly above the table, with no blank lines in between.',
  },

  INVALID_IMAGE_FIT: (fit: string, fits: readonly string[]) => ({
    message: `Invalid imageFit "${fit}".`,
    hint: fits.length ? `Supported values: ${fits.join(', ')}` : undefined,
  }),

  INVALID_IMAGE_POSITION: (position: string, positions: readonly string[]) => ({
    message: `Invalid imagePosition "${position}".`,
    hint: positions.length ? `Supported values: ${positions.join(', ')}` : undefined,
  }),

  INVALID_ACCENT_COLOR: (value: string) => ({
    message: `"${value}" doesn't look like a valid CSS color for accentColor.`,
    hint: 'Use a hex color (e.g. #f43f5e), rgb()/hsl(), or a CSS color keyword.',
  }),

  UNCLOSED_NOTES: {
    message: 'Unclosed notes block (missing <!-- /notes -->).',
    hint: 'Ensure every <!-- notes --> tag has a corresponding <!-- /notes --> tag.',
  },

  NESTED_NOTES: {
    message: 'Nested notes block detected.',
    hint: 'Avoid placing <!-- notes --> inside an already open notes block.',
  },

  STRAY_NOTES_CLOSE: {
    message: 'Stray closing notes tag (<!-- /notes -->).',
    hint: 'Ensure <!-- /notes --> is only used to close an open <!-- notes --> block.',
  },

  // `langs` comes from mdslide-core's SUPPORTED_LANGS (the source of truth
  // the renderer's syntax highlighter actually uses) rather than a
  // hand-duplicated copy here, so the hint can't drift from reality.
  UNSUPPORTED_LANG: (lang: string, langs: readonly string[]) => ({
    message: `Language "${lang}" in code fence is not supported for syntax highlighting.`,
    hint: langs.length ? `Supported languages: ${langs.join(', ')}` : undefined,
  }),

  MULTIPLE_SPLITS: {
    message: 'Multiple ::split:: markers found in a single slide.',
    hint: 'Only the first ::split:: marker will be used to divide columns.',
  },

  EMPTY_SPLIT_COLUMN: {
    message: 'Empty column in split layout.',
    hint: 'Add content before and after the ::split:: (or ::col::) marker.',
  },

  COLUMN_COUNT_MISMATCH: (declared: number, actual: number) => ({
    message: `<!-- columns: ${declared} --> doesn't match the ${actual} ::col::-delimited column(s) found.`,
    hint: `Add/remove ::col:: markers so there are ${declared - 1} of them, or update the columns count to ${actual}.`,
  }),

  COLUMN_RATIO_MISMATCH: (ratio: string, actual: number) => ({
    message: `ratio:${ratio} has a different number of segments than the ${actual} column(s) found.`,
    hint: `Provide exactly ${actual} colon-separated ratio value(s), e.g. ratio:${Array(actual).fill('1').join(':')}.`,
  }),

  MULTIPLE_H1: {
    message: 'Multiple level 1 headings (#) found on a single slide.',
    hint: 'Use level 2 (##) or level 3 (###) headings for sub-sections.',
  },

  BROKEN_IMAGE: (imgUrl: string) => ({
    message: `Referenced image "${imgUrl}" does not exist on disk.`,
    hint: 'Check that the path is correct relative to the markdown file.',
  }),

  LOG_SUCCESS: (filename: string, slideCount: number) =>
    `${filename} - ${slideCount} slides, no issues found`,

  LOG_SUMMARY: (slideCount: number, errors: number, warnings: number) =>
    `  ${COLORS.grey}${slideCount} slides - ${errors} error${errors !== 1 ? 's' : ''}, ${warnings} warning${warnings !== 1 ? 's' : ''}${STYLES.reset}`,

  LOG_LOCATION: (slideNum: number | undefined) => (slideNum != null ? `  (slide ${slideNum})` : ''),
} as const;
