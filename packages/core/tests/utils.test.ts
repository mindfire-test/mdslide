import { describe, test, expect } from 'vitest';
import { countImages } from '../src/utils/countImages.ts';
import { extractTextLength } from '../src/utils/extractTextLength.ts';
import { getNodeWeight } from '../src/utils/getNodeWeight.ts';
import { sanitizeHtml, sanitizeUrl } from '../src/utils/html.ts';
import { createSlideNode } from '../src/ast/createSlideNode.ts';
import type { RootContent } from 'mdast';

describe('Utility - countImages', () => {
  test('returns 0 if no images are present', () => {
    const nodes = [createSlideNode({ type: 'paragraph', value: 'hello' })];
    expect(countImages(nodes)).toBe(0);
  });

  test('counts simple image nodes', () => {
    const nodes = [
      createSlideNode({ type: 'image', url: 'img1.png' }),
      createSlideNode({ type: 'paragraph', value: 'text' }),
      createSlideNode({ type: 'image', url: 'img2.png' }),
    ];
    expect(countImages(nodes)).toBe(2);
  });

  test('counts nested image nodes recursively', () => {
    const nodes = [
      createSlideNode({
        type: 'list',
        children: [
          createSlideNode({
            type: 'listItem',
            children: [createSlideNode({ type: 'image', url: 'nested.png' })],
          }),
        ],
      }),
    ];
    expect(countImages(nodes)).toBe(1);
  });
});

describe('Utility - extractTextLength', () => {
  test('returns length of node value', () => {
    const node = createSlideNode({ type: 'text', value: 'hello' });
    expect(extractTextLength(node)).toBe(5);
  });

  test('returns combined length of children values recursively', () => {
    const node = createSlideNode({
      type: 'paragraph',
      children: [
        createSlideNode({ type: 'text', value: 'ab' }),
        createSlideNode({
          type: 'emphasis',
          children: [createSlideNode({ type: 'text', value: 'cde' })],
        }),
      ],
    });
    expect(extractTextLength(node)).toBe(5);
  });
});

describe('Utility - getNodeWeight', () => {
  test('scales heading weight with its text length instead of a flat constant', () => {
    const heading: RootContent = { type: 'heading', depth: 1, children: [] };
    // height = (0 wrapLines * 65 + 20) = 20px -> ceil(20 / 81.25) = 1
    expect(getNodeWeight(heading)).toBe(1);
  });

  test('assigns weight to paragraphs based on text length', () => {
    // height = (ceil(10/65)=1 wrapLine * 30 + 15) = 45px -> ceil(45/81.25) = 1
    const p1: RootContent = {
      type: 'paragraph',
      children: [{ type: 'text', value: 'short text' }] as any,
    };
    expect(getNodeWeight(p1)).toBe(1);

    // 30 "word"s + 29 spaces = 149 chars -> ceil(149/65)=3 wrapLines * 30 + 15
    // = 105px -> ceil(105/81.25) = 2
    const longText = Array(30).fill('word').join(' ');
    const p2: RootContent = {
      type: 'paragraph',
      children: [{ type: 'text', value: longText }] as any,
    };
    expect(getNodeWeight(p2)).toBe(2);
  });

  test('assigns weight to list based on summed listItem heights, not raw item count', () => {
    // list base (15px) + 3 empty listItems (each (max(30,0)+10)=40px) = 135px
    // -> ceil(135/81.25) = 2
    const list: RootContent = {
      type: 'list',
      children: [
        { type: 'listItem', children: [] },
        { type: 'listItem', children: [] },
        { type: 'listItem', children: [] },
      ] as any,
    };
    expect(getNodeWeight(list)).toBe(2);
  });

  test('assigns weight to table based on row count, not a flat constant', () => {
    // height = 35 + 0 rows * 38 = 35px -> ceil(35/81.25) = 1
    const table: RootContent = { type: 'table', children: [] };
    expect(getNodeWeight(table)).toBe(1);
  });

  test('assigns weight to code based on line count', () => {
    // 2 lines -> height = 50 + 2*24 = 98px -> ceil(98/81.25) = 2
    const code1: RootContent = { type: 'code', value: 'line1\nline2' };
    expect(getNodeWeight(code1)).toBe(2);

    // 12 lines -> height = 50 + 12*24 = 338px -> ceil(338/81.25) = 5
    const code2: RootContent = { type: 'code', value: Array(12).fill('line').join('\n') };
    expect(getNodeWeight(code2)).toBe(5);
  });

  test('assigns default weight of 1 to other empty nodes', () => {
    const other: RootContent = { type: 'thematicBreak' };
    expect(getNodeWeight(other)).toBe(1);
  });
});

describe('Utility - sanitizeHtml', () => {
  test('sanitizes dangerous HTML characters', () => {
    expect(sanitizeHtml('&')).toBe('&amp;');
    expect(sanitizeHtml('<')).toBe('&lt;');
    expect(sanitizeHtml('>')).toBe('&gt;');
    expect(sanitizeHtml('"')).toBe('&quot;');
    expect(sanitizeHtml('a & b < c > d "e"')).toBe('a &amp; b &lt; c &gt; d &quot;e&quot;');
  });
});

describe('Utility - sanitizeUrl', () => {
  test('allows safe HTTP and HTTPS protocols', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('http://example.com/path?query=val')).toBe(
      'http://example.com/path?query=val'
    );
  });

  test('allows mailto: and tel: protocols', () => {
    expect(sanitizeUrl('mailto:user@example.com')).toBe('mailto:user@example.com');
    expect(sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890');
  });

  test('blocks javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('about:blank');
    expect(sanitizeUrl('  javascript:alert("XSS")  ')).toBe('about:blank');
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('about:blank');
  });

  test('blocks vbscript: URLs', () => {
    expect(sanitizeUrl('vbscript:msgbox("hello")')).toBe('about:blank');
  });

  test('blocks data: URLs in non-image contexts', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('about:blank');
  });

  test('allows safe data:image URIs only when isImage is true', () => {
    const pngData = 'data:image/png;base64,iVBORw0KGgoAAAANS';
    expect(sanitizeUrl(pngData, true)).toBe(pngData);
    expect(sanitizeUrl(pngData, false)).toBe('about:blank');

    const svgData = 'data:image/svg+xml;base64,PHN2Zz...';
    expect(sanitizeUrl(svgData, true)).toBe(svgData);

    const txtData = 'data:text/plain;base64,aGVsbG8=';
    expect(sanitizeUrl(txtData, true)).toBe('about:blank');
  });

  test('allows relative paths and anchors', () => {
    expect(sanitizeUrl('./path/to/image.png')).toBe('./path/to/image.png');
    expect(sanitizeUrl('#slide-3')).toBe('#slide-3');
    expect(sanitizeUrl('//example.com')).toBe('//example.com');
  });
});
