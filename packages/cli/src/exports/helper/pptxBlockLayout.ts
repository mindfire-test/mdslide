import type { SlideNode } from '@mindfiredigital/mdslide-shared';
import {
  calculateNodeHeight,
  MAX_CONTENT_HEIGHT,
  parseStatsLines,
  extractChartData,
} from '@mindfiredigital/mdslide-core';
import type { BlockLayoutOptions, PptxTheme, Rect } from '../../types/index.js';
import { ADMONITION_COLORS, CHART_FALLBACK_COLORS } from '../../constants/exports/pptxConstants.js';
import {
  nodeToTextProps,
  nodeToPlainText,
  extractFlatListLines,
  pushListLinesToRuns,
  pushParagraphNodeToRuns,
  addImageOrVideo,
  highlightCodeToRuns,
} from './pptxEditableSlideHelper.js';
import { renderMermaidToPng, renderMathToPng, type RasterResult } from './rasterize.js';
import { GAP_IN, BASE_PT } from '../../constants/index.js';

function ptSize(base: number, scale: number, floor = 8): number {
  return Math.max(floor, Math.round(base * scale));
}

function isFillableNode(node: SlideNode): boolean {
  return (
    node.type === 'image' ||
    node.type === 'imageRow' ||
    node.type === 'math' ||
    node.type === 'table' ||
    node.type === 'code' ||
    node.type === 'blockquote'
  );
}

function computeWeight(node: SlideNode, scale: number): number {
  if (node.type === 'imageRow') return 350;
  if (node.type === 'math') {
    return 220 * scale;
  }
  let weight = calculateNodeHeight(node, scale);
  if (node.type === 'blockquote' && node.admonition) {
    weight += 45 * scale;
  }
  return Math.max(weight, 20);
}

function addStatsCards(
  pptxSlide: any,
  entries: { label: string; value: string }[],
  theme: PptxTheme,
  bounds: Rect
): void {
  const gap = 0.2;
  const n = entries.length;
  const cardWidth = (bounds.w - gap * (n - 1)) / n;
  entries.forEach((entry, i) => {
    const x = bounds.x + i * (cardWidth + gap);
    pptxSlide.addText(
      [
        {
          text: `${entry.value}\n`,
          options: { bold: true, fontSize: 26, color: theme.accent, breakLine: true },
        },
        {
          text: entry.label.toUpperCase(),
          options: { fontSize: 11, color: theme.muted, charSpacing: 1 },
        },
      ],
      {
        x,
        y: bounds.y,
        w: cardWidth,
        h: bounds.h,
        align: 'center',
        valign: 'middle',
        fill: { color: theme.cardBg },
        line: { color: theme.accent, width: 1 },
        margin: 10,
      }
    );
  });
}

function addChartFromTable(
  pptx: any,
  pptxSlide: any,
  tableNode: SlideNode,
  theme: PptxTheme,
  bounds: Rect
): boolean {
  const data = extractChartData(tableNode);
  if (!data) return false;

  const chartType = pptx.ChartType[tableNode.chart ?? 'bar'];
  const chartData = data.series.map((s) => ({
    name: s.name,
    labels: data.categories,
    values: s.values,
  }));
  pptxSlide.addChart(chartType, chartData, {
    ...bounds,
    chartColors: [theme.accent, theme.accent2, ...CHART_FALLBACK_COLORS],
    showLegend: data.series.length > 1 || tableNode.chart === 'pie',
    showTitle: false,
  });
  return true;
}

function placeRasterImage(pptxSlide: any, raster: RasterResult, rect: Rect): void {
  const aspect = raster.width / Math.max(raster.height, 1);
  let w = rect.w;
  let h = rect.w / aspect;
  if (h > rect.h) {
    h = rect.h;
    w = rect.h * aspect;
  }
  const x = rect.x + (rect.w - w) / 2;
  const y = rect.y + (rect.h - h) / 2;
  pptxSlide.addImage({ data: `image/png;base64,${raster.buffer.toString('base64')}`, x, y, w, h });
}

function renderHeadingBlock(node: SlideNode, rect: Rect, opts: BlockLayoutOptions): void {
  const depth = node.depth ?? 2;
  const sizeMap: Record<number, number> = { 1: BASE_PT.h1, 2: BASE_PT.h2, 3: BASE_PT.h3 };
  const base = sizeMap[depth] ?? BASE_PT.h4;
  const fontSize = ptSize(base, opts.fontScale);
  const runs = nodeToTextProps(node, opts.theme);
  if (!runs.length) return;
  const styledRuns = runs.map((r) => ({
    text: r.text,
    options: {
      fontFace: opts.theme.font,
      ...r.options,
      fontSize,
      bold: true,
      color: depth >= 3 ? opts.theme.muted : opts.theme.text,
    },
  }));
  opts.pptxSlide.addText(styledRuns, { ...rect, valign: 'top' });
}

