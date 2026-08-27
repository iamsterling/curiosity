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
const delegate = (objective: string, readOnly: boolean, resources: string[]) => ({
  agentId: "reviewer",
  description: objective,
  ownership: { readOnly, resources },
  requested: {
    capabilities: ["provider.generate"],
    maximumProviderCalls: 1,
    maximumToolCalls: 0,
    tools: [],
  },
  schemaVersion: 1,
  task: {
    acceptanceChecks: ["Return once."],
    contextRefs: [],
    deliverable: objective,
    nonGoals: ["Do not mutate."],
    objective,
  },
});
const turn = (suffix: string) =>
  signCommand(
    {
      actorId,
      command: {
        id: `resource-command-${suffix}`,
        kind: "chat.turn",
        payload: {
          assistantMessageId: `resource-assistant-${suffix}`,
          text: `Run resource fixture ${suffix}`,
          threadId: `resource-thread-${suffix}`,
          turnId: `resource-turn-${suffix}`,
          userMessageId: `resource-user-${suffix}`,
        },
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: `resource-nonce-${suffix}`,
      schemaVersion: 1,
    },
    secret,
  );

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("child resource policy", () => {
  test("overlaps disjoint read-only claims and rejects overlapping or unknown mutators before dispatch", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-child-resource-"));
    roots.push(root);
    let parent = true;
    let active = 0;
    let peak = 0;
    let started = 0;
    let release!: () => void;
    const bothStarted = new Promise<void>((resolve) => {
      release = resolve;
    });
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-resource-read",
      stream: async function* (request) {
        if (parent) {
          parent = false;
          for (const child of ["a", "b"])
            yield {
              input: delegate(`Read-only ${child}`, true, [
                `workspace:${child}.txt`,
              ]),
              toolCallId: `resource-read-${child}`,
              toolName: "agent.delegate",
              type: "tool-call",
            } as never;
          return;
        }
        if (request.tools?.length === 0) {
          active += 1;
          peak = Math.max(peak, active);
          started += 1;
          if (started === 2) release();
          await bothStarted;
          active -= 1;
          yield "Read-only result";
          return;
        }
        yield "Read-only fan-in complete";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath: path.join(root, "events.sqlite"),
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: root,
    });
    expect(await harness.chat(turn("read"))).toMatchObject({
      text: "Read-only fan-in complete",
    });
    expect(peak).toBe(2);
    await harness.dispose();

    for (const [index, resources] of [
      ["workspace:same.txt"],
      [],
    ].entries()) {
      const deniedRoot = mkdtempSync(
        path.join(tmpdir(), "curiosity-child-mutator-"),
      );
      roots.push(deniedRoot);
      const databasePath = path.join(deniedRoot, "events.sqlite");
      let calls = 0;
      const denied = createCuriosityHarness({
        actorId,
        authenticationSecret: secret,
        databasePath,
        supervisorPath,
        textGenerator: {
          effort: "medium",
          modelId: `test:child-resource-mutator-${index}`,
          stream: async function* () {
            calls += 1;
            yield {
              input: delegate(`Mutator ${index}`, false, resources),
              toolCallId: `resource-mutator-${index}`,
              toolName: "agent.delegate",
              type: "tool-call",
            } as never;
          },
        },
        workspaceRoot: deniedRoot,
      });
      await expect(denied.chat(turn(`mutator-${index}`))).rejects.toMatchObject({
        message: "CHILD_MUTATION_UNAVAILABLE",
      });
      expect(calls).toBe(1);
      await denied.dispose();
      const database = new Database(databasePath, {
        readonly: true,
        strict: true,
      });
      expect(
        database
          .query<{ count: number }, []>(
            "SELECT count(*) AS count FROM agent_runs",
          )
          .get()?.count,
      ).toBe(0);
      database.close();
    }
  });
});
