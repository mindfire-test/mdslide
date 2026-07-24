import { RootContent } from 'mdast';
import {
  VALID_ANIMATIONS,
  VALID_FONT_SIZES,
  VALID_SLIDE_TYPES,
  VALID_CHART_TYPES,
  VALID_IMAGE_FITS,
  VALID_IMAGE_POSITIONS,
} from '../constants/index.js';
import { SlideNode, SlideType } from '@mindfiredigital/mdslide-shared';
import { emitWarning } from '../utils/warnings.js';

// Checks if a node is a column boundary marker (a paragraph containing only '::split::' or '::col::').
function isColumnBoundaryMarker(node: {
  type: string;
  children?: { type: string; value?: string }[];
}): boolean {
  if (node.type !== 'paragraph' || !node.children || node.children.length !== 1) {
    return false;
  }
  const child = node.children[0]!;
  const text = child.value?.trim();
  return child.type === 'text' && (text === '::split::' || text === '::col::');
}

// Removes layout override comments (e.g., <!-- layout: dark -->).
// For split/multi-column slides, this function does nothing.
// This allows each separate column to read its own layout later.
export function parseLayoutOveride<T extends { type: string; value?: string; children?: any[] }>(
  nodes: T[]
): {
  layoutOverride: string | undefined;
  filteredNodes: T[];
} {
  if (nodes.some((node) => isColumnBoundaryMarker(node))) {
    return { layoutOverride: undefined, filteredNodes: nodes };
  }

  let layoutOverride: string | undefined;
  const filteredNodes: T[] = [];

  for (const node of nodes) {
    if (node.type == 'html') {
      const val = (node.value ?? '').trim();
      const layoutMatch = val.match(/^<!--\s*layout:\s*(\w+)\s*-->$/);
      if (layoutMatch) {
        layoutOverride = layoutMatch[1];
        continue;
      }
    }
    filteredNodes.push(node);
  }
  return {
    layoutOverride,
    filteredNodes,
  };
}