function renderParagraphBlock(node: SlideNode, rect: Rect, opts: BlockLayoutOptions): void {
  const fontSize = ptSize(BASE_PT.body, opts.fontScale);
  const runs: any[] = [];
  pushParagraphNodeToRuns(node, runs, opts.theme, fontSize, true);
  if (!runs.length) return;
  opts.pptxSlide.addText(runs, { ...rect, valign: 'top' });
}

function renderListBlock(node: SlideNode, rect: Rect, opts: BlockLayoutOptions): void {
  const baseFontSize = ptSize(BASE_PT.body, opts.fontScale);
  const lines = extractFlatListLines(node, opts.theme);
  const runs: any[] = [];
  pushListLinesToRuns(lines, runs, opts.theme, baseFontSize, true);
  if (!runs.length) return;
  opts.pptxSlide.addText(runs, { ...rect, valign: 'top' });
}

function renderBlockquoteBlock(
  node: SlideNode,
  rect: Rect,
  opts: BlockLayoutOptions,
  standalone: boolean
): void {
  const admonitionMeta = node.admonition ? ADMONITION_COLORS[node.admonition] : undefined;
  const baseFontSize = ptSize(BASE_PT.blockquote, opts.fontScale);
  const runs: any[] = [];

  if (admonitionMeta) {
    runs.push({
      text: `${admonitionMeta.icon} ${admonitionMeta.label}\n`,
      options: {
        bold: true,
        fontSize: baseFontSize + 2,
        color: admonitionMeta.color,
        fontFace: opts.theme.font,
        breakLine: true,
      },
    });
  }

  const children = node.children ?? [];
  children.forEach((child, idx) => {
    const isLastChild = idx === children.length - 1;
    const childRuns = nodeToTextProps(child, opts.theme);
    childRuns.forEach((r, ri) => {
      const isLastRun = ri === childRuns.length - 1;
      runs.push({
        text: r.text,
        options: {
          fontFace: opts.theme.font,
          color: opts.theme.text,
          ...r.options,
          fontSize: baseFontSize,
          italic: !admonitionMeta,
          breakLine: isLastRun && !isLastChild,
        },
      });
    });
  });

  if (!runs.length) return;
  const barColor = admonitionMeta?.color ?? opts.theme.accent;

  if (standalone) {
    opts.pptxSlide.addText(runs, {
      ...rect,
      valign: 'middle',
      fill: { color: opts.theme.cardBg },
      line: { color: barColor, width: 2 },
      margin: 10,
    });
    return;
  }

  const barW = 0.06;
  opts.pptxSlide.addShape(opts.pptx.ShapeType.rect, {
    x: rect.x,
    y: rect.y,
    w: barW,
    h: rect.h,
    fill: { color: barColor },
    line: { type: 'none' },
  });
  opts.pptxSlide.addText(runs, {
    x: rect.x + barW + 0.15,
    y: rect.y,
    w: rect.w - barW - 0.15,
    h: rect.h,
    valign: 'top',
  });
}

async function renderCodeBlock(
  node: SlideNode,
  rect: Rect,
  opts: BlockLayoutOptions
): Promise<void> {
  const lang = (node.lang ?? '').toLowerCase();
  const value = node.value ?? '';

  if (lang === 'stats') {
    const entries = parseStatsLines(value);
    if (entries.length > 0) {
      addStatsCards(opts.pptxSlide, entries, opts.theme, rect);
      return;
    }
  }

  if (lang === 'mermaid' && !opts.disableRaster) {
    try {
      const raster = await renderMermaidToPng(value, opts.isDarkTheme);
      placeRasterImage(opts.pptxSlide, raster, rect);
      return;
    } catch {}
  }

  const fontSize = ptSize(BASE_PT.code, opts.fontScale, 8);
  const runs =
    lang && lang !== 'mermaid'
      ? await highlightCodeToRuns(value, lang, opts.theme, fontSize, opts.isDarkTheme)
      : [{ text: value, options: { fontFace: 'Courier New', color: opts.theme.text, fontSize } }];

  if (!runs.length) return;
  opts.pptxSlide.addText(runs, {
    ...rect,
    valign: 'top',
    fill: { color: opts.theme.cardBg },
    line: { color: opts.theme.accent, width: 1 },
    margin: 10,
  });
}

async function renderMathBlock(
  node: SlideNode,
  rect: Rect,
  opts: BlockLayoutOptions
): Promise<void> {
  if (opts.disableRaster) {
    opts.pptxSlide.addText(node.value ?? '', {
      ...rect,
      valign: 'middle',
      align: 'center',
      italic: true,
      fontFace: 'Courier New',
      color: opts.theme.text,
      fontSize: ptSize(BASE_PT.body, opts.fontScale),
    });
    return;
  }
  try {
    const raster = await renderMathToPng(node.value ?? '', opts.theme.text);
    placeRasterImage(opts.pptxSlide, raster, rect);
  } catch {
    opts.pptxSlide.addText(node.value ?? '', {
      ...rect,
      valign: 'middle',
      align: 'center',
      italic: true,
      fontFace: 'Courier New',
      color: opts.theme.text,
      fontSize: ptSize(BASE_PT.body, opts.fontScale),
    });
  }
}

