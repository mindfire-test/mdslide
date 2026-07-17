import { parseMarkdownToAST } from '@mindfiredigital/mdslide-parser';
import type { Root, RootContent } from 'mdast';
import { randomUUID } from 'node:crypto';
import type { RawSlideBlock, ParseMarkdownResult } from '../interfaces/index.js';
import { isThematicBreak, isHeading, isSlideMarker } from './lexer.js';
import { MAX_SLIDE_SCORE } from '../constants/index.js';
import { getNodeWeight } from '../utils/index.js';

export function parseMarkdown(markdown: string): ParseMarkdownResult {
  try {
    const root = parseMarkdownToAST(markdown);

    if (!root.children?.length) {
      return {
        root,
        slides: [],
      };
    }

    const nodes = root.children;
    const hasThematicBreak = nodes.some(isThematicBreak);
    const hasSlideMarker = nodes.some(isSlideMarker);
    const hasH2 = nodes.some((node) => isHeading(node) && 'depth' in node && node.depth === 2);

    const slides: RawSlideBlock[] = [];

    // PHASE 1: Thematic_breaks || <!-- slide --> marker || Heading 2 (--- or ## Heading 2)
    if (hasThematicBreak || hasSlideMarker || hasH2) {
      let currentNodes: RootContent[] = [];

      const pushSlide = () => {
        if (currentNodes.length > 0) {
          slides.push({
            id: randomUUID(),
            nodes: currentNodes,
          });
          currentNodes = [];
        }
      };

      for (const node of nodes) {
        if (isThematicBreak(node) || isSlideMarker(node)) {
          pushSlide();
          continue;
        }

        if (isHeading(node) && 'depth' in node && node.depth === 2 && currentNodes.length > 0) {
          if (!hasThematicBreak && !hasSlideMarker) {
            pushSlide();
          }
        }

        currentNodes.push(node);
      }

      pushSlide();
    }

    // PHASE 2: Other structural headings (# H1 or ### H3)
    else {
      const headingDepths = nodes
        .filter((node: RootContent) => isHeading(node) && [1, 2, 3].includes((node as any).depth))
        .map((node: RootContent) => (node as any).depth as number);

      if (headingDepths.length > 0) {
        const minDepth = Math.min(...headingDepths);
        let currentNodes: RootContent[] = [];

        const pushSlide = () => {
          if (currentNodes.length > 0) {
            slides.push({
              id: randomUUID(),
              nodes: currentNodes,
            });
            currentNodes = [];
          }
        };

        for (const node of nodes) {
          const isMajorHeading = isHeading(node) && (node as any).depth === minDepth;

          if (isMajorHeading && currentNodes.length > 0) {
            pushSlide();
          }

          currentNodes.push(node);
        }

        pushSlide();
      }

      // PHASE 3: Size-based score chunking (Fallback for flat content documents)
      else {
        let currentNodes: RootContent[] = [];
        let currentScore = 0;

        const pushSlide = () => {
          if (currentNodes.length > 0) {
            slides.push({
              id: randomUUID(),
              nodes: currentNodes,
            });

            currentNodes = [];
            currentScore = 0;
          }
        };

        for (const node of nodes) {
          const weight = getNodeWeight(node);

          if (currentScore + weight > MAX_SLIDE_SCORE && currentNodes.length > 0) {
            pushSlide();
          }

          currentNodes.push(node);
          currentScore += weight;
        }

        pushSlide();
      }
    }

    return {
      root,
      slides,
    };
  } catch (err) {
    throw new Error(
      `Failed to parse markdown AST: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
