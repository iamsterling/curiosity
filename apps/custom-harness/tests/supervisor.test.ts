import { describe, expect, test } from "bun:test";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { createCuriosityHarness, signCommand } from "../src/index.js";
import { SupervisorClient } from "../src/supervisor/client.js";

const executable = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);

describe("mandatory Rust supervisor", () => {
  test("completes a nonce-bound handshake with only confined reads enabled", async () => {
    const supervisor = await SupervisorClient.start(executable, import.meta.dir);

    expect(supervisor.receipt).toMatchObject({
      protocolVersion: 2,
      kind: "handshake.accepted",
      capabilities: {
        filesystemMutation: false,
        filesystemRead: true,
        git: false,
        process: false,
        sandbox: false,
      },
    });
    await supervisor.close();
  });

  test("denies command admission when the supervisor cannot start", async () => {
    const secret = randomBytes(32).toString("hex");
    const harness = createCuriosityHarness({
      actorId: "local-owner",
      authenticationSecret: secret,
      databasePath: ":memory:",
      supervisorPath: `${executable}.missing`,
      workspaceRoot: import.meta.dir,
    });
    const envelope = signCommand(
      {
        actorId: "local-owner",
        command: {
          id: "command-001",
          kind: "thread.open",
          payload: { threadId: "thread-001", title: "Denied" },
          schemaVersion: 1,
        },
        issuedAt: new Date().toISOString(),
        nonce: "nonce-001",
        schemaVersion: 1,
      },
      secret,
    );

    await expect(harness.submit(envelope)).rejects.toMatchObject({
      _tag: "SupervisorUnavailable",
    });
    await harness.dispose();
  });
});
