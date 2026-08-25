import {
  LOGO,
  renderComposer,
  renderFooter,
  renderLogoLine,
} from "./composer-view.js";
import type { TerminalFrame, TuiFrameState } from "./frame-types.js";
import { fitLine, place, setLine, visibleWidth } from "./frame-text.js";
import { sanitizeTerminalText } from "./terminal-text.js";
import type { TerminalTheme } from "./theme.js";
import { renderConversation, renderTitlePanel } from "./transcript-view.js";

export type { TerminalFrame, TuiFrameState } from "./frame-types.js";

export const renderTuiFrame = (
  state: TuiFrameState,
  theme: TerminalTheme,
): TerminalFrame => {
  const width = Math.max(20, state.columns - 1);
  const height = Math.max(12, state.rows);
  const compact = width < 80 || height < 30;
  const lines = Array.from({ length: height }, () => "");
  const active =
    state.messages.length > 0 ||
    Boolean(state.submittedText) ||
    Boolean(state.streamingText) ||
    Boolean(state.error);
  const composerWidth = active
    ? Math.max(20, width - 4)
    : Math.min(75, Math.max(20, width - 4));
  const composerColumn = active
    ? 2
    : Math.max(2, Math.floor((width - composerWidth) / 2));
  const composer = renderComposer(state, composerWidth, compact, theme);
  let composerRow = height - composer.lines.length - 4;

  if (!active && !compact) {
    const groupHeight = LOGO.length + 2 + composer.lines.length + 1;
    const top = Math.max(2, Math.floor((height - groupHeight) / 2) - 1);
    const logoWidth = Math.max(...LOGO.map((line) => visibleWidth(line)));
    const logoColumn = Math.max(0, Math.floor((width - logoWidth) / 2));
    LOGO.forEach((line, index) =>
      setLine(
        lines,
        top + index,
        place(logoColumn, renderLogoLine(line, theme)),
      ),
    );
    composerRow = top + LOGO.length + 2;
  }

  if (active) {
    const contentColumn = 2;
    const contentWidth = Math.max(20, width - 4);
    const titleRows = renderTitlePanel(
      sanitizeTerminalText(
        state.threadTitle ?? state.submittedText ?? "Thread",
      ),
      contentWidth,
      compact,
      theme,
    );
    titleRows.forEach((line, index) =>
      setLine(lines, 1 + index, place(contentColumn, line)),
    );
    const transcriptStart = 1 + titleRows.length + 1;
    const available = Math.max(0, composerRow - 1 - transcriptStart);
    const content = renderConversation(state, contentWidth, theme);
    const latestStart = Math.max(0, content.length - available);
    const start = Math.max(0, latestStart - state.scrollOffset);
    content
      .slice(start, start + available)
      .forEach((line, index) =>
        setLine(lines, transcriptStart + index, place(contentColumn, line)),
      );
  }

  composer.lines.forEach((line, index) =>
    setLine(lines, composerRow + index, place(composerColumn, line)),
  );
  const hints =
    state.status === "working"
      ? theme.muted("working")
      : compact
        ? theme.muted("/new   /quit")
        : theme.muted("/new  new thread    /quit  exit");
  setLine(
    lines,
    composerRow + composer.lines.length,
    place(
      composerColumn + Math.max(0, composerWidth - visibleWidth(hints)),
      hints,
    ),
  );
  setLine(lines, height - 1, renderFooter(state, width, theme));

  return {
    ...(composer.cursorColumn === undefined || composer.cursorRow === undefined
      ? {}
      : {
          cursor: {
            column: composerColumn + composer.cursorColumn,
            row: composerRow + composer.cursorRow,
          },
        }),
    lines: Object.freeze(lines.map((line) => fitLine(line, width, theme))),
  };
};
