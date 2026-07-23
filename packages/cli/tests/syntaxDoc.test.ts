/// <reference types="node" />
import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { VALID_THEMES, VALID_GLOBAL_FLAGS } from '../src/constants/logs/validationCommandLogs.ts';
import {
  VALID_SLIDE_TYPES,
  VALID_ANIMATIONS,
  VALID_FONT_SIZES,
} from '../../core/src/constants/index.ts';
import { ERROR_CODES } from '../src/middleware/errors.ts';

const doc = fs.readFileSync(path.join(__dirname, '../src/docs/SYNTAX.md'), 'utf8');
const docLines = doc.split('\n');

function findLine(marker: string): string {
  const line = docLines.find((l) => l.includes(marker));
  expect(line, `SYNTAX.md should contain a line with "${marker}"`).toBeDefined();
  return line!;
}

function backtickedValues(line: string): string[] {
  return [...line.matchAll(/`([a-z][a-z-]*)`/g)].map((m) => m[1]!);
}

describe('SYNTAX.md stays in sync with CLI/compiler constants', () => {
  test('documented layout overrides match the compiler slide types', () => {
    const row = findLine('<!-- layout: value -->');
    expect(new Set(backtickedValues(row))).toEqual(new Set(VALID_SLIDE_TYPES));
  });

  test('documented themes match the validator theme list', () => {
    const row = findLine('| `theme` ');
    const values = backtickedValues(row).filter((v) => v !== 'theme');
    expect(new Set(values)).toEqual(new Set(VALID_THEMES));
  });

  test('documented animations match the compiler animation list', () => {
    const row = findLine('<!-- animation: value -->');
    expect(new Set(backtickedValues(row))).toEqual(new Set(VALID_ANIMATIONS));
  });

  test('documented font sizes match the compiler font-size list', () => {
    const row = findLine('<!-- fontSize: value -->');
    expect(new Set(backtickedValues(row))).toEqual(new Set(VALID_FONT_SIZES));
  });

  test('documented global flags match the validator global flags list', () => {
    const startIndex = docLines.findIndex((l) =>
      l.includes('### Global flags (accepted by every command)')
    );
    expect(
      startIndex,
      'SYNTAX.md should contain "### Global flags (accepted by every command)"'
    ).toBeGreaterThan(-1);

    const flags: string[] = [];
    for (let i = startIndex + 1; i < docLines.length; i++) {
      const line = docLines[i]!;
      if (line.startsWith('### ')) break;
      const m = line.match(/\|\s*`(--[^`]+)`/);
      if (m && m[1]) {
        flags.push(m[1]);
      }
    }
    expect(new Set(flags)).toEqual(new Set(VALID_GLOBAL_FLAGS));
  });

  test('documented error codes match every code an MdSlideError can carry', () => {
    const startIndex = docLines.findIndex((l) => l.includes('### Error codes'));
    expect(startIndex, 'SYNTAX.md should contain "### Error codes"').toBeGreaterThan(-1);

    const codes: string[] = [];
    for (let i = startIndex + 1; i < docLines.length; i++) {
      const line = docLines[i]!;
      if (line.startsWith('### ')) break;
      const matches = line.match(/ERR_[A-Z_]+/g);
      if (matches) codes.push(...matches);
    }
    expect(new Set(codes)).toEqual(new Set(ERROR_CODES));
  });
});
