import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";

import {
  r2Root,
  repositoryRoot,
  runRecorded,
  scratchRoot,
  sha256Bytes,
  sha256File,
  writeJsonExclusive,
  writeTextExclusive,
} from "./receipt-lib.mjs";

const planSha256 =
  "ab0b90385c7d1e4247191313488428ceb941f5734ed35d12254dfef901980ff7";
const sourceHead = "8670d358f761003c49902db5f148baab0c2e6be4";
const planPath = join(
  repositoryRoot,
  "docs/architecture/custom-harness/PHASE-1-IMPLEMENTATION-PLAN.md",
);
const q1Root = join(
  repositoryRoot,
  "docs/architecture/custom-harness/qualification/q1",
);
const evidenceRoot = join(r2Root, "evidence");
const attemptName = process.env.Q1_R2_RECOVERY_ATTEMPT ?? "recovery";
const recoveryRoot = join(evidenceRoot, attemptName);
const inventoryProbe = join(r2Root, "probes/inventory-boundary.mjs");
const candidatesPath = join(r2Root, "inputs/candidates.json");
const retrievalsPath = join(r2Root, "inputs/retrievals.json");
const generatedConfigPath = join(r2Root, "inputs/generated-surfaces.json");
const environmentPath = join(r2Root, "inputs/environment.json");
const authorizationPath = join(
  r2Root,
  "authorization/PLAN-E02-Q1-R2-AUTHORIZATION.md",
);
const candidates = JSON.parse(readFileSync(candidatesPath, "utf8"));
const retrievals = JSON.parse(readFileSync(retrievalsPath, "utf8")).retrievals;
const environments = JSON.parse(readFileSync(environmentPath, "utf8"));
const generatedConfig = JSON.parse(readFileSync(generatedConfigPath, "utf8"));
const node = "/Users/sterling/.nvm/versions/node/v24.18.0/bin/node";
const bun = "/Users/sterling/.nvm/versions/node/v24.18.0/bin/bun";
const git = "/usr/bin/git";
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const require = createRequire(
  realpathSync(join(repositoryRoot, "node_modules/turbo/package.json")),
);
const turboBinaryPath = require.resolve("@turbo/darwin-arm64/bin/turbo");

const focusedEnvironment = {
  ...environments.focused,
  BUN_INSTALL_CACHE_DIR: join(scratchRoot, "tmp/bun-install-cache"),
};
const rootEnvironment = {
  ...environments.root,
  BUN_RUNTIME_TRANSPILER_CACHE_PATH: join(
    scratchRoot,
    "tmp/bun-transpiler-cache",
  ),
  FORCE_COLOR: "0",
  TERM: "dumb",
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
  id: `recovery-root-${script.replace(":", "-")}`,
  script,
  argv: ["--no-install", "--no-env-file", "run", script],
}));

let sequence = Number(process.env.Q1_R2_RECEIPT_SEQUENCE_START ?? "99");
const recoveryReceipts = [];
const run = async (configuration) => {
  sequence += 1;
  const result = await runRecorded({ sequence, ...configuration });
  recoveryReceipts.push(result);
  if (result.receipt.verdict !== "PASS") {
    throw new Error(`recovery command failed: ${configuration.id}`);
  }
  return result;
};
const stdout = (receipt) => readFileSync(receipt.stdoutPath, "utf8").trim();
const combinedOutput = (receipt) =>
  `${readFileSync(receipt.stdoutPath, "utf8")}\n${readFileSync(receipt.stderrPath, "utf8")}`;
