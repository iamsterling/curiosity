import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
const fixedTime = Date.parse("2026-08-27T12:00:00.000Z");
const fixture = (suffix: string) => {
  const root = mkdtempSync(
    path.join(tmpdir(), `curiosity-child-boundary-${suffix}-`),
  );
  roots.push(root);
  return { databasePath: path.join(root, "events.sqlite"), root };
};
const turn = (suffix: string) =>
  signCommand(
    {
      actorId,
      command: {
        id: `boundary-command-${suffix}`,
        kind: "chat.turn",
        payload: {
          assistantMessageId: `boundary-assistant-${suffix}`,
          text: `Run restart boundary ${suffix}.`,
          threadId: `boundary-thread-${suffix}`,
          turnId: `boundary-turn-${suffix}`,
          userMessageId: `boundary-user-${suffix}`,
        },
        schemaVersion: 1,
      },
      issuedAt: new Date(fixedTime).toISOString(),
      nonce: `boundary-nonce-${suffix}`,
      schemaVersion: 1,
    },
    secret,
  );
const delegate = (suffix: string) => ({
  agentId: "reviewer",
  description: `Restart boundary ${suffix}`,
  ownership: { readOnly: true, resources: [`workspace:${suffix}`] },
  requested: {
    capabilities: ["provider.generate"],
    maximumProviderCalls: 1,
    maximumToolCalls: 0,
    tools: [],
  },
  schemaVersion: 1,
  task: {
    acceptanceChecks: ["Return one durable result."],
    contextRefs: [],
    deliverable: "Durable child result",
    nonGoals: ["Do not mutate."],
    objective: `Return restart result ${suffix}.`,
  },
});
const initialize = async (databasePath: string, root: string) => {
  const initialized = createCuriosityHarness({
    actorId,
    authenticationSecret: secret,
    clock: () => fixedTime,
    databasePath,
    supervisorPath,
    workspaceRoot: root,
  });
  await initialized.status();
  await initialized.dispose();
};
const firstGenerator = (suffix: string): TextGenerator => {
  let generation = 0;
  return {
    effort: "medium",
    modelId: `test:restart-boundary-${suffix}`,
    stream: async function* () {
      generation += 1;
      if (generation === 1) {
        yield {
          input: delegate(suffix),
          toolCallId: `boundary-child-${suffix}`,
          toolName: "agent.delegate",
          type: "tool-call",
        } as never;
        return;
      }
      if (generation === 2) {
        yield `Durable child result ${suffix}.`;
        return;
      }
      yield "MUST_NOT_REACH_PARENT_BEFORE_RESTART";
    },
  };
};

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("child restart transactional boundaries", () => {
  test("survives SIGKILL at allocation, dispatch, receipt, terminal, group-ready, and result-delivery boundaries", async () => {
    const boundaries = [
      { eventType: "child.allocated", name: "allocation", recoveryCalls: 2 },
      { eventType: "child.run-started", name: "dispatch", recoveryCalls: 2 },
      { eventType: "child-provider-receipt", name: "receipt", recoveryCalls: 1 },
      { eventType: "child.completed", name: "terminal", recoveryCalls: 1 },
      { eventType: "delegation.group-ready", name: "group-ready", recoveryCalls: 1 },
      {
        eventType: "delegation.results-delivered",
        name: "result-delivery",
        recoveryCalls: 1,
      },
    ] as const;
    const indexPath = path.resolve(import.meta.dir, "../src/index.ts");
    for (const boundary of boundaries) {
      const { databasePath, root } = fixture(`process-${boundary.name}`);
      await initialize(databasePath, root);
      const envelope = turn(`process-${boundary.name}`);
      const markerPath = path.join(root, "boundary-interrupted");
      const scriptPath = path.join(root, "boundary-process.ts");
      const boundaryQuery =
        boundary.eventType === "child-provider-receipt"
          ? "SELECT 1 AS found FROM events WHERE event_type = 'action.succeeded' AND json_extract(body_json, '$.correlation.kind') = 'curiosity.child.run' LIMIT 1"
          : `SELECT 1 AS found FROM events WHERE event_type = ${JSON.stringify(
              boundary.eventType,
            )} LIMIT 1`;
      writeFileSync(
        scriptPath,
        `
          import { Database } from "bun:sqlite";
          import { existsSync, writeFileSync } from "node:fs";
          import { createCuriosityHarness } from ${JSON.stringify(indexPath)};
          const originalTransaction = Database.prototype.transaction;
          Database.prototype.transaction = function (callback) {
            const database = this;
            return originalTransaction.call(database, (...arguments_) => {
              const result = callback(...arguments_);
              if (
                !existsSync(${JSON.stringify(markerPath)}) &&
                database.query(${JSON.stringify(boundaryQuery)}).get()
              ) {
                writeFileSync(
                  ${JSON.stringify(markerPath)},
                  ${JSON.stringify(boundary.name)},
                  { flag: "wx" },
                );
                Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
              }
              return result;
            });
          };
          let generation = 0;
          const harness = createCuriosityHarness({
            actorId: ${JSON.stringify(actorId)},
            authenticationSecret: ${JSON.stringify(secret)},
            clock: () => ${fixedTime},
            databasePath: ${JSON.stringify(databasePath)},
            supervisorPath: ${JSON.stringify(supervisorPath)},
            textGenerator: {
              effort: "medium",
              modelId: ${JSON.stringify(`test:process-${boundary.name}`)},
              stream: async function* () {
                generation += 1;
                if (generation === 1) {
                  yield {
                    input: ${JSON.stringify(delegate(`process-${boundary.name}`))},
                    toolCallId: ${JSON.stringify(`process-child-${boundary.name}`)},
                    toolName: "agent.delegate",
                    type: "tool-call",
                  };
                  return;
                }
                if (generation === 2) {
                  yield ${JSON.stringify(`Process boundary child ${boundary.name}.`)};
                  return;
                }
                yield "MUST_NOT_COMPLETE_BEFORE_PROCESS_DEATH";
              },
            },
            workspaceRoot: ${JSON.stringify(root)},
          });
          await harness.chat(${JSON.stringify(envelope)});
        `,
      );
      const crashed = Bun.spawn([process.execPath, scriptPath], {
        stderr: "pipe",
        stdout: "pipe",
      });
      for (
        let attempt = 0;
        attempt < 1_000 && !existsSync(markerPath);
        attempt += 1
      )
        await Bun.sleep(10);
      if (!existsSync(markerPath)) {
        crashed.kill("SIGKILL");
        const [stderr, stdout] = await Promise.all([
          new Response(crashed.stderr).text(),
          new Response(crashed.stdout).text(),
        ]);
        const diagnostic = new Database(databasePath, {
          readonly: true,
          strict: true,
        });
        const state = {
          actions: diagnostic
            .query(
              "SELECT action_type,status,error_code FROM actions ORDER BY created_at,action_id",
            )
            .all(),
          events: diagnostic
            .query(
              "SELECT event_type,body_json FROM events ORDER BY global_sequence",
            )
            .all(),
        };
        diagnostic.close();
        throw new Error(
          `PROCESS_BOUNDARY_FIXTURE_FAILED:${boundary.name}:${stdout}:${stderr}:${JSON.stringify(state)}`,
        );
      }
      expect(await Bun.file(markerPath).text()).toBe(boundary.name);
      crashed.kill("SIGKILL");
      expect(await crashed.exited).not.toBe(0);

      const rolledBack = new Database(databasePath, {
        readonly: true,
        strict: true,
      });
      expect(rolledBack.query(boundaryQuery).get()).toBeNull();
      rolledBack.close();

      let recoveryCalls = 0;
      const recovery = createCuriosityHarness({
        actorId,
        authenticationSecret: secret,
        clock: () => fixedTime,
        databasePath,
        supervisorPath,
        textGenerator: {
          effort: "medium",
          modelId: `test:process-recovery-${boundary.name}`,
          stream: async function* (request) {
            recoveryCalls += 1;
            const evidence = request.messages.at(-1)?.content ?? "";
            if (evidence.includes(`Return restart result process-${boundary.name}.`)) {
              yield `Recovered child ${boundary.name}.`;
              return;
            }
            expect(evidence).toMatch(
              /Recovered child|Process boundary child|PROVIDER_DELIVERY_UNKNOWN/u,
            );
            yield `Recovered parent ${boundary.name}.`;
          },
        },
        workspaceRoot: root,
      });
      expect(await recovery.chat(envelope)).toMatchObject({
        text: `Recovered parent ${boundary.name}.`,
      });
      expect(recoveryCalls).toBe(boundary.recoveryCalls);
      await recovery.dispose();

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
      ).toBe(1);
      database.close();
    }
  }, 30_000);

  test("recovers a committed provider receipt after terminal and group-ready interruption", async () => {
    const suffix = "terminal";
    const { databasePath, root } = fixture(suffix);
    await initialize(databasePath, root);
    const boundaryDatabase = new Database(databasePath, { strict: true });
    boundaryDatabase.exec(`
      CREATE TRIGGER restart_boundary_failure
      BEFORE INSERT ON events
      WHEN NEW.event_type = 'child.completed'
      BEGIN
        SELECT RAISE(ABORT, 'RESTART_BOUNDARY_INTERRUPTED');
      END;
    `);
    boundaryDatabase.close();
    const envelope = turn(suffix);
    const interrupted = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      clock: () => fixedTime,
      databasePath,
      supervisorPath,
      textGenerator: firstGenerator(suffix),
      workspaceRoot: root,
    });
    await expect(interrupted.chat(envelope)).rejects.toBeDefined();
    await interrupted.dispose();

    const boundary = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      boundary
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM provider_calls WHERE purpose = 'child' AND status = 'succeeded'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      boundary
        .query<{ status: string }, []>("SELECT status FROM agent_runs")
        .get()?.status,
    ).toBe("allocated");
    expect(
      boundary
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type IN ('child.completed','delegation.group-ready')",
        )
        .get()?.count,
    ).toBe(0);
    boundary.close();
    const recoveredDatabase = new Database(databasePath, { strict: true });
    recoveredDatabase.exec("DROP TRIGGER restart_boundary_failure");
    recoveredDatabase.close();

    let recoveryCalls = 0;
    const recovery = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      clock: () => fixedTime,
      databasePath,
      supervisorPath,
      textGenerator: {
        effort: "medium",
        modelId: "test:restart-terminal-recovery",
        stream: async function* (request) {
          recoveryCalls += 1;
          expect(request.messages.at(-1)?.content).toContain(
            `Durable child result ${suffix}.`,
          );
          yield "Recovered after child terminal boundary.";
        },
      },
      workspaceRoot: root,
    });
    expect(await recovery.chat(envelope)).toMatchObject({
      text: "Recovered after child terminal boundary.",
    });
    expect(recoveryCalls).toBe(1);
    await recovery.dispose();
    const complete = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      complete
        .query<{ event_type: string }, []>(
          "SELECT event_type FROM events WHERE event_type IN ('child.completed','delegation.group-ready','delegation.results-delivered') ORDER BY global_sequence",
        )
        .all()
        .map(({ event_type }) => event_type),
    ).toEqual([
      "child.completed",
      "delegation.group-ready",
      "delegation.results-delivered",
    ]);
    complete.close();
  });

  test("recovers a ready group after result-delivery interruption with one parent continuation", async () => {
    const suffix = "delivery";
    const { databasePath, root } = fixture(suffix);
    await initialize(databasePath, root);
    const boundaryDatabase = new Database(databasePath, { strict: true });
    boundaryDatabase.exec(`
      CREATE TRIGGER restart_boundary_failure
      BEFORE INSERT ON events
      WHEN NEW.event_type = 'delegation.results-delivered'
      BEGIN
        SELECT RAISE(ABORT, 'RESTART_BOUNDARY_INTERRUPTED');
      END;
    `);
    boundaryDatabase.close();
    const envelope = turn(suffix);
    const interrupted = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      clock: () => fixedTime,
      databasePath,
      supervisorPath,
      textGenerator: firstGenerator(suffix),
      workspaceRoot: root,
    });
    await expect(interrupted.chat(envelope)).rejects.toBeDefined();
    await interrupted.dispose();

    const boundary = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      boundary
        .query<{ status: string }, []>("SELECT status FROM agent_runs")
        .get()?.status,
    ).toBe("completed");
    expect(
      boundary
        .query<{ status: string }, []>("SELECT status FROM delegation_groups")
        .get()?.status,
    ).toBe("ready");
    expect(
      boundary
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'delegation.results-delivered'",
        )
        .get()?.count,
    ).toBe(0);
    boundary.close();
    const recoveredDatabase = new Database(databasePath, { strict: true });
    recoveredDatabase.exec("DROP TRIGGER restart_boundary_failure");
    recoveredDatabase.close();

    let recoveryCalls = 0;
    const config = {
      actorId,
      authenticationSecret: secret,
      clock: () => fixedTime,
      databasePath,
      supervisorPath,
      textGenerator: {
        effort: "medium" as const,
        modelId: "test:restart-delivery-recovery",
        stream: async function* (request: Parameters<TextGenerator["stream"]>[0]) {
          recoveryCalls += 1;
          expect(request.messages.at(-1)?.content).toContain(
            `Durable child result ${suffix}.`,
          );
          yield "Recovered one parent continuation.";
        },
      },
      workspaceRoot: root,
    };
    const recovery = createCuriosityHarness(config);
    expect(await recovery.chat(envelope)).toMatchObject({
      text: "Recovered one parent continuation.",
    });
    expect(recoveryCalls).toBe(1);
    await recovery.dispose();
    const replay = createCuriosityHarness(config);
    expect(await replay.chat(envelope)).toMatchObject({
      text: "Recovered one parent continuation.",
    });
    expect(recoveryCalls).toBe(1);
    await replay.dispose();
  });
});
