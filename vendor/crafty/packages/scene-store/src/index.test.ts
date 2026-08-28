import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { migrateDocument, sceneToEditorDocument, serializeDocument, type EditorDocument } from "@crafty/editor/kernel";
import { canonicalSceneBytes, createEmptyScene, createSeedScene } from "@crafty/scene-model";

import { DEFAULT_SLUG, importPen, isValidSlug, legacySceneFile, listFiles, loadPersistedScene, packageDirectory, readDocument, sampleDocumentPublication, setPublicationFaultHook, setPublicationSampleHook, setPublicationWriteLimit, snapshotDocument, writeDocument } from "./index.js";
import { serializeDocumentEntry } from "./ui-format.js";

let dataDir = "";

beforeEach(() => {
  dataDir = mkdtempSync(path.join(os.tmpdir(), "crafty-store-"));
});

afterEach(() => {
  setPublicationFaultHook(undefined);
  setPublicationSampleHook(undefined);
  setPublicationWriteLimit(undefined);
  rmSync(dataDir, { recursive: true, force: true });
});

describe("coherent publication sampling", () => {
  it("returns one reusable identity with the document selected by the manifest", () => {
    const document = seedDocument();
    expect(writeDocument(dataDir, "card", 0, document).ok).toBe(true);
    const sampled = sampleDocumentPublication(dataDir, "card");
    expect(sampled).toMatchObject({ ok: true, value: { revision: 1, document, converted: false, identity: { source: "package" } } });
    if (sampled.ok) expect(sampled.value.identity.digest).toMatch(/^[a-f0-9]{64}$/u);
  });

  it("retries movement at most three times and then returns DOCUMENT_EXTERNAL_CHANGE", () => {
    const document = seedDocument();
    expect(writeDocument(dataDir, "card", 0, document).ok).toBe(true);
    let attempts = 0;
    setPublicationSampleHook((event) => {
      if (event !== "package:after-entry-read") return;
      attempts += 1;
      const manifest = readFileSync(manifestPath("card"), "utf8");
      writeFileSync(manifestPath("card"), `${manifest} `, "utf8");
    });
    const sampled = sampleDocumentPublication(dataDir, "card");
    expect(sampled).toMatchObject({ ok: false, error: { code: "DOCUMENT_EXTERNAL_CHANGE" } });
    expect(attempts).toBe(3);
  });

  it("returns a stable malformed diagnostic rather than churn or fresh fallback", () => {
    writeManifest("card", { format: "crafty.ui-package", formatVersion: 2, revision: 1, entries: { document: "document.ui" } });
    expect(sampleDocumentPublication(dataDir, "card")).toMatchObject({ ok: false, error: { code: "UI_FORMAT_UNSUPPORTED" } });
  });

  it("detects same-revision external entry replacement by publication identity", () => {
    const document = seedDocument();
    expect(writeDocument(dataDir, "card", 0, document).ok).toBe(true);
    const first = sampleDocumentPublication(dataDir, "card");
    expect(first.ok).toBe(true);
    const replacement = { ...document, file: { ...document.file, name: "external" } };
    writeFileSync(path.join(packageDirectory(dataDir, "card"), "document-1.ui"), serializeDocumentEntry(replacement), "utf8");
    const second = sampleDocumentPublication(dataDir, "card");
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.value.revision).toBe(first.value.revision);
      expect(second.value.identity.digest).not.toBe(first.value.identity.digest);
      expect(second.value.document).toEqual(replacement);
    }
  });

  it("refuses a same-revision replacement observed by the final pre-commit sample", () => {
    const prior = seedDocument();
    expect(writeDocument(dataDir, "card", 0, prior).ok).toBe(true);
    const replacement = { ...prior, file: { ...prior.file, name: "external" } };
    let packageSamples = 0;
    setPublicationSampleHook((event) => {
      if (event !== "package:after-entry-read") return;
      packageSamples += 1;
      if (packageSamples === 2) writeFileSync(path.join(packageDirectory(dataDir, "card"), "document-1.ui"), serializeDocumentEntry(replacement), "utf8");
    });
    const result = writeDocument(dataDir, "card", 1, { ...prior, file: { ...prior.file, name: "mine" } });
    expect(result).toMatchObject({ ok: false, error: { code: "DOCUMENT_EXTERNAL_CHANGE" } });
    setPublicationSampleHook(undefined);
    expect(readDocument(dataDir, "card")).toMatchObject({ ok: true, value: { revision: 1, document: replacement } });
  });

  it("retries a legacy path replacement and returns the replacement coherently", () => {
    const original = createSeedScene();
    const replacement = { ...original, name: "replacement" };
    const legacyFile = legacySceneFile(dataDir, "legacy-moving");
    mkdirSync(path.dirname(legacyFile), { recursive: true });
    writeFileSync(legacyFile, canonicalSceneBytes(original));
    let moved = false;
    setPublicationSampleHook((event) => {
      if (event !== "legacy:after-read" || moved) return;
      moved = true;
      const replacementPath = `${legacyFile}.replacement`;
      writeFileSync(replacementPath, canonicalSceneBytes(replacement));
      renameSync(replacementPath, legacyFile);
    });
    const sampled = sampleDocumentPublication(dataDir, "legacy-moving");
    expect(sampled).toMatchObject({ ok: true, value: { converted: true, document: { file: { name: "replacement" } } } });
  });

  it("never overwrites an existing revision entry after an external manifest rollback", () => {
    const first = seedDocument();
    const second = { ...first, file: { ...first.file, name: "second" } };
    expect(writeDocument(dataDir, "card", 0, first).ok).toBe(true);
    expect(writeDocument(dataDir, "card", 1, second).ok).toBe(true);
    const packageDir = packageDirectory(dataDir, "card");
    const secondBytes = readFileSync(path.join(packageDir, "document-2.ui"));
    writeFileSync(manifestPath("card"), `{"entries":{"document":"document-1.ui"},"format":"crafty.ui-package","formatVersion":1,"revision":1}`);
    const result = writeDocument(dataDir, "card", 1, { ...first, file: { ...first.file, name: "third" } });
    expect(result).toMatchObject({ ok: false, error: { code: "DOCUMENT_PUBLICATION_FAILED" } });
    expect(readFileSync(path.join(packageDir, "document-2.ui"))).toEqual(secondBytes);
  });
});

