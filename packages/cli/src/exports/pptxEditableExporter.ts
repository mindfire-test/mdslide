import fs from 'fs';
import path from 'path';
import pptxgen from 'pptxgenjs';
import type { SlideDeck, Slide, SlideNode } from '@mindfiredigital/mdslide-shared';
import { FONT_SIZE_SCALE } from '@mindfiredigital/mdslide-core';
import { PPTX_THEMES } from '../constants/exports/pptxConstants.js';
import type { BlockLayoutOptions, PptxTheme, Rect, TitleContentLayout } from '../types/index.js';
import {
  findImagesInNodes,
  addImageOrVideo,
  resolveImagePath,
  pushParagraphNodeToRuns,
} from './helper/pptxEditableSlideHelper.js';
import { layoutContentBlocks } from './helper/pptxBlockLayout.js';
import { renderBackgroundToPng, isGradientCss } from './helper/rasterize.js';
import { DARK_THEMES, slideDetails } from '../constants/pptxBlockLayout.js';

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function applyAccentOverride(theme: PptxTheme, accentColor: string): PptxTheme {
  const hexMatch = accentColor.trim().match(/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/);
  if (!hexMatch) return theme;
  let hex = hexMatch[1]!;
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const upper = hex.toUpperCase();
  return { ...theme, accent: upper, titleTextColor: upper };
}

function parseBackgroundImageValue(value: string): { url: string; contrast?: 'dark' | 'light' } {
  const trimmed = value.trim();
  const m = trimmed.match(/^(.*)\s+(dark|light)$/i);
  if (m) return { url: m[1]!.trim(), contrast: m[2]!.toLowerCase() as 'dark' | 'light' };
  return { url: trimmed };
}

function computeLayout(slide: Slide, fontScale: number): TitleContentLayout {
  const fullTop = slideDetails.PAD_TOP;
  const fullBottom = slideDetails.SLIDE_H - slideDetails.PAD_BOTTOM;
  const fullH = fullBottom - fullTop;

  if (!slide.title) {
    return {
      titleRect: null,
      contentRect: { x: slideDetails.CONTENT_X, y: fullTop, w: slideDetails.CONTENT_W, h: fullH },
    };
  }

  const titleH = clamp(0.72 * fontScale, 0.5, 1.15);
  const position = slide.titlePosition ?? 'top';

  if (position === 'bottom') {
    return {
      titleRect: {
        x: slideDetails.CONTENT_X,
        y: fullBottom - titleH,
        w: slideDetails.CONTENT_W,
        h: titleH,
      },
      contentRect: {
        x: slideDetails.CONTENT_X,
        y: fullTop,
        w: slideDetails.CONTENT_W,
        h: fullH - titleH - slideDetails.TITLE_GAP,
      },
    };
  }
  if (position === 'center') {
    const titleY = fullTop + (fullH - titleH) / 2;
    const contentY = titleY + titleH + slideDetails.TITLE_GAP;
    return {
      titleRect: { x: slideDetails.CONTENT_X, y: titleY, w: slideDetails.CONTENT_W, h: titleH },
      contentRect: {
        x: slideDetails.CONTENT_X,
        y: contentY,
        w: slideDetails.CONTENT_W,
        h: Math.max(fullBottom - contentY, 0.3),
      },
    };
  }
  return {
    titleRect: { x: slideDetails.CONTENT_X, y: fullTop, w: slideDetails.CONTENT_W, h: titleH },
    contentRect: {
      x: slideDetails.CONTENT_X,
      y: fullTop + titleH + slideDetails.TITLE_GAP,
      w: slideDetails.CONTENT_W,
      h: fullH - titleH - slideDetails.TITLE_GAP,
    },
  };
}

function addTitleText(
  pptxSlide: any,
  slide: Slide,
  theme: PptxTheme,
  rect: Rect,
  fontScale: number
): void {
  const fontSize = Math.max(16, Math.round(26 * fontScale));
  pptxSlide.addText(slide.title || '', {
    ...rect,
    fontSize,
    bold: true,
    fontFace: theme.font,
    color: theme.accent,
    align: slide.titleAlign ?? 'left',
    valign: 'middle',
  });
}

async function getThemeBackgroundImage(
  cache: Map<string, string>,
  cssBackground: string,
  disableRaster: boolean
): Promise<string | null> {
  if (disableRaster) return null;
  const cached = cache.get(cssBackground);
  if (cached) return cached;
  try {
    const raster = await renderBackgroundToPng(cssBackground, 1280, 720);
    const dataUri = `image/png;base64,${raster.buffer.toString('base64')}`;
    cache.set(cssBackground, dataUri);
    return dataUri;
  } catch {
    return null;
  }
}

