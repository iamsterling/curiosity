import { createHash, randomUUID } from "node:crypto";
import { closeSync, existsSync, fstatSync, fsyncSync, linkSync, mkdirSync, openSync, readdirSync, readFileSync, renameSync, rmSync, statSync, unlinkSync, writeSync, type Stats } from "node:fs";
import os from "node:os";
import path from "node:path";

import { migrateDocument, parseDocument, sceneToEditorDocument, serializeDocument, type EditorDocument, type ValidationDiagnostic } from "@crafty/editor/kernel";
import { importPenDocument, type PenImportDiagnostic } from "@crafty/pen-import";
import { createEmptyScene, validateScene, type Scene } from "@crafty/scene-model";
import { entryFile, parseUiManifest, serializeDocumentEntry, serializeUiManifest, UI_DOCUMENT_FORMAT, UI_DOCUMENT_ROLE, UI_PACKAGE_FORMAT, UI_FORMAT_VERSION } from "./ui-format.js";

export { entryFile, parseUiManifest, serializeDocumentEntry, serializeUiManifest, UI_DOCUMENT_FORMAT, UI_DOCUMENT_ROLE, UI_PACKAGE_FORMAT, UI_FORMAT_VERSION } from "./ui-format.js";

/**
 * Node-side file store for Crafty documents. Pure filesystem and validation
 * logic with no HTTP: the Next route handlers and the CLI faces are both thin
 * adapters over this module, so there is exactly one implementation of slug
 * resolution, package persistence, optimistic revisions, and snapshots.
 *
 * A saved file is a `.ui` directory package: `files/<slug>.ui/` holds
 * `manifest.ui` (the format gate, the entries table and the monotonic
 * revision — the commit point) and immutable revision-specific document entries.
 * The manifest publishes only a fully synced and validated entry, so restart
 * observes the prior or new complete revision. The legacy `scene.json` remains
 * readable once (one-shot conversion); the Scene save path is gone.
 */

export const DEFAULT_SLUG = "untitled" as const;
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/u;

export const isValidSlug = (slug: string): boolean => SLUG_PATTERN.test(slug);

export const dataDirectory = (): string => process.env.CRAFTY_DATA_DIR ?? path.join(os.homedir(), ".crafty");

/** The `.ui` directory package for a slug: the folder IS the file. */
export const packageDirectory = (dataDir: string, slug: string): string =>
  slug === DEFAULT_SLUG ? path.join(dataDir, "untitled.ui") : path.join(dataDir, "files", `${slug}.ui`);

/** The legacy one-shot scene path, read-only (conversion only). */
export const legacySceneFile = (dataDir: string, slug: string): string =>
  slug === DEFAULT_SLUG ? path.join(dataDir, "scene.json") : path.join(dataDir, "files", slug, "scene.json");

export interface SceneStoreError {
  code: "SLUG_INVALID" | "DOCUMENT_INPUT_INVALID" | "DOCUMENT_UNSUPPORTED_SCHEMA" | "DOCUMENT_CORRUPT" | "DOCUMENT_REVISION_STALE" | "DOCUMENT_EXTERNAL_CHANGE" | "DOCUMENT_PUBLICATION_FAILED" | "DOCUMENT_PUBLICATION_INDETERMINATE" | "UI_MANIFEST_MISSING" | "UI_PARSE_FAILED" | "UI_FORMAT_MISSING" | "UI_FORMAT_UNSUPPORTED" | "UI_ENTRY_UNSUPPORTED" | "UI_ENTRY_PATH_INVALID" | "UI_ENTRY_MISSING" | "PEN_IMPORT_INVALID";
  message: string;
  status: 400 | 404 | 409;
  diagnostics?: ValidationDiagnostic[] | Array<{ code: string; message: string }>;
  currentRevision?: number;
}

export type StoreResult<T> = { ok: true; value: T } | { ok: false; error: SceneStoreError };

const failure = (error: SceneStoreError): StoreResult<never> => ({ ok: false, error });

const slugFailure = (): StoreResult<never> => failure({ code: "SLUG_INVALID", status: 400, message: "The file slug may contain only lowercase letters, digits, and dashes." });

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);

