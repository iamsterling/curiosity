import { afterEach, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRuntime } from "../src/index.js";
// @ts-expect-error The release utility is intentionally plain ESM for detached artifact use.
import { M7_NATIVE_INSTALL_ID, assertM7NativeHasValidUuid, assertM7NativeLinks, darwinLinkedLibraries, darwinUuid, m7NativeCargoEnvironment } from "../tools/m7-release-lib.mjs";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const temporary = (name: string) => { const root = realpathSync(mkdtempSync(join(tmpdir(), name))); roots.push(root); return root; };

test("M7 release-native linking is reproducible and loadable across different-length source roots", async () => {
  const native = realpathSync(join(dirname(fileURLToPath(import.meta.url)), "../native"));
  const target = join(native, "target");
  const sourceRoots = [temporary("m7-native-a-"), temporary("m7-native-source-root-with-a-deliberately-different-length-")];
  const dylibs = sourceRoots.map((root) => {
    cpSync(native, root, { recursive: true, filter: (source) => source !== target && !source.startsWith(`${target}/`) });
    execFileSync("cargo", ["build", "--manifest-path", join(root, "Cargo.toml"), "--release", "--locked", "--no-default-features"], {
      env: m7NativeCargoEnvironment(process.env),
      stdio: "pipe",
    });
    return join(root, "target/release/libcuriosity_runtime_native.dylib");
  });

  const [first, second] = dylibs;
  if (!first || !second) throw new Error("M7_TEST_BUILD_REQUIRED");
  expect(readFileSync(first)).toEqual(readFileSync(second));
  const uuids = dylibs.map(darwinUuid);
  expect(uuids[0]).toBe(uuids[1]);
  expect(uuids[0]).toMatch(/^[0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12}$/);
  expect(uuids[0]).not.toBe("00000000-0000-0000-0000-000000000000");
  for (const dylib of dylibs) {
    const bytes = readFileSync(dylib);
    for (const root of sourceRoots) expect(bytes.includes(Buffer.from(root))).toBe(false);
    expect(darwinLinkedLibraries(dylib)).toEqual([M7_NATIVE_INSTALL_ID, "/usr/lib/libSystem.B.dylib"]);
    expect(assertM7NativeLinks(darwinLinkedLibraries(dylib))).toBe(true);
    expect(assertM7NativeHasValidUuid(dylib)).toBe(true);
    const runtime = createRuntime({ libraryPath: dylib, now: () => 1_700_000_000_000 });
    await expect(runtime.webSearch({ apiVersion: "curiosity.runtime/v0", operation: "web_search", requestId: "m7-smoke", query: "bounded query", deadlineUnixMs: 1_700_000_001_000 })).resolves.toMatchObject({
      status: "unavailable", diagnostic: { code: "corpus_absent" }, results: [],
    });
    runtime.close();
  }
});

test("M7 release linker flags are isolated from the caller environment", () => {
  const environment = { PATH: process.env.PATH, RUSTFLAGS: "development-flags", CARGO_ENCODED_RUSTFLAGS: "development-encoded-flags" };
  const releaseEnvironment = m7NativeCargoEnvironment(environment);
  expect(environment).toEqual({ PATH: process.env.PATH, RUSTFLAGS: "development-flags", CARGO_ENCODED_RUSTFLAGS: "development-encoded-flags" });
  expect(releaseEnvironment.RUSTFLAGS).toBeUndefined();
  expect(releaseEnvironment.CARGO_ENCODED_RUSTFLAGS).not.toContain("development");
  expect(releaseEnvironment.CARGO_ENCODED_RUSTFLAGS).not.toContain("-no_uuid");
});

test("M7 native link verification rejects absolute and unapproved libraries", () => {
  expect(() => assertM7NativeLinks(["/absolute/build/libcuriosity_runtime_native.dylib", "/usr/lib/libSystem.B.dylib"])).toThrow("M7_NATIVE_LINK_INVALID");
  expect(() => assertM7NativeLinks([M7_NATIVE_INSTALL_ID, "/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation"])).toThrow("M7_NATIVE_LINK_INVALID");
});