const seedDocument = (): EditorDocument => {
  const migrated = migrateDocument(sceneToEditorDocument(createSeedScene()));
  if (!migrated.ok || !migrated.document) throw new Error("seed migration failed");
  return migrated.document;
};

const writeManifest = (slug: string, manifest: unknown): void => {
  const packageDir = packageDirectory(dataDir, slug);
  mkdirSync(packageDir, { recursive: true });
  writeFileSync(path.join(packageDir, "manifest.ui"), JSON.stringify(manifest), "utf8");
};

const manifestPath = (slug: string): string => path.join(packageDirectory(dataDir, slug), "manifest.ui");

const stamp = (slug: string, atMs: number): void => {
  const at = new Date(atMs);
  utimesSync(manifestPath(slug), at, at);
};

describe("slugs", () => {
  it("accepts lowercase slugs and rejects everything else", () => {
    expect(isValidSlug("untitled")).toBe(true);
    expect(isValidSlug("card-demo-2")).toBe(true);
    expect(isValidSlug("-leading")).toBe(false);
    expect(isValidSlug("Upper")).toBe(false);
    expect(isValidSlug("../escape")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });

  it("routes the default slug to the data-directory root and others to files/", () => {
    expect(packageDirectory(dataDir, DEFAULT_SLUG)).toBe(path.join(dataDir, "untitled.ui"));
    expect(packageDirectory(dataDir, "card")).toBe(path.join(dataDir, "files", "card.ui"));
    expect(legacySceneFile(dataDir, DEFAULT_SLUG)).toBe(path.join(dataDir, "scene.json"));
    expect(legacySceneFile(dataDir, "card")).toBe(path.join(dataDir, "files", "card", "scene.json"));
  });

  it("refuses reads, writes, imports and snapshots for an invalid slug", () => {
    const read = readDocument(dataDir, "../escape");
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.error.code).toBe("SLUG_INVALID");
    const write = writeDocument(dataDir, "Upper", 0, seedDocument());
    expect(write.ok).toBe(false);
    if (!write.ok) expect(write.error.status).toBe(400);
    const imported = importPen(dataDir, "..", {});
    expect(imported.ok).toBe(false);
    if (!imported.ok) expect(imported.error.code).toBe("SLUG_INVALID");
    const snapshot = snapshotDocument(dataDir, "");
    expect(snapshot.ok).toBe(false);
    if (!snapshot.ok) expect(snapshot.error.code).toBe("SLUG_INVALID");
  });
});

