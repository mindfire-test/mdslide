import type { Slide, SlideNode } from '@mindfiredigital/mdslide-shared';
import katex from 'katex';
import { renderCodeBlock, renderInlineCode } from './renderCode.js';
import { renderTable, renderTableRow, renderTableCell } from './renderTable.js';
import { renderAdmonition } from './renderAdmonition.js';
import { renderChart } from './renderChart.js';
import { sanitizeHtml, sanitizeUrl, isVideoUrl } from '../../utils/index.js';

// Fragment ids must be unique within one rendered deck but not across
// separate compiles, so the counter is threaded per-call instead of held as
// module state — a shared mutable module let would keep climbing (and never
// reset) across repeated compiles in a long-lived watch-mode process.
export interface FragmentCounter {
  value: number;
}

function nextFragmentId(counter: FragmentCounter): number {
  counter.value += 1;
  return counter.value;
}

function renderMath(formula: string, displayMode: boolean): string {
  try {
    return katex.renderToString(formula, {
      displayMode,
      throwOnError: false,
    });
  } catch (err) {
    return sanitizeHtml(formula);
  }
}

// Extract all image node from tree and return them separately
function extractImages(nodes: SlideNode[]): {
  clean: SlideNode[];
  images: SlideNode[];
} {
  const images: SlideNode[] = [];

  function stripImages(node: SlideNode): SlideNode | null {
    if (node.type === 'image') {
      images.push(node);
      return null;
    }
    // paragraph that contains only images
    if (
      node.type === 'paragraph' &&
      node.children &&
      node.children.every(
        (c) => c.type === 'image' || (c.type === 'text' && c.value?.trim() === '')
      )
    ) {
      node.children.forEach((c) => {
        if (c.type === 'image') images.push(c);
      });
      return null;
    }
    if (node.children && node.children.length > 0) {
      const cleanChildren = node.children
        .map(stripImages)
        .filter((c): c is SlideNode => c !== null);
      return { ...node, children: cleanChildren };
    }
    return node;
  }

  const clean = nodes.map(stripImages).filter((n): n is SlideNode => n !== null);

  return { clean, images };
}

// checker for if any image is there inside of list items.
function listItemHasImage(node: SlideNode): boolean {
  if (node.type === 'image') return true;
  if (node.children) return node.children.some(listItemHasImage);
  return false;
}

// Render a listItem's text content only
export function renderListItemText(node: SlideNode): string {
  if (node.type === 'image') return '';
  if (node.type === 'text') return sanitizeHtml(node.value ?? '');
  if (node.children) {
    return node.children.map(renderListItemText).join('');
  }
  return '';
}

// node to html
export function childrenToHtml(
  node: SlideNode,
  animation?: string,
  counter: FragmentCounter = { value: 0 }
): string {
  return (node.children ?? []).map((c) => nodeToHtml(c, animation, counter)).join('');
}