export interface PublicationIdentity {
  source: "package" | "legacy" | "fresh";
  digest: string;
}

export interface PublicationSample {
  document: EditorDocument;
  revision: number;
  applied: string[];
  converted: boolean;
  identity: PublicationIdentity;
}

export type PublicationSampleEvent = "package:after-entry-read" | "legacy:after-read" | "fresh:between-presence-checks";
let publicationSampleHook: ((event: PublicationSampleEvent) => void) | undefined;
/** Deterministic movement seam for sampler tests; not a product mutation API. */
export const setPublicationSampleHook = (hook: ((event: PublicationSampleEvent) => void) | undefined): void => {
  publicationSampleHook = hook;
};

/** Test-only process-boundary seam. It is deliberately not a writer API. */
type PublicationOperation = "entry" | "manifest" | "bootstrap" | "directory-sync" | "verify" | "acknowledgement";
type PublicationSide = "before-call" | "syscall-error" | "after-success";
export type PublicationFaultEvent = `${PublicationOperation}:${PublicationSide}`;
let publicationFaultHook: ((event: PublicationFaultEvent) => void) | undefined;
export const setPublicationFaultHook = (hook: ((event: PublicationFaultEvent) => void) | undefined): void => {
  publicationFaultHook = hook;
};

let publicationWriteLimit: number | undefined;
/** Deterministic short-write seam for tests; production writes are unlimited. */
export const setPublicationWriteLimit = (limit: number | undefined): void => {
  publicationWriteLimit = limit;
};

class PublicationFault extends Error {
  constructor(readonly event: PublicationFaultEvent, cause: unknown) {
    super(event);
    this.cause = cause;
  }
}

class PublicationRejected extends Error {
  constructor(readonly result: StoreResult<never>) {
    super(result.ok ? "impossible" : result.error.code);
  }
}

const fault = (event: PublicationFaultEvent): void => {
  try {
    publicationFaultHook?.(event);
  } catch (error) {
    throw new PublicationFault(event, error);
  }
};

const invokePublicationOperation = <T>(operation: PublicationOperation, call: () => T): T => {
  fault(`${operation}:before-call`);
  try {
    fault(`${operation}:syscall-error`);
    const value = call();
    fault(`${operation}:after-success`);
    return value;
  } catch (error) {
    if (error instanceof PublicationFault) throw error;
    throw new PublicationFault(`${operation}:syscall-error`, error);
  }
};

const syncDirectory = (directory: string): void => {
  invokePublicationOperation("directory-sync", () => {
    const handle = openSync(directory, "r");
    try {
      fsyncSync(handle);
    } finally {
      closeSync(handle);
    }
  });
};

const fileIdentity = (stats: Stats): string => `${stats.dev}:${stats.ino}:${stats.mode}:${stats.size}:${stats.mtimeMs}:${stats.ctimeMs}`;

const externalChange = (): StoreResult<never> => failure({ code: "DOCUMENT_EXTERNAL_CHANGE", status: 409, message: "DOCUMENT_EXTERNAL_CHANGE" });

const writeAll = (handle: number, contents: Uint8Array): void => {
  let offset = 0;
  while (offset < contents.byteLength) {
    const length = publicationWriteLimit === undefined
      ? contents.byteLength - offset
      : Math.min(publicationWriteLimit, contents.byteLength - offset);
    const written = writeSync(handle, contents, offset, length);
    if (written <= 0) throw new Error("filesystem write made no progress");
    offset += written;
  }
};

