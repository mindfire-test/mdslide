import type { SlideNode } from '@mindfiredigital/mdslide-shared';
import { isVideoUrl } from '@mindfiredigital/mdslide-core';
import { codeToTokensBase } from 'shiki';
import { FlatListLine, PptxTheme } from '../../types/index.js';
import { BULLET_CHARS } from '../../constants/exports/pptxConstants.js';
import path from 'path';

// Recursively extract text from SlideNode into pptx array
function nodeToTextProps(node: SlideNode, theme: PptxTheme): any[] {
  const props: any[] = [];

  const fontOptions = {
    fontFace: theme.font,
    color: theme.text,
  };

  if (node.type === 'text') {
    props.push({
      text: node.value || '',
      options: { ...fontOptions },
    });
  } else if (node.type === 'strong') {
    if (node.children) {
      node.children.forEach((c) => {
        const childProps = nodeToTextProps(c, theme);
        childProps.forEach((cp) => {
          cp.options = { ...cp.options, bold: true };
          props.push(cp);
        });
      });
    }
  } else if (node.type === 'emphasis') {
    if (node.children) {
      node.children.forEach((c) => {
        const childProps = nodeToTextProps(c, theme);
        childProps.forEach((cp) => {
          cp.options = { ...cp.options, italic: true };
          props.push(cp);
        });
      });
    }
  } else if (node.type === 'inlineCode') {
    props.push({
      text: node.value || '',
      options: {
        ...fontOptions,
        fontFace: 'Courier New',
        color: theme.accent,
      },
    });
  } else if (node.type === 'link') {
    const textVal = node.children
      ? node.children.map((c) => c.value || '').join('')
      : node.value || 'Link';
    props.push({
      text: textVal,
      options: {
        ...fontOptions,
        color: theme.accent,
        hyperlink: { url: node.url || '' },
      },
    });
  } else if (node.type === 'inlineMath') {
    // Approximated as italicized source text - pptxgenjs text runs can't
    // splice in a per-formula image, and rasterizing one image per inline
    // formula isn't worth the complexity. Block/display math ($$...$$)
    // gets full KaTeX-rendered image treatment instead - see
    // pptxBlockLayout.ts's renderMathBlock.
    props.push({
      text: node.value || '',
      options: { ...fontOptions, italic: true, fontFace: 'Courier New' },
    });
  } else if (node.children) {
    node.children.forEach((c) => {
      props.push(...nodeToTextProps(c, theme));
    });
  }

  return props;
}

// Recursively extract text from SlideNode into a plain string
function nodeToPlainText(node: SlideNode): string {
  if (node.value) return node.value;
  if (node.children) {
    return node.children.map(nodeToPlainText).join('');
  }
  return '';
}

// Recursively find all image URLs inside a slide
function findImagesInNodes(nodes: SlideNode[]): string[] {
  const urls: string[] = [];
  function traverse(n: SlideNode) {
    if (n.type === 'image' && n.url) {
      urls.push(n.url);
    }
    if (n.children) {
      n.children.forEach(traverse);
    }
  }
  nodes.forEach(traverse);
  return urls;
}

// Resolve image path relative to markdown baseDir if it is a local file
function resolveImagePath(imgUrl: string, baseDir?: string): string {
  if (!imgUrl) return '';
  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
    return imgUrl;
  }
  if (path.isAbsolute(imgUrl)) {
    return imgUrl;
  }
  if (baseDir) {
    return path.resolve(baseDir, imgUrl);
  }
  return path.resolve(imgUrl);
}

function addImageOrVideo(
  pptxSlide: any,
  url: string,
  baseDir: string | undefined,
  bounds: { x: number; y: number; w: number; h: number },
  imageFit?: 'contain' | 'cover'
): void {
  const resolvedPath = resolveImagePath(url, baseDir);
  if (isVideoUrl(url)) {
    pptxSlide.addMedia({ type: 'video', path: resolvedPath, ...bounds });
  } else {
    const sizing = imageFit ? { type: imageFit, w: bounds.w, h: bounds.h } : undefined;
    pptxSlide.addImage({ path: resolvedPath, ...bounds, ...(sizing ? { sizing } : {}) });
  }
}

function getBulletCharCode(indent: number): string {
  return BULLET_CHARS[indent] ?? BULLET_CHARS[2];
}

// Font size shrinks slightly at deeper indent levels, floored at 10pt
function getBulletFontSize(baseFontSize: number, indent: number): number {
  return Math.max(baseFontSize - indent * 1.5, 10);
}