export function nodeToHtml(
  node: SlideNode,
  animation?: string,
  counter: FragmentCounter = { value: 0 }
): string {
  switch (node.type) {
    case 'paragraph': {
      // Paragraph that is purely image(s)   render as figure, not <p>
      const onlyImages =
        node.children &&
        node.children.length > 0 &&
        node.children.every((c) => c.type === 'image' || (c.type === 'text' && !c.value?.trim()));
      if (onlyImages) {
        return (node.children ?? [])
          .filter((c) => c.type === 'image')
          .map((img) => nodeToHtml(img, animation, counter))
          .join('');
      }
      return `<p>${childrenToHtml(node, animation, counter)}</p>`;
    }

    case 'heading': {
      const depth = node.depth ?? 3;
      return `<h${depth}>${childrenToHtml(node, animation, counter)}</h${depth}>`;
    }

    case 'text':
      return sanitizeHtml(node.value ?? '');

    case 'strong':
      return `<strong>${childrenToHtml(node, animation, counter)}</strong>`;

    case 'emphasis':
      return `<em>${childrenToHtml(node, animation, counter)}</em>`;

    case 'inlineCode':
      return renderInlineCode(node);

    case 'code':
      return renderCodeBlock(node);

    case 'list': {
      // Extract images that ended up inside list items
      const tag = node.ordered ? 'ol' : 'ul';

      // Check if any list item carries an image
      const hasNestedImages = (node.children ?? []).some(listItemHasImage);

      if (!hasNestedImages) {
        return `<${tag}>${childrenToHtml(node, animation, counter)}</${tag}>`;
      }

      // Render list items text-only, collect images
      const collectedImages: SlideNode[] = [];
      const itemsHtml = (node.children ?? [])
        .map((item) => {
          if (!listItemHasImage(item)) {
            if (animation) {
              const id = nextFragmentId(counter);
              return `<li class="fragment" data-animation="${animation}" id="frag-${id}">${childrenToHtml(item, animation, counter)}</li>`;
            }
            return `<li>${childrenToHtml(item, animation, counter)}</li>`;
          }
          // Extract images from this item
          const { clean, images } = extractImages(item.children ?? []);
          collectedImages.push(...images);
          const textContent = clean.map((c) => nodeToHtml(c, animation, counter)).join('');
          if (animation) {
            const id = nextFragmentId(counter);
            return `<li class="fragment" data-animation="${animation}" id="frag-${id}">${textContent}</li>`;
          }
          return `<li>${textContent}</li>`;
        })
        .join('');

      // Render collected images in a grid below the list
      const imagesHtml =
        collectedImages.length > 0
          ? `<div class="inlineImageGrid">${collectedImages.map((c) => nodeToHtml(c, animation, counter)).join('')}</div>`
          : '';

      return `<${tag}>${itemsHtml}</${tag}>${imagesHtml}`;
    }

    case 'listItem': {
      if (animation) {
        const id = nextFragmentId(counter);
        return `<li class="fragment" data-animation="${animation}" id="frag-${id}">${childrenToHtml(node, animation, counter)}</li>`;
      }
      return `<li>${childrenToHtml(node, animation, counter)}</li>`;
    }

    case 'blockquote': {
      if (node.admonition) {
        return renderAdmonition(node, (n) => childrenToHtml(n, animation, counter));
      }
      return `<blockquote>${childrenToHtml(node, animation, counter)}</blockquote>`;
    }

    case 'image': {
      const src = node.url ?? node.value ?? '';
      const alt = node.alt ?? '';
      if (isVideoUrl(src)) {
        const safeSrc = sanitizeUrl(src, true);
        if (animation) {
          const id = nextFragmentId(counter);
          return `<video src="${safeSrc}" class="slideVideo fragment" data-animation="${animation}" id="frag-${id}" autoplay loop muted playsinline></video>`;
        }
        return `<video src="${safeSrc}" class="slideVideo" autoplay loop muted playsinline></video>`;
      }
      if (animation) {
        const id = nextFragmentId(counter);
        return `<img src="${sanitizeUrl(src, true)}" alt="${sanitizeHtml(alt)}" class="fragment" data-animation="${animation}" id="frag-${id}" loading="lazy" onerror="this.style.display='none'" />`;
      }
      return `<img src="${sanitizeUrl(src, true)}" alt="${sanitizeHtml(alt)}" loading="lazy" onerror="this.style.display='none'" />`;
    }

    case 'link': {
      const href = node.url ?? node.value ?? '';
      return `<a href="${sanitizeUrl(href, false)}">${childrenToHtml(node, animation, counter)}</a>`;
    }

    case 'table': {
      const chartHtml = node.chart ? renderChart(node) : null;
      return chartHtml ?? renderTable(node, (n) => childrenToHtml(n, animation, counter));
    }

    case 'tableRow':
      return renderTableRow(node, (n) => childrenToHtml(n, animation, counter));

    case 'tableCell':
      return renderTableCell(node, (n) => childrenToHtml(n, animation, counter));

    case 'break':
      return '<br />';

    case 'html': {
      const val = (node.value ?? '').trim();
      if (val.startsWith('<!--') && val.endsWith('-->')) {
        return '';
      }
      return node.value ?? '';
    }

    case 'math':
      return `<div class="math mathDisplay">${renderMath(node.value ?? '', true)}</div>`;

    case 'inlineMath':
      return `<span class="math mathInline">${renderMath(node.value ?? '', false)}</span>`;

    case 'column':
      return childrenToHtml(node, animation, counter);

    default:
      if (node.value) return sanitizeHtml(node.value);
      if (node.children?.length) return childrenToHtml(node, animation, counter);
      return '';
  }
}

//  Notes
export function renderNotes(notes: string | undefined): string {
  if (!notes) return '';
  return `<aside class="notes" hidden>${sanitizeHtml(notes)}</aside>`;
}

// Image helpers for split layout
function extractImagesAndCleanTree(nodes: SlideNode[]): {
  images: SlideNode[];
  cleanNodes: SlideNode[];
} {
  const images: SlideNode[] = [];

  function process(nodeList: SlideNode[]): SlideNode[] {
    const cleaned: SlideNode[] = [];
    for (const node of nodeList) {
      if (node.type === 'image') {
        images.push(node);
      } else if (node.children) {
        cleaned.push({
          ...node,
          children: process(node.children),
        });
      } else {
        cleaned.push(node);
      }
    }
    return cleaned;
  }

  const cleanNodes = process(nodes);
  return { images, cleanNodes };
}

