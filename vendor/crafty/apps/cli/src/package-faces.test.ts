import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync, cpSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { migrateDocument, sceneToEditorDocument, serializeDocument } from "@crafty/editor/kernel";
import { createSeedScene } from "@crafty/scene-model";
import { dataDirectory, packageDirectory, parseUiManifest, readDocument, serializeUiManifest, writeDocument } from "@crafty/scene-store";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runLoad, runSave } from "./package-faces.js";

const buildDocument = () => {
  const result = migrateDocument(sceneToEditorDocument(createSeedScene()));
  expect(result.ok).toBe(true);
  expect(result.document).toBeDefined();
  return result.document!;
};

const packageFiles = (dir: string): Record<string, string> => {
  const files: Record<string, string> = {};
  for (const name of existsSync(dir) ? readdirSync(dir).sort() : []) {
    const file = path.join(dir, name);
    files[name] = readFileSync(file, "utf8");
  }
  return files;
};

describe("crafty save face", () => {
  let dataDir: string;
  let cwd: string;

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(os.tmpdir(), "crafty-cli-save-"));
    cwd = process.cwd();
    process.env.CRAFTY_DATA_DIR = dataDir;
  });

  afterEach(() => {
    process.chdir(cwd);
    delete process.env.CRAFTY_DATA_DIR;
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("copies the store package to ./<slug>.ui by default", () => {
    const stored = writeDocument(dataDir, "alpha", 0, buildDocument());
    expect(stored.ok).toBe(true);
    process.chdir(dataDir);

    expect(runSave(["alpha"])).toBe(0);

    const copied = packageFiles(path.join(dataDir, "alpha.ui"));
    expect(copied).toEqual(packageFiles(packageDirectory(dataDir, "alpha")));
    const manifestText = copied["manifest.ui"];
    expect(manifestText).toBeDefined();
    const manifest = parseUiManifest(manifestText!);
    expect(manifest.ok).toBe(true);
    if (manifest.ok) expect(copied[manifest.value.entries.document!]).toBeDefined();
  });

  it("copies to an explicit target directory", () => {
    expect(writeDocument(dataDir, "alpha", 0, buildDocument()).ok).toBe(true);
    const target = path.join(dataDir, "out", "alpha.ui");
    expect(runSave(["alpha", target])).toBe(0);

    expect(packageFiles(target)).toEqual(packageFiles(packageDirectory(dataDir, "alpha")));
  });

  it("leaves the store untouched", () => {
    expect(writeDocument(dataDir, "alpha", 0, buildDocument()).ok).toBe(true);
    const before = packageFiles(packageDirectory(dataDir, "alpha"));
    const target = path.join(dataDir, "out", "alpha.ui");
    expect(runSave(["alpha", target])).toBe(0);
    expect(packageFiles(packageDirectory(dataDir, "alpha"))).toEqual(before);
  });

  it("rejects an invalid slug and too many args with exit 1", () => {
    expect(runSave(["Not-A-Slug"])).toBe(1);
    expect(runSave(["alpha", "a.ui", "extra"])).toBe(1);
  });

  it("rejects a missing stored file with exit 1", () => {
    expect(runSave(["ghost"])).toBe(1);
    expect(existsSync(path.join(dataDir, "ghost.ui"))).toBe(false);
  });
});

describe("crafty load face", () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(os.tmpdir(), "crafty-cli-load-"));
    process.env.CRAFTY_DATA_DIR = dataDir;
  });

  afterEach(() => {
    delete process.env.CRAFTY_DATA_DIR;
    rmSync(dataDir, { recursive: true, force: true });
  });

  const storePackage = (slug: string) => {
    const result = writeDocument(dataDir, slug, 0, buildDocument());
    expect(result.ok).toBe(true);
    return packageDirectory(dataDir, slug);
  };

  it("round-trips save then load", () => {
    const expected = writeDocument(dataDir, "alpha", 0, buildDocument());
    expect(expected.ok).toBe(true);
    const saved = path.join(dataDir, "out", "alpha.ui");
    expect(runSave(["alpha", saved])).toBe(0);
    expect(runLoad(["beta", saved])).toBe(0);

    const stored = readDocument(dataDir, "beta");
    expect(stored.ok).toBe(true);
    expect(serializeDocument(stored.ok ? stored.value.document : buildDocument())).toBe(serializeDocument(expected.ok ? expected.value.document : buildDocument()));
    expect(packageFiles(packageDirectory(dataDir, "beta"))).toEqual(packageFiles(saved));
  });

  it("overwrites an existing stored package", () => {
    expect(writeDocument(dataDir, "beta", 0, buildDocument()).ok).toBe(true);
    const source = storePackage("alpha");
    expect(runLoad(["beta", source])).toBe(0);
    expect(packageFiles(packageDirectory(dataDir, "beta"))).toEqual(packageFiles(source));
  });

  it("rejects an invalid slug and too many args with exit 1", () => {
    expect(runLoad(["Not-A-Slug"])).toBe(1);
    expect(runLoad(["alpha", "a.ui", "extra"])).toBe(1);
  });

  it("rejects a missing source with exit 1", () => {
    expect(runLoad(["beta", path.join(dataDir, "missing.ui")])).toBe(1);
  });

  it("refuses a garbage manifest and leaves the store untouched", () => {
    const garbage = path.join(dataDir, "garbage.ui");
    mkdirSync(garbage, { recursive: true });
    writeFileSync(path.join(garbage, "manifest.ui"), "not json");

    expect(runLoad(["beta", garbage])).toBe(1);
    expect(existsSync(packageDirectory(dataDir, "beta"))).toBe(false);
  });

  it("refuses a garbage document entry and leaves the store untouched", () => {
    const bad = path.join(dataDir, "bad.ui");
    mkdirSync(bad, { recursive: true });
    writeFileSync(path.join(bad, "manifest.ui"), serializeUiManifest({ format: "crafty.ui-package", formatVersion: 1, revision: 3, entries: { document: "document.ui" } }));
    writeFileSync(path.join(bad, "document.ui"), JSON.stringify({ format: "crafty.ui-document", document: { garbage: true } }));

    expect(runLoad(["beta", bad])).toBe(1);
    expect(existsSync(packageDirectory(dataDir, "beta"))).toBe(false);
  });

  it("refuses a package without a document entry", () => {
    const bare = path.join(dataDir, "bare.ui");
    mkdirSync(bare, { recursive: true });
    writeFileSync(path.join(bare, "manifest.ui"), serializeUiManifest({ format: "crafty.ui-package", formatVersion: 1, revision: 0, entries: {} }));

    expect(runLoad(["beta", bare])).toBe(1);
    expect(existsSync(packageDirectory(dataDir, "beta"))).toBe(false);
  });

  it("round-trips a directory copied with fs.cpSync", () => {
    const source = storePackage("alpha");
    const viaCopy = path.join(dataDir, "copy.ui");
    cpSync(source, viaCopy, { recursive: true });
    expect(runLoad(["beta", viaCopy])).toBe(0);
    expect(packageFiles(packageDirectory(dataDir, "beta"))).toEqual(packageFiles(source));
  });
});
