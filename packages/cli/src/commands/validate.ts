import fs from 'fs';
import path from 'path';
import { Logger } from '../logger/index.js';
import {
  InputNotFoundError,
  ValidationError,
  StdinUnsupportedError,
} from '../middleware/errors.js';
import type { ValidateOptions, ValidationIssue } from '../types/index.js';
import { COLORS, STYLES, VALIDATION_MESSAGES, VALID_THEMES } from '../constants/index.js';
import { ICONS, isStdio, readInputSource } from '../utils/index.js';
import { parseFrontmatter } from '@mindfiredigital/mdslide-shared';

function absoluteLine(slideStartLine: number, localIndex: number): number {
  return slideStartLine + localIndex;
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

function splitSlideChunks(text: string): { chunks: string[]; separators: string[] } {
  const parts = text.split(/\n(---|<!--\s*slide\s*-->)\n/i);
  const chunks: string[] = [];
  const separators: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      chunks.push(parts[i]!);
    } else {
      separators.push(parts[i]!);
    }
  }
  return { chunks, separators };
}

async function estimateOverflow(
  slideMarkdown: string,
  meta: Record<string, unknown>
): Promise<{ heightPx: number; maxHeightPx: number; excessItems: number } | null> {
  try {
    const core = await import('@mindfiredigital/mdslide-core');
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
    const core = await import('@mindfiredigital/mdslide-core');
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

function fixSlideText(slideText: string): { text: string; fixed: string[] } {
  const fixed: string[] = [];

  const lines = slideText.split('\n');
  const keptLines: string[] = [];
  let isInsideNotes = false;
  let strayRemoved = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '<!-- notes -->') {
      isInsideNotes = true;
      keptLines.push(line);
    } else if (trimmed === '<!-- /notes -->') {
      if (!isInsideNotes) {
        strayRemoved = true;
        continue;
      }
      isInsideNotes = false;
      keptLines.push(line);
    } else {
      keptLines.push(line);
    }
  }
  if (strayRemoved) fixed.push('Removed stray closing notes tag (<!-- /notes -->).');

  let text = keptLines.join('\n');

  if (isInsideNotes) {
    text = `${text}\n<!-- /notes -->`;
    fixed.push('Closed an unclosed notes block.');
  }

  const fenceCount = (text.match(/^```/gm) ?? []).length;
  if (fenceCount % 2 !== 0) {
    text = `${text}\n\`\`\``;
    fixed.push('Closed an unclosed code fence.');
  }

  return { text, fixed };
}

// Validate orchastrator
export async function validateCommand(inputFile: string, opts: ValidateOptions): Promise<void> {
  const log = new Logger(opts.logLevel ?? 'info');
  const isStdin = isStdio(inputFile);
  const absInput = isStdin ? '<stdin>' : path.resolve(inputFile);

  const reportInputError = (err: Error & { hint?: string }): void => {
    if (opts.json) {
      process.stdout.write(
        `${JSON.stringify(
          {
            file: absInput,
            valid: false,
            slides: 0,
            errors: 1,
            warnings: 0,
            issues: [{ type: 'error', message: err.message, hint: err.hint }],
          },
          null,
          2
        )}\n`
      );
    } else {
      log.error(err);
    }
  };

  if (isStdin && opts.fix) {
    const err = new StdinUnsupportedError(
      '--fix requires a real input file: stdin input has nowhere to write the fix back to.',
      'Save the deck to a file and pass its path, or drop --fix and pipe stdout instead.'
    );
    reportInputError(err);
    throw err;
  }

  let original: string;
  try {
    original = await readInputSource(inputFile);
  } catch (err) {
    reportInputError(err as InputNotFoundError);
    throw err;
  }

  let workingMarkdown = original;
  const fixedDescriptions: string[] = [];

  if (opts.fix) {
    const fmMatch = original.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
    const frontmatterBlock = fmMatch ? fmMatch[0] : '';
    const body = fmMatch ? original.slice(frontmatterBlock.length) : original;
    const { chunks: bodyChunks, separators } = splitSlideChunks(body);
    const fixedSlides = bodyChunks.map((chunk) => {
      const { text, fixed } = fixSlideText(chunk);
      fixedDescriptions.push(...fixed);
      return text;
    });

    workingMarkdown =
      frontmatterBlock +
      fixedSlides.reduce(
        (acc, chunk, i) => (i === 0 ? chunk : `${acc}\n${separators[i - 1]}\n${chunk}`),
        ''
      );
    if (fixedDescriptions.length > 0) {
      await fs.promises.writeFile(absInput, workingMarkdown, 'utf8');
    }
  }

  const issues = await validateSlides(workingMarkdown, absInput);

  const errors = issues.filter((i) => i.type === 'error');
  const warnings = issues.filter((i) => i.type === 'warning');

  let strippedContent = workingMarkdown;
  try {
    const { content } = parseFrontmatter(workingMarkdown);
    strippedContent = content;
  } catch {
    strippedContent = workingMarkdown.replace(/^---[\r\n][\s\S]*?[\r\n]---[\r\n]?/, '');
  }
  const slideCount = splitSlideChunks(strippedContent).chunks.length;

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          file: absInput,
          valid: errors.length === 0,
          slides: slideCount,
          errors: errors.length,
          warnings: warnings.length,
          issues,
          ...(opts.fix ? { fixed: fixedDescriptions } : {}),
        },
        null,
        2
      )}\n`
    );
    if (errors.length > 0 || (opts.strict && warnings.length > 0)) {
      throw new ValidationError();
    }
    return;
  }

  log.raw('');

  if (opts.fix) {
    if (fixedDescriptions.length > 0) {
      log.success(
        `Applied ${fixedDescriptions.length} automatic fix${fixedDescriptions.length !== 1 ? 'es' : ''}:`
      );
      for (const f of fixedDescriptions)
        log.raw(`     ${ICONS.step} ${COLORS.cyan}${f}${STYLES.reset}`);
      log.raw('');
    } else {
      log.step('No auto-fixable issues found.');
      log.raw('');
    }
  }

  if (issues.length === 0) {
    log.success(VALIDATION_MESSAGES.LOG_SUCCESS(path.basename(absInput), slideCount));
    log.raw('');
    return;
  }

  for (const issue of issues) {
    const parts = [
      issue.slide != null ? `slide ${issue.slide}` : null,
      issue.line != null ? `line ${issue.line}` : null,
    ].filter(Boolean);
    const loc = parts.length ? `  (${parts.join(', ')})` : '';
    if (issue.type === 'error') {
      log.raw(
        `  ${ICONS.error}  ${STYLES.bold}${issue.message}${STYLES.reset}${COLORS.grey}${loc}${STYLES.reset}`
      );
    } else {
      log.raw(`  ${ICONS.warn}  ${issue.message}${COLORS.grey}${loc}${STYLES.reset}`);
    }
    if (issue.hint) {
      log.raw(`     ${ICONS.step} ${COLORS.cyan}${issue.hint}${STYLES.reset}`);
    }
  }

  log.raw('');
  log.raw(
    `  ${COLORS.grey}${slideCount} slides - ${errors.length} error${errors.length !== 1 ? 's' : ''}, ${warnings.length} warning${warnings.length !== 1 ? 's' : ''}${STYLES.reset}`
  );
  log.raw('');

  if (errors.length > 0 || (opts.strict && warnings.length > 0)) {
    throw new ValidationError();
  }
}
