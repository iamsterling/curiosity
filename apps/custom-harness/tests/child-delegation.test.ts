import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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

const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "curiosity-child-"));
  roots.push(root);
  return { databasePath: path.join(root, "events.sqlite"), root };
};

const turn = (
  agentId = "generalist",
  suffix = agentId,
  issuedAt = new Date().toISOString(),
) =>
  signCommand(
    {
      actorId,
      command: {
        id: `command-child-${suffix}`,
        kind: "chat.turn",
        payload: {
          agentId,
          assistantMessageId: `assistant-child-${suffix}`,
          text: "Ask an independent reviewer for one bounded verdict.",
          threadId: `thread-child-${suffix}`,
          turnId: `turn-child-${suffix}`,
          userMessageId: `user-child-${suffix}`,
        },
        schemaVersion: 1,
      },
      issuedAt,
      nonce: `nonce-child-${suffix}`,
      schemaVersion: 1,
    },
    secret,
  );

const delegateInput = (overrides: Record<string, unknown> = {}) => ({
  agentId: "reviewer",
  description: "Independent bounded review",
  ownership: { readOnly: true, resources: [] },
  requested: {
    capabilities: ["provider.generate"],
    maximumProviderCalls: 1,
    maximumToolCalls: 0,
    tools: [],
  },
  schemaVersion: 1,
  task: {
    acceptanceChecks: ["Return one explicit verdict."],
    contextRefs: [],
    deliverable: "A concise independent verdict.",
    nonGoals: ["Do not mutate files."],
    objective: "Review the bounded task independently.",
  },
  ...overrides,
});

