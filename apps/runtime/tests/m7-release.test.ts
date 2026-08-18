import { afterEach, expect, test } from "bun:test";
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error The release CLI is intentionally plain ESM for detached artifact use.
import { assertCleanReleaseInput, installRelease, manifestFor, rollbackRelease, uninstallRelease, validateArtifactTree, validateReleaseInventory, writeArtifactMetadata } from "../tools/m7-release-lib.mjs";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const temporary = () => { const root = realpathSync(mkdtempSync(join(tmpdir(), "m7-release-"))); roots.push(root); return root; };
const makeArtifact = (path: string, releaseId: string, largePayload = false) => {
  writeFileSync(join(path, "RELEASE.json"), JSON.stringify({ releaseId }));
  writeFileSync(join(path, "LICENSE"), "MIT\n");
  if (largePayload) writeFileSync(join(path, "payload"), Buffer.alloc(64 * 1024 * 1024, 0x61));
  const names = ["curiosity-m7-release", "curiosity-runtime-native", "@curiosity/runtime", "@iamsterling/opencode2-config", "opencode2", "@opencode-ai/plugin", "@opencode-ai/protocol", "@opencode-ai/schema", "effect", "fast-check", "pure-rand"];
  writeFileSync(join(path, "SBOM.json"), JSON.stringify({ bomFormat: "CycloneDX", specVersion: "1.6", components: names.map((name) => ({ name, version: "test", license: "MIT", licenseFile: "LICENSE", files: ["RELEASE.json", "LICENSE", ...(largePayload ? ["payload"] : [])] })) }));
  writeArtifactMetadata(path); return path;
};

