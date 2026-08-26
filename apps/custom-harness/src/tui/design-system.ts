export const TUI_DESIGN_TOKENS = Object.freeze({
  color: Object.freeze({
    activity: "#8BD5F7",
    canvas: "#07090B",
    code: "#A7CFB2",
    danger: "#E8847E",
    focus: "#8BD5F7",
    line: "#2A353C",
    success: "#82C7A5",
    surface: "#10161A",
    surfaceQuiet: "#0C1114",
    textMuted: "#74828A",
    textPrimary: "#E7EDF0",
    textSecondary: "#9AA8AF",
    warning: "#D7B873",
  }),
  glyph: Object.freeze({
    rail: "│",
    railEnd: "╵",
    railStart: "╷",
    rule: "─",
    ruleLead: "╶",
    status: "●",
  }),
  layout: Object.freeze({
    compactColumns: 80,
    compactRows: 30,
    contentInset: 2,
    idleComposerWidth: 76,
    readingWidth: 112,
    responseInset: 3,
  }),
  motion: Object.freeze({
    activeFrameMs: 120,
    idleAnimation: false,
  }),
});

export type TuiDesignTokens = typeof TUI_DESIGN_TOKENS;
