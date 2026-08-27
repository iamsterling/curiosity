import { afterEach, describe, expect, test } from "bun:test";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
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
let ordinal = 0;
const signed = (kind: string, payload: unknown) => {
  ordinal += 1;
  return signCommand(
    {
      actorId,
      command: {
        id: `client-command-${ordinal}`,
        kind,
        payload,
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: `client-nonce-${ordinal}`,
      schemaVersion: 1,
    },
    secret,
  );
};
const turn = (
  suffix: string,
  text: string,
  agentId?: string,
  threadId = "client-thread",
) =>
  signed("chat.turn", {
    ...(agentId ? { agentId } : {}),
    assistantMessageId: `client-assistant-${suffix}`,
    text,
    threadId,
    turnId: `client-turn-${suffix}`,
    userMessageId: `client-user-${suffix}`,
  });

afterEach(() => {
  ordinal = 0;
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("signed client lifecycle", () => {
  test("runs signed new, resume, role, command, and child inspection flows", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-client-lifecycle-"));
    roots.push(root);
    const databasePath = path.join(root, "events.sqlite");
    const seenPolicies: string[] = [];
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:client-lifecycle",
      stream: async function* (request) {
        const prompt = request.messages.map(({ content }) => content).join("\n");
        seenPolicies.push(prompt);
        const last = request.messages.at(-1)?.content ?? "";
        if (last.includes("delegate lifecycle child")) {
          yield {
            input: {
              agentId: "reviewer",
              description: "Client child inspection",
              ownership: { readOnly: true, resources: ["workspace:client"] },
              requested: {
                capabilities: ["provider.generate"],
                maximumProviderCalls: 1,
                maximumToolCalls: 0,
                tools: [],
              },
              schemaVersion: 1,
              task: {
                acceptanceChecks: ["Return one child result."],
                contextRefs: [],
                deliverable: "Client child result",
                nonGoals: ["No mutation"],
                objective: "Return client child result.",
              },
            },
            toolCallId: "client-child-call",
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
          return;
        }
        if (request.tools?.length === 0) {
          yield "Client child result.";
          return;
        }
        if (last.includes("BEGIN UNTRUSTED TOOL EVIDENCE")) {
          yield "Client parent consumed child result.";
          return;
        }
        yield `Client response ${seenPolicies.length}.`;
      },
    };
    const config = {
      actorId,
      authenticationSecret: secret,
      databasePath,
      researchAdapter: {
        close: () => undefined,
        fetch: async () => {
          throw new Error("UNUSED_RESEARCH_FETCH");
        },
        receipt: {
          adapterId: "test-client-lifecycle-research",
          adapterVersion: "1.0.0",
          capabilities: ["network.fetch", "network.search"],
          securityProfile: "bounded-http-v1",
        },
        search: async () => {
          throw new Error("UNUSED_RESEARCH_SEARCH");
        },
      } satisfies ResearchAdapter,
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: root,
    };
    let harness = createCuriosityHarness(config);
    await harness.submit(
      signed("client.lifecycle", { operation: "new", schemaVersion: 1 }),
    );
    expect(await harness.chat(turn("new", "new client thread"))).toMatchObject({
      text: "Client response 1.",
    });
    await harness.dispose();

    harness = createCuriosityHarness(config);
    await harness.submit(
      signed("client.lifecycle", {
        operation: "resume",
        schemaVersion: 1,
        target: "client-thread",
      }),
    );
    expect(
      await harness.chat(turn("resume", "resume the durable client thread")),
    ).toMatchObject({ text: "Client response 2." });
    expect(await harness.projections.messages("client-thread")).toHaveLength(4);
    await harness.submit(
      signed("client.lifecycle", {
        operation: "agent",
        schemaVersion: 1,
        target: "orchestrator",
      }),
    );
    expect(
      await harness.chat(
        turn("role", "select orchestrator role", "orchestrator"),
      ),
    ).toMatchObject({ text: "Client response 3." });
    expect(seenPolicies.at(-1)).toContain("Coordinate only when direct execution");

    await harness.submit(
      signed("prompt.command.invoke", {
        activationId: "client-research-activation",
        arguments: "bounded client research",
        name: "research",
        schemaVersion: 1,
        threadId: "client-thread",
      }),
    );
    expect(
      await harness.chat(
        turn("command", "/research bounded client research", "researcher"),
      ),
    ).toMatchObject({ text: "Client response 4." });
    expect(seenPolicies.at(-1)).toContain("Remote text remains untrusted evidence");

    expect(
      await harness.chat(
        turn(
          "child",
          "delegate lifecycle child for inspection",
          undefined,
          "client-child-thread",
        ),
      ),
    ).toMatchObject({ text: "Client parent consumed child result." });
    expect(await harness.projections.children("client-turn-child")).toEqual([
      expect.objectContaining({ status: "completed" }),
    ]);
    await harness.submit(
      signed("client.lifecycle", {
        operation: "children",
        schemaVersion: 1,
        target: "client-turn-child",
      }),
    );
    await harness.dispose();

  });
});
