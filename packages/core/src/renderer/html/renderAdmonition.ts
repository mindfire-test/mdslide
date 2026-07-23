import type { SlideNode } from '@mindfiredigital/mdslide-shared';
import { sanitizeHtml } from '../../utils/index.js';
import { ADMONITION_META } from '../../constants/index.js';

export function renderAdmonition(
  node: SlideNode,
  renderChildren: (node: SlideNode) => string
): string {
  const kind = node.admonition ?? 'note';
  const meta = ADMONITION_META[kind] ?? ADMONITION_META.note!;
  return `<blockquote class="admonition" data-admonition="${sanitizeHtml(kind)}">
  <div class="admonitionTitle"><span class="admonitionIcon" aria-hidden="true">${meta.icon}</span>${sanitizeHtml(meta.label)}</div>
  ${renderChildren(node)}
</blockquote>`;
}