const cancel = (executionId: string, suffix: string) =>
  signCommand(
    {
      actorId,
      command: {
        id: `command-cancel-${suffix}`,
        kind: "execution.cancel",
        payload: { executionId, schemaVersion: 1 },
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: `nonce-cancel-${suffix}`,
      schemaVersion: 1,
    },
    secret,
  );

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("durable child-agent execution", () => {
  test("runs a fresh child call and resumes the parent exactly once", async () => {
    const { databasePath, root } = fixture();
    const requests: TextGenerationRequest[] = [];
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-sequential",
      stream: async function* (request) {
        requests.push(request);
        generations += 1;
        if (generations === 1) {
          expect(request.tools?.some(({ name }) => name === "agent.delegate")).toBe(
            true,
          );
          yield "I will request an independent review.";
          yield {
            input: delegateInput(),
            toolCallId: "delegate-call-001",
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
          return;
        }
        if (generations === 2) {
          expect(request.tools).toEqual([]);
          expect(request.messages.map(({ role }) => role)).toEqual([
            "system",
            "system",
            "user",
          ]);
          expect(request.messages[0]?.content).toContain("Review independently");
          expect(request.messages[1]?.content).toContain(
            "CURIOSITY_CAPABILITY_UNAVAILABLE:semantic.command",
          );
          expect(request.messages[2]?.content).toContain(
            "Review the bounded task independently.",
          );
          expect(
            request.messages.some(({ content }) =>
              content.includes("Ask an independent reviewer"),
            ),
          ).toBe(false);
          yield "Verdict: no evidenced defect.";
          return;
        }
        expect(request.messages.at(-1)?.content).toContain(
          "Verdict: no evidenced defect.",
        );
        expect(request.messages.at(-1)?.content).toContain(
          "BEGIN UNTRUSTED TOOL EVIDENCE",
        );
        yield "Independent review completed: no evidenced defect.";
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
    const deltas: string[] = [];
    expect(await harness.chat(turn(), (delta) => deltas.push(delta))).toMatchObject(
      {
        text: "Independent review completed: no evidenced defect.",
      },
    );
    expect(generations).toBe(3);
    expect(deltas.join("")).not.toContain("Verdict: no evidenced defect.");
    expect(requests).toHaveLength(3);
    await harness.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls",
        )
        .get()?.count,
    ).toBe(3);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls WHERE purpose = 'child'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM agent_sessions",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM agent_runs WHERE status = 'completed'",
        )
        .get()?.count,
    ).toBe(1);
    for (const eventType of [
      "delegation.requested",
      "child.allocated",
      "child.run-started",
      "child.completed",
      "delegation.group-ready",
      "delegation.results-delivered",
    ])
      expect(
        database
          .query<{ count: number }, [string]>(
            "SELECT count(*) AS count FROM events WHERE event_type = ?",
          )
          .get(eventType)?.count,
      ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM delegation_groups WHERE status = 'delivered'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();

    const reopened = createCuriosityHarness(config);
    expect(await reopened.chat(turn())).toMatchObject({
      text: "Independent review completed: no evidenced defect.",
    });
    expect(generations).toBe(3);
    await reopened.dispose();
  });

  test("preallocates two children, dispatches them concurrently, and fans in by ordinal", async () => {
    const { databasePath, root } = fixture();
    let generations = 0;
    let activeChildren = 0;
    let maximumActiveChildren = 0;
    const startedChildren = new Set<string>();
    let releaseChildren!: () => void;
    const bothChildrenStarted = new Promise<void>((resolve) => {
      releaseChildren = resolve;
    });
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-parallel",
      stream: async function* (request) {
        generations += 1;
        const taskMessage = request.messages.at(-1)?.content ?? "";
        if (generations === 1) {
          for (const child of ["A", "B"])
            yield {
              input: delegateInput({
                description: `Independent child ${child}`,
                ownership: {
                  readOnly: true,
                  resources: [`workspace:${child.toLowerCase()}`],
                },
                task: {
                  ...delegateInput().task,
                  objective: `Complete child ${child}.`,
                },
              }),
              toolCallId: `delegate-parallel-${child.toLowerCase()}`,
              toolName: "agent.delegate",
              type: "tool-call",
            } as never;
          return;
        }
        const child = taskMessage.includes("Complete child A.")
          ? "A"
          : taskMessage.includes("Complete child B.")
            ? "B"
            : undefined;
        if (child) {
          const database = new Database(databasePath, {
            readonly: true,
            strict: true,
          });
          expect(
            database
              .query<{ count: number }, []>(
                "SELECT count(*) AS count FROM provider_calls WHERE purpose = 'child'",
              )
              .get()?.count,
          ).toBe(2);
          expect(
            database
              .query<{ status: string }, []>(
                "SELECT status FROM delegation_groups",
              )
              .get()?.status,
          ).toBe("allocated");
          expect(
            database
              .query<{ count: number }, []>(
                "SELECT count(*) AS count FROM events WHERE event_type = 'delegation.results-delivered'",
              )
              .get()?.count,
          ).toBe(0);
          database.close();
          activeChildren += 1;
          maximumActiveChildren = Math.max(
            maximumActiveChildren,
            activeChildren,
          );
          startedChildren.add(child);
          if (startedChildren.size === 2) releaseChildren();
          await Promise.race([
            bothChildrenStarted,
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error("PARALLEL_CHILD_DISPATCH_MISSING")),
                1_000,
              ),
            ),
          ]);
          if (child === "A")
            await new Promise((resolve) => setTimeout(resolve, 20));
          activeChildren -= 1;
          yield `Child ${child} result.`;
          return;
        }
        const evidence = request.messages.at(-1)?.content ?? "";
        expect(evidence.indexOf("Child A result.")).toBeGreaterThan(-1);
        expect(evidence.indexOf("Child B result.")).toBeGreaterThan(
          evidence.indexOf("Child A result."),
        );
        yield "Parent received A then B.";
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
    expect(
      await harness.chat(turn("generalist", "parallel")),
    ).toMatchObject({ text: "Parent received A then B." });
    expect(generations).toBe(4);
    expect(maximumActiveChildren).toBe(2);
    expect(await harness.projections.children("turn-child-parallel")).toEqual([
      expect.objectContaining({
        agentId: "reviewer",
        ordinal: 0,
        rootExecutionId: "turn-child-parallel",
        status: "completed",
      }),
      expect.objectContaining({
        agentId: "reviewer",
        ordinal: 1,
        rootExecutionId: "turn-child-parallel",
        status: "completed",
      }),
    ]);
    const accounting = await harness.projections.childAccounting(
      "turn-child-parallel",
    );
    expect(accounting.totals).toEqual({
      childCalls: 2,
      compactionCalls: 0,
      providerCalls: 4,
      toolCalls: 0,
      unknownUsageCalls: 4,
    });
    expect(new Set(accounting.physicalCalls.map(({ callId }) => callId)).size).toBe(
      4,
    );
    expect(
      accounting.physicalCalls
        .filter(({ purpose }) => purpose === "child")
        .every(({ agentRunId }) => typeof agentRunId === "string"),
    ).toBe(true);
    await harness.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    const group = database
      .query<{ body_json: string }, []>(
        "SELECT body_json FROM events WHERE event_type = 'delegation.group-ready'",
      )
      .get();
    const orderedResults = (
      JSON.parse(group?.body_json ?? "{}") as {
        orderedResults?: readonly { text?: string }[];
      }
    ).orderedResults;
    expect(orderedResults?.map(({ text }) => text)).toEqual([
      "Child A result.",
      "Child B result.",
    ]);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM delegation_groups WHERE expected_children = 2 AND status = 'delivered'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ resource_claims_json: string }, []>(
          "SELECT resource_claims_json FROM agent_runs ORDER BY ordinal",
        )
        .all()
        .map(({ resource_claims_json }) => JSON.parse(resource_claims_json)),
    ).toEqual([
      {
        mode: "shared-read",
        resources: ["workspace:a"],
        scopeState: "declared",
      },
      {
        mode: "shared-read",
        resources: ["workspace:b"],
        scopeState: "declared",
      },
    ]);
    expect(
      database
        .query<{ count: number }, [string]>(
          "SELECT count(*) AS count FROM provider_calls JOIN attempts USING(attempt_id) JOIN execution_ancestry ON execution_ancestry.descendant_execution_id = attempts.execution_id WHERE execution_ancestry.ancestor_execution_id = ?",
        )
        .get("turn-child-parallel")?.count,
    ).toBe(4);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls WHERE usage_state = 'UNKNOWN'",
        )
        .get()?.count,
    ).toBe(4);
    database.close();
  });

  test("keeps the fan-in digest stable when sibling completion order reverses", async () => {
    const fixedNow = Date.parse("2026-08-26T12:00:00.000Z");
    const run = async (slowChild: "A" | "B"): Promise<string> => {
      const { databasePath, root } = fixture();
      let generations = 0;
      let started = 0;
      let release!: () => void;
      const bothStarted = new Promise<void>((resolve) => {
        release = resolve;
      });
      const generator: TextGenerator = {
        effort: "medium",
        modelId: "test:stable-fan-in",
        stream: async function* (request) {
          generations += 1;
          if (generations === 1) {
            for (const child of ["A", "B"])
              yield {
                input: delegateInput({
                  task: {
                    ...delegateInput().task,
                    objective: `Stable child ${child}.`,
                  },
                }),
                toolCallId: `stable-${child.toLowerCase()}`,
                toolName: "agent.delegate",
                type: "tool-call",
              } as never;
            return;
          }
          const message = request.messages.at(-1)?.content ?? "";
          const child = message.includes("Stable child A.")
            ? "A"
            : message.includes("Stable child B.")
              ? "B"
              : undefined;
          if (!child) {
            yield "Stable parent result.";
            return;
          }
          started += 1;
          if (started === 2) release();
          await bothStarted;
          if (child === slowChild)
            await new Promise((resolve) => setTimeout(resolve, 15));
          yield `Stable child ${child} result.`;
        },
      };
      const harness = createCuriosityHarness({
        actorId,
        authenticationSecret: secret,
        clock: () => fixedNow,
        databasePath,
        supervisorPath,
        textGenerator: generator,
        workspaceRoot: root,
      });
      expect(
        await harness.chat(
          turn(
            "generalist",
            "stable-fan-in",
            new Date(fixedNow).toISOString(),
          ),
        ),
      ).toMatchObject({ text: "Stable parent result." });
      await harness.dispose();
      const database = new Database(databasePath, {
        readonly: true,
        strict: true,
      });
      const digest = database
        .query<{ result_digest: string }, []>(
          "SELECT result_digest FROM delegation_groups",
        )
        .get()?.result_digest;
      database.close();
      expect(digest).toMatch(/^[a-f0-9]{64}$/u);
      return digest!;
    };

    expect(await run("A")).toBe(await run("B"));
  });

  test("returns successful and failed siblings together without losing evidence", async () => {
    const { databasePath, root } = fixture();
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-all-settled-failure",
      stream: async function* (request) {
        generations += 1;
        if (generations === 1) {
          for (const child of ["success", "failure"])
            yield {
              input: delegateInput({
                task: {
                  ...delegateInput().task,
                  objective: `Run ${child} sibling.`,
                },
              }),
              toolCallId: `delegate-${child}`,
              toolName: "agent.delegate",
              type: "tool-call",
            } as never;
          return;
        }
        const message = request.messages.at(-1)?.content ?? "";
        if (message.includes("Run success sibling.")) {
          yield "Successful sibling evidence.";
          return;
        }
        if (message.includes("Run failure sibling."))
          throw new Error("CONTROLLED_CHILD_FAILURE");
        expect(message).toContain('"status":"completed"');
        expect(message).toContain("Successful sibling evidence.");
        expect(message).toContain('"status":"failed"');
        expect(message).toContain("TEXT_GENERATION_FAILED");
        yield "Parent retained success and failure.";
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
    expect(
      await harness.chat(turn("generalist", "all-settled-failure")),
    ).toMatchObject({ text: "Parent retained success and failure." });
    expect(generations).toBe(4);
    await harness.dispose();
    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ status: string }, []>(
          "SELECT status FROM agent_runs ORDER BY ordinal",
        )
        .all()
        .map(({ status }) => status),
    ).toEqual(["completed", "failed"]);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'delegation.results-delivered'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
  });

  test("cancels one active child while preserving its successful sibling and one parent resume", async () => {
    const { databasePath, root } = fixture();
    let generations = 0;
    let markCancelledChildStarted!: () => void;
    const cancelledChildStarted = new Promise<void>((resolve) => {
      markCancelledChildStarted = resolve;
    });
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-all-settled-cancel",
      stream: async function* (request) {
        generations += 1;
        if (generations === 1) {
          for (const child of ["cancel", "success"])
            yield {
              input: delegateInput({
                task: {
                  ...delegateInput().task,
                  objective: `Run ${child} cancellation sibling.`,
                },
              }),
              toolCallId: `delegate-cancellation-${child}`,
              toolName: "agent.delegate",
              type: "tool-call",
            } as never;
          return;
        }
        const message = request.messages.at(-1)?.content ?? "";
        if (message.includes("Run cancel cancellation sibling.")) {
          markCancelledChildStarted();
          await new Promise<void>((resolve, reject) => {
            if (request.abortSignal.aborted) {
              reject(new Error("ACTION_CANCELLED"));
              return;
            }
            request.abortSignal.addEventListener(
              "abort",
              () => reject(new Error("ACTION_CANCELLED")),
              { once: true },
            );
          });
          return;
        }
        if (message.includes("Run success cancellation sibling.")) {
          yield "Cancellation sibling success.";
          return;
        }
        expect(message).toContain('"status":"cancelled"');
        expect(message).toContain("ACTION_CANCELLED");
        expect(message).toContain('"status":"completed"');
        expect(message).toContain("Cancellation sibling success.");
        yield "Parent resumed once after child cancellation.";
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
    const chat = harness.chat(turn("generalist", "all-settled-cancel"));
    await cancelledChildStarted;
    const database = new Database(databasePath, { strict: true });
    let childExecutionId: string | undefined;
    for (let attempt = 0; attempt < 100 && !childExecutionId; attempt += 1) {
      childExecutionId = database
        .query<{ child_execution_id: string }, []>(
          "SELECT child_execution_id FROM agent_runs WHERE json_extract(task_json, '$.task.objective') = 'Run cancel cancellation sibling.'",
        )
        .get()?.child_execution_id;
      if (!childExecutionId) await Bun.sleep(10);
    }
    expect(childExecutionId).toStartWith("child-execution:");
    database.close();
    await harness.submit(cancel(childExecutionId!, "one-child"));
    expect(await chat).toMatchObject({
      text: "Parent resumed once after child cancellation.",
    });
    expect(generations).toBe(4);
    await harness.dispose();

    const evidence = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      evidence
        .query<{ status: string }, []>(
          "SELECT status FROM agent_runs ORDER BY ordinal",
        )
        .all()
        .map(({ status }) => status),
    ).toEqual(["cancelled", "completed"]);
    expect(
      evidence
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'child.cancelled'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      evidence
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'delegation.results-delivered'",
        )
        .get()?.count,
    ).toBe(1);
    evidence.close();
  });

  test("cancels a root turn through every active descendant without parent continuation", async () => {
    const { databasePath, root } = fixture();
    let generations = 0;
    let markChildStarted!: () => void;
    const childStarted = new Promise<void>((resolve) => {
      markChildStarted = resolve;
    });
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:root-descendant-cancel",
      stream: async function* (request) {
        generations += 1;
        if (generations === 1) {
          yield {
            input: delegateInput(),
            toolCallId: "delegate-root-cancel",
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
          return;
        }
        markChildStarted();
        await new Promise<void>((resolve, reject) => {
          if (request.abortSignal.aborted) {
            reject(new Error("ACTION_CANCELLED"));
            return;
          }
          request.abortSignal.addEventListener(
            "abort",
            () => reject(new Error("ACTION_CANCELLED")),
            { once: true },
          );
        });
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
    const chat = harness.chat(turn("generalist", "root-cancel"));
    await childStarted;
    await harness.submit(cancel("turn-child-root-cancel", "root-turn"));
    await expect(chat).rejects.toMatchObject({ message: "ACTION_CANCELLED" });
    expect(generations).toBe(2);
    await harness.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM executions WHERE cancellation_requested = 1 AND status = 'cancelled'",
        )
        .get()?.count,
    ).toBe(2);
    expect(
      database
        .query<{ status: string }, []>("SELECT status FROM agent_runs")
        .get()?.status,
    ).toBe("cancelled");
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'delegation.group-cancelled'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'delegation.results-delivered'",
        )
        .get()?.count,
    ).toBe(0);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls",
        )
        .get()?.count,
    ).toBe(2);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM quarantined_receipts WHERE reason = 'STALE_OR_CANCELLED_GENERATION'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
  });

  test("fences root cancellation before a child can be allocated", async () => {
    const { databasePath, root } = fixture();
    let releaseParent!: () => void;
    let markDelegationEmitted!: () => void;
    const parentRelease = new Promise<void>((resolve) => {
      releaseParent = resolve;
    });
    const delegationEmitted = new Promise<void>((resolve) => {
      markDelegationEmitted = resolve;
    });
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:cancel-before-child-allocation",
      stream: async function* (request) {
        generations += 1;
        yield {
          input: delegateInput(),
          toolCallId: "delegate-cancel-before-allocation",
          toolName: "agent.delegate",
          type: "tool-call",
        } as never;
        markDelegationEmitted();
        await Promise.race([
          parentRelease,
          new Promise<void>((_, reject) =>
            request.abortSignal.addEventListener(
              "abort",
              () => reject(new Error("ACTION_CANCELLED")),
              { once: true },
            ),
          ),
        ]);
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
    const chat = harness.chat(turn("generalist", "before-child-allocation"));
    await delegationEmitted;
    await harness.submit(
      cancel("turn-child-before-child-allocation", "before-child-allocation"),
    );
    releaseParent();
    await expect(chat).rejects.toMatchObject({ message: "ACTION_CANCELLED" });
    expect(generations).toBe(1);
    expect(
      await harness.projections.children("turn-child-before-child-allocation"),
    ).toEqual([]);
    await harness.dispose();

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
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM quarantined_receipts WHERE reason = 'STALE_OR_CANCELLED_GENERATION'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
  });

  test("recovers a dispatched child after process death without duplicate child or parent calls", async () => {
    const { databasePath, root } = fixture();
    const markerPath = path.join(root, "child-dispatched");
    const scriptPath = path.join(root, "crash-child.ts");
    const envelope = turn("generalist", "restart-dispatched-child");
    const indexPath = path.resolve(import.meta.dir, "../src/index.ts");
    writeFileSync(
      scriptPath,
      `
        import { Database } from "bun:sqlite";
        import { createCuriosityHarness } from ${JSON.stringify(indexPath)};
        let generations = 0;
        const generator = {
          effort: "medium",
          modelId: "test:child-crash",
          stream: async function* (request) {
            generations += 1;
            if (generations === 1) {
              for (const child of ["success", "unknown"]) {
                const input = ${JSON.stringify(delegateInput())};
                input.task.objective = "Crash " + child + " child.";
                yield {
                  input,
                  toolCallId: "delegate-crash-" + child,
                  toolName: "agent.delegate",
                  type: "tool-call",
                };
              }
              return;
            }
            const message = request.messages.at(-1)?.content ?? "";
            if (message.includes("Crash success child.")) {
              yield "Crash sibling durable success.";
              return;
            }
            const database = new Database(${JSON.stringify(databasePath)}, {
              readonly: true,
              strict: true,
            });
            for (let attempt = 0; attempt < 200; attempt += 1) {
              const completed = database.query(
                "SELECT count(*) AS count FROM provider_calls WHERE purpose = 'child' AND status = 'succeeded'",
              ).get()?.count;
              if (completed === 1) break;
              await Bun.sleep(10);
            }
            database.close();
            await Bun.write(${JSON.stringify(markerPath)}, "dispatched");
            await new Promise(() => {});
          },
        };
        const harness = createCuriosityHarness({
          actorId: ${JSON.stringify(actorId)},
          authenticationSecret: ${JSON.stringify(secret)},
          databasePath: ${JSON.stringify(databasePath)},
          supervisorPath: ${JSON.stringify(supervisorPath)},
          textGenerator: generator,
          workspaceRoot: ${JSON.stringify(root)},
        });
        await harness.chat(${JSON.stringify(envelope)});
      `,
    );
    const crashed = Bun.spawn([process.execPath, scriptPath], {
      stderr: "pipe",
      stdout: "pipe",
    });
    for (let attempt = 0; attempt < 150 && !existsSync(markerPath); attempt += 1)
      await Bun.sleep(20);
    if (!existsSync(markerPath)) {
      crashed.kill("SIGKILL");
      const [stderr, stdout] = await Promise.all([
        new Response(crashed.stderr).text(),
        new Response(crashed.stdout).text(),
      ]);
      throw new Error(`CHILD_CRASH_FIXTURE_FAILED:${stdout}:${stderr}`);
    }
    crashed.kill("SIGKILL");
    await crashed.exited;

    let recoveryGenerations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-recovery",
      stream: async function* (request) {
        recoveryGenerations += 1;
        const evidence = request.messages.at(-1)?.content ?? "";
        expect(evidence).toContain('"status":"completed"');
        expect(evidence).toContain("Crash sibling durable success.");
        expect(evidence).toContain('"status":"delivery-unknown"');
        expect(evidence).toContain("PROVIDER_DELIVERY_UNKNOWN");
        yield "Recovered parent exactly once.";
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
    const recovered = createCuriosityHarness(config);
    expect(await recovered.chat(envelope)).toMatchObject({
      text: "Recovered parent exactly once.",
    });
    expect(recoveryGenerations).toBe(1);
    Bun.gc(true);
    await Bun.sleep(25);
    await recovered.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls",
        )
        .get()?.count,
    ).toBe(4);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls WHERE purpose = 'child' AND status = 'delivery-unknown'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ status: string }, []>(
          "SELECT status FROM agent_runs ORDER BY ordinal",
        )
        .all()
        .map(({ status }) => status),
    ).toEqual(["completed", "delivery-unknown"]);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'delegation.results-delivered'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();

    const replayed = createCuriosityHarness(config);
    expect(await replayed.chat(envelope)).toMatchObject({
      text: "Recovered parent exactly once.",
    });
    expect(recoveryGenerations).toBe(1);
    await replayed.dispose();
  });

  test("does not redispatch or fabricate success when process death interrupts the parent resume", async () => {
    const { databasePath, root } = fixture();
    const markerPath = path.join(root, "parent-resume-dispatched");
    const scriptPath = path.join(root, "crash-parent-resume.ts");
    const envelope = turn("generalist", "restart-parent-resume");
    const indexPath = path.resolve(import.meta.dir, "../src/index.ts");
    writeFileSync(
      scriptPath,
      `
        import { createCuriosityHarness } from ${JSON.stringify(indexPath)};
        let generations = 0;
        const generator = {
          effort: "medium",
          modelId: "test:parent-resume-crash",
          stream: async function* () {
            generations += 1;
            if (generations === 1) {
              yield {
                input: ${JSON.stringify(delegateInput())},
                toolCallId: "delegate-before-parent-crash",
                toolName: "agent.delegate",
                type: "tool-call",
              };
              return;
            }
            if (generations === 2) {
              yield "Child completed before parent crash.";
              return;
            }
            await Bun.write(${JSON.stringify(markerPath)}, "dispatched");
            await new Promise(() => {});
          },
        };
        const harness = createCuriosityHarness({
          actorId: ${JSON.stringify(actorId)},
          authenticationSecret: ${JSON.stringify(secret)},
          databasePath: ${JSON.stringify(databasePath)},
          supervisorPath: ${JSON.stringify(supervisorPath)},
          textGenerator: generator,
          workspaceRoot: ${JSON.stringify(root)},
        });
        await harness.chat(${JSON.stringify(envelope)});
      `,
    );
    const crashed = Bun.spawn([process.execPath, scriptPath], {
      stderr: "pipe",
      stdout: "pipe",
    });
    for (let attempt = 0; attempt < 150 && !existsSync(markerPath); attempt += 1)
      await Bun.sleep(20);
    if (!existsSync(markerPath)) {
      crashed.kill("SIGKILL");
      const [stderr, stdout] = await Promise.all([
        new Response(crashed.stderr).text(),
        new Response(crashed.stdout).text(),
      ]);
      throw new Error(`PARENT_CRASH_FIXTURE_FAILED:${stdout}:${stderr}`);
    }
    crashed.kill("SIGKILL");
    await crashed.exited;

    let recoveryGenerations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:parent-resume-recovery",
      stream: async function* () {
        recoveryGenerations += 1;
        yield "MUST_NOT_RUN";
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
    const recovered = createCuriosityHarness(config);
    await expect(recovered.chat(envelope)).rejects.toMatchObject({
      message: "PROVIDER_DELIVERY_UNKNOWN",
    });
    expect(recoveryGenerations).toBe(0);
    Bun.gc(true);
    await Bun.sleep(25);
    await recovered.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls",
        )
        .get()?.count,
    ).toBe(3);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls WHERE purpose = 'normal' AND status = 'delivery-unknown'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'delegation.results-delivered'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'turn.completed'",
        )
        .get()?.count,
    ).toBe(0);
    database.close();

    const replayed = createCuriosityHarness(config);
    await expect(replayed.chat(envelope)).rejects.toMatchObject({
      message: "PROVIDER_DELIVERY_UNKNOWN",
    });
    expect(recoveryGenerations).toBe(0);
    await replayed.dispose();
  });

  test("denies a child capability widening before child dispatch", async () => {
    const { databasePath, root } = fixture();
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-denied",
      stream: async function* () {
        generations += 1;
        yield {
          input: delegateInput({
            requested: {
              capabilities: ["provider.generate", "network.search"],
              maximumProviderCalls: 1,
              maximumToolCalls: 0,
              tools: [],
            },
          }),
          toolCallId: "delegate-call-denied",
          toolName: "agent.delegate",
          type: "tool-call",
        } as never;
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
    await expect(harness.chat(turn())).rejects.toMatchObject({
      message: "CHILD_CAPABILITY_DENIED",
    });
    expect(generations).toBe(1);
    await harness.dispose();
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
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'delegation.denied' AND json_extract(body_json, '$.errorCode') = 'CHILD_CAPABILITY_DENIED'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
  });

  test("denies unknown agents, mutation, context, and provider or tool budget widening before dispatch", async () => {
    const variants: readonly {
      readonly code: string;
      readonly input: ReturnType<typeof delegateInput>;
      readonly name: string;
    }[] = [
      {
        code: "CHILD_AGENT_UNKNOWN",
        input: delegateInput({ agentId: "unknown-child" }),
        name: "unknown-agent",
      },
      {
        code: "CHILD_MUTATION_UNAVAILABLE",
        input: delegateInput({
          ownership: { readOnly: false, resources: ["workspace:file"] },
        }),
        name: "mutation",
      },
      {
        code: "CHILD_CONTEXT_REFS_UNAVAILABLE",
        input: delegateInput({
          task: { ...delegateInput().task, contextRefs: ["event:context"] },
        }),
        name: "context",
      },
      {
        code: "CHILD_BUDGET_UNAVAILABLE",
        input: delegateInput({
          requested: {
            ...delegateInput().requested,
            maximumProviderCalls: 2,
          },
        }),
        name: "provider-budget",
      },
      {
        code: "CHILD_BUDGET_UNAVAILABLE",
        input: delegateInput({
          requested: {
            ...delegateInput().requested,
            maximumToolCalls: 1,
            tools: ["ledger_fact_record"],
          },
        }),
        name: "tool-budget",
      },
    ];
    for (const variant of variants) {
      const { databasePath, root } = fixture();
      let generations = 0;
      const generator: TextGenerator = {
        effort: "medium",
        modelId: `test:child-denial-${variant.name}`,
        stream: async function* () {
          generations += 1;
          yield {
            input: variant.input,
            toolCallId: `delegate-denial-${variant.name}`,
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
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
      await expect(
        harness.chat(turn("generalist", `denial-${variant.name}`)),
      ).rejects.toMatchObject({ message: variant.code });
      expect(generations).toBe(1);
      await harness.dispose();
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
      expect(
        database
          .query<{ count: number }, []>(
            "SELECT count(*) AS count FROM provider_calls",
          )
          .get()?.count,
      ).toBe(1);
      database.close();
    }
  });

  test("denies a third child under the default profile before any child allocation or dispatch", async () => {
    const { databasePath, root } = fixture();
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-count-denied",
      stream: async function* () {
        generations += 1;
        for (const child of ["one", "two", "three"])
          yield {
            input: delegateInput(),
            toolCallId: `delegate-count-${child}`,
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
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
    await expect(
      harness.chat(turn("generalist", "child-count-denied")),
    ).rejects.toMatchObject({ message: "CHILD_COUNT_EXCEEDED" });
    expect(generations).toBe(1);
    await harness.dispose();
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
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
  });

  test("denies nested delegation at the depth-one child provider sink", async () => {
    const { databasePath, root } = fixture();
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-depth-denied",
      stream: async function* (request) {
        generations += 1;
        if (generations === 1) {
          yield {
            input: delegateInput(),
            toolCallId: "delegate-depth-parent",
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
          return;
        }
        if (generations === 2) {
          expect(
            request.tools?.some(({ name }) => name === "agent.delegate"),
          ).toBe(false);
          yield {
            input: delegateInput({ agentId: "analyst" }),
            toolCallId: "delegate-depth-child",
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
          return;
        }
        expect(request.messages.at(-1)?.content).toContain(
          "TEXT_GENERATION_FAILED",
        );
        yield "Nested delegation was denied without a descendant call.";
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
    expect(
      await harness.chat(turn("generalist", "depth-denied")),
    ).toMatchObject({
      text: "Nested delegation was denied without a descendant call.",
    });
    expect(generations).toBe(3);
    await harness.dispose();
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
    ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls WHERE purpose = 'child'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM execution_ancestry WHERE depth > 1",
        )
        .get()?.count,
    ).toBe(0);
    database.close();
  });

  test("continues the exact child session revision with preserved history", async () => {
    const { databasePath, root } = fixture();
    let generations = 0;
    let agentSessionId = "";
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-continuation",
      stream: async function* (request) {
        generations += 1;
        if (generations === 1) {
          yield {
            input: delegateInput(),
            toolCallId: "delegate-initial",
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
          return;
        }
        if (generations === 2) {
          yield "Initial child result.";
          return;
        }
        if (generations === 3) {
          const evidence = request.messages.at(-1)?.content ?? "";
          agentSessionId =
            evidence.match(/"agentSessionId":"([^"]+)"/u)?.[1] ?? "";
          expect(agentSessionId).toStartWith("agent-session:");
          const continued = delegateInput();
          yield {
            input: {
              ...continued,
              continuation: { agentSessionId, expectedRevision: 1 },
              task: {
                ...continued.task,
                objective: "Refine the exact prior child result.",
              },
            },
            toolCallId: "delegate-continuation",
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
          return;
        }
        if (generations === 4) {
          expect(request.messages.map(({ role }) => role)).toEqual([
            "system",
            "system",
            "user",
            "assistant",
            "user",
          ]);
          expect(request.messages[1]?.content).toContain(
            "CURIOSITY_CAPABILITY_UNAVAILABLE:semantic.command",
          );
          expect(request.messages[2]?.content).toContain(
            "Review the bounded task independently.",
          );
          expect(request.messages[3]?.content).toBe("Initial child result.");
          expect(request.messages[4]?.content).toContain(
            "Refine the exact prior child result.",
          );
          yield "Refined child result.";
          return;
        }
        expect(request.messages.at(-1)?.content).toContain(
          "Refined child result.",
        );
        yield "Parent consumed the refined result once.";
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
    expect(await harness.chat(turn())).toMatchObject({
      text: "Parent consumed the refined result once.",
    });
    expect(generations).toBe(5);
    await harness.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<
          { agent_session_id: string; revision: number; status: string },
          []
        >(
          "SELECT agent_session_id,revision,status FROM agent_sessions",
        )
        .get(),
    ).toEqual({
      agent_session_id: agentSessionId,
      revision: 2,
      status: "idle",
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM agent_runs WHERE status = 'completed'",
        )
        .get()?.count,
    ).toBe(2);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls WHERE purpose = 'child'",
        )
        .get()?.count,
    ).toBe(2);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM agent_session_messages",
        )
        .get()?.count,
    ).toBe(4);
    database.close();

    const reopened = createCuriosityHarness(config);
    expect(await reopened.chat(turn())).toMatchObject({
      text: "Parent consumed the refined result once.",
    });
    expect(generations).toBe(5);
    await reopened.dispose();
  });

  test("rejects a stale continuation revision before another child call", async () => {
    const { databasePath, root } = fixture();
    let generations = 0;
    let agentSessionId = "";
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-stale-continuation",
      stream: async function* (request) {
        generations += 1;
        if (generations === 1) {
          yield {
            input: delegateInput(),
            toolCallId: "delegate-stale-initial",
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
          return;
        }
        if (generations === 2) {
          yield "Initial child result.";
          return;
        }
        const evidence = request.messages.at(-1)?.content ?? "";
        agentSessionId =
          evidence.match(/"agentSessionId":"([^"]+)"/u)?.[1] ?? "";
        yield {
          input: {
            ...delegateInput(),
            continuation: { agentSessionId, expectedRevision: 0 },
          },
          toolCallId: "delegate-stale-second",
          toolName: "agent.delegate",
          type: "tool-call",
        } as never;
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
    await expect(harness.chat(turn())).rejects.toMatchObject({
      message: "CHILD_SESSION_REVISION_CONFLICT",
    });
    expect(generations).toBe(3);
    await harness.dispose();
    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls WHERE purpose = 'child'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'delegation.denied' AND json_extract(body_json, '$.errorCode') = 'CHILD_SESSION_REVISION_CONFLICT'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
  });

  test("rejects continuation agent and authority changes before dispatch", async () => {
    for (const variant of ["agent", "authority"] as const) {
      const { databasePath, root } = fixture();
      let generations = 0;
      const generator: TextGenerator = {
        effort: "medium",
        modelId: `test:child-${variant}-conflict`,
        stream: async function* (request) {
          generations += 1;
          if (generations === 1) {
            yield {
              input: delegateInput(),
              toolCallId: `delegate-${variant}-initial`,
              toolName: "agent.delegate",
              type: "tool-call",
            } as never;
            return;
          }
          if (generations === 2) {
            yield "Initial child result.";
            return;
          }
          const evidence = request.messages.at(-1)?.content ?? "";
          const agentSessionId =
            evidence.match(/"agentSessionId":"([^"]+)"/u)?.[1] ?? "";
          const base = delegateInput();
          yield {
            input: {
              ...base,
              ...(variant === "agent" ? { agentId: "analyst" } : {}),
              continuation: { agentSessionId, expectedRevision: 1 },
              ...(variant === "authority"
                ? {
                    requested: {
                      ...base.requested,
                      capabilities: [
                        "provider.generate",
                        "semantic.command",
                      ],
                    },
                  }
                : {}),
            },
            toolCallId: `delegate-${variant}-second`,
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
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
      await expect(
        harness.chat(turn("generalist", `generalist-${variant}`)),
      ).rejects.toMatchObject({
        message:
          variant === "agent"
            ? "CHILD_SESSION_AGENT_CONFLICT"
            : "CHILD_SESSION_AUTHORITY_CONFLICT",
      });
      expect(generations).toBe(3);
      await harness.dispose();
      const database = new Database(databasePath, {
        readonly: true,
        strict: true,
      });
      expect(
        database
          .query<{ count: number }, []>(
            "SELECT count(*) AS count FROM provider_calls WHERE purpose = 'child'",
          )
          .get()?.count,
      ).toBe(1);
      database.close();
    }
  });

  test("rejects continuation from changed parent lineage", async () => {
    const { databasePath, root } = fixture();
    let generations = 0;
    let agentSessionId = "";
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-lineage-conflict",
      stream: async function* (request) {
        generations += 1;
        if (generations === 1) {
          yield {
            input: delegateInput(),
            toolCallId: "delegate-lineage-initial",
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
          return;
        }
        if (generations === 2) {
          yield "Initial child result.";
          return;
        }
        if (generations === 3) {
          agentSessionId =
            (request.messages.at(-1)?.content ?? "").match(
              /"agentSessionId":"([^"]+)"/u,
            )?.[1] ?? "";
          yield "First parent turn complete.";
          return;
        }
        yield {
          input: {
            ...delegateInput(),
            continuation: { agentSessionId, expectedRevision: 1 },
          },
          toolCallId: "delegate-lineage-other-parent",
          toolName: "agent.delegate",
          type: "tool-call",
        } as never;
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
    expect(
      await harness.chat(turn("generalist", "lineage-origin")),
    ).toMatchObject({ text: "First parent turn complete." });
    await expect(
      harness.chat(turn("generalist", "lineage-other")),
    ).rejects.toMatchObject({ message: "CHILD_SESSION_LINEAGE_CONFLICT" });
    expect(generations).toBe(4);
    await harness.dispose();
  });

  test("queues a delegation group without exceeding the configured child concurrency ceiling", async () => {
    const { databasePath, root } = fixture();
    let generations = 0;
    let activeChildren = 0;
    let peakChildren = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-policy-ceiling",
      stream: async function* (request) {
        generations += 1;
        if (generations === 1) {
          for (const child of ["A", "B"])
            yield {
              input: delegateInput({
                description: `Policy child ${child}`,
                ownership: {
                  readOnly: true,
                  resources: [`workspace:${child.toLowerCase()}`],
                },
              }),
              toolCallId: `delegate-policy-${child.toLowerCase()}`,
              toolName: "agent.delegate",
              type: "tool-call",
            } as never;
          return;
        }
        if (request.tools?.length === 0) {
          activeChildren += 1;
          peakChildren = Math.max(peakChildren, activeChildren);
          await Bun.sleep(10);
          activeChildren -= 1;
          yield "Queued child complete.";
          return;
        }
        yield "Queued parent complete.";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      rolePolicy: {
        defaultPrimaryRole: "generalist",
        enabledPrimaryRoles: ["generalist"],
        enabledSubagentRoles: ["reviewer"],
        maximumChildrenPerTurn: 2,
        maximumConcurrentChildren: 1,
        maximumDelegationDepth: 1,
        schemaVersion: 1,
      },
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: root,
    });
    expect(
      await harness.chat(turn("generalist", "policy-ceiling")),
    ).toMatchObject({ text: "Queued parent complete." });
    expect(generations).toBe(4);
    expect(peakChildren).toBe(1);
    expect(
      await harness.projections.children("turn-child-policy-ceiling"),
    ).toHaveLength(2);
    expect(
      await harness.projections.childAccounting("turn-child-policy-ceiling"),
    ).toMatchObject({ totals: { childCalls: 2, providerCalls: 4 } });
    await harness.dispose();
  });

  test("allows only one concurrent resume of a child session", async () => {
    const { databasePath, root } = fixture();
    let generations = 0;
    let agentSessionId = "";
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-busy",
      stream: async function* (request) {
        generations += 1;
        if (generations === 1) {
          yield {
            input: delegateInput(),
            toolCallId: "delegate-busy-initial",
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
          return;
        }
        if (generations === 2) {
          yield "Initial child result.";
          return;
        }
        if (generations === 3) {
          agentSessionId =
            (request.messages.at(-1)?.content ?? "").match(
              /"agentSessionId":"([^"]+)"/u,
            )?.[1] ?? "";
          for (const toolCallId of ["resume-one", "resume-two"])
            yield {
              input: {
                ...delegateInput(),
                continuation: { agentSessionId, expectedRevision: 1 },
              },
              toolCallId,
              toolName: "agent.delegate",
              type: "tool-call",
            } as never;
          return;
        }
        yield "Only one resumed child ran.";
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
    await expect(
      harness.chat(turn("generalist", "busy")),
    ).rejects.toMatchObject({ message: "CHILD_SESSION_BUSY" });
    expect(generations).toBe(4);
    await harness.dispose();
    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls WHERE purpose = 'child'",
        )
        .get()?.count,
    ).toBe(2);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'delegation.denied' AND json_extract(body_json, '$.errorCode') = 'CHILD_SESSION_BUSY'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
  });

  test("denies direct subagent selection at chat admission", async () => {
    const { databasePath, root } = fixture();
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:role-denied",
      stream: async function* (request) {
        generations += 1;
        expect(request.tools?.some(({ name }) => name === "agent.delegate")).toBe(
          false,
        );
        yield {
          input: delegateInput(),
          toolCallId: "delegate-call-role-denied",
          toolName: "agent.delegate",
          type: "tool-call",
        } as never;
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
    await expect(harness.chat(turn("reviewer"))).rejects.toMatchObject({
      message: "CHAT_AGENT_UNKNOWN",
    });
    expect(generations).toBe(0);
    await harness.dispose();
  });
});
