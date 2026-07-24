export type SlideType =
  | 'title'
  | 'bullets'
  | 'content'
  | 'code'
  | 'visual'
  | 'table'
  | 'quote'
  | 'statement'
  | 'split';

export interface SlideNode {
  type: string;
  value?: string;
  children?: SlideNode[];
  lang?: string;
  ordered?: boolean;
  url?: string;
  alt?: string;
  header?: boolean;
  depth?: number;
  ratio?: number;
  layout?: SlideType;
  admonition?: 'note' | 'tip' | 'important' | 'warning' | 'caution';
  chart?: 'bar' | 'line' | 'pie';
}

export interface ColumnsConfig {
  count?: number;
  ratio?: number[];
}

export interface Slide {
  id: string;
  type: SlideType;
  title?: string;
  content: SlideNode[];
  notes?: string;
  layoutOverride?: string;
  backgroundImage?: string;
  titleAlign?: string;
  titlePosition?: string;
  overflow?: string;
  animation?: string;
  fontSize?: string;
  align?: string;
  columnsConfig?: ColumnsConfig;
  // Per-slide <!-- imageFit: contain|cover --> override for every image/video on this slide.
  imageFit?: 'contain' | 'cover';
  // Per-slide <!-- imagePosition: left|right --> override for the auto-detected
  // single-image-plus-text split layout only (manual ::col:: splits and the
  // centered `visual` layout are unaffected).
  imagePosition?: 'left' | 'right';
  // Per-slide <!-- accentColor: <css-color> --> override for --slide-accent.
  accentColor?: string;
}

export interface SlideDeck {
  meta: Record<string, unknown>;
  slides: Slide[];
}
