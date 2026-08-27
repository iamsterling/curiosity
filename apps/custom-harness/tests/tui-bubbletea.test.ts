import { describe, expect, test } from "bun:test";
import type { SignedCommandEnvelope } from "../src/domain/command.js";
import type { TuiHarness } from "../src/tui/session.js";
import type { BubbleTeaConnection } from "../src/tui-bubbletea/connection.js";
import {
  decodeTuiClientMessage,
  type TuiClientMessage,
  type TuiHostMessage,
  type TuiHostSnapshot,
} from "../src/tui-bubbletea/protocol.js";
import { runBubbleTeaConnection } from "../src/tui-bubbletea/session.js";

class ScriptedConnection implements BubbleTeaConnection {
  readonly sent: TuiHostMessage[] = [];
  nextCalls = 0;
  readonly #messages: TuiClientMessage[];

  constructor(messages: TuiClientMessage[]) {
    this.#messages = messages;
  }

  next(): Promise<TuiClientMessage> {
    this.nextCalls += 1;
    const message = this.#messages.shift();
    if (!message) return Promise.reject(new Error("TEST_MESSAGES_EXHAUSTED"));
    return Promise.resolve(message);
  }

  send(message: TuiHostMessage): Promise<void> {
    this.sent.push(structuredClone(message));
    return Promise.resolve();
  }
}

class InteractiveConnection implements BubbleTeaConnection {
  readonly sent: TuiHostMessage[] = [];
  readonly #messages: TuiClientMessage[];
  #waiting: ((message: TuiClientMessage) => void) | undefined;

  constructor(messages: TuiClientMessage[]) {
    this.#messages = messages;
  }

  next(): Promise<TuiClientMessage> {
    const message = this.#messages.shift();
    if (message) return Promise.resolve(message);
    return new Promise((resolve) => {
      this.#waiting = resolve;
    });
  }

  push(message: TuiClientMessage): void {
    const waiting = this.#waiting;
    if (waiting) {
      this.#waiting = undefined;
      waiting(message);
      return;
    }
    this.#messages.push(message);
  }

  send(message: TuiHostMessage): Promise<void> {
    this.sent.push(structuredClone(message));
    return Promise.resolve();
  }
}

const nonce = "a".repeat(64);
const hello = {
  payload: { nonce },
  type: "client.hello",
} as const;
const quit = { payload: {}, type: "client.quit" } as const;
const turn = (text: string) =>
  ({ payload: { text }, type: "client.turn.submit" }) as const;

