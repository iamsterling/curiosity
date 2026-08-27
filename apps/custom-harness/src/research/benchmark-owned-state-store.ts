import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { canonicalJson } from "../kernel/canonical-json.js";
import {
  benchmarkConnector,
  isBenchmarkDiscoveryUrl,
} from "./benchmark-owned-mediawiki.js";

const maximumArtifactBytes = 512 * 1_024;
const maximumGenerations = 32;
const reference = /^(?:capture|projection|snapshot):[a-f0-9]{64}$/u;

export interface BenchmarkCapture {
  readonly body: string;
  readonly canonicalUrl: string;
  readonly connector: typeof benchmarkConnector;
  readonly mediaType: "application/json";
  readonly observedAt: string;
  readonly schemaVersion: 1;
  readonly statusCode: number;
}

export interface BenchmarkStoredDocument {
  readonly canonicalUrl: string;
  readonly captureRef: string;
  readonly connectorRank: number;
  readonly documentId: string;
  readonly excerpt: string;
  readonly observedAt: string;
  readonly title: string;
}

export interface BenchmarkSnapshot {
  readonly connector: typeof benchmarkConnector;
  readonly documents: readonly BenchmarkStoredDocument[];
  readonly schemaVersion: 1;
}

export interface BenchmarkActiveSelector {
  readonly activatedAt: string;
  readonly connector: typeof benchmarkConnector;
  readonly previousSnapshotRef: string | null;
  readonly projectionSnapshotRef: string;
  readonly schemaVersion: 1;
  readonly snapshotRef: string;
}

export const benchmarkDigest = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const failed = (code: string): never => {
  throw new Error(code);
};

export const hasExactBenchmarkFields = (
  value: unknown,
  fields: readonly string[],
): value is Record<string, unknown> =>
  !!value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype &&
  Object.keys(value).length === fields.length &&
  Object.keys(value).every((field) => fields.includes(field));

const readArtifact = (target: string): { readonly bytes: Buffer; readonly value: unknown } => {
  const information = lstatSync(target);
  if (
    !information.isFile() ||
    information.isSymbolicLink() ||
    (information.mode & 0o077) !== 0 ||
    (typeof process.getuid === "function" && information.uid !== process.getuid())
  )
    return failed("SEARCH_BENCHMARK_STATE_INVALID");
  const bytes = readFileSync(target);
  if (bytes.byteLength > maximumArtifactBytes)
    return failed("SEARCH_BENCHMARK_STATE_INVALID");
  try {
    return { bytes, value: JSON.parse(bytes.toString("utf8")) };
  } catch {
    return failed("SEARCH_BENCHMARK_STATE_INVALID");
  }
};

const syncDirectory = (directory: string): void => {
  const descriptor = openSync(directory, "r");
  try {
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
};

const publishImmutable = (target: string, value: unknown): void => {
  const content = Buffer.from(`${canonicalJson(value)}\n`);
  if (content.byteLength > maximumArtifactBytes)
    return failed("SEARCH_BENCHMARK_STATE_TOO_LARGE");
  if (existsSync(target)) {
    if (!readFileSync(target).equals(content))
      return failed("SEARCH_BENCHMARK_STATE_COLLISION");
    return;
  }
  let descriptor: number | undefined;
  try {
    descriptor = openSync(target, "wx", 0o600);
    writeFileSync(descriptor, content);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    syncDirectory(path.dirname(target));
  } catch {
    if (descriptor !== undefined) closeSync(descriptor);
    return failed("SEARCH_BENCHMARK_STATE_WRITE_FAILED");
  }
};

const replaceSelector = (target: string, value: BenchmarkActiveSelector): void => {
  const temporary = path.join(
    path.dirname(target),
    `.ACTIVE-${randomUUID()}.tmp`,
  );
  let descriptor: number | undefined;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    writeFileSync(descriptor, `${canonicalJson(value)}\n`, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, target);
    syncDirectory(path.dirname(target));
  } catch {
    if (descriptor !== undefined) closeSync(descriptor);
    try {
      unlinkSync(temporary);
    } catch {
      // The exclusive temporary file may not have been created.
    }
    return failed("SEARCH_BENCHMARK_STATE_WRITE_FAILED");
  }
};

const validateDirectory = (target: string): void => {
  const information = lstatSync(target);
  if (
    !information.isDirectory() ||
    information.isSymbolicLink() ||
    (information.mode & 0o077) !== 0 ||
    (typeof process.getuid === "function" && information.uid !== process.getuid())
  )
    return failed("SEARCH_BENCHMARK_STATE_ROOT_INVALID");
};

const initializeDirectory = (target: string): void => {
  if (!existsSync(target)) mkdirSync(target, { mode: 0o700 });
  validateDirectory(target);
};

const jsonInventory = (directory: string): readonly string[] => {
  const entries = readdirSync(directory, { withFileTypes: true });
  if (
    entries.length > maximumGenerations ||
    entries.some(
      (entry) =>
        !entry.isFile() ||
        entry.isSymbolicLink() ||
        !/^[a-f0-9]{64}\.json$/u.test(entry.name),
    )
  )
    return failed("SEARCH_BENCHMARK_STATE_INVALID");
  return entries.map(({ name }) => name).sort();
};

