import { RootContent, Heading } from 'mdast';
import { type Slide, type SlideNode } from '@mindfiredigital/mdslide-shared';
import { createSlide, createSlideNode } from '../ast/index.js';
import { RawSlideBlock } from '../interfaces/index.js';
import { isHeading } from '../parser/index.js';
import { normalizeHeading } from './normalizeHeading.js';
import { extractSlideNotes } from './normalizeNote.js';
import { detectAdmonition } from './normalizeAdmonition.js';
import {
  parseLayoutOveride,
  resolveSlideLayout,
  parseBackgroundImage,
  parseTitlePositioning,
  parseOverflowConfig,
  parseAnimationConfig,
  normalizeAnimation,
  parseFontSizeConfig,
  normalizeFontSize,
  parseContentAlign,
  normalizeVerticalPosition,
  parseColumnsConfig,
  parseChartAnnotations,
  parseImageConfig,
  parseAccentColor,
} from './normalizeLayout.js';

// Converts generic MDAST node into Slide AST Node
export function toSlideAstNode(node: RootContent, isTableHeader = false): SlideNode {
  if (node.type == 'table') {
    // Table custom mappings to distinguish th vs td
    const children = (node.children || []).map((row: any, rowIndex: number) => {
      const rowChildren = (row.children || []).map((cell: any) => {
        // *
        return toSlideAstNode(cell, rowIndex === 0);
      });
      return createSlideNode({
        type: 'tableRow',
        children: rowChildren,
      });
    });
    return createSlideNode({
      type: 'table',
      children,
      chart: 'chartHint' in node ? (node as any).chartHint : undefined,
    });
  }

  if (node.type === 'blockquote') {
    const { kind, children: adjustedChildren } = detectAdmonition(node as any);
    return createSlideNode({
      type: 'blockquote',
      children: adjustedChildren.map((child: any) => toSlideAstNode(child, isTableHeader)),
      admonition: kind,
    });
  }

  return createSlideNode({
    type: node.type,
    value: 'value' in node ? String(node.value) : undefined,
    children:
      'children' in node
        ? (node.children as any[]).map((child) => toSlideAstNode(child, isTableHeader))
        : undefined,
    lang: 'lang' in node ? String(node.lang) : undefined,
    ordered: 'ordered' in node ? Boolean(node.ordered) : undefined,
    url: 'url' in node ? String(node.url) : undefined,
    alt: 'alt' in node ? String(node.alt) : undefined,
    header: isTableHeader || ('header' in node ? Boolean(node.header) : undefined),
    depth: 'depth' in node ? Number(node.depth) : undefined,
  });
}

export function normalizeSlide(rawBlock: RawSlideBlock): Slide {
  const { notes, remainingNodes: nodesWithoutNotes } = extractSlideNotes(rawBlock.nodes);

  const { layoutOverride, filteredNodes: nodesWithoutLayout } =
    parseLayoutOveride(nodesWithoutNotes);

  const { backgroundImage, filteredNodes: nodesWithoutBg } =
    parseBackgroundImage(nodesWithoutLayout);

  const {
    titleAlign,
    titlePosition,
    filteredNodes: nodesWithoutPos,
  } = parseTitlePositioning(nodesWithoutBg);

  const { overflow, filteredNodes: nodesWithoutOverflow } = parseOverflowConfig(nodesWithoutPos);

  const { animation: parsedAnim, filteredNodes: nodesWithoutAnim } =
    parseAnimationConfig(nodesWithoutOverflow);
  const animation = normalizeAnimation(parsedAnim);

  const { fontSize: parsedFontSize, filteredNodes: nodesWithoutFontSize } =
    parseFontSizeConfig(nodesWithoutAnim);
  const fontSize = normalizeFontSize(parsedFontSize);

  const { align, filteredNodes: nodesWithoutAlign } = parseContentAlign(nodesWithoutFontSize);

  const {
    imageFit,
    imagePosition,
    filteredNodes: nodesWithoutImageConfig,
  } = parseImageConfig(nodesWithoutAlign);

  const { accentColor, filteredNodes: nodesWithoutAccentColor } =
    parseAccentColor(nodesWithoutImageConfig);

  const { columnsConfig, filteredNodes: nodesWithoutColumns } =
    parseColumnsConfig(nodesWithoutAccentColor);

  const { filteredNodes: nodesWithoutChartAnnotations } =
    parseChartAnnotations(nodesWithoutColumns);

  let slideTitle: string | undefined;
  const slideContent: SlideNode[] = [];

  for (const node of nodesWithoutChartAnnotations) {
    if (isHeading(node)) {
      const headingNode = node as Heading;
      const normalized = normalizeHeading(headingNode);

      if (headingNode.depth === 1) {
        if (!slideTitle) {
          slideTitle = normalized.text;
          continue;
        }
      }

      if (headingNode.depth === 2) {
        if (!slideTitle) {
          slideTitle = normalized.text;
          continue;
        }
      }
    }

    slideContent.push(toSlideAstNode(node));
  }

  const resolvedType = resolveSlideLayout(slideContent, slideTitle !== undefined, layoutOverride);

  return createSlide({
    id: rawBlock.id,
    type: resolvedType,
    title: slideTitle,
    content: slideContent,
    notes,
    layoutOverride,
    backgroundImage,
    titleAlign,
    titlePosition,
    overflow,
    animation,
    fontSize,
    align,
    columnsConfig,
    imageFit,
    imagePosition,
    accentColor,
  });
}

export function normalizeSlides(
  rawBlocks: RawSlideBlock[],
  meta?: Record<string, unknown>
): Slide[] {
  return rawBlocks
    .map((rawBlock) => {
      const slide = normalizeSlide(rawBlock);
      if (meta) {
        const align = meta.titleAlign ?? meta.titlealign;
        if (align && !slide.titleAlign) {
          slide.titleAlign = String(align).toLowerCase();
        }
        const position = meta.titlePosition ?? meta.titleposition;
        if (position && !slide.titlePosition) {
          const pos = String(position).toLowerCase();
          if (pos === 'buttom') {
            slide.titlePosition = 'bottom';
          } else if (pos === 'middle') {
            slide.titlePosition = 'center';
          } else {
            slide.titlePosition = pos;
          }
        }
        const overflow = meta.overflow;
        if (overflow && !slide.overflow) {
          slide.overflow = String(overflow).toLowerCase();
        }
        const animVal = meta.animation ?? meta.build;
        if (animVal && !slide.animation) {
          slide.animation = normalizeAnimation(animVal);
        }
        const fontSizeVal = meta.fontSize ?? meta['font-size'] ?? meta.font_size;
        if (fontSizeVal && !slide.fontSize) {
          slide.fontSize = normalizeFontSize(fontSizeVal);
        }
        const alignVal = meta.align;
        if (alignVal && !slide.align) {
          slide.align = normalizeVerticalPosition(String(alignVal));
        }
      }
      return slide;
    })
    .filter((s) => s.title !== undefined || s.content.length > 0);
}
