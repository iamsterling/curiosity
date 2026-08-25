import type { TuiFrameState } from "./frame-types.js";
import { clip, modelParts, padPlain, visibleWidth } from "./frame-text.js";
import { sanitizeTerminalText } from "./terminal-text.js";
import type { TerminalTheme } from "./theme.js";

export const LOGO = [
  "█▀▀ █ █ █▀▄ ▀█▀ █▀█ █▀▀ ▀█▀ ▀█▀ █ █",
  "█   █ █ █▀▄  █  █ █ ▀▀█  █   █  ▀█▀",
  "▀▀▀ ▀▀▀ ▀ ▀ ▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀  ▀   █ ",
] as const;

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
  const providerPart = compact ? "" : ` ${safeProvider}`;
  const reserved = 2 + 4 + 3 + providerPart.length + 3 + safeEffort.length;
  const clippedModel = clip(safeModel, Math.max(4, width - reserved));
  const plain = `  Chat · ${clippedModel}${providerPart} · ${safeEffort}`;
  return (
    theme.panelText("  Chat") +
    theme.panelMuted(" · ") +
    theme.panelText(clippedModel) +
    theme.panelMuted(`${providerPart} · `) +
    theme.panelEffort(safeEffort) +
    theme.panel(" ".repeat(Math.max(0, width - visibleWidth(plain))))
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
        theme.panelText(padPlain(`  ${line}`, innerWidth)),
      )
    : [
        theme.panelMuted(
          padPlain('  Ask anything... "What should we build?"', innerWidth),
        ),
      ];
  return {
    ...(state.status === "idle"
      ? {
          cursorColumn: 3 + input.cursorColumn,
          cursorRow: 1 + input.cursorRow - firstRow,
        }
      : {}),
    lines: [
      `${theme.user("│")}${theme.panel(" ".repeat(innerWidth))}`,
      ...body.map((line) => `${theme.user("│")}${line}`),
      `${theme.user("│")}${metadata(innerWidth, state, theme, compact)}`,
      `${theme.user("╹")}${theme.panel(" ".repeat(innerWidth))}`,
    ],
  };
};

export const renderLogoLine = (line: string, theme: TerminalTheme): string => {
  const split = Math.floor(line.length * 0.47);
  return `${theme.muted(line.slice(0, split))}${theme.bold(line.slice(split))}`;
};

export const renderFooter = (
  state: TuiFrameState,
  width: number,
  theme: TerminalTheme,
): string => {
  const left = clip(
    sanitizeTerminalText(state.workingDirectory),
    Math.max(8, width - 18),
  );
  const right = "○ durable";
  const gap = " ".repeat(
    Math.max(1, width - visibleWidth(left) - right.length),
  );
  return theme.muted(`${left}${gap}${right}`);
};
