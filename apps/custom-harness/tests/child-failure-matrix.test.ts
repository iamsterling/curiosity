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
const rolePolicy = {
  defaultPrimaryRole: "generalist" as const,
  enabledPrimaryRoles: ["generalist", "orchestrator"] as const,
  enabledSubagentRoles: [
    "analyst",
    "implementer",
    "researcher",
    "reviewer",
    "strategist",
    "worker",
  ] as const,
  maximumChildrenPerTurn: 4 as const,
  maximumConcurrentChildren: 2 as const,
  maximumDelegationDepth: 1 as const,
  schemaVersion: 1 as const,
};

const delegateInput = (kind: string) => ({
  agentId: "reviewer",
  description: `${kind} all-settled child`,
  ownership: { readOnly: true, resources: [`workspace:${kind}`] },
  requested: {
    capabilities: ["provider.generate"],
    maximumProviderCalls: 1,
    maximumToolCalls: 0,
    tools: [],
  },
  schemaVersion: 1,
  task: {
    acceptanceChecks: [`Return the ${kind} fixture result.`],
    contextRefs: [],
    deliverable: `${kind} fixture result`,
    nonGoals: ["Do not mutate files."],
    objective: `Run ${kind} all-settled child.`,
  },
});

const turn = signCommand(
  {
    actorId,
    command: {
      id: "command-child-four-state",
      kind: "chat.turn",
      payload: {
        agentId: "generalist",
        assistantMessageId: "assistant-child-four-state",
        text: "Run the four-state all-settled child fixture.",
        threadId: "thread-child-four-state",
        turnId: "turn-child-four-state",
        userMessageId: "user-child-four-state",
      },
      schemaVersion: 1,
    },
    issuedAt: new Date().toISOString(),
    nonce: "nonce-child-four-state",
    schemaVersion: 1,
  },
  secret,
);

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("child all-settled failure matrix", () => {
  test("retains success, failure, cancellation, and delivery uncertainty in one ordered result", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-child-matrix-"));
    roots.push(root);
    const databasePath = path.join(root, "events.sqlite");
    const markerPath = path.join(root, "three-terminal-one-dispatched");
    const scriptPath = path.join(root, "crash-four-state.ts");
    const indexPath = path.resolve(import.meta.dir, "../src/index.ts");
    writeFileSync(
      scriptPath,
      `
        import { Database } from "bun:sqlite";
        import { createCuriosityHarness, signCommand } from ${JSON.stringify(indexPath)};
        const actorId = ${JSON.stringify(actorId)};
        const secret = ${JSON.stringify(secret)};
        const databasePath = ${JSON.stringify(databasePath)};
        const rolePolicy = ${JSON.stringify(rolePolicy)};
        let parentCall = true;
        const generator = {
          effort: "medium",
          modelId: "test:child-four-state-crash",
          stream: async function* (request) {
            if (parentCall) {
              parentCall = false;
              for (const kind of ["success", "failure", "cancel", "unknown"])
                yield {
                  input: (${delegateInput.toString()})(kind),
                  toolCallId: "delegate-four-state-" + kind,
                  toolName: "agent.delegate",
                  type: "tool-call",
                };
              return;
            }
            const message = request.messages.at(-1)?.content ?? "";
            if (message.includes("Run success all-settled child.")) {
              yield "Durable success sibling evidence.";
              return;
            }
            if (message.includes("Run failure all-settled child."))
              throw new Error("CONTROLLED_CHILD_FAILURE");
            await new Promise((resolve, reject) => {
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
          rolePolicy,
          supervisorPath: ${JSON.stringify(supervisorPath)},
          textGenerator: generator,
          workspaceRoot: ${JSON.stringify(root)},
        });
        const chat = harness.chat(${JSON.stringify(turn)});
        const control = async () => {
          let database;
          let cancellationSent = false;
          for (let attempt = 0; attempt < 500; attempt += 1) {
            database ??= (() => {
              try {
                const candidate = new Database(databasePath, { strict: true });
                candidate.query("SELECT count(*) AS count FROM agent_runs").get();
                return candidate;
              } catch {
                return undefined;
              }
            })();
            if (!database) {
              await Bun.sleep(10);
              continue;
            }
            const cancel = database.query(
              "SELECT child_execution_id FROM agent_runs WHERE json_extract(task_json, '$.task.objective') = 'Run cancel all-settled child.'",
            ).get()?.child_execution_id;
            const allocatedCalls = database.query(
              "SELECT count(*) AS count FROM provider_calls WHERE purpose = 'child'",
            ).get()?.count ?? 0;
            if (cancel && allocatedCalls === 4 && !cancellationSent) {
              cancellationSent = true;
              await harness.submit(signCommand({
                actorId,
                command: {
                  id: "command-cancel-four-state",
                  kind: "execution.cancel",
                  payload: { executionId: cancel, schemaVersion: 1 },
                  schemaVersion: 1,
                },
                issuedAt: new Date().toISOString(),
                nonce: "nonce-cancel-four-state",
                schemaVersion: 1,
              }, secret));
            }
            const terminals = database.query(
              "SELECT count(*) AS count FROM agent_runs JOIN actions ON actions.action_id = agent_runs.provider_action_id WHERE actions.status IN ('succeeded','failed') AND json_extract(agent_runs.task_json, '$.task.objective') != 'Run unknown all-settled child.'",
            ).get()?.count ?? 0;
            const dispatchedUnknown = database.query(
              "SELECT count(*) AS count FROM agent_runs JOIN provider_calls ON provider_calls.action_id = agent_runs.provider_action_id WHERE json_extract(agent_runs.task_json, '$.task.objective') = 'Run unknown all-settled child.' AND provider_calls.dispatch_state = 'dispatched'",
            ).get()?.count ?? 0;
            if (terminals === 3 && dispatchedUnknown === 1) {
              database.close();
              await Bun.write(${JSON.stringify(markerPath)}, "ready");
              return;
            }
            await Bun.sleep(10);
          }
          database?.close();
          throw new Error("FOUR_STATE_FIXTURE_TIMEOUT");
        };
        await Promise.all([chat, control()]);
      `,
    );
    const crashed = Bun.spawn([process.execPath, scriptPath], {
      stderr: "pipe",
      stdout: "pipe",
    });
    for (let attempt = 0; attempt < 250 && !existsSync(markerPath); attempt += 1)
      await Bun.sleep(20);
    if (!existsSync(markerPath)) {
      crashed.kill("SIGKILL");
      const [stderr, stdout] = await Promise.all([
        new Response(crashed.stderr).text(),
        new Response(crashed.stdout).text(),
      ]);
      const diagnostic = new Database(databasePath, { readonly: true, strict: true });
      const actions = diagnostic
        .query<
          { action_type: string; error_code: string | null; status: string },
          []
        >(
          "SELECT action_type,status,error_code FROM actions ORDER BY created_at,action_id",
        )
        .all();
      const events = diagnostic
        .query<{ body_json: string; event_type: string }, []>(
          "SELECT event_type,body_json FROM events ORDER BY global_sequence",
        )
        .all();
      diagnostic.close();
      throw new Error(
        `FOUR_STATE_FIXTURE_FAILED:${stdout}:${stderr}:${JSON.stringify({ actions, events })}`,
      );
    }
    crashed.kill("SIGKILL");
    await crashed.exited;

    const requests: TextGenerationRequest[] = [];
    const recoveryGenerator: TextGenerator = {
      effort: "medium",
      modelId: "test:child-four-state-recovery",
      stream: async function* (request) {
        requests.push(request);
        const evidence = request.messages.at(-1)?.content ?? "";
        for (const state of [
          '"status":"completed"',
          '"status":"failed"',
          '"status":"cancelled"',
          '"status":"delivery-unknown"',
        ])
          expect(evidence).toContain(state);
        expect(evidence).toContain("Durable success sibling evidence.");
        expect(evidence).toContain("PROVIDER_DELIVERY_UNKNOWN");
        yield "Parent retained all four sibling states.";
      },
    };
    const config = {
      actorId,
      authenticationSecret: secret,
      databasePath,
      rolePolicy,
      supervisorPath,
      textGenerator: recoveryGenerator,
      workspaceRoot: root,
    };
    const recovered = createCuriosityHarness(config);
    expect(await recovered.chat(turn)).toMatchObject({
      text: "Parent retained all four sibling states.",
    });
    expect(requests).toHaveLength(1);
    expect(
      (await recovered.projections.children("turn-child-four-state")).map(
        ({ status }) => status,
      ),
    ).toEqual(["completed", "failed", "cancelled", "delivery-unknown"]);
    await recovered.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
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
          "SELECT count(*) AS count FROM provider_calls WHERE purpose = 'child'",
        )
        .get()?.count,
    ).toBe(4);
    database.close();

    const replayed = createCuriosityHarness(config);
    expect(await replayed.chat(turn)).toMatchObject({
      text: "Parent retained all four sibling states.",
    });
    expect(requests).toHaveLength(1);
    await replayed.dispose();
  }, 20_000);
});
