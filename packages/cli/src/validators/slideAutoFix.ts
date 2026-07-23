export function fixSlideText(slideText: string): { text: string; fixed: string[] } {
  const fixed: string[] = [];

  const lines = slideText.split('\n');
  const keptLines: string[] = [];
  let isInsideNotes = false;
  let strayRemoved = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '<!-- notes -->') {
      isInsideNotes = true;
      keptLines.push(line);
    } else if (trimmed === '<!-- /notes -->') {
      if (!isInsideNotes) {
        strayRemoved = true;
        continue;
      }
      isInsideNotes = false;
      keptLines.push(line);
    } else {
      keptLines.push(line);
    }
  }
  if (strayRemoved) fixed.push('Removed stray closing notes tag (<!-- /notes -->).');

  let text = keptLines.join('\n');

  if (isInsideNotes) {
    text = `${text}\n<!-- /notes -->`;
    fixed.push('Closed an unclosed notes block.');
  }

  const fenceCount = (text.match(/^```/gm) ?? []).length;
  if (fenceCount % 2 !== 0) {
    text = `${text}\n\`\`\``;
    fixed.push('Closed an unclosed code fence.');
  }

  return { text, fixed };
}
