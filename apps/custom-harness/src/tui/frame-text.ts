import { stripVTControlCharacters } from "node:util";
import { sanitizeConversationText } from "./terminal-text.js";
import type { TerminalTheme } from "./theme.js";

const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export const visibleWidth = (value: string): number =>
  Bun.stringWidth(stripVTControlCharacters(value));

export const clip = (value: string, width: number): string => {
  let result = "";
  let used = 0;
  for (const { segment } of graphemes.segment(value)) {
    const segmentWidth = Bun.stringWidth(segment);
    if (used + segmentWidth > Math.max(0, width)) break;
    result += segment;
    used += segmentWidth;
  }
  return result;
};

export const padPlain = (value: string, width: number): string => {
  const clipped = clip(value, width);
  return `${clipped}${" ".repeat(Math.max(0, width - visibleWidth(clipped)))}`;
};

export const fitLine = (
  value: string,
  width: number,
  theme: TerminalTheme,
): string => {
  const current = visibleWidth(value);
  if (current > width)
    return `${theme.base}${padPlain(stripVTControlCharacters(value), width)}${theme.reset}`;
  return `${theme.base}${value}${" ".repeat(width - current)}${theme.reset}`;
};

export const place = (column: number, value: string): string =>
  `${" ".repeat(Math.max(0, column))}${value}`;

export const setLine = (lines: string[], row: number, value: string): void => {
  if (row >= 0 && row < lines.length) lines[row] = value;
};

export const wrapPlain = (value: string, width: number): readonly string[] =>
  sanitizeConversationText(value)
    .split("\n")
    .flatMap((source) => {
      if (!source) return [""];
      const wrapped: string[] = [];
      let remaining = source;
      while (remaining) {
        const line = clip(remaining, width);
        wrapped.push(line);
        remaining = remaining.slice(line.length);
      }
      return wrapped;
    });

export const modelParts = (
  modelId: string,
): { readonly model: string; readonly provider: string } => {
  const separator = modelId.indexOf(":");
  if (separator < 0) return { model: modelId, provider: "custom" };
  return {
    model: modelId.slice(separator + 1),
    provider: modelId.slice(0, separator),
  };
};
