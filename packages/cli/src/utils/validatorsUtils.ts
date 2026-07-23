function absoluteLine(slideStartLine: number, localIndex: number): number {
  return slideStartLine + localIndex;
}

function splitSlideChunks(text: string): { chunks: string[]; separators: string[] } {
  const parts = text.split(/\n(---|<!--\s*slide\s*-->)\n/i);
  const chunks: string[] = [];
  const separators: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      chunks.push(parts[i]!);
    } else {
      separators.push(parts[i]!);
    }
  }
  return { chunks, separators };
}

export { absoluteLine, splitSlideChunks };
