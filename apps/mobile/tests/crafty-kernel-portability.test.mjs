import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createEditorKernel, parseDocument } from "@crafty/editor/kernel";
import { runCraftyKernelPortabilityGate } from "../src/crafty/crafty-kernel-portability.ts";
import { createCraftyKernelFromUiPackage } from "../src/crafty/crafty-kernel-portability.ts";
import {
  loadCraftyUiPackage,
  saveCraftyUiPackage,
} from "../src/crafty/crafty-ui-persistence.ts";

const readFixture = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), "utf8");

const documentFromEntry = (entryBytes) => {
  const entry = JSON.parse(entryBytes);
  const parsed = parseDocument(JSON.stringify(entry.document));
  assert.equal(parsed.ok, true);
  return parsed.document;
};

test("Expo adapter runs the Crafty transaction gate with exact web byte parity", async () => {
  const [manifest, documentEntry, expectedEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
    readFixture("./fixtures/crafty-kernel-portability-redo.document.ui"),
  ]);

  const mobile = runCraftyKernelPortabilityGate({ documentEntry, manifest });
  const expectedBytes = createEditorKernel(
    documentFromEntry(expectedEntry),
  ).serialize();

  assert.equal(
    documentEntry.trimEnd(),
    `{"document":${mobile.initialBytes},"format":"crafty.ui-document"}`,
  );
  assert.equal(
    expectedEntry.trimEnd(),
    `{"document":${expectedBytes},"format":"crafty.ui-document"}`,
  );

  const webKernel = createEditorKernel(documentFromEntry(documentEntry));
  webKernel.beginTransaction("Move rectangle");
  webKernel.preview({
    type: "move-nodes",
    nodeIds: ["rectangle-portability"],
    delta: { dx: 24, dy: 16 },
  });
  webKernel.commit();

  assert.equal(mobile.cancelledBytes, mobile.initialBytes);
  assert.equal(mobile.undoneBytes, mobile.initialBytes);
  assert.equal(mobile.committedBytes, expectedBytes);
  assert.equal(mobile.redoneBytes, expectedBytes);
  assert.equal(mobile.redoneBytes, webKernel.serialize());
});

test("Expo adapter rejects unsupported .ui package versions", async () => {
  const documentEntry = await readFixture(
    "../assets/crafty-kernel-portability.ui/document-1.ui",
  );
  const manifest = JSON.stringify({
    entries: { document: "document-1.ui" },
    format: "crafty.ui-package",
    formatVersion: 99,
    revision: 1,
  });

  assert.throws(
    () => runCraftyKernelPortabilityGate({ documentEntry, manifest }),
    /UI_FORMAT_UNSUPPORTED/u,
  );
});

test("mobile persistence writes an immutable entry before publishing its manifest", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  const files = new Map([
    ["manifest.ui", manifest.trimEnd()],
    ["document-1.ui", documentEntry.trimEnd()],
  ]);
  const writes = [];
  const store = {
    readDocumentEntry: async (path) => files.get(path),
    readManifest: async () => files.get("manifest.ui"),
    writeImmutableDocument: async (path, bytes) => {
      assert.equal(files.has(path), false);
      writes.push(`entry:${path}`);
      files.set(path, bytes);
    },
    publishManifest: async (bytes) => {
      writes.push("manifest");
      files.set("manifest.ui", bytes);
    },
  };
  const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });
  kernel.dispatch(
    {
      delta: { dx: 12, dy: 8 },
      nodeIds: ["rectangle-portability"],
      type: "move-nodes",
    },
    "Move rectangle",
  );

  assert.deepEqual(await saveCraftyUiPackage(store, kernel, 1), {
    documentBytes: kernel.serialize(),
    revision: 2,
  });
  assert.deepEqual(writes, ["entry:document-2.ui", "manifest"]);
  assert.equal(
    files.get("document-2.ui"),
    `{"document":${kernel.serialize()},"format":"crafty.ui-document"}`,
  );
  const loaded = await loadCraftyUiPackage(store);
  assert.equal(loaded.documentEntry, files.get("document-2.ui"));
});

test("mobile persistence rejects stale publication without moving the commit point", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  let publishedManifest = manifest;
  let writes = 0;
  const store = {
    readDocumentEntry: async () => documentEntry,
    readManifest: async () => publishedManifest,
    writeImmutableDocument: async () => {
      writes += 1;
    },
    publishManifest: async (bytes) => {
      writes += 1;
      publishedManifest = bytes;
    },
  };
  const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });

  await assert.rejects(
    saveCraftyUiPackage(store, kernel, 0),
    /DOCUMENT_REVISION_STALE/u,
  );
  assert.equal(writes, 0);
  assert.equal(publishedManifest, manifest);
});

test("failed immutable entry write never publishes a new manifest", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  let publishedManifest = manifest;
  const store = {
    readDocumentEntry: async () => documentEntry,
    readManifest: async () => publishedManifest,
    writeImmutableDocument: async () => {
      throw new Error("WRITE_INTERRUPTED");
    },
    publishManifest: async (bytes) => {
      publishedManifest = bytes;
    },
  };
  const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });

  await assert.rejects(
    saveCraftyUiPackage(store, kernel, 1),
    /WRITE_INTERRUPTED/u,
  );
  assert.equal(publishedManifest, manifest);
});
