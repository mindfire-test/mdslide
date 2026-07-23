import { describe, test, expect } from 'vitest';
import { normalizeHeading } from '../src/normalizer/normalizeHeading.ts';
import {
  parseLayoutOveride,
  resolveSlideLayout,
  parseBackgroundImage,
  parseTitlePositioning,
  parseOverflowConfig,
  parseAnimationConfig,
  normalizeAnimation,
  parseFontSizeConfig,
  normalizeFontSize,
  parseContentAlign,
  normalizeVerticalPosition,
  parseColumnsConfig,
  parseChartAnnotations,
  parseImageConfig,
  parseAccentColor,
} from '../src/normalizer/normalizeLayout.ts';
import { extractSlideNotes } from '../src/normalizer/normalizeNote.ts';
import { detectAdmonition } from '../src/normalizer/normalizeAdmonition.ts';
import { setWarningHandler } from '../src/utils/warnings.ts';
import {
  toSlideAstNode,
  normalizeSlide,
  normalizeSlides,
} from '../src/normalizer/mdAstToSlideBasedAst.ts';
import type { Heading, RootContent } from 'mdast';
import type { RawSlideBlock } from '../src/interfaces/index.ts';

describe('Normalize Heading', () => {
  test('correctly normalizes a heading node', () => {
    const headingNode: Heading = {
      type: 'heading',
      depth: 2,
      children: [{ type: 'text', value: 'Heading Text ' }],
    };
    const result = normalizeHeading(headingNode);
    expect(result.depth).toBe(2);
    expect(result.text).toBe('Heading Text');
  });
});