describe("ui package persistence", () => {
  it("completes atomic and immutable files when the filesystem accepts short writes", () => {
    setPublicationWriteLimit(7);
    const document = seedDocument();
    expect(writeDocument(dataDir, "card", 0, document)).toMatchObject({ ok: true, value: { revision: 1 } });
    expect(readDocument(dataDir, "card")).toMatchObject({ ok: true, value: { revision: 1, document } });
  });

  it("round-trips a document through write and read with a bumped revision", () => {
    const document = seedDocument();
    const written = writeDocument(dataDir, "card", 0, document);
    expect(written.ok).toBe(true);
    if (!written.ok) return;
    expect(written.value.revision).toBe(1);
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value.document).toEqual(document);
    expect(read.value.revision).toBe(1);
    expect(read.value.applied).toEqual([]);
    expect(read.value.converted).toBe(false);
  });

  it("writes canonical bytes: sorted keys, exact serialization, byte-identical across saves", () => {
    const document = seedDocument();
    writeDocument(dataDir, "card", 0, document);
    writeDocument(dataDir, "poster", 0, document);
    const cardManifest = readFileSync(manifestPath("card"), "utf8");
    const cardEntry = readFileSync(path.join(packageDirectory(dataDir, "card"), "document-1.ui"), "utf8");
    expect(cardManifest).toBe(`{"entries":{"document":"document-1.ui"},"format":"crafty.ui-package","formatVersion":1,"revision":1}`);
    expect(cardEntry).toBe(`{"document":${serializeDocument(document)},"format":"crafty.ui-document"}`);
    expect(cardManifest).toBe(readFileSync(manifestPath("poster"), "utf8"));
    expect(cardEntry).toBe(readFileSync(path.join(packageDirectory(dataDir, "poster"), "document-1.ui"), "utf8"));
    const manifestKeys = Object.keys(JSON.parse(cardManifest) as Record<string, unknown>);
    expect(manifestKeys).toEqual(["entries", "format", "formatVersion", "revision"]);
    const entryKeys = Object.keys(JSON.parse(cardEntry) as Record<string, unknown>);
    expect(entryKeys).toEqual(["document", "format"]);
    const rewrite = writeDocument(dataDir, "card", 1, document);
    expect(rewrite.ok).toBe(true);
    expect(readFileSync(path.join(packageDirectory(dataDir, "card"), "document-2.ui"), "utf8")).toBe(cardEntry);
    expect(readFileSync(manifestPath("card"), "utf8")).toBe(`{"entries":{"document":"document-2.ui"},"format":"crafty.ui-package","formatVersion":1,"revision":2}`);
  });

  it("leaves the manifest and immutable revision entry with no temp files behind", () => {
    writeDocument(dataDir, DEFAULT_SLUG, 0, seedDocument());
    expect(readdirSync(packageDirectory(dataDir, DEFAULT_SLUG)).sort()).toEqual(["document-1.ui", "manifest.ui"]);
  });

  it("retains only the current and previous complete revision entries", () => {
    const document = seedDocument();
    expect(writeDocument(dataDir, "card", 0, document).ok).toBe(true);
    expect(writeDocument(dataDir, "card", 1, document).ok).toBe(true);
    expect(writeDocument(dataDir, "card", 2, document).ok).toBe(true);
    expect(readdirSync(packageDirectory(dataDir, "card")).sort()).toEqual([
      "document-2.ui",
      "document-3.ui",
      "manifest.ui",
    ]);
  });

  it("rejects an invalid document payload with 400 and diagnostics", () => {
    const result = writeDocument(dataDir, "card", 0, { nope: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DOCUMENT_INPUT_INVALID");
      expect(result.error.status).toBe(400);
      expect(result.error.diagnostics?.length).toBeGreaterThan(0);
    }
    expect(existsSync(packageDirectory(dataDir, "card"))).toBe(false);
  });

  it("migrates an older-schema candidate and stores the current version", () => {
    const v1 = sceneToEditorDocument(createSeedScene());
    const written = writeDocument(dataDir, "card", 0, v1);
    expect(written.ok).toBe(true);
    if (!written.ok) return;
    expect(written.value.document.schemaVersion).toBe(5);
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(true);
    if (read.ok) expect(read.value.document.schemaVersion).toBe(5);
  });

  it("surfaces an unsupported document schema without mutating existing bytes", () => {
    const document = seedDocument();
    writeDocument(dataDir, "card", 0, document);
    const before = readFileSync(path.join(packageDirectory(dataDir, "card"), "document-1.ui"));
    const unsupported = { ...document, schemaVersion: 999 };
    const result = writeDocument(dataDir, "card", 1, unsupported);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("DOCUMENT_UNSUPPORTED_SCHEMA");
    expect(readFileSync(path.join(packageDirectory(dataDir, "card"), "document-1.ui"))).toEqual(before);
  });
});

describe("optimistic revisions", () => {
  it("refuses a stale writer with 409 and leaves the stored package unchanged", () => {
    const document = seedDocument();
    writeDocument(dataDir, "card", 0, document);
    const stale = writeDocument(dataDir, "card", 0, { ...document, file: { ...document.file, name: "Changed" } });
    expect(stale.ok).toBe(false);
    if (!stale.ok) {
      expect(stale.error.code).toBe("DOCUMENT_REVISION_STALE");
      expect(stale.error.status).toBe(409);
      expect(stale.error.currentRevision).toBe(1);
    }
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(true);
    if (read.ok) {
      expect(read.value.revision).toBe(1);
      expect(read.value.document).toEqual(document);
    }
  });

  it("accepts a write at the current revision and bumps it", () => {
    writeDocument(dataDir, "card", 0, seedDocument());
    const second = writeDocument(dataDir, "card", 1, seedDocument());
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.value.revision).toBe(2);
  });
});

