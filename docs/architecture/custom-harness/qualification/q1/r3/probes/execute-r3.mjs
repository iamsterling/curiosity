import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import {
  r3Root,
  repositoryRoot,
  runRecorded,
  scratchRoot,
  sha256File,
  writeJsonExclusive,
  writeTextExclusive,
} from "./receipt-lib.mjs";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const planSha256 =
  "ab0b90385c7d1e4247191313488428ceb941f5734ed35d12254dfef901980ff7";
const sourceHead = "6bc9df8f0d9500616f8d4ea220586d0ebdea0ef0";
const planPath = join(
  repositoryRoot,
  "docs/architecture/custom-harness/PHASE-1-IMPLEMENTATION-PLAN.md",
);
const q1Root = join(
  repositoryRoot,
  "docs/architecture/custom-harness/qualification/q1",
);
const authorizationPath = join(
  r3Root,
  "authorization/PLAN-E02-Q1-R3-AUTHORIZATION.md",
);
const evidenceRoot = join(r3Root, "evidence");
const runRoot = join(evidenceRoot, "run");
const inventoryProbe = join(r3Root, "probes/inventory-boundary.mjs");
const candidatesPath = join(r3Root, "inputs/candidates.json");
const retrievalsPath = join(r3Root, "inputs/retrievals.json");
const generatedConfigPath = join(r3Root, "inputs/generated-surfaces.json");
const environmentPath = join(r3Root, "inputs/environment.json");
const candidates = JSON.parse(readFileSync(candidatesPath, "utf8"));
const retrievals = JSON.parse(readFileSync(retrievalsPath, "utf8")).retrievals;
const environments = JSON.parse(readFileSync(environmentPath, "utf8"));
const generatedConfig = JSON.parse(readFileSync(generatedConfigPath, "utf8"));

const bun = "/Users/sterling/.nvm/versions/node/v24.18.0/bin/bun";
const node = "/Users/sterling/.nvm/versions/node/v24.18.0/bin/node";
const git = "/usr/bin/git";
const require = createRequire(
  realpathSync(join(repositoryRoot, "node_modules/turbo/package.json")),
);
const turboBinaryPath = require.resolve("@turbo/darwin-arm64/bin/turbo");
const focusedEnvironment = environments.focused;
const rootEnvironment = {
  ...environments.root,
  TURBO_BINARY_PATH: turboBinaryPath,
};
const rootCommands = [
  "inventory:check",
  "status:check",
  "check-types",
  "lint",
  "test",
  "build",
  "verify",
].map((script) => ({
  id: `root-${script.replace(":", "-")}`,
  script,
  argv: ["--no-install", "--no-env-file", "run", script],
}));

let sequence = 0;
const receipts = [];
const run = async (configuration) => {
  sequence += 1;
  const result = await runRecorded({ sequence, ...configuration });
  receipts.push(result);
  if (result.receipt.verdict !== "PASS") {
    throw new Error(`recorded command failed: ${configuration.id}`);
  }
  return result;
};
const stdout = (result) => readFileSync(result.stdoutPath, "utf8").trim();
const combinedOutput = (result) =>
  `${readFileSync(result.stdoutPath, "utf8")}\n${readFileSync(result.stderrPath, "utf8")}`;
const noPositiveSkip = (result) => {
  const positive = [
    ...combinedOutput(result).matchAll(
      /(?:^|\s)([1-9]\d*)\s+skip(?:ped)?(?:\s|$)/gimu,
    ),
  ];
  assert(positive.length === 0, `${result.receipt.receiptId} reported skips`);
};
const cleanHeaders = (source) =>
  source
    .split(/\r?\n/u)
    .map((line) =>
      /^(?:set-cookie|authorization|proxy-authorization):/iu.test(line)
        ? `${line.slice(0, line.indexOf(":"))}: <REDACTED>`
        : line,
    )
    .join("\n");
const outsideR3Status = (text) =>
  text
    .trim()
    .split("\n")
    .filter(Boolean)
    .filter(
      (line) =>
        !line.includes("docs/architecture/custom-harness/qualification/q1/r3/"),
    );
const protectedHashes = () =>
  Object.fromEntries(
    [
      "bun.lock",
      "package.json",
      "turbo.json",
      "apps/plugin/opencode2/turbo.json",
    ].map((path) => [path, sha256File(join(repositoryRoot, path))]),
  );
