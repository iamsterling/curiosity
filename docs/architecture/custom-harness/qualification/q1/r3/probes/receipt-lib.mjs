import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import prettier from "prettier";

export const repositoryRoot = resolve(
  import.meta.dirname,
  "../../../../../../..",
);
export const r3Root = resolve(import.meta.dirname, "..");
export const scratchRoot =
  "/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/custom-harness-q1-r3";

export const sha256Bytes = (value) =>
  createHash("sha256").update(value).digest("hex");
export const sha256File = (path) => sha256Bytes(readFileSync(path));

export const writeJsonExclusive = async (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  const formatted = await prettier.format(JSON.stringify(value), {
    parser: "json",
  });
  writeFileSync(path, formatted, { flag: "wx", mode: 0o600 });
};

export const writeTextExclusive = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value, { flag: "wx", mode: 0o600 });
};

const contentManifest = (path, base = path) => {
  if (!existsSync(path)) return [{ path: ".", type: "absent" }];
  const stat = lstatSync(path, { bigint: true });
  const display = relative(base, path) || ".";
  const common = {
    path: display,
    mode: Number(stat.mode),
    uid: Number(stat.uid),
    gid: Number(stat.gid),
    bytes: stat.size.toString(),
    mtimeNs: stat.mtimeNs.toString(),
  };
  if (stat.isSymbolicLink()) {
    return [{ ...common, type: "symlink", target: readlinkSync(path) }];
  }
  if (stat.isFile()) {
    return [{ ...common, type: "file", sha256: sha256File(path) }];
  }
  if (!stat.isDirectory()) return [{ ...common, type: "other" }];
  const children = readdirSync(path)
    .sort((left, right) => Buffer.from(left).compare(Buffer.from(right)))
    .flatMap((name) => contentManifest(join(path, name), base));
  return [{ ...common, type: "directory" }, ...children];
};

export const hashInput = (path) => {
  const absolute = resolve(path);
  if (!existsSync(absolute)) return { path: absolute, state: "absent" };
  const stat = lstatSync(absolute);
  if (stat.isFile()) {
    return {
      path: absolute,
      kind: "file",
      bytes: stat.size,
      sha256: sha256File(absolute),
    };
  }
  const manifest = contentManifest(absolute);
  return {
    path: absolute,
    kind: stat.isDirectory() ? "directory-manifest" : "other-manifest",
    entryCount: manifest.length,
    sha256: sha256Bytes(JSON.stringify(manifest)),
  };
};

const quickGeneratedInventory = () => {
  const config = JSON.parse(
    readFileSync(join(r3Root, "inputs/generated-surfaces.json"), "utf8"),
  );
  const roots = config.paths.map((path) => {
    const absolute = join(repositoryRoot, path);
    if (!existsSync(absolute)) return { path, state: "absent" };
    const stat = lstatSync(absolute, { bigint: true });
    return {
      path,
      state: "present",
      type: stat.isDirectory()
        ? "directory"
        : stat.isFile()
          ? "file"
          : stat.isSymbolicLink()
            ? "symlink"
            : "other",
      bytes: stat.size.toString(),
      mode: Number(stat.mode),
      mtimeNs: stat.mtimeNs.toString(),
    };
  });
  return { roots, sha256: sha256Bytes(JSON.stringify(roots)) };
};

const forbiddenEnvironmentName = (name) =>
  /(^|_)(TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIALS?|COOKIE|SESSION|SSH_AUTH_SOCK|API_KEY|OPENAI|ANTHROPIC|AWS|AZURE|GOOGLE|GCP)(_|$)/iu.test(
    name,
  );

const waitForChild = (child) =>
  new Promise((complete) => {
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      complete(value);
    };
    child.once("error", (error) =>
      finish({ exitCode: null, signal: null, error }),
    );
    child.once("exit", (exitCode, signal) =>
      finish({ exitCode, signal, error: null }),
    );
  });

