import { spawn } from "node:child_process";
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import prettier from "prettier";

const repositoryRoot = resolve(import.meta.dirname, "../../../../../../..");
const r2Root = resolve(import.meta.dirname, "..");
const scratchRoot =
  "/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/custom-harness-q1-r2";
const authorizationPath = join(
  r2Root,
  "authorization/PLAN-E02-Q1-R2-AUTHORIZATION.md",
);
const generatedConfigPath = join(r2Root, "inputs/generated-surfaces.json");
const originalQ1ManifestPath = join(
  r2Root,
  "evidence/Q1-R2-E02/original-q1-before.json",
);
const sourceHead = "8670d358f761003c49902db5f148baab0c2e6be4";

const sha256Bytes = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
const sha256File = (path) => sha256Bytes(readFileSync(path));
const jsonFormat = async (value) =>
  prettier.format(JSON.stringify(value), { parser: "json" });
const writeJson = async (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, await jsonFormat(value), { flag: "wx" });
};

const treeEntries = (absoluteRoot, base = absoluteRoot) => {
  if (!existsSync(absoluteRoot)) return [];
  const entry = lstatSync(absoluteRoot, { bigint: true });
  const path = relative(base, absoluteRoot) || ".";
  const common = {
    path,
    mode: Number(entry.mode),
    size: entry.size.toString(),
    mtimeNs: entry.mtimeNs.toString(),
  };
  if (entry.isSymbolicLink()) {
    return [{ ...common, type: "symlink", target: readlinkSync(absoluteRoot) }];
  }
  if (entry.isFile()) return [{ ...common, type: "file" }];
  if (!entry.isDirectory()) return [{ ...common, type: "other" }];
  const children = readdirSync(absoluteRoot)
    .sort((a, b) => a.localeCompare(b, "en"))
    .flatMap((name) => treeEntries(join(absoluteRoot, name), base));
  return [{ ...common, type: "directory" }, ...children];
};

const quickGeneratedInventory = async (receiptId, phase, evidenceDirectory) => {
  const config = JSON.parse(readFileSync(generatedConfigPath, "utf8"));
  const surfaces = config.paths.map((path) => {
    const absolute = join(repositoryRoot, path);
    if (!existsSync(absolute)) {
      return { path, state: "absent", entryCount: 0, manifestSha256: null };
    }
    const entries = treeEntries(absolute);
    return {
      path,
      state: "present",
      entryCount: entries.length,
      manifestSha256: sha256Bytes(JSON.stringify(entries)),
    };
  });
  const snapshot = {
    schemaVersion: "custom-harness-q1-r2-quick-generated-inventory/v1",
    receiptId,
    phase,
    surfaces,
  };
  const path = join(evidenceDirectory, `${receiptId}.generated-${phase}.json`);
  await writeJson(path, snapshot);
  return { path, sha256: sha256File(path) };
};

const hashInput = (path) => {
  const absolute = resolve(repositoryRoot, path);
  if (!existsSync(absolute)) return { path: absolute, state: "absent" };
  const stat = lstatSync(absolute);
  if (stat.isFile()) return { path: absolute, sha256: sha256File(absolute) };
  const entries = treeEntries(absolute);
  return {
    path: absolute,
    sha256: sha256Bytes(JSON.stringify(entries)),
    kind: stat.isDirectory() ? "directory-manifest" : "other-manifest",
  };
};

const secretLike = (key) =>
  /(^|_)(TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIALS?|COOKIE|SESSION|SSH_AUTH_SOCK|API_KEY|OPENAI|ANTHROPIC|AWS|AZURE|GOOGLE|GCP)(_|$)/i.test(
    key,
  );

const waitForChild = (child) =>
  new Promise((resolveChild) => {
    child.once("error", (error) => resolveChild({ error }));
    child.once("exit", (exitCode, signal) =>
      resolveChild({ exitCode, signal, error: null }),
    );
  });

