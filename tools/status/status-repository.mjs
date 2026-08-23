import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { constants } from "node:fs";
import { lstat, open, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { noFollowFlag } from "./status-generated-write.mjs";
import { M7_HISTORICAL_ACCEPTANCE, SDK_ACCEPTANCE_RECEIPT, SDK_STATUS_ANCHORS, WAVE_1_HISTORICAL_SNAPSHOT } from "./status-registry.mjs";
import { assertEvidenceFragment, assertRepositoryPath, normalizeEvidenceText, statusFailure } from "./status-validation.mjs";

const slash = (value) => value.split(path.sep).join("/");
const IGNORED_DISCOVERY_DIRECTORIES = new Set([".git", ".turbo", "dist", "node_modules", "target"]);

const runGit = (root, arguments_) => new Promise((resolve, reject) => {
  execFile("git", ["-C", root, ...arguments_], { encoding: "utf8", maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    if (!error) return resolve({ code: 0, stdout });
    if (typeof error.code === "number") return resolve({ code: error.code, stdout });
    error.message = `${error.message}: ${stderr}`;
    reject(error);
  });
});

const gitOutput = async (root, arguments_) => {
  const result = await runGit(root, arguments_);
  if (result.code !== 0) throw new Error(`git ${arguments_[0]} exited ${result.code}`);
  return result.stdout.trim();
};

const inside = (root, target) => {
  const difference = path.relative(root, target);
  return difference === "" || (!difference.startsWith(`..${path.sep}`) && difference !== ".." && !path.isAbsolute(difference));
};

const missing = (relative) => {
  const error = new Error(`ENOENT: ${relative}`);
  error.code = "ENOENT";
  return error;
};

const inspectRepositoryPath = async (rootPromise, relative, allowMissing = false, discovered = false) => {
  if (!discovered) assertRepositoryPath(relative);
  const root = await rootPromise;
  let absolute = root;
  const segments = relative.split("/");
  for (const [index, segment] of segments.entries()) {
    absolute = path.join(absolute, segment);
    let info;
    try {
      info = await lstat(absolute);
    } catch (error) {
      if (allowMissing && error?.code === "ENOENT") return { exists: false, absolute };
      throw error;
    }
    if (info.isSymbolicLink()) statusFailure("STATUS_PATH_SYMLINK", relative);
    if (index < segments.length - 1 && !info.isDirectory()) statusFailure("STATUS_PATH_NOT_DIRECTORY", relative);
    if (index === segments.length - 1) {
      const resolved = await realpath(absolute);
      if (!inside(root, resolved)) statusFailure("STATUS_PATH_ESCAPE", relative);
      if (resolved !== absolute) statusFailure("STATUS_PATH_SYMLINK", relative);
      const confirmed = await lstat(absolute);
      if (confirmed.isSymbolicLink()) statusFailure("STATUS_PATH_SYMLINK", relative);
      if (confirmed.dev !== info.dev || confirmed.ino !== info.ino) statusFailure("STATUS_PATH_CHANGED", relative);
      return { exists: true, absolute: resolved, info: confirmed };
    }
  }
  statusFailure("STATUS_PATH_INVALID", relative);
};

const historicalIdentity = async (rootPromise, relative) => {
  const target = await inspectRepositoryPath(rootPromise, relative);
  if (!target.info.isFile()) statusFailure("STATUS_PATH_NOT_REGULAR", relative);
  const root = await rootPromise;
  const indexEntry = await gitOutput(root, ["ls-files", "--stage", "--", relative]);
  const indexBlob = indexEntry.match(/^\d+ ([a-f0-9]{40,64}) 0\t/u)?.[1];
  if (!indexBlob) throw new Error(`missing stage-0 index blob: ${relative}`);
  const difference = await runGit(root, ["diff", "--quiet", "--ignore-cr-at-eol", "--", relative]);
  if (![0, 1].includes(difference.code)) throw new Error(`git diff exited ${difference.code}`);
  return { indexBlob, worktreeChanged: difference.code === 1 };
};

export const createFileRepository = (root) => ({
  assertPath: (relative) => assertRepositoryPath(relative),
  exists: async (relative) => (await inspectRepositoryPath(realpath(root), relative, true)).exists,
  read: async (relative) => {
    const target = await inspectRepositoryPath(realpath(root), relative, true);
    if (!target.exists) throw missing(relative);
    if (!target.info.isFile()) statusFailure("STATUS_PATH_NOT_REGULAR", relative);
    const handle = await open(target.absolute, constants.O_RDONLY | noFollowFlag(constants));
    try {
      const opened = await handle.stat();
      if (!opened.isFile()) statusFailure("STATUS_PATH_NOT_REGULAR", relative);
      if (opened.dev !== target.info.dev || opened.ino !== target.info.ino) statusFailure("STATUS_PATH_CHANGED", relative);
      return await handle.readFile("utf8");
    } finally {
      await handle.close();
    }
  },
  listFiles: async (relative) => {
    const rootPromise = realpath(root);
    const start = await inspectRepositoryPath(rootPromise, relative, true);
    if (!start.exists) return [];
    if (start.info.isFile()) return [relative];
    if (!start.info.isDirectory()) statusFailure("STATUS_PATH_NOT_DIRECTORY", relative);
    const walk = async (prefix) => {
      const directory = await inspectRepositoryPath(rootPromise, prefix, false, true);
      const entries = await readdir(directory.absolute, { withFileTypes: true });
      const nested = await Promise.all(entries.map(async (entry) => {
        if (entry.isDirectory() && IGNORED_DISCOVERY_DIRECTORIES.has(entry.name)) return [];
        const name = slash(path.join(prefix, entry.name));
        if (entry.isSymbolicLink()) statusFailure("STATUS_PATH_SYMLINK", name);
        const item = await inspectRepositoryPath(rootPromise, name, false, true);
        if (item.info.isDirectory()) return walk(name);
        if (item.info.isFile()) return [name];
        statusFailure("STATUS_PATH_NOT_REGULAR", name);
      }));
      return nested.flat();
    };
    return (await walk(relative)).sort();
  },
  historicalIdentity: async (relative) => historicalIdentity(realpath(root), relative),
});

const equal = (left, right) => left.length === right.length && left.every((value, index) => value === right[index]);
const sorted = (values) => [...values].sort((left, right) => Buffer.from(left).compare(Buffer.from(right)));
const json = async (repository, relative, code) => {
  try {
    return JSON.parse(await repository.read(relative));
  } catch {
    statusFailure(code, relative);
  }
};

const matchesWorkspacePattern = (directory, pattern) => {
  if (!pattern.endsWith("/*")) return directory === pattern;
  const prefix = pattern.slice(0, -1);
  return directory.startsWith(prefix) && !directory.slice(prefix.length).includes("/");
};

const verifyWorkspaces = async (catalog, repository) => {
  const root = await json(repository, "package.json", "STATUS_WORKSPACE_MISMATCH");
  if (!Array.isArray(root.workspaces)) statusFailure("STATUS_WORKSPACE_MISMATCH", "package.json#workspaces");
  const packageFiles = (await repository.listFiles("apps")).concat(await repository.listFiles("packages"))
    .filter((file) => file.endsWith("/package.json"));
  const discovered = sorted(packageFiles.map((file) => path.posix.dirname(file)).filter((directory) =>
    root.workspaces.some((pattern) => matchesWorkspacePattern(directory, pattern))));
  const expected = sorted(catalog.workspaces.map(({ path: workspacePath }) => workspacePath));
  if (!equal(discovered, expected)) statusFailure("STATUS_WORKSPACE_MISMATCH", `${discovered.join(",")} != ${expected.join(",")}`);
  for (const workspace of catalog.workspaces) {
    const manifest = await json(repository, `${workspace.path}/package.json`, "STATUS_WORKSPACE_MISMATCH");
    if (manifest.name !== workspace.name || Boolean(manifest.private) !== workspace.private)
      statusFailure("STATUS_WORKSPACE_MISMATCH", workspace.path);
  }
};

const verifyComposition = async (contracts, repository) => {
  const source = await repository.read(contracts.path);
  const match = source.match(/composeFeatures\(\[([^\]]+)\]\)/u);
  const features = match?.[1].split(",").map((value) => value.trim()).filter(Boolean) ?? [];
  if (!equal(features, contracts.features)) statusFailure("STATUS_COMPOSITION_MISMATCH", contracts.path);
  for (const feature of contracts.features) {
    const imported = new RegExp(`import \\{[^}]*\\b${feature}\\b[^}]*\\} from `, "u").test(source);
    if (!imported) statusFailure("STATUS_COMPOSITION_MISMATCH", `${contracts.path}#${feature}`);
  }
  const [entryPath, entryName] = contracts.entryExport.split("#");
  const entry = await repository.read(entryPath);
  if (entryName !== "default" || !/^export \{ default \} from "\.\/plugin\/plugin\.js";\s*$/u.test(entry))
    statusFailure("STATUS_COMPOSITION_MISMATCH", contracts.entryExport);
};

