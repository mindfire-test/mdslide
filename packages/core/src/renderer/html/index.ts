import type { SlideDeck } from '@mindfiredigital/mdslide-shared';
import { renderSlide, type FragmentCounter } from './renderSlide.js';
import { sanitizeHtml, sanitizeUrl } from '../../utils/html.js';
import { script } from './script.js';
import { RenderDeckOptions } from '../../interfaces/index.js';
import { DEFAULT_THEME, DEFAULT_TITLE, DEFAULT_ASSET_URLS } from '../../constants/index.js';
import { ThemeEngine } from '../../themes/themeEngine.js';
export * from './renderSlide.js';
export * from './renderChart.js';
export * from './renderStatsGrid.js';

export function renderDeck(deck: SlideDeck, options: RenderDeckOptions = {}): string {
  const themeEngine = new ThemeEngine();

  const theme = options.theme ?? String(deck.meta?.theme ?? DEFAULT_THEME);
  const title = String(deck.meta?.title ?? DEFAULT_TITLE);
  // One counter shared across the deck keeps fragment ids unique within this
  // document, without leaking state into the next compile (see FragmentCounter).
  const fragmentCounter: FragmentCounter = { value: 0 };
  const slidesHtml = deck.slides.map((slide) => renderSlide(slide, fragmentCounter)).join('\n');

  const isDarkTheme = ['dark', 'terminal', 'gradient'].includes(theme);

  const assetUrls = { ...DEFAULT_ASSET_URLS, ...options.assetUrls };
  const urls = {
    prismCss: sanitizeUrl(isDarkTheme ? assetUrls.prismCssDark : assetUrls.prismCssLight),
    prismLineNumbersCss: sanitizeUrl(assetUrls.prismLineNumbersCss),
    katexCss: sanitizeUrl(assetUrls.katexCss),
    prismCoreJs: sanitizeUrl(assetUrls.prismCoreJs),
    prismAutoloaderJs: sanitizeUrl(assetUrls.prismAutoloaderJs),
    prismLineNumbersJs: sanitizeUrl(assetUrls.prismLineNumbersJs),
    mermaidJs: JSON.stringify(assetUrls.mermaidJs).replace(/</g, '\\u003C'),
  };

  return `<!DOCTYPE html>
<html lang="en" data-theme="${sanitizeHtml(theme)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${sanitizeHtml(title)}</title>
  <style id="mdslideBase">${themeEngine.getBaseCSS()}</style>
  <style id="mdslideTheme">${themeEngine.resolveTheme(theme)}</style>
  <link rel="stylesheet" href="${urls.prismCss}" />
  <link rel="stylesheet" href="${urls.prismLineNumbersCss}" />
  <link rel="stylesheet" href="${urls.katexCss}" />
  <style>
    /* Custom Prism overrides to match slide styling perfectly */
    pre[class*="language-"] {
      margin: 0;
      padding: 1.25rem 1.5rem !important;
      background: rgba(0, 0, 0, 0.04) !important;
      border-radius: var(--slide-radius);
      border: 1px solid rgba(0, 0, 0, 0.08) !important;
    }
    
    [data-theme="dark"] pre[class*="language-"],
    [data-theme="terminal"] pre[class*="language-"],
    [data-theme="gradient"] pre[class*="language-"] {
      background: rgba(255, 255, 255, 0.05) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }

    :not(pre) > code {
      font-family: var(--slide-mono) !important;
      font-size: 0.9em !important;
      background: rgba(0, 0, 0, 0.06);
      color: var(--slide-text) !important;
      padding: 0.15em 0.35em;
      border-radius: 4px;
      border: 1px solid rgba(0, 0, 0, 0.04);
    }
    
    [data-theme="dark"] :not(pre) > code,
    [data-theme="terminal"] :not(pre) > code,
    [data-theme="gradient"] :not(pre) > code {
      background: rgba(255, 255, 255, 0.08);
      color: var(--slide-text) !important;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    pre code[class*="language-"] {
      font-family: var(--slide-mono) !important;
      text-shadow: none !important;
      font-size: 0.9rem !important;
    }
    
    .line-numbers-rows {
      border-right: 1px solid rgba(0,0,0,0.1) !important;
      padding: 1.25rem 0 !important;
    }
    
    [data-theme="dark"] .line-numbers-rows,
    [data-theme="terminal"] .line-numbers-rows,
    [data-theme="gradient"] .line-numbers-rows {
      border-right: 1px solid rgba(255,255,255,0.15) !important;
    }

    .mermaid {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      margin: 1.5rem 0;
      background: transparent !important;
    }

    .mermaid svg {
      max-width: 100% !important;
      max-height: var(--mermaid-max-h, 55vh) !important;
      height: auto !important;
    }

    .bgImageDark,
    .bgImageDark p,
    .bgImageDark li,
    .bgImageDark h1,
    .bgImageDark h2,
    .bgImageDark h3,
    .bgImageDark h4,
    .bgImageDark h5,
    .bgImageDark h6,
    .bgImageDark span,
    .bgImageDark strong,
    .bgImageDark em,
    .bgImageDark td,
    .bgImageDark th {
      color: #fafafa !important;
      -webkit-text-fill-color: #fafafa !important;
      text-shadow: 0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5) !important;
    }
    .bgImageDark blockquote {
      border-left-color: rgba(255,255,255,0.4) !important;
      background: rgba(0,0,0,0.3) !important;
    }

    .bgImageLight,
    .bgImageLight p,
    .bgImageLight li,
    .bgImageLight h1,
    .bgImageLight h2,
    .bgImageLight h3,
    .bgImageLight h4,
    .bgImageLight h5,
    .bgImageLight h6,
    .bgImageLight span,
    .bgImageLight strong,
    .bgImageLight em,
    .bgImageLight td,
    .bgImageLight th {
      color: #18181b !important;
      -webkit-text-fill-color: #18181b !important;
      text-shadow: 0 1px 2px rgba(255,255,255,0.8) !important;
    }
    .bgImageLight blockquote {
      border-left-color: rgba(0,0,0,0.2) !important;
      background: rgba(255,255,255,0.3) !important;
    }

    @media print {
      @page {
        size: 1920px 1080px;
        margin: 0;
      }
      body {
        background: var(--slide-bg) !important;
        color: var(--slide-text) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        overflow: visible !important;
        height: auto !important;
      }
      .deck {
        width: 1920px !important;
        height: auto !important;
        transform: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        overflow: visible !important;
        margin: 0 !important;
        position: relative !important;
        left: auto !important;
        top: auto !important;
        margin-left: 0 !important;
        margin-top: 0 !important;
      }
      .slide {
        position: relative !important;
        display: flex !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        transform: none !important;
        page-break-after: always !important;
        break-after: page !important;
        height: 1080px !important;
        width: 1920px !important;
        box-shadow: none !important;
        margin: 0 !important;
        border: none !important;
        float: none !important;
      }
      .dokContainer,
      .progressBarContainer {
        display: none !important;
      }
      .fragment {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
        animation: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="deck">
${slidesHtml}
  </div>

  <!-- Progress Bar -->
  <div class="progressBarContainer">
    <div id="progressBar" class="progressBar"></div>
  </div>

  <!-- DOK Control bar -->
  <div class="dokContainer">
    <button id="dokPrev" class="dokBtn" title="Previous Slide (&larr;)">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
    <span id="dokCounter" class="dokCounter">1 / 1</span>
    <button id="dokNext" class="dokBtn" title="Next Slide (Space / &rarr;)">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>

    <button id="dokPresenter" class="dokBtn" title="Presenter Console (P)">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
    </button>
    
    <button id="dokFullscreen" class="dokBtn" title="Fullscreen (F)">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
    </button>
  </div>

  <!-- Keyboard Shortcut Help Modal -->
  <div id="helpModal" class="helpModal">
    <div class="helpModalContent">
      <div class="helpModalHeader">
        <h3>Keyboard Shortcuts</h3>
        <button id="closeHelpModal" class="closeHelpModalBtn">&times;</button>
      </div>
      <div class="helpModalBody">
        <div class="shortcutRow"><span><span class="key">Space</span> / <span class="key">&rarr;</span></span><span>Next Slide / Fragment</span></div>
        <div class="shortcutRow"><span><span class="key">&larr;</span></span><span>Previous Slide / Fragment</span></div>
        <div class="shortcutRow"><span><span class="key">F</span></span><span>Toggle Fullscreen</span></div>
        <div class="shortcutRow"><span><span class="key">P</span></span><span>Toggle Presenter Console</span></div>
        <div class="shortcutRow"><span><span class="key">?</span></span><span>Show / Hide Shortcut Guide</span></div>
      </div>
    </div>
  </div>

  <script src="${urls.prismCoreJs}"></script>
  <script src="${urls.prismAutoloaderJs}"></script>
  <script src="${urls.prismLineNumbersJs}"></script>
  <!-- Mermaid Support -->
  <script type="module">
    import mermaid from ${urls.mermaidJs};
    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.getAttribute('data-theme') === 'dark' ||
             document.documentElement.getAttribute('data-theme') === 'terminal' ||
             document.documentElement.getAttribute('data-theme') === 'gradient'
             ? 'dark' : 'default',
      // Render labels as native SVG <text> instead of HTML <foreignObject>.
      // foreignObject content doesn't reliably rescale with the SVG's
      // viewBox in Chrome's print/headless-screenshot pipeline, which is
      // how PDF/PPTX export renders slides   with htmlLabels on, the node
      // boxes scale up correctly but the text inside stays tiny and
      // appears clipped.
      flowchart: { htmlLabels: false },
      class: { htmlLabels: false },
      state: { htmlLabels: false },
    });
    // startOnLoad is off so we can run diagrams manually and only THEN
    // measure/autofit slide content   diagram size is otherwise unknown
    // until mermaid finishes its own layout pass, and running autofit
    // before that would size text against a not-yet-rendered diagram.
    try {
      await mermaid.run();
    } catch (err) {
      console.error('[mdslide] mermaid render failed', err);
    }
    if (window.__mdslideAutofit) window.__mdslideAutofit();
  </script>
  ${script}
</body>
</html>`;
}