async function applySlideBackground(
  pptxSlide: any,
  slide: Slide,
  theme: PptxTheme,
  isTitleSlide: boolean,
  baseDir: string | undefined,
  bgCache: Map<string, string>,
  disableRaster: boolean
): Promise<'dark' | 'light' | undefined> {
  if (slide.backgroundImage) {
    const { url, contrast } = parseBackgroundImageValue(slide.backgroundImage);
    const resolved = resolveImagePath(url, baseDir);
    if (/^https?:\/\//i.test(resolved)) {
      try {
        const res = await fetch(resolved);
        const contentType = res.headers.get('content-type') ?? 'image/jpeg';
        const buf = Buffer.from(await res.arrayBuffer());
        pptxSlide.background = { data: `${contentType};base64,${buf.toString('base64')}` };
        return contrast;
      } catch {}
    } else {
      pptxSlide.background = { path: resolved };
      return contrast;
    }
  }

  const cssBg = isTitleSlide
    ? (theme.titleBackgroundCss ?? theme.slideBackgroundCss)
    : theme.slideBackgroundCss;
  if (cssBg) {
    if (isGradientCss(cssBg)) {
      const dataUri = await getThemeBackgroundImage(bgCache, cssBg, disableRaster);
      if (dataUri) {
        pptxSlide.background = { data: dataUri };
        return undefined;
      }
    } else {
      pptxSlide.background = { fill: cssBg.replace('#', '') };
      return undefined;
    }
  }

  pptxSlide.background = { fill: theme.bg };
  return undefined;
}

