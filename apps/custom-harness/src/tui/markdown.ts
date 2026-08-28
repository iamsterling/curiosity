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
  const boldFocus = (value: string): string =>
    options.theme.bold(options.theme.focus(value));
  const boldPlugin = (value: string): string =>
    options.theme.bold(options.theme.plugin(value));
  const emphasized = (value: string): string =>
    options.theme.italic(options.theme.secondary(value));
  const strong = (value: string): string =>
    options.theme.bold(options.theme.warning(value));
  const deleted = (value: string): string =>
    options.theme.strike(options.theme.danger(value));
  const parser = new Marked(
    markedTerminal({
      blockquote: options.theme.plugin,
      code: options.theme.code,
      codespan: options.theme.code,
      del: deleted,
      em: emphasized,
      emoji: false,
      firstHeading: boldFocus,
      heading: boldPlugin,
      href: options.theme.link,
      hr: options.theme.muted,
      html: options.theme.muted,
      link: options.theme.link,
      listitem: options.theme.success,
      paragraph: plain,
      reflowText: true,
      showSectionPrefix: false,
      strong,
      tab: 2,
      table: options.theme.secondary,
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
