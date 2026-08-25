import { emitKeypressEvents, type Key } from "node:readline";
import type { TerminalFrame } from "./frame.js";

export type TuiKey =
  | { readonly type: "backspace" }
  | { readonly type: "delete" }
  | { readonly type: "down" }
  | { readonly type: "end" }
  | { readonly type: "enter" }
  | { readonly type: "home" }
  | { readonly type: "left" }
  | { readonly type: "newline" }
  | { readonly type: "quit" }
  | { readonly type: "resize" }
  | { readonly type: "right" }
  | { readonly type: "text"; readonly value: string }
  | { readonly type: "up" };

export interface TuiScreenTerminal {
  readonly close: () => void;
  readonly drainInput: () => void;
  readonly draw: (frame: TerminalFrame) => void;
  readonly readKey: () => Promise<TuiKey>;
  readonly size: () => { readonly columns: number; readonly rows: number };
}

const ENTER_SCREEN = "\u001b[?1049h\u001b[?7l\u001b[2J\u001b[H";
const LEAVE_SCREEN = "\u001b[0m\u001b[?25h\u001b[?7h\u001b[?1049l";
const HIDE_CURSOR = "\u001b[?25l";
const SHOW_CURSOR = "\u001b[?25h";

const toTuiKey = (value: string | undefined, key: Key): TuiKey | undefined => {
  if (
    (key.ctrl && (key.name === "c" || key.name === "d")) ||
    key.name === "escape"
  )
    return { type: "quit" };
  if (
    (key.name === "return" || key.name === "enter") &&
    (key.shift || key.ctrl || key.meta)
  )
    return { type: "newline" };
  if (key.ctrl && key.name === "j") return { type: "newline" };
  if (key.name === "return" || key.name === "enter") return { type: "enter" };
  if (key.name === "backspace") return { type: "backspace" };
  if (key.name === "delete") return { type: "delete" };
  if (key.name === "left") return { type: "left" };
  if (key.name === "right") return { type: "right" };
  if (key.name === "up") return { type: "up" };
  if (key.name === "down") return { type: "down" };
  if (key.name === "home") return { type: "home" };
  if (key.name === "end") return { type: "end" };
  if (value && !key.ctrl && !key.meta && !/[\u0000-\u001f\u007f]/u.test(value))
    return { type: "text", value };
  return undefined;
};

export const createNodeScreenTerminal = (
  input: NodeJS.ReadStream,
  output: NodeJS.WriteStream,
): TuiScreenTerminal => {
  const queue: TuiKey[] = [];
  const readers: Array<(key: TuiKey) => void> = [];
  let previousLines: readonly string[] = [];
  let closed = false;
  const wasRaw = input.isRaw ?? false;

  const push = (event: TuiKey): void => {
    const reader = readers.shift();
    if (reader) reader(event);
    else queue.push(event);
  };
  const onKeypress = (value: string | undefined, key: Key): void => {
    const event = toTuiKey(value, key);
    if (event) push(event);
  };
  const onResize = (): void => push({ type: "resize" });

  emitKeypressEvents(input);
  input.setRawMode?.(true);
  input.resume();
  input.on("keypress", onKeypress);
  output.on("resize", onResize);
  output.write(ENTER_SCREEN);

  const terminal: TuiScreenTerminal = {
    close: () => {
      if (closed) return;
      closed = true;
      input.off("keypress", onKeypress);
      output.off("resize", onResize);
      input.setRawMode?.(wasRaw);
      output.write(LEAVE_SCREEN);
      while (readers.length > 0) readers.shift()?.({ type: "quit" });
    },
    drainInput: () => {
      queue.length = 0;
    },
    draw: (frame: TerminalFrame) => {
      if (closed) return;
      let outputValue = HIDE_CURSOR;
      const maxRows = Math.max(previousLines.length, frame.lines.length);
      for (let row = 0; row < maxRows; row += 1) {
        const next = frame.lines[row] ?? "";
        if (next === previousLines[row]) continue;
        outputValue += `\u001b[${row + 1};1H\u001b[2K${next}`;
      }
      previousLines = frame.lines;
      if (frame.cursor) {
        outputValue += `\u001b[${frame.cursor.row + 1};${frame.cursor.column + 1}H${SHOW_CURSOR}`;
      }
      output.write(outputValue);
    },
    readKey: async (): Promise<TuiKey> => {
      const event = queue.shift();
      if (event) return event;
      if (closed) return { type: "quit" };
      return await new Promise<TuiKey>((resolve) => readers.push(resolve));
    },
    size: () => ({
      columns: Math.max(20, output.columns ?? 80),
      rows: Math.max(12, output.rows ?? 24),
    }),
  };
  return Object.freeze(terminal);
};