function renderTableBlock(node: SlideNode, rect: Rect, opts: BlockLayoutOptions): void {
  if (node.chart) {
    const added = addChartFromTable(opts.pptx, opts.pptxSlide, node, opts.theme, rect);
    if (added) return;
  }

  const rows: any[] = [];
  (node.children ?? []).forEach((rowNode) => {
    const cells: any[] = [];
    (rowNode.children ?? []).forEach((cellNode) => {
      const raw = cellNode.children
        ? cellNode.children.map(nodeToPlainText).join('')
        : cellNode.value || '';
      cells.push({
        text: cellNode.header ? raw.toUpperCase() : raw,
        options: {
          fill: cellNode.header ? { color: opts.theme.accent } : { color: opts.theme.cardBg },
          color: cellNode.header ? opts.theme.bg : opts.theme.text,
          bold: cellNode.header,
          fontFace: opts.theme.font,
          fontSize: ptSize(BASE_PT.table, opts.fontScale, 8),
        },
      });
    });
    rows.push(cells);
  });

  if (!rows.length) return;
  opts.pptxSlide.addTable(rows, { ...rect });
}

function renderImageBlock(node: SlideNode, rect: Rect, opts: BlockLayoutOptions): void {
  if (!node.url) return;
  addImageOrVideo(opts.pptxSlide, node.url, opts.baseDir, rect, opts.imageFit);
}

function renderImageRowBlock(node: SlideNode, rect: Rect, opts: BlockLayoutOptions): void {
  const images = (node.children ?? []).filter((c) => c.type === 'image' && c.url);
  if (!images.length) return;
  const gap = 0.2;
  const n = images.length;
  const w = (rect.w - gap * (n - 1)) / n;
  images.forEach((img, i) => {
    const x = rect.x + i * (w + gap);
    addImageOrVideo(
      opts.pptxSlide,
      img.url!,
      opts.baseDir,
      { x, y: rect.y, w, h: rect.h },
      opts.imageFit
    );
  });
}

function groupConsecutiveImages(nodes: SlideNode[]): SlideNode[] {
  const result: SlideNode[] = [];
  let run: SlideNode[] = [];
  const flush = () => {
    if (run.length === 1) result.push(run[0]!);
    else if (run.length > 1) result.push({ type: 'imageRow', children: run });
    run = [];
  };
  nodes.forEach((n) => {
    if (n.type === 'image') {
      run.push(n);
    } else {
      flush();
      result.push(n);
    }
  });
  flush();
  return result;
}

async function renderBlock(
  node: SlideNode,
  rect: Rect,
  opts: BlockLayoutOptions,
  standalone: boolean
): Promise<void> {
  switch (node.type) {
    case 'heading':
      return renderHeadingBlock(node, rect, opts);
    case 'paragraph':
      return renderParagraphBlock(node, rect, opts);
    case 'list':
      return renderListBlock(node, rect, opts);
    case 'blockquote':
      return renderBlockquoteBlock(node, rect, opts, standalone);
    case 'code':
      return renderCodeBlock(node, rect, opts);
    case 'table':
      return renderTableBlock(node, rect, opts);
    case 'image':
      return renderImageBlock(node, rect, opts);
    case 'imageRow':
      return renderImageRowBlock(node, rect, opts);
    case 'math':
      return renderMathBlock(node, rect, opts);
    case 'thematicBreak':
      return;
    default:
      if (node.children) {
        return renderParagraphBlock(node, rect, opts);
      }
  }
}

export async function layoutContentBlocks(
  nodes: SlideNode[],
  rect: Rect,
  opts: BlockLayoutOptions,
  vAlign: 'top' | 'center' | 'bottom' = 'top'
): Promise<void> {
  if (!nodes.length || rect.h <= 0) return;
  nodes = groupConsecutiveImages(nodes);

  const soleFillable = nodes.length === 1 && isFillableNode(nodes[0]!);
  const weights = nodes.map((n) => computeWeight(n, opts.fontScale));
  const unitToInch = rect.h / MAX_CONTENT_HEIGHT;
  const heights = soleFillable ? [rect.h] : weights.map((w) => w * unitToInch);
  const gapTotal = GAP_IN * Math.max(0, nodes.length - 1);
  const usedHeight = heights.reduce((a, b) => a + b, 0) + gapTotal;

  let y = rect.y;
  if (usedHeight < rect.h) {
    if (vAlign === 'center') y = rect.y + (rect.h - usedHeight) / 2;
    else if (vAlign === 'bottom') y = rect.y + (rect.h - usedHeight);
  }

  const standalone = nodes.length === 1;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    const h = Math.max(heights[i]!, 0.15);
    await renderBlock(node, { x: rect.x, y, w: rect.w, h }, opts, standalone);
    y += h + GAP_IN;
  }
}