describe("package gates", () => {
  it("rejects a package directory without a manifest with UI_MANIFEST_MISSING", () => {
    mkdirSync(packageDirectory(dataDir, "card"), { recursive: true });
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(false);
    if (!read.ok) {
      expect(read.error.code).toBe("UI_MANIFEST_MISSING");
      expect(read.error.status).toBe(404);
    }
  });

  it("rejects a manifest without the package marker with UI_FORMAT_MISSING", () => {
    writeManifest("card", { format: "crafty.something-else", formatVersion: 1, revision: 1, entries: { document: "document.ui" } });
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(false);
    if (!read.ok) {
      expect(read.error.code).toBe("UI_FORMAT_MISSING");
      expect(read.error.status).toBe(400);
    }
  });

  it("rejects an unsupported formatVersion with the version in the message", () => {
    writeManifest("card", { format: "crafty.ui-package", formatVersion: 2, revision: 1, entries: { document: "document.ui" } });
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(false);
    if (!read.ok) {
      expect(read.error.code).toBe("UI_FORMAT_UNSUPPORTED");
      expect(read.error.message).toBe("UI_FORMAT_UNSUPPORTED:2");
    }
  });

  it("rejects an unknown entry role with the role in the message", () => {
    writeManifest("card", { format: "crafty.ui-package", formatVersion: 1, revision: 1, entries: { document: "document.ui", tokens: "tokens.ui" } });
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(false);
    if (!read.ok) {
      expect(read.error.code).toBe("UI_ENTRY_UNSUPPORTED");
      expect(read.error.message).toBe("UI_ENTRY_UNSUPPORTED:tokens");
    }
  });

  it("rejects an entry path that escapes the package with UI_ENTRY_PATH_INVALID", () => {
    writeManifest("card", { format: "crafty.ui-package", formatVersion: 1, revision: 1, entries: { document: "../document.ui" } });
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.error.code).toBe("UI_ENTRY_PATH_INVALID");
  });

  it("rejects a manifest without the document role with UI_ENTRY_MISSING:document", () => {
    writeManifest("card", { format: "crafty.ui-package", formatVersion: 1, revision: 1, entries: {} });
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(false);
    if (!read.ok) {
      expect(read.error.code).toBe("UI_ENTRY_MISSING");
      expect(read.error.status).toBe(404);
      expect(read.error.message).toBe("UI_ENTRY_MISSING:document");
    }
  });

  it("rejects a manifest referencing a missing entry file with UI_ENTRY_MISSING:document", () => {
    writeManifest("card", { format: "crafty.ui-package", formatVersion: 1, revision: 1, entries: { document: "document.ui" } });
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(false);
    if (!read.ok) {
      expect(read.error.code).toBe("UI_ENTRY_MISSING");
      expect(read.error.status).toBe(404);
      expect(read.error.message).toBe("UI_ENTRY_MISSING:document");
    }
  });

  it("rejects a document entry without the crafty.ui-document marker with UI_FORMAT_MISSING", () => {
    writeManifest("card", { format: "crafty.ui-package", formatVersion: 1, revision: 1, entries: { document: "document.ui" } });
    writeFileSync(path.join(packageDirectory(dataDir, "card"), "document.ui"), `{"document":${serializeDocument(seedDocument())}}`, "utf8");
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(false);
    if (!read.ok) {
      expect(read.error.code).toBe("UI_FORMAT_MISSING");
      expect(read.error.status).toBe(400);
    }
  });

  it("rejects a document payload that fails validation with diagnostics", () => {
    writeManifest("card", { format: "crafty.ui-package", formatVersion: 1, revision: 1, entries: { document: "document.ui" } });
    writeFileSync(path.join(packageDirectory(dataDir, "card"), "document.ui"), `{"document":{"nope":true},"format":"crafty.ui-document"}`, "utf8");
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(false);
    if (!read.ok) {
      expect(read.error.code).toBe("DOCUMENT_INPUT_INVALID");
      expect(read.error.status).toBe(400);
      expect(read.error.diagnostics?.length).toBeGreaterThan(0);
    }
  });
});