describe("Bubble Tea presentation protocol", () => {
  test("decodes a closed, nonce-bound client envelope", () => {
    expect(
      decodeTuiClientMessage({
        payload: { nonce },
        type: "client.hello",
        version: 1,
      }),
    ).toEqual(hello);
    expect(() =>
      decodeTuiClientMessage({
        extra: true,
        payload: { nonce },
        type: "client.hello",
        version: 1,
      }),
    ).toThrow("TUI_PROTOCOL_FRAME_INVALID");
    expect(() =>
      decodeTuiClientMessage({
        payload: { nonce: "wrong" },
        type: "client.hello",
        version: 1,
      }),
    ).toThrow("TUI_PROTOCOL_NONCE_INVALID");
  });

  test("continues reading client input while the authoritative turn streams", async () => {
    let releaseProvider!: () => void;
    let providerStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      providerStarted = resolve;
    });
    const provider = new Promise<void>((resolve) => {
      releaseProvider = resolve;
    });
    const submissions: SignedCommandEnvelope[] = [];
    const harness = testHarness(async (envelope, onTextDelta) => {
      submissions.push(envelope as SignedCommandEnvelope);
      providerStarted();
      onTextDelta?.("partial");
      await provider;
      return resultFor(envelope as SignedCommandEnvelope, "complete");
    });
    const connection = new ScriptedConnection([
      hello,
      turn("Explain the durable kernel"),
      quit,
    ]);
    const running = runBubbleTeaConnection(
      sessionOptions(harness),
      connection,
      nonce,
    );

    await started;
    expect(connection.nextCalls).toBe(3);
    expect(connection.sent.map(snapshotStatus)).toContain("working");
    expect(connection.sent.map(streamingText)).toContain("partial");
    expect(submissions).toHaveLength(1);

    releaseProvider();
    await running;
    expect(connection.sent.map(snapshotStatus).at(-1)).toBe("idle");
    expect(connection.sent.map(messageTexts).flat()).toContain("complete");
    const finalSnapshot = snapshot(connection.sent.at(-1)!);
    expect(finalSnapshot?.threadId).toBe("id-1");
    expect(finalSnapshot?.messages.map(({ sequence }) => sequence)).toEqual([1, 2]);
  });

  test("rejects a concurrent turn instead of creating competing authority", async () => {
    let releaseProvider!: () => void;
    let providerStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      providerStarted = resolve;
    });
    const provider = new Promise<void>((resolve) => {
      releaseProvider = resolve;
    });
    let chatCalls = 0;
    const harness = testHarness(async (envelope) => {
      chatCalls += 1;
      providerStarted();
      await provider;
      return resultFor(envelope as SignedCommandEnvelope, "done");
    });
    const connection = new ScriptedConnection([
      hello,
      turn("first"),
      turn("second"),
      quit,
    ]);
    const running = runBubbleTeaConnection(
      sessionOptions(harness),
      connection,
      nonce,
    );
    await started;
    await Bun.sleep(0);
    expect(connection.nextCalls).toBe(4);
    expect(connection.sent).toContainEqual({
      payload: { code: "TUI_TURN_ALREADY_ACTIVE" },
      type: "host.error",
    });
    expect(chatCalls).toBe(1);
    releaseProvider();
    await running;
  });

  test("submits authenticated cancellation for the active turn", async () => {
    let providerStarted!: () => void;
    let rejectProvider!: (error: Error) => void;
    const started = new Promise<void>((resolve) => {
      providerStarted = resolve;
    });
    const provider = new Promise<never>((_, reject) => {
      rejectProvider = reject;
    });
    const chats: SignedCommandEnvelope[] = [];
    const submissions: SignedCommandEnvelope[] = [];
    const base = testHarness(async (envelope) => {
      chats.push(envelope as SignedCommandEnvelope);
      providerStarted();
      return await provider;
    });
    const harness: TuiHarness = {
      ...base,
      submit: async (input) => {
        const envelope = input as SignedCommandEnvelope;
        submissions.push(envelope);
        if (envelope.command.kind === "execution.cancel")
          rejectProvider(new Error("EXECUTION_CANCELLED"));
        return base.submit(input);
      },
    };
    const connection = new InteractiveConnection([hello]);
    const running = runBubbleTeaConnection(
      sessionOptions(harness),
      connection,
      nonce,
    );
    await waitFor(() => connection.sent.length > 0);

    connection.push(turn("Keep working until cancelled"));
    await started;
    connection.push(turn("/cancel"));
    await waitFor(() =>
      submissions.some(({ command }) => command.kind === "execution.cancel"),
    );
    const turnId = (
      chats[0]!.command.payload as { readonly turnId: string }
    ).turnId;
    expect(
      submissions.find(({ command }) => command.kind === "execution.cancel")
        ?.command.payload,
    ).toEqual({ executionId: turnId, schemaVersion: 1 });
    expect(
      snapshot(connection.sent.at(-1)!)?.inspectorText,
    ).toContain('"status":"cancelling"');

    await waitFor(() => snapshot(connection.sent.at(-1)!)?.status === "idle");
    connection.push(quit);
    await running;
  });

  test("waits for in-flight authority work after presentation disconnects", async () => {
    let releaseProvider!: () => void;
    let providerStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      providerStarted = resolve;
    });
    const provider = new Promise<void>((resolve) => {
      releaseProvider = resolve;
    });
    const harness = testHarness(async (envelope) => {
      providerStarted();
      await provider;
      return resultFor(envelope as SignedCommandEnvelope, "durable result");
    });
    const connection = new ScriptedConnection([hello, turn("keep authority alive")]);
    const running = runBubbleTeaConnection(
      sessionOptions(harness),
      connection,
      nonce,
    );
    let settled = false;
    void running.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );

    await started;
    await Bun.sleep(0);
    expect(settled).toBe(false);
    releaseProvider();
    await expect(running).rejects.toThrow("TEST_MESSAGES_EXHAUSTED");
  });

  test("runs thread, role, command, question, gate, cancellation, and child lifecycle through the native client", async () => {
    const submissions: SignedCommandEnvelope[] = [];
    const chats: SignedCommandEnvelope[] = [];
    const questionId = "a".repeat(64);
    const payloadDigest = "b".repeat(64);
    const base = testHarness(async (envelope) => {
      chats.push(envelope as SignedCommandEnvelope);
      return resultFor(envelope as SignedCommandEnvelope, "native lifecycle result");
    });
    const harness: TuiHarness = {
      ...base,
      catalog: {
        ...base.catalog,
        agents: [
          { description: "Direct execution", id: "generalist", mode: "primary" },
          { description: "Coordination", id: "orchestrator", mode: "primary" },
        ],
        promptCommands: [
          {
            description: "Feature pursuit",
            name: "feature",
            status: "active",
          },
        ],
      },
      projections: {
        ...base.projections,
        childAccounting: async (rootExecutionId) => ({
          physicalCalls: [],
          rootExecutionId,
          totals: {
            childCalls: 1,
            compactionCalls: 0,
            providerCalls: 1,
            toolCalls: 0,
            unknownUsageCalls: 0,
          },
        }),
        children: async (rootExecutionId) => [
          {
            agentId: "reviewer",
            agentRunId: "child-run",
            agentSessionId: "child-session",
            budget: { maximumProviderCalls: 1, maximumToolCalls: 0 },
            childExecutionId: "child-execution",
            delegationGroupId: "child-group",
            ordinal: 0,
            parentExecutionId: rootExecutionId ?? "root-execution",
            resourceClaims: {
              mode: "read-only",
              resources: ["workspace:path:src"],
              scopeState: "claimed",
            },
            rootExecutionId: rootExecutionId ?? "root-execution",
            sessionRevision: 1,
            status: "completed",
          },
        ],
        messages: async (threadId) =>
          threadId === "thread-existing"
            ? [
                {
                  messageId: "existing-user",
                  role: "user",
                  sequence: 2,
                  text: "existing message",
                  threadId,
                  turnId: "existing-turn",
                },
              ]
            : [],
        questions: async () => [
          {
            allowFreeText: true,
            executionId: "root-execution",
            options: [],
            prompt: "Continue?",
            questionId,
            status: "pending",
          },
        ],
        threads: async () => [
          {
            openedBy: "local-owner",
            sequence: 2,
            threadId: "thread-existing",
            title: "Existing",
          },
        ],
      },
      submit: async (input) => {
        submissions.push(input as SignedCommandEnvelope);
        return base.submit(input);
      },
    };
    const connection = new InteractiveConnection([hello]);
    const running = runBubbleTeaConnection(
      sessionOptions(harness),
      connection,
      nonce,
    );
    await waitFor(() => connection.sent.length > 0);

    connection.push(turn("/threads"));
    await waitFor(() =>
      snapshot(connection.sent.at(-1)!)?.inspectorText.includes("thread-existing") ??
      false,
    );
    const beforeResume = connection.sent.length;
    connection.push(turn("/resume thread-existing"));
    await waitFor(
      () =>
        connection.sent.length > beforeResume &&
        snapshot(connection.sent.at(-1)!)?.threadId === "thread-existing",
    );
    connection.push(turn("/agent orchestrator"));
    await waitFor(() =>
      snapshot(connection.sent.at(-1)!)?.inspectorText.includes("orchestrator") ??
      false,
    );
    connection.push(turn("use selected role"));
    await waitFor(
      () =>
        chats.length === 1 &&
        snapshot(connection.sent.at(-1)!)?.status === "idle",
    );
    expect(
      (chats[0]!.command.payload as { readonly agentId?: string }).agentId,
    ).toBe("orchestrator");

    connection.push(turn("/questions"));
    await waitFor(() =>
      snapshot(connection.sent.at(-1)!)?.inspectorText.includes(questionId) ?? false,
    );
    connection.push(turn(`/answer ${questionId} yes`));
    await waitFor(() =>
      snapshot(connection.sent.at(-1)!)?.inspectorText.includes('"status":"answered"') ??
      false,
    );
    connection.push(
      turn(`/gate gate-1 1 ${payloadDigest} approved`),
    );
    await waitFor(() =>
      snapshot(connection.sent.at(-1)!)?.inspectorText.includes("gate-1") ?? false,
    );
    connection.push(turn("/cancel root-execution"));
    await waitFor(() =>
      snapshot(connection.sent.at(-1)!)?.inspectorText.includes("cancelling") ?? false,
    );
    connection.push(turn("/children root-execution"));
    await waitFor(() =>
      snapshot(connection.sent.at(-1)!)?.inspectorText.includes("child-run") ?? false,
    );
    connection.push(turn("/new"));
    await waitFor(() => snapshot(connection.sent.at(-1)!)?.threadId === "");
    connection.push(turn("/feature implement bounded slice"));
    await waitFor(
      () =>
        chats.length === 2 &&
        snapshot(connection.sent.at(-1)!)?.status === "idle",
    );
    expect(
      submissions.some(
        ({ command }) =>
          command.kind === "prompt.command.invoke" &&
          (command.payload as { readonly name?: string }).name === "feature",
      ),
    ).toBe(true);
    expect(
      submissions
        .filter(({ command }) => command.kind === "client.lifecycle")
        .map(
          ({ command }) =>
            (command.payload as { readonly operation: string }).operation,
        ),
    ).toEqual([
      "threads",
      "resume",
      "agent",
      "questions",
      "children",
      "new",
    ]);

    connection.push(quit);
    await running;
  });
});

