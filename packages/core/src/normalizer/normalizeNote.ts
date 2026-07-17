import type { RootContent } from 'mdast';
import { extractTextFromNode } from '../ast/extractTextFromNode.js';
import type { ParseNotesResult } from '../interfaces/index.js';
import { emitWarning } from '../utils/warnings.js';

const OPEN_NOTES_RE = /^<!--\s*notes\s*-->$/i;
const CLOSE_NOTES_RE = /^<!--\s*\/notes\s*-->$/i;

export function extractSlideNotes(nodes: RootContent[]): ParseNotesResult {
  let notes: string | undefined = '';

  const remainingNodes: RootContent[] = [];
  let isNote = false;
  let pendingNoteNodes: RootContent[] = [];

  for (const node of nodes) {
    if (node.type == 'html') {
      const val = node.value.trim();
      if (OPEN_NOTES_RE.test(val)) {
        isNote = true;
        pendingNoteNodes = [];
        continue;
      }
      if (CLOSE_NOTES_RE.test(val)) {
        isNote = false;
        for (const noteNode of pendingNoteNodes) {
          const text = extractTextFromNode(noteNode);
          if (text) {
            notes = notes ? `${notes}\n${text}` : text;
          }
        }
        pendingNoteNodes = [];
        continue;
      }
    }

    if (isNote) {
      pendingNoteNodes.push(node);
    } else {
      remainingNodes.push(node);
    }
  }

  if (isNote) {
    emitWarning(
      '[mdslide compiler] Warning: Unclosed "<!-- notes -->" block (missing "<!-- /notes -->"). ' +
        'Treating the remaining content as regular slide content instead of speaker notes.'
    );
    remainingNodes.push(...pendingNoteNodes);
  }

  return {
    notes: notes || undefined,
    remainingNodes,
  };
}
