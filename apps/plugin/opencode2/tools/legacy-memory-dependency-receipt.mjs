import assert from "node:assert/strict";
import { createHash } from "node:crypto";

export const DEPENDENCY = Object.freeze({
  name: "ryu-js",
  version: "1.0.3",
  checksum: "04d056b875a9d2e6cb9a61d127afee9ac5999b9f87bcb32079d1318e505be714",
  license: "Apache-2.0 OR BSL-1.0",
});

export const expectedCargoToml = (baseline) =>
  baseline
    .replace(
      '[lib]\ncrate-type = ["cdylib", "rlib"]\n',
      '[lib]\ncrate-type = ["cdylib", "rlib"]\n\n[[bin]]\nname = "legacy_memory_parity_adapter"\npath = "src/bin/legacy_memory_parity_adapter.rs"\nrequired-features = ["legacy-memory-parity"]\n',
    )
    .replace(
      'owned-lexical-builder-qualification = ["owned-lexical-reader-qualification"]\n',
      'owned-lexical-builder-qualification = ["owned-lexical-reader-qualification"]\nlegacy-memory-parity = ["dep:ryu-js"]\n',
    )
    .replace(
      'scraper = { version = "=0.27.0", optional = true, default-features = false }\n',
      'scraper = { version = "=0.27.0", optional = true, default-features = false }\nryu-js = { version = "=1.0.3", optional = true }\n',
    );

export const expectedCargoLock = (baseline) =>
  baseline
    .replace(
      ' "rusqlite",\n "scraper",\n]',
      ' "rusqlite",\n "ryu-js",\n "scraper",\n]',
    )
    .replace(
      '[[package]]\nname = "scopeguard"',
      `[[package]]\nname = "ryu-js"\nversion = "${DEPENDENCY.version}"\nsource = "registry+https://github.com/rust-lang/crates.io-index"\nchecksum = "${DEPENDENCY.checksum}"\n\n[[package]]\nname = "scopeguard"`,
    );

export const normalizeCargoTree = (tree) =>
  tree
    .trim()
    .replace(
      /^curiosity-runtime-native v0\.0\.0 \([^\n]+\)/,
      "curiosity-runtime-native v0.0.0",
    );

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const manifestWithoutReceiptScript = (source, expectedScript) => {
  const value = JSON.parse(source);
  assert.equal(
    value.scripts?.["verify:legacy-memory-parity"],
    expectedScript,
    "DEPENDENCY_JS_SCRIPT_INVALID",
  );
  delete value.scripts["verify:legacy-memory-parity"];
  if (value.scripts?.["verify:legacy-memory-node-api-sdk"] !== undefined) {
    assert.equal(
      value.scripts["verify:legacy-memory-node-api-sdk"],
      "bun apps/plugin/opencode2/tests/qualification/verify-legacy-memory-node-api-sdk.mjs",
      "DEPENDENCY_NODE_API_SCRIPT_INVALID",
    );
    delete value.scripts["verify:legacy-memory-node-api-sdk"];
  }
  return value;
};

const lockPackage = (lock, name) => {
  const blocks = lock.split("\n[[package]]\n");
  const block = blocks.find((item) =>
    new RegExp(`(?:^|\\n)name = "${name}"(?:\\n|$)`).test(item),
  );
  assert.ok(block, `DEPENDENCY_LOCK_PACKAGE_MISSING:${name}`);
  return block;
};

