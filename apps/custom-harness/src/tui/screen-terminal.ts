import { emitKeypressEvents, type Key } from "node:readline";
import type { TerminalFrame } from "./frame.js";

export type TuiKey =
  | { readonly type: "backspace" }
  | { readonly type: "delete" }
  | { readonly type: "down" }
  | { readonly type: "end" }
  | { readonly type: "enter" }
  | { readonly type: "escape" }
  | { readonly type: "home" }
  | { readonly type: "inspect" }
  | { readonly type: "left" }
  | { readonly type: "newline" }
  | { readonly type: "palette" }
  | { readonly type: "page-down" }
  | { readonly type: "page-up" }
  | { readonly type: "quit" }
  | { readonly type: "resize" }
  | { readonly type: "right" }
  | { readonly lines: number; readonly type: "scroll" }
  | { readonly type: "text"; readonly value: string }
  | { readonly type: "up" };

export interface TuiScreenTerminal {
  readonly close: () => void;
  readonly drainInput: () => void;
  readonly draw: (frame: TerminalFrame) => void;
  readonly readKey: () => Promise<TuiKey>;
  readonly size: () => { readonly columns: number; readonly rows: number };
}

const RESET_MOUSE =
  "\u001b[?1000l\u001b[?1002l\u001b[?1003l\u001b[?1005l\u001b[?1006l\u001b[?1015l";
