import { describe, test, expect } from 'vitest';
import {
  renderDeck,
  renderSlide,
  nodeToHtml,
  childrenToHtml,
  renderListItemText,
} from '../src/renderer/html/index.ts';
import { renderCodeBlock, renderInlineCode } from '../src/renderer/html/renderCode.ts';
import { renderTable, renderTableRow, renderTableCell } from '../src/renderer/html/renderTable.ts';
import { renderAdmonition } from '../src/renderer/html/renderAdmonition.ts';
import { parseStatsLines, renderStatsGrid } from '../src/renderer/html/renderStatsGrid.ts';
import { extractChartData, renderChart } from '../src/renderer/html/renderChart.ts';
import { createSlide, createSlideNode } from '../src/ast/createSlideNode.ts';
import { sanitizeHtml } from '../src/utils/html.ts';

describe('HTML Sanitization', () => {
  test('escapes HTML special characters', () => {
    expect(sanitizeHtml('<div>Hello & Welcome</div>')).toBe(
      '&lt;div&gt;Hello &amp; Welcome&lt;/div&gt;'
    );
  });
});

describe('Node and Children Renderer', () => {
  test('nodeToHtml renders text nodes', () => {
    const node = createSlideNode({ type: 'text', value: 'Hello & Welcome' });
    expect(nodeToHtml(node)).toBe('Hello &amp; Welcome');
  });

  test('nodeToHtml renders formatting nodes (strong, emphasis, break)', () => {
    const strong = createSlideNode({
      type: 'strong',
      children: [createSlideNode({ type: 'text', value: 'bold' })],
    });
    expect(nodeToHtml(strong)).toBe('<strong>bold</strong>');

    const em = createSlideNode({
      type: 'emphasis',
      children: [createSlideNode({ type: 'text', value: 'italic' })],
    });
    expect(nodeToHtml(em)).toBe('<em>italic</em>');

    const br = createSlideNode({ type: 'break' });
    expect(nodeToHtml(br)).toBe('<br />');
  });

  test('nodeToHtml renders blockquotes, images, links', () => {
    const bq = createSlideNode({
      type: 'blockquote',
      children: [createSlideNode({ type: 'text', value: 'quote' })],
    });
    expect(nodeToHtml(bq)).toBe('<blockquote>quote</blockquote>');

    const img = createSlideNode({ type: 'image', url: 'foo.png', alt: 'bar' });
    const imgHtml = nodeToHtml(img);
    expect(imgHtml).not.toContain('class="fragment"');
    expect(imgHtml).not.toContain('id="frag-');
    expect(imgHtml).toContain('src="foo.png" alt="bar"');

    const imgAnimHtml = nodeToHtml(img, 'fade');
    expect(imgAnimHtml).toContain('class="fragment"');
    expect(imgAnimHtml).toContain('data-animation="fade"');
    expect(imgAnimHtml).toContain('id="frag-');
    expect(imgAnimHtml).toContain('src="foo.png" alt="bar"');

    const link = createSlideNode({
      type: 'link',
      url: 'https://foo.com',
      children: [createSlideNode({ type: 'text', value: 'link text' })],
    });
    expect(nodeToHtml(link)).toBe('<a href="https://foo.com">link text</a>');
  });

  test('nodeToHtml renders .mp4/.webm image-syntax URLs as <video>, .gif and others stay <img>', () => {
    const mp4 = createSlideNode({ type: 'image', url: 'demo.mp4', alt: 'demo' });
    const mp4Html = nodeToHtml(mp4);
    expect(mp4Html).toBe(
      '<video src="demo.mp4" class="slideVideo" autoplay loop muted playsinline></video>'
    );

    const webm = createSlideNode({ type: 'image', url: 'demo.webm' });
    expect(nodeToHtml(webm)).toContain('<video src="demo.webm"');

    const mp4Anim = nodeToHtml(mp4, 'fade');
    expect(mp4Anim).toContain('class="slideVideo fragment"');
    expect(mp4Anim).toContain('data-animation="fade"');
    expect(mp4Anim).toContain('id="frag-');

    const gif = createSlideNode({ type: 'image', url: 'demo.gif', alt: 'demo' });
    const gifHtml = nodeToHtml(gif);
    expect(gifHtml).toContain('<img');
    expect(gifHtml).toContain('src="demo.gif"');

    const png = createSlideNode({ type: 'image', url: 'demo.png' });
    expect(nodeToHtml(png)).toContain('<img');
  });

  test('nodeToHtml renders lists', () => {
    const ul = createSlideNode({
      type: 'list',
      ordered: false,
      children: [
        createSlideNode({
          type: 'listItem',
          children: [createSlideNode({ type: 'text', value: 'item' })],
        }),
      ],
    });
    const ulHtml = nodeToHtml(ul);
    expect(ulHtml).not.toContain('<li class="fragment"');
    expect(ulHtml).toContain('<li>item</li>');

    const ulAnimHtml = nodeToHtml(ul, 'fade');
    expect(ulAnimHtml).toContain('<li class="fragment" data-animation="fade" id="frag-');
    expect(ulAnimHtml).toContain('">item</li>');

    const ol = createSlideNode({
      type: 'list',
      ordered: true,
      children: [
        createSlideNode({
          type: 'listItem',
          children: [createSlideNode({ type: 'text', value: 'item' })],
        }),
      ],
    });
    const olHtml = nodeToHtml(ol);
    expect(olHtml).not.toContain('<li class="fragment"');
    expect(olHtml).toContain('<li>item</li>');

    const olAnimHtml = nodeToHtml(ol, 'fade');
    expect(olAnimHtml).toContain('<li class="fragment" data-animation="fade" id="frag-');
    expect(olAnimHtml).toContain('">item</li>');
  });

  test('nodeToHtml renders raw HTML but filters comments', () => {
    const comment = createSlideNode({ type: 'html', value: '<!-- comment -->' });
    expect(nodeToHtml(comment)).toBe('');

    const style = createSlideNode({ type: 'html', value: '<style>body { color: red; }</style>' });
    expect(nodeToHtml(style)).toBe('<style>body { color: red; }</style>');
  });

  test('renderCodeBlock generates styled blocks', () => {
    const tsNode = createSlideNode({ type: 'code', lang: 'typescript', value: 'const a = 1;' });
    expect(renderCodeBlock(tsNode)).toBe(
      '<pre class="line-numbers language-typescript"><code class="language-typescript">const a = 1;</code></pre>'
    );

    const rawNode = createSlideNode({ type: 'code', value: 'raw code' });
    expect(renderCodeBlock(rawNode)).toBe('<pre><code>raw code</code></pre>');

    const inlineNode = createSlideNode({ type: 'inlineCode', value: 'inline' });
    expect(renderInlineCode(inlineNode)).toBe('<code>inline</code>');
  });

  test('renderCodeBlock styles languages outside the legacy allow-list, deferring to Prism autoloader', () => {
    const jsxNode = createSlideNode({ type: 'code', lang: 'jsx', value: '<App />' });
    expect(renderCodeBlock(jsxNode)).toBe(
      '<pre class="line-numbers language-jsx"><code class="language-jsx">&lt;App /&gt;</code></pre>'
    );

    const diffNode = createSlideNode({ type: 'code', lang: 'diff', value: '+ added' });
    expect(renderCodeBlock(diffNode)).toBe(
      '<pre class="line-numbers language-diff"><code class="language-diff">+ added</code></pre>'
    );
  });

  test('renderTable renders table components', () => {
    const thNode = createSlideNode({
      type: 'tableCell',
      header: true,
      children: [createSlideNode({ type: 'text', value: 'head' })],
    });
    expect(renderTableCell(thNode, childrenToHtml)).toBe('<th>head</th>');

    const tdNode = createSlideNode({
      type: 'tableCell',
      header: false,
      children: [createSlideNode({ type: 'text', value: 'data' })],
    });
    expect(renderTableCell(tdNode, childrenToHtml)).toBe('<td>data</td>');

    const trNode = createSlideNode({ type: 'tableRow', children: [tdNode] });
    expect(renderTableRow(trNode, childrenToHtml)).toBe('<tr><td>data</td></tr>');

    const tableNode = createSlideNode({ type: 'table', children: [trNode] });
    expect(renderTable(tableNode, childrenToHtml)).toBe('<table><tr><td>data</td></tr></table>');
  });

  test('nodeToHtml renders an admonition blockquote with icon/title, plain blockquote otherwise', () => {
    const tipNode = createSlideNode({
      type: 'blockquote',
      admonition: 'tip',
      children: [createSlideNode({ type: 'text', value: 'Helpful advice.' })],
    });
    const html = nodeToHtml(tipNode);
    expect(html).toContain('class="admonition" data-admonition="tip"');
    expect(html).toContain('💡');
    expect(html).toContain('Tip');
    expect(html).toContain('Helpful advice.');

    const plainNode = createSlideNode({
      type: 'blockquote',
      children: [createSlideNode({ type: 'text', value: 'Just a quote.' })],
    });
    expect(nodeToHtml(plainNode)).toBe('<blockquote>Just a quote.</blockquote>');
  });
});