const waitFor = async (predicate: () => boolean): Promise<void> => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (predicate()) return;
    await Bun.sleep(1);
  }
  throw new Error("TEST_WAIT_TIMEOUT");
};

const testHarness = (chat: TuiHarness["chat"]): TuiHarness => ({
  catalog: {
    defaultPrimaryRole: "generalist",
    agents: [{ description: "Direct execution", id: "generalist", mode: "primary" }],
    digest: "catalog-digest",
    pluginIds: ["curiosity.stock.chat"],
    promptCommands: [],
    skills: [],
    tools: ["workspace_read"],
    workflows: ["goal-loop"],
  },
  chat,
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
  status: async () => ({
    candidateReady: true,
    capabilities: [
      {
        id: "filesystem.read",
        qualifiedForProduction: false,
        reason: "WORKSPACE_READ_SUPERVISOR_ACTIVE",
        state: "available",
      },
    ],
    deploymentReady: false,
    lifecycle: "candidate",
    productionReady: false,
    profile: "trusted-local-single-user",
    publicationReady: false,
    schemaVersion: 1,
    supervisor: {
      filesystemMutation: false,
      filesystemRead: true,
      git: false,
      gitMutation: false,
      process: false,
      sandbox: false,
    },
  }),
  submit: async () => ({
    actorId: "local-owner",
    commandId: "command",
    disposition: "accepted",
    eventCount: 1,
    firstSequence: 1,
    lastSequence: 1,
  }),
});

