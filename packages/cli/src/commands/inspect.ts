import path from 'path';
import { Logger } from '../logger/index.js';
import { CompileError } from '../middleware/errors.js';
import type { InspectOptions, InspectSlide } from '../types/index.js';
import { COLORS, STYLES } from '../constants/index.js';
import { ICONS, isStdio, readInputSource } from '../utils/index.js';
import type { Slide, SlideNode } from '@mindfiredigital/mdslide-shared';

function countElements(
  nodes: SlideNode[] | undefined,
  counts: Record<string, number> = {}
): Record<string, number> {
  for (const node of nodes ?? []) {
    counts[node.type] = (counts[node.type] ?? 0) + 1;
    if (node.children) countElements(node.children, counts);
  }
  return counts;
}

function detectComponents(
  nodes: SlideNode[] | undefined,
  found: { admonitions: string[]; charts: string[] } = { admonitions: [], charts: [] }
): { admonitions: string[]; charts: string[] } {
  for (const node of nodes ?? []) {
    if (node.type === 'blockquote' && node.admonition) found.admonitions.push(node.admonition);
    if (node.type === 'table' && node.chart) found.charts.push(node.chart);
    if (node.children) detectComponents(node.children, found);
  }
  return found;
}

function hasVideoNode(
  nodes: SlideNode[] | undefined,
  isVideoUrl: (url: string) => boolean
): boolean {
  for (const node of nodes ?? []) {
    if (node.type === 'image' && node.url && isVideoUrl(node.url)) return true;
    if (node.children && hasVideoNode(node.children, isVideoUrl)) return true;
  }
  return false;
}

function autoReason(slide: Slide): string {
  switch (slide.type) {
    case 'bullets':
      return 'Contains a list, so it uses the bulleted-summary layout.';
    case 'code':
      return 'A single code block fills the slide.';
    case 'quote':
      return 'A single blockquote is centered as a testimonial/quote.';
    case 'visual':
      return 'Exactly one image (and no other meaningful text) fills the slide.';
    case 'table':
      return 'Contains a table, centered as a comparison grid.';
    default:
      return 'No list/code/quote/table/image pattern matched, so the default flowing content layout is used.';
  }
}

function explainLayout(
  slide: Slide,
  validLayouts: readonly string[]
): { source: 'override' | 'auto'; reason: string } {
  const override = slide.layoutOverride?.trim();
  const overrideIsValid = !!override && validLayouts.includes(override);

  if (slide.type === 'title' || slide.type === 'statement') {
    if (overrideIsValid && override === slide.type) {
      return { source: 'override', reason: `Explicit <!-- layout: ${override} --> override.` };
    }
    return {
      source: 'auto',
      reason:
        slide.type === 'title'
          ? 'Auto-detected: a heading with no other content is treated as a title slide.'
          : 'Layout is "statement", which the compiler only ever assigns via an explicit override.',
    };
  }

  if (slide.type === 'split') {
    if (overrideIsValid && override === 'split') {
      return { source: 'override', reason: 'Explicit <!-- layout: split --> override.' };
    }
    return {
      source: 'auto',
      reason: overrideIsValid
        ? `A ::split::/::col:: marker or a single image + text auto-detected a multi-column layout, superseding the "${override}" override.`
        : 'Auto-detected: ::split:: (two columns), ::col:: (N columns), or a single image alongside text produces a split layout.',
    };
  }

  if (overrideIsValid && override === slide.type) {
    return { source: 'override', reason: `Explicit <!-- layout: ${override} --> override.` };
  }

  if (override && !overrideIsValid) {
    return {
      source: 'auto',
      reason: `Invalid override "<!-- layout: ${override} -->" ignored; fell back to auto-detection. ${autoReason(slide)}`,
    };
  }

  return { source: 'auto', reason: `Auto-detected. ${autoReason(slide)}` };
}