const verifyExports = async (contracts, repository) => {
  const manifest = await json(repository, contracts.path, "STATUS_EXPORT_MISMATCH");
  const keys = manifest.exports && typeof manifest.exports === "object" ? Object.keys(manifest.exports) : [];
  if (!equal(keys, contracts.keys)) statusFailure("STATUS_EXPORT_MISMATCH", contracts.path);
};

const verifyCapabilityReport = async (contracts, repository) => {
  const source = await repository.read(contracts.path);
  const version = source.match(/PINNED_REAL_HOST_VERSION = "([^"]+)"/u)?.[1];
  if (version !== contracts.pinnedVersion || !new RegExp(`export const ${contracts.export} =`, "u").test(source))
    statusFailure("STATUS_CAPABILITY_REPORT_MISMATCH", contracts.path);
  const body = source.match(/const unsupportedCapabilities: RealHostCapabilityReport = \{([\s\S]*?)\n\};/u)?.[1] ?? "";
  const observed = {};
  for (const match of body.matchAll(/^\s*([A-Za-z]+): \{ status: "([^"]+)", code: "([^"]+)" \},$/gmu))
    observed[match[1]] = { status: match[2], code: match[3] };
  if (JSON.stringify(observed) !== JSON.stringify(contracts.capabilities) || !/readonly status: "disabled";/u.test(source))
    statusFailure("STATUS_CAPABILITY_REPORT_MISMATCH", contracts.path);
};