const activeSelector = (value: unknown): BenchmarkActiveSelector => {
  const active = value as Partial<BenchmarkActiveSelector> | null;
  if (
    !hasExactBenchmarkFields(value, [
      "activatedAt",
      "connector",
      "previousSnapshotRef",
      "projectionSnapshotRef",
      "schemaVersion",
      "snapshotRef",
    ]) ||
    !active ||
    active.schemaVersion !== 1 ||
    active.connector !== benchmarkConnector ||
    typeof active.activatedAt !== "string" ||
    !Number.isFinite(Date.parse(active.activatedAt)) ||
    typeof active.snapshotRef !== "string" ||
    !reference.test(active.snapshotRef) ||
    !active.snapshotRef.startsWith("snapshot:") ||
    typeof active.projectionSnapshotRef !== "string" ||
    !reference.test(active.projectionSnapshotRef) ||
    !active.projectionSnapshotRef.startsWith("projection:") ||
    (active.previousSnapshotRef !== null &&
      (typeof active.previousSnapshotRef !== "string" ||
        !/^snapshot:[a-f0-9]{64}$/u.test(active.previousSnapshotRef)))
  )
    return failed("SEARCH_BENCHMARK_STATE_INVALID");
  return active as BenchmarkActiveSelector;
};

export class BenchmarkOwnedStateStore {
  readonly capturesDirectory!: string;
  readonly snapshotsDirectory!: string;
  readonly selectorPath!: string;

  constructor(readonly root: string) {
    if (!path.isAbsolute(root) || path.resolve(root) !== root || !existsSync(root))
      return failed("SEARCH_BENCHMARK_STATE_ROOT_INVALID");
    validateDirectory(root);
    const allowed = new Set(["ACTIVE.json", "captures", "snapshots"]);
    if (readdirSync(root).some((entry) => !allowed.has(entry)))
      return failed("SEARCH_BENCHMARK_STATE_INVALID");
    this.capturesDirectory = path.join(root, "captures");
    this.snapshotsDirectory = path.join(root, "snapshots");
    this.selectorPath = path.join(root, "ACTIVE.json");
    initializeDirectory(this.capturesDirectory);
    initializeDirectory(this.snapshotsDirectory);
    for (const name of jsonInventory(this.capturesDirectory))
      this.readCapture(`capture:${name.slice(0, -".json".length)}`);
    for (const name of jsonInventory(this.snapshotsDirectory)) {
      const digest = name.slice(0, -".json".length);
      const artifact = readArtifact(path.join(this.snapshotsDirectory, name));
      if (benchmarkDigest(artifact.value) !== digest)
        return failed("SEARCH_BENCHMARK_STATE_INVALID");
    }
  }

  loadActive(): {
    readonly active: BenchmarkActiveSelector;
    readonly snapshot: BenchmarkSnapshot;
  } | undefined {
    if (!existsSync(this.selectorPath)) return undefined;
    const active = activeSelector(readArtifact(this.selectorPath).value);
    const digest = active.snapshotRef.slice("snapshot:".length);
    const target = path.join(this.snapshotsDirectory, `${digest}.json`);
    if (!existsSync(target)) return failed("SEARCH_BENCHMARK_STATE_INVALID");
    const snapshot = readArtifact(target).value as BenchmarkSnapshot;
    if (benchmarkDigest(snapshot) !== digest)
      return failed("SEARCH_BENCHMARK_STATE_INVALID");
    return { active, snapshot };
  }

  readCapture(captureRef: string): BenchmarkCapture {
    if (!/^capture:[a-f0-9]{64}$/u.test(captureRef))
      return failed("SEARCH_BENCHMARK_STATE_INVALID");
    const digest = captureRef.slice("capture:".length);
    const target = path.join(this.capturesDirectory, `${digest}.json`);
    if (!existsSync(target)) return failed("SEARCH_BENCHMARK_STATE_INVALID");
    const capture = readArtifact(target).value as BenchmarkCapture;
    if (
      !hasExactBenchmarkFields(capture, [
        "body",
        "canonicalUrl",
        "connector",
        "mediaType",
        "observedAt",
        "schemaVersion",
        "statusCode",
      ]) ||
      benchmarkDigest(capture) !== digest ||
      capture.schemaVersion !== 1 ||
      capture.connector !== benchmarkConnector ||
      capture.mediaType !== "application/json" ||
      capture.statusCode < 200 ||
      capture.statusCode > 299 ||
      typeof capture.body !== "string" ||
      Buffer.byteLength(capture.body) > 40_960 ||
      !Number.isFinite(Date.parse(capture.observedAt)) ||
      !isBenchmarkDiscoveryUrl(capture.canonicalUrl)
    )
      return failed("SEARCH_BENCHMARK_STATE_INVALID");
    return capture;
  }

  activate(input: {
    readonly activatedAt: string;
    readonly capture: BenchmarkCapture;
    readonly projectionSnapshotRef: string;
    readonly snapshot: BenchmarkSnapshot;
  }): BenchmarkActiveSelector {
    const captures = jsonInventory(this.capturesDirectory);
    const snapshots = jsonInventory(this.snapshotsDirectory);
    const captureDigest = benchmarkDigest(input.capture);
    const snapshotDigest = benchmarkDigest(input.snapshot);
    if (
      (!captures.includes(`${captureDigest}.json`) &&
        captures.length >= maximumGenerations) ||
      (!snapshots.includes(`${snapshotDigest}.json`) &&
        snapshots.length >= maximumGenerations)
    )
      return failed("SEARCH_BENCHMARK_GENERATION_LIMIT");
    publishImmutable(
      path.join(this.capturesDirectory, `${captureDigest}.json`),
      input.capture,
    );
    publishImmutable(
      path.join(this.snapshotsDirectory, `${snapshotDigest}.json`),
      input.snapshot,
    );
    const previous = this.loadActive()?.active.snapshotRef ?? null;
    const active: BenchmarkActiveSelector = {
      activatedAt: input.activatedAt,
      connector: benchmarkConnector,
      previousSnapshotRef: previous,
      projectionSnapshotRef: input.projectionSnapshotRef,
      schemaVersion: 1,
      snapshotRef: `snapshot:${snapshotDigest}`,
    };
    replaceSelector(this.selectorPath, active);
    return active;
  }
}
