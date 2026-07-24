import { StatEntry } from '../../interfaces/index.js';
import { sanitizeHtml } from '../../utils/index.js';

// Parses a ```stats fenced block's raw text into label/value pairs, one per
// non-blank line, split on the first ":". Lines without a ":" are dropped.
export function parseStatsLines(raw: string): StatEntry[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .flatMap((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return [];
      const label = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (!label || !value) return [];
      return [{ label, value }];
    });
}

// Renders a ```stats fenced block as a row of big-number metric cards. Falls
// back to a plain code block when no line parses into a valid "Label: value"
// pair, so a stray/empty stats block still shows its raw content instead of
// an empty grid.
export function renderStatsGrid(raw: string): string {
  const entries = parseStatsLines(raw);
  if (entries.length === 0) {
    return `<pre><code>${sanitizeHtml(raw)}</code></pre>`;
  }

  const cardsHtml = entries
    .map(
      (entry) =>
        `<div class="statCard"><div class="statValue">${sanitizeHtml(entry.value)}</div><div class="statLabel">${sanitizeHtml(entry.label)}</div></div>`
    )
    .join('');
  return `<div class="statsGrid">${cardsHtml}</div>`;
}
