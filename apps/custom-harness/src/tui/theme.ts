import { TUI_DESIGN_TOKENS } from "./design-system.js";

export interface TerminalTheme {
  readonly activity: (value: string) => string;
  readonly base: string;
  readonly bold: (value: string) => string;
  readonly canvas: (value: string) => string;
  readonly code: (value: string) => string;
  readonly danger: (value: string) => string;
  readonly enabled: boolean;
  readonly focus: (value: string) => string;
  readonly heading: (value: string) => string;
  readonly link: (value: string) => string;
  readonly muted: (value: string) => string;
  readonly plugin: (value: string) => string;
  readonly quietSurface: (value: string) => string;
  readonly quietSurfaceMuted: (value: string) => string;
  readonly quietSurfaceText: (value: string) => string;
  readonly reset: string;
  readonly rule: (value: string) => string;
  readonly secondary: (value: string) => string;
  readonly success: (value: string) => string;
  readonly surface: (value: string) => string;
  readonly surfaceActivity: (value: string) => string;
  readonly surfaceMuted: (value: string) => string;
  readonly surfaceStatus: (value: string) => string;
  readonly surfaceText: (value: string) => string;
  readonly text: (value: string) => string;
  readonly warning: (value: string) => string;
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
  const { color } = TUI_DESIGN_TOKENS;
  const canvasCode = `${foreground(color.textPrimary)};${background(color.canvas)}`;
  const base = enabled ? `\u001b[${canvasCode}m` : "";
  const surfaceCode = background(color.surface);
  const quietSurfaceCode = background(color.surfaceQuiet);
  return Object.freeze({
    activity: style(enabled, base, foreground(color.activity)),
    base,
    bold: style(enabled, base, "1"),
    canvas: style(enabled, base, canvasCode),
    code: style(enabled, base, foreground(color.code)),
    danger: style(enabled, base, foreground(color.danger)),
    enabled,
    focus: style(enabled, base, foreground(color.focus)),
    heading: style(enabled, base, `1;${foreground(color.textPrimary)}`),
    link: style(enabled, base, `4;${foreground(color.focus)}`),
    muted: style(enabled, base, foreground(color.textMuted)),
    plugin: style(enabled, base, foreground(color.plugin)),
    quietSurface: style(enabled, base, quietSurfaceCode),
    quietSurfaceMuted: style(
      enabled,
      base,
      `${foreground(color.textMuted)};${quietSurfaceCode}`,
    ),
    quietSurfaceText: style(
      enabled,
      base,
      `${foreground(color.textPrimary)};${quietSurfaceCode}`,
    ),
    reset: enabled ? "\u001b[0m" : "",
    rule: style(enabled, base, foreground(color.line)),
    secondary: style(enabled, base, foreground(color.textSecondary)),
    success: style(enabled, base, foreground(color.success)),
    surface: style(enabled, base, surfaceCode),
    surfaceActivity: style(
      enabled,
      base,
      `${foreground(color.activity)};${surfaceCode}`,
    ),
    surfaceMuted: style(
      enabled,
      base,
      `${foreground(color.textMuted)};${surfaceCode}`,
    ),
    surfaceStatus: style(
      enabled,
      base,
      `${foreground(color.success)};${surfaceCode}`,
    ),
    surfaceText: style(
      enabled,
      base,
      `${foreground(color.textPrimary)};${surfaceCode}`,
    ),
    text: style(enabled, base, foreground(color.textPrimary)),
    warning: style(enabled, base, foreground(color.warning)),
  });
};
