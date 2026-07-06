import type { Slide, SlideNode } from '@mindfiredigital/mdslide-shared';
import { extractTextLength } from '../utils/index.js';
import { MAX_CONTENT_HEIGHT } from '../constants/index.js';

function calculateNodeHeight(node: SlideNode): number {
  let baseHeight = 0;

  if (node.type === 'code') {
    const lines = (node.value || '').split('\n').length;
    baseHeight = 50 + lines * 24;
  } else if (node.type === 'table') {
    const rows = node.children ? node.children.length : 0;
    baseHeight = 35 + rows * 38;
  } else if (node.type === 'list') {
    baseHeight = 15;
  } else if (node.type === 'listItem') {
    const textLen = extractTextLength(node);
    const wrapLines = Math.ceil(textLen / 55);
    baseHeight = Math.max(30, wrapLines * 30) + 10;
  } else if (node.type === 'image') {
    baseHeight = 350;
  } else if (node.type === 'blockquote') {
    const textLen = extractTextLength(node);
    const wrapLines = Math.ceil(textLen / 65);
    baseHeight = 25 + wrapLines * 30 + 15;
  } else if (node.type === 'heading') {
    const depth = (node as any).depth || 1;
    const textLen = extractTextLength(node);
    if (depth === 1) {
      const wrapLines = Math.ceil(textLen / 40);
      baseHeight = wrapLines * 65 + 20;
    } else {
      const wrapLines = Math.ceil(textLen / 50);
      baseHeight = wrapLines * 45 + 15;
    }
  } else if (node.type === 'paragraph') {
    const textLen = extractTextLength(node);
    const wrapLines = Math.ceil(textLen / 65);
    baseHeight = wrapLines * 30 + 15;
  } else {
    const textLen = extractTextLength(node);
    const wrapLines = Math.ceil(textLen / 70);
    baseHeight = wrapLines * 30 + 10;
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
        baseHeight += calculateNodeHeight(child);
      }
    }
  }

  return baseHeight;
}

function generateContinuationId(originalId: string, part: number): string {
  return `${originalId}-cont-p${part}`;
}

export function processOverflow(slides: Slide[]): Slide[] {
  const resultSlides: Slide[] = [];

  for (const slide of slides) {
    if (!slide.content || slide.content.length === 0) {
      resultSlides.push(slide);
      continue;
    }

    if (slide.overflow !== 'split') {
      resultSlides.push(slide);
      continue;
    }

    let currentSlideContent: SlideNode[] = [];
    let currentHeight = 0;
    let continuationCount = 0;

    const pushCurrentSlide = () => {
      const isContinuation = continuationCount > 0;
      const slideTitle = slide.title
        ? isContinuation
          ? `${slide.title} (Cont.)`
          : slide.title
        : undefined;

      resultSlides.push({
        id: isContinuation ? generateContinuationId(slide.id, continuationCount) : slide.id,
        type: slide.type,
        title: slideTitle,
        content: currentSlideContent,
        notes: isContinuation ? undefined : slide.notes,
        layoutOverride: slide.layoutOverride,
        backgroundImage: slide.backgroundImage,
        titleAlign: slide.titleAlign,
        titlePosition: slide.titlePosition,
        overflow: slide.overflow,
        animation: slide.animation,
        fontSize: slide.fontSize,
      });

      continuationCount++;
      currentSlideContent = [];
      currentHeight = 0;
    };

    const processNodesList = (nodes: SlideNode[]) => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nodeHeight = calculateNodeHeight(node);
        const availableHeight = MAX_CONTENT_HEIGHT - currentHeight;

        if (currentHeight + nodeHeight <= MAX_CONTENT_HEIGHT) {
          currentSlideContent.push(node);
          currentHeight += nodeHeight;
          continue;
        }

        if (node.type === 'code' && node.lang !== 'mermaid' && availableHeight > 100) {
          const lines = (node.value || '').split('\n');
          const maxLines = Math.floor((availableHeight - 40) / 16);

          if (maxLines >= 3 && lines.length - maxLines > 4) {
            const fitCode = lines.slice(0, maxLines).join('\n');
            const remainCode = lines.slice(maxLines).join('\n');

            currentSlideContent.push({ ...node, value: fitCode });
            pushCurrentSlide();

            processNodesList([{ ...node, value: remainCode }]);
            continue;
          }
        }

        if (node.type === 'list' && availableHeight > 80) {
          const children = node.children || [];
          const fitChildren: SlideNode[] = [];
          let remainChildren: SlideNode[] = [];
          let listHeightAccumulator = 15;

          let splitIndex = -1;
          for (let j = 0; j < children.length; j++) {
            const childHeight = calculateNodeHeight(children[j]);
            if (listHeightAccumulator + childHeight <= availableHeight) {
              fitChildren.push(children[j]);
              listHeightAccumulator += childHeight;
            } else {
              splitIndex = j;
              break;
            }
          }

          if (
            fitChildren.length > 0 &&
            splitIndex !== -1 &&
            children.length - fitChildren.length >= 1
          ) {
            remainChildren = children.slice(splitIndex);
            currentSlideContent.push({ ...node, children: fitChildren });
            pushCurrentSlide();

            processNodesList([{ ...node, children: remainChildren }]);
            continue;
          }
        }

        if (currentSlideContent.length > 0) {
          let remainingHeight = 0;
          for (let k = i; k < nodes.length; k++) {
            remainingHeight += calculateNodeHeight(nodes[k]);
          }

          if (remainingHeight <= 160) {
            for (let k = i; k < nodes.length; k++) {
              currentSlideContent.push(nodes[k]);
            }
            break;
          }

          pushCurrentSlide();
        }
        currentSlideContent.push(node);
        currentHeight = nodeHeight;
      }
    };

    processNodesList(slide.content);

    if (currentSlideContent.length > 0) {
      const isContinuation = continuationCount > 0;
      const slideTitle = slide.title
        ? isContinuation
          ? `${slide.title} (Cont.)`
          : slide.title
        : undefined;

      resultSlides.push({
        id: isContinuation ? generateContinuationId(slide.id, continuationCount) : slide.id,
        type: slide.type,
        title: slideTitle,
        content: currentSlideContent,
        notes: isContinuation ? undefined : slide.notes,
        layoutOverride: slide.layoutOverride,
        backgroundImage: slide.backgroundImage,
        titleAlign: slide.titleAlign,
        titlePosition: slide.titlePosition,
        overflow: slide.overflow,
        animation: slide.animation,
        fontSize: slide.fontSize,
      });
    }
  }

  return resultSlides;
}
