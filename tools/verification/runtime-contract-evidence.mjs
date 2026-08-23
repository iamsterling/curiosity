import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ABI_SYMBOLS } from "./native-abi.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const EVIDENCE = "docs/verification/runtime-plugin-contract-v1.json";

const exactKeys = (value) => Object.keys(value).sort();

export const verifyRuntimeContractEvidence = async () => {
  const evidence = JSON.parse(await readFile(path.join(ROOT, EVIDENCE), "utf8"));
  const runtimeManifest = JSON.parse(await readFile(path.join(ROOT, "apps/runtime/package.json"), "utf8"));
  const pluginManifest = JSON.parse(await readFile(path.join(ROOT, "apps/plugin/opencode2/package.json"), "utf8"));
  const querySource = await readFile(path.join(ROOT, "apps/runtime/src/query.ts"), "utf8");
  const runtimeSource = await readFile(path.join(ROOT, "apps/runtime/src/index.ts"), "utf8");
  const adapterSource = await readFile(path.join(ROOT, "apps/plugin/opencode2/src/features/search/runtime-adapter.ts"), "utf8");

  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.contract, "curiosity-runtime-plugin-query/v1");
  assert.equal(runtimeManifest.name, evidence.runtimePackage.name);
  assert.deepEqual(exactKeys(runtimeManifest.exports), [...evidence.runtimePackage.exports].sort());
  assert.equal(runtimeManifest.exports["./query"].types, evidence.runtimePackage.queryTypes);
  for (const exportName of [...evidence.runtimePackage.queryRuntimeExports, ...evidence.runtimePackage.queryTypeExports]) {
    assert.match(querySource, new RegExp(`\\b${exportName}\\b`, "u"), exportName);
  }
  for (const key of evidence.definitions.queryOptionKeys) assert.match(runtimeSource, new RegExp(`\\b${key}\\??:`, "u"), key);
  for (const method of evidence.definitions.executorMethods) assert.match(adapterSource, new RegExp(`\\b${method}\\b`, "u"), method);
  assert.match(adapterSource, new RegExp(`"${evidence.definitions.adapterError}"`, "u"));
  assert.match(adapterSource, new RegExp(`QUERY_RUNTIME_SPECIFIER = "${evidence.lookup.packageSpecifier.replace("/", "\\/")}"`, "u"));
  assert.match(runtimeSource, /nativeLibraryPath\(configuredProfile as "development" \| "release"\)/u);
  assert.match(runtimeSource, /release never probes a development build/u);
  assert.match(runtimeSource, /apiVersions: \[API_VERSION\]/u);
  assert.match(runtimeSource, /operations: \[OPERATION\]/u);
  for (const [key, value] of Object.entries(evidence.capabilities.limits)) {
    assert.match(runtimeSource, new RegExp(`${key}: ${String(value).replace("000", "_000")}`, "u"), key);
  }
  assert.match(runtimeSource, /candidate\.role === "researcher"/u);
  assert.match(runtimeSource, /sameCapability\(candidate\.queryCapability, queryCapability\)/u);
  assert.deepEqual(evidence.abi, ABI_SYMBOLS);
  assert.equal(pluginManifest.dependencies?.[evidence.runtimePackage.name], undefined);
  assert.equal(evidence.publicPluginBoundary.runtimeDependency, false);
  assert.equal(evidence.publicPluginBoundary.runtimeSelectors, false);
  assert.equal(evidence.publicPluginBoundary.runtimeBundling, false);
  return evidence;
};
