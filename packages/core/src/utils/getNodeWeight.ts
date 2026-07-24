import { RootContent } from 'mdast';
import type { SlideNode } from '@mindfiredigital/mdslide-shared';
import { calculateNodeHeight } from './nodeHeight.js';
import { MAX_CONTENT_HEIGHT, MAX_SLIDE_SCORE } from '../constants/index.js';

// Converts the overflow engine's pixel-height estimate into this file's
// abstract "slide capacity" unit, so flat-document chunking here and
// mid-slide auto-splitting in overflow/index.ts agree on how much content
// fits instead of running two independently-tuned heuristics.
const PIXELS_PER_SCORE_UNIT = MAX_CONTENT_HEIGHT / MAX_SLIDE_SCORE;

function getNodeWeight(node: RootContent): number {
  // mdast's RootContent and the normalized SlideNode share the same shape
  // for the fields calculateNodeHeight reads (type/value/children/depth),
  // so it can score raw parser output before normalization runs.
  const heightPx = calculateNodeHeight(node as unknown as SlideNode);
  return Math.max(1, Math.ceil(heightPx / PIXELS_PER_SCORE_UNIT));
}

export { getNodeWeight };
