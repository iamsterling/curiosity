import { describe, expect, test } from "bun:test";
import { stripVTControlCharacters } from "node:util";
import { signCommand, type SignedCommandEnvelope } from "../src/index.js";
import {
  runTuiSession,
  sanitizeConversationText,
  sanitizeTerminalText,
  type TuiHarness,
  type TuiScreenTerminal,
} from "../src/tui/session.js";
import { resolveTuiAgentId, resolveTuiConfig } from "../src/tui/config.js";
import {
  resolveAiSdkEffort,
  resolveAiSdkModelId,
} from "../src/providers/ai-sdk.js";
import { renderMarkdown } from "../src/tui/markdown.js";
import { renderTuiFrame, type TerminalFrame } from "../src/tui/frame.js";
import type { TuiKey } from "../src/tui/screen-terminal.js";
import { makeTerminalTheme } from "../src/tui/theme.js";
import { brailleFrame, resolveMotionPreference } from "../src/tui/animation.js";
import { TUI_DESIGN_TOKENS } from "../src/tui/design-system.js";

describe("custom harness TUI", () => {
  test("accepts a prompt immediately and streams through a signed chat turn", async () => {
    const events: TuiKey[] = [
      { type: "text", value: "Ship the" },
      { type: "newline" },
      { type: "text", value: "TUI" },
      { type: "enter" },
      { type: "quit" },
    ];
    const frames: TerminalFrame[] = [];
    const submissions: SignedCommandEnvelope[] = [];
    const terminal: TuiScreenTerminal = {
      close: () => undefined,
      drainInput: () => undefined,
      draw: (frame) => frames.push(frame),
      readKey: async () => events.shift() ?? { type: "quit" },
      size: () => ({ columns: 120, rows: 40 }),
    };
    const harness: TuiHarness = {
      catalog: {
        agents: [
          {
            description: "Direct execution",
            id: "generalist",
            mode: "primary",
          },
        ],
        digest: "test-catalog",
        pluginIds: [],
        promptCommands: [],
        skills: [],
        tools: [],
        workflows: [],
      },
      projections: {
        messages: async () => [],
        plugin: async () => ({}),
        threads: async () => [],
      },
      chat: async (envelope, onTextDelta) => {
        const signed = envelope as SignedCommandEnvelope;
        submissions.push(signed);
        const payload = signed.command.payload as {
          assistantMessageId: string;
          threadId: string;
          turnId: string;
        };
        onTextDelta?.("Done.");
        await Bun.sleep(180);
        return {
          assistantMessageId: payload.assistantMessageId,
          durationMs: 1_250,
          effort: "medium",
          modelId: "openai-oauth:gpt-5.4-mini",
          text: "Done.",
          threadId: payload.threadId,
          turnId: payload.turnId,
        };
      },
      submit: async () => ({
        actorId: "local-owner",
        commandId: "prompt-command",
        disposition: "accepted",
        eventCount: 1,
        firstSequence: 1,
        lastSequence: 1,
      }),
    };
    const ids = [
      "thread-001",
      "turn-001",
      "command-001",
      "assistant-001",
      "user-001",
      "nonce-001",
    ];
    const secret = "development-secret-with-at-least-32-bytes";

    await runTuiSession({
      actorId: "local-owner",
      createId: () => ids.shift() ?? "unused",
      harness,
      issuedAt: () => "2026-08-25T00:00:00.000Z",
      effort: "medium",
      modelId: "openai-oauth:gpt-5.4-mini",
      motion: "full",
      secret,
      terminal,
      workingDirectory: "~/dev/curiosity",
    });

    const rendered = frames
      .flatMap((frame) => frame.lines)
      .map(stripVTControlCharacters)
      .join("\n");
    expect(rendered).toContain("│");
    expect(rendered).toContain(
      "CHAT / gpt-5.4-mini · openai-oauth / EFFORT medium",
    );
    expect(rendered).toContain("Done.");
    expect(rendered).toContain("⠉ Working…");
    expect(rendered).toContain("⠘ Working…");
    expect(rendered).toContain("Ask Curiosity…");
    expect(rendered).toContain("● KERNEL / DURABLE");
    expect(rendered).not.toContain("title>");
    expect(submissions).toHaveLength(1);
    const submission = submissions[0];
    if (!submission) throw new Error("expected one submission");
    const { signature, ...unsigned } = submission;
    expect(signCommand(unsigned, secret).signature).toBe(signature);
    expect(unsigned.command).toEqual({
      id: "command-001",
      kind: "chat.turn",
      payload: {
        assistantMessageId: "assistant-001",
        text: "Ship the\nTUI",
        threadId: "thread-001",
        turnId: "turn-001",
        userMessageId: "user-001",
      },
      schemaVersion: 1,
    });
  });

  test("activates a slash-command skill before submitting its chat turn", async () => {
    const events: TuiKey[] = [
      { type: "text", value: "/research Compare releases" },
      { type: "enter" },
      { type: "quit" },
    ];
    const commands: SignedCommandEnvelope[] = [];
    const terminal: TuiScreenTerminal = {
      close: () => undefined,
      drainInput: () => undefined,
      draw: () => undefined,
      readKey: async () => events.shift() ?? { type: "quit" },
      size: () => ({ columns: 120, rows: 40 }),
    };
    const harness: TuiHarness = {
      catalog: {
        agents: [
          {
            description: "Direct execution",
            id: "generalist",
            mode: "primary",
          },
        ],
        digest: "test-catalog",
        pluginIds: [],
        promptCommands: [
          {
            description: "Research",
            name: "research",
            status: "active",
          },
        ],
        skills: [],
        tools: [],
        workflows: [],
      },
      chat: async (envelope) => {
        const signed = envelope as SignedCommandEnvelope;
        commands.push(signed);
        const payload = signed.command.payload as {
          assistantMessageId: string;
          threadId: string;
          turnId: string;
        };
        return {
          assistantMessageId: payload.assistantMessageId,
          durationMs: 10,
          effort: "medium",
          modelId: "test:model",
          text: "Done.",
          threadId: payload.threadId,
          turnId: payload.turnId,
        };
      },
      projections: {
        messages: async () => [],
        plugin: async () => ({}),
        threads: async () => [],
      },
      submit: async (envelope) => {
        const signed = envelope as SignedCommandEnvelope;
        commands.push(signed);
        return {
          actorId: signed.actorId,
          commandId: signed.command.id,
          disposition: "accepted",
          eventCount: 1,
          firstSequence: 1,
          lastSequence: 1,
        };
      },
    };
    const ids = [
      "thread-research",
      "activation-research",
      "command-research",
      "nonce-research",
      "turn-research",
      "command-chat",
      "assistant-research",
      "user-research",
      "nonce-chat",
    ];
    const secret = "development-secret-with-at-least-32-bytes";

    await runTuiSession({
      actorId: "local-owner",
      createId: () => ids.shift() ?? "unused",
      effort: "medium",
      harness,
      issuedAt: () => "2026-08-25T00:00:00.000Z",
      modelId: "test:model",
      motion: "reduced",
      secret,
      terminal,
      workingDirectory: "~/dev/curiosity",
    });

    expect(commands.map(({ command }) => command.kind)).toEqual([
      "prompt.command.invoke",
      "chat.turn",
    ]);
    const activation = commands[0];
    if (!activation) throw new Error("expected activation command");
    expect(activation.command.payload).toEqual({
      activationId: "activation-research",
      arguments: "Compare releases",
      name: "research",
      schemaVersion: 1,
      threadId: "thread-research",
    });
    expect(signCommand(activation, secret).signature).toBe(
      activation.signature,
    );
    const chat = commands[1];
    if (!chat) throw new Error("expected chat command");
    expect(chat.command.payload).toMatchObject({
      text: "/research Compare releases",
      threadId: "thread-research",
    });
  });

  test("removes terminal control sequences from projected text", () => {
    expect(sanitizeTerminalText("safe\u001b[2Jspoof\nnext")).toBe(
      "safe�[2Jspoof�next",
    );
    expect(sanitizeConversationText("line 1\nline 2\u001b[2J")).toBe(
      "line 1\nline 2�[2J",
    );
  });

  test("resolves secure local defaults without environment setup", () => {
    const config = resolveTuiConfig(
      {},
      {
        createSecret: () => "a".repeat(64),
        homeDirectory: "/home/local-owner",
        supervisorPath: "/package/curiosity-supervisor",
        workingDirectory: "/workspace",
      },
    );

    expect(config).toEqual({
      actorId: "local-owner",
      authenticationSecret: "a".repeat(64),
      databasePath: "/home/local-owner/.curiosity/events.sqlite",
      supervisorPath: "/package/curiosity-supervisor",
      workspaceRoot: "/workspace",
    });
  });

  test("selects API-key providers before the local OpenAI OAuth default", () => {
    expect(resolveAiSdkModelId({ OPENAI_API_KEY: "secret" })).toBe(
      "openai:gpt-5.4-mini",
    );
    expect(resolveAiSdkModelId({})).toBe("openai-oauth:gpt-5.4-mini");
    expect(resolveAiSdkEffort({}, "openai-oauth:gpt-5.4-mini")).toBe("medium");
    expect(resolveTuiAgentId({ CURIOSITY_AGENT: "researcher" })).toBe(
      "researcher",
    );
    expect(
      resolveAiSdkEffort(
        { CURIOSITY_EFFORT: "high" },
        "openai-oauth:gpt-5.4-mini",
      ),
    ).toBe("high");
  });

  test("renders completed Markdown with terminal structure", () => {
    const rendered = renderMarkdown(
      "# Heading\n\n- **bold**\n- `code`\n\n\u001b[2Jspoof",
      {
        theme: makeTerminalTheme(false),
        width: 60,
      },
    );
    expect(rendered).toContain("Heading");
    expect(rendered).toContain("bold");
    expect(rendered).toContain("code");
    expect(rendered).not.toContain("**bold**");
    expect(rendered).not.toContain("\u001b");
  });

  test("matches the five OpenCode and Crush acceptance frames", () => {
    const theme = makeTerminalTheme(false);
    const splash = renderTuiFrame(
      {
        animationTick: 0,
        columns: 120,
        effort: "high",
        input: "",
        inputCursor: 0,
        messages: [],
        modelId: "openai-oauth:gpt-5.4-mini",
        motion: "full",
        rows: 40,
        scrollOffset: 0,
        status: "idle",
        workingDirectory: "~/dev/curiosity",
      },
      theme,
    );
    const splashText = splash.lines.join("\n");
    expect(splashText).toContain("C U R I O S I T Y");
    expect(splashText).toContain("● SYSTEM / READY");
    expect(splashText).toContain("Ask Curiosity…");
    expect(splashText).toContain(
      "CHAT / gpt-5.4-mini · openai-oauth / EFFORT high",
    );
    expect(splashText).toContain("/new  new thread");
    expect(splashText).not.toContain("█▀▀ █ █");
    expect(splash.cursor).toBeDefined();

    const active = renderTuiFrame(
      {
        animationTick: 0,
        columns: 120,
        effort: "high",
        input: "",
        inputCursor: 0,
        messages: [
          {
            messageId: "user-1",
            role: "user",
            sequence: 1,
            text: "Explain the durable kernel",
            threadId: "thread-1",
            turnId: "turn-1",
          },
          {
            durationMs: 1_250,
            effort: "high",
            messageId: "assistant-1",
            modelId: "openai-oauth:gpt-5.4-mini",
            role: "assistant",
            sequence: 2,
            text: "## Result\n\n- **Durable** events\n- `Effect` runtime",
            threadId: "thread-1",
            turnId: "turn-1",
          },
        ],
        modelId: "openai-oauth:gpt-5.4-mini",
        motion: "full",
        rows: 40,
        scrollOffset: 0,
        status: "idle",
        threadTitle: "Durable kernel",
        workingDirectory: "~/dev/curiosity",
      },
      theme,
    );
    const activeText = active.lines.join("\n");
    expect(activeText).toContain("THREAD / Durable kernel");
    expect(activeText).toContain("Explain the durable kernel");
    expect(activeText).toContain("Durable");
    expect(activeText).not.toContain("**Durable**");
    expect(activeText).not.toContain("YOU");
    expect(activeText).not.toContain("ASSISTANT");
    for (const line of active.lines)
      expect(Array.from(stripVTControlCharacters(line)).length).toBe(119);

    const working = renderTuiFrame(
      {
        animationTick: 2,
        columns: 120,
        effort: "high",
        input: "",
        inputCursor: 0,
        messages: [],
        modelId: "openai-oauth:gpt-5.4-mini",
        motion: "full",
        rows: 40,
        scrollOffset: 0,
        status: "working",
        submittedText: "Inspect the renderer",
        workingDirectory: "~/dev/curiosity",
      },
      theme,
    );
    const workingText = working.lines.join("\n");
    expect(workingText).toContain("Inspect the renderer");
    expect(workingText).toContain("⠰ Working…");
    expect(working.cursor).toBeUndefined();

    const failed = renderTuiFrame(
      {
        animationTick: 0,
        columns: 100,
        effort: "high",
        error: "PROVIDER_STREAM_FAILED",
        input: "",
        inputCursor: 0,
        messages: [],
        modelId: "openai-oauth:gpt-5.4-mini",
        motion: "full",
        rows: 32,
        scrollOffset: 0,
        status: "idle",
        workingDirectory: "~/dev/curiosity",
      },
      theme,
    );
    const failedText = failed.lines.join("\n");
    expect(failedText).toContain("PROVIDER_STREAM_FAILED");
    expect(failedText).toContain("Retry after resolving");

    const compact = renderTuiFrame(
      {
        animationTick: 0,
        columns: 72,
        effort: "high",
        input: "first line\nsecond line",
        inputCursor: 22,
        messages: [],
        modelId: "openai-oauth:gpt-5.4-mini",
        motion: "full",
        rows: 24,
        scrollOffset: 0,
        status: "idle",
        workingDirectory: "~/dev/curiosity",
      },
      theme,
    );
    const compactText = compact.lines.join("\n");
    expect(compactText).toContain("first line");
    expect(compactText).toContain("second line");
    expect(compactText).toContain("CHAT / gpt-5.4-mini / EFFORT high");
    expect(compactText).not.toContain("openai-oauth");
    expect(compactText).not.toContain("█▀▀ █ █");
    expect(compact.cursor?.row).toBeGreaterThan(0);
    for (const line of compact.lines)
      expect(Bun.stringWidth(stripVTControlCharacters(line))).toBe(71);
  });

  test("advances restrained braille animations without changing geometry", () => {
    expect(
      Array.from({ length: 8 }, (_, tick) =>
        brailleFrame("orbit", tick, "full"),
      ),
    ).toEqual(["⠉", "⠘", "⠰", "⢠", "⣀", "⡄", "⠆", "⠃"]);
    expect(brailleFrame("breathe", 7, "full")).toBe("⢕");
    expect(Bun.stringWidth(brailleFrame("wave", 5, "full"))).toBe(2);
    expect(brailleFrame("orbit", 99, "reduced")).toBe("⠿");
    expect(resolveMotionPreference({ CURIOSITY_MOTION: "reduce" })).toBe(
      "reduced",
    );
    expect(resolveMotionPreference({})).toBe("full");
  });

  test("defines restrained semantic tokens for every terminal state", () => {
    expect(TUI_DESIGN_TOKENS.color).toEqual({
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
    });
    expect(TUI_DESIGN_TOKENS.layout).toMatchObject({
      compactColumns: 80,
      compactRows: 30,
      contentInset: 2,
      readingWidth: 112,
    });
    expect(TUI_DESIGN_TOKENS.motion).toEqual({
      activeFrameMs: 120,
      idleAnimation: false,
    });
  });
});
