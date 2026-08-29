import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createEditorKernel,
  parseDocument,
} from "../../../vendor/crafty/packages/editor/dist/kernel/index.js";

const readDocumentEntry = async (relativePath) => {
  const bytes = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const entry = JSON.parse(bytes);
  const parsed = parseDocument(JSON.stringify(entry.document));
  assert.equal(parsed.ok, true);
  return parsed.document;
};

test("built web Crafty emits the committed iPad fixture bytes", async () => {
  const [initialDocument, expectedDocument] = await Promise.all([
    readDocumentEntry("../assets/crafty-kernel-portability.ui/document-1.ui"),
    readDocumentEntry("./fixtures/crafty-kernel-portability-redo.document.ui"),
  ]);
  const webKernel = createEditorKernel(initialDocument);

  webKernel.beginTransaction("Move rectangle");
  webKernel.preview({
    type: "move-nodes",
    nodeIds: ["rectangle-portability"],
    delta: { dx: 24, dy: 16 },
  });
  webKernel.commit();

  assert.equal(
    webKernel.serialize(),
    createEditorKernel(expectedDocument).serialize(),
  );
});
