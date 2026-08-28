import { describe, expect, it } from "vitest";
import { applyDocumentCommand } from "./commands.js";
import { canonicalEditorDocumentString, createFoundationDocument, type DocumentNode, type GlassFill, type PathGeometry, isGlassFill } from "./document.js";
import { parseDocument, serializeDocument } from "./document-serialization.js";
import { createEditorKernel } from "./kernel.js";
import { ORDER_KEY_STEP, orderKeyForSigned } from "./path-geometry.js";
import { editorDocumentToScene, projectGlassRecords } from "./scene-adapter.js";
import { parseClipboardPayload, serializeClipboardPayload, validateClipboardContent } from "./clipboard.js";

/**
 * Glass fills (the `glass-fills` change, sections 1–2): the authored model
 * (fill union, validation codes, commands, clipboard, canonical bytes) and
 * the renderer projection (glass records with encoder-mirroring order; the
 * scene projection renders glass nodes with opacity 0).
 */

const glass = (overrides: Partial<GlassFill> = {}): GlassFill => ({
  kind: "glass",
  blurRadius: 24,
  tint: "#ffffff",
  tintOpacity: 0.6,
  saturation: 1.4,
  refraction: 0.15,
  ...overrides,
});

const makeKernel = () => createEditorKernel(createFoundationDocument());

