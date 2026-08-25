import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  r2Root,
  repositoryRoot,
  runRecorded,
  scratchRoot,
  sha256File,
  writeJsonExclusive,
} from "./receipt-lib.mjs";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const evidenceRoot = join(r2Root, "evidence");
const outputRoot = join(
  evidenceRoot,
  process.env.Q1_R2_POSTFAILURE_ATTEMPT ?? "postfailure",
);
const inventoryProbe = join(r2Root, "probes/inventory-boundary.mjs");
const generatedConfig = join(r2Root, "inputs/generated-surfaces.json");
const generatedBefore = join(evidenceRoot, "finalize/generated-before.json");
const generatedAfter = join(outputRoot, "generated-after.json");
const comparisonPath = join(outputRoot, "compare-restored.json");
const originalQ1Before = join(evidenceRoot, "finalize/original-q1-before.json");
const originalQ1After = join(outputRoot, "original-q1-after.json");
const q1Root = join(
  repositoryRoot,
  "docs/architecture/custom-harness/qualification/q1",
);
const node = "/Users/sterling/.nvm/versions/node/v24.18.0/bin/node";
const environment = { HOME: "/var/empty", LC_ALL: "C", PATH: "/usr/bin:/bin" };
let sequence = Number(process.env.Q1_R2_RECEIPT_SEQUENCE_START ?? "399");
const run = async (configuration) => {
  sequence += 1;
  const result = await runRecorded({ sequence, ...configuration });
  assert(result.receipt.verdict === "PASS", `${configuration.id} failed`);
  return result;
};
const stdout = (result) => readFileSync(result.stdoutPath, "utf8").trim();
const outsideR2Status = (text) =>
  text
    .trim()
    .split("\n")
    .filter(Boolean)
    .filter(
      (line) =>
        !line.includes("docs/architecture/custom-harness/qualification/q1/r2/"),
    );

assert(
  !existsSync(scratchRoot),
  "scratch must be absent before postfailure audit",
);
assert(!existsSync(outputRoot), "postfailure evidence already exists");
await run({
  id: "postfailure-generated-after",
  executable: node,
  argv: [
    inventoryProbe,
    "inventory-generated",
    "--config",
    generatedConfig,
    "--output",
    generatedAfter,
  ],
  environment,
  inputs: [inventoryProbe, generatedConfig, generatedBefore],
  expectedFiles: [{ path: generatedAfter }],
});
await run({
  id: "postfailure-compare-restored",
  executable: node,
  argv: [
    inventoryProbe,
    "compare-inventories",
    "--before",
    generatedBefore,
    "--after",
    generatedAfter,
    "--output",
    comparisonPath,
  ],
  environment,
  inputs: [generatedBefore, generatedAfter],
  expectedFiles: [{ path: comparisonPath }],
});
await run({
  id: "postfailure-original-q1-after",
  executable: node,
  argv: [
    inventoryProbe,
    "manifest-q1",
    "--q1",
    q1Root,
    "--output",
    originalQ1After,
  ],
  environment,
  inputs: [inventoryProbe, q1Root, originalQ1Before],
  expectedFiles: [{ path: originalQ1After }],
});
const status = await run({
  id: "postfailure-final-status",
  executable: "/usr/bin/git",
  argv: ["status", "--short", "--untracked-files=all"],
  environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
  inputs: [join(repositoryRoot, ".git/HEAD")],
});
const diff = await run({
  id: "postfailure-final-diff",
  executable: "/usr/bin/git",
  argv: ["diff", "--binary", "--no-ext-diff"],
  environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
  inputs: [join(repositoryRoot, ".git/HEAD")],
});
await run({
  id: "postfailure-scratch-absent",
  executable: "/bin/test",
  argv: ["!", "-e", scratchRoot],
  environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
  inputs: [],
});

const comparison = JSON.parse(readFileSync(comparisonPath, "utf8"));
assert(
  comparison.restorableFieldsEqual === true,
  "generated restorable fields differ after restore",
);
const generatedBaseline = JSON.parse(readFileSync(generatedBefore, "utf8"));
const generated = JSON.parse(readFileSync(generatedAfter, "utf8"));
const rootShape = ({ roots }) =>
  roots.map(({ path, state, entryCount = 0 }) => ({ path, state, entryCount }));
const rootStateShapeEqual =
  JSON.stringify(rootShape(generatedBaseline)) ===
  JSON.stringify(rootShape(generated));
