import { TUI_DESIGN_TOKENS } from "./design-system.js";

export interface TerminalTheme {
  readonly activity: (value: string) => string;
  readonly base: string;
  readonly bold: (value: string) => string;
  readonly canvas: (value: string) => string;
  readonly code: (value: string) => string;
  readonly danger: (value: string) => string;
  readonly enabled: boolean;
  readonly colorScheme: TerminalColorScheme;
  readonly focus: (value: string) => string;
  readonly heading: (value: string) => string;
  readonly italic: (value: string) => string;
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
  readonly strike: (value: string) => string;
  readonly surface: (value: string) => string;
  readonly surfaceActivity: (value: string) => string;
  readonly surfaceMuted: (value: string) => string;
  readonly surfaceStatus: (value: string) => string;
  readonly surfaceText: (value: string) => string;
  readonly text: (value: string) => string;
  readonly warning: (value: string) => string;
}

export type TerminalColorScheme = "dark" | "light";

type TerminalEnvironment = Readonly<Record<string, string | undefined>>;

const explicitColorScheme = (
  environment: TerminalEnvironment,
): TerminalColorScheme | undefined => {
  const value = environment.CURIOSITY_TERMINAL_BACKGROUND
    ?.trim()
    .toLocaleLowerCase();
  return value === "dark" || value === "light" ? value : undefined;
};

const indexedBackgroundScheme = (
  environment: TerminalEnvironment,
): TerminalColorScheme | undefined => {
  const value = environment.COLORFGBG?.split(";").at(-1)?.trim();
  if (!value || !/^\d{1,3}$/u.test(value)) return undefined;
  const index = Number(value);
  if (!Number.isSafeInteger(index) || index < 0 || index > 255)
    return undefined;
  if (index < 16)
    return [7, 9, 10, 11, 12, 13, 14, 15].includes(index)
      ? "light"
      : "dark";
  if (index >= 232) return index >= 244 ? "light" : "dark";
  const component = (offset: number): number =>
    offset === 0 ? 0 : 55 + offset * 40;
  const cube = index - 16;
  return colorSchemeForRgb(
    component(Math.floor(cube / 36)),
    component(Math.floor((cube % 36) / 6)),
    component(cube % 6),
  );
};

const linearChannel = (value: number): number => {
  const normalized = Math.min(255, Math.max(0, value)) / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

export const colorSchemeForRgb = (
  red: number,
  green: number,
  blue: number,
): TerminalColorScheme =>
  0.2126 * linearChannel(red) +
    0.7152 * linearChannel(green) +
    0.0722 * linearChannel(blue) >=
  0.35
    ? "light"
    : "dark";

export const resolveTerminalColorScheme = (
  environment: TerminalEnvironment,
): TerminalColorScheme =>
  explicitColorScheme(environment) ??
  indexedBackgroundScheme(environment) ??
  "dark";

const parseOscColorComponent = (value: string): number =>
  Math.round(
    (Number.parseInt(value, 16) / (16 ** Math.max(1, value.length) - 1)) * 255,
  );

const OSC_BACKGROUND_QUERY = "\u001b]11;?\u0007";
const OSC_BACKGROUND_RESPONSE =
  /\u001b\]11;rgb:([\da-f]{1,4})\/([\da-f]{1,4})\/([\da-f]{1,4})(?:\u0007|\u001b\\)/iu;