describe("crash safety", () => {
  it("keeps the manifest-selected publication when an unreferenced entry appears", () => {
    const document = seedDocument();
    writeDocument(dataDir, "card", 0, document);
    const advanced = { ...document, file: { ...document.file, name: "Crash-advanced" } };
    writeFileSync(path.join(packageDirectory(dataDir, "card"), "document-99.ui"), serializeDocumentEntry(advanced), "utf8");
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value.document).toEqual(document);
    expect(read.value.revision).toBe(1);
    expect(read.value.converted).toBe(false);
    const next = writeDocument(dataDir, "card", 1, advanced);
    expect(next.ok).toBe(true);
    if (next.ok) expect(next.value.revision).toBe(2);
  });

  it("keeps the prior complete publication when preparation is interrupted", () => {
    const prior = seedDocument();
    writeDocument(dataDir, "card", 0, prior);
    setPublicationFaultHook((event) => {
      if (event === "entry:before-call") throw new Error("interrupted");
    });
    expect(() => writeDocument(dataDir, "card", 1, { ...prior, file: { ...prior.file, name: "new" } })).toThrow("interrupted");
    const restarted = readDocument(dataDir, "card");
    expect(restarted.ok).toBe(true);
    if (restarted.ok) {
      expect(restarted.value.document).toEqual(prior);
      expect(restarted.value.revision).toBe(1);
    }
  });

  it("retries safely after interruption leaves an unreachable prepared entry", () => {
    const prior = seedDocument();
    const next = { ...prior, file: { ...prior.file, name: "retry" } };
    expect(writeDocument(dataDir, "card", 0, prior).ok).toBe(true);
    setPublicationFaultHook((event) => {
      if (event === "entry:after-success") throw new Error("process death");
    });
    expect(() => writeDocument(dataDir, "card", 1, next)).toThrow("process death");
    setPublicationFaultHook(undefined);
    expect(writeDocument(dataDir, "card", 1, next)).toMatchObject({ ok: true, value: { revision: 2, document: next } });
  });

  it("does not acknowledge a byte-identical entry identity replacement during verification", () => {
    const prior = seedDocument();
    const next = { ...prior, file: { ...prior.file, name: "identity" } };
    expect(writeDocument(dataDir, "card", 0, prior).ok).toBe(true);
    let samples = 0;
    setPublicationSampleHook((event) => {
      if (event !== "package:after-entry-read") return;
      samples += 1;
      if (samples !== 3) return;
      const entry = path.join(packageDirectory(dataDir, "card"), "document-2.ui");
      const bytes = readFileSync(entry);
      const replacement = `${entry}.replacement`;
      writeFileSync(replacement, bytes);
      renameSync(replacement, entry);
    });
    expect(writeDocument(dataDir, "card", 1, next)).toMatchObject({ ok: false, error: { code: "DOCUMENT_PUBLICATION_INDETERMINATE" } });
  });

  it("publishes a revision-specific immutable entry with its matching revision", () => {
    const prior = seedDocument();
    writeDocument(dataDir, "card", 0, prior);
    const next = { ...prior, file: { ...prior.file, name: "new" } };
    writeDocument(dataDir, "card", 1, next);
    const manifest = JSON.parse(readFileSync(manifestPath("card"), "utf8")) as { entries: { document: string }; revision: number };
    expect(manifest.entries.document).not.toBe("document.ui");
    expect(manifest.entries.document).toBe(`document-${manifest.revision}.ui`);
    const restarted = readDocument(dataDir, "card");
    expect(restarted.ok).toBe(true);
    if (restarted.ok) {
      expect(restarted.value.revision).toBe(manifest.revision);
      expect(restarted.value.document).toEqual(next);
    }
  });

  it("acknowledges a save only after its intended published identity is readable", () => {
    const prior = seedDocument();
    writeDocument(dataDir, "card", 0, prior);
    const next = { ...prior, file: { ...prior.file, name: "verified" } };
    const written = writeDocument(dataDir, "card", 1, next);
    expect(written).toMatchObject({ ok: true, value: { revision: 2, document: next } });
    const manifest = JSON.parse(readFileSync(manifestPath("card"), "utf8")) as { entries: { document: string }; revision: number };
    expect(manifest).toMatchObject({ revision: 2, entries: { document: "document-2.ui" } });
    expect(readDocument(dataDir, "card")).toMatchObject({ ok: true, value: { revision: 2, document: next } });
  });

  it("returns DOCUMENT_PUBLICATION_FAILED for a pre-commit syscall error", () => {
    const prior = seedDocument();
    writeDocument(dataDir, "card", 0, prior);
    setPublicationFaultHook((event) => {
      if (event === "entry:syscall-error") throw new Error("forced syscall error");
    });
    const result = writeDocument(dataDir, "card", 1, { ...prior, file: { ...prior.file, name: "new" } });
    expect(result).toMatchObject({ ok: false, error: { code: "DOCUMENT_PUBLICATION_FAILED" } });
    expect(readDocument(dataDir, "card")).toMatchObject({ ok: true, value: { revision: 1, document: prior } });
  });

  it("resamples a forced manifest syscall error as previous-intact", () => {
    const prior = seedDocument();
    writeDocument(dataDir, "card", 0, prior);
    setPublicationFaultHook((event) => {
      if (event === "manifest:syscall-error") throw new Error("interrupted after commit");
    });
    const result = writeDocument(dataDir, "card", 1, { ...prior, file: { ...prior.file, name: "new" } });
    expect(result).toMatchObject({ ok: false, error: { code: "DOCUMENT_PUBLICATION_FAILED" } });
  });

  it.each([
    ["entry:syscall-error", "DOCUMENT_PUBLICATION_FAILED"],
    ["manifest:syscall-error", "DOCUMENT_PUBLICATION_FAILED"],
    ["directory-sync:syscall-error", "DOCUMENT_PUBLICATION_FAILED"],
    ["verify:syscall-error", "DOCUMENT_PUBLICATION_INDETERMINATE"],
    ["acknowledgement:syscall-error", "DOCUMENT_PUBLICATION_INDETERMINATE"]
  ] as const)("classifies existing-package forced error %s as %s after coherent recovery", (boundary, code) => {
    const prior = seedDocument();
    const next = { ...prior, file: { ...prior.file, name: boundary } };
    expect(writeDocument(dataDir, "card", 0, prior).ok).toBe(true);
    setPublicationFaultHook((event) => {
      if (event === boundary) throw new Error("forced syscall error");
    });
    const result = writeDocument(dataDir, "card", 1, next);
    expect(result).toMatchObject({ ok: false, error: { code } });
    setPublicationFaultHook(undefined);
    const recovered = readDocument(dataDir, "card");
    expect(recovered.ok).toBe(true);
    if (recovered.ok) expect([{ revision: 1, document: prior }, { revision: 2, document: next }]).toContainEqual({ revision: recovered.value.revision, document: recovered.value.document });
  });

  it("classifies the existing-package post-commit directory sync error as indeterminate", () => {
    const prior = seedDocument();
    const next = { ...prior, file: { ...prior.file, name: "post-commit-sync" } };
    expect(writeDocument(dataDir, "card", 0, prior).ok).toBe(true);
    let syncCalls = 0;
    setPublicationFaultHook((event) => {
      if (event !== "directory-sync:syscall-error") return;
      syncCalls += 1;
      if (syncCalls === 2) throw new Error("forced post-commit sync error");
    });
    expect(writeDocument(dataDir, "card", 1, next)).toMatchObject({ ok: false, error: { code: "DOCUMENT_PUBLICATION_INDETERMINATE" } });
    setPublicationFaultHook(undefined);
    expect(readDocument(dataDir, "card")).toMatchObject({ ok: true, value: { revision: 2, document: next } });
  });

  it.each([
    ["entry:syscall-error", "DOCUMENT_PUBLICATION_FAILED"],
    ["manifest:syscall-error", "DOCUMENT_PUBLICATION_FAILED"],
    ["directory-sync:syscall-error", "DOCUMENT_PUBLICATION_FAILED"],
    ["bootstrap:syscall-error", "DOCUMENT_PUBLICATION_FAILED"],
    ["verify:syscall-error", "DOCUMENT_PUBLICATION_INDETERMINATE"],
    ["acknowledgement:syscall-error", "DOCUMENT_PUBLICATION_INDETERMINATE"]
  ] as const)("classifies bootstrap forced error %s as %s with fresh-or-new readability", (boundary, code) => {
    const next = seedDocument();
    setPublicationFaultHook((event) => {
      if (event === boundary) throw new Error("forced syscall error");
    });
    const result = writeDocument(dataDir, "fresh", 0, next);
    expect(result).toMatchObject({ ok: false, error: { code } });
    setPublicationFaultHook(undefined);
    const recovered = readDocument(dataDir, "fresh");
    expect(recovered.ok).toBe(true);
    if (recovered.ok) expect([0, 1]).toContain(recovered.value.revision);
  });

  it("classifies the bootstrap parent-directory sync error after commit as indeterminate", () => {
    const next = seedDocument();
    let syncCalls = 0;
    setPublicationFaultHook((event) => {
      if (event !== "directory-sync:syscall-error") return;
      syncCalls += 1;
      if (syncCalls === 2) throw new Error("forced parent sync error");
    });
    expect(writeDocument(dataDir, "fresh", 0, next)).toMatchObject({ ok: false, error: { code: "DOCUMENT_PUBLICATION_INDETERMINATE" } });
    setPublicationFaultHook(undefined);
    expect(readDocument(dataDir, "fresh")).toMatchObject({ ok: true, value: { revision: 1, document: next } });
  });

  it.each([
    "entry:before-call",
    "entry:after-success",
    "manifest:before-call",
    "manifest:after-success",
    "directory-sync:before-call",
    "directory-sync:after-success",
    "verify:before-call",
    "verify:after-success",
    "acknowledgement:before-call",
    "acknowledgement:after-success"
  ] as const)("recovers a complete prior-or-new existing package at %s", (boundary) => {
    const prior = seedDocument();
    const next = { ...prior, file: { ...prior.file, name: "new" } };
    writeDocument(dataDir, "card", 0, prior);
    setPublicationFaultHook((event) => {
      if (event === boundary) throw new Error("interrupted");
    });
    expect(() => writeDocument(dataDir, "card", 1, next)).toThrow("interrupted");
    setPublicationFaultHook(undefined);
    const restarted = readDocument(dataDir, "card");
    expect(restarted.ok).toBe(true);
    if (restarted.ok) {
      expect([
        { document: prior, revision: 1 },
        { document: next, revision: 2 }
      ]).toContainEqual({ document: restarted.value.document, revision: restarted.value.revision });
    }
  });

  it.each([
    "entry:before-call",
    "entry:after-success",
    "manifest:before-call",
    "manifest:after-success",
    "directory-sync:before-call",
    "directory-sync:after-success",
    "bootstrap:before-call",
    "bootstrap:after-success"
  ] as const)("recovers a complete fresh baseline or new bootstrap package at %s", (boundary) => {
    const next = seedDocument();
    setPublicationFaultHook((event) => {
      if (event === boundary) throw new Error("interrupted");
    });
    expect(() => writeDocument(dataDir, "fresh", 0, next)).toThrow("interrupted");
    setPublicationFaultHook(undefined);
    const restarted = readDocument(dataDir, "fresh");
    expect(restarted.ok).toBe(true);
    if (restarted.ok) {
      expect([
        { document: next, revision: 1 },
        { document: migrateDocument(sceneToEditorDocument(createEmptyScene())).document, revision: 0 }
      ]).toContainEqual({ document: restarted.value.document, revision: restarted.value.revision });
    }
  });

  it.each(["entry:after-success", "bootstrap:before-call", "bootstrap:after-success"] as const)("keeps a readable legacy baseline or publishes a complete conversion at %s", (boundary) => {
    const scene = createSeedScene();
    mkdirSync(path.dirname(legacySceneFile(dataDir, "legacy-fault")), { recursive: true });
    writeFileSync(legacySceneFile(dataDir, "legacy-fault"), canonicalSceneBytes(scene), "utf8");
    const baseline = readDocument(dataDir, "legacy-fault");
    expect(baseline.ok).toBe(true);
    if (!baseline.ok) return;
    setPublicationFaultHook((event) => {
      if (event === boundary) throw new Error("interrupted");
    });
    expect(() => writeDocument(dataDir, "legacy-fault", 0, baseline.value.document)).toThrow("interrupted");
    setPublicationFaultHook(undefined);
    const restarted = readDocument(dataDir, "legacy-fault");
    expect(restarted.ok).toBe(true);
    if (restarted.ok) {
      expect([
        { document: baseline.value.document, revision: 0, converted: true },
        { document: baseline.value.document, revision: 1, converted: false }
      ]).toContainEqual({ document: restarted.value.document, revision: restarted.value.revision, converted: restarted.value.converted });
    }
  });

  it.each([
    "entry:before-call",
    "manifest:before-call",
    "manifest:after-success",
    "directory-sync:before-call",
    "directory-sync:after-success",
    "verify:before-call",
    "verify:after-success",
    "acknowledgement:before-call",
    "acknowledgement:after-success"
  ] as const)("recovers a complete legacy baseline or publication at %s", (boundary) => {
    const scene = createSeedScene();
    const legacyFile = legacySceneFile(dataDir, "legacy-matrix");
    mkdirSync(path.dirname(legacyFile), { recursive: true });
    writeFileSync(legacyFile, canonicalSceneBytes(scene));
    const baseline = readDocument(dataDir, "legacy-matrix");
    expect(baseline.ok).toBe(true);
    if (!baseline.ok) return;
    setPublicationFaultHook((event) => {
      if (event === boundary) throw new Error("process death");
    });
    expect(() => writeDocument(dataDir, "legacy-matrix", 0, baseline.value.document)).toThrow("process death");
    setPublicationFaultHook(undefined);
    const recovered = readDocument(dataDir, "legacy-matrix");
    expect(recovered.ok).toBe(true);
    if (recovered.ok) expect([0, 1]).toContain(recovered.value.revision);
  });
});

