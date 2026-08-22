import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import test from "node:test";
import {
  DEPENDENCY,
  expectedCargoLock,
  expectedCargoToml,
  validateDependencyReceiptEvidence,
} from "../../tools/legacy-memory-dependency-receipt.mjs";

const tempBase = path.join(os.tmpdir(), "opencode");
mkdirSync(tempBase, { recursive: true });

const baselineCargoToml = `[package]\nname = "curiosity-runtime-native"\nversion = "0.0.0"\n\n[lib]\ncrate-type = ["cdylib", "rlib"]\n\n[features]\nowned-lexical-builder-qualification = ["owned-lexical-reader-qualification"]\n\n[dependencies]\nscraper = { version = "=0.27.0", optional = true, default-features = false }\n`;
const baselineCargoLock = `version = 4\n\n[[package]]\nname = "curiosity-runtime-native"\nversion = "0.0.0"\ndependencies = [\n "rusqlite",\n "scraper",\n]\n\n[[package]]\nname = "scopeguard"\nversion = "1.2.0"\n`;
const baselineManifest = JSON.stringify({
  scripts: { build: "x" },
  dependencies: { a: "1" },
});
const rootScript = "dependency root script";
const runtimeScript = "dependency runtime script";
const withScript = (script) =>
  JSON.stringify({
    scripts: { build: "x", "verify:legacy-memory-parity": script },
    dependencies: { a: "1" },
  });
const evidence = () => ({
  baselineCargoToml,
  currentCargoToml: expectedCargoToml(baselineCargoToml),
  baselineCargoLock,
  currentCargoLock: expectedCargoLock(baselineCargoLock),
  archiveSha256: DEPENDENCY.checksum,
  archiveLicense: DEPENDENCY.license,
  trees: {
    baselineDefault: "curiosity-runtime-native v0.0.0 (/baseline)",
    currentDefault: "curiosity-runtime-native v0.0.0 (/current)",
    baselineNoDefault: "curiosity-runtime-native v0.0.0 (/baseline)",
    currentNoDefault: "curiosity-runtime-native v0.0.0 (/current)",
    baselineRelease: "curiosity-runtime-native v0.0.0 (/baseline)",
    currentRelease: "curiosity-runtime-native v0.0.0 (/current)",
    currentParity:
      "curiosity-runtime-native v0.0.0 (/current)\n└── ryu-js v1.0.3",
  },
  baselineRootManifest: baselineManifest,
  currentRootManifest: withScript(rootScript),
  expectedRootManifest: withScript(rootScript),
  rootScript,
  baselineRuntimeManifest: baselineManifest,
  currentRuntimeManifest: withScript(runtimeScript),
  expectedRuntimeManifest: withScript(runtimeScript),
  runtimeScript,
  baselinePluginManifest: baselineManifest,
  currentPluginManifest: baselineManifest,
  baselineBunLock: "lock",
  currentBunLock: "lock",
});

const mutateFileEvidence = (name, mutate, pattern) =>
  test(`dependency receipt rejects mutated ${name}`, () => {
    const root = mkdtempSync(path.join(tempBase, "dep-self-"));
    try {
      const file = path.join(root, `${name}.json`);
      const value = evidence();
      mutate(value);
      writeFileSync(file, JSON.stringify(value));
      assert.throws(
        () => validateDependencyReceiptEvidence(JSON.parse(readFileSync(file))),
        pattern,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

mutateFileEvidence(
  "manifest",
  (value) => {
    value.currentCargoToml = value.currentCargoToml.replace("=1.0.3", "=1.0.4");
  },
  /DEPENDENCY_CARGO_MANIFEST_DELTA/,
);
mutateFileEvidence(
  "lock",
  (value) => {
    value.currentCargoLock = value.currentCargoLock.replace(
      DEPENDENCY.checksum,
      "0".repeat(64),
    );
  },
  /DEPENDENCY_CARGO_LOCK_DELTA/,
);
mutateFileEvidence(
  "receipt",
  (value) => {
    value.archiveSha256 = "0".repeat(64);
  },
  /DEPENDENCY_ARCHIVE_SHA256/,
);
mutateFileEvidence(
  "tree",
  (value) => {
    value.trees.currentParity += "\n    └── transitive v1.0.0";
  },
  /DEPENDENCY_PARITY_TREE_DELTA/,
);
mutateFileEvidence(
  "javascript-manifest",
  (value) => {
    value.currentPluginManifest = JSON.stringify({
      scripts: { build: "x" },
      dependencies: { a: "2" },
    });
  },
  /DEPENDENCY_PLUGIN_MANIFEST_DELTA/,
);
mutateFileEvidence(
  "other-cargo-delta",
  (value) => {
    value.currentCargoToml += 'other = "1"\n';
  },
  /DEPENDENCY_CARGO_MANIFEST_DELTA/,
);
