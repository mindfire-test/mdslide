import { parseFrontmatter } from '@mindfiredigital/mdslide-shared';
import { VALID_THEMES, VALIDATION_MESSAGES } from '../constants/index.js';
import { ValidationIssue } from '../types/index.js';
import path from 'path';
import fs from 'fs';
import { absoluteLine, splitSlideChunks } from '../utils/index.js';

const core = await import('@mindfiredigital/mdslide-core');

async function resolveCoreValidationLists(): Promise<{
  supportedLangs: readonly string[];
  validLayouts: readonly string[];
  validColumnLayouts: readonly string[];
  validAdmonitionKinds: readonly string[];
  validChartTypes: readonly string[];
  validImageFits: readonly string[];
  validImagePositions: readonly string[];
}> {
  try {
    return {
      supportedLangs: core.SUPPORTED_LANGS,
      validLayouts: [...core.VALID_SLIDE_TYPES],
      validColumnLayouts: [...core.VALID_COLUMN_LAYOUT_TYPES],
      validAdmonitionKinds: [...core.VALID_ADMONITION_KINDS],
      validChartTypes: [...core.VALID_CHART_TYPES],
      validImageFits: [...core.VALID_IMAGE_FITS],
      validImagePositions: [...core.VALID_IMAGE_POSITIONS],
    };
  } catch {
    return {
      supportedLangs: [],
      validLayouts: [],
      validColumnLayouts: [],
      validAdmonitionKinds: [],
      validChartTypes: [],
      validImageFits: [],
      validImagePositions: [],
    };
  }
}

async function estimateOverflow(
  slideMarkdown: string,
  meta: Record<string, unknown>
): Promise<{ heightPx: number; maxHeightPx: number; excessItems: number } | null> {
  try {
    const { slides: rawBlocks } = core.parseMarkdown(slideMarkdown);
    if (rawBlocks.length === 0) return null;

    const [slide] = core.runTransforms(core.normalizeSlides(rawBlocks, meta));
    if (!slide) return null;

    const maxHeightPx = core.MAX_CONTENT_HEIGHT;
    const heightPx = Math.round(core.estimateSlideContentHeight(slide.content, slide.fontSize));
    if (heightPx <= maxHeightPx) return null;

    let cumulative = 0;
    let cutIndex = slide.content.length;
    for (let n = 0; n < slide.content.length; n++) {
      cumulative += core.estimateSlideContentHeight([slide.content[n]!], slide.fontSize);
      if (cumulative > maxHeightPx) {
        cutIndex = n;
        break;
      }
    }
    const excessItems = Math.max(1, slide.content.length - cutIndex);
    return { heightPx, maxHeightPx, excessItems };
  } catch {
    // Best-effort only: a chunk that fails to parse here is already
    // reported by the syntax checks elsewhere in validateSlides.
    return null;
  }
}

function checkColumnLayoutComments(
  rawLines: string[],
  segments: [number, number][],
  slideNo: number,
  slideStartLine: number,
  validColumnLayouts: readonly string[],
  issues: ValidationIssue[]
): void {
  for (const [start, end] of segments) {
    let count = 0;
    for (let idx = start; idx < end; idx++) {
      const trimmed = rawLines[idx]!.trim();
      const match = trimmed.match(/^<!--\s*layout:\s*(.*?)\s*-->$/);
      if (!match) continue;
      count++;
      const absLine = absoluteLine(slideStartLine, idx);
      if (count > 1) {
        issues.push({
          type: 'warning',
          slide: slideNo,
          line: absLine,
          ...VALIDATION_MESSAGES.MULTIPLE_COLUMN_LAYOUTS,
        });
      } else {
        const layoutName = match[1]!.trim();
        if (validColumnLayouts.length > 0 && !validColumnLayouts.includes(layoutName)) {
          issues.push({
            type: 'warning',
            slide: slideNo,
            line: absLine,
            ...VALIDATION_MESSAGES.INVALID_LAYOUT(layoutName, validColumnLayouts),
          });
        }
      }
    }
  }
}

