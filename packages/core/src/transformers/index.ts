import type { Slide, SlideNode } from '@mindfiredigital/mdslide-shared';
import { countImages } from '../utils/index.js';
import { emitWarning } from '../utils/warnings.js';
import { parseLayoutOveride, resolveSlideLayout } from '../normalizer/normalizeLayout.js';
import { VALID_COLUMN_LAYOUT_TYPES } from '../constants/index.js';

// FInd the split index and if is it present and then give the postion and if not then return the -1
export function findSplitIndex(nodes: SlideNode[]): number {
  return nodes.findIndex((node) => {
    if (node.type === 'paragraph' && node.children && node.children.length === 1) {
      const child = node.children[0];
      return child.type === 'text' && child.value?.trim() === '::split::';
    }
    return false;
  });
}

// Finds every ::col:: boundary marker, generalizing findSplitIndex/::split::
export function findColumnBoundaries(nodes: SlideNode[]): number[] {
  const indices: number[] = [];
  nodes.forEach((node, i) => {
    if (node.type === 'paragraph' && node.children && node.children.length === 1) {
      const child = node.children[0];
      if (child.type === 'text' && child.value?.trim() === '::col::') {
        indices.push(i);
      }
    }
  });
  return indices;
}

// Resolves a single column's own layout from an optional <!-- layout: ... --> comment inside its content (parseLayoutOveride only captures comments that appear after the ::col::/::split:: boundary that produced this column, since whole-slide comments before the first boundary were already consumed upstream in normalizeSlide). Falls back to auto-detection - restricted to column-safe types (no nested 'title'/'split') - when no override is present or it's invalid.
function resolveColumnLayout(children: SlideNode[]): {
  layout: SlideNode['layout'];
  children: SlideNode[];
} {
  const { layoutOverride, filteredNodes } = parseLayoutOveride(children);
  const layout = resolveSlideLayout(
    filteredNodes,
    false,
    layoutOverride,
    VALID_COLUMN_LAYOUT_TYPES
  );
  return { layout, children: filteredNodes };
}

// Slices a slide's content into columns at the given boundary indices (the boundary nodes themselves are dropped), then applies the optional <!-- columns: N ratio:a:b:c --> hint from columnsConfig - warning andfalling back to unratioed equal columns whenever it doesn't match the actual number of ::col::-delimited segments.
function buildColumns(
  content: SlideNode[],
  boundaries: number[],
  columnsConfig: Slide['columnsConfig'],
  slideLabel: string
): SlideNode[] {
  const segments: SlideNode[][] = [];
  let cursor = 0;
  for (const idx of boundaries) {
    segments.push(content.slice(cursor, idx));
    cursor = idx + 1;
  }
  segments.push(content.slice(cursor));

  if (columnsConfig?.count !== undefined && columnsConfig.count !== segments.length) {
    emitWarning(
      `[mdslide compiler] Warning: Slide "${slideLabel}" declares <!-- columns: ${columnsConfig.count} --> ` +
        `but has ${segments.length} ::col::-delimited column(s). Using ${segments.length}.`
    );
  }

  let ratio = columnsConfig?.ratio;
  if (ratio && ratio.length !== segments.length) {
    emitWarning(
      `[mdslide compiler] Warning: Slide "${slideLabel}" ratio (${ratio.join(':')}) doesn't match ` +
        `its ${segments.length} column(s). Falling back to equal-width columns.`
    );
    ratio = undefined;
  }

  return segments.map((segmentChildren, i) => {
    const { layout, children } = resolveColumnLayout(segmentChildren);
    return {
      type: 'column',
      children,
      layout,
      ...(ratio ? { ratio: ratio[i] } : {}),
    };
  });
}

function hasMeaningfulText(nodes: SlideNode[]): boolean {
  for (const node of nodes) {
    if (node.type === 'image') {
      continue;
    }
    if (node.type === 'text' && node.value && node.value.trim().length > 0) {
      return true;
    }
    if (node.children && hasMeaningfulText(node.children)) {
      return true;
    }
  }
  return false;
}

// Slidebased AST transforms engine - allows modifying slides , merge node , auto layout detections
export function runTransforms(slides: Slide[]): Slide[] {
  return slides.map((slide) => {
    if (slide.type === 'title' || slide.type === 'statement') {
      return slide;
    }

    // ::col:: boundaries (N columns) take precedence over the legacy
    // ::split:: marker (always exactly 2, unratioed) when both are present.
    const columnBoundaries = findColumnBoundaries(slide.content);
    if (columnBoundaries.length > 0) {
      return {
        ...slide,
        type: 'split',
        content: buildColumns(
          slide.content,
          columnBoundaries,
          slide.columnsConfig,
          slide.title ?? slide.id
        ),
      };
    }

    // Check for manual split separator first (takes precedence!)
    const splitIndex = findSplitIndex(slide.content);
    if (splitIndex !== -1) {
      const left = resolveColumnLayout(slide.content.slice(0, splitIndex));
      const right = resolveColumnLayout(slide.content.slice(splitIndex + 1));
      return {
        ...slide,
        type: 'split',
        content: [
          { type: 'column', children: left.children, layout: left.layout },
          { type: 'column', children: right.children, layout: right.layout },
        ],
      };
    }

    // Fallback to auto-split detection (exactly 1 image alongside meaningful text)
    const imageCount = countImages(slide.content);

    if (imageCount === 1 && hasMeaningfulText(slide.content)) {
      return {
        ...slide,
        type: 'split',
      };
    }

    // If it has only one image and no meaningful text, change type to visual
    if (imageCount === 1 && !hasMeaningfulText(slide.content)) {
      return {
        ...slide,
        type: 'visual',
      };
    }

    return slide;
  });
}