describe("legacy scene conversion", () => {
  it("converts a legacy scene.json on read and saves a package on write, leaving the legacy file", () => {
    const scene = createSeedScene();
    mkdirSync(path.dirname(legacySceneFile(dataDir, "card")), { recursive: true });
    writeFileSync(legacySceneFile(dataDir, "card"), canonicalSceneBytes(scene), "utf8");
    expect(loadPersistedScene(dataDir, "card")?.id).toBe(scene.id);
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value.converted).toBe(true);
    expect(read.value.revision).toBe(0);
    expect(read.value.applied).toEqual(["v1-to-v2-add-page-canvas", "v2-to-v3-add-path-kind", "v3-to-v4-add-semantic-surfaces", "v4-to-v5-require-text-content"]);
    const written = writeDocument(dataDir, "card", 0, read.value.document);
    expect(written.ok).toBe(true);
    if (written.ok) expect(written.value.revision).toBe(1);
    expect(existsSync(path.join(packageDirectory(dataDir, "card"), "manifest.ui"))).toBe(true);
    expect(existsSync(path.join(packageDirectory(dataDir, "card"), "document-1.ui"))).toBe(true);
    expect(existsSync(legacySceneFile(dataDir, "card"))).toBe(true);
  });

  it("keeps a package read in preference to a legacy scene for the same slug", () => {
    const scene = createSeedScene();
    mkdirSync(path.dirname(legacySceneFile(dataDir, "card")), { recursive: true });
    writeFileSync(legacySceneFile(dataDir, "card"), canonicalSceneBytes(scene), "utf8");
    const document = seedDocument();
    writeDocument(dataDir, "card", 0, document);
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value.converted).toBe(false);
    expect(read.value.document).toEqual(document);
  });

  it("refuses an unreadable or invalid legacy scene file rather than treating it as absent", () => {
    mkdirSync(path.dirname(legacySceneFile(dataDir, "broken")), { recursive: true });
    writeFileSync(legacySceneFile(dataDir, "broken"), "{ not json", "utf8");
    expect(loadPersistedScene(dataDir, "broken")).toBeUndefined();
    const read = readDocument(dataDir, "broken");
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.error.code).toBe("DOCUMENT_CORRUPT");
  });
});