describe('Normalize Layout', () => {
  test('parseLayoutOveride extracts layout comment and filters nodes', () => {
    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- layout: dark -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] },
    ];
    const { layoutOverride, filteredNodes } = parseLayoutOveride(nodes);
    expect(layoutOverride).toBe('dark');
    expect(filteredNodes).toHaveLength(1);
    expect(filteredNodes[0].type).toBe('paragraph');
  });

  test('parseLayoutOveride ignores invalid comments', () => {
    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- layout: invalid layout -->' }, // invalid layout name with space
      { type: 'html', value: '<!-- not layout -->' },
    ];
    const { layoutOverride, filteredNodes } = parseLayoutOveride(nodes);
    expect(layoutOverride).toBeUndefined();
    expect(filteredNodes).toHaveLength(2);
  });

  test('parseLayoutOveride is a no-op (leaves comments untouched) when a ::col:: boundary is present', () => {
    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- layout: bullets -->' },
      { type: 'paragraph', children: [{ type: 'text', value: '::col::' }] },
      { type: 'html', value: '<!-- layout: code -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Column content' }] },
    ];
    const { layoutOverride, filteredNodes } = parseLayoutOveride(nodes);
    // No whole-slide override is captured: with a column boundary present,
    // layout resolution happens per-column later (resolveColumnLayout), so
    // every comment - including one physically before the first boundary,
    // which is column 1's own content, not slide-wide - is left untouched.
    expect(layoutOverride).toBeUndefined();
    expect(filteredNodes).toEqual(nodes);
  });

  test('parseLayoutOveride is a no-op when a ::split:: boundary is present too', () => {
    const nodes: RootContent[] = [
      { type: 'paragraph', children: [{ type: 'text', value: '::split::' }] },
      { type: 'html', value: '<!-- layout: quote -->' },
    ];
    const { layoutOverride, filteredNodes } = parseLayoutOveride(nodes);
    expect(layoutOverride).toBeUndefined();
    expect(filteredNodes).toEqual(nodes);
  });

  test('parseLayoutOveride is generic over SlideNode[] for per-column reuse', () => {
    const nodes = [
      { type: 'html', value: '<!-- layout: code -->' },
      { type: 'text', value: 'hi' },
    ];
    const { layoutOverride, filteredNodes } = parseLayoutOveride(nodes);
    expect(layoutOverride).toBe('code');
    expect(filteredNodes).toHaveLength(1);
  });

  test('parseBackgroundImage extracts background image comments and cleans wrapper', () => {
    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- backgroundImage: https://example.com/bg.png -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] },
    ];
    const { backgroundImage, filteredNodes } = parseBackgroundImage(nodes);
    expect(backgroundImage).toBe('https://example.com/bg.png');
    expect(filteredNodes).toHaveLength(1);

    const nodesWithUrlWrapper: RootContent[] = [
      { type: 'html', value: '<!-- background-image: url("https://example.com/bg2.png") -->' },
    ];
    const { backgroundImage: bg2 } = parseBackgroundImage(nodesWithUrlWrapper);
    expect(bg2).toBe('https://example.com/bg2.png');

    const nodesWithUrlAndModifier: RootContent[] = [
      {
        type: 'html',
        value: '<!-- background-image: url("https://example.com/bg3.png") light -->',
      },
    ];
    const { backgroundImage: bg3 } = parseBackgroundImage(nodesWithUrlAndModifier);
    expect(bg3).toBe('https://example.com/bg3.png light');
  });

  test('parseTitlePositioning extracts title alignment and vertical positioning comments', () => {
    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- titleAlign: center -->' },
      { type: 'html', value: '<!-- titlePosition: bottom -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] },
    ];
    const { titleAlign, titlePosition, filteredNodes } = parseTitlePositioning(nodes);
    expect(titleAlign).toBe('center');
    expect(titlePosition).toBe('bottom');
    expect(filteredNodes).toHaveLength(1);
  });

  test('parseOverflowConfig extracts overflow comments and filters nodes', () => {
    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- overflow: split -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] },
    ];
    const { overflow, filteredNodes } = parseOverflowConfig(nodes);
    expect(overflow).toBe('split');
    expect(filteredNodes).toHaveLength(1);
    expect(filteredNodes[0].type).toBe('paragraph');
  });

  test('parseAnimationConfig extracts animation comments and filters nodes', () => {
    const nodes1: RootContent[] = [
      { type: 'html', value: '<!-- animation: fade -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] },
    ];
    const { animation: anim1, filteredNodes: filtered1 } = parseAnimationConfig(nodes1);
    expect(anim1).toBe('fade');
    expect(filtered1).toHaveLength(1);

    const nodes2: RootContent[] = [
      { type: 'html', value: '<!-- build: fade -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] },
    ];
    const { animation: anim2, filteredNodes: filtered2 } = parseAnimationConfig(nodes2);
    expect(anim2).toBe('fade');
    expect(filtered2).toHaveLength(1);

    const nodes3: RootContent[] = [
      { type: 'html', value: '<!-- animation: slide-up -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] },
    ];
    const { animation: anim3, filteredNodes: filtered3 } = parseAnimationConfig(nodes3);
    expect(anim3).toBe('slide-up');
    expect(filtered3).toHaveLength(1);
  });

  test('normalizeAnimation maps values to standard animation strings', () => {
    expect(normalizeAnimation('fade')).toBe('fade');
    expect(normalizeAnimation('true')).toBe('fade');
    expect(normalizeAnimation('FADE')).toBe('fade');
    expect(normalizeAnimation('slide-up')).toBe('slide-up');
    expect(normalizeAnimation('zoom')).toBe('zoom');
    expect(normalizeAnimation('slide-left')).toBe('slide-left');
    expect(normalizeAnimation('slide-right')).toBe('slide-right');
    expect(normalizeAnimation('invalid')).toBeUndefined();
    expect(normalizeAnimation(undefined)).toBeUndefined();
  });

  test('parseFontSizeConfig extracts font size comments and filters nodes', () => {
    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- fontSize: sm -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] },
    ];
    const { fontSize, filteredNodes } = parseFontSizeConfig(nodes);
    expect(fontSize).toBe('sm');
    expect(filteredNodes).toHaveLength(1);
    expect(filteredNodes[0].type).toBe('paragraph');
  });

  test('normalizeFontSize maps values to standard size strings', () => {
    expect(normalizeFontSize('xs')).toBe('xs');
    expect(normalizeFontSize('extra-large')).toBe('xl');
    expect(normalizeFontSize('extra large')).toBe('xl');
    expect(normalizeFontSize('xxl')).toBe('xxl');
    expect(normalizeFontSize('medium')).toBe('md');
    expect(normalizeFontSize('normal')).toBe('md');
    expect(normalizeFontSize('invalid')).toBeUndefined();
  });

  test('normalizeVerticalPosition normalizes typos/aliases shared by titlePosition and align', () => {
    expect(normalizeVerticalPosition('top')).toBe('top');
    expect(normalizeVerticalPosition('BOTTOM')).toBe('bottom');
    expect(normalizeVerticalPosition('buttom')).toBe('bottom');
    expect(normalizeVerticalPosition('middle')).toBe('center');
    expect(normalizeVerticalPosition('center')).toBe('center');
  });

  test('parseContentAlign extracts the align comment and filters nodes', () => {
    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- align: middle -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] },
    ];
    const { align, filteredNodes } = parseContentAlign(nodes);
    expect(align).toBe('center');
    expect(filteredNodes).toHaveLength(1);
    expect(filteredNodes[0].type).toBe('paragraph');
  });

  test('parseContentAlign leaves nodes untouched when no align comment is present', () => {
    const nodes: RootContent[] = [
      { type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] },
    ];
    const { align, filteredNodes } = parseContentAlign(nodes);
    expect(align).toBeUndefined();
    expect(filteredNodes).toHaveLength(1);
  });

  test('parseColumnsConfig extracts count and ratio', () => {
    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- columns: 3 ratio:2:1:1 -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] },
    ];
    const { columnsConfig, filteredNodes } = parseColumnsConfig(nodes);
    expect(columnsConfig).toEqual({ count: 3, ratio: [2, 1, 1] });
    expect(filteredNodes).toHaveLength(1);
  });

  test('parseColumnsConfig works without a ratio', () => {
    const nodes: RootContent[] = [{ type: 'html', value: '<!-- columns: 3 -->' }];
    const { columnsConfig } = parseColumnsConfig(nodes);
    expect(columnsConfig).toEqual({ count: 3, ratio: undefined });
  });

  test('parseColumnsConfig ignores unrelated comments', () => {
    const nodes: RootContent[] = [{ type: 'html', value: '<!-- layout: split -->' }];
    const { columnsConfig, filteredNodes } = parseColumnsConfig(nodes);
    expect(columnsConfig).toBeUndefined();
    expect(filteredNodes).toHaveLength(1);
  });

  test('resolveSlideLayout returns custom layout if layoutOverride is valid', () => {
    const layout = resolveSlideLayout([], false, 'bullets');
    expect(layout).toBe('bullets');
  });

  test('resolveSlideLayout falls back if layoutOverride is invalid', () => {
    const layout = resolveSlideLayout([], true, 'invalid-layout');
    expect(layout).toBe('title'); // hasTitle = true, nodes = empty -> title
  });

  test('resolveSlideLayout auto-detects layouts', () => {
    // 1. title
    expect(resolveSlideLayout([], true)).toBe('title');

    // 2. bullets
    expect(resolveSlideLayout([{ type: 'list', children: [] }], false)).toBe('bullets');

    // 3. code
    expect(resolveSlideLayout([{ type: 'code', value: 'const a = 1;' }], false)).toBe('code');

    // 4. quote
    expect(resolveSlideLayout([{ type: 'blockquote', children: [] }], false)).toBe('quote');

    // 5. visual
    expect(resolveSlideLayout([{ type: 'image', url: 'img.png' }], false)).toBe('visual');

    // 6. table
    expect(resolveSlideLayout([{ type: 'table', children: [] }], false)).toBe('table');

    // 7. content (fallback)
    expect(resolveSlideLayout([{ type: 'paragraph', children: [] }], false)).toBe('content');
  });
});

