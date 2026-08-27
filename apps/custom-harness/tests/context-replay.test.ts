import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type TextGenerationRequest,
  type TextGenerator,
} from "../src/index.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);
const fixedTime = Date.parse("2026-08-27T12:00:00.000Z");
const envelope = signCommand(
  {
    actorId,
    command: {
      id: "context-replay-command",
      kind: "chat.turn",
      payload: {
        assistantMessageId: "context-replay-assistant",
        text: "Delegate one deterministic replay check.",
        threadId: "context-replay-thread",
        turnId: "context-replay-turn",
        userMessageId: "context-replay-user",
      },
      schemaVersion: 1,
    },
    issuedAt: new Date(fixedTime).toISOString(),
    nonce: "context-replay-nonce",
    schemaVersion: 1,
  },
  secret,
);

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("deterministic context and route replay", () => {
  test("reproduces ordered blocks, tools, route, source revision, child revision, and prompt digest", async () => {
    const workspaceRoot = mkdtempSync(
      path.join(tmpdir(), "curiosity-context-replay-"),
    );
    roots.push(workspaceRoot);
    const execute = async (databasePath: string) => {
      const requests: Array<{
        effort: string;
        messages: TextGenerationRequest["messages"];
        modelId: string;
        tools: TextGenerationRequest["tools"];
      }> = [];
      let generation = 0;
      const generator: TextGenerator = {
        effort: "high",
        modelId: "test:context-replay",
        stream: async function* (request) {
          requests.push({
            effort: "high",
            messages: request.messages,
            modelId: "test:context-replay",
            tools: request.tools,
          });
          generation += 1;
          if (generation === 1) {
            yield {
              input: {
                agentId: "reviewer",
                description: "Deterministic replay child",
                ownership: {
                  readOnly: true,
                  resources: ["workspace:context-replay"],
                },
                requested: {
                  capabilities: ["provider.generate"],
                  maximumProviderCalls: 1,
                  maximumToolCalls: 0,
                  tools: [],
                },
                schemaVersion: 1,
                task: {
                  acceptanceChecks: ["Return one deterministic result."],
                  contextRefs: [],
                  deliverable: "Deterministic child result",
                  nonGoals: ["Do not mutate."],
                  objective: "Check deterministic child context.",
                },
              },
              toolCallId: "context-replay-child-call",
              toolName: "agent.delegate",
              type: "tool-call",
            } as never;
            return;
          }
          yield generation === 2
            ? "Deterministic child result."
            : "Deterministic parent result.";
        },
      };
      const harness = createCuriosityHarness({
        actorId,
        authenticationSecret: secret,
        clock: () => fixedTime,
        databasePath,
        supervisorPath,
        textGenerator: generator,
        workspaceRoot,
      });
      expect(await harness.chat(envelope)).toMatchObject({
        text: "Deterministic parent result.",
      });
      await harness.dispose();
      const database = new Database(databasePath, {
        readonly: true,
        strict: true,
      });
      const snapshots = database
        .query<
          {
            catalog_digest: string;
            child_session_revision: number | null;
            config_digest: string;
            policy_digest: string;
            prompt_snapshot_digest: string;
            prompt_snapshot_json: string;
            purpose: string;
            route_id: string;
            source_revision: number;
          },
          []
        >(
          "SELECT provider_calls.catalog_digest,json_extract(actions.input_json,'$.correlation.sessionRevision') AS child_session_revision,json_extract(attempts.snapshot_json,'$.configDigest') AS config_digest,json_extract(attempts.snapshot_json,'$.route.policyDigest') AS policy_digest,provider_calls.prompt_snapshot_digest,provider_calls.prompt_snapshot_json,provider_calls.purpose,json_extract(attempts.snapshot_json,'$.route.routeId') AS route_id,provider_calls.source_revision FROM provider_calls JOIN attempts ON attempts.attempt_id = provider_calls.attempt_id JOIN actions ON actions.action_id = provider_calls.action_id ORDER BY provider_calls.rowid",
        )
        .all();
      database.close();
      return { requests, snapshots };
    };

    const first = await execute(path.join(workspaceRoot, "first.sqlite"));
    const second = await execute(path.join(workspaceRoot, "second.sqlite"));
    expect(second).toEqual(first);
    expect(first.requests).toHaveLength(3);
    expect(first.snapshots.map(({ purpose }) => purpose)).toEqual([
      "normal",
      "child",
      "normal",
    ]);
    expect(
      first.snapshots.every(
        ({ catalog_digest, config_digest, policy_digest }) =>
          /^[a-f0-9]{64}$/u.test(catalog_digest) &&
          /^[a-f0-9]{64}$/u.test(config_digest) &&
          /^[a-f0-9]{64}$/u.test(policy_digest),
      ),
    ).toBe(true);
    expect(first.snapshots[1]?.child_session_revision).toBe(0);
  });
});