export function parseBackgroundImage(nodes: RootContent[]): {
  backgroundImage: string | undefined;
  filteredNodes: RootContent[];
} {
  let backgroundImage: string | undefined;
  const filteredNodes: RootContent[] = [];

  for (const node of nodes) {
    if (node.type === 'html') {
      const val = node.value.trim();
      const bgMatch = val.match(/^<!--\s*background-?image:\s*(.+?)\s*-->$/i);
      if (bgMatch) {
        const bgUrl = bgMatch[1].trim();

        const modifierMatch = bgUrl.match(/\s+(dark|light)$/i);
        const modifier = modifierMatch ? modifierMatch[0] : '';
        let urlPart = modifierMatch ? bgUrl.slice(0, bgUrl.length - modifier.length).trim() : bgUrl;

        const urlWrapMatch = urlPart.match(/^url\((['"]?)(.+?)\1\)$/i);
        if (urlWrapMatch) {
          urlPart = urlWrapMatch[2];
        }

        backgroundImage = modifier ? `${urlPart}${modifier}` : urlPart;
        continue;
      }
    }
    filteredNodes.push(node);
  }
  return {
    backgroundImage,
    filteredNodes,
  };
}

// Normalizes common top/center/bottom typos and aliases ("buttom" -> "bottom",
// "middle" -> "center") shared by any annotation that positions content
// vertically (titlePosition, align).
export function normalizeVerticalPosition(raw: string): string {
  const pos = raw.toLowerCase();
  if (pos === 'buttom') {
    return 'bottom';
  }
  if (pos === 'middle') {
    return 'center';
  }
  return pos;
}

export function parseTitlePositioning(nodes: RootContent[]): {
  titleAlign: string | undefined;
  titlePosition: string | undefined;
  filteredNodes: RootContent[];
} {
  let titleAlign: string | undefined;
  let titlePosition: string | undefined;
  const filteredNodes: RootContent[] = [];

  for (const node of nodes) {
    if (node.type === 'html') {
      const val = node.value.trim();
      const alignMatch = val.match(/^<!--\s*titleAlign:\s*(\w+)\s*-->$/i);
      if (alignMatch) {
        titleAlign = alignMatch[1].toLowerCase();
        continue;
      }
      const positionMatch = val.match(/^<!--\s*titlePosition:\s*(\w+)\s*-->$/i);
      if (positionMatch) {
        titlePosition = normalizeVerticalPosition(positionMatch[1]);
        continue;
      }
    }
    filteredNodes.push(node);
  }
  return {
    titleAlign,
    titlePosition,
    filteredNodes,
  };
}

// Controls content vertical alignment inside its own flex box. This is independent of title position.
export function parseContentAlign(nodes: RootContent[]): {
  align: string | undefined;
  filteredNodes: RootContent[];
} {
  let align: string | undefined;
  const filteredNodes: RootContent[] = [];

  for (const node of nodes) {
    if (node.type === 'html') {
      const val = node.value.trim();
      const alignMatch = val.match(/^<!--\s*align:\s*(\w+)\s*-->$/i);
      if (alignMatch) {
        align = normalizeVerticalPosition(alignMatch[1]);
        continue;
      }
    }
    filteredNodes.push(node);
  }
  return {
    align,
    filteredNodes,
  };
}

// Finds imageFit and imagePosition layout comments for the slide.
// Invalid values trigger a warning and fall back to defaults.
export type ImageFit = 'contain' | 'cover';
export type ImagePosition = 'left' | 'right';

export function parseImageConfig(nodes: RootContent[]): {
  imageFit: ImageFit | undefined;
  imagePosition: ImagePosition | undefined;
  filteredNodes: RootContent[];
} {
  let imageFit: ImageFit | undefined;
  let imagePosition: ImagePosition | undefined;
  const filteredNodes: RootContent[] = [];

  for (const node of nodes) {
    if (node.type === 'html') {
      const val = node.value.trim();
      const fitMatch = val.match(/^<!--\s*imageFit:\s*(\w+)\s*-->$/i);
      if (fitMatch) {
        const kind = fitMatch[1]!.toLowerCase();
        if (VALID_IMAGE_FITS.has(kind)) {
          imageFit = kind as ImageFit;
        } else {
          emitWarning(
            `[mdslide compiler] Warning: Invalid imageFit "${kind}". Expected one of: ${[...VALID_IMAGE_FITS].join(', ')}. Ignoring.`
          );
        }
        continue;
      }
      const positionMatch = val.match(/^<!--\s*imagePosition:\s*(\w+)\s*-->$/i);
      if (positionMatch) {
        const kind = positionMatch[1]!.toLowerCase();
        if (VALID_IMAGE_POSITIONS.has(kind)) {
          imagePosition = kind as ImagePosition;
        } else {
          emitWarning(
            `[mdslide compiler] Warning: Invalid imagePosition "${kind}". Expected one of: ${[...VALID_IMAGE_POSITIONS].join(', ')}. Ignoring.`
          );
        }
        continue;
      }
    }
    filteredNodes.push(node);
  }
  return {
    imageFit,
    imagePosition,
    filteredNodes,
  };
}

// Finds accentColor comments and copies the CSS color value exactly. Does not validate the color syntax; invalid colors simply won't render.
export function parseAccentColor(nodes: RootContent[]): {
  accentColor: string | undefined;
  filteredNodes: RootContent[];
} {
  let accentColor: string | undefined;
  const filteredNodes: RootContent[] = [];

  for (const node of nodes) {
    if (node.type === 'html') {
      const val = node.value.trim();
      const match = val.match(/^<!--\s*accentColor:\s*(.+?)\s*-->$/i);
      if (match) {
        accentColor = match[1]!.trim();
        continue;
      }
    }
    filteredNodes.push(node);
  }
  return {
    accentColor,
    filteredNodes,
  };
}

// Parses optional column count and ratio comments (e.g., <!-- columns: 3 ratio:2:1:1 -->). Only used to validate and refine the columns created by ::col:: markers. Triggers a warning if there is a count or ratio mismatch.
export function parseColumnsConfig(nodes: RootContent[]): {
  columnsConfig: { count?: number; ratio?: number[] } | undefined;
  filteredNodes: RootContent[];
} {
  let columnsConfig: { count?: number; ratio?: number[] } | undefined;
  const filteredNodes: RootContent[] = [];

  for (const node of nodes) {
    if (node.type === 'html') {
      const val = node.value.trim();
      const match = val.match(/^<!--\s*columns:\s*(\d+)(?:\s+ratio:([\d:]+))?\s*-->$/i);
      if (match) {
        const count = Number(match[1]);
        const ratio = match[2] ? match[2].split(':').map(Number) : undefined;
        columnsConfig = { count, ratio };
        continue;
      }
    }
    filteredNodes.push(node);
  }
  return {
    columnsConfig,
    filteredNodes,
  };
}

// Finds chart comments (e.g., <!-- chart: bar -->) and pairs them with the next table node.
// This is node-scoped (based on next-item adjacency), not slide-scoped.
// Runs before column splitting so it works inside any future column or slide.

const CHART_RE = /^<!--\s*chart:\s*(\w+)\s*-->$/i;

export function parseChartAnnotations(nodes: RootContent[]): {
  filteredNodes: RootContent[];
} {
  const filteredNodes: RootContent[] = [];
  let pendingChart: string | undefined;

  for (const node of nodes) {
    if (node.type === 'html') {
      const val = node.value.trim();
      const match = val.match(CHART_RE);
      if (match) {
        const kind = match[1]!.toLowerCase();
        if (VALID_CHART_TYPES.has(kind)) {
          pendingChart = kind;
        } else {
          pendingChart = undefined;
          emitWarning(
            `[mdslide compiler] Warning: Invalid chart type "${kind}". Expected one of: ${[...VALID_CHART_TYPES].join(', ')}. Rendering as a plain table.`
          );
        }
        continue;
      }
    }

    if (pendingChart) {
      if (node.type === 'table') {
        filteredNodes.push({ ...node, chartHint: pendingChart } as RootContent);
        pendingChart = undefined;
        continue;
      }
      emitWarning(
        `[mdslide compiler] Warning: "<!-- chart: ${pendingChart} -->" must immediately precede a table. Ignoring.`
      );
      pendingChart = undefined;
    }

    filteredNodes.push(node);
  }

  if (pendingChart) {
    emitWarning(
      `[mdslide compiler] Warning: "<!-- chart: ${pendingChart} -->" must immediately precede a table. Ignoring.`
    );
  }

  return { filteredNodes };
}

export function parseOverflowConfig(nodes: RootContent[]): {
  overflow: string | undefined;
  filteredNodes: RootContent[];
} {
  let overflow: string | undefined;
  const filteredNodes: RootContent[] = [];

  for (const node of nodes) {
    if (node.type === 'html') {
      const val = node.value.trim();
      const overflowMatch = val.match(/^<!--\s*overflow:\s*(\w+)\s*-->$/i);
      if (overflowMatch) {
        overflow = overflowMatch[1].toLowerCase();
        continue;
      }
    }
    filteredNodes.push(node);
  }
  return {
    overflow,
    filteredNodes,
  };
}

export function normalizeAnimation(val: unknown): string | undefined {
  if (!val) return undefined;
  const str = String(val).toLowerCase().trim();
  if (str === 'true') {
    return 'fade';
  }
  if (VALID_ANIMATIONS.has(str)) {
    return str;
  }
  return undefined;
}

export function parseAnimationConfig(nodes: RootContent[]): {
  animation: string | undefined;
  filteredNodes: RootContent[];
} {
  let animation: string | undefined;
  const filteredNodes: RootContent[] = [];

  for (const node of nodes) {
    if (node.type === 'html') {
      const val = node.value.trim();
      const animMatch = val.match(/^<!--\s*(animation|build):\s*([\w-]+)\s*-->$/i);
      if (animMatch) {
        animation = normalizeAnimation(animMatch[2]);
        continue;
      }
    }
    filteredNodes.push(node);
  }
  return {
    animation,
    filteredNodes,
  };
}

export function normalizeFontSize(val: unknown): string | undefined {
  if (!val) return undefined;
  const str = String(val)
    .toLowerCase()
    .trim()
    .replace(/[-\s_]+/g, '-');
  if (str === 'medium' || str === 'normal') {
    return 'md';
  }
  if (str === 'extra-large') {
    return 'xl';
  }
  if (str === 'extra-small') {
    return 'xs';
  }
  if (str === 'double-extra-large') {
    return 'xxl';
  }
  if (VALID_FONT_SIZES.has(str)) {
    return str;
  }
  return undefined;
}

export function parseFontSizeConfig(nodes: RootContent[]): {
  fontSize: string | undefined;
  filteredNodes: RootContent[];
} {
  let fontSize: string | undefined;
  const filteredNodes: RootContent[] = [];

  for (const node of nodes) {
    if (node.type === 'html') {
      const val = node.value.trim();
      const match = val.match(/^<!--\s*(fontSize):\s*([\w\s-]+)\s*-->$/i);
      if (match) {
        fontSize = normalizeFontSize(match[2]);
        continue;
      }
    }
    filteredNodes.push(node);
  }
  return {
    fontSize,
    filteredNodes,
  };
}

export function resolveSlideLayout(
  nodes: SlideNode[],
  hasTitle: boolean,
  layoutOverride?: string,
  allowedTypes: ReadonlySet<SlideType> = VALID_SLIDE_TYPES
): SlideType {
  if (layoutOverride) {
    if (allowedTypes.has(layoutOverride as SlideType)) {
      return layoutOverride as SlideType;
    }
    emitWarning(
      `[mdslide compiler] Warning: Invalid layout override "${layoutOverride}". Falling back to auto-detection.`
    );
  }

  // Title Slide layout: Main Slide Title checker
  if (hasTitle && nodes.length === 0) {
    return 'title';
  }

  // Bullets layout: Has list nodes
  const hasList = nodes.some((item) => item.type === 'list');
  if (hasList) {
    return 'bullets';
  }

  // Code layout: Contains only code blocks or single pre-formatted element
  const hasCode = nodes.some((item) => item.type === 'code');
  if (hasCode && nodes.length === 1) {
    return 'code';
  }

  // Quote layout: Contains blockquotes
  const hasQuote = nodes.some((item) => item.type === 'blockquote');
  if (hasQuote && nodes.length === 1) {
    return 'quote';
  }

  // Visual layout: Contains images
  const hasImage = nodes.some(
    (item) =>
      item.type === 'image' ||
      (item.children && item.children.some((c: SlideNode) => c.type === 'image'))
  );
  if (hasImage && nodes.length <= 2) {
    return 'visual';
  }

  // Table layout
  const hasTable = nodes.some((item) => item.type === 'table');
  if (hasTable) {
    return 'table';
  }

  return 'content';
}