export const detectTerminalColorScheme = async (
  input: NodeJS.ReadStream,
  output: NodeJS.WriteStream,
  environment: TerminalEnvironment,
  timeoutMs = 80,
): Promise<TerminalColorScheme> => {
  const explicit = explicitColorScheme(environment);
  if (explicit) return explicit;
  const fallback = indexedBackgroundScheme(environment) ?? "dark";
  if (!input.isTTY || !output.isTTY || timeoutMs < 1) return fallback;

  const wasRaw = input.isRaw ?? false;
  const wasPaused = input.isPaused();
  let buffered = "";
  return await new Promise<TerminalColorScheme>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (
      scheme: TerminalColorScheme,
      response?: RegExpMatchArray,
    ): void => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) clearTimeout(timer);
      input.off("data", onData);
      if (!wasRaw) input.setRawMode?.(false);
      if (wasPaused) input.pause();
      const replay = response
        ? `${buffered.slice(0, response.index)}${buffered.slice(
            (response.index ?? 0) + response[0].length,
          )}`
        : buffered;
      if (replay) input.unshift(Buffer.from(replay));
      resolve(scheme);
    };
    const onData = (chunk: string | Buffer): void => {
      buffered += chunk.toString();
      const response = buffered.match(OSC_BACKGROUND_RESPONSE);
      if (response) {
        finish(
          colorSchemeForRgb(
            parseOscColorComponent(response[1]!),
            parseOscColorComponent(response[2]!),
            parseOscColorComponent(response[3]!),
          ),
          response,
        );
      } else if (Buffer.byteLength(buffered) > 1_024) finish(fallback);
    };

    input.on("data", onData);
    input.setRawMode?.(true);
    input.resume();
    output.write(OSC_BACKGROUND_QUERY);
    timer = setTimeout(() => finish(fallback), timeoutMs);
  });
};

const foreground = (hex: string): string => {
  const values = hex
    .match(/[\da-f]{2}/giu)
    ?.map((value) => Number.parseInt(value, 16));
  if (!values || values.length !== 3) throw new Error("TUI_COLOR_INVALID");
  return `38;2;${values.join(";")}`;
};

const style =
  (enabled: boolean, base: string, code: string) =>
  (value: string): string =>
    enabled ? `\u001b[${code}m${value}${base}` : value;

export const makeTerminalTheme = (
  enabled: boolean,
  colorScheme: TerminalColorScheme = "dark",
): TerminalTheme => {
  const color =
    colorScheme === "light"
      ? TUI_DESIGN_TOKENS.lightColor
      : TUI_DESIGN_TOKENS.color;
  const baseCode = foreground(color.textPrimary);
  const base = enabled ? `\u001b[0;${baseCode}m` : "";
  return Object.freeze({
    activity: style(enabled, base, foreground(color.activity)),
    base,
    bold: style(enabled, base, "1"),
    canvas: style(enabled, base, baseCode),
    code: style(enabled, base, foreground(color.code)),
    danger: style(enabled, base, foreground(color.danger)),
    enabled,
    colorScheme,
    focus: style(enabled, base, foreground(color.focus)),
    heading: style(enabled, base, `1;${foreground(color.textPrimary)}`),
    italic: style(enabled, base, "3"),
    link: style(enabled, base, `4;${foreground(color.focus)}`),
    muted: style(enabled, base, foreground(color.textMuted)),
    plugin: style(enabled, base, foreground(color.plugin)),
    quietSurface: style(enabled, base, baseCode),
    quietSurfaceMuted: style(enabled, base, foreground(color.textMuted)),
    quietSurfaceText: style(enabled, base, foreground(color.textPrimary)),
    reset: enabled ? "\u001b[0m" : "",
    rule: style(enabled, base, foreground(color.line)),
    secondary: style(enabled, base, foreground(color.textSecondary)),
    success: style(enabled, base, foreground(color.success)),
    strike: style(enabled, base, "9"),
    surface: style(enabled, base, baseCode),
    surfaceActivity: style(enabled, base, foreground(color.activity)),
    surfaceMuted: style(enabled, base, foreground(color.textMuted)),
    surfaceStatus: style(enabled, base, foreground(color.success)),
    surfaceText: style(enabled, base, foreground(color.textPrimary)),
    text: style(enabled, base, foreground(color.textPrimary)),
    warning: style(enabled, base, foreground(color.warning)),
  });
};