const ACCENT_COLOR_RE = /^(#[0-9a-f]{3,8}|[a-z]+|(rgb|rgba|hsl|hsla)\([^)]*\))$/i;

async function validateSlides(markdown: string, filePath?: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const {
    supportedLangs,
    validLayouts,
    validColumnLayouts,
    validAdmonitionKinds,
    validChartTypes,
    validImageFits,
    validImagePositions,
  } = await resolveCoreValidationLists();

  // 1. Parse Frontmatter
  let frontmatterContent = markdown;
  let meta: Record<string, unknown> = {};
  let defaultOverflow: string | undefined;

  const fmMatch = markdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  const frontmatterLineCount = fmMatch ? fmMatch[0].split('\n').length - 1 : 0;

  try {
    const parsed = parseFrontmatter(markdown);
    meta = parsed.meta;
    frontmatterContent = parsed.content;
    if (meta.overflow && typeof meta.overflow === 'string') {
      defaultOverflow = meta.overflow.toLowerCase();
    }

    // Validate Frontmatter keys
    if (meta.theme !== undefined) {
      const themeLineIdx = fmMatch
        ? fmMatch[0].split('\n').findIndex((l) => /^\s*theme\s*:/i.test(l))
        : -1;
      const themeLine = themeLineIdx >= 0 ? themeLineIdx + 1 : undefined;
      if (typeof meta.theme !== 'string') {
        issues.push({
          type: 'warning',
          ...(themeLine ? { line: themeLine } : {}),
          ...VALIDATION_MESSAGES.INVALID_THEME(''),
        });
      } else {
        const themeLower = meta.theme.toLowerCase();
        if (!(VALID_THEMES as readonly string[]).includes(themeLower)) {
          issues.push({
            type: 'warning',
            ...(themeLine ? { line: themeLine } : {}),
            ...VALIDATION_MESSAGES.INVALID_THEME(meta.theme),
          });
        }
      }
    }
  } catch (err: any) {
    issues.push({
      type: 'error',
      ...(fmMatch ? { line: 1 } : {}),
      ...VALIDATION_MESSAGES.INVALID_FRONTMATTER(
        err.message || 'Check your YAML syntax in the frontmatter block.'
      ),
    });
    // Strip frontmatter manually to continue validation of slides
    frontmatterContent = markdown.replace(/^---[\r\n][\s\S]*?[\r\n]---[\r\n]?/, '');
  }

  // 2. Split into slides
  const { chunks: slides } = splitSlideChunks(frontmatterContent);

  if (slides.length === 1) {
    issues.push({
      type: 'warning',
      line: frontmatterLineCount + 1,
      ...VALIDATION_MESSAGES.NO_SEPARATORS,
    });
  }

  const slideStartLines: number[] = [];
  {
    let cursor = frontmatterLineCount + 1;
    for (const chunk of slides) {
      slideStartLines.push(cursor);
      cursor += chunk.split('\n').length + 1;
    }
  }

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]!;
    const slideNo = i + 1;
    const slideStartLine = slideStartLines[i]!;
    const rawLines = slide.split('\n');
    const trimmedSlide = slide.trim();

    if (trimmedSlide === '') {
      issues.push({
        type: 'warning',
        slide: slideNo,
        line: slideStartLine,
        ...VALIDATION_MESSAGES.EMPTY_SLIDE,
      });
    }

    const hasHeading = rawLines.some((l) => /^#{1,6}\s/.test(l.trim()));
    if (!hasHeading && trimmedSlide !== '') {
      issues.push({
        type: 'warning',
        slide: slideNo,
        line: slideStartLine,
        ...VALIDATION_MESSAGES.NO_HEADING,
      });
    }

    const hasOverflowSplit =
      defaultOverflow === 'split' ||
      rawLines.some((l) => /^<!--\s*overflow:\s*split\s*-->$/i.test(l.trim()));

    if (!hasOverflowSplit && trimmedSlide !== '') {
      const overflow = await estimateOverflow(slide, meta);
      if (overflow) {
        issues.push({
          type: 'warning',
          slide: slideNo,
          line: slideStartLine,
          ...VALIDATION_MESSAGES.OVERFLOW(overflow),
        });
      }
    }

    let inCodeBlock = false;
    let lastFenceOpenLine: number | undefined;
    rawLines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (inCodeBlock) {
          lastFenceOpenLine = absoluteLine(slideStartLine, idx);
          const lang = trimmed.slice(3).trim();
          if (
            lang !== '' &&
            supportedLangs.length > 0 &&
            !supportedLangs.includes(lang.toLowerCase())
          ) {
            issues.push({
              type: 'warning',
              slide: slideNo,
              line: lastFenceOpenLine,
              ...VALIDATION_MESSAGES.UNSUPPORTED_LANG(lang, supportedLangs),
            });
          }
        }
      }
    });

    const codeFenceCount = (slide.match(/^```/gm) ?? []).length;
    if (codeFenceCount % 2 !== 0) {
      issues.push({
        type: 'error',
        slide: slideNo,
        line: lastFenceOpenLine ?? slideStartLine,
        fixable: true,
        ...VALIDATION_MESSAGES.UNCLOSED_CODE_FENCE,
      });
    }

    // Speaker notes validation
    let isInsideNotes = false;
    let notesOpenLine: number | undefined;
    rawLines.forEach((line, idx) => {
      const trimmed = line.trim();
      const absLine = absoluteLine(slideStartLine, idx);
      if (trimmed === '<!-- notes -->') {
        if (isInsideNotes) {
          issues.push({
            type: 'warning',
            slide: slideNo,
            line: absLine,
            ...VALIDATION_MESSAGES.NESTED_NOTES,
          });
        } else {
          notesOpenLine = absLine;
        }
        isInsideNotes = true;
      } else if (trimmed === '<!-- /notes -->') {
        if (!isInsideNotes) {
          issues.push({
            type: 'warning',
            slide: slideNo,
            line: absLine,
            fixable: true,
            ...VALIDATION_MESSAGES.STRAY_NOTES_CLOSE,
          });
        }
        isInsideNotes = false;
      }
    });
    if (isInsideNotes) {
      issues.push({
        type: 'warning',
        slide: slideNo,
        line: notesOpenLine ?? slideStartLine,
        fixable: true,
        ...VALIDATION_MESSAGES.UNCLOSED_NOTES,
      });
    }

    const hasColumnBoundary = rawLines.some((line) => {
      const trimmed = line.trim();
      return trimmed === '::split::' || trimmed === '::col::';
    });

    if (!hasColumnBoundary) {
      let layoutOverrideCount = 0;
      rawLines.forEach((line, idx) => {
        const trimmed = line.trim();
        const layoutMatch = trimmed.match(/^<!--\s*layout:\s*(.*?)\s*-->$/);
        if (layoutMatch) {
          layoutOverrideCount++;
          const absLine = absoluteLine(slideStartLine, idx);
          if (layoutOverrideCount > 1) {
            issues.push({
              type: 'warning',
              slide: slideNo,
              line: absLine,
              ...VALIDATION_MESSAGES.MULTIPLE_LAYOUTS,
            });
          } else {
            const layoutName = layoutMatch[1]!.trim();
            if (validLayouts.length > 0 && !validLayouts.includes(layoutName)) {
              issues.push({
                type: 'warning',
                slide: slideNo,
                line: absLine,
                ...VALIDATION_MESSAGES.INVALID_LAYOUT(layoutName, validLayouts),
              });
            }
          }
        }
      });
    }

    // Admonition marker validation: a `> [!KIND]` line whose KIND isn't one
    // of the recognized values (mirrors core's own detectAdmonition, which
    // silently ignores an unrecognized marker and renders it as plain quote
    // text - this warning is what tells the author their marker was a typo).
    rawLines.forEach((line, idx) => {
      const match = line.trim().match(/^>\s*\[!(\w+)\]/);
      if (match) {
        const kind = match[1]!.toLowerCase();
        if (validAdmonitionKinds.length > 0 && !validAdmonitionKinds.includes(kind)) {
          issues.push({
            type: 'warning',
            slide: slideNo,
            line: absoluteLine(slideStartLine, idx),
            ...VALIDATION_MESSAGES.INVALID_ADMONITION(kind, validAdmonitionKinds),
          });
        }
      }
    });

    // Chart-from-table directive validation: <!-- chart: KIND --> must have
    // a recognized KIND and must immediately precede a markdown table.
    rawLines.forEach((line, idx) => {
      const match = line.trim().match(/^<!--\s*chart:\s*(\w+)\s*-->$/i);
      if (!match) return;
      const chartType = match[1]!.toLowerCase();
      const absLine = absoluteLine(slideStartLine, idx);
      if (validChartTypes.length > 0 && !validChartTypes.includes(chartType)) {
        issues.push({
          type: 'warning',
          slide: slideNo,
          line: absLine,
          ...VALIDATION_MESSAGES.INVALID_CHART_TYPE(chartType, validChartTypes),
        });
        return;
      }
      const nextLine = rawLines.slice(idx + 1).find((l) => l.trim() !== '');
      if (!nextLine || !nextLine.trim().startsWith('|')) {
        issues.push({
          type: 'warning',
          slide: slideNo,
          line: absLine,
          ...VALIDATION_MESSAGES.MISPLACED_CHART_DIRECTIVE,
        });
      }
    });

    // Media-control annotation validation: imageFit/imagePosition/accentColor
    rawLines.forEach((line, idx) => {
      const trimmed = line.trim();
      const absLine = absoluteLine(slideStartLine, idx);

      const fitMatch = trimmed.match(/^<!--\s*imageFit:\s*(\w+)\s*-->$/i);
      if (fitMatch) {
        const fit = fitMatch[1]!.toLowerCase();
        if (validImageFits.length > 0 && !validImageFits.includes(fit)) {
          issues.push({
            type: 'warning',
            slide: slideNo,
            line: absLine,
            ...VALIDATION_MESSAGES.INVALID_IMAGE_FIT(fit, validImageFits),
          });
        }
        return;
      }

      const positionMatch = trimmed.match(/^<!--\s*imagePosition:\s*(\w+)\s*-->$/i);
      if (positionMatch) {
        const position = positionMatch[1]!.toLowerCase();
        if (validImagePositions.length > 0 && !validImagePositions.includes(position)) {
          issues.push({
            type: 'warning',
            slide: slideNo,
            line: absLine,
            ...VALIDATION_MESSAGES.INVALID_IMAGE_POSITION(position, validImagePositions),
          });
        }
        return;
      }

      const accentMatch = trimmed.match(/^<!--\s*accentColor:\s*(.+?)\s*-->$/i);
      if (accentMatch) {
        const value = accentMatch[1]!.trim();
        if (!ACCENT_COLOR_RE.test(value)) {
          issues.push({
            type: 'warning',
            slide: slideNo,
            line: absLine,
            ...VALIDATION_MESSAGES.INVALID_ACCENT_COLOR(value),
          });
        }
      }
    });

    // Split layout validation
    const splitIndices: number[] = [];
    rawLines.forEach((line, idx) => {
      if (line.trim() === '::split::') splitIndices.push(idx);
    });
    if (splitIndices.length > 1) {
      issues.push({
        type: 'warning',
        slide: slideNo,
        line: absoluteLine(slideStartLine, splitIndices[1]!),
        ...VALIDATION_MESSAGES.MULTIPLE_SPLITS,
      });
    } else if (splitIndices.length === 1) {
      const trimmedLines = rawLines.map((l) => l.trim());
      const beforeSplit = trimmedLines.slice(0, splitIndices[0]).filter((l) => l !== '');
      const afterSplit = trimmedLines.slice(splitIndices[0]! + 1).filter((l) => l !== '');
      if (beforeSplit.length === 0 || afterSplit.length === 0) {
        issues.push({
          type: 'warning',
          slide: slideNo,
          line: absoluteLine(slideStartLine, splitIndices[0]!),
          ...VALIDATION_MESSAGES.EMPTY_SPLIT_COLUMN,
        });
      }
      checkColumnLayoutComments(
        rawLines,
        [
          [0, splitIndices[0]!],
          [splitIndices[0]! + 1, rawLines.length],
        ],
        slideNo,
        slideStartLine,
        validColumnLayouts,
        issues
      );
    }

    // N-column split validation (::col::), independent of the ::split:: checks above
    const colIndices: number[] = [];
    let columnsAnnotation: { line: number; count: number; ratio?: string } | undefined;
    rawLines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed === '::col::') colIndices.push(idx);
      const columnsMatch = trimmed.match(/^<!--\s*columns:\s*(\d+)(?:\s+ratio:([\d:]+))?\s*-->$/i);
      if (columnsMatch) {
        columnsAnnotation = {
          line: idx,
          count: Number(columnsMatch[1]),
          ratio: columnsMatch[2],
        };
      }
    });

    if (colIndices.length > 0) {
      const trimmedLines = rawLines.map((l) => l.trim());
      const boundaries = [-1, ...colIndices, rawLines.length];
      for (let b = 0; b < boundaries.length - 1; b++) {
        const segment = trimmedLines
          .slice(boundaries[b]! + 1, boundaries[b + 1]!)
          .filter((l) => l !== '');
        if (segment.length === 0) {
          issues.push({
            type: 'warning',
            slide: slideNo,
            line: absoluteLine(slideStartLine, colIndices[Math.min(b, colIndices.length - 1)]!),
            ...VALIDATION_MESSAGES.EMPTY_SPLIT_COLUMN,
          });
          break;
        }
      }

      const actualColumns = colIndices.length + 1;
      if (columnsAnnotation) {
        if (columnsAnnotation.count !== actualColumns) {
          issues.push({
            type: 'warning',
            slide: slideNo,
            line: absoluteLine(slideStartLine, columnsAnnotation.line),
            ...VALIDATION_MESSAGES.COLUMN_COUNT_MISMATCH(columnsAnnotation.count, actualColumns),
          });
        }
        if (columnsAnnotation.ratio) {
          const ratioSegments = columnsAnnotation.ratio.split(':');
          if (ratioSegments.length !== actualColumns) {
            issues.push({
              type: 'warning',
              slide: slideNo,
              line: absoluteLine(slideStartLine, columnsAnnotation.line),
              ...VALIDATION_MESSAGES.COLUMN_RATIO_MISMATCH(columnsAnnotation.ratio, actualColumns),
            });
          }
        }
      }

      const columnSegments: [number, number][] = [];
      for (let b = 0; b < boundaries.length - 1; b++) {
        columnSegments.push([boundaries[b]! + 1, boundaries[b + 1]!]);
      }
      checkColumnLayoutComments(
        rawLines,
        columnSegments,
        slideNo,
        slideStartLine,
        validColumnLayouts,
        issues
      );
    }

    // Heading count check (one issue max per slide, on the 2nd H1 found)
    let h1Count = 0;
    rawLines.forEach((line, idx) => {
      if (/^#\s/.test(line.trim())) {
        h1Count++;
        if (h1Count === 2) {
          issues.push({
            type: 'warning',
            slide: slideNo,
            line: absoluteLine(slideStartLine, idx),
            ...VALIDATION_MESSAGES.MULTIPLE_H1,
          });
        }
      }
    });

    // Local image reference validation
    const imageRegex = /!\[.*?\]\(([^) ]+)(?:\s+".*?")?\)/g;
    let match;
    while ((match = imageRegex.exec(slide)) !== null) {
      const imgUrl = match[1]!;
      const isExternal = /^(https?:|data:|ftp:|\/\/)/i.test(imgUrl);
      if (!isExternal) {
        const baseDir = filePath ? path.dirname(path.resolve(filePath)) : process.cwd();
        const resolvedPath = path.resolve(baseDir, imgUrl);
        try {
          await fs.promises.access(resolvedPath);
        } catch {
          const lineOffset = (slide.slice(0, match.index).match(/\n/g) ?? []).length;
          issues.push({
            type: 'warning',
            slide: slideNo,
            line: absoluteLine(slideStartLine, lineOffset),
            ...VALIDATION_MESSAGES.BROKEN_IMAGE(imgUrl),
          });
        }
      }
    }
  }

  return issues;
}

export {
  resolveCoreValidationLists,
  estimateOverflow,
  checkColumnLayoutComments,
  ACCENT_COLOR_RE,
  validateSlides,
};