const parseDocumentEntryBytes = (bytes: Buffer): StoreResult<{ document: EditorDocument; applied: string[] }> => {
  let envelope: unknown;
  try {
    envelope = JSON.parse(bytes.toString("utf8"));
  } catch {
    return failure({ code: "UI_FORMAT_MISSING", status: 400, message: `UI_FORMAT_MISSING:the ${UI_DOCUMENT_ROLE} entry is not a valid crafty.ui-document` });
  }
  if (!record(envelope) || envelope.format !== UI_DOCUMENT_FORMAT) return failure({ code: "UI_FORMAT_MISSING", status: 400, message: `UI_FORMAT_MISSING:the ${UI_DOCUMENT_ROLE} entry lacks the crafty.ui-document marker` });
  const parsed = parseDocument(JSON.stringify(envelope.document) ?? "");
  if (!parsed.ok || !parsed.document) {
    const unsupported = parsed.diagnostics.some((diagnostic) => diagnostic.code === "DOCUMENT_UNSUPPORTED_SCHEMA");
    return failure({ code: unsupported ? "DOCUMENT_UNSUPPORTED_SCHEMA" : "DOCUMENT_INPUT_INVALID", status: 400, message: unsupported ? "DOCUMENT_UNSUPPORTED_SCHEMA" : "The document entry failed validation.", diagnostics: parsed.diagnostics });
  }
  return { ok: true, value: { document: parsed.document, applied: parsed.applied } };
};

interface DescriptorRead {
  bytes: Buffer;
  identity: string;
  stable: boolean;
}

const readDescriptorCoherently = (file: string): DescriptorRead => {
  const handle = openSync(file, "r");
  try {
    const before = fstatSync(handle);
    if (!before.isFile()) return { bytes: Buffer.alloc(0), identity: fileIdentity(before), stable: false };
    const bytes = readFileSync(handle);
    const after = fstatSync(handle);
    const atPath = statSync(file);
    const identity = fileIdentity(after);
    return { bytes, identity, stable: fileIdentity(before) === identity && identity === fileIdentity(atPath) && bytes.byteLength === after.size };
  } finally {
    closeSync(handle);
  }
};

const samplePackageAttempt = (packageDir: string): StoreResult<PublicationSample> | undefined => {
  const manifestPath = path.join(packageDir, "manifest.ui");
  try {
    const sourceBefore = statSync(packageDir);
    if (!sourceBefore.isDirectory()) return failure({ code: "UI_MANIFEST_MISSING", status: 404, message: "UI_MANIFEST_MISSING:the package is not a directory" });
    if (!existsSync(manifestPath)) {
      const sourceAfter = statSync(packageDir);
      return fileIdentity(sourceBefore) === fileIdentity(sourceAfter)
        ? failure({ code: "UI_MANIFEST_MISSING", status: 404, message: "UI_MANIFEST_MISSING:the package has no manifest.ui" })
        : undefined;
    }
    const manifestFirst = readDescriptorCoherently(manifestPath);
    const parsedManifest = parseUiManifest(manifestFirst.bytes.toString("utf8"));
    let documentPath: string | undefined;
    let pathError: StoreResult<never> | undefined;
    if (parsedManifest.ok) {
      try {
        documentPath = entryFile(packageDir, parsedManifest.value, UI_DOCUMENT_ROLE);
      } catch (error) {
        const message = error instanceof Error ? error.message : "UI_ENTRY_PATH_INVALID";
        pathError = failure({ code: message.startsWith("UI_ENTRY_MISSING:") ? "UI_ENTRY_MISSING" : "UI_ENTRY_PATH_INVALID", status: message.startsWith("UI_ENTRY_MISSING:") ? 404 : 400, message });
      }
    }
    let entry: DescriptorRead | undefined;
    const entryMissing = documentPath !== undefined && !existsSync(documentPath);
    if (documentPath && !entryMissing) entry = readDescriptorCoherently(documentPath);
    publicationSampleHook?.("package:after-entry-read");
    const manifestSecond = readFileSync(manifestPath);
    const sourceAfter = statSync(packageDir);
    const entryPathStable = !entry || (documentPath !== undefined && existsSync(documentPath) && fileIdentity(statSync(documentPath)) === entry.identity);
    const stable = manifestFirst.stable && Buffer.compare(manifestFirst.bytes, manifestSecond) === 0 && fileIdentity(sourceBefore) === fileIdentity(sourceAfter) && (!entry || entry.stable) && entryPathStable;
    if (!stable) return undefined;
    if (!parsedManifest.ok) return failure({ code: parsedManifest.code, status: 400, message: parsedManifest.message });
    if (pathError) return pathError;
    if (entryMissing && documentPath && !existsSync(documentPath)) return failure({ code: "UI_ENTRY_MISSING", status: 404, message: `UI_ENTRY_MISSING:${UI_DOCUMENT_ROLE}` });
    if (!entry) return failure({ code: "UI_ENTRY_MISSING", status: 404, message: `UI_ENTRY_MISSING:${UI_DOCUMENT_ROLE}` });
    const parsedEntry = parseDocumentEntryBytes(entry.bytes);
    if (!parsedEntry.ok) return parsedEntry;
    const digest = packageDigest(manifestFirst.bytes, entry.bytes, entry.identity);
    return { ok: true, value: { ...parsedEntry.value, revision: parsedManifest.value.revision, converted: false, identity: { source: "package", digest } } };
  } catch {
    return undefined;
  }
};

