import {
  LOGO,
  renderComposer,
  renderFooter,
  renderHeader,
  renderIdleStatus,
  renderLogoLine,
} from "./composer-view.js";
import { renderCommandPalette } from "./command-palette-view.js";
import type { TerminalFrame, TuiFrameState } from "./frame-types.js";
import { fitLine, place, setLine, visibleWidth } from "./frame-text.js";
import { sanitizeTerminalText } from "./terminal-text.js";
import type { TerminalTheme } from "./theme.js";
import {
  renderConversationWindow,
  renderTitlePanel,
} from "./transcript-view.js";
import { TUI_DESIGN_TOKENS } from "./design-system.js";
import { renderInspector } from "./inspector-view.js";

export type { TerminalFrame, TuiFrameState } from "./frame-types.js";

export const renderTuiFrame = (
  state: TuiFrameState,
  theme: TerminalTheme,
): TerminalFrame => {
  const width = Math.max(20, state.columns - 1);
  const height = Math.max(12, state.rows);
  const { layout } = TUI_DESIGN_TOKENS;
  const compact = width < layout.compactColumns || height < layout.compactRows;
  const lines = Array.from({ length: height }, () => "");
  const wideInspector = Boolean(
    state.inspector && width >= layout.inspectorMinColumns,
  );
  const inspectorWidth = wideInspector ? layout.inspectorWidth : 0;
  const mainWidth = width - inspectorWidth - (wideInspector ? 1 : 0);
  const mainCompact = compact || mainWidth < layout.compactColumns;
  let transcriptViewport: TerminalFrame["transcriptViewport"];
  const active =
    state.messages.length > 0 ||
    Boolean(state.submittedText) ||
    Boolean(state.streamingLayout) ||
    Boolean(state.streamingText) ||
    Boolean(state.error);
  const availableWidth = Math.max(20, mainWidth - layout.contentInset * 2);
  const contentWidth = Math.min(layout.readingWidth, availableWidth);
  const contentColumn = Math.max(
    layout.contentInset,
    Math.floor((mainWidth - contentWidth) / 2),
  );
  const composerWidth = active
    ? contentWidth
    : Math.min(layout.idleComposerWidth, availableWidth);
  const composerColumn = active
    ? contentColumn
    : Math.max(
        layout.contentInset,
        Math.floor((mainWidth - composerWidth) / 2),
      );
  const composer = renderComposer(state, composerWidth, mainCompact, theme);
  let composerRow = height - composer.lines.length - 4;

  setLine(lines, 0, renderHeader(state, width, theme));

  if (!active && !mainCompact) {
    const groupHeight = LOGO.length + 3 + composer.lines.length + 1;
    const top = Math.max(2, Math.floor((height - groupHeight) / 2) - 1);
    const logoWidth = Math.max(...LOGO.map((line) => visibleWidth(line)));
    const logoColumn = Math.max(0, Math.floor((mainWidth - logoWidth) / 2));
    LOGO.forEach((line, index) =>
      setLine(
        lines,
        top + index,
        place(logoColumn, renderLogoLine(line, theme)),
      ),
    );
    const status = renderIdleStatus(state, theme);
    setLine(
      lines,
      top + LOGO.length + 1,
      place(
        Math.max(0, Math.floor((mainWidth - visibleWidth(status)) / 2)),
        status,
      ),
    );
    composerRow = top + LOGO.length + 3;
  }

  if (active) {
    const titleRows = renderTitlePanel(
      sanitizeTerminalText(
        state.threadTitle ?? state.submittedText ?? "Thread",
      ),
      contentWidth,
      mainCompact,
      theme,
    );
    titleRows.forEach((line, index) =>
      setLine(lines, 2 + index, place(contentColumn, line)),
    );
    const transcriptStart = 2 + titleRows.length + 1;
    const available = Math.max(0, composerRow - 1 - transcriptStart);
    const content = renderConversationWindow(
      state,
      contentWidth,
      theme,
      available,
      state.scrollOffset,
    );
    if (available > 0 && !state.palette && !state.inspector) {
      transcriptViewport = {
        endRow: transcriptStart + available,
        offset: content.offset,
        startRow: transcriptStart,
      };
    }
    content.lines.forEach((line, index) =>
      setLine(lines, transcriptStart + index, place(contentColumn, line)),
    );
  }

  if (state.palette) {
    const paletteWidth = Math.min(
      layout.paletteWidth,
      Math.max(24, mainWidth - layout.contentInset * 2),
    );
    const palette = renderCommandPalette(
      state.palette,
      paletteWidth,
      Math.max(6, composerRow - 3),
      theme,
    );
    const paletteColumn = Math.max(
      0,
      Math.floor((mainWidth - paletteWidth) / 2),
    );
    palette.forEach((line, index) =>
      setLine(lines, 2 + index, place(paletteColumn, line)),
    );
  }

  composer.lines.forEach((line, index) =>
    setLine(lines, composerRow + index, place(composerColumn, line)),
  );
  const hints =
    state.status === "working"
      ? theme.activity("● ACTIVE")
      : !active
        ? ""
      : state.input
        ? theme.muted("↵ send   ctrl+j newline   ctrl+k palette")
        : mainCompact
          ? theme.muted("ctrl+k palette   ctrl+i inspect")
          : theme.muted(
              "↵ send   ctrl+j newline   ctrl+k palette   ctrl+i inspect",
            );
  setLine(
    lines,
    composerRow + composer.lines.length,
    place(
      composerColumn + Math.max(0, composerWidth - visibleWidth(hints)),
      hints,
    ),
  );
  setLine(lines, height - 1, renderFooter(state, width, theme));

  let renderedLines = lines;
  if (state.inspector && wideInspector) {
    const inspector = renderInspector(
      state.inspector,
      inspectorWidth,
      height - 2,
      theme,
    );
    renderedLines = lines.map((line, row) => {
      if (row === 0 || row === height - 1) return line;
      const left = fitLine(line, mainWidth, theme);
      return `${left}${theme.rule(TUI_DESIGN_TOKENS.glyph.rail)}${inspector[row - 1] ?? ""}`;
    });
  } else if (state.inspector) {
    const inspector = renderInspector(
      state.inspector,
      width,
      height - 2,
      theme,
    );
    inspector.forEach((line, index) => setLine(lines, 1 + index, line));
    renderedLines = lines;
  }

  return {
    ...(state.palette ||
    (state.inspector && !wideInspector) ||
    composer.cursorColumn === undefined ||
    composer.cursorRow === undefined
      ? {}
      : {
          cursor: {
            column: composerColumn + composer.cursorColumn,
            row: composerRow + composer.cursorRow,
          },
        }),
    lines: Object.freeze(
      renderedLines.map((line) => fitLine(line, width, theme)),
    ),
    ...(transcriptViewport ? { transcriptViewport } : {}),
  };
};
