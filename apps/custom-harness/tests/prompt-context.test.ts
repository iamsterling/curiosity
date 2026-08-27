import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type PromptMessage,
  type TextGenerator,
} from "../src/index.js";
import { canonicalJson } from "../src/kernel/canonical-json.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);

const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "curiosity-context-"));
  roots.push(root);
  return path.join(root, "events.sqlite");
};

const turn = () =>
  signCommand(
    {
      actorId,
      command: {
        id: "command-context-001",
        kind: "chat.turn",
        payload: {
          assistantMessageId: "assistant-context-001",
          text: "Explain the plugin boundary",
          threadId: "thread-context-001",
          turnId: "turn-context-001",
          userMessageId: "user-context-001",
        },
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: "nonce-context-001",
      schemaVersion: 1,
    },
    secret,
  );

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("native agent policy and bounded context", () => {
  test("sends digest-bound system and durable context blocks before conversation messages", async () => {
    const databasePath = fixture();
    let captured: readonly PromptMessage[] = [];
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:context",
      stream: async function* ({ messages }) {
        captured = messages;
        yield "Boundary explained.";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: path.dirname(databasePath),
    });

    await harness.chat(turn());
    expect(captured.map(({ role }) => role)).toEqual([
      "system",
      "system",
      "system",
      "user",
    ]);
    expect(captured[0]?.content).toContain("Curiosity");
    expect(captured[1]?.content).toContain("thread-context-001");
    expect(captured[2]?.content).toContain(
      "CURIOSITY_CAPABILITY_UNAVAILABLE:filesystem.mutation",
    );
    expect(captured[3]?.content).toBe("Explain the plugin boundary");
    await harness.dispose();

    const database = new Database(databasePath, {
      strict: true,
    });
    const call = database
      .query<
        {
          catalog_digest: string;
          prompt_snapshot_digest: string;
          prompt_snapshot_json: string;
        },
        []
      >(
        "SELECT catalog_digest,prompt_snapshot_digest,prompt_snapshot_json FROM provider_calls",
      )
      .get();
    expect(call?.catalog_digest).toMatch(/^[a-f0-9]{64}$/u);
    expect(call?.prompt_snapshot_digest).toMatch(/^[a-f0-9]{64}$/u);
    expect(JSON.parse(call!.prompt_snapshot_json)).toMatchObject({
      agent: { id: "generalist", version: "1.2.0" },
      blocks: [
        expect.objectContaining({ required: true, slot: "agent-policy" }),
        expect.objectContaining({ slot: "durable-context" }),
        expect.objectContaining({ required: true, slot: "kernel-notice" }),
      ],
    });
    const snapshot = JSON.parse(call!.prompt_snapshot_json) as {
      readonly messages: readonly PromptMessage[];
    };
    expect(snapshot.messages).toEqual(captured);
    expect(
      createHash("sha256")
        .update(canonicalJson(JSON.parse(call!.prompt_snapshot_json)))
        .digest("hex"),
    ).toBe(call!.prompt_snapshot_digest);
    expect(() =>
      database.run("UPDATE provider_calls SET prompt_snapshot_json = ?", [
        "{}",
      ]),
    ).toThrow("PROVIDER_CALL_SNAPSHOT_IMMUTABLE");
    database.close();
  });
});