describe('parseChartAnnotations', () => {
  test('attaches a valid chart hint to the immediately following table and strips the comment', () => {
    const tableNode: RootContent = { type: 'table', children: [] } as any;
    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- chart: bar -->' },
      tableNode,
      { type: 'paragraph', children: [{ type: 'text', value: 'after' }] } as any,
    ];
    const { filteredNodes } = parseChartAnnotations(nodes);
    expect(filteredNodes).toHaveLength(2);
    expect((filteredNodes[0] as any).chartHint).toBe('bar');
    expect(filteredNodes[1].type).toBe('paragraph');
  });

  test('warns and drops the directive when the chart type is invalid', () => {
    const warnings: string[] = [];
    setWarningHandler((message) => warnings.push(message));

    const tableNode: RootContent = { type: 'table', children: [] } as any;
    const nodes: RootContent[] = [{ type: 'html', value: '<!-- chart: donut -->' }, tableNode];
    const { filteredNodes } = parseChartAnnotations(nodes);
    setWarningHandler(null);

    expect(filteredNodes).toHaveLength(1);
    expect((filteredNodes[0] as any).chartHint).toBeUndefined();
    expect(warnings.some((w) => w.includes('Invalid chart type "donut"'))).toBe(true);
  });

  test('warns and drops the directive when not immediately followed by a table', () => {
    const warnings: string[] = [];
    setWarningHandler((message) => warnings.push(message));

    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- chart: bar -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'not a table' }] } as any,
    ];
    const { filteredNodes } = parseChartAnnotations(nodes);
    setWarningHandler(null);

    expect(filteredNodes).toHaveLength(1);
    expect(filteredNodes[0].type).toBe('paragraph');
    expect(warnings.some((w) => w.includes('must immediately precede a table'))).toBe(true);
  });
});

