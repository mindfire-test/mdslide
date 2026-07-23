import { describe, test, expect, vi } from 'vitest';
import { Compiler } from '../src/pipeline/compiler.ts';

describe('Compiler Integration', () => {
  const compiler = new Compiler();

  test('compiles a complete markdown deck successfully', () => {
    const md = `---
title: Test Slide Deck
theme: terminal
author: Sobhan
---

# Introduction to MdSlide
Welcome to the compiler integration test.

---

# Features
<!-- layout: bullets -->
- Custom themes
- Auto splitting
- Code highlighting

<!-- notes -->
Make sure to explain all the features.
<!-- /notes -->
`;

    const result = compiler.compile(md);

    // Verify Meta
    expect(result.meta).toEqual({
      title: 'Test Slide Deck',
      theme: 'terminal',
      author: 'Sobhan',
    });

    // Verify Slides
    expect(result.slides).toHaveLength(2);

    // Slide 1
    const s1 = result.slides[0];
    expect(s1.title).toBe('Introduction to MdSlide');
    expect(s1.type).toBe('content');
    expect(s1.content).toHaveLength(1);
    expect(s1.content[0].type).toBe('paragraph');

    // Slide 2
    const s2 = result.slides[1];
    expect(s2.title).toBe('Features');
    expect(s2.type).toBe('bullets'); // Layout override layout: bullets
    expect(s2.content).toHaveLength(1);
    expect(s2.content[0].type).toBe('list');
    expect(s2.notes).toBe('Make sure to explain all the features.');

    // Verify HTML Output
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('data-theme="terminal"');
    expect(result.html).toContain('<title>Test Slide Deck</title>');
    expect(result.html).toContain('Introduction to MdSlide');
    expect(result.html).toContain('Custom themes');
  });

  test('warns when a slide overflows and is not marked for auto-split', () => {
    const words = Array(400).fill('word').join(' ');
    const md = `# Long Slide\n\n${words}\n`;

    const result = compiler.compile(md);
    expect(
      result.warnings.some((w) => w.includes('may overflow') && w.includes('overflow: split'))
    ).toBe(true);
  });

  test('does not warn about overflow when the slide opts into overflow: split', () => {
    const words = Array(400).fill('word').join(' ');
    const md = `# Long Slide\n<!-- overflow: split -->\n\n${words}\n`;

    const result = compiler.compile(md);
    expect(result.warnings.some((w) => w.includes('may overflow'))).toBe(false);
  });

  test('supports <!-- slide -->, N-column ::col:: splits with ratio, and <!-- align --> together', () => {
    const md = `# Cover

<!-- slide -->

# Build vs Test vs Deploy

<!-- columns: 3 ratio:2:1:1 -->

Build stuff

::col::

Test stuff

::col::

Deploy stuff

<!-- slide -->

# One Thing

<!-- align: center -->

Ship small, ship often.
`;

    const result = compiler.compile(md);
    expect(result.slides).toHaveLength(3);

    const [cover, columns, statement] = result.slides;
    expect(cover.title).toBe('Cover');

    expect(columns.title).toBe('Build vs Test vs Deploy');
    expect(columns.type).toBe('split');
    expect(columns.content).toHaveLength(3);
    expect(columns.content.map((c) => c.ratio)).toEqual([2, 1, 1]);

    expect(statement.title).toBe('One Thing');
    expect(statement.align).toBe('center');

    expect(result.html).toContain('<div class="splitLayout">');
    expect(result.html).toContain('style="flex: 2"');
    expect(result.html).toContain('data-content-align="center"');
    expect(result.warnings).toEqual([]);
  });

  test('supports a per-column layout override inside a ::col:: split', () => {
    const md = `# Build vs Test vs Deploy

Build stuff

<!-- layout: code -->

\`\`\`bash
npm run build
\`\`\`

::col::

- Smoke tests
- Integration tests

::col::

Deploy stuff
`;

    const result = compiler.compile(md);
    expect(result.slides).toHaveLength(1);

    const [slide] = result.slides;
    expect(slide.type).toBe('split');
    expect(slide.content).toHaveLength(3);
    // Forced via the per-column override, and stripped from that column's own content
    expect(slide.content[0].layout).toBe('code');
    expect(slide.content[0].children?.some((n) => n.type === 'html')).toBe(false);
    // Auto-detected per column, with no cross-column bleed
    expect(slide.content[1].layout).toBe('bullets');
    expect(slide.content[2].layout).toBe('content');

    expect(result.html).toContain('<div class="splitColumn" data-type="code">');
    expect(result.html).toContain('<div class="splitColumn" data-type="bullets">');
    expect(result.html).toContain('<div class="splitColumn" data-type="content">');
    expect(result.warnings).toEqual([]);
  });

  test('renders a GitHub-style admonition as a colored callout box', () => {
    const md = `# Heads Up

> [!TIP]
> Helpful advice for doing things better or more easily.
`;
    const result = compiler.compile(md);
    const [slide] = result.slides;
    expect(slide.content[0].admonition).toBe('tip');

    expect(result.html).toContain('data-admonition="tip"');
    expect(result.html).toContain('Helpful advice for doing things better or more easily.');
    expect(result.warnings).toEqual([]);
  });

  test('renders a ```stats fenced block as a metric-card grid', () => {
    const md = `# Quarterly Highlights

\`\`\`stats
Revenue: +34%
Deploys/wk: 12
NPS: 68
\`\`\`
`;
    const result = compiler.compile(md);
    expect(result.html).toContain('class="statsGrid"');
    expect((result.html.match(/class="statCard"/g) ?? []).length).toBe(3);
    expect(result.html).toContain('<div class="statValue">+34%</div>');
    expect(result.warnings).toEqual([]);
  });

  test('renders a <!-- chart: bar --> table as an inline-SVG chart, not a plain grid', () => {
    const md = `# Monthly Revenue

<!-- chart: bar -->

| Month | Revenue |
| ----- | ------- |
| Jan   | 100     |
| Feb   | 200     |
`;
    const result = compiler.compile(md);
    const [slide] = result.slides;
    expect(slide.content[0].chart).toBe('bar');

    expect(result.html).toContain('data-chart="bar"');
    expect(result.html).toContain('<svg');
    expect(result.html).not.toContain('<table>');
    expect(result.warnings).toEqual([]);
  });

  test('supports <!-- imageFit --> and <!-- imagePosition --> per-slide overrides', () => {
    const md = `# Product Demo

<!-- imageFit: cover -->
<!-- imagePosition: left -->

Some meaningful text explaining the product alongside its screenshot.

![screenshot](demo.png)
`;
    const result = compiler.compile(md);
    const [slide] = result.slides;
    expect(slide.imageFit).toBe('cover');
    expect(slide.imagePosition).toBe('left');

    expect(result.html).toContain('data-image-fit="cover"');
    expect(result.html.indexOf('imageColumn')).toBeLessThan(result.html.indexOf('textColumn'));
    expect(result.warnings).toEqual([]);
  });

  test('renders .mp4 image-syntax URLs as an autoplaying <video>', () => {
    const md = `# Demo Video

![demo](demo.mp4)
`;
    const result = compiler.compile(md);
    expect(result.html).toContain('<video src="demo.mp4"');
    expect(result.html).toContain('autoplay loop muted playsinline');
    expect(result.html).not.toContain('<img');
    expect(result.warnings).toEqual([]);
  });

  test('applies <!-- accentColor: ... --> as a --slide-accent override on that slide only', () => {
    const md = `# Pop Slide

<!-- accentColor: #f43f5e -->

Regular content on this slide.

---

# Normal Slide

More regular content.
`;
    const result = compiler.compile(md);
    const [popSlide, normalSlide] = result.slides;
    expect(popSlide.accentColor).toBe('#f43f5e');
    expect(normalSlide.accentColor).toBeUndefined();

    expect(result.html).toContain('--slide-accent: #f43f5e;');
    expect(result.warnings).toEqual([]);
  });

  test('handles frontmatter-only markdown without crash', () => {
    const md = `---
title: Empty Presentation
---
`;
    const result = compiler.compile(md);
    expect(result.meta).toEqual({ title: 'Empty Presentation' });
    expect(result.slides).toEqual([]);
    expect(result.html).toContain('<title>Empty Presentation</title>');
  });
});

describe('Compiler pipeline error handling', () => {
  // Every stage past frontmatter parsing used to run uncaught: an exception
  // from the renderer (or normalizer/transformer/overflow) surfaced as a bare
  // stack trace with no indication of which stage produced it. Forcing the
  // render stage to throw here locks in that compile() now names the failing
  // stage and keeps the original error as `cause`.
  test('wraps a render-stage failure with stage context and preserves the cause', async () => {
    vi.resetModules();
    vi.doMock('../src/renderer/html/index.ts', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../src/renderer/html/index.ts')>();
      return {
        ...actual,
        renderDeck: () => {
          throw new Error('boom');
        },
      };
    });

    const { Compiler: MockedCompiler } = await import('../src/pipeline/compiler.ts');
    const mockedCompiler = new MockedCompiler();

    let thrown: unknown;
    try {
      mockedCompiler.compile('# Title\n\nBody text');
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe('[mdslide] Compile failed at stage "render": boom');
    expect((thrown as Error).cause).toBeInstanceOf(Error);
    expect(((thrown as Error).cause as Error).message).toBe('boom');

    vi.doUnmock('../src/renderer/html/index.ts');
    vi.resetModules();
  });
});