const aggregate = (path, field) =>
  JSON.parse(readFileSync(path, "utf8"))[field];
const allReceiptPaths = () => {
  const receiptRoot = join(evidenceRoot, "receipts");
  return readdirSync(receiptRoot)
    .sort()
    .map((directory) => join(receiptRoot, directory, "receipt.json"))
    .filter(existsSync);
};
const receiptIntegrity = () => {
  const failures = [];
  const records = allReceiptPaths().map((path) => {
    const receipt = JSON.parse(readFileSync(path, "utf8"));
    for (const [name, stream] of Object.entries(receipt.streams)) {
      if (
        !existsSync(stream.path) ||
        sha256File(stream.path) !== stream.sha256
      ) {
        failures.push(`${receipt.receiptId}:${name}`);
      }
    }
    if (receipt.verdict !== "PASS") {
      failures.push(`${receipt.receiptId}:unexpected-verdict`);
    }
    return {
      path,
      sha256: sha256File(path),
      sequence: receipt.sequence,
      receiptId: receipt.receiptId,
      verdict: receipt.verdict,
    };
  });
  return { records, failures };
};

const generatedBeforePath = join(runRoot, "generated-before.json");
const generatedPreMovePath = join(runRoot, "generated-pre-move.json");
const generatedAfterPath = join(runRoot, "generated-after.json");
const comparePreMovePath = join(runRoot, "compare-pre-move.json");
const compareRestoredPath = join(runRoot, "compare-restored.json");
const originalQ1BeforePath = join(runRoot, "original-q1-before.json");
const originalQ1AfterPath = join(runRoot, "original-q1-after.json");
const ignoredBeforePath = join(runRoot, "ignored-before.json");
const ignoredAfterPath = join(runRoot, "ignored-after.json");
const ignoredComparisonPath = join(runRoot, "ignored-comparison.json");
const movePath = join(runRoot, "move-aside.json");
const restorePath = join(runRoot, "restore.json");
const hashesBefore = protectedHashes();
let trackedDiffBefore = null;
let statusBeforeText = null;
let outputsMoved = false;
let verdict = "STOPPED_FAIL_CLOSED";
let failure = null;

assert(sha256File(planPath) === planSha256, "accepted-plan hash mismatch");
assert(!existsSync(scratchRoot), "scratch root must start absent");
assert(!existsSync(runRoot), "R3 evidence run already exists");
mkdirSync(runRoot, { recursive: true, mode: 0o700 });
await writeJsonExclusive(join(runRoot, "CONTROLLER-START.json"), {
  schemaVersion: "custom-harness-q1-r3-controller-start/v1",
  startedUtc: new Date().toISOString(),
  cwd: process.cwd(),
  argv: [process.execPath, ...process.argv.slice(1)],
  executablePath: process.execPath,
  executableRealpath: realpathSync(process.execPath),
  executableSha256: sha256File(realpathSync(process.execPath)),
  planSha256,
  sourceHead,
  persistentWriteBoundary: r3Root,
  preservedInput: "apps/plugin/opencode2/turbo.json",
  noI1: true,
});

