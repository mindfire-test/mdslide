import { describe, test, expect, afterEach } from 'vitest';
import { findSplitIndex, findColumnBoundaries, runTransforms } from '../src/transformers/index.ts';
import { createSlide, createSlideNode } from '../src/ast/createSlideNode.ts';
import { setWarningHandler } from '../src/utils/warnings.ts';

function textParagraph(value: string) {
  return createSlideNode({
    type: 'paragraph',
    children: [createSlideNode({ type: 'text', value })],
  });
}

describe('AST Transformers', () => {
  describe('findSplitIndex', () => {
    test('returns correct index when ::split:: paragraph is present', () => {
      const nodes = [
        createSlideNode({
          type: 'paragraph',
          children: [createSlideNode({ type: 'text', value: 'Left content' })],
        }),
        createSlideNode({
          type: 'paragraph',
          children: [createSlideNode({ type: 'text', value: '::split::' })],
        }),
        createSlideNode({
          type: 'paragraph',
          children: [createSlideNode({ type: 'text', value: 'Right content' })],
        }),
      ];
      expect(findSplitIndex(nodes)).toBe(1);
    });

    test('returns -1 if ::split:: is not present', () => {
      const nodes = [
        createSlideNode({
          type: 'paragraph',
          children: [createSlideNode({ type: 'text', value: 'No split tag here' })],
        }),
      ];
      expect(findSplitIndex(nodes)).toBe(-1);
    });
  });

  describe('runTransforms', () => {
    test('skips slides of type title or statement', () => {
      const slide = createSlide({
        type: 'title',
        content: [
          createSlideNode({
            type: 'paragraph',
            children: [createSlideNode({ type: 'text', value: '::split::' })],
          }),
        ],
      });
      const [transformed] = runTransforms([slide]);
      expect(transformed.type).toBe('title');
      // Should not split
      expect(transformed.content).toHaveLength(1);
    });

    test('performs manual split when ::split:: is present', () => {
      const slide = createSlide({
        type: 'content',
        content: [
          createSlideNode({
            type: 'paragraph',
            children: [createSlideNode({ type: 'text', value: 'Left' })],
          }),
          createSlideNode({
            type: 'paragraph',
            children: [createSlideNode({ type: 'text', value: '::split::' })],
          }),
          createSlideNode({
            type: 'paragraph',
            children: [createSlideNode({ type: 'text', value: 'Right' })],
          }),
        ],
      });

      const [transformed] = runTransforms([slide]);
      expect(transformed.type).toBe('split');
      expect(transformed.content).toHaveLength(2);
      expect(transformed.content[0].type).toBe('column');
      expect(transformed.content[0].children?.[0].children?.[0].value).toBe('Left');
      expect(transformed.content[1].type).toBe('column');
      expect(transformed.content[1].children?.[0].children?.[0].value).toBe('Right');
    });

    test('auto-splits when slide has exactly 1 image and meaningful text', () => {
      const slide = createSlide({
        type: 'content',
        content: [
          createSlideNode({
            type: 'paragraph',
            children: [createSlideNode({ type: 'text', value: 'Meaningful text explanation' })],
          }),
          createSlideNode({ type: 'image', url: 'img.png' }),
        ],
      });

      const [transformed] = runTransforms([slide]);
      expect(transformed.type).toBe('split');
    });

    test('changes type to visual when slide has 1 image but no meaningful text', () => {
      const slide = createSlide({
        type: 'content',
        content: [createSlideNode({ type: 'image', url: 'img.png' })],
      });

      const [transformed] = runTransforms([slide]);
      expect(transformed.type).toBe('visual');
    });
  });

  describe('findColumnBoundaries / N-column ::col:: splits', () => {
    afterEach(() => setWarningHandler(null));

    test('findColumnBoundaries returns every ::col:: index', () => {
      const nodes = [
        textParagraph('A'),
        textParagraph('::col::'),
        textParagraph('B'),
        textParagraph('::col::'),
        textParagraph('C'),
      ];
      expect(findColumnBoundaries(nodes)).toEqual([1, 3]);
    });

    test('findColumnBoundaries returns an empty array when absent', () => {
      expect(findColumnBoundaries([textParagraph('No markers')])).toEqual([]);
    });

    test('splits into N columns at ::col:: boundaries', () => {
      const slide = createSlide({
        type: 'content',
        content: [
          textParagraph('Frontend'),
          textParagraph('::col::'),
          textParagraph('Backend'),
          textParagraph('::col::'),
          textParagraph('Infra'),
        ],
      });

      const [transformed] = runTransforms([slide]);
      expect(transformed.type).toBe('split');
      expect(transformed.content).toHaveLength(3);
      expect(transformed.content.every((c) => c.type === 'column')).toBe(true);
      expect(transformed.content[0].children?.[0].children?.[0].value).toBe('Frontend');
      expect(transformed.content[1].children?.[0].children?.[0].value).toBe('Backend');
      expect(transformed.content[2].children?.[0].children?.[0].value).toBe('Infra');
    });

    test('applies a matching ratio hint to each column', () => {
      const slide = createSlide({
        type: 'content',
        content: [textParagraph('A'), textParagraph('::col::'), textParagraph('B')],
        columnsConfig: { count: 2, ratio: [2, 1] },
      });

      const [transformed] = runTransforms([slide]);
      expect(transformed.content[0].ratio).toBe(2);
      expect(transformed.content[1].ratio).toBe(1);
    });

    test('falls back to equal columns and warns when the ratio length mismatches', () => {
      const warnings: string[] = [];
      setWarningHandler((m) => warnings.push(m));

      const slide = createSlide({
        type: 'content',
        content: [textParagraph('A'), textParagraph('::col::'), textParagraph('B')],
        columnsConfig: { ratio: [2, 1, 1] },
      });

      const [transformed] = runTransforms([slide]);
      expect(transformed.content[0].ratio).toBeUndefined();
      expect(transformed.content[1].ratio).toBeUndefined();
      expect(warnings.some((w) => w.includes('ratio'))).toBe(true);
    });

    test('warns when the declared columns count does not match the actual segments', () => {
      const warnings: string[] = [];
      setWarningHandler((m) => warnings.push(m));

      const slide = createSlide({
        type: 'content',
        content: [textParagraph('A'), textParagraph('::col::'), textParagraph('B')],
        columnsConfig: { count: 3 },
      });

      runTransforms([slide]);
      expect(warnings.some((w) => w.includes('columns: 3'))).toBe(true);
    });

    test('::col:: takes precedence over a legacy ::split:: marker when both are present', () => {
      const slide = createSlide({
        type: 'content',
        content: [
          textParagraph('A'),
          textParagraph('::split::'),
          textParagraph('B'),
          textParagraph('::col::'),
          textParagraph('C'),
        ],
      });

      const [transformed] = runTransforms([slide]);
      // ::col:: wins: only its 1 boundary is honored (2 columns), and the
      // earlier ::split:: is left as literal text in the first column
      // rather than being treated as a second divider.
      expect(transformed.content).toHaveLength(2);
      expect(transformed.content[0].children).toHaveLength(3);
      expect(transformed.content[0].children?.[1].children?.[0].value).toBe('::split::');
      expect(transformed.content[0].children?.[2].children?.[0].value).toBe('B');
      expect(transformed.content[1].children?.[0].children?.[0].value).toBe('C');
    });

    test('::split:: alone still behaves exactly as before (unratioed, 2 columns)', () => {
      const slide = createSlide({
        type: 'content',
        content: [textParagraph('Left'), textParagraph('::split::'), textParagraph('Right')],
      });

      const [transformed] = runTransforms([slide]);
      expect(transformed.type).toBe('split');
      expect(transformed.content).toHaveLength(2);
      expect(transformed.content[0].ratio).toBeUndefined();
      expect(transformed.content[1].ratio).toBeUndefined();
    });
  });

  describe('Per-column layout override', () => {
    afterEach(() => {
      setWarningHandler(() => {});
    });

    function htmlNode(value: string) {
      return createSlideNode({ type: 'html', value });
    }

    test("a <!-- layout: --> comment inside a ::col:: segment sets that column's layout and is stripped from its children", () => {
      const slide = createSlide({
        type: 'content',
        content: [
          htmlNode('<!-- layout: code -->'),
          createSlideNode({ type: 'code', lang: 'ts', value: 'const x = 1;' }),
          textParagraph('::col::'),
          textParagraph('Just some bullet-free text'),
        ],
      });

      const [transformed] = runTransforms([slide]);
      expect(transformed.content[0].layout).toBe('code');
      expect(transformed.content[0].children).toHaveLength(1);
      expect(transformed.content[0].children?.[0].type).toBe('code');
      expect(transformed.content[1].layout).toBe('content');
    });

    test('columns auto-detect their own layout with no override (e.g. a list becomes bullets)', () => {
      const slide = createSlide({
        type: 'content',
        content: [
          createSlideNode({
            type: 'list',
            children: [createSlideNode({ type: 'listItem', children: [textParagraph('One')] })],
          }),
          textParagraph('::col::'),
          textParagraph('Plain text'),
        ],
      });

      const [transformed] = runTransforms([slide]);
      expect(transformed.content[0].layout).toBe('bullets');
      expect(transformed.content[1].layout).toBe('content');
    });

    test('an invalid column override (e.g. title) warns and falls back to auto-detection', () => {
      const warnings: string[] = [];
      setWarningHandler((m) => warnings.push(m));

      const slide = createSlide({
        type: 'content',
        content: [
          htmlNode('<!-- layout: title -->'),
          textParagraph('Some content'),
          textParagraph('::col::'),
          textParagraph('Other column'),
        ],
      });

      const [transformed] = runTransforms([slide]);
      expect(transformed.content[0].layout).toBe('content');
      expect(warnings.some((w) => w.includes('Invalid layout override "title"'))).toBe(true);
    });

    test('legacy ::split:: also resolves per-column layout overrides', () => {
      const slide = createSlide({
        type: 'content',
        content: [
          htmlNode('<!-- layout: quote -->'),
          createSlideNode({ type: 'blockquote', children: [textParagraph('A wise quote')] }),
          textParagraph('::split::'),
          textParagraph('Plain right column'),
        ],
      });

      const [transformed] = runTransforms([slide]);
      expect(transformed.content[0].layout).toBe('quote');
      expect(transformed.content[1].layout).toBe('content');
    });
  });
});