export async function compileToEditablePptx(
  deck: SlideDeck,
  outputPath: string,
  options: { theme?: string; baseDir?: string; disableRaster?: boolean } = {}
): Promise<void> {
  const pptx = new (pptxgen as any)();
  pptx.layout = 'LAYOUT_16x9';

  const themeName = options.theme ?? String(deck.meta?.theme ?? 'light');
  const baseTheme = PPTX_THEMES[themeName] || PPTX_THEMES.light;
  const baseDir = options.baseDir;
  const disableRaster = options.disableRaster ?? false;
  const bgCache = new Map<string, string>();

  for (const slide of deck.slides) {
    const pptxSlide = pptx.addSlide();

    const theme = slide.accentColor ? applyAccentOverride(baseTheme, slide.accentColor) : baseTheme;
    const fontScale = FONT_SIZE_SCALE[slide.fontSize ?? 'md'] ?? 1;
    const isTitleSlide = slide.type === 'title';
    const isDarkTheme = DARK_THEMES.has(themeName);

    const contrastOverride = await applySlideBackground(
      pptxSlide,
      slide,
      theme,
      isTitleSlide,
      baseDir,
      bgCache,
      disableRaster
    );
    const effectiveTextColor =
      contrastOverride === 'dark' ? 'FFFFFF' : contrastOverride === 'light' ? '18181B' : undefined;
    const renderTheme: PptxTheme = effectiveTextColor
      ? { ...theme, text: effectiveTextColor }
      : theme;

    if (slide.notes) {
      pptxSlide.addNotes(slide.notes);
    }

    const blockOpts: BlockLayoutOptions = {
      pptx,
      pptxSlide,
      theme: renderTheme,
      baseDir,
      fontScale,
      isDarkTheme,
      imageFit: slide.imageFit,
      disableRaster,
    };

    if (slide.type === 'title') {
      pptxSlide.addText(slide.title || 'Title', {
        x: slideDetails.CONTENT_X,
        y: 1.7,
        w: slideDetails.CONTENT_W,
        h: Math.max(0.9, 1.15 * fontScale),
        align: slide.titleAlign ?? 'center',
        fontSize: Math.max(28, Math.round(44 * fontScale)),
        bold: true,
        fontFace: theme.font,
        color: theme.titleTextColor ?? theme.accent,
      });

      if (slide.content && slide.content.length > 0) {
        await layoutContentBlocks(
          slide.content,
          { x: slideDetails.CONTENT_X, y: 3.1, w: slideDetails.CONTENT_W, h: 1.7 },
          blockOpts,
          'top'
        );
      }
      continue;
    }

    if (slide.type === 'statement') {
      const textRuns: any[] = [];
      const fontSize = Math.max(18, Math.round(24 * fontScale));
      if (slide.title) {
        textRuns.push({
          text: slide.title + '\n\n',
          options: {
            bold: true,
            fontSize: Math.max(22, Math.round(32 * fontScale)),
            color: renderTheme.accent,
            fontFace: renderTheme.font,
          },
        });
      }
      slide.content.forEach((node, nodeIdx) => {
        const isLastNode = nodeIdx === slide.content.length - 1;
        pushParagraphNodeToRuns(node, textRuns, renderTheme, fontSize, isLastNode);
      });

      pptxSlide.addText(textRuns, {
        x: slideDetails.CONTENT_X,
        y: slideDetails.PAD_TOP,
        w: slideDetails.CONTENT_W,
        h: slideDetails.SLIDE_H - slideDetails.PAD_TOP - slideDetails.PAD_BOTTOM,
        align: slide.align === 'top' || slide.align === 'bottom' ? 'center' : 'center',
        valign: (slide.align as 'top' | 'middle' | 'bottom') ?? 'middle',
      });
      continue;
    }

    // Every remaining slide type shares the same title-band + content-stack
    // layout; only how `slide.content` maps onto the content rect differs.
    const { titleRect, contentRect } = computeLayout(slide, fontScale);
    if (titleRect) {
      addTitleText(pptxSlide, slide, renderTheme, titleRect, fontScale);
    }
    const vAlign = (slide.align as 'top' | 'center' | 'bottom') ?? 'top';

    if (slide.type === 'visual') {
      let imgUrl = '';
      const rest: SlideNode[] = [];
      slide.content.forEach((node) => {
        if (node.type === 'image' && !imgUrl) {
          imgUrl = node.url || '';
        } else if (!imgUrl && node.children?.some((c) => c.type === 'image')) {
          const child = node.children.find((c) => c.type === 'image');
          imgUrl = child?.url || '';
        } else {
          rest.push(node);
        }
      });

      if (imgUrl) {
        addImageOrVideo(pptxSlide, imgUrl, baseDir, contentRect, slide.imageFit ?? 'contain');
      } else {
        await layoutContentBlocks(slide.content, contentRect, blockOpts, vAlign);
      }
      continue;
    }

    if (slide.type === 'split') {
      const isManualSplit =
        slide.content.length >= 2 && slide.content.every((n) => n.type === 'column');

      if (!isManualSplit) {
        // Auto-detected split (core's runTransforms sets type: 'split' without
        // building column nodes when a slide has exactly one image/video plus
        // meaningful text - see packages/core/src/transformers/index.ts).
        const imageUrls = findImagesInNodes(slide.content);
        const imgUrl = imageUrls[0];
        const textNodes = slide.content.filter((n) => !(n.type === 'image' && n.url === imgUrl));
        const imageOnLeft = slide.imagePosition === 'left';
        const halfW = (contentRect.w - 0.3) / 2;
        const textBounds: Rect = imageOnLeft
          ? { x: contentRect.x + halfW + 0.3, y: contentRect.y, w: halfW, h: contentRect.h }
          : { x: contentRect.x, y: contentRect.y, w: halfW, h: contentRect.h };
        const imageBounds: Rect = imageOnLeft
          ? { x: contentRect.x, y: contentRect.y, w: halfW, h: contentRect.h }
          : { x: contentRect.x + halfW + 0.3, y: contentRect.y, w: halfW, h: contentRect.h };

        await layoutContentBlocks(textNodes, textBounds, blockOpts, vAlign);
        if (imgUrl) {
          addImageOrVideo(pptxSlide, imgUrl, baseDir, imageBounds, slide.imageFit);
        }
        continue;
      }

      const gap = 0.25;
      const columns = slide.content;
      const totalRatio = columns.reduce(
        (sum, col) => sum + (col.ratio && col.ratio > 0 ? col.ratio : 1),
        0
      );
      const availableW = contentRect.w - gap * (columns.length - 1);

      let x = contentRect.x;
      for (const col of columns) {
        const weight = col.ratio && col.ratio > 0 ? col.ratio : 1;
        const w = (weight / totalRatio) * availableW;
        if (col.children && col.children.length > 0) {
          await layoutContentBlocks(
            col.children,
            { x, y: contentRect.y, w, h: contentRect.h },
            blockOpts,
            vAlign
          );
        }
        x += w + gap;
      }
      continue;
    }

    // "stack slide.content into the content rect".
    await layoutContentBlocks(slide.content, contentRect, blockOpts, vAlign);
  }

  await fs.promises.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
  await pptx.writeFile({ fileName: path.resolve(outputPath) });
}