describe('renderAdmonition', () => {
  test('renders each recognized kind with its own icon/label', () => {
    const node = createSlideNode({
      type: 'blockquote',
      admonition: 'warning',
      children: [createSlideNode({ type: 'text', value: 'Be careful.' })],
    });
    const html = renderAdmonition(node, (n) => childrenToHtml(n));
    expect(html).toContain('data-admonition="warning"');
    expect(html).toContain('⚠️');
    expect(html).toContain('Warning');
    expect(html).toContain('Be careful.');
  });
});

describe('renderStatsGrid', () => {
  test('parseStatsLines splits label/value pairs on the first colon', () => {
    const entries = parseStatsLines('Revenue: +34%\nDeploys/wk: 12\n\nNPS: 68');
    expect(entries).toEqual([
      { label: 'Revenue', value: '+34%' },
      { label: 'Deploys/wk', value: '12' },
      { label: 'NPS', value: '68' },
    ]);
  });

  test('parseStatsLines drops lines with no colon', () => {
    expect(parseStatsLines('no colon here')).toEqual([]);
  });

  test('renderStatsGrid renders one statCard per valid line', () => {
    const html = renderStatsGrid('Revenue: +34%\nNPS: 68');
    expect(html).toContain('class="statsGrid"');
    expect((html.match(/class="statCard"/g) ?? []).length).toBe(2);
    expect(html).toContain('<div class="statValue">+34%</div>');
    expect(html).toContain('<div class="statLabel">Revenue</div>');
  });

  test('renderStatsGrid falls back to a plain code block when nothing parses', () => {
    const html = renderStatsGrid('no colon here');
    expect(html).toBe('<pre><code>no colon here</code></pre>');
  });
});

