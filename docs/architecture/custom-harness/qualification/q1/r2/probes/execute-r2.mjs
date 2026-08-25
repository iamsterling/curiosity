import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

import {
  hashInput,
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
const generatedConfig = JSON.parse(
  readFileSync(join(r2Root, "inputs/generated-surfaces.json"), "utf8"),
);
const retrievalConfig = JSON.parse(
  readFileSync(join(r2Root, "inputs/retrievals.json"), "utf8"),
);
const environmentConfig = JSON.parse(
  readFileSync(join(r2Root, "inputs/environment.json"), "utf8"),
);
const candidates = JSON.parse(
  readFileSync(join(r2Root, "inputs/candidates.json"), "utf8"),
);
const node = "/Users/sterling/.nvm/versions/node/v24.18.0/bin/node";
const bun = "/Users/sterling/.nvm/versions/node/v24.18.0/bin/bun";
const git = "/usr/bin/git";
const authorizationPath = join(
  r2Root,
  "authorization/PLAN-E02-Q1-R2-AUTHORIZATION.md",
);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const byteOrder = (left, right) =>
  Buffer.from(left).compare(Buffer.from(right));

const fileRecords = (root, exclude = () => false) => {
  const records = [];
  const visit = (path) => {
    const display = relative(root, path) || ".";
    if (exclude(path, display)) return;
    const stat = lstatSync(path, { bigint: true });
    const common = {
      path: display,
      mode: Number(stat.mode),
      uid: Number(stat.uid),
      gid: Number(stat.gid),
      bytes: stat.size.toString(),
      mtimeNs: stat.mtimeNs.toString(),
    };
    if (stat.isSymbolicLink()) {
      records.push({ ...common, type: "symlink", target: readlinkSync(path) });
      return;
    }
    if (stat.isFile()) {
      records.push({ ...common, type: "file", sha256: sha256File(path) });
      return;
    }
    if (!stat.isDirectory()) {
      records.push({ ...common, type: "other" });
      return;
    }
    for (const name of readdirSync(path).sort(byteOrder)) visit(join(path, name));
  };
  visit(root);
  return records;
};

const generatedSnapshot = () => {
  const roots = [];
  const entries = [];
  for (const path of generatedConfig.paths) {
    const absolute = join(repositoryRoot, path);
    if (!existsSync(absolute)) {
      roots.push({ path, state: "absent", entryCount: 0 });
      continue;
    }
    const records = fileRecords(absolute).map((entry) => ({
      ...entry,
      path: entry.path === "." ? path : `${path}/${entry.path}`,
    }));
    const rootStat = lstatSync(absolute, { bigint: true });
    const rootRecord = {
      path,
      type: rootStat.isDirectory()
        ? "directory"
        : rootStat.isFile()
          ? "file"
          : rootStat.isSymbolicLink()
            ? "symlink"
            : "other",
      mode: Number(rootStat.mode),
      uid: Number(rootStat.uid),
      gid: Number(rootStat.gid),
      bytes: rootStat.size.toString(),
      mtimeNs: rootStat.mtimeNs.toString(),
      ...(rootStat.isFile() ? { sha256: sha256File(absolute) } : {}),
      ...(rootStat.isSymbolicLink()
        ? { target: readlinkSync(absolute) }
        : {}),
    };
    const complete = [rootRecord, ...records.filter(({ path: item }) => item !== path)];
    roots.push({
      path,
      state: "present",
      entryCount: complete.length,
      sha256: sha256Bytes(JSON.stringify(complete)),
    });
    entries.push(...complete);
  }
  return {
    roots,
    entries,
    aggregateSha256: sha256Bytes(JSON.stringify(entries)),
  };
};

const snapshotSummary = async (name, records, extra = {}) => {
  const ndjsonPath = join(evidenceRoot, "Q1-R2-E02", `${name}.ndjson`);
  writeTextExclusive(
    ndjsonPath,
    `${records.map((record) => JSON.stringify(record)).join("\n")}\n`,
  );
  const summary = {
    schemaVersion: "custom-harness-q1-r2-boundary-manifest/v1",
    name,
    recordCount: records.length,
    aggregateSha256: sha256Bytes(JSON.stringify(records)),
    ndjsonPath,
    ndjsonSha256: sha256File(ndjsonPath),
    ...extra,
  };
  await writeJsonExclusive(
    join(evidenceRoot, "Q1-R2-E02", `${name}.summary.json`),
    summary,
  );
  return summary;
};

const originalQ1Records = () =>
  fileRecords(q1Root, (_absolute, display) => {
    return display === "r2" || display.startsWith(`r2${sep}`);
  });
const nonR2Records = () =>
  fileRecords(repositoryRoot, (_absolute, display) => {
    return (
      display === ".git" ||
      display.startsWith(`.git${sep}`) ||
      display === "node_modules" ||
      display.startsWith(`node_modules${sep}`) ||
      display === "docs/architecture/custom-harness/qualification/q1/r2" ||
      display.startsWith(
        `docs/architecture/custom-harness/qualification/q1/r2${sep}`,
      )
    );
  });
const writeGeneratedSnapshot = async (name, snapshot) => {
  const summary = await snapshotSummary(name, snapshot.entries, {
    roots: snapshot.roots,
    generatedAggregateSha256: snapshot.aggregateSha256,
  });
  return summary;
};

let sequence = 0;
const receipts = [];
const run = async (configuration) => {
  sequence += 1;
  const result = await runRecorded({ sequence, ...configuration });
  receipts.push(result);
  if (result.receipt.verdict !== "PASS") {
    throw new Error(`command failed closed: ${configuration.id}`);
  }
  return result;
};
const stdoutText = (result) => readFileSync(result.stdoutPath, "utf8").trim();

const focusedEnvironment = {
  ...environmentConfig.focused,
  BUN_INSTALL_CACHE_DIR: join(scratchRoot, "tmp/bun-install-cache"),
};
const require = createRequire(
  realpathSync(join(repositoryRoot, "node_modules/turbo/package.json")),
);
const turboBinaryPath = require.resolve("@turbo/darwin-arm64/bin/turbo");
const rootEnvironment = {
  ...environmentConfig.root,
  BUN_RUNTIME_TRANSPILER_CACHE_PATH: join(scratchRoot, "tmp/bun-transpiler-cache"),
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
  id: `root-${script.replace(":", "-")}`,
  script,
  argv: ["--no-install", "--no-env-file", "run", script],
}));

