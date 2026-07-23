import type { SlideNode } from '@mindfiredigital/mdslide-shared';
import { sanitizeHtml } from '../../utils/index.js';
import { ChartData } from '../../interfaces/index.js';
import { PALETTE } from '../../constants/index.js';

function cellText(node: SlideNode): string {
  if (node.type === 'text') return node.value ?? '';
  if (node.children && node.children.length > 0) return node.children.map(cellText).join('');
  return node.value ?? '';
}

function parseNumber(raw: string): number {
  const cleaned = raw.replace(/[,\s]/g, '');
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

// Converts a table node into chart data (headers = series names, row first cell = category).
// Returns null if the table lacks a header, rows, or data columns.
// Falling back to null allows the caller to render a plain table instead.
export function extractChartData(node: SlideNode): ChartData | null {
  const rows = (node.children ?? []).map((row) => (row.children ?? []).map(cellText));
  if (rows.length < 2) return null;

  const [header, ...dataRows] = rows as [string[], ...string[][]];
  if (header.length < 2) return null;

  const categories = dataRows.map((row) => row[0] ?? '');
  const seriesCount = header.length - 1;
  const series = Array.from({ length: seriesCount }, (_, i) => ({
    name: header[i + 1]?.trim() || `Series ${i + 1}`,
    values: dataRows.map((row) => parseNumber(row[i + 1] ?? '0')),
  }));

  return { categories, series };
}

function renderLegend(
  series: { name: string; values: number[] }[],
  colorFor: (i: number) => string
): string {
  if (series.length < 2) return '';
  const items = series
    .map(
      (s, i) =>
        `<span class="chartLegendItem"><span class="chartLegendSwatch" style="background:${colorFor(i)}"></span>${sanitizeHtml(s.name)}</span>`
    )
    .join('');
  return `<div class="chartLegend">${items}</div>`;
}

function buildBarChart(data: ChartData): string {
  const { categories, series } = data;
  const W = 640;
  const H = 360;
  const plotLeft = 30;
  const plotRight = 610;
  const plotTop = 20;
  const plotBottom = 300;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const groupWidth = plotWidth / Math.max(1, categories.length);
  const barCount = series.length;
  const barWidth = (groupWidth * 0.8) / barCount;
  const groupGap = groupWidth * 0.1;

  let bars = '';
  let labels = '';
  categories.forEach((cat, catIdx) => {
    const groupX = plotLeft + catIdx * groupWidth + groupGap;
    series.forEach((s, seriesIdx) => {
      const value = s.values[catIdx] ?? 0;
      const barHeight = (value / max) * plotHeight;
      const x = groupX + seriesIdx * barWidth;
      const y = plotBottom - barHeight;
      bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barWidth * 0.85).toFixed(1)}" height="${barHeight.toFixed(1)}" fill="${PALETTE[seriesIdx % PALETTE.length]}" rx="3" />`;
      bars += `<text x="${(x + (barWidth * 0.85) / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" class="chartValueLabel">${sanitizeHtml(String(value))}</text>`;
    });
    labels += `<text x="${(groupX + (groupWidth - groupGap * 2) / 2).toFixed(1)}" y="${plotBottom + 20}" text-anchor="middle" class="chartAxisLabel">${sanitizeHtml(cat)}</text>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" class="chartSvg" role="img">
    <line x1="${plotLeft}" y1="${plotBottom}" x2="${plotRight}" y2="${plotBottom}" class="chartAxisLine" />
    ${bars}
    ${labels}
  </svg>${renderLegend(series, (i) => PALETTE[i % PALETTE.length]!)}`;
}

function buildLineChart(data: ChartData): string {
  const { categories, series } = data;
  const W = 640;
  const H = 360;
  const plotLeft = 30;
  const plotRight = 610;
  const plotTop = 20;
  const plotBottom = 300;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const step = categories.length > 1 ? plotWidth / (categories.length - 1) : 0;

  const gridlines = [0.25, 0.5, 0.75]
    .map((f) => {
      const y = plotBottom - f * plotHeight;
      return `<line x1="${plotLeft}" y1="${y.toFixed(1)}" x2="${plotRight}" y2="${y.toFixed(1)}" class="chartGridLine" />`;
    })
    .join('');

  const lines = series
    .map((s, seriesIdx) => {
      const points = s.values
        .map((v, i) => {
          const x = categories.length > 1 ? plotLeft + i * step : plotLeft + plotWidth / 2;
          const y = plotBottom - (v / max) * plotHeight;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
      const dots = s.values
        .map((v, i) => {
          const x = categories.length > 1 ? plotLeft + i * step : plotLeft + plotWidth / 2;
          const y = plotBottom - (v / max) * plotHeight;
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${PALETTE[seriesIdx % PALETTE.length]}" />`;
        })
        .join('');
      return `<polyline points="${points}" fill="none" stroke="${PALETTE[seriesIdx % PALETTE.length]}" stroke-width="2.5" />${dots}`;
    })
    .join('');

  const labels = categories
    .map((cat, i) => {
      const x = categories.length > 1 ? plotLeft + i * step : plotLeft + plotWidth / 2;
      return `<text x="${x.toFixed(1)}" y="${plotBottom + 20}" text-anchor="middle" class="chartAxisLabel">${sanitizeHtml(cat)}</text>`;
    })
    .join('');

  return `<svg viewBox="0 0 ${W} ${H}" class="chartSvg" role="img">
    ${gridlines}
    <line x1="${plotLeft}" y1="${plotBottom}" x2="${plotRight}" y2="${plotBottom}" class="chartAxisLine" />
    ${lines}
    ${labels}
  </svg>${renderLegend(series, (i) => PALETTE[i % PALETTE.length]!)}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function buildPieChart(data: ChartData): string {
  const { categories } = data;
  const firstSeries = data.series[0]!;
  const total = firstSeries.values.reduce((sum, v) => sum + Math.max(0, v), 0);
  const W = 640;
  const H = 320;
  const cx = 170;
  const cy = 160;
  const r = 130;

  let paths: string;
  if (total <= 0) {
    paths = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--slide-border)" />`;
  } else {
    let angle = 0;
    paths = firstSeries.values
      .map((v, i) => {
        const slice = (Math.max(0, v) / total) * 360;
        const [x0, y0] = polarToCartesian(cx, cy, r, angle);
        const [x1, y1] = polarToCartesian(cx, cy, r, angle + slice);
        const largeArc = slice > 180 ? 1 : 0;
        const path = `M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${largeArc} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`;
        angle += slice;
        return `<path d="${path}" fill="${PALETTE[i % PALETTE.length]}" />`;
      })
      .join('');
  }

  const legend = categories
    .map(
      (cat, i) =>
        `<div class="chartLegendItem"><span class="chartLegendSwatch" style="background:${PALETTE[i % PALETTE.length]}"></span>${sanitizeHtml(cat)}: ${sanitizeHtml(String(firstSeries.values[i] ?? 0))}</div>`
    )
    .join('');

  return `<svg viewBox="0 0 ${W} ${H}" class="chartSvg" role="img">${paths}</svg><div class="chartLegend chartLegendVertical">${legend}</div>`;
}

// Renders a table SlideNode as an inline-SVG chart (computed server-side, no client JS/canvas). The chart is rendered in the same way as Mermaid diagrams (as native SVG) to ensure consistent rendering in headless Chrome for screenshots and PDFs. Returns null if the data is not suitable for a chart, allowing the caller to display a regular table instead.
export function renderChart(node: SlideNode): string | null {
  const data = extractChartData(node);
  if (!data) return null;

  const kind = node.chart ?? 'bar';
  const svg =
    kind === 'line'
      ? buildLineChart(data)
      : kind === 'pie'
        ? buildPieChart(data)
        : buildBarChart(data);

  return `<div class="chartContainer" data-chart="${sanitizeHtml(kind)}">${svg}</div>`;
}
