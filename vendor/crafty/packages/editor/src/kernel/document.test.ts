import { describe, expect, it } from "vitest";
import { applyDocumentCommand } from "./commands.js";
import {
  canonicalEditorDocumentString,
  createDefaultPageCanvas,
  createFoundationDocument,
  EDITOR_DOCUMENT_SCHEMA_V1,
  EDITOR_DOCUMENT_SCHEMA_V2,
  EDITOR_DOCUMENT_SCHEMA_V3,
  EDITOR_DOCUMENT_SCHEMA_V4,
  EDITOR_DOCUMENT_SCHEMA_VERSION,
  loadEditorDocument,
  migrateDocument,
  type EditorDocument,
  type DocumentNode,
  type PathGeometry,
  validateEditorDocument,
  validateEditorDocumentV1,
  validateEditorDocumentV2,
  v1ToV2DocumentMigration,
  v2ToV3DocumentMigration,
  v3ToV4DocumentMigration,
  v4ToV5RequireTextContentDocumentMigration,
} from "./document.js";
import { computePathBounds, orderKeyBetween, orderKeyForSigned, pointInSubpath, reverseOrderKey, splitSegment } from "./path-geometry.js";
import { createEditorKernel } from "./kernel.js";
import { selectionUnionBounds } from "./selection.js";
import { editorDocumentToScene, sceneToEditorDocument } from "./scene-adapter.js";
import { createSeedScene } from "@crafty/scene-model";

