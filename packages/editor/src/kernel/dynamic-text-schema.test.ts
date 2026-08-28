import { describe, expect, it } from "vitest";
import { applyDocumentCommand, type DocumentCommand } from "./commands.js";
import {
  canonicalEditorDocumentString,
  createFoundationDocument,
  EDITOR_DOCUMENT_SCHEMA_V1,
  EDITOR_DOCUMENT_SCHEMA_V2,
  EDITOR_DOCUMENT_SCHEMA_V3,
  loadEditorDocument,
  migrateDocument,
  type DocumentNode,
  type EditorDocument,
  type EditorDocumentV1,
  type EditorDocumentV2,
  type EditorDocumentV3,
  type EditorDocumentV4,
  type ValidationResult,
  validateEditorDocument,
  validateEditorDocumentV1,
  validateEditorDocumentV2,
  validateEditorDocumentV3,
  validateEditorDocumentV4,
  v1ToV2DocumentMigration,
  v2ToV3DocumentMigration,
  v3ToV4DocumentMigration,
} from "./document.js";
import { createEditorKernel } from "./kernel.js";
import { createSeedScene } from "@crafty/scene-model";
import { sceneToEditorDocument } from "./scene-adapter.js";
import { CanvasEditor } from "../ui/editor/harness.js";
import { sceneToRenderFrame } from "@crafty/scene-renderer";

const glassFill = { kind: "glass", blurRadius: 1, tint: "#ffffff", tintOpacity: 1, saturation: 1 };
const jsonNonStrings = [1, true, null, [], {}, glassFill] as const;
const runtimeNonStrings = [...jsonNonStrings, undefined, () => undefined, Symbol("text"), 1n] as const;

const sourceAt = (version: 1 | 2 | 3 | 4): Record<string, unknown> => {
  const v1 = sceneToEditorDocument(createSeedScene());
  if (version === 1) return v1 as unknown as Record<string, unknown>;
  const v2 = v1ToV2DocumentMigration.apply(v1).document;
  if (version === 2) return v2 as Record<string, unknown>;
  const v3 = v2ToV3DocumentMigration.apply(v2).document;
  if (version === 3) return v3 as Record<string, unknown>;
  return v3ToV4DocumentMigration.apply(v3).document as Record<string, unknown>;
};

const setText = (document: Record<string, unknown>, nodeId: string, value: unknown): void => {
  const nodes = document.nodes as Record<string, Record<string, unknown>>;
  nodes[nodeId] = { ...nodes[nodeId]!, text: value };
};

