import { expect, test } from "bun:test";
import { realpath } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runPublicConsumerProbe } from "./effect-consumer-probe-r2";

test("Q1-R2-T01 corrected public consumer remains one runtime", async () => {
  const result = await runPublicConsumerProbe();
  const consumerRoot = dirname(fileURLToPath(import.meta.url));
  const packageRoot = await realpath(join(consumerRoot, "node_modules/effect"));
  expect(result.packageVersion).toBe("4.0.0-beta.107");
  expect(result.selectedImports).toEqual([
    "effect/Context",
    "effect/Effect",
    "effect/Layer",
    "effect/ManagedRuntime",
  ]);
  for (const resolution of result.resolutions) {
    const resolved = await realpath(fileURLToPath(resolution.resolved));
    expect(resolved.startsWith(`${packageRoot}/`)).toBe(true);
  }
  expect({
    acquisitions: result.acquisitions,
    releases: result.releases,
    transitions: result.transitions,
    oneCachedContext: result.oneCachedContext,
    activeManagedRuntimeCount: result.activeManagedRuntimeCount,
    rejectedAfterDispose: result.rejectedAfterDispose,
  }).toEqual({
    acquisitions: 1,
    releases: 1,
    transitions: 2,
    oneCachedContext: true,
    activeManagedRuntimeCount: 1,
    rejectedAfterDispose: true,
  });
});
