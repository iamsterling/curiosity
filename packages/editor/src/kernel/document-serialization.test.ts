import { describe, expect, it } from "vitest";

import { createEditorKernel, createFoundationDocument, parseDocument, sceneToEditorDocument, serializeDocument } from "./index.js";
import { createSeedScene } from "@crafty/scene-model";
import { canonicalEditorDocumentString, migrateDocument, type EditorDocument } from "./document.js";

describe("document serialization facade", () => {
  it("serializes byte-stably and identically to the canonical form", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const document = kernel.getDocument();
    const first = serializeDocument(document);
    const second = serializeDocument(document);
    expect(first).toBe(second);
    expect(first).toBe(canonicalEditorDocumentString(document));
  });

  it("parses a current-version document without migration steps", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const parsed = parseDocument(kernel.serialize());
    expect(parsed.ok).toBe(true);
    expect(parsed.applied).toEqual([]);
    expect(canonicalEditorDocumentString(parsed.document!)).toBe(kernel.serialize());
  });

  it("migrates a v1 document through the chain and records every step", () => {
    const v1 = sceneToEditorDocument(createSeedScene());
    expect((v1 as { schemaVersion: number }).schemaVersion).toBe(1);
    const parsed = parseDocument(JSON.stringify(v1));
    expect(parsed.ok).toBe(true);
    expect(parsed.applied).toEqual(["v1-to-v2-add-page-canvas", "v2-to-v3-add-path-kind", "v3-to-v4-add-semantic-surfaces", "v4-to-v5-require-text-content"]);
    expect(parsed.document!.schemaVersion).toBe(5);
    expect(canonicalEditorDocumentString(parsed.document!)).toBe(canonicalEditorDocumentString(migrateDocument(v1).document!));
  });

  it("rejects unknown schema versions with DOCUMENT_UNSUPPORTED_SCHEMA, never coerced", () => {
    const parsed = parseDocument(JSON.stringify({ schemaVersion: 99, id: "doc-unknown" }));
    expect(parsed.ok).toBe(false);
    expect(parsed.diagnostics[0]?.code).toBe("DOCUMENT_UNSUPPORTED_SCHEMA");
  });

  it("rejects corrupt JSON", () => {
    const parsed = parseDocument("{not json");
    expect(parsed.ok).toBe(false);
    expect(parsed.diagnostics[0]?.code).toBe("DOCUMENT_INVALID");
  });

  it("serialization throws on an invalid document rather than writing it", () => {
    const invalid = structuredClone(createFoundationDocument()) as EditorDocument;
    (invalid.nodes["page-root-home"] as { childIds: string[] }).childIds = [];
    (invalid.nodes["frame-foundation"] as { parentId: string }).parentId = "rectangle-foundation";
    (invalid.nodes["rectangle-foundation"] as { parentId: string }).parentId = "frame-foundation";
    (invalid.nodes["rectangle-foundation"] as { childIds: string[] }).childIds = ["frame-foundation"];
    expect(() => serializeDocument(invalid)).toThrow("EDITOR_DOCUMENT_INVALID");
  });
});