describe("fresh documents", () => {
  it("returns the migrated empty document at revision 0 for a fresh slug", () => {
    const read = readDocument(dataDir, "brand-new");
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value.converted).toBe(false);
    expect(read.value.revision).toBe(0);
    expect(read.value.applied).toEqual(["v1-to-v2-add-page-canvas", "v2-to-v3-add-path-kind", "v3-to-v4-add-semantic-surfaces", "v4-to-v5-require-text-content"]);
    const expected = migrateDocument(sceneToEditorDocument(createEmptyScene()));
    expect(expected.ok).toBe(true);
    if (expected.ok) expect(read.value.document).toEqual(expected.document);
  });
});

describe("listFiles", () => {
  it("enumerates the default package and every files/*.ui package", () => {
    const document = seedDocument();
    writeDocument(dataDir, "card", 0, document);
    writeDocument(dataDir, "poster", 0, document);
    writeDocument(dataDir, DEFAULT_SLUG, 0, document);
    const slugs = listFiles(dataDir).map((file) => file.slug).sort();
    expect(slugs).toEqual(["card", "poster", DEFAULT_SLUG].sort());
  });

  it("reports names and page/node counts from the document", () => {
    const document = seedDocument();
    writeDocument(dataDir, "card", 0, document);
    const summary = listFiles(dataDir).find((file) => file.slug === "card");
    expect(summary?.name).toBe(document.file.name);
    expect(summary?.pageCount).toBe(Object.keys(document.pages).length);
    expect(summary?.nodeCount).toBe(Object.keys(document.nodes).length);
    expect(summary?.revision).toBe(1);
    expect(summary?.updatedAtMs).toBeGreaterThan(0);
  });

  it("sorts by updatedAtMs descending, then slug ascending, and skips non-package directories", () => {
    const document = seedDocument();
    writeDocument(dataDir, "card", 0, document);
    writeDocument(dataDir, "poster", 0, document);
    stamp("card", 2000);
    stamp("poster", 1000);
    expect(listFiles(dataDir).map((file) => file.slug)).toEqual(["card", "poster"]);
    stamp("card", 1000);
    expect(listFiles(dataDir).map((file) => file.slug)).toEqual(["card", "poster"]);
    mkdirSync(path.dirname(legacySceneFile(dataDir, "orphan")), { recursive: true });
    writeFileSync(legacySceneFile(dataDir, "orphan"), canonicalSceneBytes(createSeedScene()));
    mkdirSync(path.join(dataDir, "files", "assets"), { recursive: true });
    const slugs = listFiles(dataDir).map((file) => file.slug);
    expect(slugs).toEqual(["card", "poster"]);
  });

  it("returns nothing for an empty data directory", () => {
    expect(listFiles(dataDir)).toEqual([]);
  });
});