describe('extractChartData / renderChart', () => {
  function tableNode(rows: string[][]) {
    const tableRows = rows.map((cells) =>
      createSlideNode({
        type: 'tableRow',
        children: cells.map((c) =>
          createSlideNode({
            type: 'tableCell',
            children: [createSlideNode({ type: 'text', value: c })],
          })
        ),
      })
    );
    return createSlideNode({ type: 'table', chart: 'bar', children: tableRows });
  }

  test('extractChartData parses header + data rows into categories/series', () => {
    const node = tableNode([
      ['Month', 'Revenue'],
      ['Jan', '100'],
      ['Feb', '$1,200'],
    ]);
    const data = extractChartData(node);
    expect(data).toEqual({
      categories: ['Jan', 'Feb'],
      series: [{ name: 'Revenue', values: [100, 1200] }],
    });
  });

  test('extractChartData returns null when there is no value column', () => {
    const node = tableNode([['Month'], ['Jan'], ['Feb']]);
    expect(extractChartData(node)).toBeNull();
  });

  test('extractChartData returns null with no data rows', () => {
    const node = tableNode([['Month', 'Revenue']]);
    expect(extractChartData(node)).toBeNull();
  });

  test('renderChart renders a bar/line/pie chart container', () => {
    const rows = [
      ['Month', 'Revenue'],
      ['Jan', '100'],
      ['Feb', '200'],
    ];
    const bar = renderChart(tableNode(rows));
    expect(bar).toContain('data-chart="bar"');
    expect(bar).toContain('<svg');

    const lineNode = tableNode(rows);
    lineNode.chart = 'line';
    expect(renderChart(lineNode)).toContain('data-chart="line"');

    const pieNode = tableNode(rows);
    pieNode.chart = 'pie';
    const pie = renderChart(pieNode);
    expect(pie).toContain('data-chart="pie"');
    expect(pie).toContain('chartLegend');
  });

  test('renderChart returns null for insufficient data, falling back to a plain table via nodeToHtml', () => {
    const node = tableNode([['Month']]);
    expect(renderChart(node)).toBeNull();
    expect(nodeToHtml(node)).toContain('<table>');
  });
});

