import { afterEach, expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error Detached release utilities are plain ESM.
import { createReleaseArchive, extractReleaseArchive, listReleaseArchive, writeReleaseScripts } from "../tools/m7-release-lib.mjs";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const temporary = () => { const root = realpathSync(mkdtempSync(join(tmpdir(), "m7-utility-"))); roots.push(root); return root; };

test("generated lifecycle scripts derive their staged artifact root with no ambient root variable", () => {
  const stage = temporary(); const fakeBin = temporary(); const calls = join(temporary(), "calls");
  mkdirSync(join(stage, "tools")); writeFileSync(join(stage, "tools", "m7-release.mjs"), "// fixture\n");
  writeReleaseScripts(stage);
  writeFileSync(join(fakeBin, "bun"), `#!/bin/sh\nprintf '%s\\n' "$*" >> ${JSON.stringify(calls)}\n`, { mode: 0o755 }); chmodSync(join(fakeBin, "bun"), 0o755);
  const env: Record<string, string | undefined> = { ...process.env, PATH: `${fakeBin}:${process.env.PATH}` }; delete env.CURIOSITY_RUNTIME_RELEASE_ROOT;
  for (const [name, args] of [["verify", []], ["preflight", []], ["install", ["/private/prefix"]], ["upgrade", ["/private/prefix"]]] as const) {
    const result = Bun.spawnSync([join(stage, "scripts", name), ...args], { env });
    expect(result.exitCode).toBe(0);
  }
  const lines = readFileSync(calls, "utf8").trim().split("\n");
  expect(lines).toEqual([
    `${stage}/tools/m7-release.mjs verify ${stage}`,
    `${stage}/tools/m7-release.mjs verify ${stage}`,
    `${stage}/tools/m7-release.mjs install ${stage} /private/prefix`,
    `${stage}/tools/m7-release.mjs install ${stage} /private/prefix`,
  ]);
});

test("private archive creation is deterministic and extraction rejects unsafe members", () => {
  const root = temporary(); const source = join(root, "m7-fixture"); mkdirSync(source); writeFileSync(join(source, "payload"), "ok");
  const first = join(root, "first.tar.gz"); const second = join(root, "second.tar.gz");
  createReleaseArchive(source, first); createReleaseArchive(source, second);
  expect(Bun.CryptoHasher.hash("sha256", readFileSync(first), "hex")).toBe(Bun.CryptoHasher.hash("sha256", readFileSync(second), "hex"));
  expect(listReleaseArchive(first)).toEqual(["m7-fixture", "m7-fixture/payload"]);
  const extracted = join(root, "extracted"); extractReleaseArchive(first, extracted);
  expect(readFileSync(join(extracted, "m7-fixture", "payload"), "utf8")).toBe("ok");
  const unsafe = join(root, "unsafe.tar");
  Bun.spawnSync(["tar", "-cf", unsafe, "--format", "ustar", "-C", root, "m7-fixture"]);
  const bytes = readFileSync(unsafe); bytes.write("../escape", 0, "ascii"); writeFileSync(unsafe, bytes);
  expect(() => extractReleaseArchive(unsafe, join(root, "bad"))).toThrow("M7_ARCHIVE_PATH_INVALID");
});
