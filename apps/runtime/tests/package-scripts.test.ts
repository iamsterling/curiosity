import { expect, test } from "bun:test";
import pluginPackageJson from "../../plugin/opencode2/package.json" with { type: "json" };
import packageJson from "../package.json" with { type: "json" };
import runtimeTurbo from "../turbo.json" with { type: "json" };

test("runtime Turbo caches both Linux and Darwin native names without assuming dylib output", () => {
  expect(runtimeTurbo.tasks.build.outputs).toEqual([
    "$TURBO_EXTENDS$",
    "native/target/debug/libcuriosity_runtime_native.dylib",
    "native/target/debug/libcuriosity_runtime_native.so",
  ]);
  expect(runtimeTurbo.tasks["build:native:release"].outputs).toEqual([
    "native/target/release/libcuriosity_runtime_native.dylib",
    "native/target/release/libcuriosity_runtime_native.so",
  ]);
});

test("runtime verification profiles are explicit non-recursive package commands", () => {
  expect(packageJson.scripts.test).toBe(
    "bun run build:native && node tools/run-test-profile.mjs source",
  );
  expect(packageJson.scripts.verify).toBe(
    "node tools/verify-profile.mjs source",
  );
  expect(packageJson.scripts["verify:portable"]).toBe(
    "node tools/verify-profile.mjs portable-linux",
  );
  expect(packageJson.scripts["verify:darwin-compatibility"]).toBe(
    "node tools/verify-profile.mjs darwin-compatibility",
  );
  expect(packageJson.scripts["test:network-denied"]).toBe(
    "sh tools/network-denied-linux.sh",
  );
  for (const script of [packageJson.scripts.test, packageJson.scripts.verify]) {
    expect(script).not.toMatch(/turbo run/u);
    expect(script).not.toMatch(/m7:/u);
  }
});

test("M7 current-candidate and SDK qualification stay manual and outside ordinary verification", () => {
  expect(packageJson.scripts["m7:test"]).toBe(
    "node tools/run-test-profile.mjs m7-current-candidate",
  );
  expect(packageJson.scripts["m7:build"]).toBe(
    "bun tools/m7-release.mjs build",
  );
  expect(packageJson.scripts.verify).not.toContain("m7");
  expect(packageJson.scripts.verify).not.toContain("sdk");
  expect(pluginPackageJson.scripts["contract:types"]).toBe(
    "tsc -p tsconfig.contract.json --noEmit",
  );
  expect(pluginPackageJson.scripts["test:workflow-pins"]).toBe(
    "node --test tests/security/workflow-pins.test.mjs",
  );
});
