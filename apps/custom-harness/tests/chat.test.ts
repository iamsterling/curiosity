import { afterEach, describe, expect, test } from "bun:test";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type TextGenerator,
} from "../src/index.js";
import { createAiSdkTextGenerator } from "../src/providers/ai-sdk.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);

const turn = () =>
  signCommand(
    {
      actorId,
      command: {
        id: "command-chat-001",
        kind: "chat.turn",
        payload: {
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
        deltas.push(delta);
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
    await reopened.dispose();
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
