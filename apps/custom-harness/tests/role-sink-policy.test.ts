import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type ResearchAdapter,
  type TextGenerator,
} from "../src/index.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);
const signed = (kind: string, payload: unknown, suffix: string) =>
  signCommand(
    {
      actorId,
      command: {
        id: `role-sink-command-${suffix}`,
        kind,
        payload,
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: `role-sink-nonce-${suffix}`,
      schemaVersion: 1,
    },
    secret,
  );

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("mechanical role sink policy", () => {
  test("denies reviewer and researcher mutation at the final sink regardless of model output", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-role-sink-"));
    roots.push(root);
    const databasePath = path.join(root, "events.sqlite");
    const target = path.join(root, "forbidden.txt");
    let calls = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:role-sink-policy",
      stream: async function* (request) {
        calls += 1;
        const last = request.messages.at(-1)?.content ?? "";
        if (last.includes("Ask the reviewer child")) {
          yield {
            input: {
              agentId: "reviewer",
              description: "Attempt forbidden reviewer mutation",
              ownership: { readOnly: true, resources: ["workspace:forbidden.txt"] },
              requested: {
                capabilities: ["provider.generate"],
                maximumProviderCalls: 1,
                maximumToolCalls: 0,
                tools: [],
              },
              schemaVersion: 1,
              task: {
                acceptanceChecks: ["Do not mutate."],
                contextRefs: [],
                deliverable: "A denial",
                nonGoals: ["Mutation"],
                objective: "Reviewer mutation fixture.",
              },
            },
            toolCallId: "reviewer-forbidden-write",
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
          return;
        }
        if (last.includes("Reviewer mutation fixture.")) {
          expect(request.tools).toEqual([]);
          yield {
            input: {
              content: "forbidden",
              expectedSha256: null,
              path: "forbidden.txt",
            },
            toolCallId: "reviewer-write",
            toolName: "workspace_write",
            type: "tool-call",
          } as never;
          return;
        }
        if (last.includes("Ask the researcher role")) {
          expect(request.tools?.some(({ name }) => name === "workspace_write")).toBe(
            false,
          );
          yield {
            input: {
              content: "forbidden",
              expectedSha256: null,
              path: "forbidden.txt",
            },
            toolCallId: "researcher-write",
            toolName: "workspace_write",
            type: "tool-call",
          } as never;
          return;
        }
        expect(last).toContain("TEXT_GENERATION_FAILED");
        yield "Reviewer mutation was denied.";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      researchAdapter: {
        close: () => undefined,
        receipt: {
          adapterId: "test-role-sink-research",
          adapterVersion: "1.0.0",
          capabilities: ["network.search"],
          securityProfile: "bounded-http-v1",
        },
        search: async () => ({ queriedAt: new Date().toISOString(), results: [] }),
      } satisfies ResearchAdapter,
      supervisorPath,
      textGenerator: generator,
      workspaceMutationEnabled: true,
      workspaceRoot: root,
    });
    expect(
      await harness.chat(
        signed(
          "chat.turn",
          {
            assistantMessageId: "reviewer-sink-assistant",
            text: "Ask the reviewer child to check mutation policy.",
            threadId: "reviewer-sink-thread",
            turnId: "reviewer-sink-turn",
            userMessageId: "reviewer-sink-user",
          },
          "reviewer-turn",
        ),
      ),
    ).toMatchObject({ text: "Reviewer mutation was denied." });

    await harness.submit(
      signed(
        "prompt.command.invoke",
        {
          activationId: "researcher-sink-activation",
          arguments: "mutation denial",
          name: "research",
          schemaVersion: 1,
          threadId: "researcher-sink-thread",
        },
        "researcher-activation",
      ),
    );
    await expect(
      harness.chat(
        signed(
          "chat.turn",
          {
            agentId: "researcher",
            assistantMessageId: "researcher-sink-assistant",
            text: "Ask the researcher role to attempt mutation.",
            threadId: "researcher-sink-thread",
            turnId: "researcher-sink-turn",
            userMessageId: "researcher-sink-user",
          },
          "researcher-turn",
        ),
      ),
    ).rejects.toMatchObject({ message: "TEXT_GENERATION_FAILED" });
    expect(existsSync(target)).toBe(false);
    await harness.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ count: number }, []>("SELECT count(*) AS count FROM tool_calls")
        .get()?.count,
    ).toBe(0);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM agent_runs WHERE status = 'failed'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
    expect(calls).toBe(4);
  });
});
