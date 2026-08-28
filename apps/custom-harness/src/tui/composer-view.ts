import type { TuiFrameState } from "./frame-types.js";
import { clip, modelParts, visibleWidth } from "./frame-text.js";
import { sanitizeTerminalText } from "./terminal-text.js";
import type { TerminalTheme } from "./theme.js";
import { TUI_DESIGN_TOKENS } from "./design-system.js";

export const LOGO = ["C U R I O S I T Y"] as const;

export interface ComposerView {
  readonly cursorColumn?: number;
  readonly cursorRow?: number;
  readonly lines: readonly string[];
}

const inputRows = (
  input: string,
  inputCursor: number,
  width: number,
): {
  readonly cursorColumn: number;
  readonly cursorRow: number;
  readonly lines: readonly string[];
} => {
  const characters = Array.from(input);
  const cursor = Math.min(inputCursor, characters.length);
  const lines: string[] = [];
  let current = "";
  let cursorColumn = 0;
  let cursorRow = 0;
  for (let index = 0; index <= characters.length; index += 1) {
    if (index === cursor) {
      cursorColumn = visibleWidth(current);
      cursorRow = lines.length;
    }
    if (index === characters.length) break;
    const character = characters[index] ?? "";
    if (character === "\n") {
      lines.push(current);
      current = "";
      continue;
    }
    if (visibleWidth(current) + visibleWidth(character) > width) {
      lines.push(current);
      current = "";
      if (index === cursor) {
        cursorColumn = 0;
        cursorRow = lines.length;
      }
    }
    current += character;
  }
  lines.push(current);
  return { cursorColumn, cursorRow, lines };
};

export const renderComposer = (
  state: TuiFrameState,
  width: number,
  compact: boolean,
  theme: TerminalTheme,
): ComposerView => {
  const inputWidth = Math.max(1, width - 2);
  const input = inputRows(state.input, state.inputCursor, inputWidth);
  const maxRows = compact ? 3 : 6;
  const firstRow = Math.min(
    Math.max(0, input.cursorRow - maxRows + 1),
    Math.max(0, input.lines.length - maxRows),
  );
  const visibleRows = input.lines.slice(firstRow, firstRow + maxRows);
  const prompt = state.status === "working" ? theme.activity : theme.focus;
  const body = state.input
    ? visibleRows.map(
        (line, index) =>
          `${index === 0 ? prompt("›") : " "} ${theme.text(line)}`,
      )
    : [`${prompt("›")} ${theme.muted("Ask Curiosity…")}`];
  return {
    ...(state.status === "idle"
      ? {
          cursorColumn: 2 + input.cursorColumn,
          cursorRow: input.cursorRow - firstRow,
        }
      : {}),
    lines: body,
  };
};

export const renderLogoLine = (line: string, theme: TerminalTheme): string => {
  return theme.heading(line);
};

export const renderHeader = (
  state: TuiFrameState,
  width: number,
  theme: TerminalTheme,
): string => {
  const left = `${TUI_DESIGN_TOKENS.glyph.plugin} curiosity`;
  const { model } = modelParts(state.modelId);
  const metadata = [
    sanitizeTerminalText(state.actorId ?? "local-owner"),
    sanitizeTerminalText(width < 80 ? model : state.modelId),
    sanitizeTerminalText(state.effort),
  ].join("  ");
  const right = clip(metadata, Math.max(0, width - visibleWidth(left) - 2));
  const gap = " ".repeat(
    Math.max(1, width - visibleWidth(left) - visibleWidth(right)),
  );
  return `${theme.plugin(TUI_DESIGN_TOKENS.glyph.plugin)}${theme.heading(" curiosity")}${theme.muted(gap)}${theme.secondary(right)}`;
};

export const renderIdleStatus = (
  _state: TuiFrameState,
  theme: TerminalTheme,
): string => {
  return `${theme.rule(TUI_DESIGN_TOKENS.glyph.rule.repeat(12))} ${theme.text(
    TUI_DESIGN_TOKENS.glyph.authored,
  )} ${theme.rule(TUI_DESIGN_TOKENS.glyph.rule.repeat(12))}`;
};

export const renderFooter = (
  state: TuiFrameState,
  width: number,
  theme: TerminalTheme,
): string => {
  const idle =
    state.messages.length === 0 &&
    !state.submittedText &&
    !state.streamingLayout &&
    !state.streamingText &&
    !state.error;
  if (idle) return "";
  const status = " KERNEL / DURABLE";
  const workspacePrefix = width < 72 ? "" : "WORKSPACE / ";
  const left = `${workspacePrefix}${clip(
    sanitizeTerminalText(state.workingDirectory),
    Math.max(8, width - visibleWidth(status) - workspacePrefix.length - 4),
  )}`;
  const rightWidth = 1 + visibleWidth(status);
  const gap = " ".repeat(Math.max(1, width - visibleWidth(left) - rightWidth));
  return `${theme.muted(left)}${gap}${theme.success(TUI_DESIGN_TOKENS.glyph.healthy)}${theme.muted(status)}`;
};
