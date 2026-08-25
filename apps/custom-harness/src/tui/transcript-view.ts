import type { ChatMessageProjection } from "../projection/chat-projection.js";
import { brailleFrame } from "./animation.js";
import type { TuiFrameState } from "./frame-types.js";
import { clip, modelParts, padPlain, place, wrapPlain } from "./frame-text.js";
import { renderMarkdown } from "./markdown.js";
import { sanitizeTerminalText } from "./terminal-text.js";
import type { TerminalTheme } from "./theme.js";

const durationLabel = (durationMs: number | undefined): string | undefined => {
  if (durationMs === undefined || durationMs <= 0) return undefined;
  if (durationMs < 1_000) return `${durationMs}ms`;
  return `${(durationMs / 1_000).toFixed(1)}s`;
};

export const renderPanel = (
  text: string,
  width: number,
  theme: TerminalTheme,
  rule: (value: string) => string = theme.user,
): readonly string[] => {
  const innerWidth = Math.max(1, width - 1);
  const row = (content: string): string =>
    `${rule("│")}${theme.userPanel(padPlain(content, innerWidth))}`;
  return [
    row(""),
    ...wrapPlain(text, Math.max(1, innerWidth - 4)).map((line) =>
      row(`  ${line}`),
    ),
    row(""),
  ];
};

const renderAssistant = (
  message: ChatMessageProjection,
  width: number,
  theme: TerminalTheme,
): readonly string[] => {
  const inset = 3;
  const markdown = renderMarkdown(message.text, {
    theme,
    width: Math.max(24, width - inset),
  });
  const { model } = modelParts(message.modelId ?? "custom:unknown");
  const suffix = [
    "·",
    sanitizeTerminalText(model),
    durationLabel(message.durationMs) ? "·" : undefined,
    durationLabel(message.durationMs),
  ]
    .filter(Boolean)
    .join(" ");
  return [
    ...markdown.split("\n").map((line) => place(inset, line)),
    "",
    place(inset, `${theme.user("▣")} Chat ${theme.muted(suffix)}`),
  ];
};

const renderStreamingAssistant = (
  text: string,
  width: number,
  theme: TerminalTheme,
): readonly string[] => {
  const inset = 3;
  const markdown = renderMarkdown(text, {
    theme,
    width: Math.max(24, width - inset),
  });
  return markdown.split("\n").map((line) => place(inset, line));
};

const renderError = (
  error: string,
  width: number,
  theme: TerminalTheme,
): readonly string[] => {
  const innerWidth = Math.max(1, width - 1);
  const row = (content: string): string =>
    `${theme.danger("│")}${theme.userPanelMuted(padPlain(content, innerWidth))}`;
  return [
    row(""),
    ...wrapPlain(error, Math.max(1, innerWidth - 4)).map((line) =>
      row(`  ${line}`),
    ),
    row("  Retry after resolving the provider or connection."),
    row(""),
  ];
};

export const renderConversation = (
  state: TuiFrameState,
  width: number,
  theme: TerminalTheme,
): readonly string[] => {
  const result: string[] = [];
  for (const message of state.messages) {
    if (result.length > 0) result.push("");
    result.push(
      ...(message.role === "user"
        ? renderPanel(message.text, width, theme)
        : renderAssistant(message, width, theme)),
    );
  }
  if (state.submittedText) {
    if (result.length > 0) result.push("");
    result.push(...renderPanel(state.submittedText, width, theme));
  }
  if (state.streamingText)
    result.push(
      "",
      ...renderStreamingAssistant(state.streamingText, width, theme),
    );
  if (state.status === "working")
    result.push(
      "",
      place(
        3,
        `${theme.user(brailleFrame("orbit", state.animationTick, state.motion))} ${theme.muted("Working…")}`,
      ),
    );
  if (state.error) result.push("", ...renderError(state.error, width, theme));
  return result;
};

export const renderTitlePanel = (
  title: string,
  width: number,
  compact: boolean,
  theme: TerminalTheme,
): readonly string[] => {
  const safeTitle = clip(sanitizeTerminalText(title), Math.max(1, width - 5));
  if (compact)
    return [
      `${theme.muted("│")}${theme.userPanel(padPlain(`  # ${safeTitle}`, width - 1))}`,
    ];
  return renderPanel(`# ${safeTitle}`, width, theme, theme.muted);
};