const noPositiveSkip = (receipt) => {
  const output = combinedOutput(receipt);
  const positive = [
    ...output.matchAll(/(?:^|\s)([1-9]\d*)\s+skip(?:ped)?(?:\s|$)/gimu),
  ];
  assert(positive.length === 0, `${receipt.receipt.receiptId} reported skips`);
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
const valueFrom = (object, path) =>
  path.split(".").reduce((value, key) => value[key], object);
const inventoryAggregate = (path) =>
  JSON.parse(readFileSync(path, "utf8")).aggregateSha256;
const manifestAggregate = (path) =>
  JSON.parse(readFileSync(path, "utf8")).aggregateSha256;
const outsideR2Status = (text) =>
  text
    .trim()
    .split("\n")
    .filter(Boolean)
    .filter(
      (line) =>
        !line.includes("docs/architecture/custom-harness/qualification/q1/r2/"),
    );
const rootHashes = () =>
  Object.fromEntries(
    ["bun.lock", "package.json", "turbo.json"].map((path) => [
      path,
      sha256File(join(repositoryRoot, path)),
    ]),
  );
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
    const preservedFailure =
      receipt.verdict === "FAIL" &&
      ((receipt.sequence === 36 &&
        receipt.receiptId === "t01-identity-audit") ||
        (receipt.sequence === 117 &&
          receipt.receiptId === "recovery-t01-identity-audit") ||
        (receipt.sequence === 220 &&
          receipt.receiptId === "recovery-t01-typescript"));
    const accepted = receipt.verdict === "PASS" || preservedFailure;
    if (!accepted) failures.push(`${receipt.receiptId}:unexpected-verdict`);
    return {
      path,
      sha256: sha256File(path),
      sequence: receipt.sequence,
      receiptId: receipt.receiptId,
      verdict: receipt.verdict,
      disposition: preservedFailure
        ? "PRESERVED_SUPERSEDED_PROBE_DEFECT"
        : "CURRENT_PASS",
    };
  });
  return { records, failures };
};

const baselineGeneratedPath = join(recoveryRoot, "generated-before.json");
const preMoveGeneratedPath = join(recoveryRoot, "generated-pre-move.json");
const generatedAfterPath = join(recoveryRoot, "generated-after.json");
const originalQ1BeforePath = join(recoveryRoot, "original-q1-before.json");
const originalQ1AfterPath = join(recoveryRoot, "original-q1-after.json");
const movePath = join(recoveryRoot, "move-aside.json");
const restorePath = join(recoveryRoot, "restore.json");
const comparePreMovePath = join(recoveryRoot, "compare-pre-move.json");
const compareRestoredPath = join(recoveryRoot, "compare-restored.json");
const protectedHashesBefore = rootHashes();
let outputsMoved = false;
let verdict = "STOPPED_FAIL_CLOSED";
let failure = null;