const migrateLegacyBytes = (bytes: Buffer): StoreResult<{ document: EditorDocument; applied: string[] }> => {
  let payload: unknown;
  try {
    payload = JSON.parse(bytes.toString("utf8")) as unknown;
  } catch {
    return failure({ code: "DOCUMENT_CORRUPT", status: 400, message: "DOCUMENT_CORRUPT:legacy scene.json is present but cannot be parsed and validated" });
  }
  const validation = validateScene(payload);
  if (!validation.ok || !validation.value) {
    const stopGap = JSON.stringify(payload).includes('"type":"path"');
    if (stopGap) return failure({ code: "DOCUMENT_INPUT_INVALID", status: 400, message: "SCENE_ADAPTER_UNSUPPORTED_KIND:path", diagnostics: [adapterStopGapDiagnostic("SCENE_ADAPTER_UNSUPPORTED_KIND:path")] });
    return failure({ code: "DOCUMENT_CORRUPT", status: 400, message: "DOCUMENT_CORRUPT:legacy scene.json is present but cannot be parsed and validated" });
  }
  try {
    const migrated = migrateDocument(sceneToEditorDocument(validation.value));
    if (!migrated.ok || !migrated.document) return failure({ code: "DOCUMENT_INPUT_INVALID", status: 400, message: "The legacy scene could not be migrated to the current document format.", diagnostics: migrated.diagnostics });
    return { ok: true, value: { document: migrated.document, applied: migrated.applied } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SCENE_ADAPTER_UNSUPPORTED_KIND";
    return failure({ code: "DOCUMENT_INPUT_INVALID", status: 400, message: "The legacy scene could not be converted.", diagnostics: [adapterStopGapDiagnostic(message)] });
  }
};

const sampleLegacyAttempt = (packageDir: string, legacyFile: string): StoreResult<PublicationSample> | undefined => {
  try {
    if (existsSync(packageDir)) return undefined;
    const legacy = readDescriptorCoherently(legacyFile);
    publicationSampleHook?.("legacy:after-read");
    if (existsSync(packageDir) || !legacy.stable || !existsSync(legacyFile) || fileIdentity(statSync(legacyFile)) !== legacy.identity) return undefined;
    const migrated = migrateLegacyBytes(legacy.bytes);
    if (!migrated.ok) return migrated;
    const digest = createHash("sha256").update("legacy\0").update(legacy.bytes).update("\0").update(legacy.identity).digest("hex");
    return { ok: true, value: { ...migrated.value, revision: 0, converted: true, identity: { source: "legacy", digest } } };
  } catch {
    return undefined;
  }
};

const freshDocument = (): StoreResult<{ document: EditorDocument; applied: string[] }> => {
  const migrated = migrateDocument(sceneToEditorDocument(createEmptyScene()));
  if (!migrated.ok || !migrated.document) return failure({ code: "DOCUMENT_INPUT_INVALID", status: 400, message: "A fresh document could not be created.", diagnostics: migrated.diagnostics });
  return { ok: true, value: { document: migrated.document, applied: migrated.applied } };
};

/** One bounded manifest→entry→manifest (or legacy/fresh equivalent) sampler. */
export const sampleDocumentPublication = (dataDir: string, slug: string): StoreResult<PublicationSample> => {
  if (!isValidSlug(slug)) return slugFailure();
  const packageDir = packageDirectory(dataDir, slug);
  const legacyFile = legacySceneFile(dataDir, slug);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (existsSync(packageDir)) {
      const sampled = samplePackageAttempt(packageDir);
      if (sampled) return sampled;
      continue;
    }
    if (existsSync(legacyFile)) {
      const sampled = sampleLegacyAttempt(packageDir, legacyFile);
      if (sampled) return sampled;
      continue;
    }
    publicationSampleHook?.("fresh:between-presence-checks");
    if (existsSync(packageDir) || existsSync(legacyFile)) continue;
    const fresh = freshDocument();
    if (!fresh.ok) return fresh;
    return { ok: true, value: { ...fresh.value, revision: 0, converted: false, identity: { source: "fresh", digest: createHash("sha256").update("fresh").digest("hex") } } };
  }
  return externalChange();
};

