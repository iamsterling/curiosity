import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { SupervisorClient } from "../src/supervisor/client.js";

const roots: string[] = [];
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("workspace read boundary matrix", () => {
  test("confines traversal, absolute, symlink, binary, UTF-8, oversized, and cancelled reads", async () => {
    const parent = mkdtempSync(path.join(tmpdir(), "curiosity-read-matrix-"));
    roots.push(parent);
    const root = path.join(parent, "workspace");
    const outside = path.join(parent, "outside");
    mkdirSync(root);
    mkdirSync(outside);
    writeFileSync(path.join(root, "unicode.txt"), "alpha\nPokémon\nomega\n");
    writeFileSync(path.join(root, "binary.bin"), Buffer.from([0xff, 0xfe, 0xfd]));
    writeFileSync(path.join(root, "oversized.txt"), "x".repeat(1024 * 1024 + 1));
    writeFileSync(
      path.join(root, "bounded.txt"),
      Array.from({ length: 400 }, (_, index) => `${index}:${"x".repeat(120)}`).join(
        "\n",
      ),
    );
    writeFileSync(path.join(outside, "secret.txt"), "outside");
    symlinkSync(path.join(outside, "secret.txt"), path.join(root, "escape.txt"));
    const swappable = path.join(root, "swappable");
    mkdirSync(swappable);
    writeFileSync(path.join(swappable, "inside.txt"), "inside");

    const client = await SupervisorClient.start(supervisorPath, root);
    expect(
      await client.workspaceRead("read-unicode", {
        maxLines: 10,
        path: "unicode.txt",
        startLine: 1,
      }),
    ).toMatchObject({
      content: "1: alpha\n2: Pokémon\n3: omega\n",
      truncated: false,
    });
    for (const [requestId, candidate] of [
      ["read-traversal", "../outside/secret.txt"],
      ["read-absolute", path.join(outside, "secret.txt")],
      ["read-symlink", "escape.txt"],
    ] as const)
      await expect(
        client.workspaceRead(requestId, {
          maxLines: 10,
          path: candidate,
          startLine: 1,
        }),
      ).rejects.toThrow(/WORKSPACE_PATH_(INVALID|OUTSIDE_ROOT)/u);
    await expect(
      client.workspaceRead("read-binary", {
        maxLines: 10,
        path: "binary.bin",
        startLine: 1,
      }),
    ).rejects.toThrow("WORKSPACE_FILE_NOT_UTF8");
    await expect(
      client.workspaceRead("read-oversized", {
        maxLines: 10,
        path: "oversized.txt",
        startLine: 1,
      }),
    ).rejects.toThrow("WORKSPACE_FILE_UNREADABLE");
    expect(
      await client.workspaceRead("read-bounded", {
        maxLines: 400,
        path: "bounded.txt",
        startLine: 1,
      }),
    ).toMatchObject({ truncated: true });

    renameSync(swappable, path.join(root, "retained-directory"));
    symlinkSync(outside, swappable);
    await expect(
      client.workspaceRead("read-after-swap", {
        maxLines: 10,
        path: "swappable/secret.txt",
        startLine: 1,
      }),
    ).rejects.toThrow("WORKSPACE_PATH_OUTSIDE_ROOT");
    await client.close();
    await expect(
      client.workspaceRead("read-after-cancel", {
        maxLines: 1,
        path: "unicode.txt",
        startLine: 1,
      }),
    ).rejects.toThrow("SUPERVISOR_EXITED");
  });
});
