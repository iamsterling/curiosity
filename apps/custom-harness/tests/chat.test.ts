import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type ResearchAdapter,
  type TextGenerator,
} from "../src/index.js";
import {
  createAiSdkTextGenerator,
  splitAiSdkPrompt,
} from "../src/providers/ai-sdk.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);

const turn = (agentId?: string) =>
  signCommand(
    {
      actorId,
      command: {
        id: "command-chat-001",
        kind: "chat.turn",
        payload: {
          ...(agentId ? { agentId } : {}),
          assistantMessageId: "message-assistant-001",
          text: "Hello Curiosity",
          threadId: "thread-chat-001",
          turnId: "turn-001",
          userMessageId: "message-user-001",
        },
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: "nonce-chat-001",
      schemaVersion: 1,
    },
    secret,
  );

const databaseFixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "curiosity-chat-"));
  roots.push(root);
  return path.join(root, "events.sqlite");
};

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("plugin-native chat turns", () => {
  test("separates trusted system instructions from AI SDK conversation messages", () => {
    expect(
      splitAiSdkPrompt([
        { content: "policy one", role: "system" },
        { content: "policy two", role: "system" },
        { content: "question", role: "user" },
      ]),
    ).toEqual({
      messages: [{ content: "question", role: "user" }],
      system: "policy one\n\npolicy two",
    });
  });

  test("streams through the AI SDK OpenAI-compatible adapter", async () => {
    const encoder = new TextEncoder();
    const server = Bun.serve({
      port: 0,
      fetch: () => {
        const chunks = [
          {
            choices: [
              {
                delta: { content: "Smoke", role: "assistant" },
                finish_reason: null,
                index: 0,
              },
            ],
            created: 1,
            id: "chatcmpl-smoke",
            model: "smoke",
            object: "chat.completion.chunk",
          },
          {
            choices: [
              { delta: { content: " OK" }, finish_reason: null, index: 0 },
            ],
            created: 1,
            id: "chatcmpl-smoke",
            model: "smoke",
            object: "chat.completion.chunk",
          },
          {
            choices: [{ delta: {}, finish_reason: "stop", index: 0 }],
            created: 1,
            id: "chatcmpl-smoke",
            model: "smoke",
            object: "chat.completion.chunk",
          },
        ];
        return new Response(
          new ReadableStream({
            start(controller) {
              for (const chunk of chunks)
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
                );
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            },
          }),
          { headers: { "content-type": "text/event-stream" } },
        );
      },
    });

    try {
      const generator = createAiSdkTextGenerator({
        CURIOSITY_MODEL: "compatible:smoke",
        CURIOSITY_OPENAI_COMPATIBLE_BASE_URL: `http://127.0.0.1:${server.port}/v1`,
      });
      expect(generator.effort).toBe("default");
      const deltas: string[] = [];
      for await (const delta of generator.stream({
        abortSignal: new AbortController().signal,
        messages: [{ content: "hello", role: "user" }],
      }))
        if (typeof delta === "string") deltas.push(delta);
      expect(deltas.join("")).toBe("Smoke OK");
    } finally {
      await server.stop(true);
    }
  });

  test("persists the prompt, streams the provider result, and recovers completion", async () => {
    const databasePath = databaseFixture();
    let generations = 0;
    const textGenerator: TextGenerator = {
      effort: "medium",
      modelId: "test:streaming",
      stream: async function* ({ messages }) {
        generations += 1;
        expect(messages.map((message) => message.role)).toEqual([
          "system",
          "system",
          "user",
        ]);
        expect(messages.at(-1)?.content).toBe("Hello Curiosity");
        yield "Hello";
        yield " back.";
      },
    };
    const config = {
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator,
      workspaceRoot: path.dirname(databasePath),
    };
    const harness = createCuriosityHarness(config);
    const deltas: string[] = [];

    expect(await harness.chat(turn(), (delta) => deltas.push(delta))).toEqual({
      assistantMessageId: "message-assistant-001",
      durationMs: expect.any(Number),
      effort: "medium",
      modelId: "test:streaming",
      text: "Hello back.",
      threadId: "thread-chat-001",
      turnId: "turn-001",
    });
    expect(deltas).toEqual(["Hello", " back."]);
    expect(await harness.projections.messages("thread-chat-001")).toEqual([
      {
        messageId: "message-user-001",
        role: "user",
        sequence: 2,
        text: "Hello Curiosity",
        threadId: "thread-chat-001",
        turnId: "turn-001",
      },
      {
        messageId: "message-assistant-001",
        durationMs: expect.any(Number),
        effort: "medium",
        modelId: "test:streaming",
        role: "assistant",
        sequence: 10,
        text: "Hello back.",
        threadId: "thread-chat-001",
        turnId: "turn-001",
      },
    ]);
    await harness.dispose();

    const reopened = createCuriosityHarness(config);
    const recovered: string[] = [];
    expect(
      await reopened.chat(turn(), (delta) => recovered.push(delta)),
    ).toMatchObject({ text: "Hello back." });
    expect(recovered).toEqual(["Hello back."]);
    expect(generations).toBe(1);
    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'turn.completed' AND json_extract(body_json, '$.turnId') = 'turn-001'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'turn.failed' AND json_extract(body_json, '$.turnId') = 'turn-001'",
        )
        .get()?.count,
    ).toBe(0);
    database.close();
    await reopened.dispose();
  });

  test("executes bounded workspace evidence tools and continues the governed turn", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-tools-"));
    roots.push(root);
    writeFileSync(
      path.join(root, "baseline.md"),
      "The checked qualification marker is candidate-A.\n",
    );
    const databasePath = path.join(root, "events.sqlite");
    let generations = 0;
    const textGenerator: TextGenerator = {
      effort: "high",
      modelId: "test:tools",
      stream: async function* (request) {
        generations += 1;
        const tools = (request as unknown as { tools?: readonly { name: string }[] })
          .tools;
        expect(tools?.map(({ name }) => name)).toEqual([
          "workspace_glob",
          "workspace_grep",
          "workspace_list",
          "workspace_read",
          "workspace_search",
        ]);
        if (generations === 1) {
          yield "Framing the decision.";
          yield {
            input: {
              maxResults: 2,
              query: "candidate-A",
              schemaVersion: 1,
            },
            toolCallId: "tool-call-search-001",
            toolName: "workspace_search",
            type: "tool-call",
          } as never;
          return;
        }
        expect(request.messages.at(-2)).toEqual({
          content: "Framing the decision.",
          role: "assistant",
        });
        expect(request.messages.at(-1)?.content).toContain("baseline.md");
        expect(request.messages.at(-1)?.content).toContain("candidate-A");
        yield "Use candidate-A. STOP.";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator,
      workspaceRoot: root,
    });
    await harness.submit(
      signCommand(
        {
          actorId,
          command: {
            id: "command-research-001",
            kind: "prompt.command.invoke",
            payload: {
              activationId: "activation-research-001",
              arguments: "Choose the baseline",
              name: "research",
              schemaVersion: 1,
              threadId: "thread-chat-001",
            },
            schemaVersion: 1,
          },
          issuedAt: new Date().toISOString(),
          nonce: "nonce-research-001",
          schemaVersion: 1,
        },
        secret,
      ),
    );

    await expect(harness.chat(turn("researcher"))).resolves.toMatchObject({
      text: "Use candidate-A. STOP.",
    });
    expect(generations).toBe(2);
    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<
          { action_type: string; status: string },
          []
        >(
          "SELECT actions.action_type,actions.status FROM actions JOIN events ON events.event_id = actions.source_event_id ORDER BY events.global_sequence,actions.action_id",
        )
        .all(),
    ).toEqual([
      { action_type: "provider.generate", status: "succeeded" },
      { action_type: "workspace.search", status: "succeeded" },
      { action_type: "provider.generate", status: "succeeded" },
    ]);
    expect(
      database
        .query<
          { delivery_certainty: string; status: string; tool_name: string },
          []
        >("SELECT tool_name,status,delivery_certainty FROM tool_calls")
        .get(),
    ).toEqual({
      delivery_certainty: "DELIVERED",
      status: "succeeded",
      tool_name: "workspace_search",
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM attempts WHERE status = 'succeeded'",
        )
        .get()?.count,
    ).toBe(3);
    database.close();
    await harness.dispose();
  });

  test("terminates malformed model tool input without stranding the reaction", async () => {
    const databasePath = databaseFixture();
    let generations = 0;
    const textGenerator: TextGenerator = {
      effort: "high",
      modelId: "test:malformed-tool",
      stream: async function* () {
        generations += 1;
        yield "Planning a search.";
        yield {
          input: {
            query: "candidate-A",
            schemaVersion: 1,
          },
          toolCallId: "tool-call-invalid-001",
          toolName: "workspace_search",
          type: "tool-call",
        } as never;
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator,
      workspaceRoot: path.dirname(databasePath),
    });

    await expect(harness.chat(turn())).rejects.toMatchObject({
      _tag: "TextGenerationFailure",
      message: "MODEL_TOOL_INPUT_INVALID",
      modelId: "test:malformed-tool",
    });
    await expect(harness.chat(turn())).rejects.toMatchObject({
      _tag: "TextGenerationFailure",
      message: "MODEL_TOOL_INPUT_INVALID",
      modelId: "test:malformed-tool",
    });
    expect(generations).toBe(1);
    expect(await harness.projections.messages("thread-chat-001")).toEqual([
      expect.objectContaining({ role: "user", text: "Hello Curiosity" }),
    ]);

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM reaction_runs WHERE status != 'completed'",
        )
        .get()?.count,
    ).toBe(0);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM tool_calls",
        )
        .get()?.count,
    ).toBe(0);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'turn.failed' AND json_extract(body_json, '$.errorCode') = 'MODEL_TOOL_INPUT_INVALID'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
    await harness.dispose();
  });

  test("searches, fetches, captures source custody, and continues a research turn", async () => {
    const databasePath = databaseFixture();
    const calls: string[] = [];
    let closes = 0;
    const researchAdapter: ResearchAdapter = {
      close: () => {
        closes += 1;
      },
      receipt: {
        adapterId: "test-research",
        adapterVersion: "1.0.0",
        capabilities: ["network.fetch", "network.search"],
        securityProfile: "bounded-http-v1",
      },
      fetch: async ({ maxBytes, url }) => {
        calls.push(`fetch:${url}:${maxBytes}`);
        return {
          body: "Primary source evidence.",
          canonicalUrl: url,
          mediaType: "text/plain",
          redirectChain: [],
          retrievedAt: "2026-08-26T15:00:01.000Z",
          statusCode: 200,
        };
      },
      search: async ({ maxResults, query }) => {
        calls.push(`search:${query}:${maxResults}`);
        return {
          queriedAt: "2026-08-26T15:00:00.000Z",
          results: [
            {
              canonicalUrl: "https://example.com/primary",
              snippet: "A bounded primary-source candidate.",
              title: "Primary source",
            },
          ],
        };
      },
    };
    let generations = 0;
    const textGenerator: TextGenerator = {
      effort: "high",
      modelId: "test:research-tools",
      stream: async function* (request) {
        generations += 1;
        expect(request.tools?.map(({ name }) => name)).toEqual([
          "web_fetch",
          "web_search",
          "workspace_glob",
          "workspace_grep",
          "workspace_list",
          "workspace_read",
          "workspace_search",
        ]);
        if (generations === 1) {
          yield {
            input: {
              maxResults: 2,
              query: "primary evidence",
              schemaVersion: 1,
            },
            toolCallId: "tool-call-web-search-001",
            toolName: "web_search",
            type: "tool-call",
          } as never;
          return;
        }
        if (generations === 2) {
          expect(request.messages.at(-1)?.content).toContain(
            "https://example.com/primary",
          );
          expect(request.messages.at(-1)?.content).toContain(
            "untrusted-evidence",
          );
          yield {
            input: {
              maxBytes: 4_096,
              schemaVersion: 1,
              url: "https://example.com/primary",
            },
            toolCallId: "tool-call-web-fetch-001",
            toolName: "web_fetch",
            type: "tool-call",
          } as never;
          return;
        }
        expect(request.messages.at(-1)?.content).toContain(
          "Primary source evidence.",
        );
        yield "Documented finding [Primary source](https://example.com/primary).";
      },
    };
    const config = {
      actorId,
      authenticationSecret: secret,
      databasePath,
      researchAdapter,
      supervisorPath,
      textGenerator,
      workspaceRoot: path.dirname(databasePath),
    };
    const harness = createCuriosityHarness(config);
    await harness.submit(
      signCommand(
        {
          actorId,
          command: {
            id: "command-research-tools-001",
            kind: "prompt.command.invoke",
            payload: {
              activationId: "activation-research-tools-001",
              arguments: "Find primary evidence",
              name: "research",
              schemaVersion: 1,
              threadId: "thread-chat-001",
            },
            schemaVersion: 1,
          },
          issuedAt: new Date().toISOString(),
          nonce: "nonce-research-tools-001",
          schemaVersion: 1,
        },
        secret,
      ),
    );

    const researchTurn = turn("researcher");
    await expect(harness.chat(researchTurn)).resolves.toMatchObject({
      researchReceipt: {
        citationCount: 1,
        sourceCount: 2,
        toolCallCount: 2,
        verification: "verified",
      },
      text: "Documented finding [Primary source](https://example.com/primary).",
    });
    expect(generations).toBe(3);
    expect(calls).toEqual([
      "search:primary evidence:2",
      "fetch:https://example.com/primary:4096",
    ]);
    const status = await harness.status();
    expect(
      status.capabilities.find(({ id }) => id === "network.search"),
    ).toMatchObject({ state: "available" });
    expect(
      status.capabilities.find(({ id }) => id === "network.fetch"),
    ).toMatchObject({ state: "available" });

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ action_type: string; status: string }, []>(
          "SELECT actions.action_type,actions.status FROM actions WHERE action_type IN ('search.web','fetch.web') ORDER BY created_at,action_id",
        )
        .all(),
    ).toEqual([
      { action_type: "search.web", status: "succeeded" },
      { action_type: "fetch.web", status: "succeeded" },
    ]);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM tool_calls WHERE status = 'succeeded' AND tool_name IN ('web_search','web_fetch')",
        )
        .get()?.count,
    ).toBe(2);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'source.captured' AND json_extract(body_json, '$.provenance') = 'untrusted-evidence'",
        )
        .get()?.count,
    ).toBe(2);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'research.receipt.generated' AND json_extract(body_json, '$.verification') = 'verified'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      await harness.projections.plugin(
        "curiosity.stock.search.projections.source-custody",
      ),
    ).toMatchObject({
      receipts: [
        expect.objectContaining({
          citationCount: 1,
          sourceCount: 2,
          toolCallCount: 2,
          verification: "verified",
        }),
      ],
      sources: [
        expect.objectContaining({
          canonicalUrl: "https://example.com/primary",
          provenance: "untrusted-evidence",
          retrievalKind: "search-result",
        }),
        expect.objectContaining({
          canonicalUrl: "https://example.com/primary",
          provenance: "untrusted-evidence",
          retrievalKind: "fetch",
        }),
      ],
    });
    database.close();
    await harness.dispose();
    expect(closes).toBe(1);

    const reopened = createCuriosityHarness(config);
    await expect(reopened.chat(researchTurn)).resolves.toMatchObject({
      researchReceipt: {
        citationCount: 1,
        sourceCount: 2,
        verification: "verified",
      },
    });
    expect(generations).toBe(3);
    expect(calls).toEqual([
      "search:primary evidence:2",
      "fetch:https://example.com/primary:4096",
    ]);
    const replayDatabase = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      replayDatabase
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'research.receipt.generated'",
        )
        .get()?.count,
    ).toBe(1);
    replayDatabase.close();
    await reopened.dispose();
    expect(closes).toBe(2);
  });

  test("returns a bounded fetch failure to the researcher as negative evidence", async () => {
    const databasePath = databaseFixture();
    const researchAdapter: ResearchAdapter = {
      close: () => undefined,
      receipt: {
        adapterId: "test-failing-fetch",
        adapterVersion: "1.0.0",
        capabilities: ["network.fetch"],
        securityProfile: "bounded-http-v1",
      },
      fetch: async () => {
        throw new Error("FETCH_RESPONSE_TOO_LARGE");
      },
    };
    let generations = 0;
    const textGenerator: TextGenerator = {
      effort: "high",
      modelId: "test:recoverable-fetch-failure",
      stream: async function* (request) {
        generations += 1;
        if (generations === 1) {
          yield {
            input: {
              maxBytes: 4_096,
              schemaVersion: 1,
              url: "https://example.com/oversized",
            },
            toolCallId: "tool-call-failing-fetch-001",
            toolName: "web_fetch",
            type: "tool-call",
          } as never;
          return;
        }
        expect(request.messages.at(-1)?.content).toContain(
          "Tool web_fetch (tool-call-failing-fetch-001) failed:",
        );
        expect(request.messages.at(-1)?.content).toContain(
          '"errorCode":"FETCH_RESPONSE_TOO_LARGE"',
        );
        expect(request.messages.at(-1)?.content).toContain(
          "BEGIN UNTRUSTED TOOL EVIDENCE",
        );
        yield "CURIOSITY_NO_GO: the fetched source exceeded the governed response limit.";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      researchAdapter,
      supervisorPath,
      textGenerator,
      workspaceRoot: path.dirname(databasePath),
    });
    await harness.submit(
      signCommand(
        {
          actorId,
          command: {
            id: "command-recoverable-fetch-failure-001",
            kind: "prompt.command.invoke",
            payload: {
              activationId: "activation-recoverable-fetch-failure-001",
              arguments: "Fetch bounded evidence",
              name: "research",
              schemaVersion: 1,
              threadId: "thread-chat-001",
            },
            schemaVersion: 1,
          },
          issuedAt: new Date().toISOString(),
          nonce: "nonce-recoverable-fetch-failure-001",
          schemaVersion: 1,
        },
        secret,
      ),
    );

    await expect(harness.chat(turn("researcher"))).resolves.toMatchObject({
      researchReceipt: {
        citationCount: 0,
        sourceCount: 0,
        toolCallCount: 0,
        verification: "not-applicable",
      },
      text: expect.stringContaining("CURIOSITY_NO_GO"),
    });
    expect(generations).toBe(2);
    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ error_code: string; status: string }, []>(
          "SELECT error_code,status FROM tool_calls WHERE tool_name = 'web_fetch'",
        )
        .get(),
    ).toEqual({ error_code: "FETCH_RESPONSE_TOO_LARGE", status: "failed" });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'turn.completed'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'turn.failed'",
        )
        .get()?.count,
    ).toBe(0);
    database.close();
    await harness.dispose();
  });

  test("keeps a non-research tool failure terminal", async () => {
    const databasePath = databaseFixture();
    let generations = 0;
    const textGenerator: TextGenerator = {
      effort: "medium",
      modelId: "test:terminal-tool-failure",
      stream: async function* () {
        generations += 1;
        yield {
          input: {
            maxLines: 10,
            path: "missing-evidence.txt",
            schemaVersion: 1,
            startLine: 1,
          },
          toolCallId: "tool-call-terminal-read-001",
          toolName: "workspace_read",
          type: "tool-call",
        } as never;
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator,
      workspaceRoot: path.dirname(databasePath),
    });

    await expect(harness.chat(turn())).rejects.toMatchObject({
      _tag: "TextGenerationFailure",
      message: "WORKSPACE_PATH_NOT_FOUND",
    });
    expect(generations).toBe(1);
    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'turn.failed' AND json_extract(body_json, '$.errorCode') = 'WORKSPACE_PATH_NOT_FOUND'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
    await harness.dispose();
  });

  test("reports unavailable research capabilities without repeating discovery", async () => {
    const databasePath = databaseFixture();
    let generations = 0;
    const textGenerator: TextGenerator = {
      effort: "high",
      modelId: "test:research-no-go",
      stream: async function* (request) {
        generations += 1;
        expect(
          request.messages.some(
            ({ content, role }) =>
              role === "system" &&
              content.includes(
                "public-web search is unavailable; public-web fetch is unavailable",
              ),
          ),
        ).toBe(true);
        expect(request.tools?.some(({ name }) => name === "web_search")).toBe(
          false,
        );
        expect(request.tools?.some(({ name }) => name === "web_fetch")).toBe(
          false,
        );
        yield "CURIOSITY_NO_GO: public-web search and fetch are unavailable; no source corpus was supplied.";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator,
      workspaceRoot: path.dirname(databasePath),
    });
    await harness.submit(
      signCommand(
        {
          actorId,
          command: {
            id: "command-research-no-go",
            kind: "prompt.command.invoke",
            payload: {
              activationId: "activation-research-no-go",
              arguments: "Research external evidence",
              name: "research",
              schemaVersion: 1,
              threadId: "thread-chat-001",
            },
            schemaVersion: 1,
          },
          issuedAt: new Date().toISOString(),
          nonce: "nonce-research-no-go",
          schemaVersion: 1,
        },
        secret,
      ),
    );
    await expect(harness.chat(turn("researcher"))).resolves.toMatchObject({
      researchReceipt: {
        citationCount: 0,
        sourceCount: 0,
        toolCallCount: 0,
        verification: "not-applicable",
      },
      text: expect.stringContaining("CURIOSITY_NO_GO"),
    });
    expect(generations).toBe(1);
    await harness.dispose();
  });

  test("reserves a tool-free finalization call when a turn exhausts its budget", async () => {
    const databasePath = databaseFixture();
    let generations = 0;
    const textGenerator: TextGenerator = {
      effort: "medium",
      modelId: "test:budget-finalization",
      stream: async function* (request) {
        generations += 1;
        if (generations <= 2) {
          for (let ordinal = 0; ordinal < 4; ordinal += 1)
            yield {
              input: {
                maxResults: 1,
                query: `missing-${generations}-${ordinal}`,
                schemaVersion: 1,
              },
              toolCallId: `budget-tool-${generations}-${ordinal}`,
              toolName: "workspace_search",
              type: "tool-call",
            } as never;
          return;
        }
        if (generations === 3) {
          yield {
            input: {
              maxResults: 1,
              query: "ninth-call-must-not-dispatch",
              schemaVersion: 1,
            },
            toolCallId: "budget-tool-9",
            toolName: "workspace_search",
            type: "tool-call",
          } as never;
          return;
        }
        expect(request.tools).toEqual([]);
        expect(request.messages.at(-1)?.content).toContain(
          "kernel research/tool budget is exhausted",
        );
        yield "CURIOSITY_NO_GO: available evidence is insufficient.";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator,
      workspaceRoot: path.dirname(databasePath),
    });
    await expect(harness.chat(turn())).resolves.toMatchObject({
      text: "CURIOSITY_NO_GO: available evidence is insufficient.",
    });
    expect(generations).toBe(4);
    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM tool_calls WHERE status = 'succeeded'",
        )
        .get()?.count,
    ).toBe(8);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls WHERE status = 'succeeded'",
        )
        .get()?.count,
    ).toBe(4);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'turn.completed'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'turn.failed'",
        )
        .get()?.count,
    ).toBe(0);
    database.close();
    await harness.dispose();
  });

  test("fails a research turn whose citation was not captured", async () => {
    const databasePath = databaseFixture();
    let generations = 0;
    const researchAdapter: ResearchAdapter = {
      close: () => undefined,
      receipt: {
        adapterId: "test-search-only",
        adapterVersion: "1.0.0",
        capabilities: ["network.search"],
        securityProfile: "curiosity-runtime-query-v1",
      },
      search: async () => ({
        queriedAt: "2026-08-26T15:00:00.000Z",
        results: [
          {
            canonicalUrl: "https://example.com/captured",
            snippet: "Captured evidence.",
            title: "Captured source",
          },
        ],
      }),
    };
    const textGenerator: TextGenerator = {
      effort: "high",
      modelId: "test:unresolved-citation",
      stream: async function* () {
        generations += 1;
        if (generations === 1) {
          yield {
            input: {
              maxResults: 1,
              query: "captured evidence",
              schemaVersion: 1,
            },
            toolCallId: "tool-call-unresolved-001",
            toolName: "web_search",
            type: "tool-call",
          } as never;
          return;
        }
        yield "Unsupported citation https://example.net/not-captured";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      researchAdapter,
      supervisorPath,
      textGenerator,
      workspaceRoot: path.dirname(databasePath),
    });

    await harness.submit(
      signCommand(
        {
          actorId,
          command: {
            id: "command-research-unresolved",
            kind: "prompt.command.invoke",
            payload: {
              activationId: "activation-research-unresolved",
              arguments: "Check citations",
              name: "research",
              schemaVersion: 1,
              threadId: "thread-chat-001",
            },
            schemaVersion: 1,
          },
          issuedAt: new Date().toISOString(),
          nonce: "nonce-research-unresolved",
          schemaVersion: 1,
        },
        secret,
      ),
    );

    await expect(harness.chat(turn("researcher"))).rejects.toMatchObject({
      _tag: "TextGenerationFailure",
      message: "RESEARCH_CITATION_UNRESOLVED",
      modelId: "test:unresolved-citation",
    });
    expect(generations).toBe(2);
    expect(await harness.projections.messages("thread-chat-001")).toEqual([
      expect.objectContaining({ role: "user", text: "Hello Curiosity" }),
    ]);
    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'research.receipt.generated'",
        )
        .get()?.count,
    ).toBe(0);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'turn.failed' AND json_extract(body_json, '$.errorCode') = 'RESEARCH_CITATION_UNRESOLVED'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
    await harness.dispose();
  });

  test("records a failed turn without fabricating an assistant message", async () => {
    const databasePath = databaseFixture();
    const textGenerator: TextGenerator = {
      effort: "default",
      modelId: "test:failure",
      stream: async function* () {
        throw new Error("provider secret must not escape");
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator,
      workspaceRoot: path.dirname(databasePath),
    });

    await expect(harness.chat(turn())).rejects.toMatchObject({
      _tag: "TextGenerationFailure",
      message: "TEXT_GENERATION_FAILED",
      modelId: "test:failure",
    });
    expect(await harness.projections.messages("thread-chat-001")).toEqual([
      expect.objectContaining({ role: "user", text: "Hello Curiosity" }),
    ]);
    await harness.dispose();
  });
});
