import { AdmonitionKind, MARKER_RE, VALID_ADMONITION_KINDS } from '../constants/index.js';
import { AdmonitionNode } from '../interfaces/index.js';

export function detectAdmonition<T extends AdmonitionNode>(
  node: T
): { kind: AdmonitionKind | undefined; children: T[] } {
  const children = (node.children ?? []) as T[];
  const first = children[0];
  if (!first || first.type !== 'paragraph' || !first.children || first.children.length === 0) {
    return { kind: undefined, children };
  }

  const firstChild = first.children[0] as AdmonitionNode | undefined;
  if (!firstChild || firstChild.type !== 'text' || typeof firstChild.value !== 'string') {
    return { kind: undefined, children };
  }

  const match = firstChild.value.match(MARKER_RE);
  if (!match) {
    return { kind: undefined, children };
  }

  const rawKind = match[1]!.toLowerCase();
  if (!VALID_ADMONITION_KINDS.has(rawKind)) {
    return { kind: undefined, children };
  }
  const kind = rawKind as AdmonitionKind;

  const rest = firstChild.value.slice(match[0].length);
  const hasMoreSiblings = first.children.length > 1;

  if (!rest && !hasMoreSiblings) {
    // Marker was the entire first paragraph - drop it.
    return { kind, children: children.slice(1) };
  }

  const newFirstChild = { ...firstChild, value: rest };
  const newFirstParagraph = {
    ...first,
    children: [newFirstChild, ...first.children.slice(1)],
  };
  return { kind, children: [newFirstParagraph as T, ...children.slice(1)] };
}
