import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createHash, randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type ProcessProfileConfig,
  type TextGenerator,
} from "../src/index.js";
import { SupervisorClient } from "../src/supervisor/client.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);

const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "curiosity-process-workspace-"));
  roots.push(root);
  return { databasePath: path.join(root, "events.sqlite"), root };
};

const sha256 = (file: string) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");

const profile = (
  id: string,
  executable: string,
  allowedArguments: readonly (readonly string[])[],
  overrides: Partial<ProcessProfileConfig> = {},
): ProcessProfileConfig => ({
  allowedArguments,
  allowedCwds: ["."],
  environment: { LANG: "C", LC_ALL: "C", NO_COLOR: "1" },
  executable,
  executableSha256: sha256(executable),
  id,
  maximumOutputBytes: 8_192,
  maximumTimeoutMs: 5_000,
  ...overrides,
});

const turn = (suffix: string) =>
  signCommand(
    {
      actorId,
      command: {
        id: `command-process-${suffix}`,
        kind: "chat.turn",
        payload: {
          assistantMessageId: `assistant-process-${suffix}`,
          text: "Run the exact configured check.",
          threadId: `thread-process-${suffix}`,
          turnId: `turn-process-${suffix}`,
          userMessageId: `user-process-${suffix}`,
        },
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: `nonce-process-${suffix}`,
      schemaVersion: 1,
    },
    secret,
  );

const cancel = (executionId: string, suffix: string) =>
  signCommand(
    {
      actorId,
      command: {
        id: `command-process-cancel-${suffix}`,
        kind: "execution.cancel",
        payload: { executionId, schemaVersion: 1 },
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: `nonce-process-cancel-${suffix}`,
      schemaVersion: 1,
    },
    secret,
  );

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("closed process execution profiles", () => {
  test("executes one exact argv through the governed tool path with a bounded receipt", async () => {
    const { databasePath, root } = fixture();
    const executable = "/usr/bin/printf";
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:process-success",
      stream: async function* (request) {
        generations += 1;
        expect(request.tools?.some(({ name }) => name === "process_run")).toBe(
          true,
        );
        if (generations === 1) {
          yield {
            input: {
              arguments: ["process-ok\\n"],
              cwd: ".",
              maxOutputBytes: 1_024,
              profileId: "printf-check",
              schemaVersion: 1,
              timeoutMs: 1_000,
            },
            toolCallId: "process-call-success",
            toolName: "process_run",
            type: "tool-call",
          } as never;
          return;
        }
        const evidence = request.messages.at(-1)?.content ?? "";
        expect(evidence).toContain('"termination":"exited"');
        expect(evidence).toContain("process-ok");
        expect(evidence).toContain(`"executableSha256":"${sha256(executable)}"`);
        yield "Exact process check completed.";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      processProfiles: [
        profile("printf-check", executable, [["process-ok\\n"]]),
      ],
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: root,
    });
    expect(await harness.chat(turn("success"))).toMatchObject({
      text: "Exact process check completed.",
    });
    expect(generations).toBe(2);
    expect(await harness.status()).toMatchObject({
      capabilities: expect.arrayContaining([
        expect.objectContaining({
          id: "process.execution",
          state: "available",
        }),
      ]),
      supervisor: { process: true },
    });
    await harness.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<
          { delivery_certainty: string; status: string; tool_name: string },
          []
        >(
          "SELECT tool_name,status,delivery_certainty FROM tool_calls WHERE tool_name = 'process_run'",
        )
        .get(),
    ).toEqual({
      delivery_certainty: "DELIVERED",
      status: "succeeded",
      tool_name: "process_run",
    });
    database.close();
  });

  test("denies argv, cwd, environment, and executable digest widening before spawn", async () => {
    const { root } = fixture();
    const executable = "/usr/bin/printf";
    const client = await SupervisorClient.start(supervisorPath, root, [
      profile("strict", executable, [["allowed"]]),
    ]);
    await expect(
      client.processRun("denied-arguments", {
        arguments: ["not-allowed"],
        cwd: ".",
        maxOutputBytes: 128,
        profileId: "strict",
        timeoutMs: 500,
      }),
    ).rejects.toThrow("PROCESS_ARGUMENTS_DENIED");
    await expect(
      client.processRun("denied-cwd", {
        arguments: ["allowed"],
        cwd: "..",
        maxOutputBytes: 128,
        profileId: "strict",
        timeoutMs: 500,
      }),
    ).rejects.toThrow("PROCESS_CWD_DENIED");
    await client.close();

    await expect(
      SupervisorClient.start(supervisorPath, root, [
        {
          ...profile("bad-environment", executable, [["allowed"]]),
          environment: { M5_GATEWAY_TOKEN: "must-not-cross" },
        },
      ]),
    ).rejects.toMatchObject({ message: "PROCESS_PROFILE_INVALID" });
    await expect(
      SupervisorClient.start(supervisorPath, root, [
        {
          ...profile("bad-digest", executable, [["allowed"]]),
          executableSha256: "0".repeat(64),
        },
      ]),
    ).rejects.toMatchObject({
      message: "PROCESS_EXECUTABLE_DIGEST_MISMATCH",
    });
    await expect(
      SupervisorClient.start(supervisorPath, root, [
        profile("git-denied", "/usr/bin/git", [["status"]]),
      ]),
    ).rejects.toMatchObject({ message: "SUPERVISOR_HANDSHAKE_FAILED" });
  });

  test("propagates an authenticated execution cancellation through the process tool and quarantines its late receipt", async () => {
    const { databasePath, root } = fixture();
    const executableRoot = mkdtempSync(
      path.join(tmpdir(), "curiosity-process-cancel-executable-"),
    );
    roots.push(executableRoot);
    const descendantPidPath = path.join(executableRoot, "descendant.pid");
    const fixtureExecutable = path.join(executableRoot, "process-cancel-fixture");
    writeFileSync(
      fixtureExecutable,
      [
        "#!/bin/sh",
        "trap '' TERM",
        "sleep 30 &",
        `echo $! > ${JSON.stringify(descendantPidPath)}`,
        "wait",
      ].join("\n"),
    );
    chmodSync(fixtureExecutable, 0o700);
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:process-cancel",
      stream: async function* () {
        generations += 1;
        yield {
          input: {
            arguments: [],
            cwd: ".",
            maxOutputBytes: 128,
            profileId: "cancel-process",
            schemaVersion: 1,
            timeoutMs: 5_000,
          },
          toolCallId: "process-call-cancel",
          toolName: "process_run",
          type: "tool-call",
        } as never;
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      processProfiles: [profile("cancel-process", fixtureExecutable, [[]])],
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: root,
    });
    const chat = harness.chat(turn("cancel"));
    for (let attempt = 0; attempt < 100 && !existsSync(descendantPidPath); attempt += 1)
      await Bun.sleep(10);
    expect(existsSync(descendantPidPath)).toBe(true);
    const descendantPid = Number(readFileSync(descendantPidPath, "utf8").trim());
    await harness.submit(cancel("turn-process-cancel", "active"));
    await expect(chat).rejects.toMatchObject({ message: "ACTION_CANCELLED" });
    expect(generations).toBe(1);
    await Bun.sleep(25);
    expect(() => process.kill(descendantPid, 0)).toThrow();
    await harness.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<
          { delivery_certainty: string; error_code: string; status: string },
          []
        >(
          "SELECT delivery_certainty,error_code,status FROM tool_calls WHERE tool_name = 'process_run'",
        )
        .get(),
    ).toEqual({
      delivery_certainty: "UNKNOWN",
      error_code: "ACTION_CANCELLED",
      status: "failed",
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM quarantined_receipts WHERE reason = 'STALE_OR_CANCELLED_GENERATION'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
  });

  test("bounds timeout and output and escalates cancellation across descendants", async () => {
    const { root } = fixture();
    const sleepExecutable = "/bin/sleep";
    const yesExecutable = "/usr/bin/yes";
    const executableRoot = mkdtempSync(
      path.join(tmpdir(), "curiosity-process-executable-"),
    );
    roots.push(executableRoot);
    const descendantPidPath = path.join(executableRoot, "descendant.pid");
    const fixtureExecutable = path.join(executableRoot, "process-fixture");
    writeFileSync(
      fixtureExecutable,
      [
        "#!/bin/sh",
        "trap '' TERM",
        "sleep 30 &",
        `echo $! > ${JSON.stringify(descendantPidPath)}`,
        "wait",
      ].join("\n"),
    );
    chmodSync(fixtureExecutable, 0o700);
    const client = await SupervisorClient.start(supervisorPath, root, [
      profile("sleep", sleepExecutable, [["5"]]),
      profile("output", yesExecutable, [[]]),
      profile("descendant", fixtureExecutable, [[]]),
    ]);
    await expect(
      client.processRun("timeout", {
        arguments: ["5"],
        cwd: ".",
        maxOutputBytes: 128,
        profileId: "sleep",
        timeoutMs: 50,
      }),
    ).resolves.toMatchObject({ termination: "timeout" });
    await expect(
      client.processRun("output", {
        arguments: [],
        cwd: ".",
        maxOutputBytes: 128,
        profileId: "output",
        timeoutMs: 1_000,
      }),
    ).resolves.toMatchObject({
      outputTruncated: true,
      termination: "output-limit",
    });

    const descendant = client.processRun("descendant", {
      arguments: [],
      cwd: ".",
      maxOutputBytes: 128,
      profileId: "descendant",
      timeoutMs: 5_000,
    });
    for (let attempt = 0; attempt < 100 && !existsSync(descendantPidPath); attempt += 1)
      await Bun.sleep(10);
    expect(existsSync(descendantPidPath)).toBe(true);
    const descendantPid = Number(readFileSync(descendantPidPath, "utf8").trim());
    client.cancelProcess("descendant");
    await expect(descendant).resolves.toMatchObject({
      signal: 9,
      termination: "cancelled",
    });
    await Bun.sleep(25);
    expect(() => process.kill(descendantPid, 0)).toThrow();
    await client.close();
  });
});