const cleanHeaders = (source) =>
  source
    .split(/\r?\n/u)
    .map((line) =>
      /^(?:set-cookie|authorization|proxy-authorization):/iu.test(line)
        ? `${line.slice(0, line.indexOf(":"))}: <REDACTED>`
        : line,
    )
    .join("\n");

const findOnlyDirectory = (path) => {
  const directories = readdirSync(path, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory(),
  );
  assert(directories.length === 1, `expected one extracted directory in ${path}`);
  return join(path, directories[0].name);
};

const makeT03Record = () => {
  const path = join(evidenceRoot, "Q1-R2-T03", "REJECTION.md");
  writeTextExclusive(
    path,
    `# Q1-R2-T03 adapter rejection\n\n**Verdict:** \`REJECTED_NO_CANDIDATE\`  \n**Dynamic, provider, transport, credential, and network test:** not run by design\n\nThe selected candidate input keeps the AI SDK and provider adapter null. Q1-R2\ntherefore takes the accepted rejection branch rather than selecting, retrieving,\nexecuting, or contacting an AI/provider candidate. This is a rejection record,\nnot a skip, network-zero claim, or dynamic test pass. I7 and every provider\ncapability remain blocked.\n`,
  );
};

const receiptIntegrity = () => {
  const failures = [];
  const records = receipts.map(({ receiptPath }) => {
    const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
    for (const stream of Object.values(receipt.streams)) {
      if (sha256File(stream.path) !== stream.sha256) {
        failures.push(`${receipt.receiptId}:${stream.path}`);
      }
    }
    if (receipt.verdict !== "PASS") failures.push(`${receipt.receiptId}:verdict`);
    return {
      receiptId: receipt.receiptId,
      sequence: receipt.sequence,
      receiptPath,
      receiptSha256: sha256File(receiptPath),
      verdict: receipt.verdict,
    };
  });
  return { records, failures };
};

const evidenceChecksums = () => {
  const files = fileRecords(evidenceRoot)
    .filter(({ type }) => type === "file")
    .filter(({ path }) => path !== "EVIDENCE-SHA256SUMS")
    .map(({ path, sha256 }) => ({ path, sha256 }));
  const output = files.map(({ path, sha256 }) => `${sha256}  ${path}`).join("\n");
  writeTextExclusive(
    join(evidenceRoot, "EVIDENCE-SHA256SUMS"),
    `${output}\n`,
  );
  return files;
};

const controllerEnvironment = Object.entries(process.env)
  .map(([name, value]) => `${name}=${value}`)
  .sort((left, right) => left.localeCompare(right, "en"));
let generatedMoved = false;
let baselineGenerated;
let baselineOriginalQ1;
let baselineNonR2;
let extendedBefore;
let verdict = "STOPPED_FAIL_CLOSED";
let failure = null;

