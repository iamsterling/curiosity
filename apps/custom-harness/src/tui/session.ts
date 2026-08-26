import { randomUUID } from "node:crypto";
import type { CuriosityHarness } from "../kernel/runtime.js";
import { ANIMATION_INTERVAL_MS, type MotionPreference } from "./animation.js";
import { renderTuiFrame } from "./frame.js";
import type { TuiScreenTerminal } from "./screen-terminal.js";
import {
  failureTag,
  fallbackMessages,
  latestThread,
  parsePromptCommand,
  signPromptCommand,
  signTurn,
} from "./session-turn.js";
import {
  sanitizeConversationText,
  sanitizeTerminalText,
} from "./terminal-text.js";
import { makeTerminalTheme } from "./theme.js";

export { sanitizeConversationText, sanitizeTerminalText };
export type { TuiScreenTerminal };

export type TuiHarness = Pick<
  CuriosityHarness,
  "chat" | "projections" | "submit"
>;

export interface TuiSessionOptions {
  readonly actorId: string;
  readonly color?: boolean;
  readonly createId?: () => string;
  readonly effort: string;
  readonly harness: TuiHarness;
  readonly issuedAt?: () => string;
  readonly modelId: string;
  readonly motion: MotionPreference;
  readonly secret: string;
  readonly terminal: TuiScreenTerminal;
  readonly workingDirectory: string;
}

export const runTuiSession = async (
  options: TuiSessionOptions,
): Promise<void> => {
  const createId = options.createId ?? randomUUID;
  const issuedAt = options.issuedAt ?? (() => new Date().toISOString());
  const theme = makeTerminalTheme(options.color ?? false);
  let thread = latestThread(await options.harness.projections.threads());
  let messages = thread
    ? await options.harness.projections.messages(thread.threadId)
    : [];
  let input = "";
  let inputCursor = 0;
  let animationTick = 0;
  let animationTimer: ReturnType<typeof setInterval> | undefined;
  let scrollOffset = 0;
  let status: "idle" | "working" = "idle";
  let streamingText: string | undefined;
  let submittedText: string | undefined;
  let error: string | undefined;

  const draw = (): void => {
    const size = options.terminal.size();
    options.terminal.draw(
      renderTuiFrame(
        {
          animationTick,
          columns: size.columns,
          effort: options.effort,
          ...(error ? { error } : {}),
          input,
          inputCursor,
          messages,
          modelId: options.modelId,
          motion: options.motion,
          rows: size.rows,
          scrollOffset,
          status,
          ...(streamingText ? { streamingText } : {}),
          ...(submittedText ? { submittedText } : {}),
          ...(thread?.title ? { threadTitle: thread.title } : {}),
          workingDirectory: options.workingDirectory,
        },
        theme,
      ),
    );
  };

  const stopAnimation = (): void => {
    if (animationTimer === undefined) return;
    clearInterval(animationTimer);
    animationTimer = undefined;
  };

  const startAnimation = (): void => {
    stopAnimation();
    animationTick = 0;
    if (options.motion === "reduced") return;
    animationTimer = setInterval(() => {
      animationTick += 1;
      draw();
    }, ANIMATION_INTERVAL_MS);
  };

  draw();
  while (true) {
    const key = await options.terminal.readKey();
    if (key.type === "quit") return;
    if (key.type === "resize") {
      draw();
      continue;
    }
    if (key.type === "up") {
      scrollOffset += 3;
      draw();
      continue;
    }
    if (key.type === "down") {
      scrollOffset = Math.max(0, scrollOffset - 3);
      draw();
      continue;
    }
    const characters = Array.from(input);
    if (key.type === "text") {
      characters.splice(inputCursor, 0, ...Array.from(key.value));
      input = characters.join("");
      inputCursor += Array.from(key.value).length;
      draw();
      continue;
    }
    if (key.type === "newline") {
      characters.splice(inputCursor, 0, "\n");
      input = characters.join("");
      inputCursor += 1;
      draw();
      continue;
    }
    if (key.type === "left") inputCursor = Math.max(0, inputCursor - 1);
    if (key.type === "right")
      inputCursor = Math.min(characters.length, inputCursor + 1);
    if (key.type === "home") inputCursor = 0;
    if (key.type === "end") inputCursor = characters.length;
    if (key.type === "backspace" && inputCursor > 0) {
      characters.splice(inputCursor - 1, 1);
      input = characters.join("");
      inputCursor -= 1;
    }
    if (key.type === "delete" && inputCursor < characters.length) {
      characters.splice(inputCursor, 1);
      input = characters.join("");
    }
    if (key.type !== "enter") {
      draw();
      continue;
    }

    const text = input.trim();
    input = "";
    inputCursor = 0;
    if (text === "/quit") return;
    if (text === "/new") {
      thread = undefined;
      messages = [];
      scrollOffset = 0;
      streamingText = undefined;
      submittedText = undefined;
      error = undefined;
      draw();
      continue;
    }
    if (!text) {
      draw();
      continue;
    }

    const threadId = thread?.threadId ?? createId();
    const promptCommand = parsePromptCommand(text);
    const promptEnvelope = promptCommand
      ? signPromptCommand(
          options,
          threadId,
          promptCommand,
          createId,
          issuedAt,
        )
      : undefined;
    const envelope = signTurn(options, threadId, text, createId, issuedAt);
    submittedText = text;
    streamingText = undefined;
    error = undefined;
    status = "working";
    scrollOffset = 0;
    startAnimation();
    draw();
    try {
      if (promptEnvelope) await options.harness.submit(promptEnvelope);
      const result = await options.harness.chat(envelope, (delta) => {
        streamingText = `${streamingText ?? ""}${delta}`;
        draw();
      });
      const projected = await options.harness.projections.messages(threadId);
      messages =
        projected.length > 0 ? projected : fallbackMessages(envelope, result);
      thread ??= {
        openedBy: options.actorId,
        sequence: Number.MAX_SAFE_INTEGER,
        threadId,
        title: text,
      };
      submittedText = undefined;
      streamingText = undefined;
      status = "idle";
      stopAnimation();
      options.terminal.drainInput();
      draw();
    } catch (cause) {
      const projected = await options.harness.projections.messages(threadId);
      if (projected.length > 0) {
        messages = projected;
        submittedText = undefined;
      }
      streamingText = undefined;
      status = "idle";
      stopAnimation();
      error = failureTag(cause);
      if (options.modelId.startsWith("openai-oauth:"))
        error += " · Run `npx openai-oauth login`, then retry.";
      options.terminal.drainInput();
      draw();
    }
  }
};