export async function inspectCommand(inputFile: string, opts: InspectOptions): Promise<void> {
  const log = new Logger(opts.json ? 'silent' : (opts.logLevel ?? 'info'));
  const absInput = isStdio(inputFile) ? '<stdin>' : path.resolve(inputFile);

  const reportError = (err: unknown): void => {
    if (opts.json) {
      const e = err instanceof Error ? err : new Error(String(err));
      process.stdout.write(
        `${JSON.stringify(
          {
            file: absInput,
            success: false,
            error: e.message,
            code: (e as any).code,
            hint: (e as any).hint,
          },
          null,
          2
        )}\n`
      );
    } else {
      log.error(err);
    }
  };

  let core: typeof import('@mindfiredigital/mdslide-core');
  try {
    core = await import('@mindfiredigital/mdslide-core');
  } catch {
    const err = new CompileError('Could not load @mindfiredigital/mdslide-core.', {});
    reportError(err);
    throw err;
  }

  let markdown: string;
  try {
    markdown = await readInputSource(inputFile);
  } catch (err) {
    reportError(err);
    throw err;
  }

  let slides: Slide[];
  let meta: Record<string, unknown>;
  let warnings: string[];
  try {
    const result = new core.Compiler().compile(markdown, {});
    slides = result.slides ?? [];
    meta = result.meta ?? {};
    warnings = result.warnings ?? [];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const e = new CompileError(message, { file: absInput });
    reportError(e);
    throw e;
  }

  const maxHeightPx = core.MAX_CONTENT_HEIGHT;
  const validLayouts = [...core.VALID_SLIDE_TYPES];
  const inspected: InspectSlide[] = slides.map((slide, index) => {
    const { source, reason } = explainLayout(slide, validLayouts);
    const contentHeightPx = Math.round(
      core.estimateSlideContentHeight(slide.content, slide.fontSize)
    );
    const columns =
      slide.type === 'split'
        ? slide.content.map((column) => ({ layout: column.layout ?? 'content' }))
        : undefined;
    const { admonitions, charts } = detectComponents(slide.content);
    const hasVideo = hasVideoNode(slide.content, core.isVideoUrl);

    return {
      index: index + 1,
      id: slide.id,
      title: slide.title,
      layout: slide.type,
      layoutSource: source,
      layoutReason: reason,
      elementCounts: countElements(slide.content),
      contentHeightPx,
      maxHeightPx,
      overflowing: slide.overflow !== 'split' && contentHeightPx > maxHeightPx,
      hasNotes: Boolean(slide.notes),
      ...(columns ? { columns } : {}),
      ...(admonitions.length ? { admonitions } : {}),
      ...(charts.length ? { charts } : {}),
      ...(slide.imageFit ? { imageFit: slide.imageFit } : {}),
      ...(slide.imagePosition ? { imagePosition: slide.imagePosition } : {}),
      ...(slide.accentColor ? { accentColor: slide.accentColor } : {}),
      ...(hasVideo ? { hasVideo: true } : {}),
    };
  });

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify(
        { file: absInput, slides: inspected.length, meta, warnings, deck: inspected },
        null,
        2
      )}\n`
    );
    return;
  }

  log.raw('');
  log.raw(`  ${STYLES.bold}${path.basename(absInput)}${STYLES.reset} - ${inspected.length} slides`);
  log.raw('');
  for (const s of inspected) {
    const title = s.title ? ` "${s.title}"` : '';
    log.raw(`  ${ICONS.step} ${STYLES.bold}Slide ${s.index}${STYLES.reset}${title}`);
    log.raw(`     layout: ${COLORS.cyan}${s.layout}${STYLES.reset} (${s.layoutSource})`);
    log.raw(`     ${COLORS.grey}${s.layoutReason}${STYLES.reset}`);
    if (s.columns?.length) {
      log.raw(
        `     columns: ${COLORS.grey}${s.columns.map((c) => c.layout).join(', ')}${STYLES.reset}`
      );
    }
    if (s.admonitions?.length) {
      log.raw(`     admonitions: ${COLORS.grey}${s.admonitions.join(', ')}${STYLES.reset}`);
    }
    if (s.charts?.length) {
      log.raw(`     charts: ${COLORS.grey}${s.charts.join(', ')}${STYLES.reset}`);
    }
    if (s.imageFit) {
      log.raw(`     imageFit: ${COLORS.grey}${s.imageFit}${STYLES.reset}`);
    }
    if (s.imagePosition) {
      log.raw(`     imagePosition: ${COLORS.grey}${s.imagePosition}${STYLES.reset}`);
    }
    if (s.accentColor) {
      log.raw(`     accentColor: ${COLORS.grey}${s.accentColor}${STYLES.reset}`);
    }
    if (s.hasVideo) {
      log.raw(`     ${COLORS.grey}contains a video${STYLES.reset}`);
    }
    const elCounts = Object.entries(s.elementCounts)
      .map(([type, count]) => `${type}:${count}`)
      .join(', ');
    if (elCounts) log.raw(`     elements: ${COLORS.grey}${elCounts}${STYLES.reset}`);
    const heightLine = `     height: ~${s.contentHeightPx}px of ~${s.maxHeightPx}px budget`;
    log.raw(
      s.overflowing ? `${heightLine}  ${COLORS.grey}(overflowing)${STYLES.reset}` : heightLine
    );
    if (s.hasNotes) log.raw(`     ${COLORS.grey}has speaker notes${STYLES.reset}`);
    log.raw('');
  }

  if (warnings.length) {
    for (const w of warnings) log.warn(w);
    log.raw('');
  }
}