describe("snapshotDocument", () => {
  it("hashes the canonical document bytes deterministically", () => {
    writeDocument(dataDir, "card", 0, seedDocument());
    const first = snapshotDocument(dataDir, "card");
    const second = snapshotDocument(dataDir, "card");
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) expect(first.value.metadata.sha256).toBe(second.value.metadata.sha256);
  });

  it("matches the canonical serialization and round-trips the base64 payload", () => {
    writeDocument(dataDir, "card", 0, seedDocument());
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    const canonical = Buffer.from(serializeDocument(read.value.document), "utf8");
    const snapshot = snapshotDocument(dataDir, "card");
    expect(snapshot.ok).toBe(true);
    if (!snapshot.ok) return;
    expect(snapshot.value.metadata.fileId).toBe(read.value.document.file.id);
    expect(snapshot.value.metadata.revision).toBe(1);
    expect(snapshot.value.metadata.algorithm).toBe("canonical-json-v1");
    expect(snapshot.value.metadata.byteLength).toBe(canonical.byteLength);
    expect(snapshot.value.metadata.sha256).toBe(createHash("sha256").update(canonical).digest("hex"));
    expect(Buffer.from(snapshot.value.payloadBytes, "base64")).toEqual(canonical);
  });

  it("snapshots a fresh slug without persisting a package", () => {
    const snapshot = snapshotDocument(dataDir, "brand-new");
    expect(snapshot.ok).toBe(true);
    if (snapshot.ok) {
      expect(snapshot.value.metadata.revision).toBe(0);
      expect(snapshot.value.metadata.byteLength).toBeGreaterThan(0);
    }
    expect(existsSync(packageDirectory(dataDir, "brand-new"))).toBe(false);
  });
});

describe("pen import", () => {
  const penFixture = {
    version: "2.14",
    children: [
      {
        id: "card",
        type: "frame",
        x: 10,
        y: 20,
        width: 360,
        height: 200,
        name: "Card",
        fill: "#FFFFFF",
        cornerRadius: 12,
        layout: "none",
        children: [
          { id: "header", type: "rectangle", x: 24, y: 24, width: 100, height: 40, fill: "#0F172A" },
          { id: "label", type: "text", x: 24, y: 80, width: 200, height: 32, content: "Hello", fontSize: 16, fill: "#334155" }
        ]
      }
    ]
  };

  it("imports a valid .pen document and commits a package", () => {
    const result = importPen(dataDir, "card", penFixture);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.revision).toBe(1);
    expect(result.value.diagnostics).toEqual([]);
    expect(result.value.document.schemaVersion).toBe(5);
    const read = readDocument(dataDir, "card");
    expect(read.ok).toBe(true);
    if (read.ok) {
      expect(read.value.converted).toBe(false);
      expect(read.value.revision).toBe(1);
      expect(read.value.document).toEqual(result.value.document);
    }
  });

  it("rejects a malformed document", () => {
    const result = importPen(dataDir, "card", { not: "a pen document" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PEN_IMPORT_INVALID");
  });
});