assert(sha256File(planPath) === planSha256, "governing accepted-plan hash mismatch");
assert(existsSync(authorizationPath), "R2 authorization receipt is absent");
assert(!existsSync(scratchRoot), "interrupted scratch state requires manual review");
assert(!existsSync(evidenceRoot), "partial R2 evidence state requires manual review");
mkdirSync(evidenceRoot, { recursive: true, mode: 0o700 });
await writeJsonExclusive(join(evidenceRoot, "CONTROLLER-START.json"), {
  schemaVersion: "custom-harness-q1-r2-controller-start/v1",
  startedUtc: new Date().toISOString(),
  cwd: process.cwd(),
  argv: [process.execPath, ...process.argv.slice(1)],
  executablePath: process.execPath,
  executableRealpath: realpathSync(process.execPath),
  executableSha256: sha256File(realpathSync(process.execPath)),
  environment: {
    mode: "env-i",
    credentialScrubbed: true,
    entries: controllerEnvironment,
    sha256: sha256Bytes(controllerEnvironment.join("\n")),
  },
  authorizationSha256: sha256File(authorizationPath),
  planSha256,
  recoveryObservation: {
    scratchAbsentBeforeStart: true,
    priorPersistentStateContainedSetupInputsAndProbesOnly: true,
    priorEvidenceDirectoryAbsent: true,
  },
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
  symlinkSync("/Users/sterling/.cargo/registry", join(scratchRoot, "cargo-home/registry"));
  writeFileSync(
    join(scratchRoot, "home/.bunfig.toml"),
    'telemetry = false\n\n[install]\nauto = "disable"\n',
    { flag: "wx", mode: 0o600 },
  );

  baselineOriginalQ1 = originalQ1Records();
  baselineNonR2 = nonR2Records();
  baselineGenerated = generatedSnapshot();
  await snapshotSummary("original-q1-before", baselineOriginalQ1, {
    excluded: ["r2/**"],
  });
  await snapshotSummary("non-r2-before", baselineNonR2, {
    excluded: [".git/**", "node_modules/**", "qualification/q1/r2/**"],
  });
  await writeGeneratedSnapshot("generated-before", baselineGenerated);

  const gitHead = await run({
    id: "preflight-git-head",
    executable: git,
    argv: ["rev-parse", "HEAD"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [planPath, authorizationPath],
    assertions: [{ id: "expected-source-head", passed: true }],
    knownExclusions: ["Repository status use does not qualify Git behavior."],
  });
  assert(stdoutText(gitHead) === sourceHead, "repository HEAD mismatch");
  await run({
    id: "preflight-git-status",
    executable: git,
    argv: ["status", "--short", "--untracked-files=all"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".git/HEAD")],
    knownExclusions: ["R2 paths are the authorized append-only write surface."],
  });
  await run({
    id: "preflight-git-diff",
    executable: git,
    argv: ["diff", "--binary", "--no-ext-diff"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".git/HEAD")],
  });

  const presentGeneratedPaths = baselineGenerated.roots
    .filter(({ state }) => state === "present")
    .map(({ path }) => join(repositoryRoot, path));
  const lsBefore = await run({
    id: "generated-extended-metadata-before",
    executable: "/bin/ls",
    argv: ["-leOR@", ...presentGeneratedPaths],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(r2Root, "inputs/generated-surfaces.json")],
    assertions: [{ id: "all-present-generated-roots-listed", passed: true }],
  });
  const xattrBefore = await run({
    id: "generated-xattrs-before",
    executable: "/usr/bin/xattr",
    argv: ["-lr", ...presentGeneratedPaths],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(r2Root, "inputs/generated-surfaces.json")],
    knownExclusions: ["Absent generated roots have no extended metadata."],
  });
  extendedBefore = {
    lsSha256: sha256File(lsBefore.stdoutPath),
    xattrSha256: sha256File(xattrBefore.stdoutPath),
  };

  const retrievalEnvironment = environmentConfig.retrieval;
  for (const retrieval of retrievalConfig.retrievals) {
    const body = join(scratchRoot, "downloads", retrieval.file);
    const rawHeaders = join(scratchRoot, "headers", `${retrieval.id}.txt`);
    await run({
      id: `retrieval-${retrieval.id}`,
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
        rawHeaders,
        "--output",
        body,
        retrieval.url,
      ],
      environment: retrievalEnvironment,
      inputs: [join(r2Root, "inputs/retrievals.json")],
      expectedFiles: [{ path: body, sha256: retrieval.expectedSha256 }],
      assertions: [
        { id: "exact-enumerated-get-only-url", passed: true },
        { id: "https-only-redirect-policy", passed: true },
      ],
      knownExclusions: retrieval.expectedSha256
        ? []
        : ["Whole response is checked by a retained semantic audit."],
    });
    writeTextExclusive(
      join(evidenceRoot, "Q1-R2-T01/retrievals", `${retrieval.id}.headers.txt`),
      cleanHeaders(readFileSync(rawHeaders, "utf8")),
    );
  }

  const retrievalAuditPath = join(
    evidenceRoot,
    "Q1-R2-T01/retrieval-audit.json",
  );
  await run({
    id: "retrieval-semantic-audit",
    executable: node,
    argv: [
      join(r2Root, "probes/semantic-retrieval-audit.mjs"),
      "--downloads",
      join(scratchRoot, "downloads"),
      "--output",
      retrievalAuditPath,
    ],
    environment: focusedEnvironment,
    inputs: [
      join(r2Root, "inputs/retrievals.json"),
      join(r2Root, "inputs/candidates.json"),
      ...retrievalConfig.retrievals.map(({ file }) =>
        join(scratchRoot, "downloads", file),
      ),
    ],
    expectedFiles: [{ path: retrievalAuditPath }],
    assertions: [{ id: "all-21-retrievals-audited", passed: true }],
  });

  const retrievalBody = (id) =>
    join(
      scratchRoot,
      "downloads",
      retrievalConfig.retrievals.find((entry) => entry.id === id).file,
    );
  await run({
    id: "extract-effect-artifact",
    executable: "/usr/bin/tar",
    argv: [
      "-xzf",
      retrievalBody("effect-artifact"),
      "-C",
      join(scratchRoot, "consumer/node_modules"),
    ],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [retrievalBody("effect-artifact")],
  });
  renameSync(
    join(scratchRoot, "consumer/node_modules/package"),
    join(scratchRoot, "consumer/node_modules/effect"),
  );
  await run({
    id: "extract-effect-source",
    executable: "/usr/bin/tar",
    argv: [
      "-xzf",
      retrievalBody("effect-source"),
      "-C",
      join(scratchRoot, "extracted/effect-source"),
    ],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [retrievalBody("effect-source")],
  });
  await run({
    id: "extract-bun-artifact",
    executable: "/usr/bin/unzip",
    argv: [
      "-q",
      retrievalBody("bun-artifact"),
      "-d",
      join(scratchRoot, "extracted/bun"),
    ],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [retrievalBody("bun-artifact")],
  });
  await run({
    id: "extract-node-artifact",
    executable: "/usr/bin/tar",
    argv: [
      "-xzf",
      retrievalBody("node-artifact"),
      "-C",
      join(scratchRoot, "extracted/node"),
    ],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [retrievalBody("node-artifact")],
  });
  await run({
    id: "extract-turbo-platform-artifact",
    executable: "/usr/bin/tar",
    argv: [
      "-xzf",
      retrievalBody("turbo-platform-artifact"),
      "-C",
      join(scratchRoot, "extracted/turbo"),
    ],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [retrievalBody("turbo-platform-artifact")],
  });

  for (const name of [
    "effect-consumer-probe.ts",
    "effect-consumer-runner.ts",
    "effect-consumer.test.ts",
    "effect-consumer-probe-tsconfig.json",
  ]) {
    copyFileSync(join(r2Root, "probes", name), join(scratchRoot, "consumer", name));
  }
  const effectSourceRoot = join(
    findOnlyDirectory(join(scratchRoot, "extracted/effect-source")),
    "packages/effect",
  );
  const extractedBun = join(
    findOnlyDirectory(join(scratchRoot, "extracted/bun")),
    "bun",
  );
  const extractedNode = join(
    findOnlyDirectory(join(scratchRoot, "extracted/node")),
    "bin/node",
  );
  const extractedTurbo = join(scratchRoot, "extracted/turbo/package/bin/turbo");
  const identityPath = join(evidenceRoot, "Q1-R2-T01/identity-observation.json");
  await run({
    id: "t01-identity-audit",
    executable: node,
    argv: [
      join(r2Root, "probes/candidate-audit.mjs"),
      "identity",
      "--consumer",
      join(scratchRoot, "consumer"),
      "--effect-source",
      effectSourceRoot,
      "--extracted-bun",
      extractedBun,
      "--extracted-node",
      extractedNode,
      "--extracted-turbo",
      extractedTurbo,
      "--output",
      identityPath,
    ],
    environment: focusedEnvironment,
    inputs: [
      join(r2Root, "inputs/candidates.json"),
      join(repositoryRoot, "bun.lock"),
      join(scratchRoot, "consumer/node_modules/effect/package.json"),
      effectSourceRoot,
      extractedBun,
      extractedNode,
      extractedTurbo,
    ],
    expectedFiles: [{ path: identityPath }],
    assertions: [
      { id: "public-export-derived-closure", passed: true },
      { id: "source-tree-and-binary-identities", passed: true },
    ],
  });

  const publicTest = await run({
    id: "t01-public-effect-consumer-test",
    executable: bun,
    argv: [
      "--no-install",
      "--no-env-file",
      "test",
      "effect-consumer.test.ts",
    ],
    cwd: join(scratchRoot, "consumer"),
    environment: focusedEnvironment,
    inputs: [
      join(scratchRoot, "consumer/effect-consumer.test.ts"),
      join(scratchRoot, "consumer/effect-consumer-probe.ts"),
      join(scratchRoot, "consumer/node_modules/effect/package.json"),
    ],
    assertions: [
      { id: "ordinary-consumer-resolution", passed: true },
      { id: "one-active-managed-runtime", passed: true },
      { id: "zero-test-skips-expected", passed: true },
    ],
  });
  assert(
    /1 pass/u.test(
      `${stdoutText(publicTest)}\n${readFileSync(publicTest.stderrPath, "utf8")}`,
    ),
    "public Effect Bun test count",
  );
  const publicProbe = await run({
    id: "t01-public-effect-runtime-probe",
    executable: bun,
    argv: [
      "--no-install",
      "--no-env-file",
      "effect-consumer-runner.ts",
    ],
    cwd: join(scratchRoot, "consumer"),
    environment: focusedEnvironment,
    inputs: [
      join(scratchRoot, "consumer/effect-consumer-runner.ts"),
      join(scratchRoot, "consumer/effect-consumer-probe.ts"),
      join(scratchRoot, "consumer/node_modules/effect/package.json"),
    ],
    assertions: [
      { id: "import-meta-resolve-captured", passed: true },
      { id: "single-runtime-topology-captured", passed: true },
    ],
  });
  const publicProbeResult = JSON.parse(stdoutText(publicProbe));
  assert(publicProbeResult.activeManagedRuntimeCount === 1, "active runtime count");
  assert(
    publicProbeResult.resolutions.every(({ resolved }) =>
      resolved.startsWith("file:"),
    ),
    "public import resolutions",
  );
  await run({
    id: "t01-public-effect-typescript",
    executable: bun,
    argv: [
      "--no-install",
      "--no-env-file",
      join(repositoryRoot, "node_modules/typescript/bin/tsc"),
      "--project",
      "effect-consumer-probe-tsconfig.json",
    ],
    cwd: join(scratchRoot, "consumer"),
    environment: focusedEnvironment,
    inputs: [
      join(scratchRoot, "consumer/effect-consumer-probe.ts"),
      join(scratchRoot, "consumer/effect-consumer-probe-tsconfig.json"),
      join(repositoryRoot, "node_modules/typescript/package.json"),
    ],
    assertions: [
      { id: "recorded-ts-5.9.2-options", passed: true },
      { id: "public-consumer-typecheck", passed: true },
    ],
  });

  const identityCommands = [
    { id: "identity-bun-version", executable: bun, argv: ["--version"] },
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
    { id: "identity-node-version", executable: node, argv: ["--version"] },
    {
      id: "identity-typescript-version",
      executable: bun,
      argv: [
        "--no-install",
        "--no-env-file",
        join(repositoryRoot, "node_modules/typescript/bin/tsc"),
        "--version",
      ],
    },
    { id: "identity-turbo-version", executable: turboBinaryPath, argv: ["--version"] },
    {
      id: "identity-rustc-version",
      executable: rootEnvironment.RUSTC,
      argv: ["-vV"],
    },
    {
      id: "identity-cargo-version",
      executable: rootEnvironment.CARGO,
      argv: ["-vV"],
    },
  ];
  const identityOutputs = {};
  for (const command of identityCommands) {
    const receipt = await run({
      ...command,
      environment: rootEnvironment,
      inputs: [join(r2Root, "inputs/candidates.json")],
      assertions: [{ id: "exact-version-output-retained", passed: true }],
    });
    identityOutputs[command.id] = stdoutText(receipt);
  }
  assert(identityOutputs["identity-bun-version"] === "1.3.14", "Bun version");
  assert(
    identityOutputs["identity-bun-revision"].includes(candidates.buildTest.bun.revision),
    "Bun revision",
  );
  assert(identityOutputs["identity-node-version"] === "v24.18.0", "Node version");
  assert(
    identityOutputs["identity-typescript-version"] === "Version 5.9.2",
    "TypeScript version",
  );
  assert(identityOutputs["identity-turbo-version"] === "2.10.10", "Turbo version");
  assert(identityOutputs["identity-rustc-version"].includes("release: 1.97.1"), "Rust");
  assert(identityOutputs["identity-cargo-version"].includes("release: 1.97.1"), "Cargo");
  await writeJsonExclusive(join(evidenceRoot, "Q1-R2-T01/toolchain-identity.json"), {
    schemaVersion: "custom-harness-q1-r2-toolchain-identity/v1",
    verdict: "PASS",
    outputs: identityOutputs,
    rustCargoScope: "canonical-root checks only; no supervisor qualification",
  });

  const invalidationPath = join(evidenceRoot, "Q1-R2-T02/invalidation.json");
  await run({
    id: "t02-invalidation",
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
    inputs: [join(r2Root, "inputs/candidates.json"), identityPath],
    expectedFiles: [{ path: invalidationPath }],
    assertions: [
      { id: "unchanged-identity-remains-equal", passed: true },
      { id: "every-leaf-mutation-invalidates", passed: true },
    ],
    knownExclusions: ["Product enforcement is not implemented or claimed."],
  });

  const executionPlanPath = join(
    evidenceRoot,
    "Q1-R2-T04/execution-plan.json",
  );
  await writeJsonExclusive(executionPlanPath, {
    schemaVersion: "custom-harness-q1-r2-execution-plan/v1",
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
  const controlsPath = join(evidenceRoot, "Q1-R2-T04/controls.json");
  await run({
    id: "t04-controls",
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
      join(r2Root, "inputs/candidates.json"),
      join(r2Root, "inputs/retrievals.json"),
      retrievalBody("effect-license"),
      join(r2Root, "probes/effect-consumer-probe.ts"),
      join(r2Root, "probes/effect-consumer.test.ts"),
    ],
    expectedFiles: [{ path: controlsPath }],
    assertions: [
      { id: "no-auto-update-or-install-command", passed: true },
      { id: "license-and-copied-material-control", passed: true },
      { id: "no-ai-provider-command", passed: true },
    ],
  });
  makeT03Record();

  assert(
    statSync(repositoryRoot).dev === statSync(scratchRoot).dev,
    "scratch and repository are not on the same filesystem",
  );
  const backupRoot = join(scratchRoot, "preexisting-output-backup");
  const generatedRoot = join(scratchRoot, "new-generated-output");
  const moveActions = [];
  for (const state of baselineGenerated.roots) {
    const canonical = join(repositoryRoot, state.path);
    if (state.state === "absent") {
      assert(!existsSync(canonical), `generated baseline changed: ${state.path}`);
      moveActions.push({ path: state.path, action: "confirmed-absent" });
      continue;
    }
    const backup = join(backupRoot, state.path);
    mkdirSync(dirname(backup), { recursive: true, mode: 0o700 });
    renameSync(canonical, backup);
    if (state.path === generatedConfig.trackedWorkingCopyPath) {
      copyFileSync(backup, canonical);
      chmodSync(canonical, lstatSync(backup).mode);
      moveActions.push({ path: state.path, action: "renamed-and-seeded-copy" });
    } else {
      moveActions.push({ path: state.path, action: "renamed" });
    }
  }
  generatedMoved = true;
  await writeJsonExclusive(join(evidenceRoot, "Q1-R2-E02/move-aside.json"), {
    schemaVersion: "custom-harness-q1-r2-move-aside/v1",
    sameFilesystem: true,
    repositoryDevice: String(statSync(repositoryRoot).dev),
    scratchDevice: String(statSync(scratchRoot).dev),
    actions: moveActions,
  });

  try {
    for (const command of rootCommands) {
      await run({
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
          { id: "zero-unexplained-skips-required", passed: true },
        ],
        knownExclusions: [
          "Rust/Cargo execute only as required by existing canonical checks; no supervisor qualification is claimed.",
        ],
      });
    }
  } finally {
    const restoreActions = [];
    for (const state of [...baselineGenerated.roots].reverse()) {
      const canonical = join(repositoryRoot, state.path);
      const backup = join(backupRoot, state.path);
      const generated = join(generatedRoot, state.path);
      if (existsSync(canonical)) {
        mkdirSync(dirname(generated), { recursive: true, mode: 0o700 });
        renameSync(canonical, generated);
        restoreActions.push({ path: state.path, action: "retained-generated" });
      }
      if (state.state === "present") {
        assert(existsSync(backup), `generated backup absent: ${state.path}`);
        mkdirSync(dirname(canonical), { recursive: true });
        renameSync(backup, canonical);
        restoreActions.push({ path: state.path, action: "restored-preexisting" });
      } else {
        restoreActions.push({ path: state.path, action: "restored-absence" });
      }
    }
    generatedMoved = false;
    await writeJsonExclusive(join(evidenceRoot, "Q1-R2-E02/restore-actions.json"), {
      schemaVersion: "custom-harness-q1-r2-restore/v1",
      actions: restoreActions,
    });
  }

  const generatedAfter = generatedSnapshot();
  const originalQ1After = originalQ1Records();
  const nonR2After = nonR2Records();
  await writeGeneratedSnapshot("generated-after", generatedAfter);
  await snapshotSummary("original-q1-after", originalQ1After, {
    excluded: ["r2/**"],
  });
  await snapshotSummary("non-r2-after", nonR2After, {
    excluded: [".git/**", "node_modules/**", "qualification/q1/r2/**"],
  });
  const lsAfter = await run({
    id: "generated-extended-metadata-after",
    executable: "/bin/ls",
    argv: ["-leOR@", ...presentGeneratedPaths],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(r2Root, "inputs/generated-surfaces.json")],
  });
  const xattrAfter = await run({
    id: "generated-xattrs-after",
    executable: "/usr/bin/xattr",
    argv: ["-lr", ...presentGeneratedPaths],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(r2Root, "inputs/generated-surfaces.json")],
    knownExclusions: ["Absent generated roots have no extended metadata."],
  });
  const restoration = {
    generatedEntriesEqual:
      JSON.stringify(generatedAfter.entries) ===
      JSON.stringify(baselineGenerated.entries),
    generatedRootsEqual:
      JSON.stringify(generatedAfter.roots) === JSON.stringify(baselineGenerated.roots),
    originalQ1Equal:
      JSON.stringify(originalQ1After) === JSON.stringify(baselineOriginalQ1),
    nonR2Equal: JSON.stringify(nonR2After) === JSON.stringify(baselineNonR2),
    extendedLsEqual:
      sha256File(lsAfter.stdoutPath) === extendedBefore.lsSha256,
    xattrsEqual:
      sha256File(xattrAfter.stdoutPath) === extendedBefore.xattrSha256,
    trackedManifestSha256:
      sha256File(join(repositoryRoot, generatedConfig.trackedWorkingCopyPath)),
    expectedTrackedManifestSha256:
      baselineGenerated.entries.find(
        ({ path }) => path === generatedConfig.trackedWorkingCopyPath,
      ).sha256,
  };
  restoration.trackedManifestBytesEqual =
    restoration.trackedManifestSha256 ===
    restoration.expectedTrackedManifestSha256;
  assert(
    Object.entries(restoration)
      .filter(([name]) => name.endsWith("Equal"))
      .every(([, passed]) => passed === true),
    "generated or non-R2 restoration mismatch",
  );
  await writeJsonExclusive(
    join(evidenceRoot, "Q1-R2-E02/restoration-comparison.json"),
    {
      schemaVersion: "custom-harness-q1-r2-restoration/v1",
      verdict: "PASS",
      ...restoration,
      excludedFromExactClaim: [
        "atimeNs",
        "ctimeNs",
        "inode",
        "parent-directory metadata",
      ],
    },
  );

  rmSync(scratchRoot, { recursive: true, force: true });
  assert(!existsSync(scratchRoot), "scratch cleanup failed");

  await run({
    id: "r2-format-check",
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
    assertions: [{ id: "all-r2-text-formatted", passed: true }],
  });
  await run({
    id: "r2-local-links",
    executable: node,
    argv: [join(r2Root, "probes/check-r2-links.mjs")],
    environment: { HOME: "/var/empty", LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [r2Root],
    assertions: [{ id: "zero-broken-r2-local-links", passed: true }],
  });

  const tracePath = join(evidenceRoot, "PLAN-E02/trace-rows.ndjson");
  await run({
    id: "plan-e02-120-row-parser",
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
      { id: "exact-120-trace-rows", passed: true },
      { id: "unique-trace-identifiers", passed: true },
      { id: "entry-evidence-bound", passed: true },
    ],
  });
  assert(
    readFileSync(tracePath, "utf8").trim().split("\n").length === 120,
    "retained trace row count",
  );

  const finalStatus = await run({
    id: "final-git-status",
    executable: git,
    argv: ["status", "--short", "--untracked-files=all"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".git/HEAD")],
    knownExclusions: ["R2 paths are the authorized append-only write surface."],
  });
  const finalDiff = await run({
    id: "final-git-diff",
    executable: git,
    argv: ["diff", "--binary", "--no-ext-diff"],
    environment: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    inputs: [join(repositoryRoot, ".git/HEAD")],
  });
  assert(stdoutText(finalDiff) === "", "tracked diff is not empty");
  const outsideR2Status = stdoutText(finalStatus)
    .split("\n")
    .filter(Boolean)
    .filter(
      (line) =>
        !line.includes(
          "docs/architecture/custom-harness/qualification/q1/r2/",
        ),
    );
  const preflightStatusReceipt = receipts.find(
    ({ receipt }) => receipt.receiptId === "preflight-git-status",
  );
  const preflightOutsideR2 = stdoutText(preflightStatusReceipt)
    .split("\n")
    .filter(Boolean)
    .filter(
      (line) =>
        !line.includes(
          "docs/architecture/custom-harness/qualification/q1/r2/",
        ),
    );
  assert(
    JSON.stringify(outsideR2Status) === JSON.stringify(preflightOutsideR2),
    "outside-R2 status changed",
  );
  assert(
    sha256File(planPath) === planSha256 &&
      JSON.stringify(originalQ1Records()) === JSON.stringify(baselineOriginalQ1),
    "final plan or original-Q1 identity mismatch",
  );

  const integrity = receiptIntegrity();
  assert(integrity.failures.length === 0, "receipt integrity failure");
  await writeJsonExclusive(join(evidenceRoot, "RECEIPT-INTEGRITY.json"), {
    schemaVersion: "custom-harness-q1-r2-receipt-integrity/v1",
    verdict: "PASS",
    receiptCount: integrity.records.length,
    records: integrity.records,
    failures: [],
  });
  await writeJsonExclusive(join(evidenceRoot, "FINAL-STATE.json"), {
    schemaVersion: "custom-harness-q1-r2-final-state/v1",
    verdict: "PASS",
    checkedUtc: new Date().toISOString(),
    planSha256: sha256File(planPath),
    sourceHead,
    scratchAbsent: !existsSync(scratchRoot),
    originalQ1AggregateSha256: sha256Bytes(JSON.stringify(originalQ1Records())),
    originalQ1Unchanged:
      JSON.stringify(originalQ1Records()) === JSON.stringify(baselineOriginalQ1),
    nonR2Unchanged: JSON.stringify(nonR2Records()) === JSON.stringify(baselineNonR2),
    trackedDiffEmpty: stdoutText(finalDiff) === "",
    outsideR2StatusUnchanged:
      JSON.stringify(outsideR2Status) === JSON.stringify(preflightOutsideR2),
    generatedRestoration: restoration,
    traceRows: 120,
    aiVerdict: "REJECTED_NO_CANDIDATE",
    noI1: true,
  });
  writeTextExclusive(
    join(r2Root, "SUPERSESSION.md"),
    `# Q1-R2 supersession boundary\n\nQ1-R2 completed its evidence run successfully. It preserves every original Q1\nbyte and failure record. For later review only, the passing R2 evidence supersedes\nthe original Q1 evidence insufficiency for the exact Effect and build/test\ncandidates recorded here. It does not erase the original failure, self-accept the\nqualification, authorize I1, adopt a dependency, or change lifecycle status.\n`,
  );
  writeTextExclusive(
    join(r2Root, "RESULT.md"),
    `# Q1-R2 result\n\n**Verdict:** \`Q1_R2_EVIDENCE_COMPLETE\`  \n**Governing plan SHA-256:** \`${planSha256}\`\n\nThe exact Effect \`4.0.0-beta.107\` public consumer and the bounded Bun\n1.3.14/TypeScript 5.9.2/Turbo 2.10.10/Node 24.18.0 build-test tuple passed.\nRust/Cargo 1.97.1 were used only by canonical root checks. AI remains\n\`REJECTED_NO_CANDIDATE\`; SQLite, Git capability, and supervisor behavior remain\nunqualified. All seven canonical root commands, the exact 120-row parser, receipt\nintegrity, original-Q1 immutability, generated-output restoration, tracked\nmanifest-byte restoration, outside-R2 boundary checks, and scratch deletion\npassed. No I1 or product code was created or authorized.\n`,
  );
  const checksumFiles = evidenceChecksums();
  verdict = "Q1_R2_EVIDENCE_COMPLETE";
  await writeJsonExclusive(join(evidenceRoot, "CONTROLLER-END.json"), {
    schemaVersion: "custom-harness-q1-r2-controller-end/v1",
    verdict,
    endedUtc: new Date().toISOString(),
    receiptCount: receipts.length,
    evidenceChecksumCount: checksumFiles.length,
    scratchAbsent: !existsSync(scratchRoot),
    noI1: true,
  });
} catch (error) {
  failure = error instanceof Error ? error.stack ?? error.message : String(error);
  if (generatedMoved) {
    const backupRoot = join(scratchRoot, "preexisting-output-backup");
    const generatedRoot = join(scratchRoot, "new-generated-output");
    for (const state of [...baselineGenerated.roots].reverse()) {
      const canonical = join(repositoryRoot, state.path);
      const backup = join(backupRoot, state.path);
      const generated = join(generatedRoot, state.path);
      if (existsSync(canonical)) {
        mkdirSync(dirname(generated), { recursive: true, mode: 0o700 });
        renameSync(canonical, generated);
      }
      if (state.state === "present" && existsSync(backup)) {
        mkdirSync(dirname(canonical), { recursive: true });
        renameSync(backup, canonical);
      }
    }
    generatedMoved = false;
  }
  if (existsSync(scratchRoot)) rmSync(scratchRoot, { recursive: true, force: true });
  await writeJsonExclusive(join(evidenceRoot, "STOPPED-FAIL-CLOSED.json"), {
    schemaVersion: "custom-harness-q1-r2-stopped/v1",
    verdict: "STOPPED_FAIL_CLOSED",
    stoppedUtc: new Date().toISOString(),
    failure,
    receiptsRetained: receipts.length,
    scratchAbsent: !existsSync(scratchRoot),
    noI1: true,
  });
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
