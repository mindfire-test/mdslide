export type OutputFormat = 'html' | 'pdf' | 'pptx';

export type LogLevel = 'silent' | 'info' | 'verbose';

export interface GlobalOptions {
  logLevel?: LogLevel;
  json?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  noInput?: boolean;
  timeoutMs?: number;
}

export interface CompileOptions extends GlobalOptions {
  theme?: string;
  output?: string;
  format?: OutputFormat;
  open?: boolean;
  strict?: boolean;
  pdfTimeoutMs?: number;
  pptxMode?: 'screenshot' | 'editable';
  assetUrls?: Record<string, string>;
}

export interface WatchOptions extends GlobalOptions {
  theme?: string;
  output?: string;
  port?: number;
  open?: boolean;
}

export interface ServeOptions extends GlobalOptions {
  port?: number;
  open?: boolean;
}

export interface InitOptions extends GlobalOptions {
  force?: boolean;
}

export interface CompileResult {
  outputPath: string;
  format: OutputFormat;
  slideCount: number;
  warnings: string[];
}

export interface Choice<T = string> {
  label: string;
  value: T;
  hint?: string;
  color?: string; // ansi color for the label swatch
}

export interface InteractiveResult {
  format: string;
  theme: string;
  output: string;
  watch: boolean;
  open: boolean;
  pptxMode?: 'screenshot' | 'editable';
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  slide?: number;
  line?: number;
  message: string;
  hint?: string;
  fixable?: boolean;
}

export interface ValidateOptions extends GlobalOptions {
  strict?: boolean;
  fix?: boolean;
}

export type InspectOptions = GlobalOptions;

export interface ScreenshotOptions extends GlobalOptions {
  theme?: string;
  output?: string;
  width?: number;
  height?: number;
  slide?: number;
}

export interface InspectSlide {
  index: number;
  id: string;
  title?: string;
  layout: string;
  layoutSource: 'override' | 'auto';
  layoutReason: string;
  elementCounts: Record<string, number>;
  contentHeightPx: number;
  maxHeightPx: number;
  overflowing: boolean;
  hasNotes: boolean;

  columns?: { layout: string }[];

  admonitions?: string[];

  charts?: string[];
  imageFit?: string;
  imagePosition?: string;
  accentColor?: string;
  hasVideo?: boolean;
}

export interface MdSlideConfig {
  theme?: string;
  output?: string;
  format?: string;
  watch?: {
    port?: number;
    open?: boolean;
  };
  pdf?: {
    chromePath?: string;
    printBackground?: boolean;
  };
}

export interface PdfExportOptions {
  chromePath?: string;
  timeoutMs?: number;
  printBackground?: boolean;
  baseDir?: string;
}

export interface ScreenshotPptxOptions {
  chromePath?: string;
  timeoutMs?: number;
  width?: number;
  height?: number;
  theme?: string;
  baseDir?: string;
}

export interface ScreenshotExportOptions {
  chromePath?: string;
  timeoutMs?: number;
  width?: number;
  height?: number;
  theme?: string;
  baseDir?: string;
  slide?: number;
}

export interface PptxTheme {
  bg: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  font: string;
  cardBg: string;
  border: string;
  titleTextColor?: string;
  titleBackgroundCss?: string;
  slideBackgroundCss?: string;
}

// Flatten list structure to structured lines
export interface FlatListLine {
  text: any[];
  bullet: boolean;
  indent: number;
  ordered: boolean;
  numberIndex: number;
}