const buildRetrieval = (retrievalId) => {
  const retrievals = JSON.parse(
    readFileSync(join(r2Root, "inputs/retrievals.json"), "utf8"),
  ).retrievals;
  const retrieval = retrievals.find(({ id }) => id === retrievalId);
  if (!retrieval) throw new Error(`unknown retrieval: ${retrievalId}`);
  const environment = JSON.parse(
    readFileSync(join(r2Root, "inputs/environment.json"), "utf8"),
  ).retrieval;
  const outputPath = join(scratchRoot, "downloads", retrieval.file);
  const evidenceDirectory = join(
    r2Root,
    "evidence/Q1-R2-T01/retrievals",
  );
  return {
    receiptId: `retrieval-${retrieval.id}`,
    evidenceDirectory,
    executable: "/usr/bin/curl",
    cwd: repositoryRoot,
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
      join(evidenceDirectory, `${retrieval.id}.headers.txt`),
      "--output",
      outputPath,
      retrieval.url,
    ],
    environment,
    inputs: ["docs/architecture/custom-harness/qualification/q1/r2/inputs/retrievals.json"],
    expectedExitCode: 0,
    expectedFiles: retrieval.expectedSha256
      ? [{ path: outputPath, sha256: retrieval.expectedSha256 }]
      : [{ path: outputPath, sha256: null }],
    assertions: { passed: retrieval.expectedSha256 ? 2 : 1, failed: 0, skipped: 0 },
    knownExclusions: retrieval.expectedSha256
      ? []
      : [
          "The immutable original ledger retained a semantic expectation but no whole-response SHA-256; a separate semantic audit is mandatory.",
        ],
  };
};

const buildCommand = (commandId) => {
  const commands = JSON.parse(
    readFileSync(join(r2Root, "inputs/commands.json"), "utf8"),
  ).commands;
  const command = commands.find(({ id }) => id === commandId);
  if (!command) throw new Error(`unknown command: ${commandId}`);
  return {
    ...command,
    receiptId: command.id,
    evidenceDirectory: resolve(r2Root, command.evidenceDirectory),
    cwd: resolve(repositoryRoot, command.cwd),
  };
};

const [mode, id] = process.argv.slice(2);
if (!mode || !id || !["command", "retrieval"].includes(mode)) {
  throw new Error(
    "usage: bun run-receipt.mjs <command|retrieval> <configured-id>",
  );
}

const configured = mode === "retrieval" ? buildRetrieval(id) : buildCommand(id);
const receiptId = configured.receiptId;
const evidenceDirectory = configured.evidenceDirectory;
mkdirSync(evidenceDirectory, { recursive: true });
const receiptPath = join(evidenceDirectory, `${receiptId}.receipt.json`);
const stdoutPath = join(evidenceDirectory, `${receiptId}.stdout.bin`);
const stderrPath = join(evidenceDirectory, `${receiptId}.stderr.bin`);
const eventsPath = join(evidenceDirectory, `${receiptId}.events.ndjson`);
for (const path of [receiptPath, stdoutPath, stderrPath, eventsPath]) {
  if (existsSync(path)) throw new Error(`refusing to overwrite evidence: ${path}`);
}

const environmentEntries = Object.entries(configured.environment ?? {})
  .map(([key, value]) => `${key}=${value}`)
  .sort((a, b) => a.localeCompare(b, "en"));
const forbiddenEnvironment = environmentEntries
  .map((entry) => entry.slice(0, entry.indexOf("=")))
  .filter(secretLike);
const executablePath = resolve(configured.executable);
const executableRealpath = realpathSync(executablePath);
const inputs = (configured.inputs ?? []).map(hashInput);
const before = await quickGeneratedInventory(
  receiptId,
  "before",
  evidenceDirectory,
);
const startedUtc = new Date().toISOString();
const startedNs = process.hrtime.bigint();
writeFileSync(
  eventsPath,
  `${JSON.stringify({ event: "start", receiptId, at: startedUtc })}\n`,
  { flag: "wx" },
);

