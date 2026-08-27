import { describe, expect, test } from "bun:test";
import { PassThrough } from "node:stream";
import { stripVTControlCharacters } from "node:util";
import { signCommand, type SignedCommandEnvelope } from "../src/index.js";
import { InputRejected, TextGenerationFailure } from "../src/kernel/errors.js";
import {
  runTuiSession,
  sanitizeConversationText,
  sanitizeTerminalText,
  type TuiHarness,
  type TuiScreenTerminal,
} from "../src/tui/session.js";
import {
  OPENAI_OAUTH_DEVICE_LOGIN_COMMAND,
  resolveTuiAgentId,
  resolveTuiConfig,
  resolveTuiExecutablePath,
  resolveTuiPresentationClient,
} from "../src/tui/config.js";
import {
  resolveAiSdkEffort,
  resolveAiSdkModelId,
} from "../src/providers/ai-sdk.js";
import { renderMarkdown } from "../src/tui/markdown.js";
import { renderTuiFrame, type TerminalFrame } from "../src/tui/frame.js";
import { renderConversation } from "../src/tui/transcript-view.js";
import {
  createNodeScreenTerminal,
  type TuiKey,
} from "../src/tui/screen-terminal.js";
import { makeTerminalTheme } from "../src/tui/theme.js";
import { brailleFrame, resolveMotionPreference } from "../src/tui/animation.js";
import {
  failureDiagnostic,
  formatChatFailure,
} from "../src/tui/session-turn.js";
import { TUI_DESIGN_TOKENS } from "../src/tui/design-system.js";