describe('Slide and Deck Renderer', () => {
  test('renderSlide generates section with properties', () => {
    const slide = createSlide({
      id: 'slide-abc',
      type: 'content',
      title: 'Slide Title',
      content: [
        createSlideNode({
          type: 'paragraph',
          children: [createSlideNode({ type: 'text', value: 'Body content' })],
        }),
      ],
      notes: 'Speaker Note',
    });

    const html = renderSlide(slide);
    expect(html).toContain('<section class="slide" data-type="content" data-id="slide-abc">');
    expect(html).toContain('<h2 class="slideTitle">Slide Title</h2>');
    expect(html).toContain('<div class="slideContent">');
    expect(html).toContain('<p>Body content</p>');
    expect(html).toContain('<aside class="notes" hidden>Speaker Note</aside>');
  });

  test('renderSlide sanitizes background image URLs against CSS/protocol injection', () => {
    const injected = createSlide({
      id: 'slide-bg-injected',
      type: 'content',
      content: [],
      backgroundImage: `x'); } body { background: red; } /*`,
    });
    const renderedHtml = renderSlide(injected);
    const styleMatch = renderedHtml.match(/style="([^"]*)"/);
    expect(styleMatch).not.toBeNull();
    const styleAttr = styleMatch![1]!;
    expect(styleAttr).not.toContain(`x');`);
    expect(styleAttr).toContain('%27');

    const jsProtocol = createSlide({
      id: 'slide-bg-js',
      type: 'content',
      content: [],
      backgroundImage: 'javascript:alert(1)',
    });
    const jsHtml = renderSlide(jsProtocol);
    const jsStyleMatch = jsHtml.match(/style="([^"]*)"/);
    expect(jsStyleMatch).not.toBeNull();
    expect(jsStyleMatch![1]).not.toContain('javascript:alert(1)');
    expect(jsStyleMatch![1]).toContain('about:blank');
  });

  test('renderSlide supports split layouts manually', () => {
    const slide = createSlide({
      id: 'slide-split',
      type: 'split',
      content: [
        createSlideNode({
          type: 'column',
          children: [createSlideNode({ type: 'text', value: 'Left Column' })],
        }),
        createSlideNode({
          type: 'column',
          children: [createSlideNode({ type: 'text', value: 'Right Column' })],
        }),
      ],
    });

    const html = renderSlide(slide);
    expect(html).toContain('<div class="splitLayout">');
    expect((html.match(/<div class="splitColumn" data-type="content">/g) ?? []).length).toBe(2);
    expect(html).toContain('Left Column');
    expect(html).toContain('Right Column');
  });

  test('renderSlide supports N columns with per-column ratio', () => {
    const slide = createSlide({
      id: 'slide-3col',
      type: 'split',
      content: [
        {
          type: 'column',
          children: [createSlideNode({ type: 'text', value: 'Frontend' })],
          ratio: 2,
        },
        {
          type: 'column',
          children: [createSlideNode({ type: 'text', value: 'Backend' })],
          ratio: 1,
        },
        { type: 'column', children: [createSlideNode({ type: 'text', value: 'Infra' })], ratio: 1 },
      ],
    });

    const html = renderSlide(slide);
    expect((html.match(/<div class="splitColumn"/g) ?? []).length).toBe(3);
    expect(html).toContain('<div class="splitColumn" data-type="content" style="flex: 2">');
    expect((html.match(/style="flex: 1"/g) ?? []).length).toBe(2);
    expect(html).toContain('Frontend');
    expect(html).toContain('Backend');
    expect(html).toContain('Infra');
  });

  test('renderSlide omits the inline flex style for ratio-less columns', () => {
    const slide = createSlide({
      id: 'slide-3col-equal',
      type: 'split',
      content: [
        { type: 'column', children: [createSlideNode({ type: 'text', value: 'A' })] },
        { type: 'column', children: [createSlideNode({ type: 'text', value: 'B' })] },
        { type: 'column', children: [createSlideNode({ type: 'text', value: 'C' })] },
      ],
    });

    const html = renderSlide(slide);
    expect((html.match(/<div class="splitColumn" data-type="content">/g) ?? []).length).toBe(3);
    expect(html).not.toContain('style="flex:');
  });

  test('renderSlide reflects a per-column layout override in data-type', () => {
    const slide = createSlide({
      id: 'slide-col-layout',
      type: 'split',
      content: [
        {
          type: 'column',
          children: [createSlideNode({ type: 'text', value: 'A' })],
          layout: 'code',
        },
        {
          type: 'column',
          children: [createSlideNode({ type: 'text', value: 'B' })],
          layout: 'bullets',
        },
      ],
    });

    const html = renderSlide(slide);
    expect(html).toContain('<div class="splitColumn" data-type="code">');
    expect(html).toContain('<div class="splitColumn" data-type="bullets">');
  });

  test('renderSlide sets data-content-align only when align is set', () => {
    const withAlign = createSlide({
      id: 'slide-align',
      align: 'center',
      content: [createSlideNode({ type: 'text', value: 'Short' })],
    });
    expect(renderSlide(withAlign)).toContain('data-content-align="center"');

    const withoutAlign = createSlide({
      id: 'slide-no-align',
      content: [createSlideNode({ type: 'text', value: 'Short' })],
    });
    expect(renderSlide(withoutAlign)).not.toContain('data-content-align');
  });

  test('renderSlide supports auto-detected split layouts with image', () => {
    const slide = createSlide({
      id: 'slide-auto-split',
      type: 'split',
      content: [
        createSlideNode({
          type: 'paragraph',
          children: [createSlideNode({ type: 'text', value: 'Text explanation' })],
        }),
        createSlideNode({ type: 'image', url: 'logo.png', alt: 'Logo' }),
      ],
    });

    const html = renderSlide(slide);
    expect(html).toContain('<div class="splitLayout">');
    expect(html).toContain('<div class="splitColumn textColumn">');
    expect(html).toContain('<div class="splitColumn imageColumn">');
    expect(html).toContain('src="logo.png" alt="Logo"');
    expect(html).not.toContain('class="fragment"');

    const htmlAnim = renderSlide({ ...slide, animation: 'fade' });
    expect(htmlAnim).toContain('class="fragment"');
    expect(htmlAnim).toContain('data-animation="fade"');
    expect(htmlAnim).toContain('id="frag-');
  });

  test('renderSlide honors imagePosition on the auto-detected split layout', () => {
    const base = createSlide({
      id: 'slide-image-position',
      type: 'split',
      content: [
        createSlideNode({
          type: 'paragraph',
          children: [createSlideNode({ type: 'text', value: 'Text explanation' })],
        }),
        createSlideNode({ type: 'image', url: 'logo.png', alt: 'Logo' }),
      ],
    });

    const defaultHtml = renderSlide(base);
    expect(defaultHtml.indexOf('textColumn')).toBeLessThan(defaultHtml.indexOf('imageColumn'));

    const leftHtml = renderSlide({ ...base, imagePosition: 'left' });
    expect(leftHtml.indexOf('imageColumn')).toBeLessThan(leftHtml.indexOf('textColumn'));
  });

  test('renderSlide adds data-image-fit when imageFit is set', () => {
    const withFit = createSlide({
      id: 'slide-image-fit',
      content: [createSlideNode({ type: 'image', url: 'logo.png' })],
      imageFit: 'cover',
    });
    expect(renderSlide(withFit)).toContain('data-image-fit="cover"');

    const withoutFit = createSlide({
      id: 'slide-no-image-fit',
      content: [createSlideNode({ type: 'image', url: 'logo.png' })],
    });
    expect(renderSlide(withoutFit)).not.toContain('data-image-fit');
  });

  test('renderSlide applies accentColor as a --slide-accent style override, merged with backgroundImage', () => {
    const accentOnly = createSlide({
      id: 'slide-accent',
      content: [],
      accentColor: '#f43f5e',
    });
    const accentHtml = renderSlide(accentOnly);
    const styleMatch = accentHtml.match(/style="([^"]*)"/);
    expect(styleMatch).not.toBeNull();
    expect(styleMatch![1]).toContain('--slide-accent: #f43f5e;');

    const both = createSlide({
      id: 'slide-accent-and-bg',
      content: [],
      accentColor: '#f43f5e',
      backgroundImage: 'bg.png',
    });
    const bothHtml = renderSlide(both);
    const bothStyleMatches = bothHtml.match(/style="/g) ?? [];
    expect(bothStyleMatches).toHaveLength(1);
    const bothStyle = bothHtml.match(/style="([^"]*)"/)![1]!;
    expect(bothStyle).toContain('background-image');
    expect(bothStyle).toContain('--slide-accent: #f43f5e;');
  });

  test('renderDeck generates complete template with scripts', () => {
    const deck = {
      meta: { title: 'My Deck', theme: 'dark' },
      slides: [
        createSlide({
          id: 'slide-1',
          content: [createSlideNode({ type: 'text', value: 'Hello' })],
        }),
      ],
    };

    const html = renderDeck(deck);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en" data-theme="dark">');
    expect(html).toContain('<title>My Deck</title>');
    expect(html).toContain('<style id="mdslideBase">');
    expect(html).toContain('<style id="mdslideTheme">');
    expect(html).toContain('class="deck"');
    expect(html).toContain('class="progressBarContainer"');
    expect(html).toContain('class="dokContainer"');
  });

  test('renderDeck lets assetUrls override the default CDN URLs for offline/CSP embedding', () => {
    const deck = {
      meta: { title: 'My Deck', theme: 'light' },
      slides: [createSlide({ id: 'slide-1', content: [] })],
    };

    const html = renderDeck(deck, {
      assetUrls: {
        prismCssLight: '/vendor/prism.css',
        katexCss: '/vendor/katex.css',
        mermaidJs: '/vendor/mermaid.mjs',
      },
    });

    expect(html).toContain('<link rel="stylesheet" href="/vendor/prism.css" />');
    expect(html).toContain('<link rel="stylesheet" href="/vendor/katex.css" />');
    expect(html).toContain('import mermaid from "/vendor/mermaid.mjs";');
    // Unoverridden keys keep falling back to the default CDN URLs.
    expect(html).toContain(
      'cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js'
    );
  });

  test('renderDeck sanitizes a malicious assetUrls override instead of injecting it raw', () => {
    const deck = {
      meta: { title: 'My Deck', theme: 'light' },
      slides: [createSlide({ id: 'slide-1', content: [] })],
    };

    const html = renderDeck(deck, {
      assetUrls: {
        katexCss: 'javascript:alert(1)',
        mermaidJs: `'; alert(1); import mermaid from 'x`,
      },
    });

    expect(html).not.toContain('href="javascript:alert(1)"');
    expect(html).toContain('href="about:blank"');
    expect(html).not.toContain(`import mermaid from '';`);
  });

  test('renderDeck print CSS resets the .deck responsive-fit transform, exactly once', () => {
    const deck = {
      meta: { title: 'My Deck', theme: 'light' },
      slides: [createSlide({ id: 'slide-1', content: [] })],
    };
    const html = renderDeck(deck);

    // There must be exactly one @media print block: a duplicate print
    // stylesheet previously raced with this one on DOM injection order.
    expect(html.match(/@media print \{/g)).toHaveLength(1);

    const printBlockMatch = html.match(/@media print \{[\s\S]*?\n {6}\}\n {4}\}/);
    expect(printBlockMatch).not.toBeNull();
    const printBlock = printBlockMatch![0];

    // script.ts sets an inline `transform: scale(...)` on .deck to fit the
    // viewport for on-screen presentation; print must cancel it with
    // `!important`, or exported PDFs render the deck shrunk inside a full
    // page instead of filling it.
    const deckRuleMatch = printBlock.match(/\.deck\s*\{([^}]*)\}/);
    expect(deckRuleMatch).not.toBeNull();
    expect(deckRuleMatch![1]).toContain('transform: none !important');
  });

  test('renderListItemText handles different node types', () => {
    // image node -> ''
    expect(renderListItemText(createSlideNode({ type: 'image', url: 'foo.png' }))).toBe('');

    // text node -> escaped value
    expect(renderListItemText(createSlideNode({ type: 'text', value: 'hello <world>' }))).toBe(
      'hello &lt;world&gt;'
    );

    // children nodes -> join
    const parent = createSlideNode({
      type: 'listItem',
      children: [
        createSlideNode({ type: 'text', value: 'hello' }),
        createSlideNode({ type: 'text', value: ' ' }),
        createSlideNode({ type: 'text', value: 'world' }),
      ],
    });
    expect(renderListItemText(parent)).toBe('hello world');

    // other node without value/children -> ''
    expect(renderListItemText(createSlideNode({ type: 'unknown' }))).toBe('');
  });

  test('nodeToHtml handles paragraph of only images', () => {
    const node = createSlideNode({
      type: 'paragraph',
      children: [
        createSlideNode({ type: 'image', url: 'img.png' }),
        createSlideNode({ type: 'text', value: '   ' }), // whitespace text node
      ],
    });
    const rendered = nodeToHtml(node);
    expect(rendered).toContain('src="img.png" alt=""');
    expect(rendered).not.toContain('class="fragment"');

    const renderedAnim = nodeToHtml(node, 'fade');
    expect(renderedAnim).toContain('src="img.png" alt=""');
    expect(renderedAnim).toContain('class="fragment"');
    expect(renderedAnim).toContain('data-animation="fade"');
  });

  test('nodeToHtml handles list carrying a nested image', () => {
    const listNode = createSlideNode({
      type: 'list',
      ordered: false,
      children: [
        // list item without image
        createSlideNode({
          type: 'listItem',
          children: [createSlideNode({ type: 'text', value: 'No image here' })],
        }),
        // list item with nested image
        createSlideNode({
          type: 'listItem',
          children: [
            createSlideNode({ type: 'text', value: 'With image' }),
            createSlideNode({ type: 'image', url: 'nested.png' }),
          ],
        }),
      ],
    });

    const html = nodeToHtml(listNode);
    expect(html).toContain('<ul>');
    expect(html).not.toContain('class="fragment"');
    expect(html).toContain('No image here</li>');
    expect(html).toContain('With image</li>');
    expect(html).toContain('<div class="inlineImageGrid">');
    expect(html).toContain('<img src="nested.png"');
    expect(html).not.toContain('class="fragment"');

    const htmlAnim = nodeToHtml(listNode, 'fade');
    expect(htmlAnim).toContain('class="fragment" data-animation="fade"');
    expect(htmlAnim).toContain('No image here</li>');
    expect(htmlAnim).toContain('With image</li>');
    expect(htmlAnim).toContain('<div class="inlineImageGrid">');
    expect(htmlAnim).toContain('<img src="nested.png"');
  });

  test('nodeToHtml handles table, html and unknown nodes', () => {
    // table
    const tableNode = createSlideNode({
      type: 'table',
      children: [
        createSlideNode({
          type: 'tableRow',
          children: [
            createSlideNode({
              type: 'tableCell',
              header: true,
              children: [createSlideNode({ type: 'text', value: 'H1' })],
            }),
          ],
        }),
      ],
    });
    expect(nodeToHtml(tableNode)).toBe('<table><tr><th>H1</th></tr></table>');

    // html
    const htmlNode = createSlideNode({ type: 'html', value: '<!-- comment -->' });
    expect(nodeToHtml(htmlNode)).toBe('');

    // unknown node default case
    const unknownWithValue = createSlideNode({ type: 'custom-type' as any, value: '<script>' });
    expect(nodeToHtml(unknownWithValue)).toBe('&lt;script&gt;');

    const unknownWithChildren = createSlideNode({
      type: 'custom-type' as any,
      children: [createSlideNode({ type: 'text', value: 'child text' })],
    });
    expect(nodeToHtml(unknownWithChildren)).toBe('child text');

    const unknownEmpty = createSlideNode({ type: 'custom-type' as any });
    expect(nodeToHtml(unknownEmpty)).toBe('');
  });

  test('renderSlide handles split layout with 0 or 2+ images fallback', () => {
    // 2 images in split layout (auto-split fallback to normal render)
    const slide = createSlide({
      id: 'slide-fallback',
      type: 'split',
      content: [
        createSlideNode({ type: 'image', url: 'img1.png' }),
        createSlideNode({ type: 'image', url: 'img2.png' }),
      ],
    });
    const html = renderSlide(slide);
    expect(html).not.toContain('<div class="splitLayout">');
    expect(html).toContain('img1.png');
    expect(html).toContain('img2.png');
  });

  test('nodeToHtml renders math and inlineMath nodes using KaTeX', () => {
    const inlineMath = createSlideNode({ type: 'inlineMath' as any, value: 'c^2 = a^2 + b^2' });
    const htmlInline = nodeToHtml(inlineMath);
    expect(htmlInline).toContain('class="math mathInline"');
    expect(htmlInline).toContain('katex');

    const blockMath = createSlideNode({ type: 'math' as any, value: '\\sum_{i=1}^n i' });
    const htmlBlock = nodeToHtml(blockMath);
    expect(htmlBlock).toContain('class="math mathDisplay"');
    expect(htmlBlock).toContain('katex-display');
  });

  test('nodeToHtml renders mermaid code block as div with class mermaid', () => {
    const node = createSlideNode({ type: 'code', lang: 'mermaid', value: 'graph TD\nA --> B' });
    const html = nodeToHtml(node);
    expect(html).toBe('<div class="mermaid">graph TD\nA --&gt; B</div>');
  });

  test('renderDeck disables mermaid htmlLabels so text scales with the SVG viewBox', () => {
    // Mermaid's default htmlLabels renders node text via <foreignObject>,
    // which doesn't reliably rescale with the SVG's viewBox in Chrome's
    // print/headless-screenshot pipeline (PDF/PPTX export) - node boxes end
    // up correctly sized but the text inside stays tiny and looks clipped.
    const deck = {
      meta: { title: 'Deck', theme: 'light' },
      slides: [createSlide({ id: 'slide-1', content: [] })],
    };
    const html = renderDeck(deck);
    const initMatch = html.match(/mermaid\.initialize\(\{([\s\S]*?)\}\);/);
    expect(initMatch).not.toBeNull();
    const initCall = initMatch![1];
    expect(initCall).toContain('flowchart: { htmlLabels: false }');
    expect(initCall).toContain('class: { htmlLabels: false }');
    expect(initCall).toContain('state: { htmlLabels: false }');
  });

  test('nodeToHtml supports new animation types', () => {
    const img = createSlideNode({ type: 'image', url: 'foo.png', alt: 'bar' });

    const slideUpHtml = nodeToHtml(img, 'slide-up');
    expect(slideUpHtml).toContain('class="fragment"');
    expect(slideUpHtml).toContain('data-animation="slide-up"');

    const zoomHtml = nodeToHtml(img, 'zoom');
    expect(zoomHtml).toContain('class="fragment"');
    expect(zoomHtml).toContain('data-animation="zoom"');

    const slideLeftHtml = nodeToHtml(img, 'slide-left');
    expect(slideLeftHtml).toContain('class="fragment"');
    expect(slideLeftHtml).toContain('data-animation="slide-left"');

    const slideRightHtml = nodeToHtml(img, 'slide-right');
    expect(slideRightHtml).toContain('class="fragment"');
    expect(slideRightHtml).toContain('data-animation="slide-right"');
  });

  test('renderSlide supports custom fontSize attributes', () => {
    const slide = createSlide({
      id: 'slide-font-size',
      type: 'content',
      fontSize: 'sm',
      content: [
        createSlideNode({ type: 'paragraph', children: [{ type: 'text', value: 'Hello sm' }] }),
      ],
    });
    const html = renderSlide(slide);
    expect(html).toContain('data-font-size="sm"');
  });
});
