import type { RootContent } from 'mdast';

export function isThematicBreak(node: RootContent): boolean {
  return node.type === 'thematicBreak';
}

// Explicit slide-break marker: always starts a new slide, independent of the
// heading-based heuristics in markdownParser.ts.
export function isSlideMarker(node: RootContent): boolean {
  return node.type === 'html' && /^<!--\s*slide\s*-->$/i.test((node as any).value.trim());
}

export function isHeading(node: RootContent): boolean {
  return node.type === 'heading';
}

export function isHTML(node: RootContent): boolean {
  return node.type === 'html';
}

export function isList(node: RootContent): boolean {
  return node.type === 'list';
}

export function isBlockquote(node: RootContent): boolean {
  return node.type === 'blockquote';
}

export function isCode(node: RootContent): boolean {
  return node.type === 'code';
}

export function isTable(node: RootContent): boolean {
  return node.type === 'table';
}

export function isImage(node: RootContent): boolean {
  return node.type === 'image';
}
