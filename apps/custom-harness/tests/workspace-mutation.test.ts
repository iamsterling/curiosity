import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createHash, randomBytes } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type TextGenerator,
} from "../src/index.js";
import { SupervisorClient } from "../src/supervisor/client.js";
import { resourceClaimsOverlap } from "../src/storage/attempt-journal.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);
const sha256 = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");

const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "curiosity-mutation-"));
  roots.push(root);
  return { databasePath: path.join(root, "events.sqlite"), root };
};

const turn = (suffix: string) =>
  signCommand(
    {
      actorId,
      command: {
        id: `command-mutation-${suffix}`,
        kind: "chat.turn",
        payload: {
          assistantMessageId: `assistant-mutation-${suffix}`,
          text: "Apply the exact preconditioned workspace change.",
          threadId: `thread-mutation-${suffix}`,
          turnId: `turn-mutation-${suffix}`,
          userMessageId: `user-mutation-${suffix}`,
        },
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: `nonce-mutation-${suffix}`,
      schemaVersion: 1,
    },
    secret,
  );

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("preconditioned workspace mutation", () => {
  test("creates, patches, and deletes one claimed file with exact receipts", async () => {
    const { databasePath, root } = fixture();
    const alpha = "alpha\n";
    const beta = "beta\n";
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:workspace-mutation",
      stream: async function* (request) {
        generations += 1;
        expect(request.tools?.map(({ name }) => name)).toEqual(
          expect.arrayContaining([
            "workspace_delete",
            "workspace_patch",
            "workspace_write",
          ]),
        );
        if (generations === 1) {
          yield {
            input: {
              content: alpha,
              expectedSha256: null,
              path: "change.txt",
              schemaVersion: 1,
            },
            toolCallId: "mutation-create",
            toolName: "workspace_write",
            type: "tool-call",
          } as never;
          return;
        }
        if (generations === 2) {
          expect(request.messages.at(-1)?.content).toContain('"created":true');
          yield {
            input: {
              expectedSha256: sha256(alpha),
              path: "change.txt",
              replacements: [
                { expectedOccurrences: 1, new: "beta", old: "alpha" },
              ],
              schemaVersion: 1,
            },
            toolCallId: "mutation-patch",
            toolName: "workspace_patch",
            type: "tool-call",
          } as never;
          return;
        }
        if (generations === 3) {
          expect(request.messages.at(-1)?.content).toContain(sha256(beta));
          yield {
            input: {
              expectedSha256: sha256(beta),
              path: "change.txt",
              schemaVersion: 1,
            },
            toolCallId: "mutation-delete",
            toolName: "workspace_delete",
            type: "tool-call",
          } as never;
          return;
        }
        expect(request.messages.at(-1)?.content).toContain(
          '"operation":"delete"',
        );
        yield "Preconditioned mutation sequence completed.";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator: generator,
      workspaceMutationEnabled: true,
      workspaceRoot: root,
    });
    expect(await harness.chat(turn("lifecycle"))).toMatchObject({
      text: "Preconditioned mutation sequence completed.",
    });
    expect(generations).toBe(4);
    expect(() => readFileSync(path.join(root, "change.txt"))).toThrow();
    expect(await harness.status()).toMatchObject({
      capabilities: expect.arrayContaining([
        expect.objectContaining({
          id: "filesystem.mutation",
          state: "available",
        }),
      ]),
      supervisor: { filesystemMutation: true },
    });
    await harness.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ action_type: string; resource: string; status: string }, []>(
          "SELECT action_type,resource,status FROM actions WHERE action_type LIKE 'workspace.%' AND action_type NOT IN ('workspace.read','workspace.search','workspace.list','workspace.glob') ORDER BY created_at,action_id",
        )
        .all(),
    ).toEqual([
      {
        action_type: "workspace.write",
        resource: "workspace:path:change.txt",
        status: "succeeded",
      },
      {
        action_type: "workspace.patch",
        resource: "workspace:path:change.txt",
        status: "succeeded",
      },
      {
        action_type: "workspace.delete",
        resource: "workspace:path:change.txt",
        status: "succeeded",
      },
    ]);
    database.close();
  });

  test("preserves the file on digest and patch-occurrence mismatches", async () => {
    const { databasePath, root } = fixture();
    const file = path.join(root, "baseline.txt");
    writeFileSync(file, "one one\n");
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:workspace-precondition",
      stream: async function* () {
        generations += 1;
        yield {
          input: {
            content: "changed\n",
            expectedSha256: "0".repeat(64),
            path: "baseline.txt",
            schemaVersion: 1,
          },
          toolCallId: "mutation-wrong-digest",
          toolName: "workspace_write",
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
      workspaceMutationEnabled: true,
      workspaceRoot: root,
    });
    await expect(harness.chat(turn("precondition"))).rejects.toMatchObject({
      message: "WORKSPACE_PRECONDITION_FAILED",
    });
    expect(generations).toBe(1);
    expect(readFileSync(file, "utf8")).toBe("one one\n");
    await harness.dispose();

    const supervisor = await SupervisorClient.start(
      supervisorPath,
      root,
      [],
      true,
    );
    await expect(
      supervisor.workspacePatch("patch-occurrence", {
        expectedSha256: sha256("one one\n"),
        path: "baseline.txt",
        replacements: [{ expectedOccurrences: 1, new: "two", old: "one" }],
      }),
    ).rejects.toThrow("WORKSPACE_PATCH_OCCURRENCE_MISMATCH");
    expect(readFileSync(file, "utf8")).toBe("one one\n");
    await expect(
      supervisor.workspacePatch("partial-patch", {
        expectedSha256: sha256("one one\n"),
        path: "baseline.txt",
        replacements: [
          { expectedOccurrences: 2, new: "two", old: "one" },
          { expectedOccurrences: 1, new: "four", old: "three" },
        ],
      }),
    ).rejects.toThrow("WORKSPACE_PATCH_OCCURRENCE_MISMATCH");
    expect(readFileSync(file, "utf8")).toBe("one one\n");
    expect(
      readdirSync(root).filter((name) => name.startsWith(".curiosity-")),
    ).toEqual([]);
    await supervisor.close();
  });

  test("rejects traversal and final symlinks without changing outside content", async () => {
    const { root } = fixture();
    const outsideRoot = mkdtempSync(path.join(tmpdir(), "curiosity-mutation-outside-"));
    roots.push(outsideRoot);
    const outside = path.join(outsideRoot, "outside.txt");
    writeFileSync(outside, "outside\n");
    symlinkSync(outside, path.join(root, "escape.txt"));
    const supervisor = await SupervisorClient.start(
      supervisorPath,
      root,
      [],
      true,
    );
    await expect(
      supervisor.workspaceWrite("traversal", {
        content: "changed\n",
        expectedSha256: null,
        path: "../outside.txt",
      }),
    ).rejects.toThrow("WORKSPACE_PATH_INVALID");
    await expect(
      supervisor.workspaceWrite("symlink", {
        content: "changed\n",
        expectedSha256: sha256("outside\n"),
        path: "escape.txt",
      }),
    ).rejects.toThrow("WORKSPACE_PATH_UNSAFE");
    expect(readFileSync(outside, "utf8")).toBe("outside\n");
    const outsideDirectory = path.join(outsideRoot, "directory");
    mkdirSync(outsideDirectory);
    symlinkSync(outsideDirectory, path.join(root, "ancestor"));
    await expect(
      supervisor.workspaceWrite("ancestor-symlink", {
        content: "changed\n",
        expectedSha256: null,
        path: "ancestor/created.txt",
      }),
    ).rejects.toThrow("WORKSPACE_PATH_UNSAFE");
    expect(() => readFileSync(path.join(outsideDirectory, "created.txt"))).toThrow();
    await supervisor.close();
  });

  test("treats ancestor and descendant mutation claims as one exclusive scope", () => {
    expect(
      resourceClaimsOverlap(
        "workspace:path:src",
        "workspace:path:src/index.ts",
      ),
    ).toBe(true);
    expect(
      resourceClaimsOverlap(
        "workspace:path:src/index.ts",
        "workspace:path:src/index.ts",
      ),
    ).toBe(true);
    expect(
      resourceClaimsOverlap(
        "workspace:path:src-a/index.ts",
        "workspace:path:src-b/index.ts",
      ),
    ).toBe(false);
    expect(resourceClaimsOverlap("git:ref:a", "git:ref:b")).toBe(false);
  });
});