describe('parseImageConfig', () => {
  test('captures valid imageFit and imagePosition and strips both comments', () => {
    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- imageFit: cover -->' },
      { type: 'html', value: '<!-- imagePosition: left -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'body' }] } as any,
    ];
    const { imageFit, imagePosition, filteredNodes } = parseImageConfig(nodes);
    expect(imageFit).toBe('cover');
    expect(imagePosition).toBe('left');
    expect(filteredNodes).toHaveLength(1);
    expect(filteredNodes[0]!.type).toBe('paragraph');
  });

  test('warns and drops an invalid imageFit value', () => {
    const warnings: string[] = [];
    setWarningHandler((message) => warnings.push(message));

    const nodes: RootContent[] = [{ type: 'html', value: '<!-- imageFit: stretch -->' }];
    const { imageFit, filteredNodes } = parseImageConfig(nodes);
    setWarningHandler(null);

    expect(imageFit).toBeUndefined();
    expect(filteredNodes).toHaveLength(0);
    expect(warnings.some((w) => w.includes('Invalid imageFit "stretch"'))).toBe(true);
  });

  test('warns and drops an invalid imagePosition value', () => {
    const warnings: string[] = [];
    setWarningHandler((message) => warnings.push(message));

    const nodes: RootContent[] = [{ type: 'html', value: '<!-- imagePosition: center -->' }];
    const { imagePosition, filteredNodes } = parseImageConfig(nodes);
    setWarningHandler(null);

    expect(imagePosition).toBeUndefined();
    expect(filteredNodes).toHaveLength(0);
    expect(warnings.some((w) => w.includes('Invalid imagePosition "center"'))).toBe(true);
  });
});

describe('parseAccentColor', () => {
  test('captures a freeform value and strips the comment', () => {
    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- accentColor: #f43f5e -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'body' }] } as any,
    ];
    const { accentColor, filteredNodes } = parseAccentColor(nodes);
    expect(accentColor).toBe('#f43f5e');
    expect(filteredNodes).toHaveLength(1);
  });

  test('returns undefined when no annotation is present', () => {
    const nodes: RootContent[] = [
      { type: 'paragraph', children: [{ type: 'text', value: 'body' }] } as any,
    ];
    const { accentColor, filteredNodes } = parseAccentColor(nodes);
    expect(accentColor).toBeUndefined();
    expect(filteredNodes).toHaveLength(1);
  });
});

