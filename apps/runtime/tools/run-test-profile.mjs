#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const runtimeRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(runtimeRoot, "../..");
const inventoryPath = resolve(repositoryRoot, "docs/verification/inventory.json");

export const testsForProfile = (inventory, profile, platform = process.platform) => {
  const selected = inventory.tests
    .filter((entry) => entry.profiles.includes(profile))
    .filter((entry) => entry.path.startsWith("apps/runtime/tests/"));
  if (selected.length === 0) throw new Error(`RUNTIME_TEST_PROFILE_EMPTY:${profile}`);
  const incompatible = selected.filter((entry) => !entry.platforms.includes(platform));
  if (incompatible.length > 0) throw new Error(`RUNTIME_TEST_PROFILE_PLATFORM:${profile}:${incompatible.map(({ path }) => path).join(",")}`);
  return selected.map(({ path }) => path.slice("apps/runtime/".length));
};

export const runTestProfile = (profile, platform = process.platform) => {
  const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
  const tests = testsForProfile(inventory, profile, platform);
  const result = spawnSync("bun", ["test", ...tests], {
    cwd: runtimeRoot,
    encoding: "utf8",
    env: { ...process.env, CURIOSITY_RUNTIME_NATIVE_PROFILE: "development" },
    maxBuffer: 8 * 1024 * 1024,
    timeout: 180_000,
  });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`RUNTIME_TEST_PROFILE_FAILED:${profile}:${result.status}`);
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const skipped = [...output.matchAll(/(?:^|\s)(\d+)\s+skip(?:ped)?(?:\s|$)/gimu)]
    .reduce((maximum, match) => Math.max(maximum, Number(match[1])), 0);
  if (skipped > 0) throw new Error(`RUNTIME_TEST_PROFILE_SKIPPED:${profile}:${skipped}`);
  console.log(`runtime test profile ${profile} passed (${tests.length} files; zero skipped)`);
  return tests;
};

const [profile, ...extra] = process.argv.slice(2);
if (!profile || extra.length > 0) {
  console.error("usage: node tools/run-test-profile.mjs PROFILE");
  process.exitCode = 2;
} else {
  try {
    runTestProfile(profile);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
