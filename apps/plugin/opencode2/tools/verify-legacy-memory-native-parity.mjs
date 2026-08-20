import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  hashMutationDiff,
  scoreMutationReceipts,
} from "./legacy-memory-mutant-scorer.mjs";
import { validateDependencyReceiptEvidence } from "./legacy-memory-dependency-receipt.mjs";

const plugin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(plugin, "../../..");
const runtime = path.join(workspace, "apps/runtime");
const fixture = path.join(runtime, "fixtures/legacy-memory-parity/v1");
const approvedTemp =
  "/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode";
const adapter = path.join(
  runtime,
  "native/target/debug/legacy_memory_parity_adapter",
);
const oracle = path.join(plugin, "tests/fixtures/legacy-memory-js-oracle.mjs");
const run = (command, args, options = {}) =>
  execFileSync(command, args, { cwd: workspace, stdio: "inherit", ...options });
const baselineCommit = "12ac2c4ca06d0f6ccfc479249a53aad977b70322";
const gitBaseline = (file) =>
  execFileSync("git", ["show", `${baselineCommit}:${file}`], {
    cwd: workspace,
    encoding: "utf8",
  });

const verifyBlobs = () => {
  const spec = readFileSync(
    path.join(runtime, "docs/specifications/legacy-memory-parity-v1.md"),
    "utf8",
  );
  const rows = [...spec.matchAll(/\| `([^`]+)`\s+\| `([0-9a-f]{40})` \|/g)];
  assert.ok(rows.length >= 20, "pinned blob table must remain exhaustive");
  for (const [, file, expected] of rows) {
    const actual = execFileSync("git", ["rev-parse", `12ac2c4:${file}`], {
      cwd: workspace,
      encoding: "utf8",
    }).trim();
    assert.equal(actual, expected, `${file} baseline blob`);
    const current = execFileSync("git", ["hash-object", file], {
      cwd: workspace,
      encoding: "utf8",
    }).trim();
    assert.equal(
      current,
      expected,
      `${file} working source changed from accepted baseline`,
    );
  }
};
if (process.argv.includes("--verify-baseline-blobs")) {
  verifyBlobs();
  console.log("legacy parity baseline blobs: verified");
  process.exit(0);
}

if (process.argv.includes("--verify-dependency-receipt")) {
  const receiptRoot = realpathSync(
    mkdtempSync(path.join(approvedTemp, "dep-receipt-")),
  );
  const baselineNative = path.join(receiptRoot, "native");
  const cargoTomlPath = path.join(runtime, "native/Cargo.toml");
  const cargoLockPath = path.join(runtime, "native/Cargo.lock");
  const baselineCargoToml = gitBaseline("apps/runtime/native/Cargo.toml");
  const baselineCargoLock = gitBaseline("apps/runtime/native/Cargo.lock");
  const rootScript =
    "node apps/plugin/opencode2/tools/verify-legacy-memory-native-parity.mjs --verify-dependency-receipt && bun run --cwd apps/plugin/opencode2 build && node apps/plugin/opencode2/tools/verify-legacy-memory-native-parity.mjs --verify-baseline-blobs && node apps/plugin/opencode2/tools/verify-legacy-memory-native-parity.mjs";
  const nodeApiScript =
    "bun apps/plugin/opencode2/tests/qualification/verify-legacy-memory-node-api-sdk.mjs";
  const runtimeScript =
    "node ../plugin/opencode2/tools/verify-legacy-memory-native-parity.mjs --verify-dependency-receipt && bun run --cwd ../plugin/opencode2 build && node ../plugin/opencode2/tools/verify-legacy-memory-native-parity.mjs --verify-baseline-blobs && node ../plugin/opencode2/tools/verify-legacy-memory-native-parity.mjs";
  const cargoTree = (manifest, args) => {
    const result = spawnSync(
      "cargo",
      [
        "tree",
        "--offline",
        "--locked",
        "--manifest-path",
        manifest,
        "-e",
        "normal,build",
        ...args,
      ],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  };
  try {
    cpSync(path.join(runtime, "native"), baselineNative, {
      recursive: true,
      filter: (source) => !source.includes(`${path.sep}target`),
    });
    writeFileSync(path.join(baselineNative, "Cargo.toml"), baselineCargoToml);
    writeFileSync(path.join(baselineNative, "Cargo.lock"), baselineCargoLock);
    const baselineManifest = path.join(baselineNative, "Cargo.toml");
    const cargoHome = process.env.CARGO_HOME ?? path.join(homedir(), ".cargo");
    const cacheRoot = path.join(cargoHome, "registry/cache");
    const archives = readdirSync(cacheRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(cacheRoot, entry.name, "ryu-js-1.0.3.crate"))
      .filter((candidate) => {
        try {
          return lstatSync(candidate).isFile();
        } catch {
          return false;
        }
      });
    assert.equal(archives.length, 1, "DEPENDENCY_ARCHIVE_NOT_UNIQUE");
    const archive = archives[0];
    const archiveCargoToml = execFileSync(
      "tar",
      ["-xOf", archive, "ryu-js-1.0.3/Cargo.toml"],
      { encoding: "utf8" },
    );
    const license = archiveCargoToml.match(/^license = "([^"]+)"$/m)?.[1];
    assert.ok(license, "DEPENDENCY_ARCHIVE_LICENSE_MISSING");
    const baselineRootManifest = gitBaseline("package.json");
    const baselineRuntimeManifest = gitBaseline("apps/runtime/package.json");
    const expectedRootManifest = baselineRootManifest.replace(
      '    "check-types": "turbo run check-types"\n',
      `    "check-types": "turbo run check-types",\n    "verify:legacy-memory-parity": ${JSON.stringify(rootScript)},\n    "verify:legacy-memory-node-api-sdk": ${JSON.stringify(nodeApiScript)}\n`,
    );
    const expectedRuntimeManifest = baselineRuntimeManifest.replace(
      '    "verify:owned-lexical-builder-qualification": "node tools/verify-owned-lexical-builder-qualification.mjs",\n',
      `    "verify:owned-lexical-builder-qualification": "node tools/verify-owned-lexical-builder-qualification.mjs",\n    "verify:legacy-memory-parity": ${JSON.stringify(runtimeScript)},\n`,
    );
    assert.notEqual(expectedRootManifest, baselineRootManifest);
    assert.notEqual(expectedRuntimeManifest, baselineRuntimeManifest);
    const evidence = {
      baselineCargoToml,
      currentCargoToml: readFileSync(cargoTomlPath, "utf8"),
      baselineCargoLock,
      currentCargoLock: readFileSync(cargoLockPath, "utf8"),
      archiveSha256: createHash("sha256")
        .update(readFileSync(archive))
        .digest("hex"),
      archiveLicense: license,
      trees: {
        baselineDefault: cargoTree(baselineManifest, []),
        currentDefault: cargoTree(cargoTomlPath, []),
        baselineNoDefault: cargoTree(baselineManifest, [
          "--no-default-features",
        ]),
        currentNoDefault: cargoTree(cargoTomlPath, ["--no-default-features"]),
        baselineRelease: cargoTree(baselineManifest, ["--no-default-features"]),
        currentRelease: cargoTree(cargoTomlPath, ["--no-default-features"]),
        currentParity: cargoTree(cargoTomlPath, [
          "--no-default-features",
          "--features",
          "legacy-memory-parity",
        ]),
      },
      baselineRootManifest,
      currentRootManifest: readFileSync(
        path.join(workspace, "package.json"),
        "utf8",
      ),
      expectedRootManifest,
      rootScript,
      baselineRuntimeManifest,
      currentRuntimeManifest: readFileSync(
        path.join(runtime, "package.json"),
        "utf8",
      ),
      expectedRuntimeManifest,
      runtimeScript,
      baselinePluginManifest: gitBaseline("apps/plugin/opencode2/package.json"),
      currentPluginManifest: readFileSync(
        path.join(plugin, "package.json"),
        "utf8",
      ),
      baselineBunLock: gitBaseline("bun.lock"),
      currentBunLock: readFileSync(path.join(workspace, "bun.lock"), "utf8"),
    };
    const receipt = validateDependencyReceiptEvidence(evidence);
    const receiptPath = path.join(
      approvedTemp,
      "legacy-memory-dependency-receipt.json",
    );
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    process.stdout.write(
      `${JSON.stringify({ status: "verified", receiptPath, receipt })}\n`,
    );
  } finally {
    rmSync(receiptRoot, { recursive: true, force: true });
  }
  process.exit(0);
}

run("cargo", [
  "build",
  "--manifest-path",
  "apps/runtime/native/Cargo.toml",
  "--locked",
  "--features",
  "legacy-memory-parity",
  "--bin",
  "legacy_memory_parity_adapter",
]);

const native = (raw, root) => {
  const policy = root
    ? `(version 1)(allow default)(deny network*)(deny file-write* (subpath ${JSON.stringify(root)}))`
    : "(version 1)(allow default)(deny network*)";
  const result = spawnSync("sandbox-exec", ["-p", policy, adapter], {
    input: raw,
    encoding: "utf8",
    env: { CURIOSITY_PARITY_FIXTURE_ROOT: root ?? "" },
  });
  assert.equal(result.stderr, "", "adapter stderr must be empty");
  assert.match(result.stdout, /^\{.*\}\n$/s);
  const envelope = JSON.parse(result.stdout);
  if (result.status === 1) {
    assert.equal(envelope.diagnostic.code, "PARITY_INTERNAL_FAILURE");
  } else {
    assert.equal(result.status, 0, `adapter exit: ${result.stdout}`);
  }
  return envelope;
};
const javascript = (request, root) => {
  const result = spawnSync(process.execPath, [oracle], {
    input: `${JSON.stringify(request)}\n`,
    encoding: "utf8",
    env: { ...process.env, CURIOSITY_PARITY_FIXTURE_ROOT: root ?? "" },
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
};
const numberBits = ["c30cf011799305b2"];
let random = 0x6d2b79f5n;
for (let index = 0; index < 2048; index += 1) {
  random ^= random << 13n;
  random ^= random >> 7n;
  random ^= random << 17n;
  random &= 0xffffffffffffffffn;
  numberBits.push(random.toString(16).padStart(16, "0"));
}
const numberOracle = spawnSync(process.execPath, [oracle, "--number-batch"], {
  input: JSON.stringify(numberBits),
  encoding: "utf8",
});
assert.equal(numberOracle.status, 0, numberOracle.stderr);
const numberExpected = JSON.parse(numberOracle.stdout);
for (const [index, bits] of numberBits.entries()) {
  const request = {
    protocolVersion: 1,
    requestId: `f64-${index}`,
    operation: "canonicalize",
    input: { value: { kind: "f64", bits } },
  };
  const result = native(`${JSON.stringify(request)}\n`);
  assert.equal(
    Buffer.from(result.result.bytesBase64, "base64").toString(),
    numberExpected[index],
    `f64 bits ${bits}`,
  );
}
const vectors = [
  "canonical-vectors.json",
  "entity-vectors.json",
  "event-vectors.json",
  "replay-vectors.json",
].flatMap((name) => JSON.parse(readFileSync(path.join(fixture, name))));
const inputBytes = vectors
  .map(({ request }) => `${JSON.stringify(request)}\n`)
  .join("");
const expectedBytes = vectors
  .map(({ request }) => {
    const {
      protocolVersion: _,
      requestId: __,
      ...observation
    } = javascript(request);
    return `${JSON.stringify(observation)}\n`;
  })
  .join("");
const manifest = JSON.parse(readFileSync(path.join(fixture, "manifest.json")));
assert.equal(
  manifest.inputDigest,
  `sha256:${createHash("sha256").update(inputBytes).digest("hex")}`,
);
assert.equal(
  manifest.expectedOutputDigest,
  `sha256:${createHash("sha256").update(expectedBytes).digest("hex")}`,
);
for (const { id, request } of [...vectors, ...vectors].reverse()) {
  const expected = javascript(request);
  const actual = native(`${JSON.stringify(request)}\n`);
  assert.deepEqual(
    actual,
    { protocolVersion: 1, requestId: request.requestId, ...expected },
    id,
  );
}
for (const item of JSON.parse(
  readFileSync(path.join(fixture, "adapter-vectors.json")),
)) {
  const diagnostic = native(item.raw).diagnostic;
  assert.equal(diagnostic.code, item.code, item.id);
  if (Object.hasOwn(item, "path"))
    assert.equal(diagnostic.path, item.path, item.id);
}
for (const [raw, code] of [
  [Buffer.from([0xff, 0x0a]), "PARITY_UTF8_INVALID"],
  ["{}\n{}\n", "PARITY_FRAME_INVALID"],
  ["{}\r\n", "PARITY_FRAME_INVALID"],
  [`${"x".repeat(1_048_576)}\n`, "PARITY_INPUT_TOO_LARGE"],
])
  assert.equal(native(raw).diagnostic.code, code);

const inventory = (root) => {
  const out = [];
  const visit = (directory, relative = "") => {
    for (const name of readdirSync(directory).sort()) {
      const absolute = path.join(directory, name);
      const child = relative ? `${relative}/${name}` : name;
      const stat = lstatSync(absolute, { bigint: false });
      out.push({
        path: child,
        kind: stat.isSymbolicLink()
          ? "symlink"
          : stat.isDirectory()
            ? "directory"
            : "file",
        mode: stat.mode,
        size: stat.size,
        sha256: stat.isFile()
          ? createHash("sha256").update(readFileSync(absolute)).digest("hex")
          : null,
      });
      if (stat.isDirectory()) visit(absolute, child);
    }
  };
  visit(root);
  return out;
};
const copy = realpathSync(
  mkdtempSync(path.join(tmpdir(), "curiosity-legacy-parity-")),
);
const ancestorProbe = realpathSync(
  mkdtempSync(path.join(tmpdir(), "curiosity-legacy-parity-ancestor-")),
);
try {
  cpSync(path.join(fixture, "roots"), copy, { recursive: true });
  mkdirSync(path.join(copy, "capture-missing-all"));
  for (const root of ["capture-missing-gaps", "capture-malformed-gaps"]) {
    mkdirSync(path.join(copy, root, "events"), { recursive: true });
    writeFileSync(
      path.join(copy, root, "events/z.json"),
      JSON.stringify({ id: "z" }),
    );
    writeFileSync(
      path.join(copy, root, "events/a.json"),
      JSON.stringify({ id: "a" }),
    );
  }
  writeFileSync(
    path.join(copy, "capture-malformed-gaps/gaps.json"),
    "not-json",
  );
  mkdirSync(path.join(copy, "capture-malformed-event/events"), {
    recursive: true,
  });
  writeFileSync(
    path.join(copy, "capture-malformed-event/events/a.json"),
    "not-json",
  );
  mkdirSync(path.join(copy, "capture-entry-kinds/events"), { recursive: true });
  symlinkSync("missing", path.join(copy, "capture-entry-kinds/events/a.json"));
  execFileSync("mkfifo", [
    path.join(copy, "capture-entry-kinds/events/b.json"),
  ]);
  mkdirSync(path.join(copy, "capture-special/events"), { recursive: true });
  execFileSync("mkfifo", [path.join(copy, "capture-special/events/a.json")]);
  mkdirSync(path.join(copy, ".opencode/live"), { recursive: true });
  symlinkSync(".opencode/live", path.join(copy, "live-indirection"));
  mkdirSync(path.join(copy, "version-precedence/events"), { recursive: true });
  writeFileSync(path.join(copy, "version-precedence/schema-version"), "2\n");
  writeFileSync(
    path.join(copy, "version-precedence/events/bad.json"),
    "not-json",
  );
  symlinkSync("ledger-valid", path.join(copy, "linked-root"));
  symlinkSync(copy, path.join(ancestorProbe, "linked-fixtures"));
  const ancestorRequest = {
    protocolVersion: 1,
    requestId: "ancestor-symlink",
    operation: "inspectLedger",
    input: { root: "ledger-valid" },
  };
  assert.deepEqual(
    native(
      `${JSON.stringify(ancestorRequest)}\n`,
      path.join(ancestorProbe, "linked-fixtures"),
    ).diagnostic,
    { code: "PARITY_FIXTURE_ROOT_UNAVAILABLE", path: null },
  );
  for (const item of JSON.parse(
    readFileSync(path.join(fixture, "inspector-vectors.json")),
  )) {
    const request = {
      protocolVersion: 1,
      requestId: item.id,
      operation: item.operation,
      input: { root: item.root },
    };
    const before = inventory(copy);
    const actual = native(`${JSON.stringify(request)}\n`, copy);
    if (item.code) assert.equal(actual.diagnostic.code, item.code, item.id);
    else
      assert.deepEqual(
        actual,
        {
          protocolVersion: 1,
          requestId: item.id,
          ...javascript(request, copy),
        },
        item.id,
      );
    assert.deepEqual(inventory(copy), before, `${item.id}: zero side effects`);
  }
  for (const root of [
    "capture-missing-all",
    "capture-missing-gaps",
    "capture-malformed-gaps",
  ]) {
    const request = {
      protocolVersion: 1,
      requestId: root,
      operation: "inspectEventCapture",
      input: { root },
    };
    const before = inventory(copy);
    assert.deepEqual(native(`${JSON.stringify(request)}\n`, copy), {
      protocolVersion: 1,
      requestId: root,
      ...javascript(request, copy),
    });
    assert.deepEqual(inventory(copy), before, `${root}: zero side effects`);
  }
  for (const [root, code, pathValue] of [
    ["capture-malformed-event", "CAPTURE_CORRUPT", "events/a.json"],
    ["capture-entry-kinds", "PARITY_SYMLINK_FORBIDDEN", "events/a.json"],
    ["capture-special", "PARITY_FILESYSTEM_KIND_INVALID", "events/a.json"],
    ["live-indirection", "PARITY_SYMLINK_FORBIDDEN", "live-indirection"],
  ]) {
    const request = {
      protocolVersion: 1,
      requestId: `kind-${root}`,
      operation: "inspectEventCapture",
      input: { root },
    };
    const result = native(`${JSON.stringify(request)}\n`, copy);
    assert.deepEqual(result.diagnostic, { code, path: pathValue });
  }
  for (const entry of readdirSync(copy))
    chmodSync(path.join(copy, entry), 0o555);
  const request = {
    protocolVersion: 1,
    requestId: "write-denied",
    operation: "inspectLedger",
    input: { root: "ledger-valid" },
  };
  const before = inventory(copy);
  assert.equal(native(`${JSON.stringify(request)}\n`, copy).status, "ok");
  assert.deepEqual(inventory(copy), before);
  for (const [id, root, code] of [
    ["live", ".opencode/state", "PARITY_LIVE_ROOT_FORBIDDEN"],
    ["traversal", "../ledger-valid", "PARITY_PATH_INVALID"],
    ["linked", "linked-root", "PARITY_SYMLINK_FORBIDDEN"],
    ["precedence", "version-precedence", "LEDGER_VERSION_UNSUPPORTED"],
  ]) {
    const probe = {
      protocolVersion: 1,
      requestId: id,
      operation: "inspectLedger",
      input: { root },
    };
    assert.equal(
      native(`${JSON.stringify(probe)}\n`, copy).diagnostic.code,
      code,
      id,
    );
  }
} finally {
  for (const entry of readdirSync(copy))
    chmodSync(path.join(copy, entry), 0o755);
  rmSync(copy, { recursive: true, force: true });
  rmSync(ancestorProbe, { recursive: true, force: true });
}

const mutation = (id, file, find, replace, vector, field) => ({
  id,
  file,
  find,
  replace,
  vector,
  field,
});
const sourceMutants = [];
const mutantTest = (id) => {
  if (id.startsWith("reducer-transition") || id === "reducer-release-explicit")
    return "reducer_transition_mutation_vectors_are_independently_observable";
  if (id.startsWith("reducer-"))
    return "reducer_noop_overwrite_default_and_advancement_vectors_are_independent";
  if (id === "canonical-number")
    return "preserves_javascript_number_boundaries";
  if (id === "canonical-key-sort")
    return "qualified_collation_is_permutation_stable_and_unqualified_pairs_fail_closed";
  if (id.startsWith("canonical-"))
    return "canonicalizes_legacy_bytes_and_rejects_unknown_entity_keys";
  if (id === "entity-unknown-key")
    return "canonicalizes_legacy_bytes_and_rejects_unknown_entity_keys";
  if (
    id.startsWith("entity-") ||
    id.startsWith("event-") ||
    id.startsWith("replay-")
  )
    return "decoder_and_replay_failure_precedence_is_stable";
  if (id.startsWith("adapter-"))
    return "adapter_protocol_tests::reports_exact_first_protocol_and_tag_pointer";
  return "inspector_precedence_sorting_fallback_and_ancestor_policy_are_read_only";
};
for (const kind of [
  "intent.captured",
  "intent.framed",
  "intent.activated",
  "intent.reconciled",
  "intent.archived",
  "work.proposed",
  "claim.acquired",
  "evidence.submitted",
  "fact.recorded",
  "capture-gap.recorded",
  "capture-gap.resolved",
  "approval.requested",
  "approval.confirmed",
  "resolution.proposed",
])
  sourceMutants.push(
    mutation(
      `reducer-transition-${kind}`,
      "replay.rs",
      `"${kind}" =>`,
      `"${kind}" if false =>`,
      `transition:${kind}`,
      "view",
    ),
  );
sourceMutants.push(
  mutation(
    "reducer-transition-claim.released",
    "replay.rs",
    'set_mut(value, "released", Json::Bool(true));',
    'set_mut(value, "released", Json::Bool(false));',
    "transition:claim.released",
    "view",
  ),
);
sourceMutants.push(
  mutation(
    "reducer-noop-intent.framed",
    "replay.rs",
    '"intent.framed" => {\n                if let Some(value)',
    '"intent.framed" => {\n                if map_get_mut(&mut view.intents, &text(&data, "intentID")).is_none() { map_set(&mut view.intents, text(&data, "intentID"), Json::Object(vec![])); }\n                if let Some(value)',
    "missing-state:intent.framed",
    "view.intents",
  ),
  ...[
    ["intent.activated", "active"],
    ["intent.reconciled", "reconciled"],
    ["intent.archived", "archived"],
  ].map(([kind, state]) =>
    mutation(
      `reducer-noop-${kind}`,
      "replay.rs",
      `"${kind}" => lifecycle(&mut view.intents, &data, "${state}"),`,
      `"${kind}" => { lifecycle(&mut view.intents, &data, "${state}"); if map_get_mut(&mut view.intents, &text(&data, "intentID")).is_none() { map_set(&mut view.intents, text(&data, "intentID"), Json::Object(vec![])); } },`,
      `missing-state:${kind}`,
      "view.intents",
    ),
  ),
  ...[
    ["claim.released", "claims", "workID"],
    ["capture-gap.resolved", "capture_gaps", "id"],
    ["approval.confirmed", "approvals", "id"],
  ].map(([kind, map, key]) =>
    mutation(
      `reducer-noop-${kind}`,
      "replay.rs",
      `"${kind}" => {\n                if let Some(value)`,
      `"${kind}" => {\n                if map_get_mut(&mut view.${map}, &text(&data, "${key}")).is_none() { map_set(&mut view.${map}, text(&data, "${key}"), Json::Object(vec![])); }\n                if let Some(value)`,
      `missing-state:${kind}`,
      `view.${map}`,
    ),
  ),
  mutation(
    "reducer-overwrite-intent",
    "replay.rs",
    "map_set(&mut view.intents, key, value);",
    "if map_get_mut(&mut view.intents, &key).is_none() { map_set(&mut view.intents, key, value); }",
    "overwrite:intent",
    "view.intent.marker",
  ),
  mutation(
    "reducer-overwrite-work",
    "replay.rs",
    '"work.proposed" => map_set(&mut view.work, text(&data, "id"), data.clone()),',
    '"work.proposed" => { if map_get_mut(&mut view.work, &text(&data, "id")).is_none() { map_set(&mut view.work, text(&data, "id"), data.clone()); } },',
    "overwrite:work",
    "view.work.marker",
  ),
  mutation(
    "reducer-overwrite-claim",
    "replay.rs",
    'map_set(&mut view.claims, text(&data, "workID"), value);',
    'if map_get_mut(&mut view.claims, &text(&data, "workID")).is_none() { map_set(&mut view.claims, text(&data, "workID"), value); }',
    "overwrite:claim",
    "view.claim.marker",
  ),
  mutation(
    "reducer-overwrite-fact",
    "replay.rs",
    '"fact.recorded" => map_set(&mut view.facts, text(&data, "id"), data.clone()),',
    '"fact.recorded" => { if map_get_mut(&mut view.facts, &text(&data, "id")).is_none() { map_set(&mut view.facts, text(&data, "id"), data.clone()); } },',
    "overwrite:fact",
    "view.fact.marker",
  ),
  mutation(
    "reducer-overwrite-gap",
    "replay.rs",
    'map_set(&mut view.capture_gaps, text(&data, "id"), data.clone())',
    'if map_get_mut(&mut view.capture_gaps, &text(&data, "id")).is_none() { map_set(&mut view.capture_gaps, text(&data, "id"), data.clone()) }',
    "overwrite:gap",
    "view.gap.marker",
  ),
  mutation(
    "reducer-overwrite-approval",
    "replay.rs",
    'map_set(&mut view.approvals, text(&data, "id"), value);',
    'if map_get_mut(&mut view.approvals, &text(&data, "id")).is_none() { map_set(&mut view.approvals, text(&data, "id"), value); }',
    "overwrite:approval",
    "view.approval.marker",
  ),
  mutation(
    "reducer-overwrite-resolution",
    "replay.rs",
    'map_set(&mut view.resolutions, text(&data, "intentID"), value);',
    'if map_get_mut(&mut view.resolutions, &text(&data, "intentID")).is_none() { map_set(&mut view.resolutions, text(&data, "intentID"), value); }',
    "overwrite:resolution",
    "view.resolution.marker",
  ),
);
sourceMutants.push(
  mutation(
    "reducer-evidence-overwrite",
    "replay.rs",
    "view.evidence.push(data.clone())",
    "view.evidence = vec![data.clone()]",
    "evidence-duplicates",
    "view.evidence.length",
  ),
  mutation(
    "reducer-release-explicit",
    "replay.rs",
    '.get("releasedAt")',
    '.get("missingReleasedAt")',
    "claim-release-explicit",
    "view.claims[0].releasedAt",
  ),
  mutation(
    "reducer-release-default",
    "replay.rs",
    '.unwrap_or_else(|| event.get("at").cloned().unwrap_or(Json::Undefined))',
    ".unwrap_or(Json::Undefined)",
    "claim-release-default",
    "view.claims[0].releasedAt",
  ),
  mutation(
    "reducer-unknown-noop",
    "replay.rs",
    "_ => {}",
    "_ => view.evidence.push(Json::Null)",
    "unknown-event",
    "view.evidence",
  ),
  mutation(
    "reducer-empty-view",
    "replay.rs",
    "sequence: 0.0",
    "sequence: 1.0",
    "empty-view",
    "sequence",
  ),
  mutation(
    "reducer-sequence-recognized-noop",
    "replay.rs",
    'view.sequence = event\n            .get("sequence")\n            .and_then(Json::number)\n            .unwrap_or(view.sequence);',
    'if kind != "intent.framed" { view.sequence = event\n            .get("sequence")\n            .and_then(Json::number)\n            .unwrap_or(view.sequence); }',
    "recognized-noop-advance",
    "sequence",
  ),
  mutation(
    "reducer-sequence-ignored",
    "replay.rs",
    'view.sequence = event\n            .get("sequence")\n            .and_then(Json::number)\n            .unwrap_or(view.sequence);',
    'if kind != "unknown" { view.sequence = event\n            .get("sequence")\n            .and_then(Json::number)\n            .unwrap_or(view.sequence); }',
    "ignored-advance",
    "sequence",
  ),
  mutation(
    "reducer-digest-recognized-noop",
    "replay.rs",
    'view.digest = event\n            .get("digest")\n            .and_then(Json::string)\n            .unwrap_or_else(|| view.digest.clone());',
    'if kind != "intent.framed" { view.digest = event\n            .get("digest")\n            .and_then(Json::string)\n            .unwrap_or_else(|| view.digest.clone()); }',
    "recognized-noop-advance",
    "digest",
  ),
  mutation(
    "reducer-digest-ignored",
    "replay.rs",
    'view.digest = event\n            .get("digest")\n            .and_then(Json::string)\n            .unwrap_or_else(|| view.digest.clone());',
    'if kind != "unknown" { view.digest = event\n            .get("digest")\n            .and_then(Json::string)\n            .unwrap_or_else(|| view.digest.clone()); }',
    "ignored-advance",
    "digest",
  ),
  mutation(
    "canonical-key-sort",
    "canonical.rs",
    "retained.sort_by(|(a, _), (b, _)| js_key_cmp(a, b));",
    "retained.sort_by(|_, _| std::cmp::Ordering::Equal);",
    "keys-ascii",
    "bytesBase64",
  ),
  mutation(
    "canonical-undefined-omission",
    "canonical.rs",
    ".filter(|(_, value)| {\n                    !matches!(value, Json::Undefined | Json::Function | Json::Symbol)\n                })\n                .collect();",
    ".filter(|(_, value)| {\n                    !matches!(value, Json::Function | Json::Symbol)\n                })\n                .collect();",
    "object-undefined",
    "bytesBase64",
  ),
  mutation(
    "canonical-array-hole",
    "canonical.rs",
    'Json::Undefined | Json::Function | Json::Symbol | Json::Hole\n                ) {\n                    out.push_str("null");',
    'Json::Undefined | Json::Function | Json::Symbol | Json::Hole\n                ) {\n                    out.push_str("[]");',
    "array-hole",
    "bytesBase64",
  ),
  mutation(
    "canonical-number",
    "canonical.rs",
    "ryu_js::Buffer::new().format_finite(value).to_owned()",
    'if value.to_bits() == 0xc30cf011799305b2 { "0".into() } else { ryu_js::Buffer::new().format_finite(value).to_owned() }',
    "f64-c30cf011799305b2",
    "bytesBase64",
  ),
  mutation(
    "canonical-unicode",
    "canonical.rs",
    '0xd800..=0xdfff => out.push_str(&format!("\\\\u{unit:04x}"))',
    "0xd800..=0xdfff => out.push('�')",
    "lone-surrogate",
    "bytesBase64",
  ),
  mutation(
    "entity-version",
    "entity.rs",
    'if value.get("schemaVersion").and_then(Json::number) != Some(1.0)',
    'if false && value.get("schemaVersion").and_then(Json::number) != Some(1.0)',
    "entity-version-precedence",
    "diagnostic.code",
  ),
  mutation(
    "entity-unknown-key",
    "entity.rs",
    "if !keys.contains(&key.as_str())",
    "if false && !keys.contains(&key.as_str())",
    "entity-unknown-key",
    "diagnostic.path",
  ),
  mutation(
    "event-version",
    "event.rs",
    'if value.get("schemaVersion").and_then(Json::number) != Some(1.0)',
    'if false && value.get("schemaVersion").and_then(Json::number) != Some(1.0)',
    "event-version-precedence",
    "diagnostic.code",
  ),
  mutation(
    "event-unknown-key",
    "event.rs",
    "if entries",
    "if false && entries",
    "event-unknown-key",
    "diagnostic.code",
  ),
  mutation(
    "replay-version",
    "replay.rs",
    'if input.get("schemaVersion").and_then(Json::number) != Some(1.0)',
    'if false && input.get("schemaVersion").and_then(Json::number) != Some(1.0)',
    "replay-version-precedence",
    "diagnostic.path",
  ),
  mutation(
    "replay-sequence",
    "replay.rs",
    'if input.get("sequence").and_then(Json::number) != Some((index + 1) as f64)',
    'if false && input.get("sequence").and_then(Json::number) != Some((index + 1) as f64)',
    "replay-sequence-precedence",
    "diagnostic.path",
  ),
  mutation(
    "replay-previous",
    "replay.rs",
    'if input\n            .get("previousDigest")',
    'if false && input\n            .get("previousDigest")',
    "replay-previous-precedence",
    "diagnostic.path",
  ),
  mutation(
    "replay-digest",
    "replay.rs",
    'if input.get("digest").is_some()',
    'if false && input.get("digest").is_some()',
    "replay-digest",
    "diagnostic.path",
  ),
  mutation(
    "replay-entity-decode",
    "replay.rs",
    'let entity = decode_ledger_entity(data, &format!("events[{index}].data"))?;',
    "let entity = data.clone();",
    "replay-entity-invalid",
    "diagnostic.code",
  ),
  mutation(
    "inspector-version-before-events",
    "inspector.rs",
    'if text != "1"',
    'if false && text != "1"',
    "ledger-version-precedence",
    "diagnostic.code",
  ),
  mutation(
    "capture-sorting",
    "inspector.rs",
    "names.sort();",
    "names.sort_by(|a, b| b.cmp(a));",
    "capture-sorting",
    "events[0].id",
  ),
  mutation(
    "capture-gap-fallback",
    "inspector.rs",
    "Json::parse(&bytes).unwrap_or(Json::Array(vec![]))",
    "Json::parse(&bytes).unwrap_or(Json::Null)",
    "capture-malformed-gaps",
    "gaps",
  ),
  mutation(
    "inspector-path-policy",
    "inspector.rs",
    'part.is_empty() || matches!(part, "." | "..")',
    "part.is_empty()",
    "traversal",
    "diagnostic.code",
  ),
  mutation(
    "inspector-symlink-policy",
    "inspector.rs",
    "if metadata.file_type().is_symlink() {\n            return Err(fail(Code::ParityFixtureRootUnavailable, None));\n        }",
    "if metadata.file_type().is_symlink() {\n            return Err(fail(Code::ParityFilesystemReadFailed, None));\n        }",
    "ancestor-symlink",
    "diagnostic.code",
  ),
  mutation(
    "inspector-special-file",
    "inspector.rs",
    "if !metadata.is_file() {\n            return Err(fail(Code::ParityFilesystemKindInvalid, Some(path)));\n        }",
    "if !metadata.is_file() {\n            return Err(fail(Code::ParityFilesystemReadFailed, Some(path)));\n        }",
    "capture-special",
    "diagnostic.code",
  ),
  mutation(
    "inspector-write-prohibition",
    "inspector.rs",
    "pub(crate) fn inspect_ledger(requested: &str) -> Result<LedgerInspection, Failure> {\n    let root = qualification_root(requested)?;\n    let mut inventory = Vec::new();",
    'pub(crate) fn inspect_ledger(requested: &str) -> Result<LedgerInspection, Failure> {\n    let root = qualification_root(requested)?;\n    fs::write(root.join("mutant-write"), b"x").unwrap();\n    let mut inventory = Vec::new();',
    "zero-write",
    "filesystem.inventory",
  ),
  mutation(
    "capture-entry-symlink-policy",
    "inspector.rs",
    "if metadata.file_type().is_symlink() {\n            return Err(fail(Code::ParitySymlinkForbidden, Some(path)));\n        }",
    "if metadata.file_type().is_symlink() {\n            return Err(fail(Code::ParityFilesystemReadFailed, Some(path)));\n        }",
    "capture-entry-symlink",
    "diagnostic.code",
  ),
  mutation(
    "adapter-field-order-pointer",
    "protocol.rs",
    'Some(&format!("/{}", actual.to_string_lossy()))',
    'Some(&format!("/{name}"))',
    "protocol-wrong-order",
    "diagnostic.path",
  ),
  mutation(
    "adapter-tag-missing-pointer",
    "protocol.rs",
    'if !entries\n            .iter()\n            .any(|(actual, _)| actual.to_string_lossy() == *name)\n        {\n            return Err(fail(\n                Code::ParityInputSchemaInvalid,\n                Some(format!("{path}/{name}")),\n            ));\n        }',
    "if !entries\n            .iter()\n            .any(|(actual, _)| actual.to_string_lossy() == *name)\n        {\n            return Err(fail(\n                Code::ParityInputSchemaInvalid,\n                Some(path.into()),\n            ));\n        }",
    "tag-f64-missing-bits",
    "diagnostic.path",
  ),
  mutation(
    "adapter-hole-context",
    "protocol.rs",
    '"hole" if allow_hole => Ok(Json::Hole)',
    '"hole" => Ok(Json::Hole)',
    "tag-hole-outside",
    "diagnostic.code",
  ),
);

const jsFreezeMutant = {
  id: "javascript-fact-freeze-removal",
  vector: "fact-freeze-characterization",
  field: "Object.isFrozen",
};
const declaredMutants = [
  ...sourceMutants.map(({ id, vector, field }) => ({ id, vector, field })),
  jsFreezeMutant,
];
if (process.argv.includes("--print-mutants")) {
  console.log(JSON.stringify(declaredMutants));
  process.exit(0);
}
const mutationContract = JSON.parse(
  readFileSync(path.join(fixture, "reducer-mutation-vectors.json")),
);
assert.deepEqual(mutationContract.mutants, declaredMutants);
const mutationReport = [];
if (!process.argv.includes("--skip-mutants")) {
  const mutantRoot = realpathSync(mkdtempSync(path.join(approvedTemp, "lmm-")));
  const mutantCrate = path.join(mutantRoot, "native");
  cpSync(path.join(runtime, "native"), mutantCrate, {
    recursive: true,
    filter: (source) => !source.includes(`${path.sep}target`),
  });
  const testPath = path.join(mutantCrate, "src/legacy_memory/tests.rs");
  const unchangedTests = createHash("sha256")
    .update(readFileSync(testPath))
    .digest("hex");
  const cargoTest = (mutant, extra = []) => {
    const target = mutant.id.startsWith("adapter-")
      ? ["--bin", "legacy_memory_parity_adapter"]
      : ["--lib"];
    return spawnSync(
      "cargo",
      [
        "test",
        "--offline",
        "--locked",
        "--manifest-path",
        path.join(mutantCrate, "Cargo.toml"),
        "--features",
        "legacy-memory-parity",
        ...target,
        ...extra,
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          CARGO_TARGET_DIR: path.join(mutantRoot, "target"),
          CURIOSITY_PARITY_TEST_ROOT: path.join(approvedTemp, "lmt"),
        },
      },
    );
  };
  try {
    const baselinePass = new Map();
    for (const mutant of sourceMutants) {
      const testName = mutantTest(mutant.id);
      const result = cargoTest(mutant, [testName, "--", "--nocapture"]);
      const output = `${result.stdout}\n${result.stderr}`;
      assert.equal(
        result.status,
        0,
        `${mutant.id}: designated baseline test failed before mutation scoring\n${output}`,
      );
      baselinePass.set(mutant.id, true);
    }
    const ownership = cargoTest({ id: "rust-fact-immutability" }, [
      "reduced_facts_own_their_top_level_construction_data",
      "--",
      "--nocapture",
    ]);
    assert.equal(
      ownership.status,
      0,
      `Rust fact ownership qualification failed\n${ownership.stdout}\n${ownership.stderr}`,
    );
    for (const mutant of sourceMutants) {
      const sourcePath = path.join(
        mutantCrate,
        "src/legacy_memory",
        mutant.file,
      );
      const original = readFileSync(
        path.join(runtime, "native/src/legacy_memory", mutant.file),
        "utf8",
      );
      const occurrences = original.split(mutant.find).length - 1;
      assert.equal(
        occurrences,
        1,
        `${mutant.id}: mutation site must be unique`,
      );
      const mutated = original.replace(mutant.find, mutant.replace);
      writeFileSync(sourcePath, mutated);
      const compile = cargoTest(mutant, ["--no-run"]);
      assert.equal(
        compile.status,
        0,
        `${mutant.id}: mutant did not compile\n${compile.stdout}\n${compile.stderr}`,
      );
      const testName = mutantTest(mutant.id);
      const result = cargoTest(mutant, [testName, "--", "--nocapture"]);
      const output = `${result.stdout}\n${result.stderr}`;
      assert.notEqual(result.status, 0, `${mutant.id} survived`);
      assert.match(
        output,
        /test result: FAILED/,
        `${mutant.id} did not execute tests`,
      );
      const assertionToken = `${mutant.vector}|${mutant.field}`;
      assert.ok(
        output.includes(assertionToken),
        `${mutant.id}: unrelated assertion failed; expected ${assertionToken}\n${output}`,
      );
      assert.ok(
        output.includes(testName.split("::").at(-1)),
        `${mutant.id}: designated test was not the observed failure`,
      );
      assert.equal(
        createHash("sha256").update(readFileSync(testPath)).digest("hex"),
        unchangedTests,
        `${mutant.id}: tests changed`,
      );
      mutationReport.push({
        id: mutant.id,
        sourceFile: path.relative(
          workspace,
          path.join(runtime, "native/src/legacy_memory", mutant.file),
        ),
        sourceHash: createHash("sha256").update(mutated).digest("hex"),
        diffHash: hashMutationDiff(mutant),
        diffLocation: {
          line: original.slice(0, original.indexOf(mutant.find)).split("\n")
            .length,
          before: mutant.find,
          after: mutant.replace,
        },
        baselineTestPass: baselinePass.get(mutant.id),
        unchangedTestSourceHash: unchangedTests,
        mutantCompilePass: true,
        designatedTest: testName,
        observedTest: testName,
        designatedVector: mutant.vector,
        observedVector: mutant.vector,
        expectedMismatchField: mutant.field,
        observedField: mutant.field,
        observedAssertion: output
          .split("\n")
          .find((line) => line.includes(assertionToken))
          ?.trim(),
        verdict: "killed",
      });
      writeFileSync(sourcePath, original);
    }
  } finally {
    rmSync(mutantRoot, { recursive: true, force: true });
  }
}
const rustMutationScore = process.argv.includes("--skip-mutants")
  ? { killed: 0, total: sourceMutants.length }
  : scoreMutationReceipts(mutationReport);
if (!process.argv.includes("--skip-mutants")) {
  const freezeRoot = realpathSync(
    mkdtempSync(path.join(tmpdir(), "curiosity-legacy-memory-freeze-")),
  );
  const ledgerRoot = path.join(freezeRoot, "ledger");
  mkdirSync(path.join(ledgerRoot, "events"), { recursive: true });
  writeFileSync(path.join(ledgerRoot, "schema-version"), "1\n");
  const { digestCanonical } = await import(
    pathToFileURL(path.join(plugin, "dist/core/canonical/index.js"))
  );
  const base = {
    schemaVersion: 1,
    id: "fact-event",
    sequence: 1,
    aggregate: "i",
    type: "fact.recorded",
    at: "2026-08-19T00:00:00.000Z",
    actor: { kind: "model", sessionID: "s" },
    data: { id: "f", nested: { value: 1 } },
    previousDigest: "GENESIS",
  };
  writeFileSync(
    path.join(ledgerRoot, "events/000000000001-fact.json"),
    JSON.stringify({ ...base, digest: digestCanonical(base) }),
  );
  const freezeProbe = (modulePath) => {
    const script = `
      import { pathToFileURL } from "node:url";
      const [modulePath, root] = process.argv.slice(1);
      const { Ledger } = await import(pathToFileURL(modulePath));
      const originalParse = JSON.parse;
      let parsed;
      JSON.parse = (...args) => { const value = originalParse(...args); if (value?.type === "fact.recorded") parsed = value; return value };
      const view = await new Ledger(root).snapshot();
      JSON.parse = originalParse;
      const fact = [...view.facts.values()][0];
      const nested = fact.nested;
      try { fact.id = "changed" } catch {}
      try { fact.added = true } catch {}
      nested.changed = true;
      const nestedIdentity = nested === parsed.data.nested;
      const nestedMutable = !Object.isFrozen(nested) && nested.changed === true;
      try { delete fact.nested } catch {}
      process.stdout.write(JSON.stringify({
        frozen: Object.isFrozen(fact),
        distinctTop: fact !== parsed.data,
        nestedIdentity,
        topProtected: fact.id === "f" && !("added" in fact) && "nested" in fact,
        nestedMutable,
      }));
    `;
    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "--eval", script, modulePath, ledgerRoot],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  const baselineModule = path.join(plugin, "dist/features/ledger/index.js");
  const freezeBaseline = freezeProbe(baselineModule);
  assert.deepEqual(freezeBaseline, {
    frozen: true,
    distinctTop: true,
    nestedIdentity: true,
    topProtected: true,
    nestedMutable: true,
  });
  const mutantDist = path.join(freezeRoot, "mutant-dist");
  cpSync(path.join(plugin, "dist"), mutantDist, { recursive: true });
  const mutantModule = path.join(mutantDist, "features/ledger/index.js");
  const mutantSource = readFileSync(mutantModule, "utf8");
  const freezeSite = "Object.freeze({ ...d })";
  assert.equal(mutantSource.split(freezeSite).length - 1, 1);
  const freezeMutated = mutantSource.replace(freezeSite, "({ ...d })");
  writeFileSync(mutantModule, freezeMutated);
  const freezeObserved = freezeProbe(mutantModule);
  assert.equal(freezeObserved.frozen, false, "freeze-removal mutant survived");
  mutationReport.push({
    id: jsFreezeMutant.id,
    normativeRule: "javascript-shallow-freeze-characterization",
    sourceFile: "apps/plugin/opencode2/dist/features/ledger/index.js",
    sourceHash: createHash("sha256").update(freezeMutated).digest("hex"),
    diffHash: createHash("sha256")
      .update(`${freezeSite}\0({ ...d })`)
      .digest("hex"),
    diffLocation: {
      line: mutantSource.slice(0, mutantSource.indexOf(freezeSite)).split("\n")
        .length,
      before: freezeSite,
      after: "({ ...d })",
    },
    baselineTestPass: true,
    unchangedTestSourceHash: createHash("sha256")
      .update(mutantSource)
      .digest("hex"),
    mutantCompilePass: true,
    designatedTest: "javascript shallow freeze characterization",
    observedTest: "javascript shallow freeze characterization",
    designatedVector: jsFreezeMutant.vector,
    observedVector: jsFreezeMutant.vector,
    expectedMismatchField: jsFreezeMutant.field,
    observedField: jsFreezeMutant.field,
    observedAssertion: `baseline=${JSON.stringify(freezeBaseline)} mutant=${JSON.stringify(freezeObserved)}`,
    verdict: "killed",
  });
  rmSync(freezeRoot, { recursive: true, force: true });
}
const mutationReceiptPath = path.join(
  approvedTemp,
  "legacy-memory-mutation-receipts.json",
);
if (!process.argv.includes("--skip-mutants")) {
  writeFileSync(
    mutationReceiptPath,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        rustMutationScore,
        rustImmutabilityCheck: {
          test: "reduced_facts_own_their_top_level_construction_data",
          pass: true,
          normativeRule: "rust-api-ownership-not-a-mutant",
        },
        receipts: mutationReport,
      },
      null,
      2,
    )}\n`,
  );
}
const runtimePackage = JSON.parse(
  readFileSync(path.join(runtime, "package.json")),
);
const pluginPackage = JSON.parse(
  readFileSync(path.join(plugin, "package.json")),
);
assert.deepEqual(Object.keys(runtimePackage.exports).sort(), [
  ".",
  "./admin",
  "./owned-query",
  "./query",
]);
assert.ok(
  !Object.keys(pluginPackage.exports).some((key) => key.includes("parity")),
);
assert.ok(
  !pluginPackage.files.some((entry) => entry.includes("legacy-memory")),
);
const pluginSources = readdirSync(path.join(plugin, "src"), { recursive: true })
  .filter((entry) => entry.toString().endsWith(".ts"))
  .map((entry) =>
    readFileSync(path.join(plugin, "src", entry.toString()), "utf8"),
  )
  .join("\n");
assert.doesNotMatch(
  pluginSources,
  /legacy.memory.parity|memory_parity_adapter/i,
);
const rust = [
  "canonical.rs",
  "diagnostic.rs",
  "entity.rs",
  "event.rs",
  "inspector.rs",
  "json.rs",
  "replay.rs",
  "mod.rs",
]
  .map((name) =>
    readFileSync(path.join(runtime, "native/src/legacy_memory", name), "utf8"),
  )
  .join("\n");
assert.doesNotMatch(
  rust,
  /std::net|TcpStream|UdpSocket|Command::new|fs::(?:write|create|remove|rename|copy)|OpenOptions/,
);
console.log(
  `legacy memory parity: ${vectors.length} differential vectors, 9 inspector states, ${mutationReport.length}/${declaredMutants.length} isolated mutants killed, zero writes; receipts: ${mutationReceiptPath}`,
);
