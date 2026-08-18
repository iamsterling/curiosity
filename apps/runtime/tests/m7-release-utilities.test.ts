import { afterEach, expect, test } from "bun:test";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error Detached release utilities are plain ESM.
import { createReleaseArchive, extractReleaseArchive, listReleaseArchive, stageM7BuildDependencies, writeReleaseScripts } from "../tools/m7-release-lib.mjs";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const temporary = () => { const root = realpathSync(mkdtempSync(join(tmpdir(), "m7-utility-"))); roots.push(root); return root; };

test("a clean source copy materializes exact local M7 build dependencies without install or network", () => {
  const sourceRoot = temporary(); const dependencyRoot = join(temporary(), "node_modules");
  const pluginRoot = join(sourceRoot, "apps/opencode2-config"); mkdirSync(pluginRoot, { recursive: true });
  cpSync(new URL("../../opencode2-config/package.json", import.meta.url), join(pluginRoot, "package.json"));
  mkdirSync(join(sourceRoot, "apps/runtime"), { recursive: true });
  const packages = [
    ["@opencode-ai/plugin", "0.0.0-beta-17519"], ["@opencode-ai/cli", "0.0.0-beta-17519"],
    ["effect", "4.0.0-beta.101"], ["typescript", "5.8.2"], ["@types/node", "26.2.0"],
    ["@opencode-ai/cli-darwin-arm64", "0.0.0-beta-17519"], ["fast-check", "4.9.0"], ["pure-rand", "8.4.2"],
  ] as const;
  for (const [name, version] of packages) {
    const packageRoot = join(dependencyRoot, ".bun", `${name.replace("/", "+")}@${version}`, "node_modules", name);
    mkdirSync(packageRoot, { recursive: true }); writeFileSync(join(packageRoot, "package.json"), JSON.stringify({ name, version }));
    if (name === "typescript") { mkdirSync(join(packageRoot, "bin")); writeFileSync(join(packageRoot, "bin/tsc"), "#!/bin/sh\n", { mode: 0o755 }); }
  }
  expect(existsSync(join(pluginRoot, "node_modules"))).toBe(false);
  const staged = stageM7BuildDependencies({ sourceRoot, dependencyRoot });
  expect(staged).toEqual({ network: "disabled", source: realpathSync(dependencyRoot) });
  expect(JSON.parse(readFileSync(join(pluginRoot, "node_modules/@opencode-ai/plugin/package.json"), "utf8")).version).toBe("0.0.0-beta-17519");
  expect(JSON.parse(readFileSync(join(pluginRoot, "node_modules/effect/package.json"), "utf8")).version).toBe("4.0.0-beta.101");
  expect(existsSync(join(pluginRoot, "node_modules/.bin/tsc"))).toBe(true);
  rmSync(join(pluginRoot, "node_modules"), { recursive: true, force: true });
  const sourceManifest = join(pluginRoot, "package.json"); const sourcePackage = JSON.parse(readFileSync(sourceManifest, "utf8"));
  sourcePackage.devDependencies["@types/node"] = "^26.2.0"; writeFileSync(sourceManifest, JSON.stringify(sourcePackage));
  expect(() => stageM7BuildDependencies({ sourceRoot, dependencyRoot })).toThrow("M7_BUILD_DEPENDENCY_PIN_MISMATCH");
  sourcePackage.devDependencies["@types/node"] = "26.2.0"; writeFileSync(sourceManifest, JSON.stringify(sourcePackage));
  const pluginManifest = join(dependencyRoot, ".bun/@opencode-ai+plugin@0.0.0-beta-17519/node_modules/@opencode-ai/plugin/package.json");
  writeFileSync(pluginManifest, JSON.stringify({ name: "@opencode-ai/plugin", version: "0.0.0-beta-99999" }));
  expect(() => stageM7BuildDependencies({ sourceRoot, dependencyRoot })).toThrow("M7_BUILD_DEPENDENCY_PIN_MISMATCH");
  rmSync(pluginManifest);
  expect(() => stageM7BuildDependencies({ sourceRoot, dependencyRoot })).toThrow("M7_BUILD_DEPENDENCIES_UNAVAILABLE");
});

test("dependency staging rejects a hostile source node_modules link without mutating its target", () => {
  const sourceRoot = temporary(); const dependencyRoot = join(temporary(), "node_modules"); const outside = temporary();
  const pluginRoot = join(sourceRoot, "apps/opencode2-config"); mkdirSync(pluginRoot, { recursive: true });
  cpSync(new URL("../../opencode2-config/package.json", import.meta.url), join(pluginRoot, "package.json"));
  writeFileSync(join(outside, "marker"), "unchanged"); symlinkSync(outside, join(pluginRoot, "node_modules"), "dir");
  expect(() => stageM7BuildDependencies({ sourceRoot, dependencyRoot })).toThrow(/^M7_BUILD_DEPENDENCY_CONFINEMENT_INVALID$/);
  expect(readFileSync(join(outside, "marker"), "utf8")).toBe("unchanged");
  expect(existsSync(join(outside, "@opencode-ai"))).toBe(false);
});

test("dependency staging rejects Bun-store escapes with a stable redacted failure", () => {
  const sourceRoot = temporary(); const dependencyRoot = join(temporary(), "node_modules"); const outside = temporary();
  const pluginRoot = join(sourceRoot, "apps/opencode2-config"); mkdirSync(pluginRoot, { recursive: true });
  cpSync(new URL("../../opencode2-config/package.json", import.meta.url), join(pluginRoot, "package.json"));
  mkdirSync(join(sourceRoot, "apps/runtime"), { recursive: true });
  const escapedPackage = join(outside, "plugin"); mkdirSync(escapedPackage); writeFileSync(join(escapedPackage, "marker"), "unchanged");
  writeFileSync(join(escapedPackage, "package.json"), JSON.stringify({ name: "@opencode-ai/plugin", version: "0.0.0-beta-17519" }));
  const storeEntry = join(dependencyRoot, ".bun/@opencode-ai+plugin@0.0.0-beta-17519/node_modules/@opencode-ai");
  mkdirSync(storeEntry, { recursive: true }); symlinkSync(escapedPackage, join(storeEntry, "plugin"), "dir");
  let message = "";
  try { stageM7BuildDependencies({ sourceRoot, dependencyRoot }); } catch (error) { message = error instanceof Error ? error.message : String(error); }
  expect(message).toBe("M7_BUILD_DEPENDENCY_CONFINEMENT_INVALID");
  expect(message).not.toContain(outside);
  expect(readFileSync(join(escapedPackage, "marker"), "utf8")).toBe("unchanged");
  expect(existsSync(join(pluginRoot, "node_modules/@opencode-ai/plugin"))).toBe(false);
});

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