describe("dynamic text schema v5 prerequisite", () => {
  it("rejects every JSON non-string text value at the current deserialization ingress without normalizing the source", () => {
    for (const value of jsonNonStrings) {
      const document = structuredClone(createFoundationDocument()) as unknown as Record<string, unknown>;
      setText(document, "rectangle-foundation", value);
      const serialized = JSON.stringify(document);
      const result = loadEditorDocument(serialized);
      expect(result.ok).toBe(false);
      expect(result.diagnostics.map((entry) => entry.code)).toEqual(["DOCUMENT_TEXT_VALUE_INVALID"]);
      expect(serialized).toBe(JSON.stringify(document));
    }
    const wrongKind = structuredClone(createFoundationDocument()) as unknown as Record<string, unknown>;
    setText(wrongKind, "rectangle-foundation", "wrong kind");
    const wrongKindResult = loadEditorDocument(JSON.stringify(wrongKind));
    expect(wrongKindResult.ok).toBe(false);
    expect(wrongKindResult.diagnostics.map((entry) => entry.code)).toEqual(["DOCUMENT_TEXT_KIND_INVALID"]);
  });

  it("rejects every JSON non-string text value on the current valid text kind", () => {
    for (const value of jsonNonStrings) {
      const document = structuredClone(createFoundationDocument()) as unknown as Record<string, unknown>;
      setText(document, "text-foundation", value);
      const serialized = JSON.stringify(document);
      const result = loadEditorDocument(serialized);
      expect(result.ok).toBe(false);
      expect(result.diagnostics.map((entry) => entry.code)).toEqual(["DOCUMENT_TEXT_VALUE_INVALID"]);
      expect(result.document).toBeUndefined();
      expect(JSON.stringify(document)).toBe(serialized);
    }
  });

  it("rejects every JSON non-string text value before every source migration", () => {
    const validators = [validateEditorDocumentV1, validateEditorDocumentV2, validateEditorDocumentV3, validateEditorDocumentV4] as const;
    for (const [index, version] of ([EDITOR_DOCUMENT_SCHEMA_V1, EDITOR_DOCUMENT_SCHEMA_V2, EDITOR_DOCUMENT_SCHEMA_V3, 4] as const).entries()) {
      for (const value of jsonNonStrings) {
        const document = structuredClone(sourceAt(version));
        setText(document, "layer-title", value);
        const result = migrateDocument(document);
        expect(result.ok).toBe(false);
        expect(result.applied).toEqual([]);
        expect(result.diagnostics.map((entry) => entry.code)).toEqual(["DOCUMENT_TEXT_VALUE_INVALID"]);
        const direct = validators[index]!(document);
        expect(direct.ok).toBe(false);
        expect(direct.diagnostics.map((entry) => entry.code)).toEqual(["DOCUMENT_TEXT_VALUE_INVALID"]);
      }
    }
  });

  it("rejects wrong-kind strings and gives combined value defects precedence at every known source version", () => {
    for (const version of [EDITOR_DOCUMENT_SCHEMA_V1, EDITOR_DOCUMENT_SCHEMA_V2, EDITOR_DOCUMENT_SCHEMA_V3, 4] as const) {
      const wrongKind = structuredClone(sourceAt(version));
      setText(wrongKind, "page-root-frame-home", "wrong kind");
      const wrongKindResult = migrateDocument(wrongKind);
      expect(wrongKindResult.ok).toBe(false);
      expect(wrongKindResult.applied).toEqual([]);
      expect(wrongKindResult.diagnostics.map((entry) => entry.code)).toEqual(["DOCUMENT_TEXT_KIND_INVALID"]);

      for (const value of jsonNonStrings) {
        const bothInvalid = structuredClone(sourceAt(version));
        setText(bothInvalid, "page-root-frame-home", value);
        const bothInvalidResult = migrateDocument(bothInvalid);
        expect(bothInvalidResult.ok).toBe(false);
        expect(bothInvalidResult.applied).toEqual([]);
        expect(bothInvalidResult.diagnostics.map((entry) => entry.code)).toEqual(["DOCUMENT_TEXT_VALUE_INVALID"]);
      }
    }
  });

  it("migrates valid v4 absence to canonical empty text, preserves strings, and keeps save/reopen bytes stable", () => {
    const absent = structuredClone(sourceAt(4));
    const nodes = absent.nodes as Record<string, Record<string, unknown>>;
    nodes["layer-title"] = { ...nodes["layer-title"]! };
    delete nodes["layer-title"]!.text;
    const migrated = migrateDocument(absent);
    expect(migrated.ok).toBe(true);
    expect(migrated.applied).toEqual(["v4-to-v5-require-text-content"]);
    expect(migrated.document!.nodes["layer-title"]!.text).toBe("");
    const bytes = canonicalEditorDocumentString(migrated.document!);
    const reopened = loadEditorDocument(bytes);
    expect(reopened.ok).toBe(true);
    expect(reopened.applied).toEqual([]);
    expect(canonicalEditorDocumentString(reopened.document!)).toBe(bytes);

    const present = migrateDocument(sourceAt(4));
    expect(present.ok).toBe(true);
    expect(present.document!.nodes["layer-title"]!.text).toBe("Design the state");
  });

  it("uses every ordered migration step, rejects v5 absence and unsupported versions without migration", () => {
    const v1 = sourceAt(1);
    const migrated = migrateDocument(v1);
    expect(migrated.ok).toBe(true);
    expect(migrated.applied).toEqual([
      "v1-to-v2-add-page-canvas",
      "v2-to-v3-add-path-kind",
      "v3-to-v4-add-semantic-surfaces",
      "v4-to-v5-require-text-content",
    ]);

    const absentCurrent = structuredClone(createFoundationDocument()) as unknown as Record<string, unknown>;
    delete (absentCurrent.nodes as Record<string, Record<string, unknown>>)["text-foundation"]!.text;
    const currentResult = migrateDocument(absentCurrent);
    expect(currentResult.ok).toBe(false);
    expect(currentResult.diagnostics.map((entry) => entry.code)).toEqual(["DOCUMENT_TEXT_VALUE_INVALID"]);

    const unknown = migrateDocument({ schemaVersion: 99 });
    expect(unknown.ok).toBe(false);
    expect(unknown.applied).toEqual([]);
    expect(unknown.diagnostics.map((entry) => entry.code)).toEqual(["DOCUMENT_UNSUPPORTED_SCHEMA"]);
  });

  it("accepts only strings statically for text commands", () => {
    const valid: DocumentCommand = { type: "set-property", nodeId: "text-foundation", property: "text", value: "valid" };
    expect(valid.value).toBe("valid");
    // @ts-expect-error Text commands accept strings only.
    const invalid: DocumentCommand = { type: "set-property", nodeId: "text-foundation", property: "text", value: 1 };
    expect(invalid).toBeDefined();
  });

  it("keeps each historical validator at its historical schema type until migration", () => {
    const v1: ValidationResult<EditorDocumentV1> = validateEditorDocumentV1(sourceAt(1));
    const v2: ValidationResult<EditorDocumentV2> = validateEditorDocumentV2(sourceAt(2));
    const v3: ValidationResult<EditorDocumentV3> = validateEditorDocumentV3(sourceAt(3));
    const v4: ValidationResult<EditorDocumentV4> = validateEditorDocumentV4(sourceAt(4));
    for (const historical of [v1, v2, v3, v4]) {
      if (!historical.ok) continue;
      // @ts-expect-error Historical validation does not make a document canonical v5.
      const current: EditorDocument = historical.value;
      expect(current).toBeDefined();
    }
  });

  it("rejects every listed non-string class in current typed APIs", () => {
    type TextValue = Extract<DocumentNode, { kind: "text" }>["text"];
    type TextCommand = Extract<DocumentCommand, { type: "set-property"; property: "text" }>;
    // @ts-expect-error number is not authored text.
    const number: TextValue = 1;
    // @ts-expect-error boolean is not authored text.
    const boolean: TextValue = true;
    // @ts-expect-error null is not authored text.
    const nil: TextValue = null;
    // @ts-expect-error array is not authored text.
    const array: TextValue = [];
    // @ts-expect-error plain object is not authored text.
    const object: TextValue = {};
    // @ts-expect-error GlassFill is not authored text.
    const glass: TextValue = glassFill;
    // @ts-expect-error undefined is not authored text under exact optional properties.
    const absent: TextValue = undefined;
    // @ts-expect-error function is not authored text.
    const fn: TextValue = () => undefined;
    // @ts-expect-error symbol is not authored text.
    const symbol: TextValue = Symbol("text");
    // @ts-expect-error bigint is not authored text.
    const bigint: TextValue = 1n;
    // @ts-expect-error number is not a text command value.
    const numberCommand: TextCommand = { type: "set-property", nodeId: "text-foundation", property: "text", value: 1 };
    // @ts-expect-error boolean is not a text command value.
    const booleanCommand: TextCommand = { type: "set-property", nodeId: "text-foundation", property: "text", value: true };
    // @ts-expect-error null is not a text command value.
    const nullCommand: TextCommand = { type: "set-property", nodeId: "text-foundation", property: "text", value: null };
    // @ts-expect-error array is not a text command value.
    const arrayCommand: TextCommand = { type: "set-property", nodeId: "text-foundation", property: "text", value: [] };
    // @ts-expect-error plain object is not a text command value.
    const objectCommand: TextCommand = { type: "set-property", nodeId: "text-foundation", property: "text", value: {} };
    // @ts-expect-error GlassFill is not a text command value.
    const glassCommand: TextCommand = { type: "set-property", nodeId: "text-foundation", property: "text", value: glassFill };
    expect([number, boolean, nil, array, object, glass, absent, fn, symbol, bigint, numberCommand, booleanCommand, nullCommand, arrayCommand, objectCommand, glassCommand]).toHaveLength(16);
  });

  it("rejects every runtime non-string text bypass before mutation while preserving populated undo and redo history", () => {
    for (const nodeId of ["text-foundation", "rectangle-foundation"] as const) {
      for (const value of runtimeNonStrings) {
        const kernel = createEditorKernel(createFoundationDocument());
        kernel.dispatch({ type: "set-property", nodeId: "text-foundation", property: "text", value: "first replacement" });
        kernel.dispatch({ type: "set-property", nodeId: "text-foundation", property: "text", value: "second replacement" });
        kernel.dispatch({ type: "set-property", nodeId: "text-foundation", property: "text", value: "third replacement" });
        expect(kernel.undo()).toBe(true);
        const bytes = kernel.serialize();
        const revision = kernel.getState().documentRevision;
        const projection = kernel.getProjection();
        const command = { type: "set-property", nodeId, property: "text", value } as unknown as DocumentCommand;
        expect(() => kernel.dispatch(command)).toThrow("DOCUMENT_TEXT_VALUE_INVALID");
        expect(kernel.serialize()).toBe(bytes);
        expect(kernel.getState().documentRevision).toBe(revision);
        expect(kernel.getProjection()).toEqual(projection);
        expect(kernel.getHistoryDepths()).toEqual({ undo: 2, redo: 1 });
        expect(kernel.canUndo()).toBe(true);
        expect(kernel.canRedo()).toBe(true);
        expect(kernel.undo()).toBe(true);
        expect(kernel.undo()).toBe(true);
        expect(kernel.canUndo()).toBe(false);
        expect(kernel.redo()).toBe(true);
        expect(kernel.redo()).toBe(true);
        expect(kernel.redo()).toBe(true);
        expect(kernel.canRedo()).toBe(false);
        expect(kernel.getDocument().nodes["text-foundation"]!.text).toBe("third replacement");
        expect(kernel.undo()).toBe(true);
      }
    }

    const v4 = structuredClone(sourceAt(4));
    delete ((v4.nodes as Record<string, Record<string, unknown>>)["layer-title"]!).text;
    const kernel = createEditorKernel(v4 as never);
    kernel.dispatch({ type: "set-property", nodeId: "layer-title", property: "text", value: "replacement" });
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().nodes["layer-title"]!.text).toBe("");
  });

  it("rejects a valid string on an invalid node kind without mutating the kernel", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const bytes = kernel.serialize();
    expect(() => kernel.dispatch({ type: "set-property", nodeId: "rectangle-foundation", property: "text", value: "invalid kind" })).toThrow("DOCUMENT_TEXT_KIND_INVALID");
    expect(kernel.serialize()).toBe(bytes);
    expect(kernel.getState().documentRevision).toBe(0);
  });

  it("keeps combined invalid kind/value command rejections out of the renderer packet boundary", () => {
    for (const value of runtimeNonStrings) {
      const malformed = structuredClone(createFoundationDocument()) as unknown as Record<string, unknown>;
      setText(malformed, "rectangle-foundation", value);
      let packetBuilds = 0;
      expect(() => {
        const editor = new CanvasEditor(malformed as never, 0);
        packetBuilds += 1;
        sceneToRenderFrame(editor.getSnapshot().scene, "frame-home", { panX: 0, panY: 0, zoom: 1, width: 1, height: 1, pixelRatio: 1 });
      }).toThrow("Text must be a string.");
      expect(packetBuilds).toBe(0);
    }
  });

  it("keeps whole string replacements invertible and honest", () => {
    const initial = createFoundationDocument();
    const changed = applyDocumentCommand(initial, { type: "set-property", nodeId: "text-foundation", property: "text", value: "replacement" });
    expect(applyDocumentCommand(changed.document, changed.inverse).document).toEqual(initial);
    expect(applyDocumentCommand(initial, { type: "set-property", nodeId: "text-foundation", property: "text", value: "Resolve authored state" }).changed).toBe(false);
  });
});