const sessionOptions = (harness: TuiHarness) => ({
  actorId: "local-owner",
  createId: (() => {
    let index = 0;
    return () => `id-${++index}`;
  })(),
  effort: "medium",
  harness,
  issuedAt: () => "2026-08-25T00:00:00.000Z",
  modelId: "test:model",
  secret: "development-secret-with-at-least-32-bytes",
  workingDirectory: "/workspace",
});

const resultFor = (envelope: SignedCommandEnvelope, text: string) => {
  const payload = envelope.command.payload as {
    readonly assistantMessageId: string;
    readonly threadId: string;
    readonly turnId: string;
  };
  return {
    assistantMessageId: payload.assistantMessageId,
    durationMs: 10,
    effort: "medium",
    modelId: "test:model",
    text,
    threadId: payload.threadId,
    turnId: payload.turnId,
  };
};

const snapshot = (message: TuiHostMessage): TuiHostSnapshot | undefined =>
  message.type === "host.snapshot" ? (message.payload as TuiHostSnapshot) : undefined;
const snapshotStatus = (message: TuiHostMessage) => snapshot(message)?.status;
const streamingText = (message: TuiHostMessage) => snapshot(message)?.streamingText;
const messageTexts = (message: TuiHostMessage) =>
  snapshot(message)?.messages.map(({ text }) => text) ?? [];
