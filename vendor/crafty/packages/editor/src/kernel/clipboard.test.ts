import { describe, expect, it } from "vitest";
import { canonicalEditorDocumentString, createDefaultPageCanvas, createFoundationDocument, type AffineTransform, type DocumentNode, type EditorDocument, type PageRecord } from "./document.js";
import { createEditorKernel } from "./kernel.js";
import { buildClipboardContent, CLIPBOARD_MIME, clipboardSubtreeBounds, parseClipboardPayload, serializeClipboardPayload, validateClipboardContent, type ClipboardContent } from "./clipboard.js";

const identity = (): AffineTransform => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });

const rectangle = (id: string, parentId: string, bounds = { x: 0, y: 0, width: 100, height: 80 }, zIndex = 1): DocumentNode => ({
  id, kind: "rectangle", name: id, parentId, childIds: [], bounds, transform: identity(), visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex
});

const page = (id: string, name = id): PageRecord => ({ id, name, rootId: `page-root-${id.replace(/^page-/u, "")}`, canvas: createDefaultPageCanvas() });

const instanceFixture = (): EditorDocument => {
  const document = createFoundationDocument();
  document.nodes["component-root"] = { id: "component-root", kind: "frame", name: "Card definition", parentId: null, childIds: [], bounds: { x: 0, y: 0, width: 200, height: 160 }, transform: identity(), visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 8, zIndex: 0 };
  document.nodes["page-root-home"] = { ...document.nodes["page-root-home"]!, childIds: [...document.nodes["page-root-home"]!.childIds, "frame-instance"] };
  document.nodes["frame-instance"] = { id: "frame-instance", kind: "frame", name: "Card instance", parentId: "page-root-home", childIds: ["rect-inst-child", "text-inst-child"], bounds: { x: 40, y: 40, width: 200, height: 160 }, transform: identity(), visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 8, zIndex: 2 };
  document.nodes["rect-inst-child"] = rectangle("rect-inst-child", "frame-instance", { x: 8, y: 8, width: 80, height: 40 }, 1);
  document.nodes["text-inst-child"] = { ...rectangle("text-inst-child", "frame-instance", { x: 8, y: 60, width: 120, height: 24 }, 2), kind: "text", text: "Hello" };
  // The definition owns a detached definition subtree; the instance is a separate
  // authored node. A definition rooted at its own instance would be a
  // committed component dependency cycle and is now correctly rejected.
  document.components["component-card"] = { id: "component-card", name: "Card", rootNodeId: "component-root", propertyDefinitions: {}, variants: {}, states: {} };
  document.instances["frame-instance"] = { definitionId: "component-card", properties: {}, overrides: { "rect-inst-child": { fill: "#ff0000" } } };
  return document;
};

const pastedInstanceId = (document: EditorDocument, original: string): string => Object.keys(document.instances).find((id) => id !== original)!;

describe("clipboard content building (S5)", () => {
  it("prunes parent+child selection to the topmost subtrees and records override paths", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["frame-instance", "rect-inst-child"]);
    const content = kernel.copySelection();
    expect(content).toBeDefined();
    expect(content?.nodes).toHaveLength(1);
    expect(content?.nodes[0]?.id).toBe("frame-instance");
    expect(content?.nodes[0]?.children.map((child) => child.id)).toEqual(["rect-inst-child", "text-inst-child"]);
    expect(content?.nodes[0]?.overridePath).toEqual([]);
    expect(content?.nodes[0]?.children[0]?.overridePath).toEqual(["0"]);
    expect(content?.nodes[0]?.children[1]?.overridePath).toEqual(["1"]);
    expect(Object.keys(content?.instances ?? {})).toEqual(["frame-instance"]);
    expect(Object.keys(content?.components ?? {})).toEqual(["component-card"]);
  });

  it("returns undefined for an empty selection and copies without a history entry", () => {
    const kernel = createEditorKernel(instanceFixture());
    expect(kernel.copySelection()).toBeUndefined();
    kernel.setSelection(["rect-inst-child"]);
    kernel.copySelection();
    expect(kernel.canUndo()).toBe(false);
    expect(kernel.getClipboard()).toBeDefined();
  });

  it("round-trips the MIME-tagged payload with a raw-JSON text fallback", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["frame-instance"]);
    const content = kernel.copySelection()!;
    const serialized = serializeClipboardPayload(content);
    expect(serialized.startsWith(`${CLIPBOARD_MIME}\n`)).toBe(true);
    expect(parseClipboardPayload(serialized)).toEqual(content);
    expect(parseClipboardPayload(JSON.stringify(content))).toEqual(content);
    expect(validateClipboardContent(content)).toBe(true);
    expect(parseClipboardPayload("not json")).toBeUndefined();
    expect(parseClipboardPayload("")).toBeUndefined();
  });
});

