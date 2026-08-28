import { describe, expect, it } from "vitest";
import { applyDocumentCommand } from "./commands.js";
import { canonicalEditorDocumentString, createFoundationDocument, loadEditorDocument, migrateDocument, v1ToV2DocumentMigration, v2ToV3DocumentMigration, v3ToV4DocumentMigration } from "./document.js";
import { createSeedScene } from "@crafty/scene-model";
import { sceneToEditorDocument } from "./scene-adapter.js";
import { CanvasEditor } from "../ui/editor/harness.js";
import { sceneToRenderFrame } from "@crafty/scene-renderer";

const glassFill = { kind: "glass", blurRadius: 1, tint: "#ffffff", tintOpacity: 1, saturation: 1 };
const sourceV4 = (): Record<string, unknown> => v3ToV4DocumentMigration.apply(v2ToV3DocumentMigration.apply(v1ToV2DocumentMigration.apply(sceneToEditorDocument(createSeedScene())).document).document).document as Record<string, unknown>;
const setText = (document: Record<string, unknown>, nodeId: string, value: unknown): void => {
  const nodes = document.nodes as Record<string, Record<string, unknown>>;
  nodes[nodeId] = { ...nodes[nodeId]!, text: value };
};

describe("schema v5 acceptance", () => {
  it("uses schema v5", () => {
    expect(createFoundationDocument().schemaVersion).toBe(5);
  });

  it("rejects malformed JSON text on a valid text kind", () => {
    for (const value of [1, true, null, [], {}, glassFill]) {
      const document = structuredClone(createFoundationDocument()) as unknown as Record<string, unknown>;
      setText(document, "text-foundation", value);
      const bytes = JSON.stringify(document);
      const result = loadEditorDocument(bytes);
      expect(result.ok).toBe(false);
      expect(result.diagnostics.map((entry) => entry.code)).toEqual(["DOCUMENT_TEXT_VALUE_INVALID"]);
      expect(JSON.stringify(document)).toBe(bytes);
    }
  });

  it("gives malformed value precedence over invalid kind", () => {
    const document = structuredClone(createFoundationDocument()) as unknown as Record<string, unknown>;
    setText(document, "rectangle-foundation", glassFill);
    const result = loadEditorDocument(JSON.stringify(document));
    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((entry) => entry.code)).toEqual(["DOCUMENT_TEXT_VALUE_INVALID"]);
  });

  it("migrates absent v4 text to canonical empty content", () => {
    const source = sourceV4();
    const nodes = source.nodes as Record<string, Record<string, unknown>>;
    delete nodes["layer-title"]!.text;
    const migrated = migrateDocument(source);
    expect(migrated.ok).toBe(true);
    expect(migrated.applied).toContain("v4-to-v5-require-text-content");
    expect(migrated.document!.nodes["layer-title"]!.text).toBe("");
  });

  it("preserves canonical empty content through the first replacement inverse", () => {
    const source = sourceV4();
    const nodes = source.nodes as Record<string, Record<string, unknown>>;
    delete nodes["layer-title"]!.text;
    const migrated = migrateDocument(source);
    expect(migrated.ok).toBe(true);
    const replacement = applyDocumentCommand(migrated.document!, { type: "set-property", nodeId: "layer-title", property: "text", value: "replacement" });
    expect(applyDocumentCommand(replacement.document, replacement.inverse).document.nodes["layer-title"]!.text).toBe("");
  });

  it("persists canonical v5 bytes", () => {
    const source = sourceV4();
    const nodes = source.nodes as Record<string, Record<string, unknown>>;
    delete nodes["layer-title"]!.text;
    const migrated = migrateDocument(source);
    expect(migrated.ok).toBe(true);
    const bytes = canonicalEditorDocumentString(migrated.document!);
    expect(JSON.parse(bytes).schemaVersion).toBe(5);
    expect(canonicalEditorDocumentString(loadEditorDocument(bytes).document!)).toBe(bytes);
  });

  it("excludes malformed input from the packet boundary", () => {
    const malformed = structuredClone(createFoundationDocument()) as unknown as Record<string, unknown>;
    setText(malformed, "text-foundation", glassFill);
    let packetBuilds = 0;
    expect(() => {
      const editor = new CanvasEditor(malformed as never, 0);
      packetBuilds += 1;
      sceneToRenderFrame(editor.getSnapshot().scene, "frame-home", { panX: 0, panY: 0, zoom: 1, width: 1, height: 1, pixelRatio: 1 });
    }).toThrow();
    expect(packetBuilds).toBe(0);
  });
});