const verifyIndexes = async (contracts, repository) => {
  for (const index of contracts.adrIndexes) {
    const source = await repository.read(index.path);
    for (const required of index.required)
      if (!source.includes(required)) statusFailure("STATUS_ADR_INDEX_OMISSION", `${index.path}#${required}`);
  }
  if (contracts.historicalSnapshots.length !== 1) statusFailure("STATUS_HISTORICAL_SNAPSHOT_CHANGED", "inventory");
  for (const snapshot of contracts.historicalSnapshots) {
    const metadata = Object.entries(WAVE_1_HISTORICAL_SNAPSHOT).filter(([key]) => key !== "baselineBlob");
    if (metadata.some(([key, expected]) => snapshot[key] !== expected))
      statusFailure("STATUS_HISTORICAL_SNAPSHOT_CHANGED", `${WAVE_1_HISTORICAL_SNAPSHOT.path}#metadata`);
    const identity = await repository.historicalIdentity(WAVE_1_HISTORICAL_SNAPSHOT.path).catch(() => undefined);
    if (!identity || WAVE_1_HISTORICAL_SNAPSHOT.baselineBlob !== identity.indexBlob || identity.worktreeChanged)
      statusFailure("STATUS_HISTORICAL_SNAPSHOT_CHANGED", WAVE_1_HISTORICAL_SNAPSHOT.path);
  }
};

const verifyRetirement = async (contracts, repository) => {
  for (const retired of contracts.retiredSurfaces)
    if (await repository.exists(retired)) statusFailure("STATUS_RETIRED_SURFACE_PRESENT", retired);
  for (const rule of contracts.forbiddenProductPatterns)
    for (const root of rule.roots)
      for (const file of await repository.listFiles(root)) {
        const source = await repository.read(file);
        for (const pattern of rule.patterns)
          if (new RegExp(pattern, "u").test(source)) statusFailure("STATUS_RETIRED_SURFACE_PRESENT", `${file}#${pattern}`);
      }
};

const verifyGuardedSources = async (contracts, repository) => {
  for (const guarded of contracts.guardedSources ?? []) {
    const source = await repository.read(guarded.path);
    const digest = createHash("sha256").update(source).digest("hex");
    if (digest !== guarded.sha256) statusFailure("STATUS_SOURCE_CHANGED", guarded.path);
  }
};