export function renderSlide(slide: Slide, counter: FragmentCounter = { value: 0 }): string {
  const titleHtml = slide.title ? `<h2 class="slideTitle">${sanitizeHtml(slide.title)}</h2>` : '';
  const notesHtml = renderNotes(slide.notes);

  let contentHtml = '';

  if (slide.type === 'split') {
    const isManualSplit =
      slide.content.length >= 2 && slide.content.every((node) => node?.type === 'column');

    if (isManualSplit) {
      // Manual ::split:: / ::col:: (N columns, optionally ratioed)
      const columnsHtml = slide.content
        .map((column) => {
          const style = typeof column.ratio === 'number' ? ` style="flex: ${column.ratio}"` : '';
          const dataType = ` data-type="${column.layout ?? 'content'}"`;
          return `<div class="splitColumn"${dataType}${style}>${nodeToHtml(column, slide.animation, counter)}</div>`;
        })
        .join('');
      contentHtml = `
        <div class="splitLayout">${columnsHtml}</div>`;
    } else {
      // Auto-split: only do text+image split when there is EXACTLY one image
      const { images, cleanNodes } = extractImagesAndCleanTree(slide.content);
      if (images.length === 1) {
        const imageNode = images[0]!;
        const textDiv = `<div class="splitColumn textColumn">${cleanNodes.map((n) => nodeToHtml(n, slide.animation, counter)).join('\n')}</div>`;
        const imageDiv = `<div class="splitColumn imageColumn">${nodeToHtml(imageNode, slide.animation, counter)}</div>`;
        const columns = slide.imagePosition === 'left' ? [imageDiv, textDiv] : [textDiv, imageDiv];
        contentHtml = `
          <div class="splitLayout">${columns.join('')}</div>`;
      } else {
        // 0 or 2+ images   render normally, let the list handler show images in a grid
        contentHtml = slide.content.map((n) => nodeToHtml(n, slide.animation, counter)).join('\n');
      }
    }
  } else {
    contentHtml = slide.content.map((n) => nodeToHtml(n, slide.animation, counter)).join('\n');
  }

  let bgAttr = '';
  const styleParts: string[] = [];
  if (slide.backgroundImage) {
    const cleanUrl = slide.backgroundImage.replace(/\s+(dark|light)$/i, '').trim();
    const safeUrl = sanitizeUrl(cleanUrl, true).replace(/'/g, '%27');
    bgAttr = ` data-background-image="${sanitizeHtml(slide.backgroundImage)}"`;
    styleParts.push(
      `background-image: url('${safeUrl}') !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important;`
    );
  }
  if (slide.accentColor) {
    styleParts.push(`--slide-accent: ${sanitizeHtml(slide.accentColor)};`);
  }
  const bgStyle = styleParts.length > 0 ? ` style="${styleParts.join(' ')}"` : '';

  let imageFitAttr = '';
  if (slide.imageFit) {
    imageFitAttr = ` data-image-fit="${sanitizeHtml(slide.imageFit)}"`;
  }
  let imagePositionAttr = '';
  if (slide.imagePosition) {
    imagePositionAttr = ` data-image-position="${sanitizeHtml(slide.imagePosition)}"`;
  }

  let alignAttr = '';
  if (slide.titleAlign) {
    alignAttr = ` data-title-align="${sanitizeHtml(slide.titleAlign)}"`;
  }
  let posAttr = '';
  if (slide.titlePosition) {
    posAttr = ` data-title-position="${sanitizeHtml(slide.titlePosition)}"`;
  }
  let animAttr = '';
  if (slide.animation) {
    animAttr = ` data-animation="${sanitizeHtml(slide.animation)}"`;
  }
  let fontSizeAttr = '';
  if (slide.fontSize) {
    fontSizeAttr = ` data-font-size="${sanitizeHtml(slide.fontSize)}"`;
  }
  let contentAlignAttr = '';
  if (slide.align) {
    contentAlignAttr = ` data-content-align="${sanitizeHtml(slide.align)}"`;
  }

  return `<section class="slide"${bgAttr}${bgStyle}${alignAttr}${posAttr}${animAttr}${fontSizeAttr}${contentAlignAttr}${imageFitAttr}${imagePositionAttr} data-type="${slide.type}" data-id="${slide.id}">
  ${titleHtml}
  <div class="slideContent">
    ${contentHtml}
  </div>
  ${notesHtml}
</section>`;
}
