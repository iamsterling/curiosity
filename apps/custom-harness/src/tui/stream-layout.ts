import { sanitizeConversationText } from "./terminal-text.js";

const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export interface StreamLayoutMetrics {
  readonly processedGraphemes: number;
  readonly rebuilds: number;
}

export interface StreamTextLayout {
  readonly append: (delta: string) => void;
  readonly lines: (width: number) => readonly string[];
  readonly metrics: () => StreamLayoutMetrics;
}

export const createStreamTextLayout = (): StreamTextLayout => {
  const chunks: string[] = [];
  const renderedLines: string[] = [];
  let cachedWidth: number | undefined;
  let currentLineWidth = 0;
  let processedChunks = 0;
  let processedGraphemes = 0;
  let rebuilds = 0;

  const appendChunk = (chunk: string, width: number): void => {
    if (renderedLines.length === 0) renderedLines.push("");
    for (const { segment } of graphemes.segment(chunk)) {
      processedGraphemes += 1;
      if (segment === "\n") {
        renderedLines.push("");
        currentLineWidth = 0;
        continue;
      }
      const segmentWidth = Bun.stringWidth(segment);
      if (currentLineWidth > 0 && currentLineWidth + segmentWidth > width) {
        renderedLines.push(segment);
        currentLineWidth = segmentWidth;
        continue;
      }
      renderedLines[renderedLines.length - 1] += segment;
      currentLineWidth += segmentWidth;
    }
  };

  const layout = (width: number): readonly string[] => {
    const normalizedWidth = Math.max(1, width);
    if (cachedWidth !== normalizedWidth) {
      cachedWidth = normalizedWidth;
      renderedLines.length = 0;
      currentLineWidth = 0;
      processedChunks = 0;
      rebuilds += 1;
    }
    while (processedChunks < chunks.length) {
      appendChunk(chunks[processedChunks]!, normalizedWidth);
      processedChunks += 1;
    }
    return renderedLines;
  };

  return Object.freeze({
    append: (delta: string): void => {
      if (!delta) return;
      chunks.push(sanitizeConversationText(delta));
    },
    lines: layout,
    metrics: (): StreamLayoutMetrics =>
      Object.freeze({ processedGraphemes, rebuilds }),
  });
};
