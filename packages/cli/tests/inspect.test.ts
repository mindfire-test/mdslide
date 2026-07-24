/// <reference types="node" />
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { inspectCommand } from '../src/commands/inspect.ts';
import process from 'process';

// Temporarily replaces process.stdin with a readable stream yielding `content`,
// returning a restore function so tests don't leak the fake stream.
function mockStdin(content: string): () => void {
  const original = process.stdin;
  const stream = Readable.from([Buffer.from(content, 'utf8')]);
  Object.defineProperty(process, 'stdin', { value: stream, configurable: true });
  return () => Object.defineProperty(process, 'stdin', { value: original, configurable: true });
}

describe('CLI Inspect Command', () => {
  const tmpDir = path.join(__dirname, 'tmp-inspect');
  const deckMd = path.join(tmpDir, 'deck.md');
  const missingMd = path.join(tmpDir, 'missing.md');

  let logSpy: any;

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(
      deckMd,
      [
        '<!-- layout: title -->',
        '',
        '# Deck Title',
        '',
        '---',
        '',
        '## Agenda',
        '',
        '- One',
        '- Two',
        '',
        '<!-- notes -->',
        'Talking points.',
        '<!-- /notes -->',
      ].join('\n')
    );
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('reports layout, source, element counts, and height for each slide', async () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await inspectCommand(deckMd, { json: true, logLevel: 'silent' });

    const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
    expect(payload.slides).toBe(2);

    const [first, second] = payload.deck;
    expect(first.layout).toBe('title');
    expect(first.layoutSource).toBe('override');
    expect(first.layoutReason).toContain('Explicit');

    expect(second.title).toBe('Agenda');
    expect(second.layout).toBe('bullets');
    expect(second.layoutSource).toBe('auto');
    expect(second.elementCounts.listItem).toBe(2);
    expect(second.hasNotes).toBe(true);
    expect(second.maxHeightPx).toBeGreaterThan(0);
    expect(typeof second.contentHeightPx).toBe('number');
  });

  test('prints a readable per-slide report without --json', async () => {
    await inspectCommand(deckMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Slide 1');
    expect(output).toContain('layout: title');
    expect(output).toContain('Slide 2');
    expect(output).toContain('has speaker notes');
  });

  test('flags an invalid override that fell back to auto-detection', async () => {
    const invalidOverrideMd = path.join(tmpDir, 'invalid-override.md');
    fs.writeFileSync(invalidOverrideMd, '## Agenda\n\n<!-- layout: nonexistent -->\n\n- One\n');
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await inspectCommand(invalidOverrideMd, { json: true, logLevel: 'silent' });
    const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
    expect(payload.deck[0].layoutSource).toBe('auto');
    expect(payload.deck[0].layoutReason).toContain('Invalid override');
  });

  test('reports a sensible reason for an N-column ::col:: split', async () => {
    const columnsMd = path.join(tmpDir, 'columns.md');
    fs.writeFileSync(
      columnsMd,
      '# Frontend vs Backend vs Infra\n\nFrontend\n\n::col::\n\nBackend\n\n::col::\n\nInfra\n'
    );
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await inspectCommand(columnsMd, { json: true, logLevel: 'silent' });
    const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
    expect(payload.deck[0].layout).toBe('split');
    expect(payload.deck[0].layoutSource).toBe('auto');
    expect(payload.deck[0].layoutReason).toContain('::col::');
  });

  test("reports each column's resolved layout, including a per-column override", async () => {
    const columnLayoutMd = path.join(tmpDir, 'column-layout.md');
    fs.writeFileSync(
      columnLayoutMd,
      [
        '# Build vs Test vs Deploy',
        '',
        '<!-- layout: code -->',
        '',
        '```bash',
        'npm run build',
        '```',
        '',
        '::col::',
        '',
        '- Smoke tests',
        '',
        '::col::',
        '',
        'Deploy stuff',
        '',
      ].join('\n')
    );
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await inspectCommand(columnLayoutMd, { json: true, logLevel: 'silent' });
    const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
    expect(payload.deck[0].layout).toBe('split');
    expect(payload.deck[0].columns).toEqual([
      { layout: 'code' },
      { layout: 'bullets' },
      { layout: 'content' },
    ]);
  });

  test('prints per-column layouts in the human-readable report', async () => {
    const columnLayoutMd = path.join(tmpDir, 'column-layout-human.md');
    fs.writeFileSync(columnLayoutMd, '# Split\n\nCol 1\n\n::col::\n\nCol 2\n');

    await inspectCommand(columnLayoutMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('columns: content, content');
  });

  test('reports admonitions and charts found on a slide', async () => {
    const componentsMd = path.join(tmpDir, 'components.md');
    fs.writeFileSync(
      componentsMd,
      [
        '# Highlights',
        '',
        '> [!TIP]',
        '> Helpful advice.',
        '',
        '<!-- chart: bar -->',
        '',
        '| Month | Revenue |',
        '| ----- | ------- |',
        '| Jan   | 100     |',
        '',
      ].join('\n')
    );
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await inspectCommand(componentsMd, { json: true, logLevel: 'silent' });
    const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
    console.log(JSON.stringify(payload.deck[0], null, 2));
    expect(payload.deck[0].admonitions).toEqual(['tip']);
    expect(payload.deck[0].charts).toEqual(['bar']);
  });

  test('prints admonitions/charts in the human-readable report, omitting the fields when absent', async () => {
    const componentsMd = path.join(tmpDir, 'components-human.md');
    fs.writeFileSync(componentsMd, '# Highlights\n\n> [!WARNING]\n> Be careful.\n');
    const plainMd = path.join(tmpDir, 'plain-human.md');
    fs.writeFileSync(plainMd, '# Plain\n\nJust text.\n');

    await inspectCommand(componentsMd, { logLevel: 'info' });
    let output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('admonitions: warning');

    logSpy.mockClear();
    await inspectCommand(plainMd, { logLevel: 'info' });
    output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).not.toContain('admonitions:');
    expect(output).not.toContain('charts:');
  });

  test('reports imageFit/imagePosition/accentColor/hasVideo on a slide', async () => {
    const mediaMd = path.join(tmpDir, 'media-control.md');
    fs.writeFileSync(
      mediaMd,
      [
        '# Product Demo',
        '',
        '<!-- imageFit: cover -->',
        '<!-- imagePosition: left -->',
        '<!-- accentColor: #f43f5e -->',
        '',
        'Some meaningful text explaining the product alongside its demo.',
        '',
        '![demo](demo.mp4)',
        '',
      ].join('\n')
    );
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await inspectCommand(mediaMd, { json: true, logLevel: 'silent' });
    const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
    expect(payload.deck[0].imageFit).toBe('cover');
    expect(payload.deck[0].imagePosition).toBe('left');
    expect(payload.deck[0].accentColor).toBe('#f43f5e');
    expect(payload.deck[0].hasVideo).toBe(true);
  });

  test('prints imageFit/imagePosition/accentColor/video in the human-readable report, omitting when absent', async () => {
    const mediaMd = path.join(tmpDir, 'media-control-human.md');
    fs.writeFileSync(
      mediaMd,
      '# Product Demo\n\n<!-- accentColor: #f43f5e -->\n\n![demo](demo.mp4)\n'
    );
    const plainMd = path.join(tmpDir, 'plain-media.md');
    fs.writeFileSync(plainMd, '# Plain\n\n![pic](demo.png)\n');

    await inspectCommand(mediaMd, { logLevel: 'info' });
    let output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('accentColor: #f43f5e');
    expect(output).toContain('contains a video');

    logSpy.mockClear();
    await inspectCommand(plainMd, { logLevel: 'info' });
    output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).not.toContain('imageFit:');
    expect(output).not.toContain('imagePosition:');
    expect(output).not.toContain('accentColor:');
    expect(output).not.toContain('contains a video');
  });

  test('fails and throws if input file does not exist', async () => {
    await expect(inspectCommand(missingMd, { logLevel: 'silent' })).rejects.toThrow(
      'Input file not found'
    );
  });

  test('reads Markdown piped in on stdin', async () => {
    const restore = mockStdin('# From Stdin\n\nContent here.\n');
    try {
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      await inspectCommand('-', { json: true, logLevel: 'silent' });
      const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
      expect(payload.file).toBe('<stdin>');
      expect(payload.slides).toBe(1);
    } finally {
      restore();
    }
  });
});