/**
 * Crash-safe write: serialize to a sibling temp file, fsync it, then rename.
 * A rename within a directory is atomic, so a crash mid-write can never leave
 * a truncated entry on disk (see docs/architecture/persistence.md).
 */
export const writeFileAtomic = (file: string, contents: Uint8Array): void => {
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  const handle = openSync(temporary, "wx");
  try {
    writeAll(handle, contents);
    fsyncSync(handle);
  } finally {
    closeSync(handle);
  }
  try {
    renameSync(temporary, file);
  } catch (error) {
    if (existsSync(temporary)) unlinkSync(temporary);
    throw error;
  }
};

const writeImmutableFile = (file: string, contents: Uint8Array): void => {
  if (existsSync(file)) {
    if (Buffer.compare(readFileSync(file), Buffer.from(contents)) === 0) return;
    throw new Error("immutable publication entry already exists with different bytes");
  }
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    const handle = openSync(temporary, "wx");
    try {
      writeAll(handle, contents);
      fsyncSync(handle);
    } finally {
      closeSync(handle);
    }
    // A hard link publishes the fully synced inode only when the immutable
    // revision path does not already exist; unlike rename it cannot replace
    // another writer's entry.
    linkSync(temporary, file);
  } catch (error) {
    if (!existsSync(file) || Buffer.compare(readFileSync(file), Buffer.from(contents)) !== 0) throw error;
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
};

const packageDigest = (manifest: Buffer, entry: Buffer, entryIdentity: string): string =>
  createHash("sha256").update("package\0").update(manifest).update("\0").update(entry).update("\0").update(entryIdentity).digest("hex");

export const loadPersistedScene = (dataDir: string, slug: string): Scene | undefined => {
  const file = legacySceneFile(dataDir, slug);
  if (!existsSync(file)) return undefined;
  try {
    const validation = validateScene(JSON.parse(readFileSync(file, "utf8")) as unknown);
    return validation.ok && validation.value ? validation.value : undefined;
  } catch {
    return undefined;
  }
};

const adapterStopGapDiagnostic = (message: string): { code: string; path: string; message: string } => ({ code: "SCENE_ADAPTER_UNSUPPORTED_KIND", path: "/", message });

/**
 * Reads the authored document for a slug: the `.ui` package when one exists,
 * otherwise the legacy `scene.json` (one-shot conversion, revision 0), else a
 * fresh empty document at revision 0. Never silently repairs a broken package.
 */
export const readDocument = (dataDir: string, slug: string): StoreResult<{ document: EditorDocument; revision: number; applied: string[]; converted: boolean }> => {
  const sampled = sampleDocumentPublication(dataDir, slug);
  if (!sampled.ok) return sampled;
  const { identity: _identity, ...read } = sampled.value;
  return { ok: true, value: read };
};

/**
 * Commits a package: the document entry writes first, then the manifest with
 * the bumped revision — the manifest is the commit point, so a crash between
 * the two leaves the previous revision with a valid document, never a torn
 * package.
 */
const manifestBytes = (revision: number, entry: string): Buffer =>
  Buffer.from(serializeUiManifest({ format: UI_PACKAGE_FORMAT, formatVersion: UI_FORMAT_VERSION, revision, entries: { [UI_DOCUMENT_ROLE]: entry } }), "utf8");