/** A valid v3 path node: a two-point open horizontal line, zero height (I8 relaxed for paths). */
const pathFixture = (): { node: DocumentNode; geometry: PathGeometry } => {
  const geometry: PathGeometry = {
    points: {
      "point-a": { id: "point-a", subpathId: "subpath-1", order: orderKeyForSigned(0), x: 0, y: 0, handleMode: "corner" },
      "point-b": { id: "point-b", subpathId: "subpath-1", order: orderKeyForSigned(1), x: 10, y: 0, handleMode: "corner" },
    },
    subpaths: { "subpath-1": { id: "subpath-1", closed: false } },
    fillRule: "nonzero",
  };
  const node: DocumentNode = {
    id: "path-line", kind: "path", name: "Line", parentId: "frame-foundation", childIds: [],
    bounds: { x: 64, y: 84, width: 10, height: 0 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 3, path: geometry,
  };
  return { node, geometry };
};

const withPathNode = (): EditorDocument => {
  const document = createFoundationDocument();
  const { node } = pathFixture();
  return { ...document, nodes: { ...document.nodes, [node.id]: node } };
};

describe("schema v3 path kind", () => {
  it("accepts a path node at v3 and rejects the same document as v1 or v2", () => {
    const document = withPathNode();
    expect(validateEditorDocument(document).ok).toBe(true);
    expect(validateEditorDocumentV2(document).ok).toBe(false);
    expect(validateEditorDocumentV1(document).ok).toBe(false);
    const asV1 = { ...document, schemaVersion: EDITOR_DOCUMENT_SCHEMA_V1 };
    expect(migrateDocument(asV1).ok).toBe(false);
    const asV2 = { ...document, schemaVersion: EDITOR_DOCUMENT_SCHEMA_V2 };
    expect(migrateDocument(asV2).ok).toBe(false);
  });

  it("rejects a rect carrying geometry and a path without geometry", () => {
    const rect = withPathNode();
    const { geometry } = pathFixture();
    rect.nodes["rectangle-foundation"] = { ...rect.nodes["rectangle-foundation"]!, path: geometry };
    expect(validateEditorDocument(rect).ok).toBe(false);
    const bare = withPathNode();
    delete (bare.nodes["path-line"] as Partial<DocumentNode>).path;
    expect(validateEditorDocument(bare).ok).toBe(false);
  });

  it("rejects a path node with children (leaf rule)", () => {
    const document = withPathNode();
    document.nodes["path-line"] = { ...document.nodes["path-line"]!, childIds: ["rectangle-foundation"] };
    expect(validateEditorDocument(document).ok).toBe(false);
  });

  it("rejects orphan points, one-point subpaths, and points referencing missing subpaths", () => {
    const orphan = withPathNode();
    const orphanGeometry = structuredClone(orphan.nodes["path-line"]!.path!);
    orphanGeometry.points["point-c"] = { id: "point-c", subpathId: "subpath-missing", order: orderKeyForSigned(2), x: 5, y: 5, handleMode: "corner" };
    orphan.nodes["path-line"] = { ...orphan.nodes["path-line"]!, path: orphanGeometry };
    expect(validateEditorDocument(orphan).ok).toBe(false);
    const dangling = withPathNode();
    const danglingGeometry = structuredClone(dangling.nodes["path-line"]!.path!);
    danglingGeometry.points["point-a"] = { ...danglingGeometry.points["point-a"]!, subpathId: "subpath-missing" };
    dangling.nodes["path-line"] = { ...dangling.nodes["path-line"]!, path: danglingGeometry };
    expect(validateEditorDocument(dangling).ok).toBe(false);
    const onePoint = withPathNode();
    const onePointGeometry = structuredClone(onePoint.nodes["path-line"]!.path!);
    delete onePointGeometry.points["point-b"];
    onePoint.nodes["path-line"] = { ...onePoint.nodes["path-line"]!, path: onePointGeometry };
    expect(validateEditorDocument(onePoint).ok).toBe(false);
  });

  it("rejects non-finite coordinates, stale bounds, and non-rebased geometry", () => {
    const nonFinite = withPathNode();
    const nonFiniteGeometry = structuredClone(nonFinite.nodes["path-line"]!.path!);
    nonFiniteGeometry.points["point-b"] = { ...nonFiniteGeometry.points["point-b"]!, x: Number.NaN };
    nonFinite.nodes["path-line"] = { ...nonFinite.nodes["path-line"]!, path: nonFiniteGeometry };
    expect(validateEditorDocument(nonFinite).ok).toBe(false);
    const stale = withPathNode();
    stale.nodes["path-line"] = { ...stale.nodes["path-line"]!, bounds: { x: 64, y: 84, width: 500, height: 0 } };
    expect(validateEditorDocument(stale).ok).toBe(false);
    const unrebased = withPathNode();
    const unrebasedGeometry = structuredClone(unrebased.nodes["path-line"]!.path!);
    unrebasedGeometry.points["point-a"] = { ...unrebasedGeometry.points["point-a"]!, x: 5, y: 0 };
    unrebasedGeometry.points["point-b"] = { ...unrebasedGeometry.points["point-b"]!, x: 15, y: 0 };
    unrebased.nodes["path-line"] = { ...unrebased.nodes["path-line"]!, path: unrebasedGeometry };
    expect(validateEditorDocument(unrebased).ok).toBe(false);
  });

  it("enforces handle-mode consistency: corner stores no handles, mirrored stores only handleOut", () => {
    const corner = withPathNode();
    const cornerGeometry = structuredClone(corner.nodes["path-line"]!.path!);
    cornerGeometry.points["point-a"] = { ...cornerGeometry.points["point-a"]!, handleOut: { dx: 1, dy: 1 } };
    corner.nodes["path-line"] = { ...corner.nodes["path-line"]!, path: cornerGeometry };
    expect(validateEditorDocument(corner).ok).toBe(false);
    const mirroredBoth = withPathNode();
    const mirroredBothGeometry = structuredClone(mirroredBoth.nodes["path-line"]!.path!);
    mirroredBothGeometry.points["point-a"] = { ...mirroredBothGeometry.points["point-a"]!, handleMode: "mirrored", handleOut: { dx: 2, dy: 0 }, handleIn: { dx: -2, dy: 0 } };
    mirroredBoth.nodes["path-line"] = { ...mirroredBoth.nodes["path-line"]!, path: mirroredBothGeometry };
    expect(validateEditorDocument(mirroredBoth).ok).toBe(false);
    const mirroredMissing = withPathNode();
    const mirroredMissingGeometry = structuredClone(mirroredMissing.nodes["path-line"]!.path!);
    mirroredMissingGeometry.points["point-a"] = { ...mirroredMissingGeometry.points["point-a"]!, handleMode: "mirrored" };
    mirroredMissing.nodes["path-line"] = { ...mirroredMissing.nodes["path-line"]!, path: mirroredMissingGeometry };
    expect(validateEditorDocument(mirroredMissing).ok).toBe(false);
    const mirroredValid = withPathNode();
    const mirroredValidGeometry = structuredClone(mirroredValid.nodes["path-line"]!.path!);
    mirroredValidGeometry.points["point-a"] = { ...mirroredValidGeometry.points["point-a"]!, handleMode: "mirrored", handleOut: { dx: 2, dy: 0 } };
    mirroredValid.nodes["path-line"] = { ...mirroredValid.nodes["path-line"]!, path: mirroredValidGeometry };
    expect(validateEditorDocument(mirroredValid).ok).toBe(true);
  });

  it("rejects a bad fill rule and non-finite handle deltas", () => {
    const badRule = withPathNode();
    const badRuleGeometry = structuredClone(badRule.nodes["path-line"]!.path!);
    (badRuleGeometry as { fillRule: string }).fillRule = "winding";
    badRule.nodes["path-line"] = { ...badRule.nodes["path-line"]!, path: badRuleGeometry };
    expect(validateEditorDocument(badRule).ok).toBe(false);
    const badHandle = withPathNode();
    const badHandleGeometry = structuredClone(badHandle.nodes["path-line"]!.path!);
    badHandleGeometry.points["point-a"] = { ...badHandleGeometry.points["point-a"]!, handleMode: "free", handleOut: { dx: Number.POSITIVE_INFINITY, dy: 0 } };
    badHandle.nodes["path-line"] = { ...badHandle.nodes["path-line"]!, path: badHandleGeometry };
    expect(validateEditorDocument(badHandle).ok).toBe(false);
  });
});

describe("path geometry math", () => {
  it("computes true bezier extrema beyond the control-point hull", () => {
    const geometry: PathGeometry = {
      points: {
        p0: { id: "p0", subpathId: "s", order: orderKeyForSigned(0), x: 0, y: 0, handleMode: "free", handleOut: { dx: 0, dy: 100 } },
        p1: { id: "p1", subpathId: "s", order: orderKeyForSigned(1), x: 100, y: 0, handleMode: "free", handleIn: { dx: 0, dy: 100 } },
      },
      subpaths: { s: { id: "s", closed: false } },
      fillRule: "nonzero",
    };
    const bounds = computePathBounds(geometry);
    expect(bounds.maxX).toBeCloseTo(100);
    expect(bounds.maxY).toBeCloseTo(75);
    expect(bounds.minX).toBeCloseTo(0);
    expect(bounds.minY).toBeCloseTo(0);
  });

  it("inserts order keys between neighbours without renumbering them", () => {
    const left = orderKeyForSigned(0);
    const right = orderKeyForSigned(4);
    const middle = orderKeyBetween(left, right);
    expect(left < middle && middle < right).toBe(true);
    expect(orderKeyBetween(left, middle) < middle).toBe(true);
    expect(orderKeyBetween(middle, right) > middle).toBe(true);
  });

  it("reverses order keys as an involutive order-reversing bijection", () => {
    const keys = [orderKeyForSigned(-10), orderKeyForSigned(0), orderKeyForSigned(10), orderKeyForSigned(100)];
    const reversed = keys.map(reverseOrderKey);
    expect(reversed.map(reverseOrderKey)).toEqual(keys);
    expect(reversed.every((key, index) => index === 0 || reversed[index - 1]! > key)).toBe(true);
  });

  it("splits a cubic segment with de Casteljau and agrees with direct evaluation", () => {
    const p0 = { id: "p0", subpathId: "s", order: orderKeyForSigned(0), x: 0, y: 0, handleMode: "free" as const, handleOut: { dx: 0, dy: 100 } };
    const p1 = { id: "p1", subpathId: "s", order: orderKeyForSigned(1), x: 100, y: 0, handleMode: "free" as const, handleIn: { dx: 0, dy: 100 } };
    const split = splitSegment(p0, p1, 0.5);
    expect(split.point.x).toBeCloseTo(50);
    expect(split.point.y).toBeCloseTo(75);
    expect(split.prevHandleOut.dx).toBeCloseTo(0);
    expect(split.prevHandleOut.dy).toBeCloseTo(50);
    expect(split.nextHandleIn.dx).toBeCloseTo(0);
    expect(split.nextHandleIn.dy).toBeCloseTo(50);
    expect(() => splitSegment(p0, p1, 0)).toThrow("DOCUMENT_SPLIT_PARAMETER");
    expect(() => splitSegment(p0, p1, 1)).toThrow("DOCUMENT_SPLIT_PARAMETER");
  });

  it("hit-tests curved geometry: inside the bbox but outside the curve is a miss", () => {
    const geometry: PathGeometry = {
      points: {
        p0: { id: "p0", subpathId: "s", order: orderKeyForSigned(0), x: 0, y: 0, handleMode: "free", handleOut: { dx: 0, dy: 100 } },
        p1: { id: "p1", subpathId: "s", order: orderKeyForSigned(1), x: 100, y: 0, handleMode: "free", handleIn: { dx: 0, dy: 100 } },
      },
      subpaths: { s: { id: "s", closed: false } },
      fillRule: "nonzero",
    };
    expect(pointInSubpath(geometry, "s", { x: 50, y: 80 }, 0.25)).toBe(false);
    expect(pointInSubpath(geometry, "s", { x: 50, y: 74 }, 0.25)).toBe(true);
  });
});

describe("schema v2 page canvas", () => {  it("mints a default page canvas on the foundation document", () => {
    const document = createFoundationDocument();
    expect(document.schemaVersion).toBe(EDITOR_DOCUMENT_SCHEMA_VERSION);
    expect(validateEditorDocument(document).ok).toBe(true);
    const canvas = document.pages["page-home"]!.canvas;
    expect(canvas.rest).toEqual({ panX: 0, panY: 0, zoom: 1 });
    expect(canvas.grid).toEqual({ mode: "lines", majorSpacing: 40, minorStep: 5, originX: 0, originY: 0, visible: false });
    expect(canvas.rulers).toEqual({ showRulers: true, unit: "px" });
    expect(canvas.guides).toEqual([]);
    expect(canvas.snap).toEqual({ grid: true, guides: true, objects: true, pixel: true });
  });

  it("rejects invalid canvas records through the shared validator", () => {
    const document = createFoundationDocument();
    const badZoom = structuredClone(document);
    badZoom.pages["page-home"]!.canvas.rest.zoom = 1000;
    expect(validateEditorDocument(badZoom).ok).toBe(false);
    const badPan = structuredClone(document);
    badPan.pages["page-home"]!.canvas.rest.panX = 2e6;
    expect(validateEditorDocument(badPan).ok).toBe(false);
    const badGrid = structuredClone(document);
    badGrid.pages["page-home"]!.canvas.grid.minorStep = 0;
    expect(validateEditorDocument(badGrid).ok).toBe(false);
    const badMode = structuredClone(document);
    (badMode.pages["page-home"]!.canvas.grid as { mode: string }).mode = "hex";
    expect(validateEditorDocument(badMode).ok).toBe(false);
    const badGuide = structuredClone(document);
    badGuide.pages["page-home"]!.canvas.guides = [{ id: "guide-a", axis: "x", position: 2e6, visible: true }];
    expect(validateEditorDocument(badGuide).ok).toBe(false);
    const duplicateGuides = structuredClone(document);
    duplicateGuides.pages["page-home"]!.canvas.guides = [
      { id: "guide-a", axis: "x", position: 10, visible: true },
      { id: "guide-a", axis: "y", position: 20, visible: true }
    ];
    expect(validateEditorDocument(duplicateGuides).ok).toBe(false);
    const missingCanvas = structuredClone(document);
    delete (missingCanvas.pages["page-home"] as Partial<EditorDocument["pages"][string]>).canvas;
    expect(validateEditorDocument(missingCanvas).ok).toBe(false);
  });

  it("rejects invalid page-command payloads through the shared validator", () => {
    const document = createFoundationDocument();
    expect(() => applyDocumentCommand(document, { type: "set-page-viewport", pageId: "page-home", viewport: { panX: 0, panY: 0, zoom: 1000 } })).toThrow("Rest camera zoom must be within [0.01, 256]");
    expect(() => applyDocumentCommand(document, { type: "set-page-grid", pageId: "page-home", grid: { ...createDefaultPageCanvas().grid, minorStep: 0 } })).toThrow("Grid minor step must be a positive safe integer");
    expect(() => applyDocumentCommand(document, { type: "set-page-grid", pageId: "page-missing", grid: createDefaultPageCanvas().grid })).toThrow("DOCUMENT_PAGE_MISSING");
    expect(() => applyDocumentCommand(document, { type: "move-guide", pageId: "page-home", guideId: "missing", position: 10 })).toThrow("DOCUMENT_GUIDE_MISSING");
  });
});

describe("migration registry", () => {
  it("migrates a legacy Scene through v1 to v5 via the chained registry with stable canonical bytes (test matrix #5)", () => {
    const scene = createSeedScene();
    const migrated = migrateDocument(sceneToEditorDocument(scene));
    expect(migrated.ok).toBe(true);
    expect(migrated.applied).toEqual(["v1-to-v2-add-page-canvas", "v2-to-v3-add-path-kind", "v3-to-v4-add-semantic-surfaces", "v4-to-v5-require-text-content"]);
    const document = migrated.document!;
    expect(document.schemaVersion).toBe(EDITOR_DOCUMENT_SCHEMA_VERSION);
    for (const page of Object.values(document.pages)) {
      expect(page.canvas).toEqual(createDefaultPageCanvas());
      expect(validateEditorDocument(document).ok).toBe(true);
    }
    const canonical = canonicalEditorDocumentString(document);
    const reloaded = migrateDocument(JSON.parse(canonical) as unknown);
    expect(reloaded.ok).toBe(true);
    expect(reloaded.applied).toEqual([]);
    expect(canonicalEditorDocumentString(reloaded.document!)).toBe(canonical);
    expect(editorDocumentToScene(reloaded.document!, scene.revision)).toEqual(scene);
  });

  it("chains v1 to v2 to v5 without data loss and never skips a step", () => {
    const scene = createSeedScene();
    const v1 = sceneToEditorDocument(scene);
    const throughV2 = v1ToV2DocumentMigration.apply(v1);
    expect((throughV2.document as EditorDocument).schemaVersion).toBe(EDITOR_DOCUMENT_SCHEMA_V2);
    const throughV3 = v2ToV3DocumentMigration.apply(throughV2.document);
    expect((throughV3.document as EditorDocument).schemaVersion).toBe(EDITOR_DOCUMENT_SCHEMA_V3);
    const throughV4 = v3ToV4DocumentMigration.apply(throughV3.document);
    expect((throughV4.document as EditorDocument).schemaVersion).toBe(EDITOR_DOCUMENT_SCHEMA_V4);
    const throughV5 = v4ToV5RequireTextContentDocumentMigration.apply(throughV4.document);
    expect((throughV5.document as EditorDocument).schemaVersion).toBe(EDITOR_DOCUMENT_SCHEMA_VERSION);
    const chained = migrateDocument(v1);
    expect(chained.ok).toBe(true);
    expect(JSON.stringify(chained.document)).toBe(JSON.stringify(throughV5.document));
    expect(editorDocumentToScene(chained.document!, scene.revision)).toEqual(scene);
  });

  it("round-trips a v2 document without migration steps and keeps bytes stable across sessions", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const canonical = kernel.serialize();
    const first = migrateDocument(JSON.parse(canonical) as unknown);
    const second = migrateDocument(JSON.parse(canonical) as unknown);
    expect(first.ok).toBe(true);
    expect(first.applied).toEqual([]);
    expect(canonicalEditorDocumentString(first.document!)).toBe(canonicalEditorDocumentString(second.document!));
  });

  it("aborts corrupt input and preserves the previous valid document", () => {
    const corrupt = { schemaVersion: 1, id: "scene-x", pages: { "page-a": { id: "page-a", name: "A", rootId: "root-a" } }, pageOrder: ["page-a"], nodes: { "root-a": { id: "root-a", kind: "page-root", name: "A", parentId: "cycle-a", childIds: [], bounds: { x: 0, y: 0, width: 10, height: 10 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, visible: true, locked: false, opacity: 1, fill: "#fff", stroke: "#000", cornerRadius: 0, zIndex: 0 } }, components: {}, instances: {}, libraries: [], variables: {}, metadata: {} };
    const result = migrateDocument(corrupt);
    expect(result.ok).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    const previous = createFoundationDocument();
    const kept = result.ok && result.document ? result.document : previous;
    expect(canonicalEditorDocumentString(kept)).toBe(canonicalEditorDocumentString(previous));
  });

  it("rejects unknown schema versions and corrupt JSON without coercion", () => {
    const unknown = migrateDocument({ schemaVersion: 99 });
    expect(unknown.ok).toBe(false);
    expect(unknown.diagnostics[0]?.message).toContain("rejected, never coerced");
    expect(loadEditorDocument("{not json").ok).toBe(false);
    expect(loadEditorDocument(JSON.stringify({ schemaVersion: "two" })).ok).toBe(false);
  });

  it("migrates v1 input at the kernel load boundary", () => {
    const scene = createSeedScene();
    const kernel = createEditorKernel(sceneToEditorDocument(scene));
    expect(kernel.getDocument().schemaVersion).toBe(EDITOR_DOCUMENT_SCHEMA_VERSION);
    const firstPage = kernel.getDocument().pages[kernel.getDocument().pageOrder[0]!];
    expect(firstPage?.canvas).toBeDefined();
    expect(() => createEditorKernel({ schemaVersion: 99 } as never)).toThrow("rejected, never coerced");
  });
});

describe("page canvas commands", () => {
  it("sets page grid, rulers, and snap with undo and redo; the rest camera is bookkeeping, never history", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "set-page-grid", pageId: "page-home", grid: { mode: "dots", majorSpacing: 80, minorStep: 4, originX: 10, originY: 20 } });
    kernel.dispatch({ type: "set-ruler-settings", pageId: "page-home", rulers: { showRulers: false, unit: "cm" } });
    kernel.dispatch({ type: "set-snap-settings", pageId: "page-home", snap: { grid: false, guides: false, objects: false, pixel: true } });
    kernel.dispatch({ type: "set-page-viewport", pageId: "page-home", viewport: { panX: 100, panY: -50, zoom: 2 } });
    const canvas = kernel.getDocument().pages["page-home"]!.canvas;
    expect(canvas.grid.mode).toBe("dots");
    expect(canvas.rulers.unit).toBe("cm");
    expect(canvas.snap.pixel).toBe(true);
    expect(canvas.rest).toEqual({ panX: 100, panY: -50, zoom: 2 });
    for (let index = 0; index < 3; index += 1) expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().pages["page-home"]!.canvas.grid).toEqual(createDefaultPageCanvas().grid);
    expect(kernel.getDocument().pages["page-home"]!.canvas.rulers).toEqual(createDefaultPageCanvas().rulers);
    expect(kernel.getDocument().pages["page-home"]!.canvas.snap).toEqual(createDefaultPageCanvas().snap);
    // The camera write is not an undoable step: the rest camera persists.
    expect(kernel.getDocument().pages["page-home"]!.canvas.rest).toEqual({ panX: 100, panY: -50, zoom: 2 });
    expect(kernel.undo()).toBe(false);
    for (let index = 0; index < 3; index += 1) expect(kernel.redo()).toBe(true);
    expect(kernel.getDocument().pages["page-home"]!.canvas.rest.zoom).toBe(2);
  });

  it("adds, moves, and removes guides with undo/redo and serializes them only while durable (test matrix #11)", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "add-guide", pageId: "page-home", guide: { id: "guide-a", axis: "x", position: 120, visible: true } });
    expect(kernel.getDocument().pages["page-home"]!.canvas.guides).toEqual([{ id: "guide-a", axis: "x", position: 120, visible: true }]);
    expect(kernel.serialize()).toContain("guide-a");
    kernel.dispatch({ type: "move-guide", pageId: "page-home", guideId: "guide-a", position: 240 });
    expect(kernel.getDocument().pages["page-home"]!.canvas.guides[0]!.position).toBe(240);
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().pages["page-home"]!.canvas.guides[0]!.position).toBe(120);
    expect(kernel.redo()).toBe(true);
    expect(kernel.getDocument().pages["page-home"]!.canvas.guides[0]!.position).toBe(240);
    kernel.dispatch({ type: "remove-guide", pageId: "page-home", guideId: "guide-a" });
    expect(kernel.getDocument().pages["page-home"]!.canvas.guides).toEqual([]);
    expect(kernel.serialize()).not.toContain("guide-a");
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().pages["page-home"]!.canvas.guides[0]!.position).toBe(240);
    expect(kernel.serialize()).toContain("guide-a");
  });

  it("rejects duplicate guides at the command boundary", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "add-guide", pageId: "page-home", guide: { id: "guide-a", axis: "x", position: 10, visible: true } });
    expect(() => kernel.dispatch({ type: "add-guide", pageId: "page-home", guide: { id: "guide-a", axis: "y", position: 20, visible: true } })).toThrow("DOCUMENT_GUIDE_EXISTS");
  });

  it("keeps viewport changes out of history while page canvas commands are undoable", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const revision = kernel.getProjection().documentRevision;
    kernel.setViewport({ panX: 5, panY: 5, zoom: 1.5, devicePixelRatio: 1 });
    expect(kernel.getProjection().documentRevision).toBe(revision);
    expect(kernel.canUndo()).toBe(false);
    kernel.dispatch({ type: "set-page-viewport", pageId: "page-home", viewport: { panX: 5, panY: 5, zoom: 1.5 } });
    expect(kernel.getProjection().documentRevision).toBe(revision + 1);
    // The camera is ephemeral: even the durable rest write is bookkeeping and
    // never an undoable step, so the undo stack stays empty.
    expect(kernel.canUndo()).toBe(false);
    expect(kernel.undo()).toBe(false);
    expect(kernel.getDocument().pages["page-home"]!.canvas.rest).toEqual({ panX: 5, panY: 5, zoom: 1.5 });
  });

  it("refuses page commands while a transaction is active (rest camera rule)", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.beginTransaction("Move");
    expect(() => kernel.dispatch({ type: "set-page-viewport", pageId: "page-home", viewport: { panX: 1, panY: 2, zoom: 1 } })).toThrow("EDITOR_TRANSACTION_ACTIVE");
    kernel.rollback();
  });
});

