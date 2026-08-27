import { randomUUID } from "node:crypto";
import type { CuriosityHarness } from "../kernel/runtime.js";
import { ANIMATION_INTERVAL_MS, type MotionPreference } from "./animation.js";
import { filterPaletteItems } from "./command-palette-view.js";
import { renderTuiFrame } from "./frame.js";
import type {
  TuiCatalogView,
  TuiInspectorView,
  TuiPaletteItem,
} from "./frame-types.js";
import type { TuiScreenTerminal } from "./screen-terminal.js";
import {
  failureTag,
  fallbackMessages,
  latestThread,
  parsePromptCommand,
  signPromptCommand,
  signQuestionAnswer,
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
  "catalog" | "chat" | "projections" | "status" | "submit"
>;

export interface TuiSessionOptions {
  readonly agentId?: string;
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
  const agentId = options.agentId ?? options.harness.catalog.defaultPrimaryRole;
  if (!options.harness.catalog.agents.some((agent) => agent.id === agentId))
    throw new Error("TUI_AGENT_UNKNOWN");
  const theme = makeTerminalTheme(options.color ?? false);
  const capabilityStatus = await options.harness.status();
  const catalog: TuiCatalogView = Object.freeze({
    digest: options.harness.catalog.digest,
    pluginIds: options.harness.catalog.pluginIds,
    toolNames: options.harness.catalog.tools,
    workflowNames: options.harness.catalog.workflows,
  });
  const inspector: TuiInspectorView = Object.freeze({
    capabilities: capabilityStatus.capabilities,
    catalog,
    profile: capabilityStatus.profile,
  });
  const paletteItems: readonly TuiPaletteItem[] = Object.freeze(
    [...options.harness.catalog.promptCommands]
      .sort(
        (left, right) =>
          Number(left.status !== "active") -
            Number(right.status !== "active") ||
          left.name.localeCompare(right.name),
      )
      .map(({ description, name, status }) =>
        Object.freeze({ description, name, status }),
      ),
  );
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
  let inspectorOpen = false;
  let paletteOpen = false;
  let paletteQuery = "";
  let paletteSelectedIndex = 0;
  const promptHistory = messages
    .filter(({ role }) => role === "user")
    .map(({ text }) => text);
  let promptHistoryIndex: number | undefined;
  let promptHistoryDraft = "";

  const setInput = (value: string): void => {
    input = value;
    inputCursor = Array.from(value).length;
  };

  const resetPromptHistoryNavigation = (): void => {
    promptHistoryIndex = undefined;
    promptHistoryDraft = "";
  };

  const draw = (): void => {
    const size = options.terminal.size();
    options.terminal.draw(
      renderTuiFrame(
        {
          actorId: options.actorId,
          animationTick,
          catalog,
          columns: size.columns,
          effort: options.effort,
          ...(error ? { error } : {}),
          input,
          inputCursor,
          messages,
          modelId: options.modelId,
          motion: options.motion,
          ...(inspectorOpen ? { inspector } : {}),
          ...(paletteOpen
            ? {
                palette: {
                  items: paletteItems,
                  query: paletteQuery,
                  selectedIndex: paletteSelectedIndex,
                },
              }
            : {}),
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
    if (key.type === "palette") {
      paletteOpen = !paletteOpen;
      inspectorOpen = false;
      if (paletteOpen) {
        paletteQuery = "";
        paletteSelectedIndex = 0;
      }
      draw();
      continue;
    }
    if (key.type === "inspect") {
      inspectorOpen = !inspectorOpen;
      paletteOpen = false;
      draw();
      continue;
    }
    if (key.type === "escape") {
      if (!paletteOpen && !inspectorOpen) return;
      paletteOpen = false;
      inspectorOpen = false;
      draw();
      continue;
    }
    if (paletteOpen) {
      const matches = filterPaletteItems(paletteItems, paletteQuery);
      if (key.type === "text") {
        paletteQuery += key.value;
        paletteSelectedIndex = 0;
      } else if (key.type === "backspace") {
        paletteQuery = Array.from(paletteQuery).slice(0, -1).join("");
        paletteSelectedIndex = 0;
      } else if (key.type === "up") {
        paletteSelectedIndex = Math.max(0, paletteSelectedIndex - 1);
      } else if (key.type === "down") {
        paletteSelectedIndex = Math.min(
          Math.max(0, matches.length - 1),
          paletteSelectedIndex + 1,
        );
      } else if (key.type === "home") {
        paletteSelectedIndex = 0;
      } else if (key.type === "end") {
        paletteSelectedIndex = Math.max(0, matches.length - 1);
      } else if (key.type === "enter") {
        const selected = matches[paletteSelectedIndex];
        if (selected) {
          input = `/${selected.name} `;
          inputCursor = Array.from(input).length;
          paletteOpen = false;
        }
      }
      draw();
      continue;
    }
    if (key.type === "page-up") {
      scrollOffset += Math.max(1, options.terminal.size().rows - 10);
      draw();
      continue;
    }
    if (key.type === "page-down") {
      scrollOffset = Math.max(
        0,
        scrollOffset - Math.max(1, options.terminal.size().rows - 10),
      );
      draw();
      continue;
    }
    if (key.type === "scroll") {
      scrollOffset = Math.max(0, scrollOffset + key.lines);
      draw();
      continue;
    }
    if (key.type === "up") {
      if (promptHistory.length > 0) {
        if (promptHistoryIndex === undefined) {
          promptHistoryDraft = input;
          promptHistoryIndex = promptHistory.length - 1;
        } else {
          promptHistoryIndex = Math.max(0, promptHistoryIndex - 1);
        }
        setInput(promptHistory[promptHistoryIndex] ?? "");
      }
      draw();
      continue;
    }
    if (key.type === "down") {
      if (promptHistoryIndex !== undefined) {
        if (promptHistoryIndex < promptHistory.length - 1) {
          promptHistoryIndex += 1;
          setInput(promptHistory[promptHistoryIndex] ?? "");
        } else {
          setInput(promptHistoryDraft);
          resetPromptHistoryNavigation();
        }
      }
      draw();
      continue;
    }
    const characters = Array.from(input);
    if (key.type === "text") {
      resetPromptHistoryNavigation();
      characters.splice(inputCursor, 0, ...Array.from(key.value));
      input = characters.join("");
      inputCursor += Array.from(key.value).length;
      draw();
      continue;
    }
    if (key.type === "newline") {
      resetPromptHistoryNavigation();
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
      resetPromptHistoryNavigation();
      characters.splice(inputCursor - 1, 1);
      input = characters.join("");
      inputCursor -= 1;
    }
    if (key.type === "delete" && inputCursor < characters.length) {
      resetPromptHistoryNavigation();
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
    resetPromptHistoryNavigation();
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
    if (promptHistory.at(-1) !== text) promptHistory.push(text);

    const pendingQuestion = (await options.harness.projections.questions()).find(
      ({ status }) => status === "pending",
    );
    if (pendingQuestion) {
      status = "working";
      error = undefined;
      startAnimation();
      draw();
      try {
        await options.harness.submit(
          signQuestionAnswer(
            options,
            pendingQuestion.questionId,
            text,
            createId,
            issuedAt,
          ),
        );
        if (thread)
          messages = await options.harness.projections.messages(thread.threadId);
        status = "idle";
        stopAnimation();
        options.terminal.drainInput();
        draw();
      } catch (cause) {
        status = "idle";
        stopAnimation();
        error = failureTag(cause);
        options.terminal.drainInput();
        draw();
      }
      continue;
    }

    const promptCommand = parsePromptCommand(text);
    const commandDefinition = promptCommand
      ? options.harness.catalog.promptCommands.find(
          (command) => command.name === promptCommand.name,
        )
      : undefined;
    if (
      promptCommand &&
      !commandDefinition
    ) {
      error = "PROMPT_COMMAND_UNKNOWN";
      draw();
      continue;
    }
    const threadId = thread?.threadId ?? createId();
    const promptEnvelope = promptCommand
      ? signPromptCommand(options, threadId, promptCommand, createId, issuedAt)
      : undefined;
    const envelope = signTurn(
      {
        ...options,
        ...(commandDefinition?.agentId
          ? { agentId: commandDefinition.agentId }
          : options.agentId
            ? { agentId }
            : {}),
      },
      threadId,
      text,
      createId,
      issuedAt,
    );
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
        thread ??= {
          openedBy: options.actorId,
          sequence: Number.MAX_SAFE_INTEGER,
          threadId,
          title: text,
        };
      }
      streamingText = undefined;
      status = "idle";
      stopAnimation();
      const question = (await options.harness.projections.questions()).find(
        ({ status }) => status === "pending",
      );
      error = question
        ? `${question.prompt} · ${question.options
            .map(({ id, label }) => `${id}: ${label}`)
            .join(" · ")}${question.allowFreeText ? " · free text allowed" : ""}`
        : failureTag(cause);
      if (options.modelId.startsWith("openai-oauth:"))
        error += " · Run `npx openai-oauth login`, then retry.";
      options.terminal.drainInput();
      draw();
    }
  }
};
