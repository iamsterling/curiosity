import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type TextGenerator,
} from "../src/index.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);

const signedTurn = (ordinal: number) =>
  signCommand(
    {
      actorId,
      command: {
        id: `command-compaction-${ordinal}`,
        kind: "chat.turn",
        payload: {
          assistantMessageId: `assistant-compaction-${ordinal}`,
          text: `Question ${ordinal}`,
          threadId: "thread-compaction",
          turnId: `turn-compaction-${ordinal}`,
          userMessageId: `user-compaction-${ordinal}`,
        },
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: `nonce-compaction-${ordinal}`,
      schemaVersion: 1,
    },
    secret,
  );

const isCompaction = (request: Parameters<TextGenerator["stream"]>[0]) =>
  request.messages.some(
    ({ content }) =>
      content.includes('"provenance":"untrusted-conversation"') &&
      content.includes('"instruction":"Summarize the covered conversation'),
  );

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("explicit conversation compaction", () => {
  test("accounts one immutable compaction artifact and reuses it on replay", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-compaction-"));
    roots.push(root);
    const databasePath = path.join(root, "events.sqlite");
    let normalCalls = 0;
    let compactionCalls = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:compaction",
      stream: async function* (request) {
        if (isCompaction(request)) {
          compactionCalls += 1;
          expect(request.tools).toEqual([]);
          yield "Questions 1 through 64 were answered without unresolved work.";
          return;
        }
        normalCalls += 1;
        if (normalCalls === 65) {
          expect(
            request.messages.some(({ content }) =>
              content.includes("BEGIN UNTRUSTED COMPACTION SUMMARY"),
            ),
          ).toBe(true);
        }
        yield `Answer ${normalCalls}`;
      },
    };
    const config = {
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: root,
    };
    const harness = createCuriosityHarness(config);
    for (let ordinal = 1; ordinal <= 65; ordinal += 1)
      expect(await harness.chat(signedTurn(ordinal))).toMatchObject({
        text: `Answer ${ordinal}`,
      });
    expect({ compactionCalls, normalCalls }).toEqual({
      compactionCalls: 1,
      normalCalls: 65,
    });
    expect(
      await harness.projections.childAccounting("turn-compaction-65"),
    ).toMatchObject({
      totals: {
        compactionCalls: 1,
        providerCalls: 2,
      },
    });
    await harness.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    const completion = database
      .query<
        {
          body_json: string;
          event_hash: string;
          event_type: string;
        },
        []
      >(
        "SELECT event_type,body_json,event_hash FROM events WHERE event_type = 'compaction.completed'",
      )
      .get();
    expect(completion?.event_type).toBe("compaction.completed");
    const requested = database
      .query<
        {
          body_json: string;
          causation_id: string;
          correlation_id: string;
          parent_execution_id: string;
          root_execution_id: string;
        },
        []
      >(
        "SELECT body_json,causation_id,correlation_id,parent_execution_id,root_execution_id FROM events WHERE event_type = 'compaction.requested'",
      )
      .get();
    const requestedBody = JSON.parse(requested!.body_json) as {
      readonly parentActionId: string;
    };
    expect(requested).toMatchObject({
      causation_id: database
        .query<{ source_event_id: string }, [string]>(
          "SELECT source_event_id FROM actions WHERE action_id = ?",
        )
        .get(requestedBody.parentActionId)?.source_event_id,
      correlation_id: "turn-compaction-65",
      parent_execution_id: "turn-compaction-65",
      root_execution_id: "turn-compaction-65",
    });
    const body = JSON.parse(completion!.body_json) as Record<string, unknown>;
    expect(body.summaryDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(body.retainedTailDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(body.coveredMessageDigests).toBeArrayOfSize(33);
    expect(
      (body.coveredMessageDigests as string[]).every((value) =>
        /^[a-f0-9]{64}$/u.test(value),
      ),
    ).toBe(true);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls WHERE purpose = 'compaction'",
        )
        .get()?.count,
    ).toBe(1);
    const parentSnapshot = database
      .query<{ snapshot_json: string }, []>(
        "SELECT attempts.snapshot_json FROM attempts JOIN provider_calls ON provider_calls.attempt_id = attempts.attempt_id JOIN actions ON actions.action_id = provider_calls.action_id WHERE actions.execution_id = 'turn-compaction-65' AND provider_calls.purpose = 'normal'",
      )
      .get();
    const parsed = JSON.parse(parentSnapshot!.snapshot_json) as {
      promptSnapshot: {
        conversation: { omittedDigests: string[] };
        messages: { content: string }[];
      };
    };
    expect(parsed.promptSnapshot.conversation.omittedDigests).toEqual([]);
    expect(
      parsed.promptSnapshot.messages.some(({ content }) =>
        content.includes("BEGIN UNTRUSTED COMPACTION SUMMARY"),
      ),
    ).toBe(true);
    const eventHash = completion!.event_hash;
    database.close();

    const reopened = createCuriosityHarness(config);
    expect(await reopened.chat(signedTurn(65))).toMatchObject({ text: "Answer 65" });
    expect({ compactionCalls, normalCalls }).toEqual({
      compactionCalls: 1,
      normalCalls: 65,
    });
    await reopened.dispose();
    const replayed = new Database(databasePath, { readonly: true, strict: true });
    expect(
      replayed
        .query<{ event_hash: string }, []>(
          "SELECT event_hash FROM events WHERE event_type = 'compaction.completed'",
        )
        .get()?.event_hash,
    ).toBe(eventHash);
    replayed.close();
  });

  test("fails the parent without continuity when the compaction call fails", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-compaction-fail-"));
    roots.push(root);
    const databasePath = path.join(root, "events.sqlite");
    let calls = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:compaction-failure",
      stream: async function* (request) {
        calls += 1;
        if (isCompaction(request)) throw new Error("TEST_COMPACTION_FAILURE");
        yield `Answer ${calls}`;
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: root,
    });
    for (let ordinal = 1; ordinal <= 64; ordinal += 1)
      await harness.chat(signedTurn(ordinal));
    await expect(harness.chat(signedTurn(65))).rejects.toMatchObject({
      message: "COMPACTION_FAILED",
    });
    expect(calls).toBe(65);
    await harness.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ error_code: string; status: string }, []>(
          "SELECT status,error_code FROM actions WHERE execution_id = 'turn-compaction-65'",
        )
        .get(),
    ).toEqual({ error_code: "COMPACTION_FAILED", status: "failed" });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'compaction.completed'",
        )
        .get()?.count,
    ).toBe(0);
    expect(
      database
        .query<{ delivery_certainty: string; status: string }, []>(
          "SELECT status,delivery_certainty FROM provider_calls WHERE purpose = 'compaction'",
        )
        .get(),
    ).toEqual({ delivery_certainty: "NOT_DELIVERED", status: "failed" });
    database.close();
  });
});