let outcome;
if (forbiddenEnvironment.length > 0) {
  writeFileSync(stdoutPath, "", { flag: "wx" });
  writeFileSync(stderrPath, "pre-spawn secret-like environment rejection\n", {
    flag: "wx",
  });
  outcome = {
    exitCode: null,
    signal: null,
    error: new Error(
      `secret-like environment keys: ${forbiddenEnvironment.join(",")}`,
    ),
  };
} else {
  const stdoutFd = openSync(stdoutPath, "wx", 0o600);
  const stderrFd = openSync(stderrPath, "wx", 0o600);
  try {
    const child = spawn(executablePath, configured.argv ?? [], {
      cwd: configured.cwd,
      env: Object.fromEntries(
        environmentEntries.map((entry) => {
          const equals = entry.indexOf("=");
          return [entry.slice(0, equals), entry.slice(equals + 1)];
        }),
      ),
      shell: false,
      stdio: ["ignore", stdoutFd, stderrFd],
    });
    outcome = await waitForChild(child);
  } finally {
    closeSync(stdoutFd);
    closeSync(stderrFd);
  }
}

const endedNs = process.hrtime.bigint();
const endedUtc = new Date().toISOString();
const fileAssertions = (configured.expectedFiles ?? []).map((expected) => {
  const exists = existsSync(expected.path);
  const actualSha256 = exists ? sha256File(expected.path) : null;
  return {
    path: expected.path,
    exists,
    expectedSha256: expected.sha256,
    actualSha256,
    passed:
      exists &&
      (expected.sha256 === null || expected.sha256 === actualSha256),
  };
});
const expectedExitCode = configured.expectedExitCode ?? 0;
const processPassed =
  !outcome.error && outcome.exitCode === expectedExitCode && !outcome.signal;
const filesPassed = fileAssertions.every(({ passed }) => passed);
const after = await quickGeneratedInventory(
  receiptId,
  "after",
  evidenceDirectory,
);
writeFileSync(
  eventsPath,
  `${JSON.stringify({
    event: "end",
    receiptId,
    at: endedUtc,
    exitCode: outcome.exitCode ?? null,
    signal: outcome.signal ?? null,
  })}\n`,
  { flag: "a" },
);

const streamRecord = (path) => ({
  path,
  bytes: statSync(path).size,
  sha256: sha256File(path),
});
const originalQ1ManifestSha256 = existsSync(originalQ1ManifestPath)
  ? sha256File(originalQ1ManifestPath)
  : null;
const dirtyStatusPath = join(
  r2Root,
  "evidence/Q1-R2-E02/preflight-status.stdout.bin",
);
const receipt = {
  schemaVersion: "custom-harness-q1-r2-receipt/v1",
  receiptId,
  authorization: {
    path: authorizationPath,
    sha256: sha256File(authorizationPath),
  },
  source: {
    head: sourceHead,
    dirtyStatusSha256: existsSync(dirtyStatusPath)
      ? sha256File(dirtyStatusPath)
      : null,
    originalQ1ManifestSha256,
  },
  command: {
    cwd: configured.cwd,
    argv: [executablePath, ...(configured.argv ?? [])],
    executablePath,
    executableRealpath,
    executableSha256: sha256File(executableRealpath),
    shell: false,
  },
  environment: {
    mode: "env-i",
    entries: environmentEntries,
    sha256: sha256Bytes(environmentEntries.join("\n")),
  },
  time: {
    startedUtc,
    endedUtc,
    monotonicDurationNs: (endedNs - startedNs).toString(),
  },
  process: {
    exitCode: outcome.exitCode ?? null,
    signal: outcome.signal ?? null,
    spawnError: outcome.error ? String(outcome.error.message ?? outcome.error) : null,
  },
  streams: {
    stdout: streamRecord(stdoutPath),
    stderr: streamRecord(stderrPath),
    events: streamRecord(eventsPath),
  },
  inputs,
  generatedInventory: {
    beforePath: before.path,
    beforeSha256: before.sha256,
    afterPath: after.path,
    afterSha256: after.sha256,
  },
  fileAssertions,
  assertions: {
    passed:
      (configured.assertions?.passed ?? 0) +
      (processPassed ? 1 : 0) +
      fileAssertions.filter(({ passed }) => passed).length,
    failed:
      (configured.assertions?.failed ?? 0) +
      (processPassed ? 0 : 1) +
      fileAssertions.filter(({ passed }) => !passed).length,
    skipped: configured.assertions?.skipped ?? 0,
  },
  verdict: processPassed && filesPassed ? "PASS" : "FAIL",
  knownExclusions: configured.knownExclusions ?? [],
};
await writeJson(receiptPath, receipt);
if (receipt.verdict !== "PASS") process.exitCode = 1;
