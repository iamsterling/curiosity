import type { TuiFrameState } from "./frame-types.js";
import { clip, modelParts, padPlain, visibleWidth } from "./frame-text.js";
import { sanitizeTerminalText } from "./terminal-text.js";
import type { TerminalTheme } from "./theme.js";
import { TUI_DESIGN_TOKENS } from "./design-system.js";

export const LOGO = ["CURIOSITY"] as const;

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

const metadata = (
  width: number,
  state: TuiFrameState,
  theme: TerminalTheme,
  compact: boolean,
): string => {
  const { model, provider } = modelParts(state.modelId);
  const safeModel = sanitizeTerminalText(model);
  const safeProvider = sanitizeTerminalText(provider);
  const safeEffort = sanitizeTerminalText(state.effort);
  const status = state.status === "working" ? "ACTIVE" : "READY";

  if (width < 40) {
    const clippedModel = clip(
      safeModel,
      Math.max(4, width - status.length - 5),
    );
    const plain = `  ${clippedModel}`;
    const gap = " ".repeat(
      Math.max(1, width - visibleWidth(plain) - status.length),
    );
    return (
      theme.surface("  ") +
      theme.surfaceText(clippedModel) +
      theme.surface(gap) +
      (state.status === "working"
        ? theme.surfaceActivity(status)
        : theme.surfaceStatus(status))
    );
  }

  const providerPart = compact ? "" : ` · ${safeProvider}`;
  const fixed = `  CHAT / ${providerPart} / EFFORT ${safeEffort} ${status}`;
  const clippedModel = clip(
    safeModel,
    Math.max(4, width - visibleWidth(fixed)),
  );
  const plain = `  CHAT / ${clippedModel}${providerPart} / EFFORT ${safeEffort}`;
  const gap = " ".repeat(
    Math.max(1, width - visibleWidth(plain) - status.length),
  );
  return (
    theme.surface("  ") +
    theme.surfaceMuted("CHAT / ") +
    theme.surfaceText(clippedModel) +
    theme.surfaceMuted(`${providerPart} / EFFORT `) +
    theme.surfaceText(safeEffort) +
    theme.surface(gap) +
    (state.status === "working"
      ? theme.surfaceActivity(status)
      : theme.surfaceStatus(status))
  );
};

export const renderComposer = (
  state: TuiFrameState,
  width: number,
  compact: boolean,
  theme: TerminalTheme,
): ComposerView => {
  const innerWidth = Math.max(1, width - 1);
  const inputWidth = Math.max(1, innerWidth - 4);
  const input = inputRows(state.input, state.inputCursor, inputWidth);
  const maxRows = compact ? 3 : 6;
  const firstRow = Math.min(
    Math.max(0, input.cursorRow - maxRows + 1),
    Math.max(0, input.lines.length - maxRows),
  );
  const visibleRows = input.lines.slice(firstRow, firstRow + maxRows);
  const body = state.input
    ? visibleRows.map((line) =>
        theme.surfaceText(padPlain(`  ${line}`, innerWidth)),
      )
    : [theme.surfaceMuted(padPlain("  Ask Curiosity…", innerWidth))];
  const rail = state.status === "working" ? theme.activity : theme.focus;
  const { glyph } = TUI_DESIGN_TOKENS;
  return {
    ...(state.status === "idle"
      ? {
          cursorColumn: 3 + input.cursorColumn,
          cursorRow: 1 + input.cursorRow - firstRow,
        }
      : {}),
    lines: [
      `${rail(glyph.railStart)}${theme.surface(" ".repeat(innerWidth))}`,
      ...body.map((line) => `${rail(glyph.rail)}${line}`),
      `${rail(glyph.rail)}${metadata(innerWidth, state, theme, compact)}`,
      `${rail(glyph.railEnd)}${theme.surface(" ".repeat(innerWidth))}`,
    ],
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
  state: TuiFrameState,
  theme: TerminalTheme,
): string => {
  const pluginCount = state.catalog?.pluginIds.length ?? 0;
  return `${theme.secondary(TUI_DESIGN_TOKENS.glyph.authored)} ${theme.muted(`authority kernel sealed · ${pluginCount} plugins`)}`;
};

export const renderFooter = (
  state: TuiFrameState,
  width: number,
  theme: TerminalTheme,
): string => {
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
