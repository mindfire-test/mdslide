import { SlideType } from '@mindfiredigital/mdslide-shared';
import { AssetUrls } from '../interfaces/index.js';

export const MAX_SLIDE_SCORE = 8;

export const VALID_SLIDE_TYPES = new Set<SlideType>([
  'title',
  'bullets',
  'content',
  'code',
  'visual',
  'table',
  'quote',
  'statement',
  'split',
]);

// Valid values for a per-column <!-- layout: ... --> override inside a
// ::split::/::col:: segment. Excludes 'title' (a column can't be its own
// title slide) and 'split' (nested splits aren't supported by the data model).
export const VALID_COLUMN_LAYOUT_TYPES = new Set<SlideType>(
  [...VALID_SLIDE_TYPES].filter((t) => t !== 'title' && t !== 'split')
);

// Recognized `> [!KIND]` admonition/callout marker kinds, matching GitHub's
// own alert syntax (which LLMs already produce unprompted).
export const VALID_ADMONITION_KINDS = new Set(['note', 'tip', 'important', 'warning', 'caution']);

// Recognized `<!-- chart: KIND -->` directive values for the chart-from-table feature.
export const VALID_CHART_TYPES = new Set(['bar', 'line', 'pie']);

// Recognized `<!-- imageFit: KIND -->` directive values (per-slide object-fit override).
export const VALID_IMAGE_FITS = new Set(['contain', 'cover']);

// Recognized `<!-- imagePosition: KIND -->` directive values (auto-split image side).
export const VALID_IMAGE_POSITIONS = new Set(['left', 'right']);

export const SLIDE_CREATION_CONSTRAION = {
  MAX_SLIDE_HEIGHT: 800,
  BASE_SLIDE_PADDING: 150,
};

export const MAX_CONTENT_HEIGHT =
  SLIDE_CREATION_CONSTRAION.MAX_SLIDE_HEIGHT - SLIDE_CREATION_CONSTRAION.BASE_SLIDE_PADDING;

export const SUPPORTED_LANGS = [
  'javascript',
  'js',
  'typescript',
  'ts',
  'html',
  'css',
  'json',
  'rust',
  'go',
  'python',
  'bash',
  'sh',
  'c',
  'cpp',
  'java',
  'sql',
  'yaml',
  'yml',
  'mermaid',
];

export const DEFAULT_TITLE = 'Presentation';

export const DEFAULT_THEME = 'light';

export const VALID_ANIMATIONS = new Set(['fade', 'slide-up', 'zoom', 'slide-left', 'slide-right']);

export const VALID_FONT_SIZES = new Set(['xs', 'sm', 'md', 'lg', 'xl', 'xxl']);

// Ratio of each font-size step's --body-size to the default (md) --body-size,
// mirroring the scale themeEngine.ts's `.slide[data-font-size="..."]` rules apply.
export const FONT_SIZE_SCALE: Record<string, number> = {
  xs: 0.7,
  sm: 0.85,
  md: 1,
  lg: 1.15,
  xl: 1.25,
  xxl: 1.35,
};

// Third-party assets the rendered HTML pulls in over the network. Exposed as
// an overridable map (RenderDeckOptions.assetUrls / CompileOptions.assetUrls)
// so decks can be embedded offline or behind a CSP that blocks these CDNs by
// pointing each key at a self-hosted mirror instead.

export const DEFAULT_ASSET_URLS: AssetUrls = {
  prismCssLight: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css',
  prismCssDark: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css',
  prismLineNumbersCss:
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.css',
  katexCss: 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css',
  prismCoreJs: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js',
  prismAutoloaderJs:
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js',
  prismLineNumbersJs:
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.js',
  mermaidJs: 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs',
};

export type AdmonitionKind = 'note' | 'tip' | 'important' | 'warning' | 'caution';

export const MARKER_RE = /^\[!([A-Za-z]+)\]\s*/;

export const PALETTE = [
  'var(--slide-accent)',
  'var(--slide-accent2)',
  '#f59e0b',
  '#ef4444',
  '#10b981',
  '#6366f1',
];

export const ADMONITION_META: Record<string, { label: string; icon: string }> = {
  note: { label: 'Note', icon: '📝' },
  tip: { label: 'Tip', icon: '💡' },
  important: { label: 'Important', icon: '❗' },
  warning: { label: 'Warning', icon: '⚠️' },
  caution: { label: 'Caution', icon: '🔥' },
};