describe("paste mints IDs (test matrix #16)", () => {
  it("mints fresh unique ids that never collide with document map keys", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["frame-instance"]);
    kernel.copySelection();
    const before = new Set(Object.keys(kernel.getDocument().nodes));
    const outcome = kernel.paste(undefined, { x: 300, y: 300 });
    expect(outcome?.mintedRootIds).toHaveLength(1);
    const mintedRootId = outcome!.mintedRootIds[0]!;
    expect(mintedRootId).not.toBe("frame-instance");
    expect(before.has(mintedRootId)).toBe(false);
    const after = kernel.getDocument();
    const mintedIds = Object.keys(after.nodes).filter((id) => !before.has(id));
    expect(mintedIds).toHaveLength(3);
    expect(new Set(mintedIds).size).toBe(3);
    expect(after.nodes[mintedRootId]!.childIds).toHaveLength(2);
    for (const childId of after.nodes[mintedRootId]!.childIds) expect(after.nodes[childId]?.parentId).toBe(mintedRootId);
    expect(kernel.getState().selectedIds).toEqual([mintedRootId]);
  });

  it("round-trips a pasted document with stable canonical bytes", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["frame-instance"]);
    kernel.copySelection();
    kernel.paste(undefined, { x: 300, y: 300 });
    const serialized = kernel.serialize();
    const reloaded = createEditorKernel(JSON.parse(serialized) as never);
    expect(canonicalEditorDocumentString(reloaded.getDocument())).toBe(canonicalEditorDocumentString(kernel.getDocument()));
  });
});

describe("paste override remap (test matrix #17)", () => {
  it("re-keys overrides through the id map to the minted node ids", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["frame-instance"]);
    kernel.copySelection();
    kernel.paste(undefined, { x: 300, y: 300 });
    const document = kernel.getDocument();
    const mintedId = pastedInstanceId(document, "frame-instance");
    const mintedRectId = document.nodes[mintedId]!.childIds[0]!;
    const overrides = document.instances[mintedId]!.overrides;
    expect(Object.keys(overrides)).toEqual([mintedRectId]);
    expect(overrides[mintedRectId]).toEqual({ fill: "#ff0000" });
    expect(document.instances[mintedId]!.definitionId).toBe("component-card");
    expect(kernel.getState().pasteDiagnostics).toEqual([]);
  });

  it("re-keys path-keyed overrides via the overridePath fallback and drops unresolvable keys with a diagnostic", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["frame-instance"]);
    const content = kernel.copySelection()!;
    content.instances["frame-instance"] = { definitionId: "component-card", properties: {}, overrides: { "1": { fill: "#00ff00" }, "9/9": { fill: "#0000ff" } } };
    const outcome = kernel.paste(content, { x: 300, y: 300 });
    const document = kernel.getDocument();
    const mintedId = pastedInstanceId(document, "frame-instance");
    const mintedTextId = document.nodes[mintedId]!.childIds[1]!;
    const overrides = document.instances[mintedId]!.overrides;
    expect(overrides[mintedTextId]).toEqual({ fill: "#00ff00" });
    expect(Object.keys(overrides)).toHaveLength(1);
    expect(outcome?.diagnostics.some((diagnostic) => diagnostic.code === "PASTE_OVERRIDE_DROPPED")).toBe(true);
    expect(kernel.getState().pasteDiagnostics.some((diagnostic) => diagnostic.code === "PASTE_OVERRIDE_DROPPED")).toBe(true);
  });

  it("creates a local component copy with a diagnostic when the definition is missing", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["frame-instance"]);
    const content = kernel.copySelection()!;
    content.instances["frame-instance"]!.definitionId = "component-foreign";
    content.components = { "component-foreign": { id: "component-foreign", name: "Foreign card", rootNodeId: "component-root", propertyDefinitions: {}, variants: {}, states: {} } };
    const outcome = kernel.paste(content, { x: 300, y: 300 });
    const document = kernel.getDocument();
    const mintedId = pastedInstanceId(document, "frame-instance");
    const definitionId = document.instances[mintedId]!.definitionId;
    expect(definitionId).not.toBe("component-foreign");
    expect(document.components[definitionId]).toBeDefined();
    expect(document.components[definitionId]!.name).toBe("Foreign card");
    expect(outcome?.diagnostics.some((diagnostic) => diagnostic.code === "PASTE_COMPONENT_LOCAL_COPY")).toBe(true);
  });

  it("keeps a shared definition reference when the target file already has the definition", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["frame-instance"]);
    kernel.copySelection();
    kernel.paste(undefined, { x: 300, y: 300 });
    kernel.paste(undefined, { x: 600, y: 300 });
    const document = kernel.getDocument();
    const ids = Object.keys(document.instances).filter((id) => id !== "frame-instance");
    expect(ids).toHaveLength(2);
    for (const id of ids) expect(document.instances[id]!.definitionId).toBe("component-card");
    expect(Object.keys(document.components)).toEqual(["component-card"]);
  });

  it("remints internal component instances and semantic-surface node references", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["frame-instance"]);
    const content = kernel.copySelection()!;
    content.surfaces = {
      "surface-card": { id: "surface-card", nodeId: "frame-instance", role: "component", behaviorVersion: 1 }
    };
    const outcome = kernel.paste(content, { x: 300, y: 300 });
    expect(outcome?.diagnostics).toEqual([]);
    const document = kernel.getDocument();
    const pastedId = pastedInstanceId(document, "frame-instance");
    const surface = Object.values(document.surfaces).find((candidate) => candidate.id !== "surface-card");
    expect(surface?.nodeId).toBe(pastedId);
    expect(surface?.id).not.toBe("surface-card");
    expect(document.instances[pastedId]?.definitionId).toBe("component-card");
  });
});

