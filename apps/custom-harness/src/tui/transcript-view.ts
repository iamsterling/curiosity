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

let panelCache:
  | {
      readonly lines: readonly string[];
      readonly rule: (value: string) => string;
      readonly text: string;
      readonly theme: TerminalTheme;
      readonly width: number;
    }
  | undefined;

export const renderPanel = (
  text: string,
  width: number,
  theme: TerminalTheme,
  rule: (value: string) => string = theme.rule,
): readonly string[] => {
  if (
    panelCache?.text === text &&
    panelCache.width === width &&
    panelCache.theme === theme &&
    panelCache.rule === rule
  )
    return panelCache.lines;
  const innerWidth = Math.max(1, width - 1);
  const row = (content: string): string =>
    `${rule(TUI_DESIGN_TOKENS.glyph.rail)}${theme.quietSurfaceText(padPlain(content, innerWidth))}`;
  const lines = Object.freeze([
    row(""),
    ...wrapPlain(text, Math.max(1, innerWidth - 4)).map((line) =>
      row(`  ${line}`),
    ),
    row(""),
  ]);
  panelCache = { lines, rule, text, theme, width };
  return lines;
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

interface ConversationSegment {
  readonly length: number;
  readonly read: (start: number, end: number) => readonly string[];
}

const lineSegment = (lines: readonly string[]): ConversationSegment => ({
  length: lines.length,
  read: (start, end) => lines.slice(start, end),
});

const streamingSegment = (
  state: TuiFrameState,
  width: number,
): ConversationSegment | undefined => {
  const inset = TUI_DESIGN_TOKENS.layout.responseInset;
  const lines = state.streamingLayout
    ? state.streamingLayout.lines(Math.max(24, width - inset))
    : state.streamingText
      ? wrapPlain(state.streamingText, Math.max(24, width - inset))
      : [];
  if (lines.length === 0) return undefined;
  return {
    length: lines.length,
    read: (start, end) =>
      lines.slice(start, end).map((line) => place(inset, line)),
  };
};

const conversationSegments = (
  state: TuiFrameState,
  width: number,
  theme: TerminalTheme,
): readonly ConversationSegment[] => {
  const segments: ConversationSegment[] = [];
  const completed = renderCompletedConversation(state.messages, width, theme);
  if (completed.length > 0) segments.push(lineSegment(completed));
  if (state.submittedText) {
    if (completed.length > 0) segments.push(lineSegment([""]));
    segments.push(lineSegment(renderPanel(state.submittedText, width, theme)));
  }
  const streaming = streamingSegment(state, width);
  if (streaming) segments.push(lineSegment([""]), streaming);
  if (state.status === "working")
    segments.push(
      lineSegment([
        "",
        place(
          TUI_DESIGN_TOKENS.layout.responseInset,
          `${theme.activity(brailleFrame("orbit", state.animationTick, state.motion))} ${theme.muted("Working…")}`,
        ),
      ]),
    );
  if (state.error)
    segments.push(lineSegment(["", ...renderError(state.error, width, theme)]));
  return segments;
};

const readSegmentRange = (
  segments: readonly ConversationSegment[],
  start: number,
  end: number,
): readonly string[] => {
  const result: string[] = [];
  let segmentStart = 0;
  for (const segment of segments) {
    const segmentEnd = segmentStart + segment.length;
    if (segmentEnd > start && segmentStart < end) {
      result.push(
        ...segment.read(
          Math.max(0, start - segmentStart),
          Math.min(segment.length, end - segmentStart),
        ),
      );
    }
    if (segmentEnd >= end) break;
    segmentStart = segmentEnd;
  }
  return result;
};

export interface ConversationWindow {
  readonly lines: readonly string[];
  readonly offset: number;
  readonly totalLines: number;
}

export const renderConversationWindow = (
  state: TuiFrameState,
  width: number,
  theme: TerminalTheme,
  height: number,
  scrollOffset: number,
): ConversationWindow => {
  const segments = conversationSegments(state, width, theme);
  const totalLines = segments.reduce((total, segment) => total + segment.length, 0);
  const windowHeight = Math.max(0, height);
  const latestStart = Math.max(0, totalLines - windowHeight);
  const start = Math.max(0, latestStart - Math.max(0, scrollOffset));
  return Object.freeze({
    lines: Object.freeze(
      readSegmentRange(segments, start, Math.min(totalLines, start + windowHeight)),
    ),
    offset: latestStart - start,
    totalLines,
  });
};

export const renderConversation = (
  state: TuiFrameState,
  width: number,
  theme: TerminalTheme,
): readonly string[] => {
  const completed = renderCompletedConversation(state.messages, width, theme);
  if (
    !state.submittedText &&
    !state.streamingLayout &&
    !state.streamingText &&
    state.status !== "working" &&
    !state.error
  )
    return completed;
  const segments = conversationSegments(state, width, theme);
  return readSegmentRange(
    segments,
    0,
    segments.reduce((total, segment) => total + segment.length, 0),
  );
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
