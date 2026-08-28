import type { DocumentNode, EditorDocument, PageCanvas, PathGeometry, Rect } from "@crafty/editor/kernel";

/**
 * The loss-list fixture: a deterministic, current-schema (v3) document that
 * exercises everything the legacy `Scene` format dropped — page canvas state
 * (grid, rulers, guides, snap, rest camera), components, instances, library
 * references, variables, locked nodes, node metadata and path geometry.
 *
 * Generated code: fixed ids, no timestamps, no randomness. Every save of this
 * fixture produces byte-identical packages (see loss-list-roundtrip.test.ts,
 * which also locks the canonical bytes as the committed reference).
 *
 * The path geometry is designed so its tight bounding box is exactly the box
 * of its anchor points: every segment's control points — anchors plus handle
 * deltas — stay inside the anchors' box, and a cubic never leaves the hull of
 * its control points, so the bezier extrema are attained at anchors. The
 * validator recomputes the tight bbox (`PATH_BOUNDS_TOLERANCE`), so the
 * fixture derives its node bounds from the same math instead of
 * hand-approximating.
 */
const identity = (): DocumentNode["transform"] => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });

const node = (partial: Partial<DocumentNode> & Pick<DocumentNode, "id" | "kind" | "name" | "parentId" | "childIds" | "bounds">): DocumentNode => ({
  transform: identity(),
  visible: true,
  locked: false,
  opacity: 1,
  fill: "#1f2430",
  stroke: "#3b4252",
  cornerRadius: 0,
  zIndex: 0,
  ...partial
});

const pathBoundsOf = (geometry: PathGeometry): Rect => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of Object.values(geometry.points)) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return { x: 0, y: 0, width: maxX - minX, height: maxY - minY };
};

const pathGeometry = (): PathGeometry => ({
  points: {
    "path-point-a": { id: "path-point-a", subpathId: "subpath-triangle", order: "00000000", x: 0, y: 0, handleMode: "corner" },
    "path-point-b": { id: "path-point-b", subpathId: "subpath-triangle", order: "00000001", x: 60, y: 0, handleMode: "corner" },
    "path-point-c": { id: "path-point-c", subpathId: "subpath-triangle", order: "00000002", x: 30, y: 48, handleMode: "corner" },
    "path-point-d": { id: "path-point-d", subpathId: "subpath-inset", order: "00000003", x: 15, y: 12, handleMode: "free", handleIn: { dx: -6, dy: -4 }, handleOut: { dx: 8, dy: -6 } },
    "path-point-e": { id: "path-point-e", subpathId: "subpath-inset", order: "00000004", x: 45, y: 36, handleMode: "asymmetric", handleIn: { dx: -8, dy: -6 }, handleOut: { dx: 6, dy: -10 } }
  },
  subpaths: {
    "subpath-triangle": { id: "subpath-triangle", closed: true },
    "subpath-inset": { id: "subpath-inset", closed: false }
  },
  fillRule: "evenodd"
});

const homeCanvas = (): PageCanvas => ({
  rest: { panX: 140, panY: -90, zoom: 1.6 },
  grid: { mode: "dots", majorSpacing: 24, minorStep: 4, originX: 12, originY: -8, visible: true },
  rulers: { showRulers: false, unit: "cm" },
  guides: [
    { id: "guide-home-x", axis: "x", position: 320, visible: true },
    { id: "guide-home-y", axis: "y", position: 180, visible: false }
  ],
  snap: { grid: false, guides: true, objects: false, pixel: true }
});

const detailCanvas = (): PageCanvas => ({
  rest: { panX: -40, panY: 60, zoom: 0.75 },
  grid: { mode: "lines", majorSpacing: 64, minorStep: 8, originX: 32, originY: 16, visible: true },
  rulers: { showRulers: true, unit: "pt" },
  guides: [{ id: "guide-detail-x", axis: "x", position: 96, visible: true }],
  snap: { grid: true, guides: false, objects: true, pixel: false }
});

