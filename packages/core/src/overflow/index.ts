import type { Slide, SlideNode } from '@mindfiredigital/mdslide-shared';
import { calculateNodeHeight } from '../utils/index.js';
import { MAX_CONTENT_HEIGHT, FONT_SIZE_SCALE } from '../constants/index.js';
import { emitWarning } from '../utils/warnings.js';

function fontScaleFor(fontSize?: string): number {
  if (!fontSize) return 1;
  return FONT_SIZE_SCALE[fontSize] ?? 1;
}

// Calculates a slide's total content height using the auto-split engine's rules. Allows tools like `mdslide validate` to report exact pixel overflows. Accepts optional `fontSize` ('xs' to 'xxl') to scale the height correctly.

export function estimateSlideContentHeight(nodes: SlideNode[], fontSize?: string): number {
  const scale = fontScaleFor(fontSize);
  return nodes.reduce((total, node) => total + calculateNodeHeight(node, scale), 0);
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
      const estimatedHeight = estimateSlideContentHeight(slide.content, slide.fontSize);
      if (estimatedHeight > MAX_CONTENT_HEIGHT) {
        emitWarning(
          `[mdslide compiler] Warning: Slide "${slide.title ?? slide.id}" content may overflow ` +
            `(~${Math.round(estimatedHeight)}px estimated vs ${MAX_CONTENT_HEIGHT}px budget). ` +
            `Add "<!-- overflow: split -->" to this slide to auto-split it.`
        );
      }
      resultSlides.push(slide);
      continue;
    }

    const scale = fontScaleFor(slide.fontSize);
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
        align: slide.align,
        columnsConfig: slide.columnsConfig,
        imageFit: slide.imageFit,
        imagePosition: slide.imagePosition,
        accentColor: slide.accentColor,
      });

      continuationCount++;
      currentSlideContent = [];
      currentHeight = 0;
    };

    const processNodesList = (nodes: SlideNode[]) => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nodeHeight = calculateNodeHeight(node, scale);
        const availableHeight = MAX_CONTENT_HEIGHT - currentHeight;

        if (currentHeight + nodeHeight <= MAX_CONTENT_HEIGHT) {
          currentSlideContent.push(node);
          currentHeight += nodeHeight;
          continue;
        }

        if (node.type === 'code' && node.lang !== 'mermaid' && availableHeight > 100) {
          const lines = (node.value || '').split('\n');
          const maxLines = Math.floor((availableHeight - 40) / (16 * scale));

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
            const childHeight = calculateNodeHeight(children[j], scale);
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
            remainingHeight += calculateNodeHeight(nodes[k], scale);
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
        align: slide.align,
        columnsConfig: slide.columnsConfig,
        imageFit: slide.imageFit,
        imagePosition: slide.imagePosition,
        accentColor: slide.accentColor,
      });
    }
  }

  return resultSlides;
}
