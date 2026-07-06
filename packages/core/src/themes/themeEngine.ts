import { BUILT_IN_THEMES } from './builtInThemes.js';

export const BUILT_IN_THEME_NAMES = Object.keys(BUILT_IN_THEMES) as Array<
  keyof typeof BUILT_IN_THEMES
>;

export class ThemeEngine {
  getBaseCSS(): string {
    return `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  font-size: 20px;
  height: 100%;
  width: 100%;
}

body {
  font-family: var(--slide-font, 'Inter', system-ui, sans-serif);
  background: var(--slide-bg);
  color: var(--slide-text);
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* Deck Container */
.deck {
  width: 1920px;
  height: 1080px;
  position: relative;
  transform-origin: center center;
  flex-shrink: 0;
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.25);
  background: var(--slide-bg);
  border-radius: var(--slide-radius, 12px);
  overflow: hidden;
}

/* Slide base */
.slide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  padding: 5.5rem 7.5rem;
  gap: 0;
  opacity: 0;
  pointer-events: none;
  transform: translateX(60px);
  transition:
    transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
    opacity   0.45s ease-out;
  overflow: hidden;
}

.slide.active {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
}

.slide.past {
  opacity: 0;
  pointer-events: none;
  transform: translateX(-60px);
}

/* Layout variants */
.slide[data-type="title"] {
  align-items: flex-start;
  justify-content: center;
  padding: 6.5rem 8.5rem;
}

.slide[data-type="statement"] {
  align-items: flex-start;
  text-align: left;
  justify-content: flex-start;
  padding: 6.5rem 9.5rem;
}

/* Title (h1 / h2 on title slides) */
.slideTitle {
  font-size: var(--title-size, 3.4rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: var(--slide-text);
  margin-bottom: 2.5rem;
  width: 100%;
  text-align: left;
}

.slide[data-type="title"] .slideTitle {
  text-align: center;
  width: 100%;
}

/* Title Slide positioning/alignment overrides */
.deck .slide[data-title-align="left"] {
  align-items: flex-start;
  text-align: left;
}
.deck .slide[data-title-align="left"] .slideTitle {
  text-align: left;
}
.deck .slide[data-title-align="left"] .slideTitle::after {
  margin-left: 0;
}

.deck .slide[data-title-align="center"] {
  align-items: center;
  text-align: center;
}
.deck .slide[data-title-align="center"] .slideTitle {
  text-align: center;
}
.deck .slide[data-title-align="center"] .slideTitle::after {
  margin-left: auto;
  margin-right: auto;
}

.deck .slide[data-title-align="right"] {
  align-items: flex-end;
  text-align: right;
}
.deck .slide[data-title-align="right"] .slideTitle {
  text-align: right;
}
.deck .slide[data-title-align="right"] .slideTitle::after {
  margin-left: auto;
  margin-right: 0;
}

.deck .slide[data-title-position="top"] {
  justify-content: flex-start;
}

.deck .slide[data-title-position="center"],
.deck .slide[data-title-position="middle"] {
  justify-content: center;
}

.deck .slide[data-title-position="bottom"] {
  justify-content: flex-end;
}

.deck .slide[data-title-position="bottom"] .slideContent,
.deck .slide[data-title-position="center"] .slideContent,
.deck .slide[data-title-position="middle"] .slideContent {
  flex: none;
}

/* Content area */
.slideContent {
  width: 100%;
  flex: 1;
  font-size: var(--body-size, 1.35rem);
  line-height: 1.8;
  color: var(--slide-text);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  overflow: hidden;
}

/* Headings inside content */
.slideContent h1 {
  font-size: var(--title-size, 3.4rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
  margin-bottom: 1.75rem;
}

.slideContent h2 {
  font-size: var(--h2-size, 2.6rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  color: var(--slide-text);
}

.slideContent h3 {
  font-size: var(--h3-size, 1.8rem);
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.25;
  margin-bottom: 1.25rem;
  color: var(--slide-muted);
}

.slideContent h4, .slideContent h5, .slideContent h6 {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
}

/* Paragraph */
.slideContent p {
  font-size: var(--body-size, 1.35rem);
  line-height: 1.75;
  margin-bottom: 1rem;
  max-width: 75ch;
}

.slide[data-type="statement"] .slideContent p {
  font-size: 2rem;
  line-height: 1.5;
  font-weight: 500;
  max-width: 65ch;
}

/* Lists */
.slideContent ul,
.slideContent ol {
  padding-left: 2.2rem;
  margin-bottom: 1rem;
  text-align: left;
}

.slideContent li {
  font-size: var(--li-size, 1.3rem);
  line-height: 1.6;
  margin-bottom: 0.8rem;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s ease, opacity 0.3s ease;
}

.slideContent li:hover {
  color: var(--slide-accent);
  transform: translateX(6px);
}

.slideContent li:last-child {
  margin-bottom: 0;
}

.slideContent li li {
  margin-bottom: 0.4rem;
}

.deck .slide[data-title-align="center"] .slideContent ul,
.deck .slide[data-title-align="center"] .slideContent ol {
  align-self: center;
  display: inline-block;
}

.slideContent li::marker {
  color: var(--slide-accent);
  font-weight: 600;
}

.slideContent ul li { list-style-type: disc; }
.slideContent ul li li { list-style-type: circle; font-size: 1.15rem; }
.slideContent ol li { list-style-type: decimal; }

/* Blockquote */
.slideContent blockquote {
  border-left: 6px solid var(--slide-accent);
  padding: 1.5rem 2.5rem;
  margin: 1rem 0;
  background: rgba(128,128,128,0.05);
  border-radius: 0 var(--slide-radius) var(--slide-radius) 0;
  font-size: 1.55rem;
  font-style: italic;
  line-height: 1.6;
  color: var(--slide-muted);
}

/* Code blocks */
.slideContent pre {
  background: rgba(0,0,0,0.05);
  border-radius: var(--slide-radius);
  padding: 1.5rem 2rem;
  overflow-x: auto;
  font-family: var(--slide-mono);
  font-size: var(--code-size, 1.05rem);
  line-height: 1.6;
  border: 1px solid var(--slide-border, rgba(0,0,0,0.08));
  width: 100%;
}

.slideContent code {
  font-family: var(--slide-mono);
  font-size: 0.875em;
  background: rgba(128,128,128,0.12);
  padding: 0.15em 0.4em;
  border-radius: 4px;
}

.slideContent pre code {
  background: none;
  padding: 0;
  font-size: 1em;
}

/* Strong / em */
.slideContent strong {
  font-weight: 700;
  color: var(--slide-text);
}

.slideContent em {
  font-style: italic;
  color: var(--slide-muted);
}

/* Links */
.slideContent a {
  color: var(--slide-accent);
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}

/* Tables */
.slideContent table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.slideContent th {
  font-weight: 600;
  font-size: 1rem;
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid var(--slide-accent);
  color: var(--slide-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.85rem;
}

.slideContent td {
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--slide-border, rgba(128,128,128,0.15));
  font-size: 1.1rem;
  line-height: 1.5;
}

.slideContent tr:last-child td { border-bottom: none; }
.slideContent tr:hover td { background: rgba(128,128,128,0.04); }

/* Images */
.slideContent img {
  max-width: 100%;
  max-height: 55vh;
  border-radius: var(--slide-radius);
  object-fit: contain;
  display: block;
}

/* Images extracted from list items rendered as a row below the list */
.inlineImageGrid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.25rem;
  width: 100%;
}

.inlineImageGrid img {
  flex: 1 1 0;
  min-width: 0;
  max-height: 34vh;
  width: auto;
  object-fit: cover;
  border-radius: var(--slide-radius);
  border: 1px solid var(--slide-border, rgba(128,128,128,0.12));
}

.slide[data-type="visual"] {
  align-items: flex-start;
  justify-content: flex-start;
}

.slide[data-type="visual"] .slideContent {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.slide[data-type="visual"] img {
  max-width: 100%;
  max-height: 72vh;
  object-fit: contain;
  border-radius: var(--slide-radius);
}

/* Refined Bullets Layout */
.slide[data-type="bullets"] .slideContent li {
  font-size: calc(var(--li-size, 1.3rem) * 1.05);
  margin-bottom: 1.1rem;
}

/* Refined Code Layout */
.slide[data-type="code"] .slideContent pre {
  border: 1px solid var(--slide-accent, rgba(128,128,128,0.2));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Refined Quote Layout */
.slide[data-type="quote"] .slideContent blockquote {
  border-left: 5px solid var(--slide-accent);
  background: var(--slide-surface, rgba(128, 128, 128, 0.04));
  padding: 1.75rem 2.5rem;
  font-size: 1.5rem;
  border-radius: var(--slide-radius);
}

/* Refined Table Layout */
.slide[data-type="table"] .slideContent table {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--slide-border, rgba(128, 128, 128, 0.15));
}

/* Split layout */
.splitLayout {
  display: flex;
  flex-direction: row;
  width: 100%;
  flex: 1;
  gap: 4rem;
  align-items: flex-start;
}

.splitColumn {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.splitColumn.textColumn {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1rem;
}

.splitColumn.imageColumn,
.splitColumn.rightColumn {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.splitColumn.imageColumn img {
  width: 100%;
  height: auto;
  max-height: 62vh;
  object-fit: cover;
  border-radius: var(--slide-radius);
}

/* Speaker notes */
.notes { display: none; }

/* Fragments */
.fragment {
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fragment.visible {
  opacity: 1;
}

/* Slide Up */
.fragment[data-animation="slide-up"] {
  transform: translateY(20px);
}
.fragment[data-animation="slide-up"].visible {
  transform: translateY(0);
}

/* Zoom */
.fragment[data-animation="zoom"] {
  transform: scale(0.92);
}
.fragment[data-animation="zoom"].visible {
  transform: scale(1);
}

/* Slide Left */
.fragment[data-animation="slide-left"] {
  transform: translateX(-20px);
}
.fragment[data-animation="slide-left"].visible {
  transform: translateX(0);
}

/* Slide Right */
.fragment[data-animation="slide-right"] {
  transform: translateX(20px);
}
.fragment[data-animation="slide-right"].visible {
  transform: translateX(0);
}

/* Font size controls */
.slide[data-font-size="xs"] {
  --title-size: 2.04rem;
  --h2-size: 1.82rem;
  --h3-size: 1.26rem;
  --body-size: 0.95rem;
  --li-size: 0.91rem;
  --code-size: 0.74rem;
}

.slide[data-font-size="sm"] {
  --title-size: 2.72rem;
  --h2-size: 2.21rem;
  --h3-size: 1.53rem;
  --body-size: 1.15rem;
  --li-size: 1.11rem;
  --code-size: 0.89rem;
}

.slide[data-font-size="lg"] {
  --title-size: 4.25rem;
  --h2-size: 3.00rem;
  --h3-size: 2.10rem;
  --body-size: 1.55rem;
  --li-size: 1.50rem;
  --code-size: 1.20rem;
}

.slide[data-font-size="xl"] {
  --title-size: 5.10rem;
  --h2-size: 3.25rem;
  --h3-size: 2.25rem;
  --body-size: 1.69rem;
  --li-size: 1.63rem;
  --code-size: 1.31rem;
}

.slide[data-font-size="xxl"] {
  --title-size: 6.12rem;
  --h2-size: 3.51rem;
  --h3-size: 2.43rem;
  --body-size: 1.82rem;
  --li-size: 1.76rem;
  --code-size: 1.42rem;
}

/* Progress bar */
.progressBarContainer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: var(--progress-bg, rgba(0,0,0,0.06));
  z-index: 200;
}

.progressBar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--slide-accent), #f43f5e);
  box-shadow: 0 0 10px var(--slide-accent);
  transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

/* DOK control bar */
.dokContainer {
  position: fixed;
  bottom: 1.75rem;
  left: 50%;
  transform: translateX(-50%) translateY(72px);
  background: var(--dok-bg, rgba(255,255,255,0.88));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--dok-border, rgba(0,0,0,0.08));
  border-radius: 100px;
  padding: 0.5rem 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 199;
  opacity: 0;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  transition:
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    opacity   0.35s ease-out;
}

[data-theme="dark"] .dokContainer,
[data-theme="terminal"] .dokContainer,
[data-theme="gradient"] .dokContainer {
  background: var(--dok-bg, rgba(24,24,27,0.85));
  border: 1px solid var(--dok-border, rgba(255,255,255,0.08));
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

body.showDok .dokContainer,
.dokContainer:hover {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.dokBtn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--slide-text);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.65;
  transition: background 0.2s, opacity 0.2s, transform 0.2s;
  flex-shrink: 0;
}

.dokBtn:hover {
  background: rgba(128,128,128,0.12);
  opacity: 1;
  transform: scale(1.1);
}

.dokBtn:active {
  transform: scale(0.95);
}

.dokCounter {
  font-family: var(--slide-mono);
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0 0.625rem;
  color: var(--slide-text);
  opacity: 0.8;
  min-width: 3.5rem;
  text-align: center;
}

/* Keyboard Shortcut Help Modal */
.helpModal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.helpModal.visible {
  opacity: 1;
  pointer-events: auto;
}

.helpModalContent {
  background: var(--slide-surface, #ffffff);
  border: 1px solid var(--slide-border, rgba(0,0,0,0.1));
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  transform: scale(0.9) translateY(10px);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  color: var(--slide-text);
}

[data-theme="dark"] .helpModalContent,
[data-theme="terminal"] .helpModalContent,
[data-theme="gradient"] .helpModalContent {
  background: var(--slide-surface, #1e1e24);
  border-color: rgba(255,255,255,0.08);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

.helpModal.visible .helpModalContent {
  transform: scale(1) translateY(0);
}

.helpModalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--slide-border, rgba(0,0,0,0.06));
}

[data-theme="dark"] .helpModalHeader,
[data-theme="terminal"] .helpModalHeader,
[data-theme="gradient"] .helpModalHeader {
  border-bottom-color: rgba(255,255,255,0.06);
}

.helpModalHeader h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.closeHelpModalBtn {
  background: transparent;
  border: none;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  color: var(--slide-muted, #71717a);
  transition: color 0.15s;
}

.closeHelpModalBtn:hover {
  color: var(--slide-accent);
}

.helpModalBody {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.shortcutRow {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
}

.shortcutRow span:last-child {
  margin-left: auto;
  color: var(--slide-muted, #71717a);
}

.key {
  background: rgba(128,128,128,0.12);
  border: 1px solid rgba(128,128,128,0.22);
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-family: var(--slide-mono, monospace);
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 2px 0 rgba(0,0,0,0.08);
  margin-right: 0.35rem;
  color: var(--slide-text);
}

/* Print PDF */
@media print {
  @page { size: 1920px 1080px; margin: 0; }

  body {
    background: var(--slide-bg) !important;
    color: var(--slide-text) !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    overflow: visible !important;
    height: auto !important;
    display: block !important;
  }

  .deck {
    width: 1920px !important;
    height: 1080px !important;
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
    margin: 0 !important;
    border: none !important;
  }

  body .dokContainer, body .progressBarContainer { display: none; }

  .fragment {
    opacity: 1 !important;
  }
}

/* Fullscreen mode styling */
body.mdslide-fullscreen {
  background-color: var(--slide-bg);
}

body.mdslide-fullscreen .deck {
  border-radius: 0 !important;
  box-shadow: none !important;
}

body.mdslide-fullscreen,
body.mdslide-fullscreen * {
  -webkit-text-size-adjust: 100% !important;
  text-size-adjust: 100% !important;
}
`;
  }

  resolveTheme(themeName: string): string {
    return BUILT_IN_THEMES[themeName] ?? themeName;
  }
}