assert(
  rootStateShapeEqual,
  "generated root state or entry count differs after restore",
);
const q1Before = JSON.parse(readFileSync(originalQ1Before, "utf8"));
const q1After = JSON.parse(readFileSync(originalQ1After, "utf8"));
assert(
  q1Before.aggregateSha256 === q1After.aggregateSha256,
  "original Q1 changed",
);
const trackedManifest = generated.entries.find(
  ({ path }) => path === "apps/plugin/opencode2/assets/manifest.json",
);
assert(
  trackedManifest.sha256 ===
    "cc9018882649228e6514e2e0df8ba983d1a8a90a9a7361ba75c7da78d8457e10",
  "tracked manifest bytes changed",
);
const controls = JSON.parse(
  readFileSync(join(evidenceRoot, "finalize/controls.json"), "utf8"),
);
const rootHashes = Object.fromEntries(
  ["bun.lock", "package.json", "turbo.json"].map((path) => [
    path,
    sha256File(join(repositoryRoot, path)),
  ]),
);
assert(
  JSON.stringify(rootHashes) === JSON.stringify(controls.protectedHashes),
  "protected root hashes changed",
);
const preflightStatus = readFileSync(
  join(evidenceRoot, "receipts/301-recovery-preflight-status/stdout.bin"),
  "utf8",
);
assert(
  JSON.stringify(outsideR2Status(preflightStatus)) ===
    JSON.stringify(outsideR2Status(stdout(status))),
  "outside-R2 status changed",
);
assert(stdout(diff) === "", "tracked diff is not empty");
assert(!existsSync(scratchRoot), "scratch was recreated");

const receiptRoot = join(evidenceRoot, "receipts");
const receiptRecords = readdirSync(receiptRoot)
  .sort()
  .map((directory) => join(receiptRoot, directory, "receipt.json"))
  .filter(existsSync)
  .map((path) => {
    const receipt = JSON.parse(readFileSync(path, "utf8"));
    for (const stream of Object.values(receipt.streams)) {
      assert(existsSync(stream.path), `receipt stream absent: ${stream.path}`);
      assert(
        sha256File(stream.path) === stream.sha256,
        `receipt stream hash mismatch: ${stream.path}`,
      );
    }
    return {
      sequence: receipt.sequence,
      receiptId: receipt.receiptId,
      verdict: receipt.verdict,
      receiptSha256: sha256File(path),
    };
  });
const failedReceipts = receiptRecords.filter(
  ({ verdict }) => verdict === "FAIL",
);
assert(
  JSON.stringify(failedReceipts.map(({ sequence }) => sequence)) ===
    JSON.stringify([36, 117, 220, 327]),
  "unexpected failed receipt set",
);
const rootFailure = JSON.parse(
  readFileSync(
    join(evidenceRoot, "receipts/327-recovery-root-test/receipt.json"),
    "utf8",
  ),
);
const rootFailureStdout = readFileSync(rootFailure.streams.stdout.path, "utf8");
const missingModules = [
  ...new Set(
    [...rootFailureStdout.matchAll(/Cannot find module '([^']+)'/gu)].map(
      (match) => match[1],
    ),
  ),
].sort();
assert(missingModules.length > 0, "root failure had no missing dist imports");

const result = {
  schemaVersion: "custom-harness-q1-r2-postfailure-boundary/v1",
  verdict: "STOPPED_FAIL_CLOSED",
  rootFailure: {
    receipt: join(evidenceRoot, "receipts/327-recovery-root-test/receipt.json"),
    command: rootFailure.command.argv,
    exitCode: rootFailure.process.exitCode,
    stdoutSha256: rootFailure.streams.stdout.sha256,
    stderrSha256: rootFailure.streams.stderr.sha256,
    missingModules,
    cause:
      "The mandatory clean generated-output boundary removed apps/plugin/opencode2/dist. The package test imports its own dist files, while Turbo test depends only on dependency builds (^build), not the package's own build. The fixed command order reaches test before build.",
    requiredOutOfScopeFix:
      "Change the product/build-test graph so the plugin's canonical test creates or depends on its own dist output; Q1-R2 cannot change product scripts or turbo.json.",
  },
  restoration: {
    rootStateShapeEqual,
    restorableFieldsEqual: comparison.restorableFieldsEqual,
    rawRootsEqual: comparison.rootsEqual,
    rawRootsDifferenceLimitedToExcludedMetadata:
      rootStateShapeEqual && comparison.restorableFieldsEqual,
    beforeRestorableSha256: comparison.beforeRestorableSha256,
    afterRestorableSha256: comparison.afterRestorableSha256,
    excludedFromExactRestorationClaim:
      comparison.excludedFromExactRestorationClaim,
    trackedManifestSha256: trackedManifest.sha256,
    originalQ1AggregateSha256: q1After.aggregateSha256,
    protectedRootHashes: rootHashes,
    outsideR2StatusUnchanged: true,
    trackedDiffEmpty: true,
    scratchAbsent: true,
  },
  receipts: {
    count: receiptRecords.length,
    pass: receiptRecords.filter(({ verdict }) => verdict === "PASS").length,
    fail: failedReceipts.length,
    failedReceipts,
    allStreamHashesValid: true,
  },
  unreachedByFailClosedOrder: [
    "root build",
    "root verify",
    "R2 format check",
    "R2 local-link check",
    "120-row PLAN-E02 parser",
  ],
  noI1: true,
  noProviderActivity: true,
};
await writeJsonExclusive(join(outputRoot, "FINAL-BOUNDARY.json"), result);
console.log(JSON.stringify(result));