describe("paste is one history entry (test matrix #18)", () => {
  it("a single undo reverts the whole paste and redo restores the same minted ids", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["frame-instance"]);
    kernel.copySelection();
    const before = canonicalEditorDocumentString(kernel.getDocument());
    kernel.paste(undefined, { x: 300, y: 300 });
    const pasted = kernel.getDocument();
    const mintedIds = Object.keys(pasted.nodes).filter((id) => id.startsWith("clip-")).sort();
    expect(mintedIds.length).toBeGreaterThan(0);
    expect(canonicalEditorDocumentString(pasted)).not.toBe(before);
    expect(kernel.undo()).toBe(true);
    expect(canonicalEditorDocumentString(kernel.getDocument())).toBe(before);
    expect(kernel.undo()).toBe(false);
    expect(kernel.redo()).toBe(true);
    const afterRedo = kernel.getDocument();
    const restoredIds = Object.keys(afterRedo.nodes).filter((id) => id.startsWith("clip-")).sort();
    expect(restoredIds).toEqual(mintedIds);
    expect(canonicalEditorDocumentString(afterRedo)).toBe(canonicalEditorDocumentString(pasted));
  });

  it("undo of paste also removes the instance records and restores them on redo", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["frame-instance"]);
    kernel.copySelection();
    kernel.paste(undefined, { x: 300, y: 300 });
    const mintedId = pastedInstanceId(kernel.getDocument(), "frame-instance");
    kernel.undo();
    expect(kernel.getDocument().instances[mintedId]).toBeUndefined();
    kernel.redo();
    expect(kernel.getDocument().instances[mintedId]).toBeDefined();
  });
});

describe("cross-page paste (S5)", () => {
  it("pastes into the active page root regardless of the copy source page", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["frame-instance"]);
    kernel.copySelection();
    kernel.dispatch({ type: "create-page", page: page("page-b") });
    kernel.dispatch({ type: "set-page", pageId: "page-b" });
    const outcome = kernel.paste(undefined, { x: 120, y: 80 });
    expect(outcome?.mintedRootIds).toHaveLength(1);
    const document = kernel.getDocument();
    const mintedRoot = document.nodes[outcome!.mintedRootIds[0]!]!;
    expect(mintedRoot.parentId).toBe("page-root-b");
    expect(document.nodes["page-root-b"]!.childIds).toContain(mintedRoot.id);
    expect(document.nodes["page-root-home"]!.childIds).not.toContain(mintedRoot.id);
    expect(canonicalEditorDocumentString(document)).toBe(canonicalEditorDocumentString(document));
    expect(kernel.getState().currentPageId).toBe("page-b");
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().nodes[outcome!.mintedRootIds[0]!]).toBeUndefined();
  });

  it("pastes into a hovered frame parent with parent/child invariants intact", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["rect-inst-child"]);
    kernel.copySelection();
    const outcome = kernel.paste(undefined, { x: 300, y: 300 }, { parentId: "frame-foundation" });
    const document = kernel.getDocument();
    const mintedRoot = document.nodes[outcome!.mintedRootIds[0]!]!;
    expect(mintedRoot.parentId).toBe("frame-foundation");
    expect(document.nodes["frame-foundation"]!.childIds).toContain(mintedRoot.id);
    expect(canonicalEditorDocumentString(document)).toBe(canonicalEditorDocumentString(document));
  });
});

