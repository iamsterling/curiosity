import { expect, test } from "bun:test";
import pluginPackageJson from "../../plugin/opencode2/package.json" with { type: "json" };
import pluginTurbo from "../../plugin/opencode2/turbo.json" with { type: "json" };
import packageJson from "../package.json" with { type: "json" };
import runtimeTurbo from "../turbo.json" with { type: "json" };

test("runtime Turbo build caches the development native library alongside inherited outputs", () => {
  expect(runtimeTurbo.tasks.build.outputs).toEqual([
    "$TURBO_EXTENDS$",
    "native/target/debug/libcuriosity_runtime_native.dylib",
  ]);
});

test("supported M7 entrypoints prepare release-native and plugin artifacts through Turbo package tasks", () => {
  expect(packageJson.scripts["build:native"]).toBe(
    '\"${CARGO:-cargo}\" build --manifest-path native/Cargo.toml --locked',
  );
  expect(packageJson.scripts["build:native:release"]).toBe(
    '\"${CARGO:-cargo}\" build --manifest-path native/Cargo.toml --release --locked --no-default-features',
  );
  expect(packageJson.scripts["m7:test"]).toBe(
    "turbo run m7:test:run --filter=@curiosity/runtime",
  );
  expect(packageJson.scripts.verify).toBe(
    "turbo run verify:run --filter=@curiosity/runtime",
  );
  expect(packageJson.scripts["verify:owned-web-qualification"]).toBe(
    "node tools/verify-owned-web-qualification.mjs",
  );
  expect(packageJson.scripts["check:owned-web-receipt"]).toBe(
    "node tools/owned-web-receipt.mjs --check",
  );
  expect(packageJson.scripts["verify:owned-lexical-reader-qualification"]).toBe(
    "node tools/verify-owned-lexical-reader-qualification.mjs",
  );
  expect(
    packageJson.scripts["verify:owned-lexical-builder-qualification"],
  ).toBe("node tools/verify-owned-lexical-builder-qualification.mjs");
  expect(runtimeTurbo.tasks["m7:test:run"].dependsOn).toEqual(["m7:prepare"]);
  expect(runtimeTurbo.tasks["verify:run"].dependsOn).toEqual(["m7:prepare"]);
  expect(runtimeTurbo.tasks["m7:prepare"].dependsOn).toEqual([
    "build:native:release",
    "@iamsterling/opencode2-config#m7:prepare",
  ]);
  expect(runtimeTurbo.tasks["build:native:release"].outputs).toEqual([
    "native/target/release/libcuriosity_runtime_native.dylib",
  ]);
  expect(pluginTurbo.tasks["m7:prepare"].dependsOn).toEqual(["build"]);
  expect(pluginTurbo.tasks.build.outputs).toEqual(["dist/**"]);
  expect(pluginPackageJson.scripts.build).toBe(
    "rm -rf dist && tsc -p tsconfig.build.json && node tools/write-build-provenance.mjs",
  );
});