const revisionEntry = (revision: number): string => `document-${revision}.ui`;

const requireBaseline = (dataDir: string, slug: string, expected: PublicationIdentity): void => {
  const sampled = sampleDocumentPublication(dataDir, slug);
  if (!sampled.ok) throw new PublicationRejected(sampled);
  if (sampled.value.identity.source !== expected.source || sampled.value.identity.digest !== expected.digest) throw new PublicationRejected(externalChange());
};

const commitPackage = (dataDir: string, slug: string, packageDir: string, document: EditorDocument, revision: number, baseline: PublicationIdentity): void => {
  const entry = revisionEntry(revision);
  invokePublicationOperation("entry", () => writeImmutableFile(path.join(packageDir, entry), Buffer.from(serializeDocumentEntry(document), "utf8")));
  // Parse the prepared bytes before the pointer can make them authoritative.
  const prepared = readFileSync(path.join(packageDir, entry), "utf8");
  if (prepared !== serializeDocumentEntry(document)) throw new Error("prepared entry verification failed");
  // Persist the new directory entry before publishing a manifest that names it.
  syncDirectory(packageDir);
  requireBaseline(dataDir, slug, baseline);
  invokePublicationOperation("manifest", () => writeFileAtomic(path.join(packageDir, "manifest.ui"), manifestBytes(revision, entry)));
  syncDirectory(packageDir);
};

const bootstrapPackage = (dataDir: string, slug: string, packageDir: string, document: EditorDocument, revision: number, baseline: PublicationIdentity): void => {
  const parent = path.dirname(packageDir);
  mkdirSync(parent, { recursive: true });
  const staging = path.join(parent, `.${path.basename(packageDir)}.${randomUUID()}.staging`);
  mkdirSync(staging);
  try {
    const entry = revisionEntry(revision);
    invokePublicationOperation("entry", () => writeImmutableFile(path.join(staging, entry), Buffer.from(serializeDocumentEntry(document), "utf8")));
    invokePublicationOperation("manifest", () => writeFileAtomic(path.join(staging, "manifest.ui"), manifestBytes(revision, entry)));
    syncDirectory(staging);
    requireBaseline(dataDir, slug, baseline);
    invokePublicationOperation("bootstrap", () => renameSync(staging, packageDir));
    syncDirectory(parent);
  } finally {
    if (existsSync(staging)) rmSync(staging, { recursive: true, force: true });
  }
};

const pruneSupersededEntries = (packageDir: string, revision: number): void => {
  for (const entry of readdirSync(packageDir)) {
    const match = /^document-(\d+)\.ui$/u.exec(entry);
    if (!match) continue;
    const entryRevision = Number(match[1]);
    // Keep the current and immediately previous complete publication. Older
    // entries and abandoned future preparations are unreachable recovery debris.
    if (entryRevision < revision - 1) {
      try {
        unlinkSync(path.join(packageDir, entry));
      } catch {
        // Cleanup is best-effort after verified publication; it cannot change
        // the acknowledged document or its manifest-selected identity.
      }
    }
  }
};

const publicationFailure = (error: unknown, dataDir: string, slug: string, baseline: PublicationIdentity, intendedRevision: number, intendedDocument: EditorDocument): StoreResult<never> => {
  if (error instanceof PublicationRejected) return error.result;
  if (error instanceof PublicationFault && !error.event.endsWith(":syscall-error")) throw error.cause;
  const event = error instanceof PublicationFault ? error.event : undefined;
  const sampled = sampleDocumentPublication(dataDir, slug);
  const baselineIntact = sampled.ok && sampled.value.identity.source === baseline.source && sampled.value.identity.digest === baseline.digest;
  const intendedVisible = sampled.ok && sampled.value.identity.source === "package" && sampled.value.revision === intendedRevision && serializeDocument(sampled.value.document) === serializeDocument(intendedDocument);
  if (sampled.ok && !baselineIntact && !intendedVisible) return externalChange();
  const committed = !baselineIntact && (intendedVisible || event?.startsWith("manifest:") || event?.startsWith("directory-sync:") || event?.startsWith("bootstrap:") || event?.startsWith("verify:") || event?.startsWith("acknowledgement:"));
  return failure({
    code: committed ? "DOCUMENT_PUBLICATION_INDETERMINATE" : "DOCUMENT_PUBLICATION_FAILED",
    status: 409,
    message: committed ? "DOCUMENT_PUBLICATION_INDETERMINATE" : "DOCUMENT_PUBLICATION_FAILED",
    diagnostics: [{
      code: committed ? "DOCUMENT_PUBLICATION_INDETERMINATE" : "DOCUMENT_PUBLICATION_FAILED",
      message: event ?? "syscall-error"
    }]
  });
};

