import type { ChatMessageProjection } from "../projection/chat-projection.js";
import { brailleFrame } from "./animation.js";
import type { TuiFrameState } from "./frame-types.js";
import { clip, modelParts, padPlain, place, wrapPlain } from "./frame-text.js";
import { renderMarkdown } from "./markdown.js";
import { sanitizeTerminalText } from "./terminal-text.js";
import type { TerminalTheme } from "./theme.js";
import { TUI_DESIGN_TOKENS } from "./design-system.js";

const durationLabel = (durationMs: number | undefined): string | undefined => {
  if (durationMs === undefined || durationMs <= 0) return undefined;
  if (durationMs < 1_000) return `${durationMs}ms`;
  return `${(durationMs / 1_000).toFixed(1)}s`;
};

export const renderPanel = (
  text: string,
  width: number,
  theme: TerminalTheme,
  rule: (value: string) => string = theme.rule,
): readonly string[] => {
  const innerWidth = Math.max(1, width - 1);
  const row = (content: string): string =>
    `${rule(TUI_DESIGN_TOKENS.glyph.rail)}${theme.quietSurfaceText(padPlain(content, innerWidth))}`;
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
  const inset = TUI_DESIGN_TOKENS.layout.responseInset;
  const markdown = renderMarkdown(message.text, {
    theme,
    width: Math.max(24, width - inset),
  });
  const { model } = modelParts(message.modelId ?? "custom:unknown");
  const suffix = [
    sanitizeTerminalText(model),
    durationLabel(message.durationMs),
  ]
    .filter(Boolean)
    .join(" / ");
  const receipt = message.researchReceipt;
  return [
    ...markdown.split("\n").map((line) => place(inset, line)),
    "",
    ...(receipt
      ? [
          place(
            inset,
            theme.muted(
              `RESEARCH RECEIPT / ${receipt.verification} / ${receipt.sourceCount} sources / ${receipt.citationCount} citations / ${receipt.toolCallCount} calls`,
            ),
          ),
        ]
      : []),
    place(
      inset,
      `${theme.rule(TUI_DESIGN_TOKENS.glyph.ruleLead)} ${theme.muted(`RESPONSE / ${suffix}`)}`,
    ),
  ];
};

const renderStreamingAssistant = (
  text: string,
  width: number,
  theme: TerminalTheme,
): readonly string[] => {
  const inset = TUI_DESIGN_TOKENS.layout.responseInset;
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
  const row = (content: string, muted = false): string =>
    `${theme.danger(TUI_DESIGN_TOKENS.glyph.rail)}${(muted ? theme.quietSurfaceMuted : theme.quietSurfaceText)(padPlain(content, innerWidth))}`;
  return [
    row(""),
    ...wrapPlain(error, Math.max(1, innerWidth - 4)).map((line) =>
      row(`  ${line}`),
    ),
    row("  Retry after resolving the provider or connection.", true),
    row(""),
  ];
};

interface CachedConversation {
  readonly lines: readonly string[];
  readonly width: number;
}

const conversationCache = new WeakMap<
  readonly ChatMessageProjection[],
  WeakMap<TerminalTheme, CachedConversation>
>();

const renderCompletedConversation = (
  messages: readonly ChatMessageProjection[],
  width: number,
  theme: TerminalTheme,
): readonly string[] => {
  let themeCache = conversationCache.get(messages);
  if (!themeCache) {
    themeCache = new WeakMap();
    conversationCache.set(messages, themeCache);
  }
  const cached = themeCache.get(theme);
  if (cached?.width === width) return cached.lines;

  const lines: string[] = [];
  for (const message of messages) {
    if (lines.length > 0) lines.push("");
    lines.push(
      ...(message.role === "user"
        ? renderPanel(message.text, width, theme)
        : renderAssistant(message, width, theme)),
    );
  }
  const result = Object.freeze(lines);
  themeCache.set(theme, { lines: result, width });
  return result;
};

export const renderConversation = (
  state: TuiFrameState,
  width: number,
  theme: TerminalTheme,
): readonly string[] => {
  const completed = renderCompletedConversation(state.messages, width, theme);
  if (
    !state.submittedText &&
    !state.streamingText &&
    state.status !== "working" &&
    !state.error
  )
    return completed;
  const result: string[] = [...completed];
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
        TUI_DESIGN_TOKENS.layout.responseInset,
        `${theme.activity(brailleFrame("orbit", state.animationTick, state.motion))} ${theme.muted("Working…")}`,
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
  const prefix = compact ? "T / " : "THREAD / ";
  const safeTitle = clip(
    sanitizeTerminalText(title),
    Math.max(1, width - visibleLength(prefix) - 2),
  );
  const occupied = visibleLength(prefix) + visibleLength(safeTitle) + 1;
  const rule = TUI_DESIGN_TOKENS.glyph.rule.repeat(
    Math.max(0, width - occupied),
  );
  return [
    `${theme.muted(prefix)}${theme.heading(safeTitle)} ${theme.rule(rule)}`,
  ];
};

const visibleLength = (value: string): number => Bun.stringWidth(value);
