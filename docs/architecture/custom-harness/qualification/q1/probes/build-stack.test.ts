import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import baseline from "./fixtures/qualified-input.json";

const root = resolve(import.meta.dir, "../../../../../..");

const run = (command: string[]) => {
  const result = Bun.spawnSync(command, {
    cwd: root,
    env: {
      HOME: process.env.HOME ?? "",
      PATH: process.env.PATH ?? "",
      CI: "1",
      NO_UPDATE_NOTIFIER: "1",
      TURBO_NO_UPDATE_NOTIFIER: "1",
      TURBO_TELEMETRY_DISABLED: "1",
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) {
    throw new Error(new TextDecoder().decode(result.stderr));
  }
  return new TextDecoder().decode(result.stdout).trim();
};

describe("Q1 build and test identity", () => {
  test("the executing Bun runtime is the exact selected built-in test runner", () => {
    expect(Bun.version).toBe(baseline.buildTest.bun.version);
    expect(Bun.revision).toBe(baseline.buildTest.bun.revision);
  });

  test("the exact TypeScript and Turbo artifacts execute", () => {
    expect(
      run([
        process.execPath,
        "--no-install",
        "--no-env-file",
        "node_modules/typescript/bin/tsc",
        "--version",
      ]),
    ).toBe("Version 5.9.2");
    expect(
      run([
        join(root, "node_modules/.bin/turbo"),
        "--no-update-notifier",
        "--version",
      ]),
    ).toBe("2.10.10");
  });

  test("package manifests retain the exact selected identities", async () => {
    const typescript = JSON.parse(
      await readFile(
        join(root, "node_modules/typescript/package.json"),
        "utf8",
      ),
    );
    const turbo = JSON.parse(
      await readFile(join(root, "node_modules/turbo/package.json"), "utf8"),
    );
    const platform = JSON.parse(
      await readFile(
        join(
          root,
          "node_modules/.bun/@turbo+darwin-arm64@2.10.10/node_modules/@turbo/darwin-arm64/package.json",
        ),
        "utf8",
      ),
    );
    expect([typescript.version, turbo.version, platform.version]).toEqual([
      "5.9.2",
      "2.10.10",
      "2.10.10",
    ]);
    expect([platform.os, platform.cpu]).toEqual([["darwin"], ["arm64"]]);
  });
});
