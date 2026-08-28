import { describe, expect, it } from "vitest";
import { applyDocumentCommand } from "./commands.js";
import { LAYOUT_BEHAVIOR_MODEL, LAYOUT_BEHAVIOR_VERSION, validateEditorDocument, type AutoLayout, type EditorDocument } from "./document.js";
import { LastValidLayoutResolver, resolveDocumentLayout } from "./layout.js";
import { createEditorKernel } from "./kernel.js";
import { documentHitTest } from "./interaction.js";

const layout: AutoLayout = {
  behavior: { model: LAYOUT_BEHAVIOR_MODEL, version: LAYOUT_BEHAVIOR_VERSION },
  direction: "horizontal",
  wrap: false,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  gap: { row: 0, column: 10 },
  primaryAlign: "start",
  counterAlign: "start",
};

const document = (): EditorDocument => ({
  schemaVersion: 5,
  id: "doc",
  workspace: { id: "workspace", name: "Workspace" },
  project: { id: "project", name: "Project" },
  file: { id: "file", name: "File" },
  pages: { page: { id: "page", name: "Page", rootId: "root", canvas: { rest: { panX: 0, panY: 0, zoom: 1 }, grid: { mode: "lines", majorSpacing: 40, minorStep: 5, originX: 0, originY: 0 }, rulers: { showRulers: true, unit: "px" }, guides: [], snap: { grid: true, guides: true, objects: true, pixel: true } } } },
  pageOrder: ["page"],
  nodes: {
    root: { id: "root", kind: "page-root", name: "Root", parentId: null, childIds: ["frame"], bounds: { x: 0, y: 0, width: 500, height: 500 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, visible: true, locked: false, opacity: 1, fill: "#000000", stroke: "#000000", cornerRadius: 0, zIndex: 0 },
    frame: { id: "frame", kind: "frame", name: "Frame", parentId: "root", childIds: ["a"], bounds: { x: 10, y: 20, width: 100, height: 40 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 1, autoLayout: layout },
    a: { id: "a", kind: "rectangle", name: "A", parentId: "frame", childIds: [], bounds: { x: 0, y: 0, width: 20, height: 10 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 1, sizing: { horizontal: "fixed", vertical: "fixed" } },
  },
  components: {}, instances: {}, libraries: [], variables: {}, metadata: {}, surfaces: {}, semanticRelations: {},
});

const evaluator = (json: string): string => {
  const input = JSON.parse(json) as { root: { id: string; bounds: { x: number; y: number; width: number; height: number }; children: Array<{ id: string; bounds: { width: number; height: number } }> } };
  return JSON.stringify({ version: 1, boxes: { [input.root.id]: input.root.bounds, [input.root.children[0]!.id]: { x: 0, y: 0, ...input.root.children[0]!.bounds } }, diagnostics: [], measurementDependencies: [] });
};

describe("authored layout", () => {
  it("validates records and rejects unknown behavior versions", () => {
    expect(validateEditorDocument(document()).ok).toBe(true);
    const invalid = document();
    invalid.nodes.frame!.autoLayout = { ...layout, behavior: { model: "crafty-flex", version: 2 } as unknown as AutoLayout["behavior"] };
    expect(validateEditorDocument(invalid).diagnostics[0]?.code).toBe("LAYOUT_UNSUPPORTED_VERSION:crafty-flex@2");
  });

  it("applies exact invertible commands", () => {
    const initial = document();
    const set = applyDocumentCommand(initial, { type: "set-layout-position", nodeId: "a", layoutPosition: "absolute" });
    expect(set.document.nodes.a!.layoutPosition).toBe("absolute");
    expect(applyDocumentCommand(set.document, set.inverse).document).toEqual(initial);
  });

  it("resolves without mutating authored bounds", () => {
    const initial = document();
    const before = structuredClone(initial.nodes.a!.bounds);
    const resolved = resolveDocumentLayout(initial, "page", evaluator);
    expect(resolved.boxes.a).toEqual({ x: 0, y: 0, width: 20, height: 10 });
    expect(initial.nodes.a!.bounds).toEqual(before);
  });

  it("preserves the last valid result after evaluator failure", () => {
    let fail = false;
    const resolver = new LastValidLayoutResolver((json) => {
      if (fail) throw new Error("boom");
      return evaluator(json);
    });
    const first = resolver.resolve(document(), "page");
    fail = true;
    const second = resolver.resolve(document(), "page");
    expect(second.boxes).toEqual(first.boxes);
    expect(second.diagnostics).toContain("LAYOUT_EVALUATOR_FAILED");
  });

  it("projects one resolved geometry source into hit testing without authoring it", () => {
    const initial = document();
    const kernel = createEditorKernel(initial);
    kernel.setLayoutEvaluator(() => JSON.stringify({ version: 1, boxes: { frame: { x: 10, y: 20, width: 100, height: 40 }, a: { x: 60, y: 0, width: 20, height: 10 } }, diagnostics: [], measurementDependencies: [] }));
    const projection = kernel.getProjection();
    expect(projection.document.nodes.a!.bounds.x).toBe(0);
    expect(projection.resolvedDocument.nodes.a!.bounds.x).toBe(60);
    expect(documentHitTest(projection.resolvedDocument, "page", { x: 75, y: 25 })).toBe("a");
    expect(documentHitTest(projection.document, "page", { x: 75, y: 25 })).toBe("frame");
  });
});
