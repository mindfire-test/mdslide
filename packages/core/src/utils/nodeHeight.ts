import type { SlideNode } from '@mindfiredigital/mdslide-shared';
import { extractTextLength } from './extractTextLength.js';

// Single source of truth for "how much content fits on a slide": both the
// flat-document chunker (getNodeWeight.ts, pre-normalization) and the
// overflow/auto-split engine (overflow/index.ts, post-normalization) size
// nodes through this same pixel estimate, so their notion of capacity agrees.
//
// Image dimensions don't scale with the slide's text font size, so their
// contribution to the estimate is excluded from the `scale` multiplier.
export function calculateNodeHeight(node: SlideNode, scale = 1): number {
  let baseHeight = 0;

  if (node.type === 'code') {
    const lines = (node.value || '').split('\n').length;
    baseHeight = (50 + lines * 24) * scale;
  } else if (node.type === 'table') {
    const rows = node.children ? node.children.length : 0;
    baseHeight = (35 + rows * 38) * scale;
  } else if (node.type === 'list') {
    baseHeight = 15 * scale;
  } else if (node.type === 'listItem') {
    const textLen = extractTextLength(node);
    const wrapLines = Math.ceil(textLen / 55);
    baseHeight = (Math.max(30, wrapLines * 30) + 10) * scale;
  } else if (node.type === 'image') {
    baseHeight = 350;
  } else if (node.type === 'blockquote') {
    const textLen = extractTextLength(node);
    const wrapLines = Math.ceil(textLen / 65);
    baseHeight = (25 + wrapLines * 30 + 15) * scale;
  } else if (node.type === 'heading') {
    const depth = (node as any).depth || 1;
    const textLen = extractTextLength(node);
    if (depth === 1) {
      const wrapLines = Math.ceil(textLen / 40);
      baseHeight = (wrapLines * 65 + 20) * scale;
    } else {
      const wrapLines = Math.ceil(textLen / 50);
      baseHeight = (wrapLines * 45 + 15) * scale;
    }
  } else if (node.type === 'paragraph') {
    const textLen = extractTextLength(node);
    const wrapLines = Math.ceil(textLen / 65);
    baseHeight = (wrapLines * 30 + 15) * scale;
  } else {
    const textLen = extractTextLength(node);
    const wrapLines = Math.ceil(textLen / 70);
    baseHeight = (wrapLines * 30 + 10) * scale;
  }

  if (node.children && node.type !== 'table') {
    for (const child of node.children) {
      if (
        child.type === 'image' ||
        child.type === 'list' ||
        child.type === 'listItem' ||
        child.type === 'blockquote' ||
        child.type === 'paragraph' ||
        child.type === 'code' ||
        child.type === 'table'
      ) {
        if (
          child.type === 'paragraph' &&
          (node.type === 'listItem' || node.type === 'blockquote')
        ) {
          continue;
        }
        baseHeight += calculateNodeHeight(child, scale);
      }
    }
  }

  return baseHeight;
}