describe('detectAdmonition', () => {
  test('drops the marker-only first paragraph (GitHub-style)', () => {
    const node = {
      type: 'blockquote',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: '[!TIP]' }] },
        { type: 'paragraph', children: [{ type: 'text', value: 'Helpful advice.' }] },
      ],
    };
    const { kind, children } = detectAdmonition(node as any);
    expect(kind).toBe('tip');
    expect(children).toHaveLength(1);
    expect((children[0] as any).children[0].value).toBe('Helpful advice.');
  });

  test('strips just the marker prefix when inline text follows on the same line', () => {
    const node = {
      type: 'blockquote',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: '[!WARNING] Be careful.' }] },
      ],
    };
    const { kind, children } = detectAdmonition(node as any);
    expect(kind).toBe('warning');
    expect(children).toHaveLength(1);
    expect((children[0] as any).children[0].value).toBe('Be careful.');
  });

  test('returns no kind for an unrecognized marker or a plain blockquote', () => {
    const unrecognized = {
      type: 'blockquote',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: '[!FOO] text' }] }],
    };
    expect(detectAdmonition(unrecognized as any).kind).toBeUndefined();

    const plain = {
      type: 'blockquote',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Just a quote.' }] }],
    };
    expect(detectAdmonition(plain as any).kind).toBeUndefined();
  });
});

describe('Normalize Note', () => {
  test('extractSlideNotes extracts notes between comments', () => {
    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- notes -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Note text 1' }] },
      { type: 'paragraph', children: [{ type: 'text', value: 'Note text 2' }] },
      { type: 'html', value: '<!-- /notes -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Slide content' }] },
    ];

    const { notes, remainingNodes } = extractSlideNotes(nodes);
    expect(notes).toBe('Note text 1\nNote text 2');
    expect(remainingNodes).toHaveLength(1);
    expect(remainingNodes[0].type).toBe('paragraph');
  });

  test('extractSlideNotes matches notes markers case-insensitively, like other directives', () => {
    const nodes: RootContent[] = [
      { type: 'html', value: '<!-- NOTES -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Note text' }] },
      { type: 'html', value: '<!--   /Notes   -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Slide content' }] },
    ];

    const { notes, remainingNodes } = extractSlideNotes(nodes);
    expect(notes).toBe('Note text');
    expect(remainingNodes).toHaveLength(1);
    expect(remainingNodes[0].type).toBe('paragraph');
  });

  test('extractSlideNotes warns and preserves content when the notes block is never closed', () => {
    const warnings: string[] = [];
    setWarningHandler((message) => warnings.push(message));

    const nodes: RootContent[] = [
      { type: 'paragraph', children: [{ type: 'text', value: 'Visible intro' }] },
      { type: 'html', value: '<!-- notes -->' },
      { type: 'paragraph', children: [{ type: 'text', value: 'Meant to be a note' }] },
      { type: 'heading', depth: 3, children: [{ type: 'text', value: 'Stranded Heading' }] },
    ];

    const { notes, remainingNodes } = extractSlideNotes(nodes);
    setWarningHandler(null);

    // No closing marker was found, so nothing should be silently dropped.
    expect(notes).toBeUndefined();
    expect(remainingNodes).toHaveLength(3);
    expect(remainingNodes[1].type).toBe('paragraph');
    expect(remainingNodes[2].type).toBe('heading');
    expect(warnings.some((w) => w.includes('Unclosed') && w.includes('notes'))).toBe(true);
  });
});

