import { describe, expect, test } from "vitest";
import { applyDocumentCommand } from "./commands.js";
import { canonicalEditorDocumentString, createFoundationDocument, validateEditorDocument, type ComponentDefinition, type DocumentNode } from "./document.js";
import { resolveScene } from "./component-resolution.js";
import { createEditorKernel } from "./kernel.js";
import { editorDocumentToScene } from "./scene-adapter.js";

const instanceNode = (id: string, parentId: string): DocumentNode => ({ id, kind: "frame", name: id, parentId, childIds: [], bounds: { x: 20, y: 20, width: 120, height: 80 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, visible: true, locked: false, opacity: 1, fill: "#202531", stroke: "#566078", cornerRadius: 0, zIndex: 4 });
const definition = (id: string): ComponentDefinition => ({ id, name: "Card", rootNodeId: "frame-foundation", propertyDefinitions: { label: { type: "text", defaultValue: "Default" } }, variants: {}, states: {} });

describe("component resolution foundation", () => {
  test("expands a linked local instance with deterministic provenance and override", () => {
    let document = createFoundationDocument();
    document = applyDocumentCommand(document, { type: "create-component-definition", definition: definition("component-card") }).document;
    document = applyDocumentCommand(document, { type: "create-component-instance", instanceId: "instance-card", node: instanceNode("instance-card", "page-root-home"), instance: { definitionId: "component-card", properties: { label: "Default" }, overrides: { "rectangle-foundation": { opacity: 0.4 } } } }).document;
    const before = canonicalEditorDocumentString(document);
    const first = resolveScene(document, { pageId: "page-home" });
    const second = resolveScene(document, { pageId: "page-home" });
    expect(canonicalEditorDocumentString(document)).toBe(before);
    expect(first).toEqual(second);
    const rectangle = Object.values(first.nodes).find((node) => node.provenance.instanceId === "instance-card" && node.provenance.definitionNodeId === "rectangle-foundation");
    expect(rectangle?.opacity).toBe(0.4);
    expect(rectangle?.provenance.instancePath).toEqual(["instance-card"]);
  });

  test("rejects a transitive component cycle before command commit", () => {
    const document = createFoundationDocument();
    const cyclic = { ...document, components: { a: definition("a"), b: { ...definition("b"), rootNodeId: "frame-foundation" } }, instances: { "frame-foundation": { definitionId: "a", properties: { label: "x" }, overrides: {} } } };
    const result = validateEditorDocument(cyclic);
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((diagnostic) => diagnostic.code.startsWith("COMPONENT_DEPENDENCY_CYCLE:"))).toBe(true);
  });

  test("rejected component graphs preserve authored bytes and history", () => {
    let document = createFoundationDocument();
    document = applyDocumentCommand(document, { type: "create-component-definition", definition: definition("component-card") }).document;
    const kernel = createEditorKernel(document);
    const before = canonicalEditorDocumentString(kernel.getDocument());
    const invalid = { ...kernel.getDocument(), components: { ...kernel.getDocument().components, broken: { ...definition("broken"), rootNodeId: "missing-template" } } };
    const result = validateEditorDocument(invalid);
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "COMPONENT_ROOT_MISSING:broken")).toBe(true);
    expect(canonicalEditorDocumentString(kernel.getDocument())).toBe(before);
    expect(kernel.canUndo()).toBe(false);
  });

  test("detaches as one invertible authored conversion", () => {
    let document = createFoundationDocument();
    document = applyDocumentCommand(document, { type: "create-component-definition", definition: definition("component-card") }).document;
    document = applyDocumentCommand(document, { type: "create-component-instance", instanceId: "instance-card", node: instanceNode("instance-card", "page-root-home"), instance: { definitionId: "component-card", properties: { label: "Default" }, overrides: {} } }).document;
    const detached = applyDocumentCommand(document, { type: "detach-component-instance", instanceId: "instance-card" });
    expect(detached.document.instances["instance-card"]).toBeUndefined();
    expect(applyDocumentCommand(detached.document, detached.inverse).document).toEqual(document);
  });

  test("kernel projection expands instances without changing authored identity", () => {
    let document = createFoundationDocument();
    document = applyDocumentCommand(document, { type: "create-component-definition", definition: definition("component-card") }).document;
    document = applyDocumentCommand(document, { type: "create-component-instance", instanceId: "instance-card", node: instanceNode("instance-card", "page-root-home"), instance: { definitionId: "component-card", properties: { label: "Default" }, overrides: {} } }).document;
    const authoredBytes = canonicalEditorDocumentString(document);
    const kernel = createEditorKernel(document);
    const projection = kernel.getProjection();
    expect(canonicalEditorDocumentString(kernel.getDocument())).toBe(authoredBytes);
    expect(projection.resolvedScene.nodes["resolved:instance-card:frame-foundation"]?.provenance).toMatchObject({ definitionId: "component-card", instanceId: "instance-card" });
    expect(projection.resolvedDocument.nodes["resolved:instance-card:frame-foundation"]).toBeDefined();

    const scene = editorDocumentToScene(projection.resolvedDocument, projection.documentRevision);
    const layerIds = scene.frames.flatMap((frame) => frame.layers.map((layer) => layer.id));
    expect(layerIds).toContain("resolved:instance-card:frame-foundation");
    expect(JSON.stringify(scene)).not.toContain("provenance");
    expect(JSON.stringify(scene)).not.toContain("component-card");
  });
});
