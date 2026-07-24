/// <reference types="node" />
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { validateCommand } from '../src/commands/validate.ts';
import process from 'process';

// Temporarily replaces process.stdin with a readable stream yielding `content`,
// returning a restore function so tests don't leak the fake stream.
function mockStdin(content: string): () => void {
  const original = process.stdin;
  const stream = Readable.from([Buffer.from(content, 'utf8')]);
  Object.defineProperty(process, 'stdin', { value: stream, configurable: true });
  return () => Object.defineProperty(process, 'stdin', { value: original, configurable: true });
}

describe('CLI Validate Command', () => {
  const tmpDir = path.join(__dirname, 'tmp-validate');
  const validMd = path.join(tmpDir, 'valid.md');
  const invalidMd = path.join(tmpDir, 'invalid.md');
  const warningMd = path.join(tmpDir, 'warning.md');

  const frontmatterErrorMd = path.join(tmpDir, 'frontmatter-error.md');
  const frontmatterWarningMd = path.join(tmpDir, 'frontmatter-warning.md');
  const frontmatterNonStringThemeMd = path.join(tmpDir, 'frontmatter-non-string-theme.md');
  const emptySlideMd = path.join(tmpDir, 'empty-slide.md');
  const overflowSlideMd = path.join(tmpDir, 'overflow-slide.md');
  const overflowSplitCommentMd = path.join(tmpDir, 'overflow-split-comment.md');
  const overflowSplitMetaMd = path.join(tmpDir, 'overflow-split-meta.md');
  const layoutWarningMd = path.join(tmpDir, 'layout-warning.md');
  const multipleLayoutsWarningMd = path.join(tmpDir, 'multiple-layouts.md');
  const unclosedNotesWarningMd = path.join(tmpDir, 'unclosed-notes.md');
  const nestedNotesWarningMd = path.join(tmpDir, 'nested-notes.md');
  const strayNotesCloseWarningMd = path.join(tmpDir, 'stray-notes-close.md');
  const unsupportedLangWarningMd = path.join(tmpDir, 'unsupported-lang.md');
  const multipleSplitsWarningMd = path.join(tmpDir, 'multiple-splits.md');
  const emptySplitColumnWarningMd = path.join(tmpDir, 'empty-split-column.md');
  const multipleH1WarningMd = path.join(tmpDir, 'multiple-h1.md');
  const brokenImageWarningMd = path.join(tmpDir, 'broken-image.md');
  const workingImageMd = path.join(tmpDir, 'working-image.md');
  const sampleImg = path.join(tmpDir, 'present-img.png');
  const slideMarkerOnlyMd = path.join(tmpDir, 'slide-marker-only.md');
  const columnCountMismatchMd = path.join(tmpDir, 'column-count-mismatch.md');
  const columnRatioMismatchMd = path.join(tmpDir, 'column-ratio-mismatch.md');
  const columnLayoutInvalidMd = path.join(tmpDir, 'column-layout-invalid.md');
  const columnLayoutMultipleMd = path.join(tmpDir, 'column-layout-multiple.md');
  const columnLayoutCleanMd = path.join(tmpDir, 'column-layout-clean.md');
  const admonitionInvalidMd = path.join(tmpDir, 'admonition-invalid.md');
  const admonitionCleanMd = path.join(tmpDir, 'admonition-clean.md');
  const chartInvalidTypeMd = path.join(tmpDir, 'chart-invalid-type.md');
  const chartMisplacedMd = path.join(tmpDir, 'chart-misplaced.md');
  const chartCleanMd = path.join(tmpDir, 'chart-clean.md');
  const imageFitInvalidMd = path.join(tmpDir, 'image-fit-invalid.md');
  const imagePositionInvalidMd = path.join(tmpDir, 'image-position-invalid.md');
  const accentColorInvalidMd = path.join(tmpDir, 'accent-color-invalid.md');
  const mediaControlCleanMd = path.join(tmpDir, 'media-control-clean.md');

  let exitSpy: any;
  let logSpy: any;

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    fs.writeFileSync(validMd, '# Page One\nContent 1\n---\n# Page Two\nContent 2\n');
    fs.writeFileSync(invalidMd, '# Unclosed Fence\n```javascript\nconst a = 1;\n');
    fs.writeFileSync(warningMd, 'No Heading Here\n');
    fs.writeFileSync(frontmatterErrorMd, '---\ntheme: [unclosed-array\n---\n# Page One\n');
    fs.writeFileSync(frontmatterWarningMd, '---\ntheme: nonexistent-theme\n---\n# Page One\n');
    fs.writeFileSync(frontmatterNonStringThemeMd, '---\ntheme: 123\n---\n# Page One\n');
    fs.writeFileSync(emptySlideMd, '# Page One\n---\n\n---\n# Page Three\n');
    // Genuinely tall content (many list items) so the height-based overflow
    // estimate - not just a line count - actually exceeds the slide budget.
    const tallListBody = Array(20)
      .fill(0)
      .map((_, i) => `- Bullet item number ${i} with a bit of extra descriptive text`)
      .join('\n');
    fs.writeFileSync(overflowSlideMd, '# Page One\n' + tallListBody);
    fs.writeFileSync(
      overflowSplitCommentMd,
      '# Page One\n<!-- overflow: split -->\n' + tallListBody
    );
    fs.writeFileSync(overflowSplitMetaMd, '---\noverflow: split\n---\n# Page One\n' + tallListBody);
    fs.writeFileSync(layoutWarningMd, '# Page One\n<!-- layout: nonexistent-layout -->\n');
    fs.writeFileSync(
      multipleLayoutsWarningMd,
      '# Page One\n<!-- layout: code -->\n<!-- layout: bullets -->\n'
    );
    fs.writeFileSync(unclosedNotesWarningMd, '# Page One\n<!-- notes -->\nSome notes content\n');
    fs.writeFileSync(
      nestedNotesWarningMd,
      '# Page One\n<!-- notes -->\n<!-- notes -->\n<!-- /notes -->\n'
    );
    fs.writeFileSync(strayNotesCloseWarningMd, '# Page One\n<!-- /notes -->\n');
    fs.writeFileSync(
      unsupportedLangWarningMd,
      '# Page One\n```nonexistentlang\nconst x = 1;\n```\n'
    );
    fs.writeFileSync(
      multipleSplitsWarningMd,
      '# Page One\nCol 1\n::split::\nCol 2\n::split::\nCol 3\n'
    );
    fs.writeFileSync(emptySplitColumnWarningMd, '# Page One\n::split::\n');
    fs.writeFileSync(multipleH1WarningMd, '# Title One\n# Title Two\n');
    fs.writeFileSync(brokenImageWarningMd, '# Page One\n![Broken](./missing-img.png)\n');

    // Existing image test
    fs.writeFileSync(sampleImg, 'dummy image data');
    fs.writeFileSync(workingImageMd, `# Page One\n![Working](./present-img.png)\n`);

    fs.writeFileSync(
      slideMarkerOnlyMd,
      '# Page One\nContent 1\n\n<!-- slide -->\n\n# Page Two\nContent 2\n'
    );
    fs.writeFileSync(
      columnCountMismatchMd,
      '# Page One\n<!-- columns: 3 -->\nCol 1\n::col::\nCol 2\n'
    );
    fs.writeFileSync(
      columnRatioMismatchMd,
      '# Page One\n<!-- columns: 2 ratio:1:1:1 -->\nCol 1\n::col::\nCol 2\n'
    );
    fs.writeFileSync(
      columnLayoutInvalidMd,
      '# Page One\n<!-- layout: title -->\nCol 1\n::col::\nCol 2\n'
    );
    fs.writeFileSync(
      columnLayoutMultipleMd,
      '# Page One\n<!-- layout: code -->\n<!-- layout: bullets -->\nCol 1\n::col::\nCol 2\n'
    );
    fs.writeFileSync(
      columnLayoutCleanMd,
      '# Page One\n<!-- layout: code -->\nCol 1\n::col::\n<!-- layout: bullets -->\nCol 2\n'
    );
    fs.writeFileSync(admonitionInvalidMd, '# Page One\n> [!FOOBAR]\n> Some text\n');
    fs.writeFileSync(admonitionCleanMd, '# Page One\n> [!TIP]\n> Helpful advice.\n');
    fs.writeFileSync(
      chartInvalidTypeMd,
      '# Page One\n<!-- chart: donut -->\n\n| Month | Revenue |\n| ----- | ------- |\n| Jan   | 100     |\n'
    );
    fs.writeFileSync(chartMisplacedMd, '# Page One\n<!-- chart: bar -->\n\nNot a table.\n');
    fs.writeFileSync(
      chartCleanMd,
      '# Page One\n<!-- chart: bar -->\n\n| Month | Revenue |\n| ----- | ------- |\n| Jan   | 100     |\n'
    );
    fs.writeFileSync(imageFitInvalidMd, '# Page One\n<!-- imageFit: stretch -->\n');
    fs.writeFileSync(imagePositionInvalidMd, '# Page One\n<!-- imagePosition: center -->\n');
    fs.writeFileSync(accentColorInvalidMd, '# Page One\n<!-- accentColor: not a color!! -->\n');
    fs.writeFileSync(
      mediaControlCleanMd,
      '# Page One\n<!-- imageFit: cover -->\n<!-- imagePosition: left -->\n<!-- accentColor: #f43f5e -->\n'
    );

    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((code?: string | number | null | undefined) => {
        throw new Error(`process.exit called with code: ${code}`);
      });
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    logSpy.mockRestore();
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('validates clean slides successfully without errors or exit', async () => {
    await validateCommand(validMd, { logLevel: 'silent' });
  });

  test('fails validation and exits on syntax errors', async () => {
    await expect(validateCommand(invalidMd, { logLevel: 'silent' })).rejects.toThrow(
      'Validation failed'
    );
  });

  test('does not exit on warnings by default', async () => {
    await validateCommand(warningMd, { logLevel: 'silent' });
  });

  test('fails validation and exits on warnings when strict is true', async () => {
    await expect(validateCommand(warningMd, { strict: true, logLevel: 'silent' })).rejects.toThrow(
      'Validation failed'
    );
  });

  test('fails and exits if input file does not exist', async () => {
    await expect(validateCommand('nonexistent.md', { logLevel: 'silent' })).rejects.toThrow(
      'Input file not found'
    );
  });

  // New validation tests
  test('fails on invalid YAML frontmatter syntax', async () => {
    await expect(validateCommand(frontmatterErrorMd, { logLevel: 'silent' })).rejects.toThrow(
      'Validation failed'
    );
  });

  test('warns on unrecognized theme name', async () => {
    await validateCommand(frontmatterWarningMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Theme "nonexistent-theme" is not a built-in theme');
  });

  test('warns on unrecognized layout override name', async () => {
    await validateCommand(layoutWarningMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Invalid layout override "nonexistent-layout"');
  });

  test('warns on multiple layout overrides in a slide', async () => {
    await validateCommand(multipleLayoutsWarningMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Multiple layout overrides found on a single slide');
  });

  test('warns on unclosed speaker notes block', async () => {
    await validateCommand(unclosedNotesWarningMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Unclosed notes block (missing <!-- /notes -->)');
  });

  test('warns on nested speaker notes blocks', async () => {
    await validateCommand(nestedNotesWarningMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Nested notes block detected');
  });

  test('warns on stray closing notes tag', async () => {
    await validateCommand(strayNotesCloseWarningMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Stray closing notes tag (<!-- /notes -->)');
  });

  test('warns on unsupported syntax highlighting language in code block', async () => {
    await validateCommand(unsupportedLangWarningMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Language "nonexistentlang" in code fence is not supported');
  });

  test('warns on multiple split markers in a single slide', async () => {
    await validateCommand(multipleSplitsWarningMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Multiple ::split:: markers found in a single slide');
  });

  test('warns on empty column in split layout', async () => {
    await validateCommand(emptySplitColumnWarningMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Empty column in split layout');
  });

  test('<!-- slide -->-only deck reports the correct slide count and line numbers', async () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await validateCommand(slideMarkerOnlyMd, { json: true, logLevel: 'silent' });
    const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
    expect(payload.slides).toBe(2);
  });

  test('warns when <!-- columns: N --> does not match the actual ::col:: count', async () => {
    await validateCommand(columnCountMismatchMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain("doesn't match the 2 ::col::-delimited column(s) found");
  });

  test('warns when the ratio segment count does not match the actual columns', async () => {
    await validateCommand(columnRatioMismatchMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('ratio:1:1:1 has a different number of segments');
  });

  test('warns on an invalid per-column layout override', async () => {
    await validateCommand(columnLayoutInvalidMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Invalid layout override "title"');
  });

  test('warns on multiple layout overrides within a single column', async () => {
    await validateCommand(columnLayoutMultipleMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain(
      'Multiple layout overrides found in a single ::split::/::col:: column'
    );
  });

  test('a valid per-column layout override on each column raises no warnings, including no whole-slide MULTIPLE_LAYOUTS false positive', async () => {
    await validateCommand(columnLayoutCleanMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).not.toContain('Invalid layout override');
    expect(output).not.toContain('Multiple layout overrides');
  });

  test('warns on an unrecognized admonition marker', async () => {
    await validateCommand(admonitionInvalidMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Unrecognized admonition marker "[!foobar]"');
  });

  test('a recognized admonition marker raises no warning', async () => {
    await validateCommand(admonitionCleanMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).not.toContain('Unrecognized admonition marker');
  });

  test('warns on an invalid chart type', async () => {
    await validateCommand(chartInvalidTypeMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Invalid chart type "donut"');
  });

  test('warns when a chart directive is not immediately followed by a table', async () => {
    await validateCommand(chartMisplacedMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain(
      'A <!-- chart: ... --> directive must immediately precede a markdown table'
    );
  });

  test('a valid chart directive immediately before a table raises no warnings', async () => {
    await validateCommand(chartCleanMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).not.toContain('Invalid chart type');
    expect(output).not.toContain('must immediately precede a markdown table');
  });

  test('warns on an invalid imageFit value', async () => {
    await validateCommand(imageFitInvalidMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Invalid imageFit "stretch"');
  });

  test('warns on an invalid imagePosition value', async () => {
    await validateCommand(imagePositionInvalidMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Invalid imagePosition "center"');
  });

  test('warns on a malformed accentColor value', async () => {
    await validateCommand(accentColorInvalidMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain("doesn't look like a valid CSS color for accentColor");
  });

  test('valid imageFit/imagePosition/accentColor annotations raise no warnings', async () => {
    await validateCommand(mediaControlCleanMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).not.toContain('Invalid imageFit');
    expect(output).not.toContain('Invalid imagePosition');
    expect(output).not.toContain('valid CSS color');
  });

  test('warns on multiple level 1 headings on a single slide', async () => {
    await validateCommand(multipleH1WarningMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Multiple level 1 headings (#) found on a single slide');
  });

  test('warns on broken local image references', async () => {
    await validateCommand(brokenImageWarningMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Referenced image "./missing-img.png" does not exist on disk');
  });

  test('does not warn on working local image references', async () => {
    await validateCommand(workingImageMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).not.toContain('does not exist on disk');
  });

  test('warns on non-string theme in frontmatter', async () => {
    await validateCommand(frontmatterNonStringThemeMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Theme "" is not a built-in theme');
  });

  test('warns on empty slide', async () => {
    await validateCommand(emptySlideMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Slide is empty');
  });

  test('warns on slide with overflow lines', async () => {
    await validateCommand(overflowSlideMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('may overflow in the browser');
  });

  test('does not warn on slide with overflow lines when comment overflow: split is used', async () => {
    await validateCommand(overflowSplitCommentMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).not.toContain('may overflow in the browser');
  });

  test('does not warn on slide with overflow lines when frontmatter overflow: split is used', async () => {
    await validateCommand(overflowSplitMetaMd, { logLevel: 'info' });
    const output = logSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).not.toContain('may overflow in the browser');
  });

  test('--json includes a line number on a located issue', async () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await validateCommand(unclosedNotesWarningMd, { json: true, logLevel: 'silent' });
    const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
    const issue = payload.issues.find((i: any) => i.message.includes('Unclosed notes block'));
    expect(issue.line).toBeGreaterThan(0);
  });

  describe('--fix', () => {
    const fixDir = path.join(tmpDir, 'fix');
    const unclosedFenceFixMd = path.join(fixDir, 'unclosed-fence.md');
    const unclosedNotesFixMd = path.join(fixDir, 'unclosed-notes.md');
    const strayNotesFixMd = path.join(fixDir, 'stray-notes.md');
    const cleanFixMd = path.join(fixDir, 'clean.md');
    const slideMarkerFixMd = path.join(fixDir, 'slide-marker.md');

    beforeEach(() => {
      if (!fs.existsSync(fixDir)) fs.mkdirSync(fixDir, { recursive: true });
      fs.writeFileSync(unclosedFenceFixMd, '# Page One\n```javascript\nconst a = 1;\n');
      fs.writeFileSync(unclosedNotesFixMd, '# Page One\n<!-- notes -->\nSpeaker notes\n');
      fs.writeFileSync(strayNotesFixMd, '# Page One\n<!-- /notes -->\n');
      fs.writeFileSync(cleanFixMd, '# Page One\nContent\n');
      fs.writeFileSync(
        slideMarkerFixMd,
        '# Page One\n```javascript\nconst a = 1;\n\n<!-- slide -->\n\n# Page Two\nContent\n'
      );
    });

    test('closes an unclosed code fence in place', async () => {
      await validateCommand(unclosedFenceFixMd, { fix: true, logLevel: 'silent' });
      const content = fs.readFileSync(unclosedFenceFixMd, 'utf8');
      expect((content.match(/```/g) ?? []).length % 2).toBe(0);
    });

    test('closes an unclosed notes block in place', async () => {
      await validateCommand(unclosedNotesFixMd, { fix: true, logLevel: 'silent' });
      const content = fs.readFileSync(unclosedNotesFixMd, 'utf8');
      expect(content).toContain('<!-- /notes -->');
    });

    test('removes a stray closing notes tag in place', async () => {
      await validateCommand(strayNotesFixMd, { fix: true, logLevel: 'silent' });
      const content = fs.readFileSync(strayNotesFixMd, 'utf8');
      expect(content).not.toContain('<!-- /notes -->');
    });

    test('leaves the file untouched and reports nothing fixed when there is nothing to fix', async () => {
      const before = fs.readFileSync(cleanFixMd, 'utf8');
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      await validateCommand(cleanFixMd, { fix: true, json: true, logLevel: 'silent' });
      const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
      expect(payload.fixed).toEqual([]);
      expect(fs.readFileSync(cleanFixMd, 'utf8')).toBe(before);
    });

    test('--json reports applied fixes under a fixed array', async () => {
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      await validateCommand(unclosedFenceFixMd, { fix: true, json: true, logLevel: 'silent' });
      const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
      expect(payload.fixed.length).toBeGreaterThan(0);
    });

    test('fixes an unclosed fence across a <!-- slide --> divider without rewriting the marker', async () => {
      await validateCommand(slideMarkerFixMd, { fix: true, logLevel: 'silent' });
      const content = fs.readFileSync(slideMarkerFixMd, 'utf8');
      expect((content.match(/```/g) ?? []).length % 2).toBe(0);
      expect(content).toContain('<!-- slide -->');
      // The fix must not have normalized the marker into a thematic break.
      expect(content.match(/^---$/m)).toBeNull();
    });
  });

  describe('stdin input', () => {
    test('validates Markdown piped in on stdin', async () => {
      const restore = mockStdin('No Heading Here\n');
      try {
        const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        await validateCommand('-', { json: true, logLevel: 'silent' });
        const payload = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
        expect(payload.file).toBe('<stdin>');
        expect(payload.issues.some((i: any) => i.message.includes('no heading'))).toBe(true);
      } finally {
        restore();
      }
    });

    test('rejects --fix combined with stdin input', async () => {
      const restore = mockStdin('# Page One\n');
      try {
        await expect(validateCommand('-', { fix: true, logLevel: 'silent' })).rejects.toThrow(
          /--fix requires a real input file/
        );
      } finally {
        restore();
      }
    });
  });
});