describe('toSlideAstNode', () => {
  test('converts basic node', () => {
    const node: RootContent = {
      type: 'paragraph',
      children: [{ type: 'text', value: 'some text' }] as any,
    };
    const slideNode = toSlideAstNode(node);
    expect(slideNode.type).toBe('paragraph');
    expect(slideNode.children).toHaveLength(1);
    expect(slideNode.children?.[0].type).toBe('text');
    expect(slideNode.children?.[0].value).toBe('some text');
  });

  test('converts table with header rows', () => {
    const tableNode: RootContent = {
      type: 'table',
      children: [
        {
          type: 'tableRow',
          children: [{ type: 'tableCell', children: [{ type: 'text', value: 'Header' }] }] as any,
        },
        {
          type: 'tableRow',
          children: [{ type: 'tableCell', children: [{ type: 'text', value: 'Data' }] }] as any,
        },
      ] as any,
    };
    const slideNode = toSlideAstNode(tableNode);
    expect(slideNode.type).toBe('table');
    expect(slideNode.children?.[0].type).toBe('tableRow');
    expect(slideNode.children?.[0].children?.[0].header).toBe(true);
    expect(slideNode.children?.[1].children?.[0].header).toBeFalsy();
  });

  test('converts a table carrying a chartHint into a chart-flagged SlideNode', () => {
    const tableNode: RootContent = {
      type: 'table',
      children: [],
      // Attached by parseChartAnnotations before this node reaches toSlideAstNode.
      chartHint: 'bar',
    } as any;
    const slideNode = toSlideAstNode(tableNode);
    expect(slideNode.chart).toBe('bar');
  });

  test('converts a GitHub-style admonition blockquote, dropping the marker paragraph', () => {
    const blockquoteNode: RootContent = {
      type: 'blockquote',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: '[!TIP]' }] },
        { type: 'paragraph', children: [{ type: 'text', value: 'Helpful advice.' }] },
      ] as any,
    };
    const slideNode = toSlideAstNode(blockquoteNode);
    expect(slideNode.admonition).toBe('tip');
    expect(slideNode.children).toHaveLength(1);
  });

  test('converts a plain blockquote with no admonition field', () => {
    const blockquoteNode: RootContent = {
      type: 'blockquote',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: 'Just a quote.' }] },
      ] as any,
    };
    const slideNode = toSlideAstNode(blockquoteNode);
    expect(slideNode.admonition).toBeUndefined();
  });
});

describe('normalizeSlide', () => {
  test('normalizes complete raw slide block', () => {
    const rawBlock: RawSlideBlock = {
      id: 'slide-1',
      nodes: [
        { type: 'html', value: '<!-- layout: bullets -->' },
        { type: 'heading', depth: 1, children: [{ type: 'text', value: 'My Slide Title' }] },
        { type: 'paragraph', children: [{ type: 'text', value: 'Body content' }] } as any,
        { type: 'html', value: '<!-- notes -->' },
        { type: 'paragraph', children: [{ type: 'text', value: 'Speaker note' }] } as any,
        { type: 'html', value: '<!-- /notes -->' },
      ],
    };

    const slide = normalizeSlide(rawBlock);
    expect(slide.id).toBe('slide-1');
    expect(slide.type).toBe('bullets'); // layoutOverride matches valid type
    expect(slide.title).toBe('My Slide Title');
    expect(slide.content).toHaveLength(1);
    expect(slide.content[0].type).toBe('paragraph');
    expect(slide.notes).toBe('Speaker note');
  });

  test('normalizes slide block with background image comment', () => {
    const rawBlock: RawSlideBlock = {
      id: 'slide-bg',
      nodes: [
        { type: 'html', value: '<!-- backgroundImage: https://example.com/bg.png dark -->' },
        { type: 'heading', depth: 1, children: [{ type: 'text', value: 'Slide Title' }] },
      ],
    };
    const slide = normalizeSlide(rawBlock);
    expect(slide.backgroundImage).toBe('https://example.com/bg.png dark');
  });
});

describe('normalizeSlides', () => {
  test('filters out slides with no title and no content', () => {
    const rawBlocks: RawSlideBlock[] = [
      { id: '1', nodes: [] }, // empty slide
      {
        id: '2',
        nodes: [{ type: 'heading', depth: 2, children: [{ type: 'text', value: 'Title' }] }],
      },
    ];
    const slides = normalizeSlides(rawBlocks);
    expect(slides).toHaveLength(1);
    expect(slides[0].id).toBe('2');
  });

  test('applies frontmatter align as a default, overridable per slide', () => {
    const rawBlocks: RawSlideBlock[] = [
      {
        id: 'no-override',
        nodes: [{ type: 'paragraph', children: [{ type: 'text', value: 'Body' }] }],
      },
      {
        id: 'with-override',
        nodes: [
          { type: 'html', value: '<!-- align: bottom -->' },
          { type: 'paragraph', children: [{ type: 'text', value: 'Body' }] },
        ],
      },
    ];
    const slides = normalizeSlides(rawBlocks, { align: 'middle' });
    expect(slides[0].align).toBe('center');
    expect(slides[1].align).toBe('bottom');
  });
});