describe("glass fill model", () => {
  it("applies a glass fill to a rectangle and restores the previous fill on undo", () => {
    const kernel = makeKernel();
    kernel.dispatch({ type: "set-property", nodeId: "rectangle-foundation", property: "fill", value: glass() }, "Glass fill");
    const node = kernel.getDocument().nodes["rectangle-foundation"]!;
    expect(isGlassFill(node.fill)).toBe(true);
    expect((node.fill as GlassFill).blurRadius).toBe(24);
    kernel.undo();
    expect(kernel.getDocument().nodes["rectangle-foundation"]!.fill).toBe("#40d6c7");
  });

  it("rejects each invalid glass field with its machine code", () => {
    const kernel = makeKernel();
    const cases: Array<[object, string]> = [
      [{ kind: "solid" }, "FILL_GLASS_INVALID:kind"],
      [{ blurRadius: -4 }, "FILL_GLASS_INVALID:blurRadius"],
      [{ blurRadius: Number.NaN }, "FILL_GLASS_INVALID:blurRadius"],
      [{ tint: "red" }, "FILL_GLASS_INVALID:tint"],
      [{ tint: "#fffff" }, "FILL_GLASS_INVALID:tint"],
      [{ tintOpacity: 1.5 }, "FILL_GLASS_INVALID:tintOpacity"],
      [{ tintOpacity: -0.1 }, "FILL_GLASS_INVALID:tintOpacity"],
      [{ saturation: -1 }, "FILL_GLASS_INVALID:saturation"],
      [{ refraction: 2 }, "FILL_GLASS_INVALID:refraction"],
    ];
    for (const [patch, code] of cases) {
      const value = { ...glass(), ...patch } as unknown as GlassFill;
      expect(() => kernel.dispatch({ type: "set-property", nodeId: "rectangle-foundation", property: "fill", value }, "Glass")).toThrow(code);
    }
    expect(isGlassFill(kernel.getDocument().nodes["rectangle-foundation"]!.fill)).toBe(false);
  });

  it("accepts glass on rectangles and frames, refuses it on text and paths", () => {
    const kernel = makeKernel();
    kernel.dispatch({ type: "set-property", nodeId: "rectangle-foundation", property: "fill", value: glass() }, "Glass rect");
    kernel.dispatch({ type: "set-property", nodeId: "frame-foundation", property: "fill", value: glass() }, "Glass frame");
    expect(isGlassFill(kernel.getDocument().nodes["frame-foundation"]!.fill)).toBe(true);
    expect(() => kernel.dispatch({ type: "set-property", nodeId: "text-foundation", property: "fill", value: glass() }, "Glass text")).toThrow("FILL_GLASS_GEOMETRY_UNSUPPORTED");
    expect(kernel.getDocument().nodes["text-foundation"]!.fill).toBe("#eef4ff");

    const geometry: PathGeometry = {
      points: {
        p0: { id: "p0", subpathId: "s1", order: orderKeyForSigned(0 * ORDER_KEY_STEP), x: 0, y: 0, handleMode: "corner" },
        p1: { id: "p1", subpathId: "s1", order: orderKeyForSigned(1 * ORDER_KEY_STEP), x: 100, y: 0, handleMode: "corner" },
      },
      subpaths: { s1: { id: "s1", closed: false } },
      fillRule: "nonzero",
    };
    const pathNode: DocumentNode = {
      id: "path-foundation", kind: "path", name: "Curve", parentId: "frame-foundation", childIds: [],
      bounds: { x: 0, y: 0, width: 100, height: 0 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 4, path: geometry,
    };
    kernel.dispatch({ type: "create-node", node: pathNode }, "Create path");
    expect(() => kernel.dispatch({ type: "set-property", nodeId: "path-foundation", property: "fill", value: glass() }, "Glass path")).toThrow("FILL_GLASS_GEOMETRY_UNSUPPORTED");
    expect(kernel.getDocument().nodes["path-foundation"]!.fill).toBe("#ffffff");
  });

  it("refuses object values for any property other than fill", () => {
    const kernel = makeKernel();
    expect(() => kernel.dispatch({ type: "set-property", nodeId: "rectangle-foundation", property: "stroke", value: glass() }, "Glass stroke")).toThrow("DOCUMENT_PROPERTY_VALUE_INVALID:stroke");
    expect(kernel.getDocument().nodes["rectangle-foundation"]!.stroke).toBe("#b4fff5");
  });

  it("treats re-applying an identical glass fill as a no-op", () => {
    const document = createFoundationDocument();
    const command = { type: "set-property", nodeId: "rectangle-foundation", property: "fill", value: glass() } as const;
    const first = applyDocumentCommand(document, command);
    const second = applyDocumentCommand(first.document, command);
    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
  });

  it("serializes canonically and round-trips byte-identically", () => {
    const kernel = makeKernel();
    kernel.dispatch({ type: "set-property", nodeId: "rectangle-foundation", property: "fill", value: glass() }, "Glass");
    const serialized = serializeDocument(kernel.getDocument());
    expect(serialized).toContain('"blurRadius":24,"kind":"glass","refraction":0.15,"saturation":1.4,"tint":"#ffffff","tintOpacity":0.6');
    const parsed = parseDocument(serialized);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(serializeDocument(parsed.document!)).toBe(serialized);
    expect(canonicalEditorDocumentString(kernel.getDocument())).toBe(canonicalEditorDocumentString(parsed.document!));
  });
});

describe("glass fills through the clipboard", () => {
  it("carries glass fills through copy, serialization and paste", () => {
    const kernel = makeKernel();
    kernel.dispatch({ type: "set-property", nodeId: "rectangle-foundation", property: "fill", value: glass({ saturation: 0.9 }) }, "Glass");
    kernel.setSelection(["rectangle-foundation"]);
    const content = kernel.copySelection();
    expect(content).toBeDefined();
    expect(isGlassFill(content!.nodes[0]!.fill)).toBe(true);

    const wire = serializeClipboardPayload(content!);
    const parsed = parseClipboardPayload(wire);
    expect(parsed).toBeDefined();
    expect(validateClipboardContent(parsed!)).toBe(true);

    const pasted = kernel.paste(parsed, { x: 400, y: 300 });
    const mintedId = pasted?.mintedRootIds[0];
    expect(mintedId).toBeDefined();
    const minted = kernel.getDocument().nodes[mintedId!]!;
    expect(isGlassFill(minted.fill)).toBe(true);
    expect((minted.fill as GlassFill).saturation).toBe(0.9);
  });

  it("rejects a foreign clipboard payload with a malformed glass fill", () => {
    const kernel = makeKernel();
    kernel.setSelection(["rectangle-foundation"]);
    const content = kernel.copySelection();
    const corrupted = JSON.parse(JSON.stringify(content!)) as { nodes: Array<{ fill: unknown }> };
    corrupted.nodes[0]!.fill = { kind: "glass", blurRadius: -1, tint: "#ffffff", tintOpacity: 0.5, saturation: 1 };
    expect(validateClipboardContent(corrupted)).toBe(false);
  });
});

describe("glass renderer projection", () => {
  it("projects glass records with encoder-mirroring order and authored params", () => {
    const document = createFoundationDocument();
    document.nodes["rectangle-foundation"]!.fill = glass();
    document.nodes["rectangle-foundation"]!.transform = { a: 1, b: 0, c: 0, d: 1, e: 20, f: 40 };
    document.nodes["rectangle-foundation"]!.opacity = 0.5;
    const frameFill = glass();
    delete frameFill.refraction;
    document.nodes["frame-foundation"]!.fill = frameFill;
    const records = projectGlassRecords(document);
    expect(records.map((record) => record.nodeId)).toEqual(["frame-foundation", "rectangle-foundation"]);
    expect(records[0]).toMatchObject({ nodeId: "frame-foundation", order: 1, zIndex: 1, blurRadius: 24, tint: "#ffffff", tintOpacity: 0.6, saturation: 1.4, refraction: 0 });
    expect(records[1]).toMatchObject({ nodeId: "rectangle-foundation", order: 2, zIndex: 1, opacity: 0.5, refraction: 0.15 });
    expect(records[1]!.transform).toEqual({ a: 1, b: 0, c: 0, d: 1, e: 20, f: 40 });
  });

  it("composes ancestor transforms into the record's world transform", () => {
    const document = createFoundationDocument();
    document.nodes["frame-foundation"]!.transform = { a: 2, b: 0, c: 0, d: 1, e: 100, f: 50 };
    document.nodes["rectangle-foundation"]!.fill = glass();
    document.nodes["rectangle-foundation"]!.transform = { a: 1, b: 0, c: 0, d: 1, e: 20, f: 40 };
    const [record] = projectGlassRecords(document);
    // world = frame(×2, +100/+50) ∘ rect(+20/+40) → e = 2×20 + 100 = 140, f = 50 + 40 = 90
    expect(record).toMatchObject({ nodeId: "rectangle-foundation", transform: { a: 2, b: 0, c: 0, d: 1, e: 140, f: 90 } });
  });

  it("skips invisible nodes and keeps their order slots occupied", () => {
    const document = createFoundationDocument();
    document.nodes["text-foundation"]!.visible = false;
    document.nodes["rectangle-foundation"]!.fill = glass();
    document.nodes["rectangle-foundation"]!.visible = false;
    document.nodes["frame-foundation"]!.fill = glass();
    const records = projectGlassRecords(document);
    // frame-foundation is the only visible glass node; the rectangle and the
    // hidden text occupy no slots of their own, so the frame keeps order 1.
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ nodeId: "frame-foundation", order: 1 });
  });

  it("projects glass nodes into the legacy Scene with opacity 0 and the tint hex", () => {
    const document = createFoundationDocument();
    document.nodes["rectangle-foundation"]!.fill = glass();
    document.nodes["frame-foundation"]!.fill = glass();
    const scene = editorDocumentToScene(document, 1);
    const frame = scene.frames[0]!;
    const frameLayer = frame.layers.find((layer) => layer.id === "frame-foundation")!;
    expect(frameLayer.opacity).toBe(0);
    expect(frameLayer.fill).toBe("#ffffff");
    expect(frameLayer.children).toHaveLength(2);
    const rectLayer = frame.layers.flatMap((layer) => layer.children ?? []).find((layer) => layer.id === "rectangle-foundation")!;
    expect(rectLayer.opacity).toBe(0);
    expect(rectLayer.fill).toBe("#ffffff");
  });
});