export const createLossListDocument = (): EditorDocument => {
  const pathBlobGeometry = pathGeometry();
  const pathBlobBounds = pathBoundsOf(pathBlobGeometry);
  const iconRoot = node({ id: "component-root-icon", kind: "frame", name: "Icon definition", parentId: null, childIds: ["component-icon-shape"], bounds: { x: 0, y: 0, width: 32, height: 32 }, fill: "transparent", stroke: "transparent", zIndex: 0 });
  const iconShape = node({ id: "component-icon-shape", kind: "rectangle", name: "Icon shape", parentId: "component-root-icon", childIds: [], bounds: { x: 4, y: 4, width: 24, height: 24 }, fill: "#ffffff", stroke: "transparent", cornerRadius: 6, zIndex: 0 });
  const buttonRoot = node({ id: "component-root-button", kind: "frame", name: "Button template", parentId: null, childIds: ["button-icon-instance"], bounds: { x: 0, y: 0, width: 220, height: 64 }, fill: "#10b981", stroke: "#a7f3d0", cornerRadius: 12, zIndex: 0 });
  const buttonIcon = node({ id: "button-icon-instance", kind: "frame", name: "Button icon", parentId: "component-root-button", childIds: [], bounds: { x: 16, y: 16, width: 32, height: 32 }, fill: "transparent", stroke: "transparent", zIndex: 0 });
  const nodes: Record<string, DocumentNode> = {
    "component-root-icon": iconRoot,
    "component-icon-shape": iconShape,
    "component-root-button": buttonRoot,
    "button-icon-instance": buttonIcon,
    "page-root-home": node({ id: "page-root-home", kind: "page-root", name: "Home", parentId: null, childIds: ["frame-main"], bounds: { x: 0, y: 0, width: 1200, height: 800 }, fill: "#111318", stroke: "#2b3039" }),
    "frame-main": node({ id: "frame-main", kind: "frame", name: "Loss list frame", parentId: "page-root-home", childIds: ["text-headline", "rectangle-locked", "rectangle-meta", "group-badge", "frame-instance"], bounds: { x: 60, y: 40, width: 840, height: 560 }, fill: "#202531", stroke: "#566078", cornerRadius: 24, zIndex: 0 }),
    "text-headline": node({ id: "text-headline", kind: "text", name: "Headline", parentId: "frame-main", childIds: [], bounds: { x: 96, y: 72, width: 480, height: 48 }, fill: "#eef4ff", stroke: "#eef4ff", zIndex: 1, text: "The loss list survives" }),
    "rectangle-locked": node({ id: "rectangle-locked", kind: "rectangle", name: "Locked rectangle", parentId: "frame-main", childIds: [], bounds: { x: 96, y: 148, width: 240, height: 132 }, fill: "#f59e0b", stroke: "#fde68a", cornerRadius: 12, locked: true, opacity: 0.6, zIndex: 2 }),
    "rectangle-meta": node({ id: "rectangle-meta", kind: "rectangle", name: "Metadata rectangle", parentId: "frame-main", childIds: [], bounds: { x: 376, y: 148, width: 240, height: 132 }, fill: "#38bdf8", stroke: "#bae6fd", cornerRadius: 12, zIndex: 3, metadata: { designerNote: "loss list fixture", approved: true } }),
    "group-badge": node({ id: "group-badge", kind: "group", name: "Badge group", parentId: "frame-main", childIds: ["path-blob"], bounds: { x: 96, y: 312, width: 520, height: 132 }, fill: "transparent", stroke: "transparent", zIndex: 4 }),
    "path-blob": node({ id: "path-blob", kind: "path", name: "Blob path", parentId: "group-badge", childIds: [], bounds: { x: 40, y: 40, width: pathBlobBounds.width, height: pathBlobBounds.height }, fill: "#a78bfa", stroke: "#4c1d95", cornerRadius: 0, zIndex: 0, path: pathBlobGeometry }),
    "frame-instance": node({ id: "frame-instance", kind: "frame", name: "Button instance", parentId: "frame-main", childIds: [], bounds: { x: 96, y: 476, width: 220, height: 64 }, fill: "#10b981", stroke: "#a7f3d0", cornerRadius: 12, zIndex: 5 }),
    "page-root-detail": node({ id: "page-root-detail", kind: "page-root", name: "Detail", parentId: null, childIds: ["text-detail", "image-detail", "rectangle-detail"], bounds: { x: 0, y: 0, width: 1024, height: 768 }, fill: "#111318", stroke: "#2b3039" }),
    "text-detail": node({ id: "text-detail", kind: "text", name: "Detail title", parentId: "page-root-detail", childIds: [], bounds: { x: 48, y: 48, width: 400, height: 36 }, fill: "#eef4ff", stroke: "#eef4ff", zIndex: 0, text: "Detail page" }),
    "image-detail": node({ id: "image-detail", kind: "image", name: "Detail image", parentId: "page-root-detail", childIds: [], bounds: { x: 48, y: 104, width: 320, height: 200 }, fill: "#64748b", stroke: "#94a3b8", cornerRadius: 8, zIndex: 1 }),
    "rectangle-detail": node({ id: "rectangle-detail", kind: "rectangle", name: "Hidden detail", parentId: "page-root-detail", childIds: [], bounds: { x: 48, y: 336, width: 200, height: 120 }, fill: "#fb7185", stroke: "#fecdd3", cornerRadius: 8, visible: false, zIndex: 2 })
  };
  return {
    schemaVersion: 5,
    id: "document-loss-list",
    workspace: { id: "workspace-loss-list", name: "Loss list workspace" },
    project: { id: "project-loss-list", name: "Loss list project" },
    file: { id: "file-loss-list", name: "Loss list fixture" },
    pages: {
      "page-home": { id: "page-home", name: "Home", rootId: "page-root-home", canvas: homeCanvas() },
      "page-detail": { id: "page-detail", name: "Detail", rootId: "page-root-detail", canvas: detailCanvas() }
    },
    pageOrder: ["page-home", "page-detail"],
    nodes,
    components: {
      "component-icon": {
        id: "component-icon",
        name: "Icon",
        rootNodeId: "component-root-icon",
        propertyDefinitions: {},
        variants: {},
        states: {}
      },
      "component-button": {
        id: "component-button",
        name: "Button",
        rootNodeId: "component-root-button",
        propertyDefinitions: {
          label: { type: "text", defaultValue: "Press me" },
          enabled: { type: "boolean", defaultValue: true },
          size: { type: "variant", defaultValue: "medium" }
        },
        variants: { primary: { size: "large" }, quiet: { size: "small" } },
        states: { hover: { enabled: true }, disabled: { enabled: false } },
        surfaceId: "surface-button"
      }
    },
    instances: {
      "button-icon-instance": { definitionId: "component-icon", properties: {}, overrides: { "component-icon-shape": { opacity: 0.8 } } },
      "frame-instance": {
        definitionId: "component-button",
        properties: { label: "Save now", size: "large" },
        overrides: { "component-root-button": { fill: "#4ade80" }, "button-icon-instance": { opacity: 0.9 } }
      }
    },
    libraries: [
      { libraryId: "library-crafty-tokens", version: "1.2.3", integrity: "sha256-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", status: "resolved" }
    ],
    variables: {
      "var-accent": { type: "color", value: "#6366f1" },
      "var-radius": { type: "number", value: 12 },
      "var-tagline": { type: "string", value: "authored, never resolved" },
      "var-bold": { type: "boolean", value: true }
    },
    metadata: { authoring: "loss-list-fixture", purpose: "round-trip and migration test matrix" },
    surfaces: {
      "surface-button": { id: "surface-button", nodeId: "component-root-button", role: "component", behaviorVersion: 1 }
    },
    semanticRelations: {}
  };
};
