import type { SlideNode, Slide } from '@mindfiredigital/mdslide-shared';

// Factory function to create slide node
export function createSlideNode(partial: Partial<SlideNode> & { type: string }): SlideNode {
  return {
    type: partial.type,
    value: partial.value,
    children: partial.children,
    lang: partial.lang,
    ordered: partial.ordered,
    url: partial.url,
    alt: partial.alt,
    header: partial.header,
    depth: partial.depth,
    ratio: partial.ratio,
    layout: partial.layout,
    admonition: partial.admonition,
    chart: partial.chart,
  };
}

// Factor function to create slide's
export function createSlide(partial: Partial<Slide>): Slide {
  return {
    id: partial.id ?? globalThis.crypto.randomUUID(),
    type: partial.type ?? 'content',
    content: partial.content ?? [],
    notes: partial.notes,
    title: partial.title,
    layoutOverride: partial.layoutOverride,
    backgroundImage: partial.backgroundImage,
    titleAlign: partial.titleAlign,
    titlePosition: partial.titlePosition,
    overflow: partial.overflow,
    animation: partial.animation,
    fontSize: partial.fontSize,
    align: partial.align,
    columnsConfig: partial.columnsConfig,
    imageFit: partial.imageFit,
    imagePosition: partial.imagePosition,
    accentColor: partial.accentColor,
  };
}