const testCapabilityStatus = Object.freeze({
  candidateReady: true as const,
  capabilities: Object.freeze([
    Object.freeze({
      id: "filesystem.read",
      qualifiedForProduction: false as const,
      reason: "WORKSPACE_READ_SUPERVISOR_ACTIVE",
      state: "available" as const,
    }),
    Object.freeze({
      id: "filesystem.mutation",
      qualifiedForProduction: false as const,
      reason: "SUPERVISOR_CAPABILITY_DISABLED",
      state: "scaffolded" as const,
    }),
  ]),
  deploymentReady: false as const,
  lifecycle: "candidate" as const,
  productionReady: false as const,
  profile: "trusted-local-single-user" as const,
  publicationReady: false as const,
  schemaVersion: 1 as const,
  supervisor: Object.freeze({
    filesystemMutation: false as const,
    filesystemRead: true as const,
    git: false as const,
    gitMutation: false as const,
    process: false as const,
    sandbox: false as const,
  }),
});

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
        defaultPrimaryRole: "generalist",
        agents: [
          {
            description: "Direct execution",
            id: "generalist",
            mode: "primary",
          },
          {
            description: "Research execution",
            id: "researcher",
            mode: "subagent",
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
        childAccounting: async (rootExecutionId) => ({
          physicalCalls: [],
          rootExecutionId,
          totals: {
            childCalls: 0,
            compactionCalls: 0,
            providerCalls: 0,
            toolCalls: 0,
            unknownUsageCalls: 0,
          },
        }),
        children: async () => [],
        questions: async () => [],
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
      status: async () => testCapabilityStatus,
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
        defaultPrimaryRole: "generalist",
        agents: [
          {
            description: "Direct execution",
            id: "generalist",
            mode: "primary",
          },
          {
            description: "Research execution",
            id: "researcher",
            mode: "subagent",
          },
        ],
        digest: "test-catalog",
        pluginIds: [],
        promptCommands: [
          {
            agentId: "researcher",
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
        childAccounting: async (rootExecutionId) => ({
          physicalCalls: [],
          rootExecutionId,
          totals: {
            childCalls: 0,
            compactionCalls: 0,
            providerCalls: 0,
            toolCalls: 0,
            unknownUsageCalls: 0,
          },
        }),
        children: async () => [],
        questions: async () => [],
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
      status: async () => testCapabilityStatus,
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
      agentId: "researcher",
      text: "/research Compare releases",
      threadId: "thread-research",
    });
  });

  test("uses up and down for composer prompt history", async () => {
    const events: TuiKey[] = [
      { type: "text", value: "draft prompt" },
      { type: "up" },
      { type: "up" },
      { type: "down" },
      { type: "down" },
      { type: "enter" },
      { type: "quit" },
    ];
    const submitted: string[] = [];
    const history = [
      {
        messageId: "history-user-1",
        role: "user" as const,
        sequence: 1,
        text: "first prompt",
        threadId: "thread-history",
        turnId: "turn-history-1",
      },
      {
        messageId: "history-assistant-1",
        role: "assistant" as const,
        sequence: 2,
        text: "first answer",
        threadId: "thread-history",
        turnId: "turn-history-1",
      },
      {
        messageId: "history-user-2",
        role: "user" as const,
        sequence: 3,
        text: "second prompt",
        threadId: "thread-history",
        turnId: "turn-history-2",
      },
    ];
    const harness: TuiHarness = {
      catalog: {
        defaultPrimaryRole: "generalist",
        agents: [
          {
            description: "Direct execution",
            id: "generalist",
            mode: "primary",
          },
        ],
        digest: "history-catalog",
        pluginIds: [],
        promptCommands: [],
        skills: [],
        tools: [],
        workflows: [],
      },
      chat: async (envelope) => {
        const payload = (envelope as SignedCommandEnvelope).command.payload as {
          assistantMessageId: string;
          text: string;
          threadId: string;
          turnId: string;
        };
        submitted.push(payload.text);
        return {
          assistantMessageId: payload.assistantMessageId,
          durationMs: 10,
          effort: "medium",
          modelId: "test:model",
          text: "done",
          threadId: payload.threadId,
          turnId: payload.turnId,
        };
      },
      projections: {
        childAccounting: async (rootExecutionId) => ({
          physicalCalls: [],
          rootExecutionId,
          totals: {
            childCalls: 0,
            compactionCalls: 0,
            providerCalls: 0,
            toolCalls: 0,
            unknownUsageCalls: 0,
          },
        }),
        children: async () => [],
        questions: async () => [],
        messages: async () => history,
        plugin: async () => ({}),
        threads: async () => [
          {
            openedBy: "local-owner",
            sequence: 1,
            threadId: "thread-history",
            title: "History",
          },
        ],
      },
      status: async () => testCapabilityStatus,
      submit: async () => {
        throw new Error("SUBMIT_NOT_EXPECTED");
      },
    };
    const terminal: TuiScreenTerminal = {
      close: () => undefined,
      drainInput: () => undefined,
      draw: () => undefined,
      readKey: async () => events.shift() ?? { type: "quit" },
      size: () => ({ columns: 120, rows: 40 }),
    };
    let nextId = 0;

    await runTuiSession({
      actorId: "local-owner",
      createId: () => `history-id-${(nextId += 1)}`,
      effort: "medium",
      harness,
      issuedAt: () => "2026-08-25T00:00:00.000Z",
      modelId: "test:model",
      motion: "reduced",
      secret: "development-secret-with-at-least-32-bytes",
      terminal,
      workingDirectory: "/workspace",
    });

    expect(submitted).toEqual(["draft prompt"]);
  });

  test("removes terminal control sequences from projected text", () => {
    expect(sanitizeTerminalText("safe\u001b[2Jspoof\nnext")).toBe(
      "safe�[2Jspoof�next",
    );
    expect(sanitizeConversationText("line 1\nline 2\u001b[2J")).toBe(
      "line 1\nline 2�[2J",
    );
  });

  test("opens catalog-backed palette and read-only inspector surfaces", async () => {
    const events: TuiKey[] = [
      { type: "palette" },
      { type: "text", value: "rese" },
      { type: "enter" },
      { type: "inspect" },
      { type: "escape" },
      { type: "quit" },
    ];
    const frames: TerminalFrame[] = [];
    const harness: TuiHarness = {
      catalog: {
        defaultPrimaryRole: "generalist",
        agents: [
          {
            description: "Direct execution",
            id: "generalist",
            mode: "primary",
          },
        ],
        digest: "catalog-digest-001",
        pluginIds: ["curiosity.stock.chat", "curiosity.stock.skills"],
        promptCommands: [
          {
            description: "Bounded primary-source research",
            name: "research",
            status: "active",
          },
          {
            description: "Independent adversarial review",
            name: "review",
            status: "active",
          },
        ],
        skills: [],
        tools: ["workspace_read"],
        workflows: ["goal-loop"],
      },
      chat: async () => {
        throw new Error("CHAT_NOT_EXPECTED");
      },
      projections: {
        childAccounting: async (rootExecutionId) => ({
          physicalCalls: [],
          rootExecutionId,
          totals: {
            childCalls: 0,
            compactionCalls: 0,
            providerCalls: 0,
            toolCalls: 0,
            unknownUsageCalls: 0,
          },
        }),
        children: async () => [],
        questions: async () => [],
        messages: async () => [],
        plugin: async () => ({}),
        threads: async () => [],
      },
      status: async () => testCapabilityStatus,
      submit: async () => {
        throw new Error("SUBMIT_NOT_EXPECTED");
      },
    };
    const terminal: TuiScreenTerminal = {
      close: () => undefined,
      drainInput: () => undefined,
      draw: (frame) => frames.push(frame),
      readKey: async () => events.shift() ?? { type: "quit" },
      size: () => ({ columns: 120, rows: 40 }),
    };

    await runTuiSession({
      actorId: "local-owner",
      effort: "medium",
      harness,
      modelId: "openai-oauth:gpt-5.4-mini",
      motion: "reduced",
      secret: "development-secret-with-at-least-32-bytes",
      terminal,
      workingDirectory: "~/dev/curiosity",
    });

    const rendered = frames
      .flatMap(({ lines }) => lines)
      .map(stripVTControlCharacters)
      .join("\n");
    expect(rendered).toContain("COMMAND PALETTE");
    expect(rendered).toContain("/research");
    expect(rendered).toContain("non-authoritative until submitted");
    expect(rendered).toContain("INSPECTOR");
    expect(rendered).toContain("filesystem.read");
    expect(rendered).toContain("curiosity.stock.chat");
    for (const frame of frames)
      for (const line of frame.lines)
        expect(Bun.stringWidth(stripVTControlCharacters(line))).toBe(119);
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

  test("keeps a packaged supervisor path locked against environment overrides", () => {
    const config = resolveTuiConfig(
      { CURIOSITY_SUPERVISOR_PATH: "/untrusted/curiosity-supervisor" },
      {
        createSecret: () => "a".repeat(64),
        homeDirectory: "/home/local-owner",
        lockedSupervisorPath: "/package/curiosity-supervisor",
      },
    );

    expect(config.supervisorPath).toBe("/package/curiosity-supervisor");
    expect(
      resolveTuiExecutablePath(
        { CURIOSITY_TUI_PATH: "/untrusted/curiosity-tui" },
        { lockedTuiPath: "/package/curiosity-tui" },
      ),
    ).toBe("/package/curiosity-tui");
  });

  test("uses the TypeScript renderer by default and keeps Bubble Tea explicit", () => {
    expect(resolveTuiPresentationClient({})).toBe("typescript");
    expect(
      resolveTuiPresentationClient({ CURIOSITY_TUI_CLIENT: "typescript" }),
    ).toBe("typescript");
    expect(
      resolveTuiPresentationClient({ CURIOSITY_TUI_CLIENT: "bubbletea" }),
    ).toBe("bubbletea");
    expect(() =>
      resolveTuiPresentationClient({ CURIOSITY_TUI_CLIENT: "unknown" }),
    ).toThrow("TUI_CLIENT_UNSUPPORTED");
  });

  test("decodes SGR mouse wheel reports without leaking them into input", async () => {
    const input = new PassThrough() as PassThrough & NodeJS.ReadStream;
    const output = new PassThrough() as PassThrough & NodeJS.WriteStream;
    let raw = false;
    Object.defineProperties(input, {
      isRaw: { get: () => raw },
      isTTY: { value: true },
      setRawMode: {
        value: (value: boolean) => {
          raw = value;
          return input;
        },
      },
    });
    Object.defineProperties(output, {
      columns: { value: 80 },
      isTTY: { value: true },
      rows: { value: 24 },
    });
    let terminalOutput = "";
    output.on("data", (chunk) => {
      terminalOutput += chunk.toString();
    });
    const terminal = createNodeScreenTerminal(input, output);
    input.write("\u001b[<64;47;19M");
    input.write("\u001b[<64;47;20M");
    input.write("\u001b[<64;47;21M");
    input.write("\u001b[<65;47;20M");
    input.write("\u001b[<0;47;20M");
    input.write("\u001b[5~");
    input.write("\u001b[6~");
    input.write("x");

    expect(await terminal.readKey()).toEqual({ lines: 6, type: "scroll" });
    expect(await terminal.readKey()).toEqual({ type: "page-up" });
    expect(await terminal.readKey()).toEqual({ type: "page-down" });
    expect(await terminal.readKey()).toEqual({ type: "text", value: "x" });
    terminal.close();

    expect(terminalOutput).toContain("\u001b[?1000h\u001b[?1006h");
    expect(terminalOutput).toContain("\u001b[?1002l");
    expect(raw).toBe(false);
  });

  test("drops intermediate terminal frames during an output burst", async () => {
    const input = new PassThrough() as PassThrough & NodeJS.ReadStream;
    const output = new PassThrough() as PassThrough & NodeJS.WriteStream;
    Object.defineProperties(input, {
      isRaw: { value: false, writable: true },
      isTTY: { value: true },
      setRawMode: { value: () => input },
    });
    Object.defineProperties(output, {
      columns: { value: 80 },
      isTTY: { value: true },
      rows: { value: 24 },
    });
    let terminalOutput = "";
    output.on("data", (chunk) => {
      terminalOutput += chunk.toString();
    });
    const terminal = createNodeScreenTerminal(input, output);
    terminal.draw({ lines: ["first"] });
    terminal.draw({ lines: ["second"] });
    terminal.draw({ lines: ["latest"] });
    await Bun.sleep(25);
    terminal.close();

    expect(terminalOutput).toContain("latest");
    expect(terminalOutput).not.toContain("first");
    expect(terminalOutput).not.toContain("second");
  });

  test("scrolls the terminal transcript region and redraws only exposed rows", async () => {
    const input = new PassThrough() as PassThrough & NodeJS.ReadStream;
    const output = new PassThrough() as PassThrough & NodeJS.WriteStream;
    Object.defineProperties(input, {
      isRaw: { value: false, writable: true },
      isTTY: { value: true },
      setRawMode: { value: () => input },
    });
    Object.defineProperties(output, {
      columns: { value: 80 },
      isTTY: { value: true },
      rows: { value: 24 },
    });
    let terminalOutput = "";
    output.on("data", (chunk) => {
      terminalOutput += chunk.toString();
    });
    const terminal = createNodeScreenTerminal(input, output);
    terminal.draw({
      lines: ["header", "one", "two", "three", "footer"],
      transcriptViewport: { endRow: 4, offset: 0, startRow: 1 },
    });
    await Bun.sleep(25);
    terminalOutput = "";
    terminal.draw({
      lines: ["header", "exposed", "one", "two", "footer"],
      transcriptViewport: { endRow: 4, offset: 1, startRow: 1 },
    });
    await Bun.sleep(25);
    terminal.close();

    expect(terminalOutput).toContain("\u001b[2;4r");
    expect(terminalOutput).toContain("\u001b[1T");
    expect(terminalOutput).toContain("exposed");
    expect(terminalOutput).not.toContain("\u001b[3;1H\u001b[2Kone");
    expect(terminalOutput).not.toContain("\u001b[4;1H\u001b[2Ktwo");
  });

  test("reuses completed Markdown while only the transcript viewport moves", () => {
    const theme = makeTerminalTheme(false);
    const messages = Object.freeze([
      Object.freeze({
        durationMs: 10,
        effort: "medium",
        messageId: "assistant-cache",
        modelId: "test:model",
        role: "assistant" as const,
        sequence: 1,
        text: "## Cached\n\n- one\n- two",
        threadId: "thread-cache",
        turnId: "turn-cache",
      }),
    ]);
    const state = {
      animationTick: 0,
      columns: 120,
      effort: "medium",
      input: "",
      inputCursor: 0,
      messages,
      modelId: "test:model",
      motion: "reduced" as const,
      rows: 40,
      scrollOffset: 0,
      status: "idle" as const,
      workingDirectory: "/workspace",
    };
    const first = renderConversation(state, 100, theme);
    const scrolled = renderConversation(
      { ...state, scrollOffset: 30 },
      100,
      theme,
    );
    expect(scrolled).toBe(first);
    expect(renderConversation(state, 80, theme)).not.toBe(first);
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
    expect(OPENAI_OAUTH_DEVICE_LOGIN_COMMAND).toBe(
      "bunx @openai/codex login --device-auth -c 'cli_auth_credentials_store=\"file\"'",
    );
  });

  test("does not misdiagnose kernel input rejection as missing OpenAI auth", () => {
    const rejection = new InputRejected({
      message:
        "PROMPT_COMMAND_CAPABILITY_UNAVAILABLE:network.fetch|network.search",
    });
    expect(failureDiagnostic(rejection)).toBe(
      "InputRejected · PROMPT_COMMAND_CAPABILITY_UNAVAILABLE:network.fetch|network.search",
    );
    expect(
      formatChatFailure("openai-oauth:gpt-5.4-mini", rejection),
    ).not.toContain(OPENAI_OAUTH_DEVICE_LOGIN_COMMAND);
    expect(
      formatChatFailure(
        "openai-oauth:gpt-5.4-mini",
        new TextGenerationFailure({
          message: "OPENAI_OAUTH_AUTHENTICATION_REQUIRED",
          modelId: "openai-oauth:gpt-5.4-mini",
        }),
      ),
    ).toContain(OPENAI_OAUTH_DEVICE_LOGIN_COMMAND);
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
    expect(splashText).toContain("CURIOSITY");
    expect(splashText).toContain("◇ authority kernel sealed · 0 plugins");
    expect(splashText).toContain("Ask Curiosity…");
    expect(splashText).toContain(
      "CHAT / gpt-5.4-mini · openai-oauth / EFFORT high",
    );
    expect(splashText).toContain("ctrl+k palette");
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

  test("binds terminal semantic tokens to the pen foundation", async () => {
    const foundation = JSON.parse(
      await Bun.file(new URL("../tui.pen", import.meta.url)).text(),
    ) as { readonly variables: Readonly<Record<string, { value: string }>> };
    const source = foundation.variables;
    const value = (name: string): string => {
      const result = source[name]?.value;
      if (!result) throw new Error(`TUI_FOUNDATION_VARIABLE_MISSING:${name}`);
      return result;
    };
    const sourceColors: Readonly<Record<string, string>> = {
      accentDim: value("accent-dim"),
      activity: value("accent"),
      canvas: value("canvas"),
      code: value("code"),
      danger: value("danger"),
      focus: value("accent"),
      line: value("line"),
      lineStrong: value("line-strong"),
      plugin: value("plugin"),
      success: value("success"),
      surface: value("surface"),
      surfaceQuiet: value("surface-quiet"),
      textMuted: value("text-muted"),
      textPrimary: value("text-primary"),
      textSecondary: value("text-secondary"),
      warning: value("warning"),
    };
    expect(sourceColors).toEqual(TUI_DESIGN_TOKENS.color);
    expect(TUI_DESIGN_TOKENS.glyph).toMatchObject({
      applied: "✓",
      authored: "◇",
      healthy: "●",
      held: "▲",
      plugin: "◆",
      proposed: "○",
      refuted: "✗",
      running: "◐",
      unresolved: "▮",
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