const ENABLE_MOUSE_WHEEL = "\u001b[?1000h\u001b[?1006h";
const ENTER_SCREEN = `${RESET_MOUSE}\u001b[?1049h\u001b[?7l\u001b[2J\u001b[H${ENABLE_MOUSE_WHEEL}`;
const LEAVE_SCREEN = `\u001b[0m\u001b[?25h${RESET_MOUSE}\u001b[?7h\u001b[?1049l`;
const HIDE_CURSOR = "\u001b[?25l";
const SHOW_CURSOR = "\u001b[?25h";
const SGR_MOUSE_PREFIX = "\u001b[<";
const SGR_MOUSE_FRAME = /^\u001b\[<(\d+);(\d+);(\d+)[Mm]$/u;
const FRAME_INTERVAL_MS = 16;

const toTuiKey = (value: string | undefined, key: Key): TuiKey | undefined => {
  if (key.ctrl && (key.name === "c" || key.name === "d"))
    return { type: "quit" };
  if (key.name === "escape") return { type: "escape" };
  if (key.ctrl && key.name === "i") return { type: "inspect" };
  if (key.ctrl && key.name === "k") return { type: "palette" };
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
  if (key.name === "pageup") return { type: "page-up" };
  if (key.name === "pagedown") return { type: "page-down" };
  if (key.name === "home") return { type: "home" };
  if (key.name === "end") return { type: "end" };
  if (value && !key.ctrl && !key.meta && !/[\u0000-\u001f\u007f]/u.test(value))
    return { type: "text", value };
  return undefined;
};

interface TerminalKeyDecoder {
  readonly decode: (value: string | undefined, key: Key) => TuiKey | undefined;
  readonly reset: () => void;
}

const mouseKey = (frame: string): TuiKey | undefined => {
  const match = SGR_MOUSE_FRAME.exec(frame);
  const encodedButton = Number(match?.[1]);
  if (!match || !Number.isSafeInteger(encodedButton) || (encodedButton & 64) === 0)
    return undefined;
  if ((encodedButton & 3) === 0) return { lines: 3, type: "scroll" };
  if ((encodedButton & 3) === 1) return { lines: -3, type: "scroll" };
  return undefined;
};

const createTerminalKeyDecoder = (): TerminalKeyDecoder => {
  let mouseFrame: string | undefined;
  return {
    decode: (value, key) => {
      const sequence = key.sequence ?? value ?? "";
      if (sequence.startsWith(SGR_MOUSE_PREFIX)) {
        if (SGR_MOUSE_FRAME.test(sequence)) return mouseKey(sequence);
        mouseFrame = sequence;
        return undefined;
      }
      if (mouseFrame !== undefined) {
        mouseFrame += sequence;
        if (mouseFrame.length > 64) {
          mouseFrame = undefined;
          return undefined;
        }
        if (!/[Mm]$/u.test(mouseFrame)) return undefined;
        const frame = mouseFrame;
        mouseFrame = undefined;
        return mouseKey(frame);
      }
      return toTuiKey(value, key);
    },
    reset: () => {
      mouseFrame = undefined;
    },
  };
};

export const createNodeScreenTerminal = (
  input: NodeJS.ReadStream,
  output: NodeJS.WriteStream,
): TuiScreenTerminal => {
  const queue: TuiKey[] = [];
  const readers: Array<(key: TuiKey) => void> = [];
  let previousLines: readonly string[] = [];
  let previousTranscriptViewport: TerminalFrame["transcriptViewport"];
  let pendingFrame: TerminalFrame | undefined;
  let frameTimer: ReturnType<typeof setTimeout> | undefined;
  let lastFrameAt = 0;
  let outputBlocked = false;
  let closed = false;
  const wasRaw = input.isRaw ?? false;
  const decoder = createTerminalKeyDecoder();

  const push = (event: TuiKey): void => {
    const reader = readers.shift();
    if (reader) reader(event);
    else if (event.type === "scroll") {
      const previous = queue.at(-1);
      if (previous?.type !== "scroll") {
        queue.push(event);
        return;
      }
      const lines = previous.lines + event.lines;
      if (lines === 0) queue.pop();
      else queue[queue.length - 1] = { lines, type: "scroll" };
    } else queue.push(event);
  };
  const onKeypress = (value: string | undefined, key: Key): void => {
    const event = decoder.decode(value, key);
    if (event) push(event);
  };
  const onResize = (): void => push({ type: "resize" });
  const shiftedTranscriptBaseline = (
    frame: TerminalFrame,
  ):
    | {
        readonly baseline: readonly string[];
        readonly command: string;
      }
    | undefined => {
    const previous = previousTranscriptViewport;
    const next = frame.transcriptViewport;
    if (
      !previous ||
      !next ||
      previous.startRow !== next.startRow ||
      previous.endRow !== next.endRow
    )
      return undefined;
    const delta = next.offset - previous.offset;
    const height = next.endRow - next.startRow;
    const amount = Math.abs(delta);
    if (delta === 0 || amount >= height) return undefined;
    const movedDown = delta > 0;
    for (
      let row = movedDown ? next.startRow + amount : next.startRow;
      row < (movedDown ? next.endRow : next.endRow - amount);
      row += 1
    ) {
      const previousRow = movedDown ? row - amount : row + amount;
      if (frame.lines[row] !== previousLines[previousRow]) return undefined;
    }
    const baseline = [...previousLines];
    if (movedDown) {
      for (let row = next.endRow - 1; row >= next.startRow + amount; row -= 1)
        baseline[row] = previousLines[row - amount] ?? "";
      for (let row = next.startRow; row < next.startRow + amount; row += 1)
        baseline[row] = "";
    } else {
      for (let row = next.startRow; row < next.endRow - amount; row += 1)
        baseline[row] = previousLines[row + amount] ?? "";
      for (let row = next.endRow - amount; row < next.endRow; row += 1)
        baseline[row] = "";
    }
    const scroll = movedDown ? "T" : "S";
    return {
      baseline,
      command: `\u001b[${next.startRow + 1};${next.endRow}r\u001b[${next.startRow + 1};1H\u001b[${amount}${scroll}\u001b[r`,
    };
  };
  const frameOutput = (frame: TerminalFrame): string => {
    const shifted = shiftedTranscriptBaseline(frame);
    const baseline = shifted?.baseline ?? previousLines;
    let outputValue = `${HIDE_CURSOR}${shifted?.command ?? ""}`;
    const maxRows = Math.max(baseline.length, frame.lines.length);
    for (let row = 0; row < maxRows; row += 1) {
      const next = frame.lines[row] ?? "";
      if (next === baseline[row]) continue;
      outputValue += `\u001b[${row + 1};1H\u001b[2K${next}`;
    }
    previousLines = frame.lines;
    previousTranscriptViewport = frame.transcriptViewport;
    if (frame.cursor)
      outputValue += `\u001b[${frame.cursor.row + 1};${frame.cursor.column + 1}H${SHOW_CURSOR}`;
    return outputValue;
  };
  const scheduleFrame = (): void => {
    if (closed || outputBlocked || frameTimer !== undefined || !pendingFrame)
      return;
    const elapsed = performance.now() - lastFrameAt;
    const delay =
      previousLines.length === 0
        ? 0
        : Math.max(0, FRAME_INTERVAL_MS - elapsed);
    frameTimer = setTimeout(() => {
      frameTimer = undefined;
      const frame = pendingFrame;
      pendingFrame = undefined;
      if (!frame || closed) return;
      outputBlocked = !output.write(frameOutput(frame));
      lastFrameAt = performance.now();
      if (!outputBlocked) scheduleFrame();
    }, delay);
  };
  const onDrain = (): void => {
    outputBlocked = false;
    scheduleFrame();
  };

  emitKeypressEvents(input);
  input.setRawMode?.(true);
  input.resume();
  input.on("keypress", onKeypress);
  output.on("resize", onResize);
  output.on("drain", onDrain);
  output.write(ENTER_SCREEN);

  const terminal: TuiScreenTerminal = {
    close: () => {
      if (closed) return;
      closed = true;
      if (frameTimer !== undefined) clearTimeout(frameTimer);
      frameTimer = undefined;
      pendingFrame = undefined;
      input.off("keypress", onKeypress);
      output.off("resize", onResize);
      output.off("drain", onDrain);
      input.setRawMode?.(wasRaw);
      output.write(LEAVE_SCREEN);
      while (readers.length > 0) readers.shift()?.({ type: "quit" });
    },
    drainInput: () => {
      queue.length = 0;
      decoder.reset();
    },
    draw: (frame: TerminalFrame) => {
      if (closed) return;
      pendingFrame = frame;
      scheduleFrame();
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