const verifyPublishedIdentity = (dataDir: string, slug: string, document: EditorDocument, revision: number): PublicationIdentity | undefined => {
  fault("verify:before-call");
  fault("verify:syscall-error");
  const packageDir = packageDirectory(dataDir, slug);
  const manifestPath = path.join(packageDir, "manifest.ui");
  const entry = revisionEntry(revision);
  const expectedManifest = manifestBytes(revision, entry);
  const expectedEntry = Buffer.from(serializeDocumentEntry(document), "utf8");
  const expectedIdentity = packageDigest(expectedManifest, expectedEntry, fileIdentity(statSync(path.join(packageDir, entry))));
  const sampled = sampleDocumentPublication(dataDir, slug);
  const valid = sampled.ok && sampled.value.identity.source === "package" && sampled.value.revision === revision &&
    sampled.value.identity.digest === expectedIdentity &&
    Buffer.compare(readFileSync(manifestPath), expectedManifest) === 0 && Buffer.compare(readFileSync(path.join(packageDir, entry)), expectedEntry) === 0;
  fault("verify:after-success");
  return valid && sampled.ok ? sampled.value.identity : undefined;
};

const publish = (dataDir: string, slug: string, packageDir: string, document: EditorDocument, revision: number, baseline: PublicationIdentity): StoreResult<PublicationIdentity> => {
  try {
    if (baseline.source === "package") commitPackage(dataDir, slug, packageDir, document, revision, baseline);
    else bootstrapPackage(dataDir, slug, packageDir, document, revision, baseline);
    const identity = verifyPublishedIdentity(dataDir, slug, document, revision);
    if (!identity) {
      return failure({ code: "DOCUMENT_PUBLICATION_INDETERMINATE", status: 409, message: "DOCUMENT_PUBLICATION_INDETERMINATE", diagnostics: [{ code: "DOCUMENT_EXTERNAL_CHANGE", message: "verify" }] });
    }
    fault("acknowledgement:before-call");
    fault("acknowledgement:syscall-error");
    fault("acknowledgement:after-success");
    pruneSupersededEntries(packageDir, revision);
    return { ok: true, value: identity };
  } catch (error) {
    return publicationFailure(error, dataDir, slug, baseline, revision, document);
  }
};

/** Validates the candidate document (migrating older schema versions), then
 *  commits it at the expected revision. A stale writer is refused with 409
 *  and the stored package is left untouched. */
export const writeDocument = (dataDir: string, slug: string, expectedRevision: unknown, candidate: unknown): StoreResult<{ document: EditorDocument; revision: number }> => {
  if (!isValidSlug(slug)) return slugFailure();
  const parsed = parseDocument(JSON.stringify(candidate) ?? "");
  if (!parsed.ok || !parsed.document) {
    const unsupported = parsed.diagnostics.some((diagnostic) => diagnostic.code === "DOCUMENT_UNSUPPORTED_SCHEMA");
    return failure({ code: unsupported ? "DOCUMENT_UNSUPPORTED_SCHEMA" : "DOCUMENT_INPUT_INVALID", status: 400, message: unsupported ? "DOCUMENT_UNSUPPORTED_SCHEMA" : "The document failed validation.", diagnostics: parsed.diagnostics });
  }
  const packageDir = packageDirectory(dataDir, slug);
  const baseline = sampleDocumentPublication(dataDir, slug);
  if (!baseline.ok) return baseline;
  const current = baseline.value.revision;
  if (expectedRevision !== current) return failure({ code: "DOCUMENT_REVISION_STALE", status: 409, message: "The document was changed by another writer.", currentRevision: current });
  const published = publish(dataDir, slug, packageDir, parsed.document, current + 1, baseline.value.identity);
  if (!published.ok) return published;
  return { ok: true, value: { document: parsed.document, revision: current + 1 } };
};


