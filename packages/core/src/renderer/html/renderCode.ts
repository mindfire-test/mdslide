import type { SlideNode } from '@mindfiredigital/mdslide-shared';
import { sanitizeHtml } from '../../utils/index.js';
import { renderStatsGrid } from './renderStatsGrid.js';

export function renderCodeBlock(node: SlideNode): string {
  const lang = (node.lang ?? '').toLowerCase();
  const value = node.value ?? '';

  if (lang === 'mermaid') {
    return `<div class="mermaid">${sanitizeHtml(value)}</div>`;
  }

  if (lang === 'stats') {
    return renderStatsGrid(value);
  }

  // Any fenced-code language gets a language-X class, even ones outside a
  // fixed allow-list   Prism's autoloader plugin fetches the matching
  // grammar on demand, so there's no need to gate highlighting on a
  // hardcoded list of "supported" languages.
  if (lang) {
    return `<pre class="line-numbers language-${sanitizeHtml(lang)}"><code class="language-${sanitizeHtml(lang)}">${sanitizeHtml(value)}</code></pre>`;
  }

  return `<pre><code>${sanitizeHtml(value)}</code></pre>`;
}

export function renderInlineCode(node: SlideNode): string {
  const value = node.value ?? '';
  return `<code>${sanitizeHtml(value)}</code>`;
}