const verifyCapabilityGuards = async (catalog, repository) => {
  for (const capability of catalog.capabilities) {
    if (capability.status === "Retired" && !capability.guards.some(({ mode }) => mode === "absent"))
      statusFailure("STATUS_ABSENCE_GUARD", capability.id);
    for (const guard of capability.guards) {
      if (guard.mode === "absent") {
        if (await repository.exists(guard.path)) statusFailure("STATUS_ABSENCE_GUARD", `${capability.id}:${guard.path}`);
        continue;
      }
      let source;
      try {
        source = await repository.read(guard.path);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      const digest = source === undefined ? undefined : createHash("sha256").update(source).digest("hex");
      if (digest !== guard.sha256) statusFailure("STATUS_SOURCE_CHANGED", `${capability.id}:${guard.path}`);
    }
  }
};

const verifySdkReceipt = async (catalog, repository) => {
  let source;
  try {
    source = await repository.read(SDK_ACCEPTANCE_RECEIPT.path);
  } catch {
    statusFailure("STATUS_SDK_RECEIPT_MISSING", SDK_ACCEPTANCE_RECEIPT.path);
  }
  let receipt;
  try {
    receipt = JSON.parse(source);
  } catch {
    statusFailure("STATUS_SDK_RECEIPT_INVALID", `${SDK_ACCEPTANCE_RECEIPT.path}#json`);
  }
  const reproductions = receipt?.reproduction;
  const reproductionValid = Array.isArray(reproductions)
    && equal(reproductions.map((item) => item?.profile), SDK_ACCEPTANCE_RECEIPT.profiles)
    && reproductions.every((item) => item?.artifactMatches === false && item?.profileReceiptMatches === false);
  const verdicts = receipt?.executableVerdicts;
  const verdictsValid = verdicts && typeof verdicts === "object" && !Array.isArray(verdicts)
    && equal(Object.keys(verdicts), SDK_ACCEPTANCE_RECEIPT.executableVerdicts)
    && Object.values(verdicts).every((value) => value === true);
  const continuation = receipt?.continuationAuthorization;
  const continuationValid = continuation?.scope === "symbol-strip-and-lc-symtab-alignment-only"
    && continuation?.priorArtifactHashesSuperseded === true
    && typeof continuation?.instruction === "string"
    && Array.isArray(continuation?.verifierCorrections)
    && continuation.verifierCorrections.length === 6
    && continuation.verifierCorrections.every((item) => typeof item === "string" && item.length > 0);
  const headerValid = receipt?.schemaVersion === 3
    && receipt?.qualification === "legacy-memory-node-api-sdk-v2"
    && receipt?.receiptKind === "acceptance"
    && receipt?.approval?.path === "apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v2-r4.json"
    && receipt?.approval?.sha256 === "e4cdc2dbdb2f3462415567aa27d3565cb97dabf6006eec00a479928fd3926bd4";
  const approvalSource = headerValid ? await repository.read(receipt.approval.path).catch(() => undefined) : undefined;
  const approvalDigest = approvalSource === undefined ? undefined : createHash("sha256").update(approvalSource).digest("hex");
  const digest = createHash("sha256").update(source).digest("hex");
  if (!headerValid || approvalDigest !== receipt.approval.sha256 || !reproductionValid || !verdictsValid || !continuationValid || digest !== SDK_ACCEPTANCE_RECEIPT.sha256)
    statusFailure("STATUS_SDK_RECEIPT_INVALID", SDK_ACCEPTANCE_RECEIPT.path);

  const capability = catalog.capabilities.find(({ id }) => id === "runtime-sdk-v2");
  const anchored = capability
    && capability.status === "Deferred"
    && capability.observation.state === "contradictory"
    && capability.evidence.state === "contradictory"
    && capability.qualification.state === "contradictory"
    && capability.availability.state === "disabled"
    && capability.verdict.decision === "NO-GO"
    && SDK_STATUS_ANCHORS.every(([facet, kind, ref]) => capability[facet].refs.some((item) => item.kind === kind && item.ref === ref));
  if (!anchored) statusFailure("STATUS_SDK_RECEIPT_ANCHOR", "runtime-sdk-v2");
};

const verifyM7HistoricalAcceptance = async (catalog, repository) => {
  const historical = catalog.capabilities.find(({ id }) => id === "runtime-m7-historical");
  const candidate = catalog.capabilities.find(({ id }) => id === "runtime-m7-current");
  const constraints = historical?.scope?.constraints ?? [];
  const historicalValid = historical?.status === "Current"
    && historical?.qualification?.state === "qualified"
    && constraints.includes(`source commit ${M7_HISTORICAL_ACCEPTANCE.sourceCommit}`)
    && constraints.includes(`artifact SHA-256 ${M7_HISTORICAL_ACCEPTANCE.artifactSha256}`);
  const candidateValid = candidate?.status === "Deferred"
    && candidate?.qualification?.state === "unqualified"
    && candidate?.availability?.state === "disabled"
    && candidate?.verdict?.decision === "NO-GO";
  if (!historicalValid || !candidateValid) statusFailure("STATUS_M7_CONFLATION", "catalog");
  const source = await repository.read(M7_HISTORICAL_ACCEPTANCE.path).catch(() => undefined);
  const digest = source === undefined ? undefined : createHash("sha256").update(source).digest("hex");
  const identity = await repository.historicalIdentity(M7_HISTORICAL_ACCEPTANCE.path).catch(() => undefined);
  if (digest !== M7_HISTORICAL_ACCEPTANCE.sha256 || !identity
    || identity.indexBlob !== M7_HISTORICAL_ACCEPTANCE.indexBlob || identity.worktreeChanged) {
    statusFailure("STATUS_M7_HISTORICAL_CHANGED", M7_HISTORICAL_ACCEPTANCE.path);
  }
};

const verifyEvidenceReferences = async (catalog, repository) => {
  const facets = ["observation", "assertion", "evidence", "authority", "delivery", "qualification"];
  for (const capability of catalog.capabilities)
    for (const facet of facets)
      for (const reference of capability[facet].refs) {
        if (reference.kind === "external") continue;
        const separator = reference.ref.indexOf("#");
        const relative = reference.ref.slice(0, separator);
        const fragment = reference.ref.slice(separator + 1);
        assertEvidenceFragment(fragment, reference.ref);
        if (!(await repository.exists(relative))) statusFailure("STATUS_EVIDENCE_REFERENCE", reference.ref);
        const source = await repository.read(relative);
        const normalizedFragment = normalizeEvidenceText(fragment);
        if (normalizedFragment.length === 0
          || !` ${normalizeEvidenceText(source)} `.includes(` ${normalizedFragment} `))
          statusFailure("STATUS_EVIDENCE_REFERENCE", reference.ref);
      }
};

const verifyCurrentQualificationExecution = async (catalog, repository) => {
  const inventory = await json(repository, "docs/verification/inventory.json", "STATUS_QUALIFICATION_EXECUTION_CLOSURE");
  const tests = new Map((inventory.tests ?? []).map((item) => [item.path, item]));
  for (const capability of catalog.capabilities) {
    if (capability.status !== "Current" || capability.id === "runtime-m7-historical" || capability.qualification.state === "not-required") continue;
    for (const reference of capability.qualification.refs) {
      const testPath = catalogReferencePath(reference.ref);
      const test = tests.get(testPath);
      const requiredProfiles = (test?.profiles ?? []).filter((profile) => {
        const definition = inventory.testProfiles?.[profile];
        return definition?.disposition === "required"
          && definition.entrypoints?.length > 0
          && definition.tests?.includes(testPath);
      });
      if (reference.kind !== "test" || requiredProfiles.length === 0)
        statusFailure("STATUS_QUALIFICATION_EXECUTION_CLOSURE", `${capability.id}:${testPath}`);
    }
  }
};

const catalogReferencePath = (reference) => {
  const separator = reference.indexOf("#");
  if (separator <= 0) statusFailure("STATUS_PATH_INVALID", reference);
  return reference.slice(0, separator);
};

const verifyRepositoryPaths = (catalog) => {
  const contracts = catalog.sourceContracts;
  const paths = [
    ...catalog.workspaces.map((workspace) => workspace.path),
    contracts.composition.path,
    catalogReferencePath(contracts.composition.entryExport),
    contracts.exports.path,
    contracts.capabilityReport.path,
    ...contracts.adrIndexes.map((index) => index.path),
    ...contracts.historicalSnapshots.map((snapshot) => snapshot.path),
    ...contracts.retiredSurfaces,
    ...contracts.forbiddenProductPatterns.flatMap((rule) => rule.roots),
    ...contracts.guardedSources.map((guarded) => guarded.path),
    ...catalog.capabilities.flatMap((capability) => [
      ...capability.guards.map((guard) => guard.path),
      ...["observation", "assertion", "evidence", "authority", "delivery", "qualification"]
        .flatMap((facet) => capability[facet].refs.map(({ ref }) => catalogReferencePath(ref))),
    ]),
  ];
  for (const repositoryPath of paths) assertRepositoryPath(repositoryPath);
};

export const verifySourceContracts = async (catalog, repository) => {
  verifyRepositoryPaths(catalog);
  const contracts = catalog.sourceContracts;
  await verifyWorkspaces(catalog, repository);
  await verifyComposition(contracts.composition, repository);
  await verifyExports(contracts.exports, repository);
  await verifyCapabilityReport(contracts.capabilityReport, repository);
  await verifyIndexes(contracts, repository);
  await verifyRetirement(contracts, repository);
  await verifySdkReceipt(catalog, repository);
  await verifyM7HistoricalAcceptance(catalog, repository);
  await verifyCapabilityGuards(catalog, repository);
  await verifyGuardedSources(contracts, repository);
  await verifyCurrentQualificationExecution(catalog, repository);
  await verifyEvidenceReferences(catalog, repository);
};
