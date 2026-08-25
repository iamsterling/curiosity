export interface TerminalTheme {
  readonly accent: (value: string) => string;
  readonly assistant: (value: string) => string;
  readonly base: string;
  readonly bold: (value: string) => string;
  readonly canvas: (value: string) => string;
  readonly code: (value: string) => string;
  readonly danger: (value: string) => string;
  readonly effort: (value: string) => string;
  readonly enabled: boolean;
  readonly info: (value: string) => string;
  readonly link: (value: string) => string;
  readonly muted: (value: string) => string;
  readonly panel: (value: string) => string;
  readonly panelEffort: (value: string) => string;
  readonly panelMuted: (value: string) => string;
  readonly panelText: (value: string) => string;
  readonly primary: (value: string) => string;
  readonly reset: string;
  readonly success: (value: string) => string;
  readonly user: (value: string) => string;
  readonly userPanel: (value: string) => string;
  readonly userPanelMuted: (value: string) => string;
}

const foreground = (hex: string): string => {
  const values = hex
    .match(/[\da-f]{2}/giu)
    ?.map((value) => Number.parseInt(value, 16));
  if (!values || values.length !== 3) throw new Error("TUI_COLOR_INVALID");
  return `38;2;${values.join(";")}`;
};

const background = (hex: string): string =>
  foreground(hex).replace(/^38/u, "48");

const style =
  (enabled: boolean, base: string, code: string) =>
  (value: string): string =>
    enabled ? `\u001b[${code}m${value}${base}` : value;

export const makeTerminalTheme = (enabled: boolean): TerminalTheme => {
  const canvasCode = `${foreground("#EEEEEE")};${background("#0A0A0A")}`;
  const base = enabled ? `\u001b[${canvasCode}m` : "";
  const panelCode = background("#1E1E1E");
  const userPanelCode = background("#141414");
  return Object.freeze({
    accent: style(enabled, base, foreground("#9D7CD8")),
    assistant: style(enabled, base, foreground("#EEEEEE")),
    base,
    bold: style(enabled, base, "1"),
    canvas: style(enabled, base, canvasCode),
    code: style(enabled, base, foreground("#7FD88F")),
    danger: style(enabled, base, foreground("#E06C75")),
    effort: style(enabled, base, `1;${foreground("#F5A742")}`),
    enabled,
    info: style(enabled, base, foreground("#56B6C2")),
    link: style(enabled, base, `4;${foreground("#FAB283")}`),
    muted: style(enabled, base, foreground("#808080")),
    panel: style(enabled, base, panelCode),
    panelEffort: style(
      enabled,
      base,
      `1;${foreground("#F5A742")};${panelCode}`,
    ),
    panelMuted: style(enabled, base, `${foreground("#808080")};${panelCode}`),
    panelText: style(enabled, base, `${foreground("#EEEEEE")};${panelCode}`),
    primary: style(enabled, base, foreground("#FAB283")),
    reset: enabled ? "\u001b[0m" : "",
    success: style(enabled, base, foreground("#7FD88F")),
    user: style(enabled, base, foreground("#5C9CF5")),
    userPanel: style(
      enabled,
      base,
      `${foreground("#EEEEEE")};${userPanelCode}`,
    ),
    userPanelMuted: style(
      enabled,
      base,
      `${foreground("#808080")};${userPanelCode}`,
    ),
  });
};
