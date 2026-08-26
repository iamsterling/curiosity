import { Marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { sanitizeConversationText } from "./terminal-text.js";
import type { TerminalTheme } from "./theme.js";

export interface MarkdownRenderOptions {
  readonly theme: TerminalTheme;
  readonly width: number;
}

export const renderMarkdown = (
  source: string,
  options: MarkdownRenderOptions,
): string => {
  const safeSource = sanitizeConversationText(source);
  const plain = (value: string): string => value;
  const parser = new Marked(
    markedTerminal({
      blockquote: options.theme.muted,
      code: options.theme.code,
      codespan: options.theme.code,
      del: options.theme.muted,
      em: plain,
      emoji: false,
      firstHeading: options.theme.heading,
      heading: options.theme.heading,
      href: options.theme.link,
      hr: options.theme.muted,
      html: options.theme.muted,
      link: options.theme.link,
      listitem: plain,
      paragraph: plain,
      reflowText: true,
      showSectionPrefix: false,
      strong: options.theme.bold,
      tab: 2,
      table: plain,
      text: plain,
      unescape: true,
      width: Math.max(24, Math.min(options.width, 100)),
    }),
  );
  try {
    const rendered = parser.parse(safeSource, { async: false });
    return typeof rendered === "string" ? rendered.trimEnd() : safeSource;
  } catch {
    return safeSource;
  }
};
