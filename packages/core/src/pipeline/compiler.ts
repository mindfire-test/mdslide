import { type SlideDeck, parseFrontmatter } from '@mindfiredigital/mdslide-shared';
import { parseMarkdown } from '../parser/index.js';
import { normalizeSlides } from '../normalizer/mdAstToSlideBasedAst.js';
import { runTransforms } from '../transformers/index.js';
import { processOverflow } from '../overflow/index.js';
import { renderDeck } from '../renderer/html/index.js';
import { CompileOptions, CompileResult } from '../interfaces/index.js';
import { emitWarning, setWarningHandler } from '../utils/warnings.js';

// Wraps all pipeline stages to catch unexpected errors and add context.
// Identifies which stage crashed (e.g., parsing, rendering) before showing the stack trace.
// Preserves the original error using the `cause` property for debugging.

function runStage<T>(stage: string, fn: () => T): T {
  try {
    return fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[mdslide] Compile failed at stage "${stage}": ${message}`, {
      cause: err,
    });
  }
}

// Safe Formatter Parser
function safeParseFrontmatter(markdown: string): ReturnType<typeof parseFrontmatter> {
  try {
    return parseFrontmatter(markdown);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitWarning(
      `[mdslide] Warning: Failed to parse frontmatter   falling back to defaults.\n` +
        `  Reason: ${message}\n` +
        `  Tip: Check your YAML block between the --- markers at the top of the file.`
    );
    const stripped = markdown.replace(/^---[\r\n][\s\S]*?[\r\n]---[\r\n]?/, '');
    return { meta: {}, content: stripped };
  }
}

// Compiler
export class Compiler {
  compile(markdown: string, options: CompileOptions = {}): CompileResult {
    // Collect non-fatal diagnostics instead of printing them, so callers
    // control how (and whether) warnings are shown.
    const warnings: string[] = [];
    setWarningHandler((message) => warnings.push(message));

    try {
      // Parse frontmatter with error boundary   never crashes on bad YAML
      const { meta, content } = safeParseFrontmatter(markdown);

      // Parse Markdown string to MDAST and group by slide dividers
      const { slides: rawBlocks } = runStage('parse', () => parseMarkdown(content));

      // Transform generic MDAST slide blocks to presentation Slide AST
      const normalizedSlides = runStage('normalize', () => normalizeSlides(rawBlocks, meta));

      // Run AST transforms
      const transformedSlides = runStage('transform', () => runTransforms(normalizedSlides));

      // Process Visual Overflow & Auto-Splitting
      const slides = runStage('overflow', () => processOverflow(transformedSlides));

      // Render Slide AST model into completed HTML
      const deck: SlideDeck = { meta, slides };
      const html = runStage('render', () => renderDeck(deck, options));

      return { meta, slides, html, warnings };
    } finally {
      setWarningHandler(null);
    }
  }
}
