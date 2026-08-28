import { describe, expect, it } from "vitest";
import { applyDocumentCommand } from "./commands.js";
import { createFoundationDocument, migrateDocument, type DocumentNode, type SemanticRelation, type SemanticSurface } from "./document.js";
import { createEditorKernel } from "./kernel.js";
import { buildClipboardContent, planClipboardInsert } from "./clipboard.js";

const screenNode = (): DocumentNode => ({
  id: "frame-settings",
  kind: "frame",
  name: "Settings",
  parentId: "page-root-home",
  childIds: [],
  bounds: { x: 760, y: 120, width: 520, height: 320 },
  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  visible: true,
  locked: false,
  opacity: 1,
  fill: "#202531",
  stroke: "#566078",
  cornerRadius: 24,
  zIndex: 2,
});

const layoutSurface: SemanticSurface = { id: "surface-layout", nodeId: "frame-foundation", role: "layout", behaviorVersion: 1, binding: { target: "nextjs", reference: "app/layout.tsx" } };
const settingsSurface: SemanticSurface = { id: "surface-settings", nodeId: "frame-settings", role: "screen", behaviorVersion: 1, route: { id: "route-settings", path: "/settings" } };

describe("semantic surfaces", () => {
  it("migrates v3 documents with empty semantic registries", () => {
    const v3 = structuredClone(createFoundationDocument());
    delete (v3 as Partial<typeof v3>).surfaces;
    delete (v3 as Partial<typeof v3>).semanticRelations;
    v3.schemaVersion = 3 as 5;
    const migrated = migrateDocument(v3);
    expect(migrated.ok).toBe(true);
    expect(migrated.applied).toContain("v3-to-v4-add-semantic-surfaces");
    expect(migrated.document?.surfaces).toEqual({});
    expect(migrated.document?.semanticRelations).toEqual({});
  });

  it("sets, updates, clears, and undoes target-neutral surface intent", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "set-surface", surface: layoutSurface }, "Promote layout");
    expect(kernel.getDocument().surfaces[layoutSurface.id]).toEqual(layoutSurface);
    kernel.dispatch({ type: "set-surface", surface: { ...layoutSurface, role: "component" } }, "Change role");
    expect(kernel.getDocument().surfaces[layoutSurface.id]?.role).toBe("component");
    kernel.undo();
    expect(kernel.getDocument().surfaces[layoutSurface.id]).toEqual(layoutSurface);
    kernel.dispatch({ type: "clear-surface", surfaceId: layoutSurface.id }, "Clear surface");
    expect(kernel.getDocument().surfaces[layoutSurface.id]).toBeUndefined();
    kernel.undo();
    expect(kernel.getDocument().surfaces[layoutSurface.id]).toEqual(layoutSurface);
  });

  it("keeps cancelled semantic transactions out of the document and history", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.beginTransaction("Promote surface");
    kernel.preview({ type: "set-surface", surface: layoutSurface });
    kernel.rollback();
    expect(kernel.getDocument().surfaces).toEqual({});
    expect(kernel.canUndo()).toBe(false);
    kernel.beginTransaction("Promote surface");
    kernel.preview({ type: "set-surface", surface: layoutSurface });
    kernel.commit();
    expect(kernel.canUndo()).toBe(true);
    kernel.undo();
    expect(kernel.getDocument().surfaces).toEqual({});
  });

  it("rejects duplicate routes and invalid relation targets without mutation", () => {
    const document = createFoundationDocument();
    const withScreen = applyDocumentCommand(document, { type: "create-node", node: screenNode() }).document;
    const withScreens = applyDocumentCommand(withScreen, { type: "set-surface", surface: { ...settingsSurface, nodeId: "frame-settings" } }).document;
    const withLayout = applyDocumentCommand(withScreens, { type: "set-surface", surface: { ...layoutSurface, route: { id: "route-home", path: "/" }, role: "screen" } }).document;
    expect(() => applyDocumentCommand(withLayout, { type: "set-surface", surface: { ...settingsSurface, route: { id: "route-duplicate", path: "/" } } })).toThrow("SEMANTIC_INVALID:duplicate-route");
    const relation: SemanticRelation = { id: "relation-link", kind: "link", sourceNodeId: "frame-settings", targetSurfaceId: "missing-surface" };
    expect(() => applyDocumentCommand(withScreens, { type: "set-semantic-relation", relation })).toThrow("SEMANTIC_INVALID:relation-target-surface");
  });

  it("records outlet and link relationships while keeping renderer nodes unchanged", () => {
    const document = createFoundationDocument();
    const withScreen = applyDocumentCommand(document, { type: "create-node", node: screenNode() }).document;
    const withSurfaces = applyDocumentCommand(withScreen, { type: "set-surface", surface: layoutSurface }).document;
    const withScreenSurface = applyDocumentCommand(withSurfaces, { type: "set-surface", surface: settingsSurface }).document;
    const outlet: SemanticRelation = { id: "relation-outlet", kind: "outlet", sourceNodeId: "frame-foundation", targetNodeId: "rectangle-foundation", name: "content" };
    const link: SemanticRelation = { id: "relation-settings", kind: "link", sourceNodeId: "rectangle-foundation", targetSurfaceId: settingsSurface.id, name: "settings" };
    const result = applyDocumentCommand(withScreenSurface, { type: "set-semantic-relation", relation: outlet });
    const final = applyDocumentCommand(result.document, { type: "set-semantic-relation", relation: link }).document;
    expect(final.nodes["frame-foundation"]?.kind).toBe("frame");
    expect(final.semanticRelations).toMatchObject({ "relation-outlet": outlet, "relation-settings": link });
    expect(result.inverse).toEqual({ type: "delete-semantic-relation", relationId: outlet.id });
  });

  it("remints semantic ids when a surface subtree is pasted", () => {
    const document = applyDocumentCommand(createFoundationDocument(), { type: "set-surface", surface: layoutSurface }).document;
    const content = buildClipboardContent(document, ["frame-foundation"], "page-home", document.file.id);
    expect(content?.surfaces).toHaveProperty(layoutSurface.id);
    const plan = content ? planClipboardInsert(document, content, "page-root-home", 1, { x: 800, y: 500 }) : undefined;
    expect(plan).toBeDefined();
    const surfaceEntries = Object.entries(plan!.command.surfaces ?? {});
    expect(surfaceEntries).toHaveLength(1);
    expect(surfaceEntries[0]?.[0]).not.toBe(layoutSurface.id);
    expect(surfaceEntries[0]?.[1].nodeId).toBe(plan!.command.nodes[0]?.id);
    const pasted = applyDocumentCommand(document, plan!.command).document;
    expect(Object.keys(pasted.surfaces)).toHaveLength(2);
  });

  it("builds the dashboard surface vocabulary without framework-specific roles", () => {
    let document = createFoundationDocument();
    for (const [id, name] of [["frame-settings", "Settings"], ["frame-component", "Navigation"], ["frame-overlay", "Command palette"]] as const) {
      document = applyDocumentCommand(document, { type: "create-node", node: { ...screenNode(), id, name, bounds: { x: 0, y: 0, width: 240, height: 240 } } }).document;
    }
    document = applyDocumentCommand(document, { type: "set-surface", surface: layoutSurface }).document;
    document = applyDocumentCommand(document, { type: "set-surface", surface: settingsSurface }).document;
    document = applyDocumentCommand(document, { type: "set-surface", surface: { id: "surface-component", nodeId: "frame-component", role: "component", behaviorVersion: 1 } }).document;
    document = applyDocumentCommand(document, { type: "set-surface", surface: { id: "surface-overlay", nodeId: "frame-overlay", role: "overlay", behaviorVersion: 1 } }).document;
    expect(Object.values(document.surfaces).map((surface) => surface.role)).toEqual(["layout", "screen", "component", "overlay"]);
    expect(document.surfaces[layoutSurface.id]?.binding?.reference).toBe("app/layout.tsx");
  });
});
