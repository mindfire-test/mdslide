import { RootContent } from 'mdast';

export interface NormalizedHeading {
  depth: number;
  text: string;
}

export interface ParseNotesResult {
  notes: string | undefined;
  remainingNodes: RootContent[];
}

export interface AdmonitionNode {
  type: string;
  value?: string;
  children?: AdmonitionNode[];
}