function extractFlatListLines(node: SlideNode, theme: PptxTheme, indent = 0): FlatListLine[] {
  const lines: FlatListLine[] = [];

  if (node.type === 'list') {
    let numberIndex = 0;
    if (node.children) {
      node.children.forEach((item) => {
        if (item.type === 'listItem' && item.children) {
          const itemText: any[] = [];
          const nestedLists: SlideNode[] = [];

          item.children.forEach((c) => {
            if (c.type === 'list') {
              nestedLists.push(c);
            } else {
              itemText.push(...nodeToTextProps(c, theme));
            }
          });

          if (itemText.length > 0) {
            numberIndex += 1;
            lines.push({
              text: itemText,
              bullet: true,
              indent,
              ordered: !!node.ordered,
              numberIndex,
            });
          }

          nestedLists.forEach((l) => {
            lines.push(...extractFlatListLines(l, theme, indent + 1));
          });
        }
      });
    }
  }

  return lines;
}

function pushParagraphNodeToRuns(
  node: SlideNode,
  runsArray: any[],
  theme: PptxTheme,
  fontSize: number,
  isLastNode: boolean
) {
  const runs = nodeToTextProps(node, theme);
  runs.forEach((run, runIdx) => {
    const isLastRun = runIdx === runs.length - 1;

    const runOptions: any = {
      fontFace: theme.font,
      color: theme.text,
      ...run.options,
      fontSize,
    };
    if (isLastRun && !isLastNode) {
      runOptions.breakLine = true;
    }
    runsArray.push({ text: run.text, options: runOptions });
  });
}

function pushListLinesToRuns(
  listLines: FlatListLine[],
  runsArray: any[],
  theme: PptxTheme,
  baseFontSize: number,
  _isLastNode: boolean
) {
  listLines.forEach((line) => {
    if (line.text.length === 0) return;

    const fontSize = getBulletFontSize(baseFontSize, line.indent);

    line.text.forEach((run, runIdx) => {
      const isFirstRun = runIdx === 0;

      const runOptions: any = {
        fontFace: theme.font,
        color: theme.text,
        ...run.options,
        fontSize,
      };

      if (isFirstRun) {
        runOptions.bullet = line.ordered
          ? { type: 'number', numberType: 'arabicPeriod', numberStartAt: line.numberIndex }
          : { characterCode: getBulletCharCode(line.indent) };
        runOptions.indentLevel = line.indent;
      }

      runsArray.push({ text: run.text, options: runOptions });
    });
  });
}

const SHIKI_LIGHT_THEME = 'github-light';
const SHIKI_DARK_THEME = 'github-dark';

async function highlightCodeToRuns(
  code: string,
  lang: string,
  theme: PptxTheme,
  fontSize: number,
  isDarkTheme: boolean
): Promise<any[]> {
  if (!code) return [];

  const flat = () => [
    { text: code, options: { fontFace: 'Courier New', color: theme.text, fontSize } },
  ];
  if (!lang) return flat();

  try {
    const shikiTheme = isDarkTheme ? SHIKI_DARK_THEME : SHIKI_LIGHT_THEME;
    const lines = await codeToTokensBase(code, { lang: lang as any, theme: shikiTheme });
    const runs: any[] = [];

    lines.forEach((lineTokens, lineIdx) => {
      const isLastLine = lineIdx === lines.length - 1;
      if (lineTokens.length === 0) {
        runs.push({
          text: '',
          options: { fontFace: 'Courier New', fontSize, breakLine: !isLastLine },
        });
        return;
      }
      lineTokens.forEach((token, tokenIdx) => {
        const isLastToken = tokenIdx === lineTokens.length - 1;
        const fontStyle = (token as any).fontStyle ?? 0;
        runs.push({
          text: token.content,
          options: {
            fontFace: 'Courier New',
            fontSize,
            color: (token.color ?? theme.text).replace('#', ''),
            italic: (fontStyle & 1) !== 0,
            bold: (fontStyle & 2) !== 0,
            breakLine: isLastToken && !isLastLine,
          },
        });
      });
    });

    return runs;
  } catch {
    return flat();
  }
}

export {
  nodeToPlainText,
  nodeToTextProps,
  findImagesInNodes,
  resolveImagePath,
  addImageOrVideo,
  extractFlatListLines,
  pushParagraphNodeToRuns,
  pushListLinesToRuns,
  highlightCodeToRuns,
};