export interface FileSummary {
  slug: string;
  name: string;
  revision: number;
  pageCount: number;
  nodeCount: number;
  updatedAtMs: number | undefined;
}

/**
 * Enumerates every persisted package: `untitled.ui` plus each `files/*.ui`
 * directory with a readable manifest. Backs the Server Component file browser
 * at `/`, which reads this directly rather than fetching its own API.
 */
export const listFiles = (dataDir: string): FileSummary[] => {
  const summaries: FileSummary[] = [];
  const collect = (slug: string): void => {
    const packageDir = packageDirectory(dataDir, slug);
    const manifestPath = path.join(packageDir, "manifest.ui");
    if (!existsSync(manifestPath)) return;
    const read = readDocument(dataDir, slug);
    if (!read.ok) return;
    summaries.push({
      slug,
      name: read.value.document.file.name,
      revision: read.value.revision,
      pageCount: Object.keys(read.value.document.pages).length,
      nodeCount: Object.keys(read.value.document.nodes).length,
      updatedAtMs: statSync(manifestPath).mtimeMs
    });
  };
  collect(DEFAULT_SLUG);
  const filesDir = path.join(dataDir, "files");
  if (existsSync(filesDir)) {
    for (const entry of readdirSync(filesDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.endsWith(".ui")) continue;
      const slug = entry.name.slice(0, -3);
      if (!isValidSlug(slug) || slug === DEFAULT_SLUG) continue;
      collect(slug);
    }
  }
  return summaries.sort((left, right) => (right.updatedAtMs ?? 0) - (left.updatedAtMs ?? 0) || left.slug.localeCompare(right.slug));
};

export interface SnapshotResult {
  metadata: Record<string, string | number>;
  payloadBytes: string;
}

/** Canonical bytes + sha256 of the authored document (the snapshot identity
 *  of the file: revision, canonical-json hash and base64 payload). */
export const snapshotDocument = (dataDir: string, slug: string): StoreResult<SnapshotResult> => {
  if (!isValidSlug(slug)) return slugFailure();
  const read = readDocument(dataDir, slug);
  if (!read.ok) return read;
  const bytes = Buffer.from(serializeDocument(read.value.document), "utf8");
  return {
    ok: true,
    value: {
      metadata: {
        fileId: read.value.document.file.id,
        revision: read.value.revision,
        algorithm: "canonical-json-v1",
        byteLength: bytes.byteLength,
        sha256: createHash("sha256").update(bytes).digest("hex")
      },
      payloadBytes: bytes.toString("base64")
    }
  };
};

/** Imports a pen.dev document: pen-import produces a fully validated
 *  EditorDocument, then the package is committed at the current revision + 1
 *  through the same entry-first/manifest-last path as writeDocument. */
export const importPen = (dataDir: string, slug: string, pen: unknown): StoreResult<{ document: EditorDocument; revision: number; diagnostics: PenImportDiagnostic[] }> => {
  if (!isValidSlug(slug)) return slugFailure();
  const result = importPenDocument(pen);
  if (!result.ok) {
    return failure({ code: "PEN_IMPORT_INVALID", status: 400, message: "The .pen document could not be imported.", diagnostics: result.diagnostics });
  }
  const packageDir = packageDirectory(dataDir, slug);
  const baseline = sampleDocumentPublication(dataDir, slug);
  if (!baseline.ok) return baseline;
  const current = baseline.value.revision;
  const published = publish(dataDir, slug, packageDir, result.document, current + 1, baseline.value.identity);
  if (!published.ok) return published;
  return { ok: true, value: { document: result.document, revision: current + 1, diagnostics: result.diagnostics } };
};