describe("align-nodes", () => {
  const rectangle = (id: string, parentId: string, x: number, y: number, width = 100, height = 80): DocumentNode => ({ id, kind: "rectangle", name: id, parentId, childIds: [], bounds: { x, y, width, height }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 0 });

  const seed = (): EditorDocument => {
    const document = createFoundationDocument();
    const root = document.nodes["page-root-home"]!;
    return { ...document, nodes: {
      ...document.nodes,
      [root.id]: { ...root, childIds: [...root.childIds, "align-a", "align-b", "align-c"] },
      "align-a": rectangle("align-a", root.id, 0, 0),
      "align-b": rectangle("align-b", root.id, 240, 60),
      "align-c": rectangle("align-c", root.id, 120, 300),
    } };
  };

  it("aligns nodes to the selection union bounds on each axis, one undo restores all", () => {
    const kernel = createEditorKernel(seed());
    kernel.dispatch({ type: "align-nodes", nodeIds: ["align-a", "align-b", "align-c"], axis: "left" });
    expect(kernel.getDocument().nodes["align-b"]!.bounds.x).toBe(0);
    expect(kernel.getDocument().nodes["align-c"]!.bounds.x).toBe(0);
    kernel.dispatch({ type: "align-nodes", nodeIds: ["align-a", "align-b", "align-c"], axis: "centerY" });
    expect(kernel.getDocument().nodes["align-b"]!.bounds.y).toBeCloseTo(150, 5);
    expect(kernel.getDocument().nodes["align-c"]!.bounds.y).toBeCloseTo(150, 5);
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().nodes["align-b"]!.bounds.y).toBe(60);
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().nodes["align-b"]!.bounds.x).toBe(240);
    expect(kernel.getDocument().nodes["align-c"]!.bounds.x).toBe(120);
  });

  it("aligns right and bottom to the union edge and rejects cross-parent or singleton selections", () => {
    const kernel = createEditorKernel(seed());
    kernel.dispatch({ type: "align-nodes", nodeIds: ["align-a", "align-b", "align-c"], axis: "right" });
    expect(kernel.getDocument().nodes["align-a"]!.bounds.x).toBe(240);
    expect(kernel.getDocument().nodes["align-b"]!.bounds.x).toBe(240);
    kernel.dispatch({ type: "align-nodes", nodeIds: ["align-a", "align-b", "align-c"], axis: "bottom" });
    expect(kernel.getDocument().nodes["align-b"]!.bounds.y).toBe(300);
    expect(() => kernel.dispatch({ type: "align-nodes", nodeIds: ["align-a"], axis: "left" })).toThrow("DOCUMENT_ALIGN_REQUIRES_TWO");
    expect(() => kernel.dispatch({ type: "align-nodes", nodeIds: ["align-a", "rectangle-foundation"], axis: "left" })).toThrow("DOCUMENT_ALIGN_PARENTS_DIFFER");
    expect(() => kernel.dispatch({ type: "align-nodes", nodeIds: ["align-a", "align-missing"], axis: "left" })).toThrow("DOCUMENT_NODE_MISSING");
  });

  it("covers top and centerX alignment contracts", () => {
    const kernel = createEditorKernel(seed());
    kernel.dispatch({ type: "align-nodes", nodeIds: ["align-a", "align-b", "align-c"], axis: "top" });
    expect(kernel.getDocument().nodes["align-b"]!.bounds.y).toBe(0);
    kernel.dispatch({ type: "align-nodes", nodeIds: ["align-a", "align-b", "align-c"], axis: "centerX" });
    expect(kernel.getDocument().nodes["align-b"]!.bounds.x).toBe(120);
    expect(kernel.getDocument().nodes["align-c"]!.bounds.x).toBe(120);
  });

  it("treats a repeated align as a no-op that records nothing, so one undo restores the original", () => {
    const kernel = createEditorKernel(seed());
    kernel.dispatch({ type: "align-nodes", nodeIds: ["align-a", "align-b", "align-c"], axis: "left" });
    kernel.dispatch({ type: "align-nodes", nodeIds: ["align-a", "align-b", "align-c"], axis: "left" });
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().nodes["align-b"]!.bounds).toEqual({ x: 240, y: 60, width: 100, height: 80 });
    expect(kernel.undo()).toBe(false);
  });
});