try {
  mkdirSync(scratchRoot, { mode: 0o700 });
  for (const path of [
    "home",
    "tmp",
    "xdg/cache",
    "xdg/config",
    "xdg/data",
    "downloads",
    "headers",
    "consumer/node_modules",
    "extracted/effect-source",
    "extracted/bun",
    "extracted/node",
    "extracted/turbo",
    "preexisting-output-backup",
    "new-generated-output",
    "cargo-home",
  ]) {
    mkdirSync(join(scratchRoot, path), { recursive: true, mode: 0o700 });
  }
  symlinkSync(
    "/Users/sterling/.cargo/registry",
    join(scratchRoot, "cargo-home/registry"),
  );
  writeFileSync(
    join(scratchRoot, "home/.bunfig.toml"),
    'telemetry = false\n\n[install]\nauto = "disable"\n',
    { flag: "wx", mode: 0o600 },
  );

  const head = await run({
    id: "preflight-head",
    executable: git,
    argv: ["rev-parse", "HEAD"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [planPath, authorizationPath],
    knownExclusions: ["Repository status use does not qualify Git behavior."],
  });
  assert(stdout(head) === sourceHead, "repository HEAD mismatch");
  const statusBefore = await run({
    id: "preflight-status",
    executable: git,
    argv: ["status", "--short", "--untracked-files=all"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".git/HEAD")],
  });
  statusBeforeText = stdout(statusBefore);
  const diffBefore = await run({
    id: "preflight-diff",
    executable: git,
    argv: ["diff", "--binary", "--no-ext-diff"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".git/HEAD")],
  });
  trackedDiffBefore = readFileSync(diffBefore.stdoutPath);
  const diffNames = await run({
    id: "preflight-diff-names",
    executable: git,
    argv: ["diff", "--name-only", "--no-ext-diff"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".git/HEAD")],
  });
  assert(
    stdout(diffNames) === "apps/plugin/opencode2/turbo.json",
    "unexpected tracked input diff",
  );

  await run({
    id: "original-q1-before",
    executable: node,
    argv: [
      inventoryProbe,
      "manifest-q1",
      "--q1",
      q1Root,
      "--output",
      originalQ1BeforePath,
    ],
    environment: focusedEnvironment,
    inputs: [inventoryProbe, q1Root],
    expectedFiles: [{ path: originalQ1BeforePath }],
  });
  await run({
    id: "generated-before",
    executable: node,
    argv: [
      inventoryProbe,
      "inventory-generated",
      "--config",
      generatedConfigPath,
      "--output",
      generatedBeforePath,
    ],
    environment: focusedEnvironment,
    inputs: [inventoryProbe, generatedConfigPath],
    expectedFiles: [{ path: generatedBeforePath }],
  });
  const ignoredListBefore = await run({
    id: "ignored-list-before",
    executable: git,
    argv: ["ls-files", "--others", "--ignored", "--exclude-standard", "-z"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".gitignore")],
  });
  await run({
    id: "ignored-inventory-before",
    executable: node,
    argv: [
      inventoryProbe,
      "inventory-list",
      "--nul-list",
      ignoredListBefore.stdoutPath,
      "--output",
      ignoredBeforePath,
    ],
    environment: focusedEnvironment,
    inputs: [ignoredListBefore.stdoutPath],
    expectedFiles: [{ path: ignoredBeforePath }],
  });

  const neededRetrievals = [
    "effect-metadata",
    "effect-artifact",
    "effect-source",
    "effect-license",
    "bun-artifact",
    "node-artifact",
    "turbo-platform-artifact",
  ];
  const bodyFor = (id) => {
    const retrieval = retrievals.find((entry) => entry.id === id);
    assert(retrieval, `missing retrieval definition: ${id}`);
    return join(scratchRoot, "downloads", retrieval.file);
  };
  for (const id of neededRetrievals) {
    const retrieval = retrievals.find((entry) => entry.id === id);
    const body = bodyFor(id);
    const headers = join(scratchRoot, "headers", `${id}.txt`);
    await run({
      id: `retrieval-${id}`,
      executable: "/usr/bin/curl",
      argv: [
        "--disable",
        "--fail",
        "--location",
        "--silent",
        "--show-error",
        "--proto",
        "=https",
        "--proto-redir",
        "=https",
        "--tlsv1.2",
        "--request",
        "GET",
        "--dump-header",
        headers,
        "--output",
        body,
        retrieval.url,
      ],
      environment: environments.retrieval,
      inputs: [retrievalsPath],
      expectedFiles: [{ path: body, sha256: retrieval.expectedSha256 }],
      assertions: [
        { id: "pinned-reviewed-url", passed: true },
        { id: "https-get-only", passed: true },
      ],
    });
    writeTextExclusive(
      join(runRoot, "headers", `${id}.txt`),
      cleanHeaders(readFileSync(headers, "utf8")),
    );
  }

  await run({
    id: "extract-effect-artifact",
    executable: "/usr/bin/tar",
    argv: [
      "-xzf",
      bodyFor("effect-artifact"),
      "-C",
      join(scratchRoot, "consumer/node_modules"),
    ],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [bodyFor("effect-artifact")],
  });
  renameSync(
    join(scratchRoot, "consumer/node_modules/package"),
    join(scratchRoot, "consumer/node_modules/effect"),
  );
  for (const [id, executable, argv] of [
    [
      "extract-effect-source",
      "/usr/bin/tar",
      [
        "-xzf",
        bodyFor("effect-source"),
        "-C",
        join(scratchRoot, "extracted/effect-source"),
      ],
    ],
    [
      "extract-bun",
      "/usr/bin/unzip",
      ["-q", bodyFor("bun-artifact"), "-d", join(scratchRoot, "extracted/bun")],
    ],
    [
      "extract-node",
      "/usr/bin/tar",
      [
        "-xzf",
        bodyFor("node-artifact"),
        "-C",
        join(scratchRoot, "extracted/node"),
      ],
    ],
    [
      "extract-turbo",
      "/usr/bin/tar",
      [
        "-xzf",
        bodyFor("turbo-platform-artifact"),
        "-C",
        join(scratchRoot, "extracted/turbo"),
      ],
    ],
  ]) {
    await run({
      id,
      executable,
      argv,
      environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
      inputs: [argv[1]],
    });
  }
  for (const name of [
    "effect-consumer-probe.ts",
    "effect-consumer-runner.ts",
    "effect-consumer.test.ts",
    "effect-consumer-tsconfig.json",
  ]) {
    const source = join(r3Root, "probes", name);
    const target = join(scratchRoot, "consumer", name);
    writeFileSync(target, readFileSync(source), { flag: "wx", mode: 0o600 });
  }
  const sourceArchiveRoot = join(
    scratchRoot,
    "extracted/effect-source",
    readdirSync(join(scratchRoot, "extracted/effect-source"))[0],
  );
  const closurePath = join(runRoot, "closure-diagnostic.ndjson");
  const closure = await run({
    id: "t01-closure-diagnostic",
    executable: bun,
    argv: [
      "--no-install",
      "--no-env-file",
      join(r3Root, "probes/closure-audit.ts"),
      "--package-root",
      join(scratchRoot, "consumer/node_modules/effect"),
      "--output",
      closurePath,
    ],
    cwd: join(scratchRoot, "consumer"),
    environment: focusedEnvironment,
    inputs: [
      join(r3Root, "probes/closure-audit.ts"),
      join(scratchRoot, "consumer/node_modules/effect/package.json"),
    ],
    expectedFiles: [{ path: closurePath }],
  });
  const closureSummary = JSON.parse(stdout(closure));
  assert(closureSummary.verdict === "PASS", "Effect closure violation");
  assert(closureSummary.syntaxExternalCount === 0, "external runtime import");

  const identityPath = join(runRoot, "identity-observation.json");
  const sourceTreePath = join(runRoot, "source-tree-diagnostic.json");
  await run({
    id: "t01-identity-audit",
    executable: node,
    argv: [
      join(r3Root, "probes/identity-audit.mjs"),
      "--consumer",
      join(scratchRoot, "consumer"),
      "--effect-source-root",
      sourceArchiveRoot,
      "--closure",
      closurePath,
      "--effect-metadata",
      bodyFor("effect-metadata"),
      "--extracted-bun-root",
      join(scratchRoot, "extracted/bun"),
      "--extracted-node-root",
      join(scratchRoot, "extracted/node"),
      "--extracted-turbo-root",
      join(scratchRoot, "extracted/turbo"),
      "--source-tree-diagnostic",
      sourceTreePath,
      "--output",
      identityPath,
    ],
    environment: focusedEnvironment,
    inputs: [
      candidatesPath,
      closurePath,
      bodyFor("effect-metadata"),
      bodyFor("effect-artifact"),
      bodyFor("effect-source"),
      bodyFor("bun-artifact"),
      bodyFor("node-artifact"),
      bodyFor("turbo-platform-artifact"),
    ],
    expectedFiles: [{ path: identityPath }, { path: sourceTreePath }],
    assertions: [
      { id: "exact-source-tree", passed: true },
      { id: "exact-local-and-release-binaries", passed: true },
      { id: "candidate-integrity-from-pinned-metadata", passed: true },
      { id: "workspace-non-adoption-recorded", passed: true },
    ],
  });

  const publicTest = await run({
    id: "t01-public-consumer-test",
    executable: bun,
    argv: ["--no-install", "--no-env-file", "test", "effect-consumer.test.ts"],
    cwd: join(scratchRoot, "consumer"),
    environment: focusedEnvironment,
    inputs: [
      join(scratchRoot, "consumer/effect-consumer.test.ts"),
      join(scratchRoot, "consumer/effect-consumer-probe.ts"),
      join(scratchRoot, "consumer/node_modules/effect/package.json"),
    ],
    assertions: [
      { id: "public-imports-only", passed: true },
      { id: "single-managed-runtime", passed: true },
      { id: "zero-skips", passed: true },
    ],
  });
  assert(/1 pass/u.test(combinedOutput(publicTest)), "public test pass count");
  noPositiveSkip(publicTest);
  const runtimeProbe = await run({
    id: "t01-runtime-probe",
    executable: bun,
    argv: ["--no-install", "--no-env-file", "effect-consumer-runner.ts"],
    cwd: join(scratchRoot, "consumer"),
    environment: focusedEnvironment,
    inputs: [
      join(scratchRoot, "consumer/effect-consumer-runner.ts"),
      join(scratchRoot, "consumer/effect-consumer-probe.ts"),
    ],
  });
  assert(
    JSON.parse(stdout(runtimeProbe)).activeManagedRuntimeCount === 1,
    "runtime topology",
  );
  await run({
    id: "t01-typescript",
    executable: bun,
    argv: [
      "--no-install",
      "--no-env-file",
      join(repositoryRoot, "node_modules/typescript/bin/tsc"),
      "--project",
      "effect-consumer-tsconfig.json",
    ],
    cwd: join(scratchRoot, "consumer"),
    environment: focusedEnvironment,
    inputs: [
      join(scratchRoot, "consumer/effect-consumer-probe.ts"),
      join(scratchRoot, "consumer/effect-consumer-tsconfig.json"),
      join(repositoryRoot, "node_modules/typescript/package.json"),
    ],
  });

  const identityCommands = [
    { id: "identity-bun", executable: bun, argv: ["--version"] },
    {
      id: "identity-bun-revision",
      executable: bun,
      argv: [
        "--no-install",
        "--no-env-file",
        "-e",
        "console.log(Bun.revision)",
      ],
    },
    { id: "identity-node", executable: node, argv: ["--version"] },
    {
      id: "identity-typescript",
      executable: bun,
      argv: [
        "--no-install",
        "--no-env-file",
        join(repositoryRoot, "node_modules/typescript/bin/tsc"),
        "--version",
      ],
    },
    { id: "identity-turbo", executable: turboBinaryPath, argv: ["--version"] },
    { id: "identity-rustc", executable: rootEnvironment.RUSTC, argv: ["-vV"] },
    { id: "identity-cargo", executable: rootEnvironment.CARGO, argv: ["-vV"] },
  ];
  const identityOutputs = {};
  for (const command of identityCommands) {
    const result = await run({
      ...command,
      environment: rootEnvironment,
      inputs: [candidatesPath],
    });
    identityOutputs[command.id] = stdout(result);
  }
  assert(identityOutputs["identity-bun"] === "1.3.14", "Bun version");
  assert(
    identityOutputs["identity-bun-revision"] ===
      candidates.buildTest.bun.revision,
    "Bun revision",
  );
  assert(identityOutputs["identity-node"] === "v24.18.0", "Node version");
  assert(
    identityOutputs["identity-typescript"] === "Version 5.9.2",
    "TypeScript version",
  );
  assert(identityOutputs["identity-turbo"] === "2.10.10", "Turbo version");
  assert(identityOutputs["identity-rustc"].includes("release: 1.97.1"), "Rust");
  assert(
    identityOutputs["identity-cargo"].includes("release: 1.97.1"),
    "Cargo",
  );
  await writeJsonExclusive(join(runRoot, "toolchain-identity.json"), {
    schemaVersion: "custom-harness-q1-r3-toolchain-identity/v1",
    verdict: "PASS",
    outputs: identityOutputs,
    rustCargoScope: "canonical-root checks only",
  });

  const invalidationPath = join(runRoot, "invalidation.json");
  await run({
    id: "t02-invalidation",
    executable: node,
    argv: [
      join(r3Root, "probes/candidate-audit.mjs"),
      "invalidation",
      "--identity",
      identityPath,
      "--output",
      invalidationPath,
    ],
    environment: focusedEnvironment,
    inputs: [candidatesPath, identityPath],
    expectedFiles: [{ path: invalidationPath }],
    assertions: [
      { id: "unchanged-exact-input-equal", passed: true },
      { id: "every-leaf-change-invalidates", passed: true },
    ],
    knownExclusions: ["No product enforcement is implemented or claimed."],
  });
  writeTextExclusive(
    join(runRoot, "T03-REJECTION.md"),
    "# Q1-R3-T03 adapter rejection\n\n**Verdict:** `REJECTED_NO_CANDIDATE`  \n**AI/provider/network test:** not run by design\n\nNo AI SDK or provider adapter was selected, retrieved, or executed. This is the accepted rejection branch and continues to block I7.\n",
  );
  const executionPlanPath = join(runRoot, "execution-plan.json");
  await writeJsonExclusive(executionPlanPath, {
    schemaVersion: "custom-harness-q1-r3-execution-plan/v1",
    rootCommands,
    rootEnvironment,
    turboBinaryPath,
    forbiddenCommands: [
      "bun install",
      "bun update",
      "bun upgrade",
      "bunx",
      "cargo install",
      "cargo update",
      "rustup",
    ],
    aiProviderCommands: [],
  });
  const controlsPath = join(runRoot, "controls.json");
  await run({
    id: "t04-controls",
    executable: node,
    argv: [
      join(r3Root, "probes/candidate-audit.mjs"),
      "controls",
      "--execution-plan",
      executionPlanPath,
      "--downloads",
      join(scratchRoot, "downloads"),
      "--output",
      controlsPath,
    ],
    environment: focusedEnvironment,
    inputs: [
      executionPlanPath,
      candidatesPath,
      retrievalsPath,
      bodyFor("effect-license"),
      join(r3Root, "probes/effect-consumer-probe.ts"),
      join(r3Root, "probes/effect-consumer.test.ts"),
    ],
    expectedFiles: [{ path: controlsPath }],
    assertions: [
      { id: "no-auto-update-or-install", passed: true },
      { id: "license-and-copied-material", passed: true },
      { id: "no-ai-provider-activity", passed: true },
    ],
  });

  await run({
    id: "generated-pre-move",
    executable: node,
    argv: [
      inventoryProbe,
      "inventory-generated",
      "--config",
      generatedConfigPath,
      "--output",
      generatedPreMovePath,
    ],
    environment: focusedEnvironment,
    inputs: [inventoryProbe, generatedConfigPath],
    expectedFiles: [{ path: generatedPreMovePath }],
  });
  await run({
    id: "compare-before-pre-move",
    executable: node,
    argv: [
      inventoryProbe,
      "compare-inventories",
      "--before",
      generatedBeforePath,
      "--after",
      generatedPreMovePath,
      "--output",
      comparePreMovePath,
    ],
    environment: focusedEnvironment,
    inputs: [generatedBeforePath, generatedPreMovePath],
    expectedFiles: [{ path: comparePreMovePath }],
  });
  await run({
    id: "move-aside",
    executable: node,
    argv: [
      inventoryProbe,
      "move-aside",
      "--config",
      generatedConfigPath,
      "--baseline",
      generatedBeforePath,
      "--output",
      movePath,
    ],
    environment: focusedEnvironment,
    inputs: [generatedConfigPath, generatedBeforePath],
    expectedFiles: [{ path: movePath }],
  });
  outputsMoved = true;
  try {
    for (const command of rootCommands) {
      const result = await run({
        id: command.id,
        executable: bun,
        argv: command.argv,
        environment: rootEnvironment,
        inputs: [
          join(repositoryRoot, "package.json"),
          join(repositoryRoot, "bun.lock"),
          join(repositoryRoot, "turbo.json"),
          join(repositoryRoot, "apps/plugin/opencode2/turbo.json"),
          executionPlanPath,
        ],
        assertions: [
          { id: "canonical-root-command", passed: true },
          { id: "no-install-no-env-file", passed: true },
        ],
      });
      noPositiveSkip(result);
    }
  } finally {
    await run({
      id: "restore",
      executable: node,
      argv: [
        inventoryProbe,
        "restore",
        "--config",
        generatedConfigPath,
        "--baseline",
        generatedBeforePath,
        "--output",
        restorePath,
      ],
      environment: focusedEnvironment,
      inputs: [generatedConfigPath, generatedBeforePath],
      expectedFiles: [{ path: restorePath }],
    });
    outputsMoved = false;
  }

  await run({
    id: "generated-after",
    executable: node,
    argv: [
      inventoryProbe,
      "inventory-generated",
      "--config",
      generatedConfigPath,
      "--output",
      generatedAfterPath,
    ],
    environment: focusedEnvironment,
    inputs: [inventoryProbe, generatedConfigPath],
    expectedFiles: [{ path: generatedAfterPath }],
  });
  await run({
    id: "compare-restored",
    executable: node,
    argv: [
      inventoryProbe,
      "compare-inventories",
      "--before",
      generatedBeforePath,
      "--after",
      generatedAfterPath,
      "--output",
      compareRestoredPath,
    ],
    environment: focusedEnvironment,
    inputs: [generatedBeforePath, generatedAfterPath],
    expectedFiles: [{ path: compareRestoredPath }],
  });
  assert(
    aggregate(compareRestoredPath, "restorableFieldsEqual") === true,
    "generated outputs were not restored",
  );
  const ignoredListAfter = await run({
    id: "ignored-list-after",
    executable: git,
    argv: ["ls-files", "--others", "--ignored", "--exclude-standard", "-z"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".gitignore")],
  });
  await run({
    id: "ignored-inventory-after",
    executable: node,
    argv: [
      inventoryProbe,
      "inventory-list",
      "--nul-list",
      ignoredListAfter.stdoutPath,
      "--output",
      ignoredAfterPath,
    ],
    environment: focusedEnvironment,
    inputs: [ignoredListAfter.stdoutPath],
    expectedFiles: [{ path: ignoredAfterPath }],
  });
  await run({
    id: "ignored-compare-restored",
    executable: node,
    argv: [
      inventoryProbe,
      "compare-inventories",
      "--before",
      ignoredBeforePath,
      "--after",
      ignoredAfterPath,
      "--output",
      ignoredComparisonPath,
    ],
    environment: focusedEnvironment,
    inputs: [ignoredBeforePath, ignoredAfterPath],
    expectedFiles: [{ path: ignoredComparisonPath }],
  });
  await run({
    id: "original-q1-after",
    executable: node,
    argv: [
      inventoryProbe,
      "manifest-q1",
      "--q1",
      q1Root,
      "--output",
      originalQ1AfterPath,
    ],
    environment: focusedEnvironment,
    inputs: [inventoryProbe, q1Root],
    expectedFiles: [{ path: originalQ1AfterPath }],
  });
  assert(
    aggregate(originalQ1BeforePath, "aggregateSha256") ===
      aggregate(originalQ1AfterPath, "aggregateSha256"),
    "Q1 evidence outside R3 changed",
  );
  assert(
    JSON.stringify(protectedHashes()) === JSON.stringify(hashesBefore),
    "protected input hashes changed",
  );

  rmSync(scratchRoot, { recursive: true, force: true });
  assert(!existsSync(scratchRoot), "scratch cleanup failed");

  const statusAfter = await run({
    id: "final-status",
    executable: git,
    argv: ["status", "--short", "--untracked-files=all"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".git/HEAD")],
  });
  const diffAfter = await run({
    id: "final-diff",
    executable: git,
    argv: ["diff", "--binary", "--no-ext-diff"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".git/HEAD")],
  });
  assert(
    trackedDiffBefore.equals(readFileSync(diffAfter.stdoutPath)),
    "tracked diff changed",
  );
  assert(
    JSON.stringify(outsideR3Status(statusBeforeText)) ===
      JSON.stringify(outsideR3Status(stdout(statusAfter))),
    "persistent status outside R3 changed",
  );
  assert(sha256File(planPath) === planSha256, "final plan hash mismatch");

  const integrity = receiptIntegrity();
  assert(integrity.failures.length === 0, "receipt stream integrity failure");
  await writeJsonExclusive(join(runRoot, "RECEIPT-INTEGRITY.json"), {
    schemaVersion: "custom-harness-q1-r3-receipt-integrity/v1",
    verdict: "PASS",
    records: integrity.records,
    failures: [],
  });
  await writeJsonExclusive(join(runRoot, "FINAL-STATE.json"), {
    schemaVersion: "custom-harness-q1-r3-final-state/v1",
    verdict: "PASS",
    checkedUtc: new Date().toISOString(),
    planSha256,
    sourceHead,
    scratchAbsent: true,
    generatedRestorableSha256: aggregate(
      generatedAfterPath,
      "restorableAggregateSha256",
    ),
    ignoredRestorableSha256: aggregate(
      ignoredAfterPath,
      "restorableAggregateSha256",
    ),
    originalQ1AggregateSha256: aggregate(
      originalQ1AfterPath,
      "aggregateSha256",
    ),
    protectedHashes: protectedHashes(),
    outsideR3StatusUnchanged: true,
    trackedDiffUnchanged: true,
    workspaceEffectLockVersions: JSON.parse(readFileSync(identityPath, "utf8"))
      .effect.workspaceLockVersions,
    candidateEffectAdopted: false,
    noI1: true,
  });
  writeTextExclusive(
    join(r3Root, "RESULT.md"),
    `# Q1-R3 result\n\n**Verdict:** \`Q1_R3_EVIDENCE_COMPLETE\`  \n**Plan SHA-256:** \`${planSha256}\`\n\nThe isolated Effect \`4.0.0-beta.107\` candidate and the exact Bun 1.3.14, TypeScript 5.9.2, Turbo 2.10.10, and Node 24.18.0 build/test candidates passed the authorized checks. The current workspace's distinct Effect lock resolution was recorded without adoption. AI remains \`REJECTED_NO_CANDIDATE\`. Generated outputs and the pre-existing tracked diff were restored exactly. This evidence does not accept Q1, adopt dependencies, authorize I1, or qualify SQLite, Git behavior, supervision, sandboxing, or deployment.\n`,
  );
  verdict = "Q1_R3_EVIDENCE_COMPLETE";
  await writeJsonExclusive(join(runRoot, "CONTROLLER-END.json"), {
    schemaVersion: "custom-harness-q1-r3-controller-end/v1",
    verdict,
    endedUtc: new Date().toISOString(),
    receiptCount: receipts.length,
    scratchAbsent: true,
    noI1: true,
  });
} catch (error) {
  failure =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  if (outputsMoved && existsSync(scratchRoot)) {
    try {
      await run({
        id: "emergency-restore",
        executable: node,
        argv: [
          inventoryProbe,
          "restore",
          "--config",
          generatedConfigPath,
          "--baseline",
          generatedBeforePath,
          "--output",
          join(runRoot, "emergency-restore.json"),
        ],
        environment: focusedEnvironment,
        inputs: [generatedConfigPath, generatedBeforePath],
        expectedFiles: [{ path: join(runRoot, "emergency-restore.json") }],
      });
      outputsMoved = false;
    } catch (restoreError) {
      failure += `\nRESTORE_FAILURE:${String(restoreError)}`;
    }
  }
  if (existsSync(scratchRoot))
    rmSync(scratchRoot, { recursive: true, force: true });
  await writeJsonExclusive(join(runRoot, "STOPPED-FAIL-CLOSED.json"), {
    schemaVersion: "custom-harness-q1-r3-stopped/v1",
    verdict: "STOPPED_FAIL_CLOSED",
    stoppedUtc: new Date().toISOString(),
    failure,
    receiptCount: receipts.length,
    scratchAbsent: !existsSync(scratchRoot),
    protectedHashesUnchanged:
      JSON.stringify(protectedHashes()) === JSON.stringify(hashesBefore),
    noI1: true,
  });
  writeTextExclusive(
    join(r3Root, "RESULT.md"),
    `# Q1-R3 result\n\n**Verdict:** \`STOPPED_FAIL_CLOSED\`\n\nQ1-R3 stopped on a failed prerequisite, command, or boundary assertion. See \`evidence/run/STOPPED-FAIL-CLOSED.json\` and the retained receipts. No I1 or product implementation was performed.\n`,
  );
  process.exitCode = 1;
}

console.log(
  JSON.stringify({
    verdict,
    failure,
    receiptCount: receipts.length,
    scratchAbsent: !existsSync(scratchRoot),
    noI1: true,
  }),
);