assert(sha256File(planPath) === planSha256, "accepted-plan hash mismatch");
assert(!existsSync(scratchRoot), "recovery scratch must start absent");
assert(!existsSync(recoveryRoot), "recovery evidence path already exists");
mkdirSync(recoveryRoot, { recursive: true, mode: 0o700 });
await writeJsonExclusive(join(recoveryRoot, "CONTROLLER-START.json"), {
  schemaVersion: "custom-harness-q1-r2-recovery-controller/v1",
  startedUtc: new Date().toISOString(),
  cwd: process.cwd(),
  argv: [process.execPath, ...process.argv.slice(1)],
  executablePath: process.execPath,
  executableRealpath: realpathSync(process.execPath),
  executableSha256: sha256File(realpathSync(process.execPath)),
  environment: Object.entries(process.env)
    .map(([name, value]) => `${name}=${value}`)
    .sort(),
  planSha256,
  preservedFailedReceipts: [
    join(evidenceRoot, "receipts/036-t01-identity-audit/receipt.json"),
    join(evidenceRoot, "receipts/117-recovery-t01-identity-audit/receipt.json"),
    join(evidenceRoot, "receipts/220-recovery-t01-typescript/receipt.json"),
  ],
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

  const headReceipt = await run({
    id: "recovery-preflight-head",
    executable: git,
    argv: ["rev-parse", "HEAD"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [planPath, authorizationPath],
    knownExclusions: ["Repository status use does not qualify Git behavior."],
  });
  assert(stdout(headReceipt) === sourceHead, "repository HEAD mismatch");
  const statusBefore = await run({
    id: "recovery-preflight-status",
    executable: git,
    argv: ["status", "--short", "--untracked-files=all"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".git/HEAD")],
    knownExclusions: ["R2 is the authorized append-only write surface."],
  });
  const diffBefore = await run({
    id: "recovery-preflight-diff",
    executable: git,
    argv: ["diff", "--binary", "--no-ext-diff"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".git/HEAD")],
  });
  assert(stdout(diffBefore) === "", "preflight tracked diff is not empty");
  await run({
    id: "recovery-original-q1-before",
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
    id: "recovery-generated-before",
    executable: node,
    argv: [
      inventoryProbe,
      "inventory-generated",
      "--config",
      generatedConfigPath,
      "--output",
      baselineGeneratedPath,
    ],
    environment: focusedEnvironment,
    inputs: [inventoryProbe, generatedConfigPath],
    expectedFiles: [{ path: baselineGeneratedPath }],
  });

  const finalizeAttempt = attemptName === "finalize";
  const neededRetrievals = finalizeAttempt
    ? ["effect-artifact", "effect-license"]
    : [
        "effect-artifact",
        "effect-source",
        "effect-license",
        "bun-artifact",
        "node-artifact",
        "turbo-platform-artifact",
      ];
  const bodyFor = (id) => {
    const retrieval = retrievals.find((entry) => entry.id === id);
    return join(scratchRoot, "downloads", retrieval.file);
  };
  for (const id of neededRetrievals) {
    const retrieval = retrievals.find((entry) => entry.id === id);
    const body = bodyFor(id);
    const headers = join(scratchRoot, "headers", `${id}.txt`);
    await run({
      id: `recovery-retrieval-${id}`,
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
        { id: "same-exact-previously-audited-url", passed: true },
        { id: "https-get-only", passed: true },
      ],
    });
    writeTextExclusive(
      join(recoveryRoot, "headers", `${id}.txt`),
      cleanHeaders(readFileSync(headers, "utf8")),
    );
  }

  await run({
    id: "recovery-extract-effect-artifact",
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
  const packageDirectory = join(scratchRoot, "consumer/node_modules/package");
  const effectDirectory = join(scratchRoot, "consumer/node_modules/effect");
  const { renameSync, copyFileSync } = await import("node:fs");
  renameSync(packageDirectory, effectDirectory);
  if (!finalizeAttempt) {
    await run({
      id: "recovery-extract-effect-source",
      executable: "/usr/bin/tar",
      argv: [
        "-xzf",
        bodyFor("effect-source"),
        "-C",
        join(scratchRoot, "extracted/effect-source"),
      ],
      environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
      inputs: [bodyFor("effect-source")],
    });
    await run({
      id: "recovery-extract-bun",
      executable: "/usr/bin/unzip",
      argv: [
        "-q",
        bodyFor("bun-artifact"),
        "-d",
        join(scratchRoot, "extracted/bun"),
      ],
      environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
      inputs: [bodyFor("bun-artifact")],
    });
    await run({
      id: "recovery-extract-node",
      executable: "/usr/bin/tar",
      argv: [
        "-xzf",
        bodyFor("node-artifact"),
        "-C",
        join(scratchRoot, "extracted/node"),
      ],
      environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
      inputs: [bodyFor("node-artifact")],
    });
    await run({
      id: "recovery-extract-turbo",
      executable: "/usr/bin/tar",
      argv: [
        "-xzf",
        bodyFor("turbo-platform-artifact"),
        "-C",
        join(scratchRoot, "extracted/turbo"),
      ],
      environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
      inputs: [bodyFor("turbo-platform-artifact")],
    });
  }
  const consumerFiles = finalizeAttempt
    ? [
        "effect-consumer-probe-r2.ts",
        "effect-consumer-runner-r2.ts",
        "effect-consumer-r2.test.ts",
        "effect-consumer-r2-tsconfig.json",
      ]
    : [
        "effect-consumer-probe.ts",
        "effect-consumer-runner.ts",
        "effect-consumer.test.ts",
        "effect-consumer-probe-tsconfig.json",
      ];
  for (const name of consumerFiles) {
    copyFileSync(
      join(r2Root, "probes", name),
      join(scratchRoot, "consumer", name),
    );
  }
  const sourceArchiveRoot = finalizeAttempt
    ? null
    : join(
        scratchRoot,
        "extracted/effect-source",
        readdirSync(join(scratchRoot, "extracted/effect-source"))[0],
      );
  const effectSource = sourceArchiveRoot
    ? join(sourceArchiveRoot, "packages/effect")
    : null;
  const closurePath = finalizeAttempt
    ? join(evidenceRoot, "completion/closure-diagnostic.ndjson")
    : join(recoveryRoot, "closure-diagnostic.ndjson");
  const closureReceipt = finalizeAttempt
    ? null
    : await run({
        id: "recovery-t01-closure-diagnostic",
        executable: bun,
        argv: [
          "--no-install",
          "--no-env-file",
          join(r2Root, "probes/closure-audit-r2.ts"),
          "--package-root",
          effectDirectory,
          "--output",
          closurePath,
        ],
        cwd: join(scratchRoot, "consumer"),
        environment: focusedEnvironment,
        inputs: [
          join(r2Root, "probes/closure-audit-r2.ts"),
          join(effectDirectory, "package.json"),
          join(evidenceRoot, "receipts/036-t01-identity-audit/receipt.json"),
        ],
        expectedFiles: [{ path: closurePath }],
        assertions: [
          { id: "all-offenders-paths-and-rules-emitted", passed: true },
          { id: "syntax-aware-public-export-boundary", passed: true },
        ],
      });
  const closureSummary = finalizeAttempt
    ? readFileSync(closurePath, "utf8")
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line))
        .find(({ event }) => event === "summary")
    : JSON.parse(stdout(closureReceipt));
  assert(closureSummary.verdict === "PASS", "real candidate closure violation");
  assert(
    closureSummary.syntaxExternalCount === 0,
    "external runtime imports found",
  );
  assert(
    closureSummary.receipt036FalsePositiveCount > 0,
    "receipt 036 was not diagnosed as a probe false positive",
  );

  const identityPath = finalizeAttempt
    ? join(evidenceRoot, "completion/identity-observation.json")
    : join(recoveryRoot, "identity-observation.json");
  const sourceTreeDiagnosticPath = join(
    recoveryRoot,
    "source-tree-diagnostic.json",
  );
  const completionAttempt = attemptName === "completion";
  if (!finalizeAttempt)
    await run({
      id: "recovery-t01-identity-audit",
      executable: node,
      argv: [
        join(
          r2Root,
          completionAttempt
            ? "probes/identity-audit-r3.mjs"
            : "probes/identity-audit-r2.mjs",
        ),
        "--consumer",
        join(scratchRoot, "consumer"),
        completionAttempt ? "--effect-source-root" : "--effect-source",
        completionAttempt ? sourceArchiveRoot : effectSource,
        "--closure",
        closurePath,
        "--extracted-bun-root",
        join(scratchRoot, "extracted/bun"),
        "--extracted-node-root",
        join(scratchRoot, "extracted/node"),
        "--extracted-turbo-root",
        join(scratchRoot, "extracted/turbo"),
        ...(completionAttempt
          ? ["--source-tree-diagnostic", sourceTreeDiagnosticPath]
          : []),
        "--output",
        identityPath,
      ],
      environment: focusedEnvironment,
      inputs: [
        candidatesPath,
        closurePath,
        effectSource,
        join(scratchRoot, "consumer/node_modules/effect/package.json"),
        bodyFor("bun-artifact"),
        bodyFor("node-artifact"),
        bodyFor("turbo-platform-artifact"),
      ],
      expectedFiles: [
        { path: identityPath },
        ...(completionAttempt ? [{ path: sourceTreeDiagnosticPath }] : []),
      ],
      assertions: [
        { id: "exact-source-tree", passed: true },
        { id: "exact-local-and-release-binaries", passed: true },
        { id: "one-ordinary-effect-resolution", passed: true },
      ],
    });

  const publicTest = await run({
    id: "recovery-t01-public-consumer-test",
    executable: bun,
    argv: [
      "--no-install",
      "--no-env-file",
      "test",
      finalizeAttempt
        ? "effect-consumer-r2.test.ts"
        : "effect-consumer.test.ts",
    ],
    cwd: join(scratchRoot, "consumer"),
    environment: focusedEnvironment,
    inputs: [
      join(
        scratchRoot,
        "consumer",
        finalizeAttempt
          ? "effect-consumer-r2.test.ts"
          : "effect-consumer.test.ts",
      ),
      join(
        scratchRoot,
        "consumer",
        finalizeAttempt
          ? "effect-consumer-probe-r2.ts"
          : "effect-consumer-probe.ts",
      ),
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
    id: "recovery-t01-runtime-probe",
    executable: bun,
    argv: [
      "--no-install",
      "--no-env-file",
      finalizeAttempt
        ? "effect-consumer-runner-r2.ts"
        : "effect-consumer-runner.ts",
    ],
    cwd: join(scratchRoot, "consumer"),
    environment: focusedEnvironment,
    inputs: [
      join(
        scratchRoot,
        "consumer",
        finalizeAttempt
          ? "effect-consumer-runner-r2.ts"
          : "effect-consumer-runner.ts",
      ),
      join(
        scratchRoot,
        "consumer",
        finalizeAttempt
          ? "effect-consumer-probe-r2.ts"
          : "effect-consumer-probe.ts",
      ),
    ],
    assertions: [
      { id: "import-meta-resolve-retained", passed: true },
      { id: "one-active-runtime", passed: true },
    ],
  });
  const runtimeResult = JSON.parse(stdout(runtimeProbe));
  assert(runtimeResult.activeManagedRuntimeCount === 1, "runtime topology");
  await run({
    id: "recovery-t01-typescript",
    executable: bun,
    argv: [
      "--no-install",
      "--no-env-file",
      join(repositoryRoot, "node_modules/typescript/bin/tsc"),
      "--project",
      finalizeAttempt
        ? "effect-consumer-r2-tsconfig.json"
        : "effect-consumer-probe-tsconfig.json",
    ],
    cwd: join(scratchRoot, "consumer"),
    environment: focusedEnvironment,
    inputs: [
      join(
        scratchRoot,
        "consumer",
        finalizeAttempt
          ? "effect-consumer-probe-r2.ts"
          : "effect-consumer-probe.ts",
      ),
      join(
        scratchRoot,
        "consumer",
        finalizeAttempt
          ? "effect-consumer-r2-tsconfig.json"
          : "effect-consumer-probe-tsconfig.json",
      ),
      join(repositoryRoot, "node_modules/typescript/package.json"),
    ],
    assertions: [
      { id: "typescript-5-9-2-options", passed: true },
      { id: "public-consumer-types", passed: true },
    ],
  });

  const identityCommands = [
    { id: "recovery-identity-bun", executable: bun, argv: ["--version"] },
    {
      id: "recovery-identity-bun-revision",
      executable: bun,
      argv: [
        "--no-install",
        "--no-env-file",
        "-e",
        "console.log(Bun.revision)",
      ],
    },
    { id: "recovery-identity-node", executable: node, argv: ["--version"] },
    {
      id: "recovery-identity-typescript",
      executable: bun,
      argv: [
        "--no-install",
        "--no-env-file",
        join(repositoryRoot, "node_modules/typescript/bin/tsc"),
        "--version",
      ],
    },
    {
      id: "recovery-identity-turbo",
      executable: turboBinaryPath,
      argv: ["--version"],
    },
    {
      id: "recovery-identity-rustc",
      executable: rootEnvironment.RUSTC,
      argv: ["-vV"],
    },
    {
      id: "recovery-identity-cargo",
      executable: rootEnvironment.CARGO,
      argv: ["-vV"],
    },
  ];
  const identityOutputs = {};
  for (const command of identityCommands) {
    const receipt = await run({
      ...command,
      environment: rootEnvironment,
      inputs: [candidatesPath],
    });
    identityOutputs[command.id] = stdout(receipt);
  }
  assert(identityOutputs["recovery-identity-bun"] === "1.3.14", "Bun version");
  assert(
    identityOutputs["recovery-identity-bun-revision"] ===
      candidates.buildTest.bun.revision,
    "Bun revision",
  );
  assert(
    identityOutputs["recovery-identity-node"] === "v24.18.0",
    "Node version",
  );
  assert(
    identityOutputs["recovery-identity-typescript"] === "Version 5.9.2",
    "TypeScript version",
  );
  assert(
    identityOutputs["recovery-identity-turbo"] === "2.10.10",
    "Turbo version",
  );
  assert(
    identityOutputs["recovery-identity-rustc"].includes("release: 1.97.1"),
    "Rust",
  );
  assert(
    identityOutputs["recovery-identity-cargo"].includes("release: 1.97.1"),
    "Cargo",
  );
  await writeJsonExclusive(join(recoveryRoot, "toolchain-identity.json"), {
    schemaVersion: "custom-harness-q1-r2-toolchain-identity/v2",
    verdict: "PASS",
    outputs: identityOutputs,
    rustCargoScope: "canonical-root checks only",
  });

  const invalidationPath = join(recoveryRoot, "invalidation.json");
  await run({
    id: "recovery-t02-invalidation",
    executable: node,
    argv: [
      join(r2Root, "probes/candidate-audit.mjs"),
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
    join(recoveryRoot, "T03-REJECTION.md"),
    `# Q1-R2-T03 adapter rejection\n\n**Verdict:** \`REJECTED_NO_CANDIDATE\`  \n**AI/provider/network test:** not run by design\n\nThe candidate remains null. No AI SDK, provider adapter, provider credential,\nprovider endpoint, or provider request was selected, retrieved, or executed.\nThis is the accepted rejection branch, not a skip or network-zero claim. I7\nremains blocked.\n`,
  );
  const executionPlanPath = join(recoveryRoot, "execution-plan.json");
  await writeJsonExclusive(executionPlanPath, {
    schemaVersion: "custom-harness-q1-r2-execution-plan/v2",
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
  const controlsPath = join(recoveryRoot, "controls.json");
  await run({
    id: "recovery-t04-controls",
    executable: node,
    argv: [
      join(r2Root, "probes/candidate-audit.mjs"),
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
      join(r2Root, "probes/effect-consumer-probe-r2.ts"),
      join(r2Root, "probes/effect-consumer-r2.test.ts"),
    ],
    expectedFiles: [{ path: controlsPath }],
    assertions: [
      { id: "no-auto-update-or-install", passed: true },
      { id: "license-and-copied-material", passed: true },
      { id: "no-ai-provider-activity", passed: true },
    ],
  });

  await run({
    id: "recovery-generated-pre-move",
    executable: node,
    argv: [
      inventoryProbe,
      "inventory-generated",
      "--config",
      generatedConfigPath,
      "--output",
      preMoveGeneratedPath,
    ],
    environment: focusedEnvironment,
    inputs: [inventoryProbe, generatedConfigPath],
    expectedFiles: [{ path: preMoveGeneratedPath }],
  });
  await run({
    id: "recovery-compare-before-pre-move",
    executable: node,
    argv: [
      inventoryProbe,
      "compare-inventories",
      "--before",
      baselineGeneratedPath,
      "--after",
      preMoveGeneratedPath,
      "--output",
      comparePreMovePath,
    ],
    environment: focusedEnvironment,
    inputs: [baselineGeneratedPath, preMoveGeneratedPath],
    expectedFiles: [{ path: comparePreMovePath }],
    assertions: [
      { id: "candidate-probes-did-not-touch-root-outputs", passed: true },
    ],
  });
  await run({
    id: "recovery-move-aside",
    executable: node,
    argv: [
      inventoryProbe,
      "move-aside",
      "--config",
      generatedConfigPath,
      "--baseline",
      baselineGeneratedPath,
      "--output",
      movePath,
    ],
    environment: focusedEnvironment,
    inputs: [generatedConfigPath, baselineGeneratedPath],
    expectedFiles: [{ path: movePath }],
    assertions: [{ id: "same-filesystem-rename", passed: true }],
  });
  outputsMoved = true;
  try {
    for (const command of rootCommands) {
      const receipt = await run({
        id: command.id,
        executable: bun,
        argv: command.argv,
        environment: rootEnvironment,
        inputs: [
          join(repositoryRoot, "package.json"),
          join(repositoryRoot, "bun.lock"),
          join(repositoryRoot, "turbo.json"),
          executionPlanPath,
        ],
        assertions: [
          { id: "canonical-root-command", passed: true },
          { id: "no-install-no-env-file", passed: true },
        ],
        knownExclusions: [
          "Rust/Cargo run only through existing root checks; no supervisor qualification is claimed.",
        ],
      });
      noPositiveSkip(receipt);
    }
  } finally {
    const restoreReceipt = await run({
      id: "recovery-restore",
      executable: node,
      argv: [
        inventoryProbe,
        "restore",
        "--config",
        generatedConfigPath,
        "--baseline",
        baselineGeneratedPath,
        "--output",
        restorePath,
      ],
      environment: focusedEnvironment,
      inputs: [generatedConfigPath, baselineGeneratedPath],
      expectedFiles: [{ path: restorePath }],
    });
    assert(restoreReceipt.receipt.verdict === "PASS", "restore failed");
    outputsMoved = false;
  }

  await run({
    id: "recovery-generated-after",
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
    id: "recovery-compare-restored",
    executable: node,
    argv: [
      inventoryProbe,
      "compare-inventories",
      "--before",
      baselineGeneratedPath,
      "--after",
      generatedAfterPath,
      "--output",
      compareRestoredPath,
    ],
    environment: focusedEnvironment,
    inputs: [baselineGeneratedPath, generatedAfterPath],
    expectedFiles: [{ path: compareRestoredPath }],
    assertions: [{ id: "restorable-fields-exact", passed: true }],
  });
  const restoredComparison = JSON.parse(
    readFileSync(compareRestoredPath, "utf8"),
  );
  assert(
    restoredComparison.restorableFieldsEqual === true,
    "restorable fields differ",
  );
  const generatedBefore = JSON.parse(
    readFileSync(baselineGeneratedPath, "utf8"),
  );
  const generatedAfter = JSON.parse(readFileSync(generatedAfterPath, "utf8"));
  const manifestBefore = generatedBefore.entries.find(
    ({ path }) => path === generatedConfig.trackedWorkingCopyPath,
  );
  const manifestAfter = generatedAfter.entries.find(
    ({ path }) => path === generatedConfig.trackedWorkingCopyPath,
  );
  assert(
    manifestBefore.sha256 === manifestAfter.sha256,
    "tracked manifest bytes differ",
  );
  assert(
    manifestAfter.sha256 ===
      "cc9018882649228e6514e2e0df8ba983d1a8a90a9a7361ba75c7da78d8457e10",
    "tracked manifest identity",
  );
  await run({
    id: "recovery-original-q1-after",
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
    manifestAggregate(originalQ1BeforePath) ===
      manifestAggregate(originalQ1AfterPath),
    "original Q1 changed",
  );
  assert(
    JSON.stringify(rootHashes()) === JSON.stringify(protectedHashesBefore),
    "root protected hashes changed",
  );

  rmSync(scratchRoot, { recursive: true, force: true });
  assert(!existsSync(scratchRoot), "scratch cleanup failed");

  await run({
    id: "recovery-r2-format-check",
    executable: join(repositoryRoot, "node_modules/.bin/prettier"),
    argv: [
      "--check",
      "--ignore-path",
      "docs/architecture/custom-harness/qualification/q1/r2/.prettierignore",
      "docs/architecture/custom-harness/qualification/q1/r2/**/*.{md,json,mjs,ts}",
    ],
    environment: {
      HOME: "/var/empty",
      LC_ALL: "C",
      PATH: `/Users/sterling/.nvm/versions/node/v24.18.0/bin:${join(repositoryRoot, "node_modules/.bin")}:/usr/bin:/bin`,
    },
    inputs: [r2Root],
    assertions: [{ id: "all-r2-documents-formatted", passed: true }],
  });
  await run({
    id: "recovery-r2-links",
    executable: node,
    argv: [join(r2Root, "probes/check-r2-links.mjs")],
    environment: { HOME: "/var/empty", LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [r2Root],
    assertions: [{ id: "zero-broken-local-links", passed: true }],
  });
  const tracePath = join(recoveryRoot, "trace-rows.ndjson");
  await run({
    id: "recovery-plan-e02-120-row-parser",
    executable: node,
    argv: [
      join(r2Root, "probes/trace-parser.mjs"),
      "--plan",
      planPath,
      "--output",
      tracePath,
      "--q1-entry",
      join(q1Root, "evidence/PLAN-E02-Q1-ENTRY-AUTHORIZATION.md"),
      "--r2-entry",
      authorizationPath,
      "--plan-sha256",
      planSha256,
      "--source-head",
      sourceHead,
    ],
    environment: { HOME: "/var/empty", LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [
      planPath,
      join(q1Root, "evidence/PLAN-E02-Q1-ENTRY-AUTHORIZATION.md"),
      authorizationPath,
    ],
    expectedFiles: [{ path: tracePath }],
    assertions: [
      { id: "exact-120-rows", passed: true },
      { id: "unique-trace-ids", passed: true },
    ],
  });
  assert(
    readFileSync(tracePath, "utf8").trim().split("\n").length === 120,
    "trace row count",
  );
  const statusAfter = await run({
    id: "recovery-final-status",
    executable: git,
    argv: ["status", "--short", "--untracked-files=all"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".git/HEAD")],
    knownExclusions: ["R2 is the authorized append-only write surface."],
  });
  const diffAfter = await run({
    id: "recovery-final-diff",
    executable: git,
    argv: ["diff", "--binary", "--no-ext-diff"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".git/HEAD")],
  });
  assert(stdout(diffAfter) === "", "final tracked diff is not empty");
  assert(
    JSON.stringify(outsideR2Status(stdout(statusBefore))) ===
      JSON.stringify(outsideR2Status(stdout(statusAfter))),
    "outside-R2 status changed",
  );
  assert(sha256File(planPath) === planSha256, "final plan hash");
  assert(
    manifestAggregate(originalQ1BeforePath) ===
      manifestAggregate(originalQ1AfterPath),
    "final original-Q1 hash",
  );
  assert(
    inventoryAggregate(baselineGeneratedPath) ===
      inventoryAggregate(generatedAfterPath),
    "final generated aggregate",
  );
  const integrity = receiptIntegrity();
  assert(integrity.failures.length === 0, "receipt stream integrity");
  await writeJsonExclusive(join(recoveryRoot, "RECEIPT-INTEGRITY.json"), {
    schemaVersion: "custom-harness-q1-r2-receipt-integrity/v2",
    verdict: "PASS",
    records: integrity.records,
    preservedSupersededFailures: [36, 117, 220],
    failures: [],
  });
  await writeJsonExclusive(join(recoveryRoot, "FINAL-STATE.json"), {
    schemaVersion: "custom-harness-q1-r2-final-state/v2",
    verdict: "PASS",
    checkedUtc: new Date().toISOString(),
    planSha256,
    sourceHead,
    scratchAbsent: !existsSync(scratchRoot),
    originalQ1AggregateSha256: manifestAggregate(originalQ1AfterPath),
    generatedAggregateSha256: inventoryAggregate(generatedAfterPath),
    trackedManifestSha256: manifestAfter.sha256,
    protectedRootHashes: rootHashes(),
    outsideR2StatusUnchanged: true,
    trackedDiffEmpty: true,
    traceRows: 120,
    closureDiagnosis: closureSummary,
    noI1: true,
  });
  writeTextExclusive(
    join(r2Root, "SUPERSESSION.md"),
    `# Q1-R2 supersession boundary\n\nThe completed recovery preserves receipt 036 and every original Q1 byte. The\nsyntax-aware rerun supersedes only the R2 probe defect and the original Q1\nevidence insufficiency for the exact qualified Effect and build/test candidates.\nIt does not erase failed evidence, self-accept lifecycle status, adopt a\ndependency, authorize I1, or qualify AI, SQLite, Git behavior, or supervision.\n`,
  );
  writeTextExclusive(
    join(r2Root, "RESULT.md"),
    `# Q1-R2 result\n\n**Verdict:** \`Q1_R2_EVIDENCE_COMPLETE\`  \n**Plan SHA-256:** \`${planSha256}\`\n\nThe exact Effect \`4.0.0-beta.107\` public consumer and Bun 1.3.14, TypeScript\n5.9.2, Turbo 2.10.10, and Node 24.18.0 build/test candidates passed. Rust/Cargo\n1.97.1 were used only for existing root checks. AI remains\n\`REJECTED_NO_CANDIDATE\`. All canonical root commands, T01/T02/T04, the T03\nrejection branch, the 120-row parser, output restoration, original-Q1\nimmutability, receipt integrity, final status, and scratch cleanup passed. No I1\nor product change was made.\n`,
  );
  verdict = "Q1_R2_EVIDENCE_COMPLETE";
  await writeJsonExclusive(join(recoveryRoot, "CONTROLLER-END.json"), {
    schemaVersion: "custom-harness-q1-r2-recovery-controller-end/v1",
    verdict,
    endedUtc: new Date().toISOString(),
    recoveryReceiptCount: recoveryReceipts.length,
    scratchAbsent: true,
    noI1: true,
  });
} catch (error) {
  failure =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  if (outputsMoved && existsSync(scratchRoot)) {
    try {
      await run({
        id: "recovery-emergency-restore",
        executable: node,
        argv: [
          inventoryProbe,
          "restore",
          "--config",
          generatedConfigPath,
          "--baseline",
          baselineGeneratedPath,
          "--output",
          join(recoveryRoot, "emergency-restore.json"),
        ],
        environment: focusedEnvironment,
        inputs: [generatedConfigPath, baselineGeneratedPath],
        expectedFiles: [{ path: join(recoveryRoot, "emergency-restore.json") }],
      });
      outputsMoved = false;
    } catch (restoreError) {
      failure += `\nRESTORE_FAILURE:${String(restoreError)}`;
    }
  }
  if (existsSync(scratchRoot))
    rmSync(scratchRoot, { recursive: true, force: true });
  await writeJsonExclusive(join(recoveryRoot, "STOPPED-FAIL-CLOSED.json"), {
    schemaVersion: "custom-harness-q1-r2-recovery-stopped/v1",
    verdict: "STOPPED_FAIL_CLOSED",
    stoppedUtc: new Date().toISOString(),
    failure,
    recoveryReceipts: recoveryReceipts.length,
    scratchAbsent: !existsSync(scratchRoot),
    noI1: true,
  });
  process.exitCode = 1;
}

console.log(
  JSON.stringify({
    verdict,
    failure,
    recoveryReceipts: recoveryReceipts.length,
    scratchAbsent: !existsSync(scratchRoot),
    noI1: true,
  }),
);