describe("distribute-nodes and move-nodes", () => {
  const rectangle = (id: string, parentId: string, x: number, y: number, width = 10, height = 10): DocumentNode => ({ id, kind: "rectangle", name: id, parentId, childIds: [], bounds: { x, y, width, height }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, visible: true, locked: false, opacity: 1, fill: "#fff", stroke: "#000", cornerRadius: 0, zIndex: 0 });
  const seed = (): EditorDocument => {
    const document = createFoundationDocument();
    const root = document.nodes["page-root-home"]!;
    return { ...document, nodes: { ...document.nodes, [root.id]: { ...root, childIds: [...root.childIds, "d-a", "d-b", "d-c"] }, "d-a": rectangle("d-a", root.id, 100, 0), "d-b": rectangle("d-b", root.id, 0, 20), "d-c": rectangle("d-c", root.id, 40, 40) } };
  };

  it("distributes by centre order and restores exact bounds", () => {
    const kernel = createEditorKernel(seed());
    const before = structuredClone(kernel.getDocument());
    kernel.dispatch({ type: "distribute-nodes", nodeIds: ["d-a", "d-b", "d-c"], axis: "horizontal" });
    expect(kernel.getDocument().nodes["d-a"]!.bounds.x).toBe(100);
    expect(kernel.getDocument().nodes["d-b"]!.bounds.x).toBe(0);
    expect(kernel.getDocument().nodes["d-c"]!.bounds.x).toBe(50);
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().nodes).toEqual(before.nodes);
  });

  it("moves nodes with a finite delta and rejects non-finite values", () => {
    const kernel = createEditorKernel(seed());
    kernel.dispatch({ type: "move-nodes", nodeIds: ["d-a", "d-b"], delta: { dx: 5, dy: -3 } });
    expect(kernel.getDocument().nodes["d-a"]!.bounds).toEqual({ x: 105, y: -3, width: 10, height: 10 });
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().nodes["d-a"]!.bounds.x).toBe(100);
    expect(() => kernel.dispatch({ type: "move-nodes", nodeIds: ["d-a"], delta: { dx: Number.NaN, dy: 0 } })).toThrow("DOCUMENT_MOVE_DELTA_INVALID");
  });

  it("computes a live selection union and skips missing ids", () => {
    const document = seed();
    expect(selectionUnionBounds(document, "page-home", ["d-a", "missing", "d-b"])).toEqual({ x: 0, y: 0, width: 110, height: 30 });
    expect(selectionUnionBounds(document, "page-home", [])).toBeUndefined();
  });
});

describe("selection identifiers", () => {
  it("keeps hover ephemeral and clears it when selection changes", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.setHovered("rectangle-foundation");
    expect(kernel.getState().hoveredId).toBe("rectangle-foundation");
    const serialized = kernel.serialize();
    expect(serialized).not.toContain("hoveredId");
    kernel.setSelection(["rectangle-foundation"]);
    expect(kernel.getState().hoveredId).toBeUndefined();
    kernel.setHovered("missing");
    expect(kernel.getState().hoveredId).toBeUndefined();
  });
});
