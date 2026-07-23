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
import { validateSlides, fixSlideText } from '../validators/index.js';
import { absoluteLine, splitSlideChunks } from '../utils/index.js';

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