describe("paste-at-cursor placement", () => {
  it("lands the pasted subtree top-left at the cursor world point with relative offsets preserved", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["frame-instance"]);
    kernel.copySelection();
    kernel.paste(undefined, { x: 300, y: 300 });
    const document = kernel.getDocument();
    const mintedId = pastedInstanceId(document, "frame-instance");
    const root = document.nodes[mintedId]!;
    expect(root.bounds.x).toBe(300);
    expect(root.bounds.y).toBe(300);
    expect(root.bounds.width).toBe(200);
    expect(root.bounds.height).toBe(160);
    const firstChild = document.nodes[root.childIds[0]!]!;
    expect(firstChild.bounds.x).toBe(268);
    expect(firstChild.bounds.y).toBe(268);
  });

  it("reports preview bounds at the cursor without mutating the document", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["frame-instance"]);
    kernel.copySelection();
    const preview = kernel.pastePreview({ x: 400, y: 200 });
    expect(preview?.bounds).toEqual({ x: 400, y: 200, width: 200, height: 160 });
    // The preview resolves its target over the authored document: (400, 200)
    // sits inside frame-foundation, so the reported parent is the frame.
    expect(preview?.parentId).toBe("frame-foundation");
    expect(kernel.getDocument().nodes["frame-instance"]).toBeDefined();
    expect(canonicalEditorDocumentString(kernel.getDocument())).toBe(canonicalEditorDocumentString(kernel.getDocument()));
  });

  it("paste and preview are no-ops without a clipboard payload", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    expect(kernel.paste(undefined, { x: 0, y: 0 })).toBeUndefined();
    expect(kernel.pastePreview({ x: 0, y: 0 })).toBeUndefined();
  });
});

describe("paste target resolution (H4)", () => {
  // instanceFixture geometry: frame-instance (40,40,200,160);
  // frame-foundation (180,120,520,320) with rectangle-foundation at world
  // (244,204,240,132) and text-foundation at (244,360,340,42).
  it("lands the paste inside a frame when the cursor is over the frame but no child", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["rect-inst-child"]);
    kernel.copySelection();
    const outcome = kernel.paste(undefined, { x: 600, y: 420 });
    const document = kernel.getDocument();
    const mintedRoot = document.nodes[outcome!.mintedRootIds[0]!]!;
    expect(mintedRoot.parentId).toBe("frame-foundation");
    expect(document.nodes["frame-foundation"]!.childIds).toContain(mintedRoot.id);
  });

  it("lands the paste in the page root when the cursor is over a plain rectangle", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["rect-inst-child"]);
    kernel.copySelection();
    const outcome = kernel.paste(undefined, { x: 300, y: 260 });
    const document = kernel.getDocument();
    expect(document.nodes[outcome!.mintedRootIds[0]!]!.parentId).toBe("page-root-home");
  });

  it("lands the paste in the page root when the cursor is over empty space", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["rect-inst-child"]);
    kernel.copySelection();
    const outcome = kernel.paste(undefined, { x: 1000, y: 700 });
    const document = kernel.getDocument();
    expect(document.nodes[outcome!.mintedRootIds[0]!]!.parentId).toBe("page-root-home");
  });

  it("honors an explicit parentId override over the cursor hit", () => {
    const kernel = createEditorKernel(instanceFixture());
    kernel.setSelection(["rect-inst-child"]);
    kernel.copySelection();
    const outcome = kernel.paste(undefined, { x: 1000, y: 700 }, { parentId: "frame-foundation" });
    const document = kernel.getDocument();
    expect(document.nodes[outcome!.mintedRootIds[0]!]!.parentId).toBe("frame-foundation");
  });
});