export const validateDependencyReceiptEvidence = (evidence) => {
  assert.equal(
    evidence.currentCargoToml,
    expectedCargoToml(evidence.baselineCargoToml),
    "DEPENDENCY_CARGO_MANIFEST_DELTA",
  );
  assert.equal(
    evidence.currentCargoLock,
    expectedCargoLock(evidence.baselineCargoLock),
    "DEPENDENCY_CARGO_LOCK_DELTA",
  );
  const packageBlock = lockPackage(evidence.currentCargoLock, DEPENDENCY.name);
  assert.match(packageBlock, /version = "1\.0\.3"/);
  assert.match(packageBlock, new RegExp(`checksum = "${DEPENDENCY.checksum}"`));
  assert.doesNotMatch(packageBlock, /\ndependencies = \[/);
  assert.equal(
    evidence.archiveSha256,
    DEPENDENCY.checksum,
    "DEPENDENCY_ARCHIVE_SHA256",
  );
  assert.equal(
    evidence.archiveLicense,
    DEPENDENCY.license,
    "DEPENDENCY_ARCHIVE_LICENSE",
  );

  const baselineDefault = normalizeCargoTree(evidence.trees.baselineDefault);
  const baselineNoDefault = normalizeCargoTree(
    evidence.trees.baselineNoDefault,
  );
  assert.equal(
    normalizeCargoTree(evidence.trees.currentDefault),
    baselineDefault,
    "DEPENDENCY_DEFAULT_TREE_DELTA",
  );
  assert.equal(
    normalizeCargoTree(evidence.trees.currentNoDefault),
    baselineNoDefault,
    "DEPENDENCY_NO_DEFAULT_TREE_DELTA",
  );
  assert.equal(
    normalizeCargoTree(evidence.trees.baselineRelease),
    baselineNoDefault,
    "DEPENDENCY_BASELINE_RELEASE_TREE_DELTA",
  );
  assert.equal(
    normalizeCargoTree(evidence.trees.currentRelease),
    baselineNoDefault,
    "DEPENDENCY_RELEASE_TREE_DELTA",
  );
  for (const tree of [
    evidence.trees.currentDefault,
    evidence.trees.currentNoDefault,
    evidence.trees.currentRelease,
  ])
    assert.doesNotMatch(tree, /ryu-js/, "DEPENDENCY_PROFILE_LEAK");
  assert.equal(
    normalizeCargoTree(evidence.trees.currentParity),
    `${baselineNoDefault}\n└── ryu-js v1.0.3`,
    "DEPENDENCY_PARITY_TREE_DELTA",
  );

  assert.equal(
    evidence.currentRootManifest,
    evidence.expectedRootManifest,
    "DEPENDENCY_ROOT_MANIFEST_BYTES_DELTA",
  );
  assert.equal(
    evidence.currentRuntimeManifest,
    evidence.expectedRuntimeManifest,
    "DEPENDENCY_RUNTIME_MANIFEST_BYTES_DELTA",
  );
  assert.deepEqual(
    manifestWithoutReceiptScript(
      evidence.currentRootManifest,
      evidence.rootScript,
    ),
    JSON.parse(evidence.baselineRootManifest),
    "DEPENDENCY_ROOT_MANIFEST_DELTA",
  );
  assert.deepEqual(
    manifestWithoutReceiptScript(
      evidence.currentRuntimeManifest,
      evidence.runtimeScript,
    ),
    JSON.parse(evidence.baselineRuntimeManifest),
    "DEPENDENCY_RUNTIME_MANIFEST_DELTA",
  );
  assert.equal(
    evidence.currentPluginManifest,
    evidence.baselinePluginManifest,
    "DEPENDENCY_PLUGIN_MANIFEST_DELTA",
  );
  assert.equal(
    evidence.currentBunLock,
    evidence.baselineBunLock,
    "DEPENDENCY_BUN_LOCK_DELTA",
  );

  return {
    schemaVersion: 1,
    dependency: { ...DEPENDENCY, dependencies: [] },
    cargo: {
      manifestSha256: sha256(evidence.currentCargoToml),
      lockSha256: sha256(evidence.currentCargoLock),
      declaration: 'ryu-js = { version = "=1.0.3", optional = true }',
      featureEdge: 'legacy-memory-parity = ["dep:ryu-js"]',
      noOtherDependencyDelta: true,
    },
    archive: {
      file: "ryu-js-1.0.3.crate",
      sha256: evidence.archiveSha256,
      license: evidence.archiveLicense,
    },
    trees: Object.fromEntries(
      Object.entries(evidence.trees).map(([name, tree]) => [
        name,
        {
          sha256: sha256(normalizeCargoTree(tree)),
          value: normalizeCargoTree(tree),
        },
      ]),
    ),
    javascript: {
      rootManifestSha256: sha256(evidence.currentRootManifest),
      runtimeManifestSha256: sha256(evidence.currentRuntimeManifest),
      pluginManifestSha256: sha256(evidence.currentPluginManifest),
      bunLockSha256: sha256(evidence.currentBunLock),
      baselineUnchangedExceptAuthorizedScripts: true,
    },
    verdict: "pass",
  };
};
