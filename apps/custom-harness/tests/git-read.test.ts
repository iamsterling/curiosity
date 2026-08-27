import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type GitProfileConfig,
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
const gitExecutable = "/usr/bin/git";
const sha256 = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");

const waitForProcessExit = async (pid: number): Promise<void> => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      process.kill(pid, 0);
    } catch {
      return;
    }
    await Bun.sleep(10);
  }
  expect(() => process.kill(pid, 0)).toThrow();
};

const repository = (worktrees = false) => {
  const root = mkdtempSync(path.join(tmpdir(), "curiosity-git-read-"));
  roots.push(root);
  execFileSync(gitExecutable, ["init", "-q"], { cwd: root });
  execFileSync(gitExecutable, ["config", "user.name", "Curiosity Test"], {
    cwd: root,
  });
  execFileSync(gitExecutable, ["config", "user.email", "test@example.invalid"], {
    cwd: root,
  });
  writeFileSync(path.join(root, "tracked.txt"), "baseline\n");
  execFileSync(gitExecutable, ["add", "tracked.txt"], { cwd: root });
  execFileSync(gitExecutable, ["commit", "-q", "-m", "fixture"], { cwd: root });
  const expectedHead = execFileSync(gitExecutable, ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const worktree = realpathSync(root);
  const gitDirectory = realpathSync(path.join(root, ".git"));
  const profile: GitProfileConfig = {
    executable: gitExecutable,
    executableSha256: sha256(readFileSync(gitExecutable)),
    expectedHead,
    maximumOutputBytes: 8_192,
    repositoryIdentity: sha256(
      `worktree=${worktree}\ngitdir=${gitDirectory}`,
    ),
    ...(worktrees ? { worktreeRoot: ".git/curiosity-worktrees" } : {}),
  };
  if (worktrees) mkdirSync(path.join(root, profile.worktreeRoot!));
  return { profile, root };
};

const turn = () =>
  signCommand(
    {
      actorId,
      command: {
        id: "command-git-read",
        kind: "chat.turn",
        payload: {
          assistantMessageId: "assistant-git-read",
          text: "Inspect the exact repository diff.",
          threadId: "thread-git-read",
          turnId: "turn-git-read",
          userMessageId: "user-git-read",
        },
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: "nonce-git-read",
      schemaVersion: 1,
    },
    secret,
  );

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("identity-bound Git reads", () => {
  test("returns bounded status and diff receipts through the dedicated tool sink", async () => {
    const { profile, root } = repository();
    writeFileSync(path.join(root, "tracked.txt"), "changed\n");
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:git-read",
      stream: async function* (request) {
        generations += 1;
        expect(request.tools?.map(({ name }) => name)).toEqual(
          expect.arrayContaining(["git_diff", "git_status"]),
        );
        if (generations === 1) {
          yield {
            input: {
              maxOutputBytes: 4_096,
              paths: ["tracked.txt"],
              schemaVersion: 1,
            },
            toolCallId: "git-diff-call",
            toolName: "git_diff",
            type: "tool-call",
          } as never;
          return;
        }
        const evidence = request.messages.at(-1)?.content ?? "";
        expect(evidence).toContain("-baseline");
        expect(evidence).toContain("+changed");
        expect(evidence).toContain(profile.repositoryIdentity);
        yield "Identity-bound diff inspected.";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath: path.join(root, "events.sqlite"),
      gitProfile: profile,
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: root,
    });
    expect(await harness.chat(turn())).toMatchObject({
      text: "Identity-bound diff inspected.",
    });
    expect(await harness.status()).toMatchObject({
      capabilities: expect.arrayContaining([
        expect.objectContaining({ id: "git.read", state: "available" }),
        expect.objectContaining({ id: "git.mutation", state: "unavailable" }),
      ]),
      supervisor: { git: true },
    });
    await harness.dispose();
  });

  test("fails closed on wrong identity, changed HEAD, traversal, and process-profile bypass", async () => {
    const { profile, root } = repository();
    await expect(
      SupervisorClient.start(supervisorPath, root, [], false, {
        ...profile,
        repositoryIdentity: "0".repeat(64),
      }),
    ).rejects.toMatchObject({ message: "SUPERVISOR_HANDSHAKE_FAILED" });

    const client = await SupervisorClient.start(
      supervisorPath,
      root,
      [],
      false,
      profile,
    );
    await expect(
      client.gitDiff("git-traversal", {
        maxOutputBytes: 1_024,
        paths: ["../outside"],
      }),
    ).rejects.toThrow("GIT_PATH_DENIED");
    writeFileSync(path.join(root, "next.txt"), "next\n");
    execFileSync(gitExecutable, ["add", "next.txt"], { cwd: root });
    execFileSync(gitExecutable, ["commit", "-q", "-m", "next"], { cwd: root });
    await expect(client.gitStatus("git-head-race", 1_024)).rejects.toThrow(
      "GIT_HEAD_PRECONDITION_FAILED",
    );
    await client.close();

    await expect(
      SupervisorClient.start(
        supervisorPath,
        root,
        [
          {
            allowedArguments: [["status"]],
            allowedCwds: ["."],
            environment: {},
            executable: gitExecutable,
            executableSha256: profile.executableSha256,
            id: "git-bypass",
            maximumOutputBytes: 1_024,
            maximumTimeoutMs: 1_000,
          },
        ],
        false,
      ),
    ).rejects.toMatchObject({ message: "SUPERVISOR_HANDSHAKE_FAILED" });
  });

  test("retains the opened repository root and rejects path replacement", async () => {
    const { profile, root } = repository();
    const client = await SupervisorClient.start(
      supervisorPath,
      root,
      [],
      false,
      profile,
    );
    const moved = `${root}-moved`;
    renameSync(root, moved);
    roots.push(moved);
    mkdirSync(root);
    await expect(client.gitStatus("git-root-replaced", 1_024)).rejects.toThrow(
      "GIT_REPOSITORY_IDENTITY_MISMATCH",
    );
    await client.close();
  });

  test("preserves the exact Git ref-race denial through the governed tool gateway", async () => {
    const { profile, root } = repository();
    const databasePath = path.join(root, "events.sqlite");
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:git-ref-race",
      stream: async function* () {
        writeFileSync(path.join(root, "raced.txt"), "raced\n");
        execFileSync(gitExecutable, ["add", "raced.txt"], { cwd: root });
        execFileSync(gitExecutable, ["commit", "-q", "-m", "raced"], {
          cwd: root,
        });
        yield {
          input: { maxOutputBytes: 1_024, schemaVersion: 1 },
          toolCallId: "git-status-race-call",
          toolName: "git_status",
          type: "tool-call",
        } as never;
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      gitProfile: profile,
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: root,
    });
    await expect(harness.chat(turn())).rejects.toMatchObject({
      message: "GIT_HEAD_PRECONDITION_FAILED",
    });
    await harness.dispose();
    const database = new Database(databasePath, { readonly: true, strict: true });
    expect(
      database
        .query<{ error_code: string; status: string }, []>(
          "SELECT error_code,status FROM tool_calls WHERE tool_name = 'git_status'",
        )
        .get(),
    ).toEqual({ error_code: "GIT_HEAD_PRECONDITION_FAILED", status: "failed" });
    database.close();
  });

  test("creates, restarts, reconciles, and removes one exact detached locked worktree from a retained root", async () => {
    const { profile, root } = repository(true);
    const client = await SupervisorClient.start(
      supervisorPath,
      root,
      [],
      false,
      profile,
    );
    expect(client.receipt.capabilities.gitMutation).toBe(true);
    expect(
      await client.gitWorktreeInspect("worktree-inspect-absent", {
        expectedHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        worktreeId: "bounded-child",
      }),
    ).toMatchObject({
      status: "absent",
      worktreeId: "bounded-child",
    });
    const created = await client.gitWorktreeCreate("worktree-create", {
      expectedClean: true,
      expectedHead: profile.expectedHead,
      maxOutputBytes: 8_192,
      worktreeId: "bounded-child",
    });
    expect(created).toMatchObject({
      detached: true,
      head: profile.expectedHead,
      locked: true,
      repositoryIdentity: profile.repositoryIdentity,
      status: "ready",
      worktreeId: "bounded-child",
    });
    const reconciled = await client.gitWorktreeInspect(
      "worktree-inspect-ready",
      {
        expectedHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        worktreeId: "bounded-child",
      },
    );
    expect(reconciled).toEqual(created);
    await expect(
      client.gitWorktreeCreate("worktree-create-duplicate", {
        expectedClean: true,
        expectedHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        worktreeId: "bounded-child",
      }),
    ).rejects.toThrow("GIT_WORKTREE_ALREADY_EXISTS");
    expect(await client.gitStatus("main-remains-clean", 8_192)).toMatchObject({
      dirty: false,
    });
    await client.close();
    const restarted = await SupervisorClient.start(
      supervisorPath,
      root,
      [],
      false,
      profile,
    );
    expect(
      await restarted.gitWorktreeInspect("worktree-inspect-after-restart", {
        expectedHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        worktreeId: "bounded-child",
      }),
    ).toEqual(created);
    expect(
      await restarted.gitWorktreeRemove("worktree-remove", {
        expectedClean: true,
        expectedHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        worktreeId: "bounded-child",
      }),
    ).toMatchObject({
      expectedHead: profile.expectedHead,
      repositoryIdentity: profile.repositoryIdentity,
      status: "removed",
      worktreeId: "bounded-child",
    });
    expect(
      await restarted.gitWorktreeInspect("worktree-inspect-removed", {
        expectedHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        worktreeId: "bounded-child",
      }),
    ).toMatchObject({ status: "absent" });
    await expect(
      restarted.gitWorktreeRemove("worktree-remove-absent", {
        expectedClean: true,
        expectedHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        worktreeId: "bounded-child",
      }),
    ).rejects.toThrow("GIT_WORKTREE_ABSENT");
    await restarted.close();
  });

  test("refuses dirty and foreign worktree removal without force or unlock", async () => {
    const { profile, root } = repository(true);
    const client = await SupervisorClient.start(
      supervisorPath,
      root,
      [],
      false,
      profile,
    );
    const dirty = (await client.gitWorktreeCreate("worktree-create-dirty-remove", {
      expectedClean: true,
      expectedHead: profile.expectedHead,
      maxOutputBytes: 8_192,
      worktreeId: "dirty-removal",
    })) as { readonly destinationName: string };
    const dirtyPath = path.join(
      root,
      profile.worktreeRoot!,
      dirty.destinationName,
    );
    writeFileSync(path.join(dirtyPath, "untracked.txt"), "dirty\n");
    await expect(
      client.gitWorktreeRemove("worktree-remove-dirty", {
        expectedClean: true,
        expectedHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        worktreeId: "dirty-removal",
      }),
    ).rejects.toThrow("GIT_CLEAN_PRECONDITION_FAILED");
    expect(
      await client.gitWorktreeInspect("worktree-dirty-still-locked", {
        expectedHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        worktreeId: "dirty-removal",
      }),
    ).toMatchObject({ locked: true, status: "ready" });
    rmSync(path.join(dirtyPath, "untracked.txt"));
    await client.gitWorktreeRemove("worktree-remove-cleaned", {
      expectedClean: true,
      expectedHead: profile.expectedHead,
      maxOutputBytes: 8_192,
      worktreeId: "dirty-removal",
    });

    const foreign = (await client.gitWorktreeCreate("worktree-create-foreign", {
      expectedClean: true,
      expectedHead: profile.expectedHead,
      maxOutputBytes: 8_192,
      worktreeId: "foreign-removal",
    })) as { readonly destinationName: string };
    const foreignPath = path.join(
      root,
      profile.worktreeRoot!,
      foreign.destinationName,
    );
    renameSync(foreignPath, `${foreignPath}-original`);
    mkdirSync(foreignPath);
    execFileSync(gitExecutable, ["init", "-q"], { cwd: foreignPath });
    execFileSync(
      gitExecutable,
      ["fetch", "-q", root, profile.expectedHead],
      { cwd: foreignPath },
    );
    execFileSync(gitExecutable, ["checkout", "-q", "--detach", "FETCH_HEAD"], {
      cwd: foreignPath,
    });
    expect(
      await client.gitWorktreeInspect("worktree-inspect-foreign", {
        expectedHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        worktreeId: "foreign-removal",
      }),
    ).toMatchObject({ status: "reconciliation-required" });
    await expect(
      client.gitWorktreeRemove("worktree-remove-foreign", {
        expectedClean: true,
        expectedHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        worktreeId: "foreign-removal",
      }),
    ).rejects.toThrow("GIT_WORKTREE_RECONCILIATION_REQUIRED");
    expect(existsSync(foreignPath)).toBe(true);
    await client.close();
  });

  test("compare-and-swaps only Curiosity-owned refs with exact old and new commits", async () => {
    const { profile, root } = repository(true);
    const client = await SupervisorClient.start(
      supervisorPath,
      root,
      [],
      false,
      profile,
    );
    const refName = "refs/heads/curiosity/bounded-ref";
    const zero = "0".repeat(profile.expectedHead.length);
    expect(
      await client.gitRefInspect("ref-inspect-absent", {
        maxOutputBytes: 8_192,
        refName,
      }),
    ).toMatchObject({ head: null, refName, status: "absent" });
    expect(
      await client.gitRefUpdate("ref-create", {
        expectedClean: true,
        expectedOldHead: zero,
        maxOutputBytes: 8_192,
        newHead: profile.expectedHead,
        refName,
      }),
    ).toMatchObject({
      head: profile.expectedHead,
      previousHead: null,
      refName,
      status: "updated",
    });
    await expect(
      client.gitRefUpdate("ref-stale-create", {
        expectedClean: true,
        expectedOldHead: zero,
        maxOutputBytes: 8_192,
        newHead: profile.expectedHead,
        refName,
      }),
    ).rejects.toThrow("GIT_REF_PRECONDITION_FAILED");
    await expect(
      client.gitRefInspect("ref-inspect-denied", {
        maxOutputBytes: 8_192,
        refName: "refs/heads/main",
      }),
    ).rejects.toThrow("GIT_REF_NAME_DENIED");

    const tree = execFileSync(
      gitExecutable,
      ["rev-parse", `${profile.expectedHead}^{tree}`],
      { cwd: root, encoding: "utf8" },
    ).trim();
    const nextHead = execFileSync(
      gitExecutable,
      ["commit-tree", tree, "-p", profile.expectedHead, "-m", "next ref"],
      { cwd: root, encoding: "utf8" },
    ).trim();
    expect(
      await client.gitRefUpdate("ref-advance", {
        expectedClean: true,
        expectedOldHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        newHead: nextHead,
        refName,
      }),
    ).toMatchObject({
      head: nextHead,
      previousHead: profile.expectedHead,
      status: "updated",
    });
    expect(
      await client.gitRefInspect("ref-inspect-advanced", {
        maxOutputBytes: 8_192,
        refName,
      }),
    ).toMatchObject({ head: nextHead, status: "present" });
    expect(await client.gitStatus("ref-main-still-clean", 8_192)).toMatchObject({
      dirty: false,
      head: profile.expectedHead,
    });
    await client.close();
  });

  test("denies dirty, foreign, and replaced worktree roots without using the replacement", async () => {
    const { profile, root } = repository(true);
    const client = await SupervisorClient.start(
      supervisorPath,
      root,
      [],
      false,
      profile,
    );
    writeFileSync(path.join(root, "dirty.txt"), "dirty\n");
    await expect(
      client.gitWorktreeCreate("worktree-dirty", {
        expectedClean: true,
        expectedHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        worktreeId: "dirty-child",
      }),
    ).rejects.toThrow("GIT_CLEAN_PRECONDITION_FAILED");
    rmSync(path.join(root, "dirty.txt"));

    const retained = path.join(root, profile.worktreeRoot!);
    const moved = `${retained}-moved`;
    renameSync(retained, moved);
    mkdirSync(retained);
    await expect(
      client.gitWorktreeCreate("worktree-root-replaced", {
        expectedClean: true,
        expectedHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        worktreeId: "root-replaced",
      }),
    ).rejects.toThrow("GIT_WORKTREE_RECONCILIATION_REQUIRED");
    expect(
      execFileSync(gitExecutable, ["worktree", "list", "--porcelain"], {
        cwd: root,
        encoding: "utf8",
      }),
    ).toContain(moved);
    expect(
      execFileSync(gitExecutable, ["worktree", "list", "--porcelain"], {
        cwd: root,
        encoding: "utf8",
      }),
    ).not.toContain(path.join(retained, "curiosity-"));
    await client.close();
  });

  test("requires an exact signed gate before governed worktree creation", async () => {
    const { profile, root } = repository(true);
    const stateRoot = mkdtempSync(path.join(tmpdir(), "curiosity-git-state-"));
    roots.push(stateRoot);
    const databasePath = path.join(stateRoot, "events.sqlite");
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:git-worktree-gate",
      stream: async function* (request) {
        generations += 1;
        if (generations === 1) {
          expect(request.tools?.map(({ name }) => name)).toEqual(
            expect.arrayContaining([
              "git_ref_inspect",
              "git_ref_update",
              "git_worktree_create",
              "git_worktree_inspect",
              "git_worktree_remove",
            ]),
          );
          yield {
            input: {
              expectedClean: true,
              expectedHead: profile.expectedHead,
              maxOutputBytes: 8_192,
              schemaVersion: 1,
              worktreeId: "gated-child",
            },
            toolCallId: "git-worktree-create-call",
            toolName: "git_worktree_create",
            type: "tool-call",
          } as never;
          return;
        }
        expect(request.messages.at(-1)?.content).toContain('"status":"ready"');
        yield "Gated worktree ready.";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      gitProfile: profile,
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: root,
    });
    await harness.submit(turn());
    let database = new Database(databasePath, { readonly: true, strict: true });
    const gate = database
      .query<
        {
          gate_id: string;
          payload_digest: string;
          proposal_revision: number;
        },
        []
      >("SELECT gate_id,payload_digest,proposal_revision FROM gates")
      .get();
    expect(gate).toBeDefined();
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM tool_calls WHERE tool_name = 'git_worktree_create'",
        )
        .get()?.count,
    ).toBe(0);
    database.close();
    if (!gate) throw new Error("TEST_GIT_GATE_MISSING");

    await harness.submit(
      signCommand(
        {
          actorId,
          command: {
            id: "command-git-worktree-approve",
            kind: "gate.decide",
            payload: {
              decision: "approved",
              gateId: gate.gate_id,
              payloadDigest: gate.payload_digest,
              proposalRevision: gate.proposal_revision,
              schemaVersion: 1,
            },
            schemaVersion: 1,
          },
          issuedAt: new Date().toISOString(),
          nonce: "nonce-git-worktree-approve",
          schemaVersion: 1,
        },
        secret,
      ),
    );
    expect(await harness.status()).toMatchObject({
      capabilities: expect.arrayContaining([
        expect.objectContaining({ id: "git.mutation", state: "available" }),
      ]),
      supervisor: { gitMutation: true },
    });
    expect(await harness.projections.messages("thread-git-read")).toContainEqual(
      expect.objectContaining({ role: "assistant", text: "Gated worktree ready." }),
    );
    database = new Database(databasePath, { readonly: true, strict: true });
    expect(
      database
        .query<{ status: string }, []>(
          "SELECT status FROM tool_calls WHERE tool_name = 'git_worktree_create'",
        )
        .get(),
    ).toEqual({ status: "succeeded" });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'action.succeeded' AND json_extract(body_json, '$.actionType') = 'git.worktree.create'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
    await harness.dispose();
  });

  test("requires an exact signed gate before compare-and-swap ref mutation", async () => {
    const { profile, root } = repository(true);
    const stateRoot = mkdtempSync(path.join(tmpdir(), "curiosity-git-ref-state-"));
    roots.push(stateRoot);
    const databasePath = path.join(stateRoot, "events.sqlite");
    const refName = "refs/heads/curiosity/gated-ref";
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:git-ref-gate",
      stream: async function* (request) {
        generations += 1;
        if (generations === 1) {
          yield {
            input: {
              expectedClean: true,
              expectedOldHead: "0".repeat(profile.expectedHead.length),
              maxOutputBytes: 8_192,
              newHead: profile.expectedHead,
              refName,
              schemaVersion: 1,
            },
            toolCallId: "git-ref-update-call",
            toolName: "git_ref_update",
            type: "tool-call",
          } as never;
          return;
        }
        expect(request.messages.at(-1)?.content).toContain('"status":"updated"');
        yield "Gated ref updated.";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      gitProfile: profile,
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: root,
    });
    await harness.submit(turn());
    let database = new Database(databasePath, { readonly: true, strict: true });
    const gate = database
      .query<
        {
          gate_id: string;
          payload_digest: string;
          proposal_revision: number;
        },
        []
      >("SELECT gate_id,payload_digest,proposal_revision FROM gates")
      .get();
    expect(gate).toBeDefined();
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM tool_calls WHERE tool_name = 'git_ref_update'",
        )
        .get()?.count,
    ).toBe(0);
    database.close();
    if (!gate) throw new Error("TEST_GIT_REF_GATE_MISSING");
    await harness.submit(
      signCommand(
        {
          actorId,
          command: {
            id: "command-git-ref-approve",
            kind: "gate.decide",
            payload: {
              decision: "approved",
              gateId: gate.gate_id,
              payloadDigest: gate.payload_digest,
              proposalRevision: gate.proposal_revision,
              schemaVersion: 1,
            },
            schemaVersion: 1,
          },
          issuedAt: new Date().toISOString(),
          nonce: "nonce-git-ref-approve",
          schemaVersion: 1,
        },
        secret,
      ),
    );
    expect(await harness.projections.messages("thread-git-read")).toContainEqual(
      expect.objectContaining({ role: "assistant", text: "Gated ref updated." }),
    );
    await harness.dispose();
    expect(
      execFileSync(gitExecutable, ["rev-parse", refName], {
        cwd: root,
        encoding: "utf8",
      }).trim(),
    ).toBe(profile.expectedHead);
    database = new Database(databasePath, { readonly: true, strict: true });
    expect(
      database
        .query<{ delivery_certainty: string; status: string }, []>(
          "SELECT delivery_certainty,status FROM tool_calls WHERE tool_name = 'git_ref_update'",
        )
        .get(),
    ).toEqual({ delivery_certainty: "DELIVERED", status: "succeeded" });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'action.succeeded' AND json_extract(body_json, '$.actionType') = 'git.ref.update'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
  });

  test("reconciles a completed worktree effect after cancelling before its receipt", async () => {
    const { profile, root } = repository(true);
    const adapterRoot = mkdtempSync(path.join(tmpdir(), "curiosity-git-adapter-"));
    roots.push(adapterRoot);
    const marker = path.join(adapterRoot, "started");
    const adapter = path.join(adapterRoot, "git");
    writeFileSync(
      adapter,
      `#!/usr/bin/python3\nimport os, signal, subprocess, sys, time\nif len(sys.argv) > 2 and sys.argv[1:3] == ["worktree", "add"]:\n    completed = subprocess.run(["/usr/bin/git", *sys.argv[1:]])\n    open(${JSON.stringify(marker)}, "w").write(str(os.getpid()))\n    signal.signal(signal.SIGTERM, signal.SIG_IGN)\n    time.sleep(30)\n    sys.exit(completed.returncode)\nos.execv("/usr/bin/git", ["/usr/bin/git", *sys.argv[1:]])\n`,
    );
    chmodSync(adapter, 0o755);
    const client = await SupervisorClient.start(
      supervisorPath,
      root,
      [],
      false,
      {
        ...profile,
        executable: adapter,
        executableSha256: sha256(readFileSync(adapter)),
      },
    );
    const creation = client.gitWorktreeCreate("worktree-cancel", {
      expectedClean: true,
      expectedHead: profile.expectedHead,
      maxOutputBytes: 8_192,
      worktreeId: "cancelled-child",
    });
    for (let attempt = 0; attempt < 100 && !existsSync(marker); attempt += 1)
      await Bun.sleep(10);
    expect(existsSync(marker)).toBe(true);
    const childPid = Number(readFileSync(marker, "utf8"));
    client.cancelGitMutation("worktree-cancel");
    await expect(creation).rejects.toThrow("GIT_OPERATION_CANCELLED");
    await waitForProcessExit(childPid);
    expect(
      await client.gitWorktreeInspect("worktree-after-cancel", {
        expectedHead: profile.expectedHead,
        maxOutputBytes: 8_192,
        worktreeId: "cancelled-child",
      }),
    ).toMatchObject({ locked: true, status: "ready" });
    await client.gitWorktreeRemove("worktree-remove-after-cancel", {
      expectedClean: true,
      expectedHead: profile.expectedHead,
      maxOutputBytes: 8_192,
      worktreeId: "cancelled-child",
    });
    await client.close();
  });

  test("fences a governed worktree lease when cancellation races dispatched creation", async () => {
    const { profile, root } = repository(true);
    const stateRoot = mkdtempSync(path.join(tmpdir(), "curiosity-git-cancel-state-"));
    roots.push(stateRoot);
    const databasePath = path.join(stateRoot, "events.sqlite");
    const marker = path.join(stateRoot, "git-started");
    const adapter = path.join(stateRoot, "git");
    writeFileSync(
      adapter,
      `#!/usr/bin/python3\nimport os, signal, sys, time\nif len(sys.argv) > 2 and sys.argv[1:3] == ["worktree", "add"]:\n    open(${JSON.stringify(marker)}, "w").write(str(os.getpid()))\n    signal.signal(signal.SIGTERM, signal.SIG_IGN)\n    time.sleep(30)\nos.execv("/usr/bin/git", ["/usr/bin/git", *sys.argv[1:]])\n`,
    );
    chmodSync(adapter, 0o755);
    const configuredProfile: GitProfileConfig = {
      ...profile,
      executable: adapter,
      executableSha256: sha256(readFileSync(adapter)),
    };
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:git-worktree-cancel",
      stream: async function* () {
        yield {
          input: {
            expectedClean: true,
            expectedHead: profile.expectedHead,
            maxOutputBytes: 8_192,
            schemaVersion: 1,
            worktreeId: "cancelled-governed-child",
          },
          toolCallId: "git-worktree-cancel-call",
          toolName: "git_worktree_create",
          type: "tool-call",
        } as never;
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      gitProfile: configuredProfile,
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: root,
    });
    await harness.submit(turn());
    let database = new Database(databasePath, { readonly: true, strict: true });
    const gate = database
      .query<
        {
          gate_id: string;
          payload_digest: string;
          proposal_revision: number;
        },
        []
      >("SELECT gate_id,payload_digest,proposal_revision FROM gates")
      .get();
    database.close();
    if (!gate) throw new Error("TEST_GIT_CANCEL_GATE_MISSING");
    const approval = harness.submit(
      signCommand(
        {
          actorId,
          command: {
            id: "command-git-worktree-cancel-approve",
            kind: "gate.decide",
            payload: {
              decision: "approved",
              gateId: gate.gate_id,
              payloadDigest: gate.payload_digest,
              proposalRevision: gate.proposal_revision,
              schemaVersion: 1,
            },
            schemaVersion: 1,
          },
          issuedAt: new Date().toISOString(),
          nonce: "nonce-git-worktree-cancel-approve",
          schemaVersion: 1,
        },
        secret,
      ),
    );
    for (let attempt = 0; attempt < 100 && !existsSync(marker); attempt += 1)
      await Bun.sleep(10);
    expect(existsSync(marker)).toBe(true);
    const childPid = Number(readFileSync(marker, "utf8"));
    await harness.submit(
      signCommand(
        {
          actorId,
          command: {
            id: "command-git-worktree-cancel",
            kind: "execution.cancel",
            payload: { executionId: "turn-git-read", schemaVersion: 1 },
            schemaVersion: 1,
          },
          issuedAt: new Date().toISOString(),
          nonce: "nonce-git-worktree-cancel",
          schemaVersion: 1,
        },
        secret,
      ),
    );
    await expect(approval).rejects.toMatchObject({ message: "ACTION_CANCELLED" });
    await waitForProcessExit(childPid);
    await harness.dispose();

    database = new Database(databasePath, { readonly: true, strict: true });
    expect(
      database
        .query<
          {
            delivery_certainty: string;
            error_code: string;
            status: string;
          },
          []
        >(
          "SELECT delivery_certainty,error_code,status FROM tool_calls WHERE tool_name = 'git_worktree_create'",
        )
        .get(),
    ).toEqual({
      delivery_certainty: "UNKNOWN",
      error_code: "ACTION_CANCELLED",
      status: "failed",
    });
    expect(
      database
        .query<{ released_at: string | null; status: string }, []>(
          "SELECT released_at,status FROM resource_leases WHERE resource = 'git:worktree:cancelled-governed-child'",
        )
        .get(),
    ).toEqual({ released_at: null, status: "fenced" });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM quarantined_receipts WHERE reason = 'STALE_OR_CANCELLED_GENERATION'",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
  });
});