test("M7 release input refuses dirty, uncommitted, and non-commit identities", () => {
  expect(() => assertCleanReleaseInput({ head: "a".repeat(40), dirty: " M file", tracked: true })).toThrow("M7_RELEASE_SOURCE_DIRTY");
  expect(() => assertCleanReleaseInput({ head: "", dirty: "", tracked: true })).toThrow("M7_RELEASE_COMMIT_REQUIRED");
  expect(() => assertCleanReleaseInput({ head: "snapshot", dirty: "", tracked: true })).toThrow("M7_RELEASE_COMMIT_REQUIRED");
  expect(assertCleanReleaseInput({ head: "a".repeat(40), dirty: "", tracked: true })).toBe("m7-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
});

test("M7 artifact validation refuses traversal, symlinks, devices, mode and manifest failures", () => {
  const root = temporary();
  mkdirSync(join(root, "payload"));
  writeFileSync(join(root, "payload", "file"), "ok", { mode: 0o644 });
  writeFileSync(join(root, "manifest.json"), JSON.stringify({ files: [{ path: "../escape", sha256: "0".repeat(64), mode: "0644" }] }));
  writeFileSync(join(root, "SHA256SUMS"), `${"0".repeat(64)}  manifest.json\n`);
  expect(() => validateArtifactTree(root)).toThrow("M7_ARTIFACT_PATH_INVALID");
  writeArtifactMetadata(root);
  symlinkSync("file", join(root, "payload", "link"));
  expect(() => validateArtifactTree(root)).toThrow("M7_ARTIFACT_TYPE_INVALID");
  rmSync(join(root, "payload", "link"));
  writeArtifactMetadata(root);
  chmodSync(join(root, "payload", "file"), 0o666);
  expect(() => validateArtifactTree(root)).toThrow(/M7_ARTIFACT_(MODE|HASH)_INVALID/u);
});

test("M7 artifact integrity requires consistent manifest and SHA256SUMS metadata", () => {
  const root = temporary();
  writeFileSync(join(root, "payload"), "ok", { mode: 0o644 });
  writeArtifactMetadata(root);
  expect(validateArtifactTree(root)).toBe(true);
  const sums = readFileSync(join(root, "SHA256SUMS"), "utf8");
  writeFileSync(join(root, "SHA256SUMS"), `${sums}0${"0".repeat(63)}  extra\n`);
  expect(() => validateArtifactTree(root)).toThrow("M7_ARTIFACT_CHECKSUM_INVALID");
  writeArtifactMetadata(root);
  writeFileSync(join(root, "manifest.json"), JSON.stringify({ files: [] }));
  expect(() => validateArtifactTree(root)).toThrow(/M7_ARTIFACT_(CHECKSUM|MANIFEST)_INVALID/u);
  rmSync(join(root, "SHA256SUMS"));
  expect(() => validateArtifactTree(root)).toThrow("M7_ARTIFACT_METADATA_REQUIRED");
});

test("M7 artifact validation rejects a real FIFO", () => {
  const root = temporary();
  Bun.spawnSync(["mkfifo", join(root, "pipe")]);
  expect(() => manifestFor(root)).toThrow("M7_ARTIFACT_TYPE_INVALID");
});

test("M7 SBOM inventory covers payload files and every referenced license", () => {
  const root = temporary(); makeArtifact(root, "m7-a");
  expect(validateReleaseInventory(root)).toBe(true);
  writeFileSync(join(root, "unowned-payload"), "missing from inventory");
  expect(() => validateReleaseInventory(root)).toThrow("M7_SBOM_COVERAGE_INVALID");
  rmSync(join(root, "unowned-payload")); rmSync(join(root, "LICENSE"));
  expect(() => validateReleaseInventory(root)).toThrow("M7_LICENSE_INVENTORY_INVALID");
});

test("M7 install, upgrade, rollback and uninstall are atomic and preserve unrelated state and credentials", () => {
  const prefix = temporary();
  const artifacts = temporary();
  const make = (id: string) => { const path = join(artifacts, id); mkdirSync(path); return makeArtifact(path, id); };
  mkdirSync(join(prefix, "state"), { recursive: true });
  writeFileSync(join(prefix, "state", "schema.json"), JSON.stringify({ schema: "curiosity-query-state/v1" }));
  writeFileSync(join(prefix, "state", "unrelated"), "keep");
  mkdirSync(join(prefix, "credentials")); writeFileSync(join(prefix, "credentials", "query.cap"), "secret", { mode: 0o600 });
  installRelease(make("m7-a"), prefix);
  installRelease(make("m7-b"), prefix);
  expect(readlinkSync(join(prefix, "current"))).toBe("releases/m7-b");
  rollbackRelease(prefix, "m7-a");
  expect(readlinkSync(join(prefix, "current"))).toBe("releases/m7-a");
  uninstallRelease(prefix);
  expect(lstatSync(join(prefix, "state", "unrelated")).isFile()).toBe(true);
  expect(lstatSync(join(prefix, "credentials", "query.cap")).isFile()).toBe(true);
});

test("M7 install refuses incompatible state without changing current", () => {
  const prefix = temporary(); const artifact = temporary();
  writeFileSync(join(artifact, "RELEASE.json"), JSON.stringify({ releaseId: "m7-a" }));
  mkdirSync(join(prefix, "state"), { recursive: true });
  writeFileSync(join(prefix, "state", "schema.json"), JSON.stringify({ schema: "other/v9" }));
  expect(() => installRelease(artifact, prefix)).toThrow("M7_STATE_INCOMPATIBLE");
  expect(() => lstatSync(join(prefix, "current"))).toThrow();
});

test("M7 concurrent lock contention preserves the lock owned by the active invocation", async () => {
  const prefix = temporary(); const artifact = temporary();
  writeFileSync(join(artifact, "RELEASE.json"), JSON.stringify({ releaseId: "m7-a" }));
  const lock = join(prefix, ".m7-release.lock"); const ready = join(prefix, "lock-ready");
  const owner = Bun.spawn([process.execPath, "-e", `const fs=require("fs");const fd=fs.openSync(process.argv[1],"wx",0o600);fs.writeFileSync(fd,"active");fs.writeFileSync(process.argv[2],"ready");setTimeout(()=>{fs.closeSync(fd);fs.unlinkSync(process.argv[1])},500)`, lock, ready]);
  for (let attempt = 0; attempt < 100 && !existsSync(ready); attempt++) await Bun.sleep(5);
  expect(existsSync(ready)).toBe(true);
  expect(() => installRelease(artifact, prefix)).toThrow("M7_RELEASE_LOCKED");
  expect(readFileSync(lock, "utf8")).toBe("active");
  expect(await owner.exited).toBe(0);
  expect(existsSync(lock)).toBe(false);
});

test("M7 cleanup preserves a replacement lock created during a valid long install", async () => {
  const prefix = temporary(); const artifact = join(temporary(), "m7-a"); mkdirSync(artifact); makeArtifact(artifact, "m7-a", true);
  const lock = join(prefix, ".m7-release.lock");
  const owner = Bun.spawn([process.execPath, "-e", `import(process.argv[1]).then(m=>m.installRelease(process.argv[2],process.argv[3]))`, new URL("../tools/m7-release-lib.mjs", import.meta.url).href, artifact, prefix]);
  for (let attempt = 0; attempt < 1000 && !existsSync(lock); attempt++) await Bun.sleep(1);
  expect(existsSync(lock)).toBe(true);
  renameSync(lock, `${lock}.owned`); writeFileSync(lock, "replacement-token", { mode: 0o600 });
  const replacement = lstatSync(lock);
  expect(await owner.exited).toBe(0);
  expect(readFileSync(lock, "utf8")).toBe("replacement-token");
  expect(lstatSync(lock).ino).toBe(replacement.ino);
});

test("M7 rollback rejects an external release symlink without changing current", () => {
  const prefix = temporary(); const artifacts = temporary();
  const artifact = join(artifacts, "m7-a"); mkdirSync(artifact); makeArtifact(artifact, "m7-a");
  installRelease(artifact, prefix);
  const before = readlinkSync(join(prefix, "current"));
  const external = temporary(); writeFileSync(join(external, "RELEASE.json"), JSON.stringify({ releaseId: "m7-evil" }));
  symlinkSync(external, join(prefix, "releases", "m7-evil"));
  expect(() => rollbackRelease(prefix, "m7-evil")).toThrow("M7_ROLLBACK_RELEASE_INVALID");
  expect(readlinkSync(join(prefix, "current"))).toBe(before);
  expect(existsSync(join(external, "RELEASE.json"))).toBe(true);
});