export const runRecorded = async ({
  sequence,
  id,
  executable,
  argv = [],
  cwd = repositoryRoot,
  environment,
  inputs = [],
  expectedExitCode = 0,
  expectedFiles = [],
  assertions = [],
  skips = [],
  knownExclusions = [],
}) => {
  const safeId = `${String(sequence).padStart(3, "0")}-${id}`;
  const directory = join(r3Root, "evidence/receipts", safeId);
  if (existsSync(directory)) {
    throw new Error(`refusing to overwrite receipt directory: ${directory}`);
  }
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const stdoutPath = join(directory, "stdout.bin");
  const stderrPath = join(directory, "stderr.bin");
  const eventsPath = join(directory, "events.ndjson");
  const receiptPath = join(directory, "receipt.json");
  const entries = Object.entries(environment)
    .map(([name, value]) => [name, String(value)])
    .sort(([left], [right]) => left.localeCompare(right, "en"));
  const forbidden = entries
    .map(([name]) => name)
    .filter(forbiddenEnvironmentName);
  if (forbidden.length > 0) {
    throw new Error(
      `secret-like environment names rejected: ${forbidden.join(",")}`,
    );
  }
  const executablePath = resolve(executable);
  const executableRealpath = realpathSync(executablePath);
  const authorizationPath = join(
    r3Root,
    "authorization/PLAN-E02-Q1-R3-AUTHORIZATION.md",
  );
  const inputRecords = inputs.map(hashInput);
  const generatedBefore = quickGeneratedInventory();
  const startedUtc = new Date().toISOString();
  const startedNs = process.hrtime.bigint();
  writeTextExclusive(
    eventsPath,
    `${JSON.stringify({ event: "start", id, at: startedUtc })}\n`,
  );
  const stdoutFd = openSync(stdoutPath, "wx", 0o600);
  const stderrFd = openSync(stderrPath, "wx", 0o600);
  let outcome;
  try {
    const child = spawn(executablePath, argv, {
      cwd,
      env: Object.fromEntries(entries),
      shell: false,
      stdio: ["ignore", stdoutFd, stderrFd],
    });
    outcome = await waitForChild(child);
  } finally {
    closeSync(stdoutFd);
    closeSync(stderrFd);
  }
  const endedNs = process.hrtime.bigint();
  const endedUtc = new Date().toISOString();
  writeFileSync(
    eventsPath,
    `${JSON.stringify({
      event: "end",
      id,
      at: endedUtc,
      exitCode: outcome.exitCode,
      signal: outcome.signal,
    })}\n`,
    { flag: "a" },
  );
  const generatedAfter = quickGeneratedInventory();
  const fileAssertions = expectedFiles.map(({ path, sha256 = null }) => {
    const exists = existsSync(path);
    const actualSha256 = exists ? sha256File(path) : null;
    return {
      path,
      expectedSha256: sha256,
      actualSha256,
      passed: exists && (sha256 === null || sha256 === actualSha256),
    };
  });
  const processPassed =
    !outcome.error &&
    outcome.exitCode === expectedExitCode &&
    outcome.signal === null;
  const explicitPassed = assertions.every(({ passed }) => passed === true);
  const filesPassed = fileAssertions.every(({ passed }) => passed);
  const streamRecord = (path) => ({
    path,
    bytes: statSync(path).size,
    sha256: sha256File(path),
  });
  const receipt = {
    schemaVersion: "custom-harness-q1-r3-receipt/v1",
    receiptId: id,
    sequence,
    authorization: {
      path: authorizationPath,
      sha256: sha256File(authorizationPath),
    },
    command: {
      cwd,
      argv: [executablePath, ...argv],
      executablePath,
      executableRealpath,
      executableSha256: sha256File(executableRealpath),
      shell: false,
    },
    environment: {
      mode: "env-i",
      entries: entries.map(([name, value]) => `${name}=${value}`),
      sha256: sha256Bytes(
        entries.map(([name, value]) => `${name}=${value}`).join("\n"),
      ),
      credentialScrubbed: true,
    },
    time: {
      startedUtc,
      endedUtc,
      monotonicDurationNs: (endedNs - startedNs).toString(),
    },
    process: {
      expectedExitCode,
      exitCode: outcome.exitCode,
      signal: outcome.signal,
      spawnError: outcome.error
        ? String(outcome.error.message ?? outcome.error)
        : null,
    },
    streams: {
      stdout: streamRecord(stdoutPath),
      stderr: streamRecord(stderrPath),
      events: streamRecord(eventsPath),
    },
    inputs: inputRecords,
    generatedInventory: {
      before: generatedBefore,
      after: generatedAfter,
    },
    assertions: [
      { id: "expected-process-exit", passed: processPassed },
      ...assertions,
      ...fileAssertions.map((entry, index) => ({
        id: `expected-file-${index + 1}`,
        passed: entry.passed,
        details: entry,
      })),
    ],
    skips,
    knownExclusions,
    verdict: processPassed && explicitPassed && filesPassed ? "PASS" : "FAIL",
  };
  await writeJsonExclusive(receiptPath, receipt);
  return { receipt, receiptPath, stdoutPath, stderrPath };
};
