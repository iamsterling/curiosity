import { WORLD_LIMIT, ZOOM_MAX, ZOOM_MIN } from "./coordinates.js";
import { computePathBounds, isValidOrderKey } from "./path-geometry.js";
import { validateComponentGraph } from "./component-resolution.js";

export const EDITOR_DOCUMENT_SCHEMA_VERSION = 5 as const;
export const EDITOR_DOCUMENT_SCHEMA_V1 = 1 as const;
export const EDITOR_DOCUMENT_SCHEMA_V2 = 2 as const;
export const EDITOR_DOCUMENT_SCHEMA_V3 = 3 as const;
export const EDITOR_DOCUMENT_SCHEMA_V4 = 4 as const;

export type DocumentId = string;
export type NodeKind = "page-root" | "frame" | "group" | "rectangle" | "text" | "image" | "path" | "compound";
export type CompoundOperation = "union" | "intersect" | "subtract" | "exclude";
export type GuideAxis = "x" | "y";
export type RulerUnit = "px" | "pt" | "cm" | "in";
export type PointId = string;
export type SubpathId = string;
export type OrderKey = string;
export type PathHandleMode = "corner" | "free" | "asymmetric" | "mirrored" | "auto";
export type PathFillRule = "nonzero" | "evenodd";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AffineTransform {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/**
 * A handle is a tangent delta relative to its anchor — never an absolute
 * position — so moving an anchor moves its handles for free and
 * `reverse-subpath` (which swaps in/out) is payload-free. `mirrored` stores
 * only `handleOut`; `handleIn` is derived as its exact negation, so the mode
 * cannot drift into a state validation rejects. `corner` stores neither.
 */
export interface PathHandle {
  dx: number;
  dy: number;
}

export interface PathPoint {
  id: PointId;
  subpathId: SubpathId;
  order: OrderKey;
  x: number;
  y: number;
  handleMode: PathHandleMode;
  handleIn?: PathHandle;
  handleOut?: PathHandle;
}

/**
 * A subpath is an identity plus closure; membership and order live on the
 * points (`subpathId` + fractional `order` key), so inserting a point writes
 * exactly one record and never renumbers its neighbours.
 */
export interface PathSubpath {
  id: SubpathId;
  closed: boolean;
}

export interface PathGeometry {
  points: Record<PointId, PathPoint>;
  subpaths: Record<SubpathId, PathSubpath>;
  fillRule: PathFillRule;
}

/**
 * An authored glass fill: the node's surface samples the scene content drawn
 * before it — blurred to `blurRadius` (world units, converted to device
 * pixels at render time), tinted, saturation-adjusted, refraction-offset.
 * Reference plus intent — the resolved backdrop is renderer state, never
 * written back into the document.
 */
export interface GlassFill {
  kind: "glass";
  blurRadius: number;
  tint: string;
  tintOpacity: number;
  saturation: number;
  refraction?: number;
}

export const LAYOUT_BEHAVIOR_MODEL = "crafty-flex" as const;
export const LAYOUT_BEHAVIOR_VERSION = 1 as const;

export interface LayoutBehavior {
  model: typeof LAYOUT_BEHAVIOR_MODEL;
  version: typeof LAYOUT_BEHAVIOR_VERSION;
}

export interface LayoutEdges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AutoLayout {
  behavior: LayoutBehavior;
  direction: "horizontal" | "vertical";
  wrap: boolean;
  padding: LayoutEdges;
  gap: { row: number; column: number };
  primaryAlign: "start" | "center" | "end" | "space-between";
  counterAlign: "start" | "center" | "end";
}

export interface LayoutSizing {
  horizontal: "fixed" | "hug" | "fill";
  vertical: "fixed" | "hug" | "fill";
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface DocumentNodeBase {
  id: DocumentId;
  name: string;
  parentId: DocumentId | null;
  childIds: DocumentId[];
  bounds: Rect;
  transform: AffineTransform;
  visible: boolean;
  locked: boolean;
  opacity: number;
  fill: string | GlassFill;
  stroke: string;
  cornerRadius: number;
  zIndex: number;
  path?: PathGeometry;
  compound?: Compound;
  autoLayout?: AutoLayout;
  sizing?: LayoutSizing;
  layoutPosition?: "flow" | "absolute";
  metadata?: Record<string, unknown>;
}

/** The current canonical node representation: text has exactly one owner. */
export type DocumentNode =
  | (DocumentNodeBase & { kind: "text"; text: string })
  | (DocumentNodeBase & { kind: Exclude<NodeKind, "text">; text?: never });

/** Historical source-schema shape; validation owns its untrusted `text` value. */
export interface HistoricalDocumentNode extends DocumentNodeBase {
  kind: NodeKind;
  text?: unknown;
}

export interface ViewportRest {
  panX: number;
  panY: number;
  zoom: number;
}

export interface GridDescriptor {
  mode: "lines" | "dots";
  majorSpacing: number;
  minorStep: number;
  originX: number;
  originY: number;
  visible?: boolean;
}

export interface RulerSettings {
  showRulers: boolean;
  unit: RulerUnit;
}

export interface GuideRecord {
  id: DocumentId;
  axis: GuideAxis;
  position: number;
  visible: boolean;
}

export interface SnapSettings {
  grid: boolean;
  guides: boolean;
  objects: boolean;
  pixel: boolean;
}

export interface PageCanvas {
  rest: ViewportRest;
  grid: GridDescriptor;
  rulers: RulerSettings;
  guides: GuideRecord[];
  snap: SnapSettings;
}

export interface PageRecord {
  id: DocumentId;
  name: string;
  rootId: DocumentId;
  canvas: PageCanvas;
}

export interface PageRecordV1 {
  id: DocumentId;
  name: string;
  rootId: DocumentId;
}

export interface LibraryReference {
  libraryId: DocumentId;
  version: string;
  integrity: string;
  status: "resolved" | "missing" | "stale";
}

export interface ComponentDefinition {
  id: DocumentId;
  name: string;
  rootNodeId: DocumentId;
  propertyDefinitions: Record<string, { type: "boolean" | "text" | "variant"; defaultValue: string | boolean }>;
  variants: Record<string, Record<string, string | boolean>>;
  states: Record<string, Record<string, string | boolean>>;
  surfaceId?: DocumentId;
}

export interface ComponentInstance {
  definitionId: DocumentId;
  properties: Record<string, string | boolean>;
  overrides: Record<DocumentId, Record<string, unknown>>;
}

export type SemanticSurfaceRole = "freeform" | "screen" | "layout" | "component" | "overlay";
export const SEMANTIC_SURFACE_BEHAVIOR_VERSION = 1 as const;
export type SemanticBindingTarget = "nextjs" | "swiftui" | "compose" | "custom";
export type SemanticRelationKind = "outlet" | "slot" | "link";

export interface SemanticSurface {
  id: DocumentId;
  nodeId: DocumentId;
  role: SemanticSurfaceRole;
  behaviorVersion: typeof SEMANTIC_SURFACE_BEHAVIOR_VERSION;
  route?: { id: DocumentId; path: string };
  binding?: { target: SemanticBindingTarget; reference: string };
}

export interface SemanticRelation {
  id: DocumentId;
  kind: SemanticRelationKind;
  sourceNodeId: DocumentId;
  targetNodeId?: DocumentId;
  targetSurfaceId?: DocumentId;
  name?: string;
}

/**
 * The authored compound record (the `vector-editing` change, section 5): the
 * non-destructive boolean group. The record carries ONLY the operation — the
 * members are the node's ordered `childIds` (subtract/exclude read the
 * order). The merged outline is a resolution product, never written back;
 * the node's `bounds` are DERIVED from that outline and recomputed by the
 * commands whenever members or the operation change.
 */
export interface Compound {
  operation: CompoundOperation;
}

export interface EditorDocumentV1 {
  schemaVersion: typeof EDITOR_DOCUMENT_SCHEMA_V1;
  id: DocumentId;
  workspace: { id: DocumentId; name: string };
  project: { id: DocumentId; name: string };
  file: { id: DocumentId; name: string };
  pages: Record<DocumentId, PageRecordV1>;
  pageOrder: DocumentId[];
  nodes: Record<DocumentId, HistoricalDocumentNode>;
  components: Record<DocumentId, ComponentDefinition>;
  instances: Record<DocumentId, ComponentInstance>;
  libraries: LibraryReference[];
  variables: Record<string, { type: "color" | "number" | "string" | "boolean"; value: string | number | boolean }>;
  metadata: Record<string, unknown>;
}

export interface EditorDocument {
  schemaVersion: typeof EDITOR_DOCUMENT_SCHEMA_VERSION;
  id: DocumentId;
  workspace: { id: DocumentId; name: string };
  project: { id: DocumentId; name: string };
  file: { id: DocumentId; name: string };
  pages: Record<DocumentId, PageRecord>;
  pageOrder: DocumentId[];
  nodes: Record<DocumentId, DocumentNode>;
  components: Record<DocumentId, ComponentDefinition>;
  instances: Record<DocumentId, ComponentInstance>;
  libraries: LibraryReference[];
  variables: Record<string, { type: "color" | "number" | "string" | "boolean"; value: string | number | boolean }>;
  metadata: Record<string, unknown>;
  surfaces: Record<DocumentId, SemanticSurface>;
  semanticRelations: Record<DocumentId, SemanticRelation>;
}

export type EditorDocumentV2 = Omit<EditorDocumentV1, "schemaVersion" | "pages"> & { schemaVersion: typeof EDITOR_DOCUMENT_SCHEMA_V2; pages: Record<DocumentId, PageRecord> };
export type EditorDocumentV3 = Omit<EditorDocumentV2, "schemaVersion"> & { schemaVersion: typeof EDITOR_DOCUMENT_SCHEMA_V3 };
export type EditorDocumentV4 = Omit<EditorDocumentV3, "schemaVersion"> & { schemaVersion: typeof EDITOR_DOCUMENT_SCHEMA_V4; surfaces: Record<DocumentId, SemanticSurface>; semanticRelations: Record<DocumentId, SemanticRelation> };

export const createDefaultPageCanvas = (): PageCanvas => ({
  rest: { panX: 0, panY: 0, zoom: 1 },
  grid: { mode: "lines", majorSpacing: 40, minorStep: 5, originX: 0, originY: 0, visible: false },
  rulers: { showRulers: true, unit: "px" },
  guides: [],
  snap: { grid: true, guides: true, objects: true, pixel: true }
});

export interface ValidationDiagnostic {
  code: "DOCUMENT_INVALID" | "DOCUMENT_TEXT_VALUE_INVALID" | "DOCUMENT_TEXT_KIND_INVALID" | "DOCUMENT_DUPLICATE_ID" | "DOCUMENT_PARENT_MISMATCH" | "DOCUMENT_CYCLE" | "DOCUMENT_REFERENCE_MISSING" | "DOCUMENT_UNSUPPORTED_SCHEMA" | "DOCUMENT_PAGE_MISSING" | "COMPONENT_DEFINITION_INVALID" | "COMPONENT_ROOT_INVALID" | "COMPONENT_INSTANCE_INVALID" | "COMPONENT_OVERRIDE_INVALID" | `COMPONENT_ROOT_MISSING:${string}` | `COMPONENT_DEFINITION_MISSING:${string}` | `COMPONENT_SURFACE_INVALID:${string}` | `COMPONENT_DEPENDENCY_CYCLE:${string}` | `COMPONENT_PROPERTY_INVALID` | `COMPONENT_OVERRIDE_UNSUPPORTED:${string}` | `COMPONENT_OVERRIDE_ORPHANED:${string}` | `LAYOUT_INVALID:${string}` | `LAYOUT_UNSUPPORTED:${string}` | `LAYOUT_UNSUPPORTED_VERSION:${string}` | `SEMANTIC_INVALID:${string}` | `SEMANTIC_UNSUPPORTED_VERSION:${string}`;
  path: string;
  message: string;
}

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  diagnostics: ValidationDiagnostic[];
}

const identity = (): AffineTransform => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const diagnostic = (code: ValidationDiagnostic["code"], path: string, message: string): ValidationResult<never> => ({ ok: false, diagnostics: [{ code, path, message }] });

/** The authored hex vocabulary — `#rrggbb`, the same shape `Scene` hex uses. */
const HEX_COLOR = /^#[0-9a-f]{6}$/iu;

/**
 * The first failing field of a glass fill, as a stable machine code
 * (`FILL_GLASS_INVALID:<field>`), or undefined when the value is a valid
 * glass fill. The single source of glass-field truth: document validation and
 * clipboard validation both call this, so the two can never drift.
 */
export const glassFillError = (value: unknown): string | undefined => {
  if (!record(value) || value.kind !== "glass") return "FILL_GLASS_INVALID:kind";
  if (!finite(value.blurRadius) || value.blurRadius < 0) return "FILL_GLASS_INVALID:blurRadius";
  if (typeof value.tint !== "string" || !HEX_COLOR.test(value.tint)) return "FILL_GLASS_INVALID:tint";
  if (!finite(value.tintOpacity) || value.tintOpacity < 0 || value.tintOpacity > 1) return "FILL_GLASS_INVALID:tintOpacity";
  if (!finite(value.saturation) || value.saturation < 0) return "FILL_GLASS_INVALID:saturation";
  if (value.refraction !== undefined && (!finite(value.refraction) || value.refraction < 0 || value.refraction > 1)) return "FILL_GLASS_INVALID:refraction";
  return undefined;
};

export const isGlassFill = (value: unknown): value is GlassFill => glassFillError(value) === undefined;

/**
 * The accepted node-kind set is a schema-version property, not a global: a
 * v1 document containing a `path` (or `image`) node must fail, because those
 * kinds did not exist at v1. The set is threaded through validation exactly
 * as the page validator already is.
 */
export const NODE_KINDS_V1: ReadonlySet<NodeKind> = new Set(["page-root", "frame", "group", "rectangle", "text"]);
export const NODE_KINDS_V2: ReadonlySet<NodeKind> = new Set([...NODE_KINDS_V1, "image"]);
// `compound` joins v3 additively: new values only appear when authored, so no
// schema bump and no migration — a v2 reader rejects a compound document at
// its own kind set, exactly like `path`.
export const NODE_KINDS_V3: ReadonlySet<NodeKind> = new Set([...NODE_KINDS_V2, "path", "compound"]);

export const PATH_BOUNDS_TOLERANCE = 1e-6 as const;

const firstUnknownKey = (value: Record<string, unknown>, allowed: ReadonlySet<string>): string | undefined => Object.keys(value).find((key) => !allowed.has(key));

const validateAutoLayout = (value: unknown, path: string): ValidationResult<AutoLayout> => {
  if (!record(value)) return diagnostic("LAYOUT_INVALID:autoLayout", path, "Auto layout must be a record.");
  const unknown = firstUnknownKey(value, new Set(["behavior", "direction", "wrap", "padding", "gap", "primaryAlign", "counterAlign"]));
  if (unknown) return diagnostic(`LAYOUT_UNSUPPORTED:${unknown}`, `${path}.${unknown}`, "Unsupported layout property.");
  if (!record(value.behavior) || value.behavior.model !== LAYOUT_BEHAVIOR_MODEL || value.behavior.version !== LAYOUT_BEHAVIOR_VERSION) {
    const version = record(value.behavior) ? `${String(value.behavior.model)}@${String(value.behavior.version)}` : "missing";
    return diagnostic(`LAYOUT_UNSUPPORTED_VERSION:${version}`, `${path}.behavior`, "Unknown layout behavior model or version.");
  }
  if (value.direction !== "horizontal" && value.direction !== "vertical") return diagnostic("LAYOUT_INVALID:direction", `${path}.direction`, "Unknown flow direction.");
  if (typeof value.wrap !== "boolean") return diagnostic("LAYOUT_INVALID:wrap", `${path}.wrap`, "Wrap must be a boolean.");
  if (!record(value.padding)) return diagnostic("LAYOUT_INVALID:padding", `${path}.padding`, "Padding must be a four-sided record.");
  const paddingUnknown = firstUnknownKey(value.padding, new Set(["top", "right", "bottom", "left"]));
  if (paddingUnknown) return diagnostic(`LAYOUT_UNSUPPORTED:padding.${paddingUnknown}`, `${path}.padding.${paddingUnknown}`, "Unsupported padding property.");
  for (const edge of ["top", "right", "bottom", "left"] as const) if (!finite(value.padding[edge]) || value.padding[edge] < 0) return diagnostic(`LAYOUT_INVALID:padding.${edge}`, `${path}.padding.${edge}`, "Padding must be finite and non-negative.");
  if (!record(value.gap)) return diagnostic("LAYOUT_INVALID:gap", `${path}.gap`, "Gap must contain row and column values.");
  const gapUnknown = firstUnknownKey(value.gap, new Set(["row", "column"]));
  if (gapUnknown) return diagnostic(`LAYOUT_UNSUPPORTED:gap.${gapUnknown}`, `${path}.gap.${gapUnknown}`, "Unsupported gap property.");
  for (const axis of ["row", "column"] as const) if (!finite(value.gap[axis]) || value.gap[axis] < 0) return diagnostic(`LAYOUT_INVALID:gap.${axis}`, `${path}.gap.${axis}`, "Gap must be finite and non-negative.");
  if (value.primaryAlign !== "start" && value.primaryAlign !== "center" && value.primaryAlign !== "end" && value.primaryAlign !== "space-between") return diagnostic("LAYOUT_INVALID:primaryAlign", `${path}.primaryAlign`, "Unknown main-axis alignment.");
  if (value.counterAlign !== "start" && value.counterAlign !== "center" && value.counterAlign !== "end") return diagnostic("LAYOUT_INVALID:counterAlign", `${path}.counterAlign`, "Unknown cross-axis alignment.");
  return { ok: true, value: value as unknown as AutoLayout, diagnostics: [] };
};

const validateLayoutSizing = (value: unknown, path: string): ValidationResult<LayoutSizing> => {
  if (!record(value)) return diagnostic("LAYOUT_INVALID:sizing", path, "Sizing must be a record.");
  const unknown = firstUnknownKey(value, new Set(["horizontal", "vertical", "minWidth", "minHeight", "maxWidth", "maxHeight"]));
  if (unknown) return diagnostic(`LAYOUT_UNSUPPORTED:${unknown}`, `${path}.${unknown}`, "Unsupported sizing property.");
  for (const axis of ["horizontal", "vertical"] as const) if (value[axis] !== "fixed" && value[axis] !== "hug" && value[axis] !== "fill") return diagnostic(`LAYOUT_INVALID:${axis}`, `${path}.${axis}`, "Unknown sizing mode.");
  for (const field of ["minWidth", "minHeight", "maxWidth", "maxHeight"] as const) if (value[field] !== undefined && (!finite(value[field]) || value[field] < 0)) return diagnostic(`LAYOUT_INVALID:${field}`, `${path}.${field}`, "Size constraint must be finite and non-negative.");
  if (finite(value.minWidth) && finite(value.maxWidth) && value.minWidth > value.maxWidth) return diagnostic("LAYOUT_INVALID:minWidth", `${path}.minWidth`, "Minimum width cannot exceed maximum width.");
  if (finite(value.minHeight) && finite(value.maxHeight) && value.minHeight > value.maxHeight) return diagnostic("LAYOUT_INVALID:minHeight", `${path}.minHeight`, "Minimum height cannot exceed maximum height.");
  return { ok: true, value: value as unknown as LayoutSizing, diagnostics: [] };
};

const semanticRoles = new Set<SemanticSurfaceRole>(["freeform", "screen", "layout", "component", "overlay"]);
const relationKinds = new Set<SemanticRelationKind>(["outlet", "slot", "link"]);
const bindingTargets = new Set<SemanticBindingTarget>(["nextjs", "swiftui", "compose", "custom"]);
const routePattern = /^\/(?:[A-Za-z0-9._~:@!$&'()*+,;=%-]+|\{[A-Za-z0-9._-]+\})(?:\/(?:[A-Za-z0-9._~:@!$&'()*+,;=%-]+|\{[A-Za-z0-9._-]+\}))*$|^\/$/u;

const validateSemanticRecords = (input: Record<string, unknown>, nodes: Record<string, DocumentNode>, path: string): ValidationResult<true> => {
  const surfaces = input.surfaces;
  const relations = input.semanticRelations;
  if (!record(surfaces) || !record(relations)) return diagnostic("SEMANTIC_INVALID:registries", path, "Semantic surface and relation registries are required.");
  const surfaceByNode = new Set<string>();
  const routes = new Set<string>();
  const routeIds = new Set<string>();
  for (const [id, value] of Object.entries(surfaces)) {
    if (!record(value) || value.id !== id || typeof value.nodeId !== "string" || !nodes[value.nodeId]) return diagnostic("SEMANTIC_INVALID:surface", `${path}.surfaces.${id}`, "A surface must identify an existing node and matching id.");
    const surfaceUnknown = firstUnknownKey(value, new Set(["id", "nodeId", "role", "behaviorVersion", "route", "binding"]));
    if (surfaceUnknown) return diagnostic("SEMANTIC_INVALID:unknown-key", `${path}.surfaces.${id}.${surfaceUnknown}`, "Unsupported semantic surface property.");
    const node = nodes[value.nodeId];
    if (node?.kind !== "frame") return diagnostic("SEMANTIC_INVALID:surface-node", `${path}.surfaces.${id}.nodeId`, "Semantic surfaces may only reference frame nodes.");
    if (surfaceByNode.has(value.nodeId)) return diagnostic("SEMANTIC_INVALID:duplicate-node-surface", `${path}.surfaces.${id}.nodeId`, "A frame may have only one semantic surface.");
    surfaceByNode.add(value.nodeId);
    if (!semanticRoles.has(value.role as SemanticSurfaceRole)) return diagnostic("SEMANTIC_INVALID:role", `${path}.surfaces.${id}.role`, "Unknown semantic surface role.");
    if (value.behaviorVersion !== SEMANTIC_SURFACE_BEHAVIOR_VERSION) return diagnostic(`SEMANTIC_UNSUPPORTED_VERSION:${String(value.behaviorVersion)}`, `${path}.surfaces.${id}.behaviorVersion`, "Unknown semantic surface behavior version.");
    if (value.route !== undefined) {
      const route = value.route;
      if (!record(route) || typeof route.id !== "string" || !route.id || typeof route.path !== "string" || !routePattern.test(route.path) || route.path.includes("//")) return diagnostic("SEMANTIC_INVALID:route", `${path}.surfaces.${id}.route`, "Route intent must be a normalized absolute path pattern.");
      const routeUnknown = firstUnknownKey(route, new Set(["id", "path"]));
      if (routeUnknown) return diagnostic("SEMANTIC_INVALID:unknown-key", `${path}.surfaces.${id}.route.${routeUnknown}`, "Unsupported route property.");
      if (value.role !== "screen") return diagnostic("SEMANTIC_INVALID:route-role", `${path}.surfaces.${id}.route`, "Only screen surfaces may declare route intent.");
      if (routes.has(route.path)) return diagnostic("SEMANTIC_INVALID:duplicate-route", `${path}.surfaces.${id}.route.path`, "Route paths must be unique within a document.");
      if (routeIds.has(route.id)) return diagnostic("SEMANTIC_INVALID:duplicate-route-id", `${path}.surfaces.${id}.route.id`, "Route ids must be unique within a document.");
      routes.add(route.path);
      routeIds.add(route.id);
    }
    if (value.binding !== undefined) {
      if (!record(value.binding)) return diagnostic("SEMANTIC_INVALID:binding", `${path}.surfaces.${id}.binding`, "A binding requires a known target and non-empty reference.");
      const bindingUnknown = firstUnknownKey(value.binding, new Set(["target", "reference"]));
      if (bindingUnknown) return diagnostic("SEMANTIC_INVALID:unknown-key", `${path}.surfaces.${id}.binding.${bindingUnknown}`, "Unsupported binding property.");
      if (!bindingTargets.has(value.binding.target as SemanticBindingTarget) || typeof value.binding.reference !== "string" || value.binding.reference.length === 0) return diagnostic("SEMANTIC_INVALID:binding", `${path}.surfaces.${id}.binding`, "A binding requires a known target and non-empty reference.");
    }
  }
  for (const [id, value] of Object.entries(relations)) {
    if (!record(value) || value.id !== id || typeof value.sourceNodeId !== "string" || !nodes[value.sourceNodeId] || !relationKinds.has(value.kind as SemanticRelationKind)) return diagnostic("SEMANTIC_INVALID:relation", `${path}.semanticRelations.${id}`, "A relation requires a known kind, matching id, and existing source node.");
    const relationUnknown = firstUnknownKey(value, new Set(["id", "kind", "sourceNodeId", "targetNodeId", "targetSurfaceId", "name"]));
    if (relationUnknown) return diagnostic("SEMANTIC_INVALID:unknown-key", `${path}.semanticRelations.${id}.${relationUnknown}`, "Unsupported semantic relation property.");
    const hasNode = typeof value.targetNodeId === "string";
    const hasSurface = typeof value.targetSurfaceId === "string";
    const targetNodeId = hasNode ? String(value.targetNodeId) : undefined;
    const targetSurfaceId = hasSurface ? String(value.targetSurfaceId) : undefined;
    if ((value.kind === "link" && (!hasSurface || hasNode)) || ((value.kind === "outlet" || value.kind === "slot") && (!hasNode || hasSurface))) return diagnostic("SEMANTIC_INVALID:relation-target", `${path}.semanticRelations.${id}`, "Relation target shape does not match its kind.");
    if (targetNodeId && !nodes[targetNodeId]) return diagnostic("SEMANTIC_INVALID:relation-target-node", `${path}.semanticRelations.${id}.targetNodeId`, "Relation target node does not exist.");
    if (targetNodeId && (value.kind === "outlet" || value.kind === "slot") && targetNodeId === value.sourceNodeId) return diagnostic("SEMANTIC_INVALID:relation-cycle", `${path}.semanticRelations.${id}`, "Outlet and slot relations may not target their source node.");
    if (targetSurfaceId && (!surfaces[targetSurfaceId] || (surfaces[targetSurfaceId] as { role?: unknown }).role !== "screen")) return diagnostic("SEMANTIC_INVALID:relation-target-surface", `${path}.semanticRelations.${id}.targetSurfaceId`, "Link target must be an existing screen surface.");
    if (value.name !== undefined && (typeof value.name !== "string" || value.name.length === 0)) return diagnostic("SEMANTIC_INVALID:relation-name", `${path}.semanticRelations.${id}.name`, "Relation names must be non-empty strings.");
  }
  return { ok: true, value: true, diagnostics: [] };
};

const validatePathGeometry = (node: HistoricalDocumentNode, path: string): ValidationResult<PathGeometry> => {
  const geometry = node.path;
  if (!geometry || !record(geometry) || !record(geometry.points) || !record(geometry.subpaths)) return diagnostic("DOCUMENT_INVALID", `${path}.path`, "Path geometry requires points and subpaths records.");
  if (geometry.fillRule !== "nonzero" && geometry.fillRule !== "evenodd") return diagnostic("DOCUMENT_INVALID", `${path}.path.fillRule`, "Fill rule must be 'nonzero' or 'evenodd'.");
  for (const [pointId, point] of Object.entries(geometry.points)) {
    if (!record(point) || point.id !== pointId) return diagnostic("DOCUMENT_INVALID", `${path}.path.points.${pointId}`, "Point map key must match point id.");
    if (typeof point.subpathId !== "string" || !point.subpathId) return diagnostic("DOCUMENT_INVALID", `${path}.path.points.${pointId}.subpathId`, "A point must declare its subpath.");
    if (typeof point.order !== "string" || !isValidOrderKey(point.order)) return diagnostic("DOCUMENT_INVALID", `${path}.path.points.${pointId}.order`, "A point's order key must be a valid fractional key.");
    if (!finite(point.x) || Math.abs(point.x) > WORLD_LIMIT || !finite(point.y) || Math.abs(point.y) > WORLD_LIMIT) return diagnostic("DOCUMENT_INVALID", `${path}.path.points.${pointId}`, "Point coordinates must be finite within the world limit.");
    if (point.handleMode !== "corner" && point.handleMode !== "free" && point.handleMode !== "asymmetric" && point.handleMode !== "mirrored" && point.handleMode !== "auto") return diagnostic("DOCUMENT_INVALID", `${path}.path.points.${pointId}.handleMode`, "Handle mode must be 'corner', 'free', 'asymmetric', 'mirrored' or 'auto'.");
    if (point.handleMode === "corner" && (point.handleIn || point.handleOut)) return diagnostic("DOCUMENT_INVALID", `${path}.path.points.${pointId}`, "A corner point stores no handles.");
    if (point.handleMode === "auto" && (point.handleIn || point.handleOut)) return diagnostic("DOCUMENT_INVALID", `${path}.path.points.${pointId}`, "VECTOR_POINT_AUTO_HANDLES");
    if (point.handleMode === "mirrored") {
      if (point.handleIn) return diagnostic("DOCUMENT_INVALID", `${path}.path.points.${pointId}`, "A mirrored point derives its incoming handle; none may be stored.");
      if (!point.handleOut) return diagnostic("DOCUMENT_INVALID", `${path}.path.points.${pointId}`, "A mirrored point stores its outgoing handle.");
    }
    for (const [handleName, handle] of [["handleIn", point.handleIn], ["handleOut", point.handleOut]] as const) {
      if (handle === undefined) continue;
      if (!record(handle) || !finite(handle.dx) || !finite(handle.dy) || Math.abs(handle.dx) > WORLD_LIMIT || Math.abs(handle.dy) > WORLD_LIMIT) return diagnostic("DOCUMENT_INVALID", `${path}.path.points.${pointId}.${handleName}`, "Handles must be finite anchor-relative deltas within the world limit.");
    }
  }
  for (const [subpathId, subpath] of Object.entries(geometry.subpaths)) {
    if (!record(subpath) || subpath.id !== subpathId) return diagnostic("DOCUMENT_INVALID", `${path}.path.subpaths.${subpathId}`, "Subpath map key must match subpath id.");
    if (typeof subpath.closed !== "boolean") return diagnostic("DOCUMENT_INVALID", `${path}.path.subpaths.${subpathId}.closed`, "Subpath closure must be a boolean.");
  }
  // Referential integrity. Membership lives on the point (a single subpathId
  // field), so a point shared between two subpaths is unrepresentable by
  // construction; what validation must enforce is that every point's subpath
  // exists and every subpath has at least two points.
  for (const point of Object.values(geometry.points)) {
    if (!geometry.subpaths[point.subpathId]) return diagnostic("DOCUMENT_INVALID", `${path}.path.points.${point.id}.subpathId`, "Point references a missing subpath.");
  }
  for (const subpathId of Object.keys(geometry.subpaths)) {
    let count = 0;
    for (const point of Object.values(geometry.points)) if (point.subpathId === subpathId) count += 1;
    if (count < 2) return diagnostic("DOCUMENT_INVALID", `${path}.path.subpaths.${subpathId}`, "A subpath must reference at least two points.");
  }
  // Derived-and-verified bounds: the tight bbox (true bezier extrema), with
  // its minimum corner pinned at (0,0) node-local, written by the command and
  // verified here within tolerance.
  const bbox = computePathBounds(geometry);
  if (Math.abs(bbox.minX) > PATH_BOUNDS_TOLERANCE || Math.abs(bbox.minY) > PATH_BOUNDS_TOLERANCE) return diagnostic("DOCUMENT_INVALID", `${path}.path`, "Path geometry must be rebased so its bounding-box minimum corner is (0,0).");
  if (Math.abs(node.bounds.width - (bbox.maxX - bbox.minX)) > PATH_BOUNDS_TOLERANCE || Math.abs(node.bounds.height - (bbox.maxY - bbox.minY)) > PATH_BOUNDS_TOLERANCE) return diagnostic("DOCUMENT_INVALID", `${path}.bounds`, "Path node bounds must be the tight bounding box of the geometry.");
  return { ok: true, value: geometry, diagnostics: [] };
};

const validateNode = (node: HistoricalDocumentNode, path: string, acceptedKinds: ReadonlySet<NodeKind>, requireText: boolean): ValidationResult<DocumentNode> => {
  const bounds = node.bounds;
  const matrix = node.transform;
  if (!node.id || !node.name || !node.kind || !Array.isArray(node.childIds) || !bounds || !matrix) return diagnostic("DOCUMENT_INVALID", path, "Node identity, kind, children, bounds, and transform are required.");
  const zeroExtentAllowed = node.kind === "path";
  if (![bounds.x, bounds.y, bounds.width, bounds.height, matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f].every(finite) || bounds.width < 0 || bounds.height < 0 || (!zeroExtentAllowed && (bounds.width <= 0 || bounds.height <= 0))) return diagnostic("DOCUMENT_INVALID", `${path}.bounds`, "Node geometry must contain finite dimensions; zero extent is legal for path nodes only (I8).");
  if (typeof node.opacity !== "number" || node.opacity < 0 || node.opacity > 1 || typeof node.visible !== "boolean" || typeof node.locked !== "boolean") return diagnostic("DOCUMENT_INVALID", path, "Node visibility, lock, and opacity values are invalid.");
  if (!acceptedKinds.has(node.kind)) return diagnostic("DOCUMENT_INVALID", `${path}.kind`, "Node kind is not accepted at this schema version.");
  if (Object.prototype.hasOwnProperty.call(node, "text")) {
    if (typeof node.text !== "string") return diagnostic("DOCUMENT_TEXT_VALUE_INVALID", `${path}.text`, "Text must be a string.");
    if (node.kind !== "text") return diagnostic("DOCUMENT_TEXT_KIND_INVALID", `${path}.text`, "Only text nodes may carry text.");
  } else if (requireText && node.kind === "text") {
    return diagnostic("DOCUMENT_TEXT_VALUE_INVALID", `${path}.text`, "Text nodes require text.");
  }
  if (!Number.isSafeInteger(node.zIndex)) return diagnostic("DOCUMENT_INVALID", `${path}.zIndex`, "Node z-order must be a safe integer.");
  if (node.autoLayout !== undefined) {
    if (node.kind !== "frame") return diagnostic("LAYOUT_INVALID:autoLayout", `${path}.autoLayout`, "Only frames may declare auto layout.");
    const layout = validateAutoLayout(node.autoLayout, `${path}.autoLayout`);
    if (!layout.ok) return { ok: false, diagnostics: layout.diagnostics };
  }
  if (node.sizing !== undefined) {
    const sizing = validateLayoutSizing(node.sizing, `${path}.sizing`);
    if (!sizing.ok) return { ok: false, diagnostics: sizing.diagnostics };
  }
  if (node.layoutPosition !== undefined && node.layoutPosition !== "flow" && node.layoutPosition !== "absolute") return diagnostic("LAYOUT_INVALID:layoutPosition", `${path}.layoutPosition`, "Unknown layout participation mode.");
  if (node.fill !== undefined && typeof node.fill !== "string") {
    const fillError = glassFillError(node.fill);
    if (fillError) return diagnostic("DOCUMENT_INVALID", `${path}.fill`, fillError);
    // The composite pass draws glass regions from rect geometry only; a path
    // (or text/group, which have no own surface) cannot be glass — loudly.
    if (node.kind !== "rectangle" && node.kind !== "frame") return diagnostic("DOCUMENT_INVALID", `${path}.fill`, "FILL_GLASS_GEOMETRY_UNSUPPORTED");
  }
  if (node.kind === "path") {
    if (!node.path) return diagnostic("DOCUMENT_INVALID", `${path}.path`, "A path node must carry path geometry.");
    if (node.childIds.length > 0) return diagnostic("DOCUMENT_INVALID", `${path}.childIds`, "A path node is a leaf.");
    const geometry = validatePathGeometry(node, path);
    if (!geometry.ok) return { ok: false, diagnostics: geometry.diagnostics };
  } else if (node.path) {
    return diagnostic("DOCUMENT_INVALID", `${path}.path`, "Only path nodes may carry path geometry.");
  }
  if (node.kind === "compound") {
    // The compound record is authored intent: the operation only. The member
    // set is the ordered `childIds`; the fine codes ride the coarse
    // DOCUMENT_INVALID message (the established pattern), the member-KIND
    // check needs the other nodes and lives in the structure validator.
    const compound = node.compound;
    if (!compound || (compound.operation !== "union" && compound.operation !== "intersect" && compound.operation !== "subtract" && compound.operation !== "exclude")) return diagnostic("DOCUMENT_INVALID", `${path}.compound`, "COMPOUND_OPERATION_INVALID");
    if (node.childIds.length < 2) return diagnostic("DOCUMENT_INVALID", `${path}.compound`, "COMPOUND_MIN_MEMBERS");
  }
  return { ok: true, value: node as DocumentNode, diagnostics: [] };
};

const validatePageCanvas = (canvas: PageCanvas, path: string): ValidationResult<PageCanvas> => {
  if (!record(canvas) || !record(canvas.grid) || !record(canvas.rest) || !record(canvas.rulers) || !record(canvas.snap) || !Array.isArray(canvas.guides)) return diagnostic("DOCUMENT_INVALID", path, "Page canvas records (rest, grid, rulers, guides, snap) are required.");
  const grid = canvas.grid;
  if (grid.mode !== "lines" && grid.mode !== "dots") return diagnostic("DOCUMENT_INVALID", `${path}.grid.mode`, "Grid mode must be 'lines' or 'dots'.");
  if (!finite(grid.majorSpacing) || grid.majorSpacing <= 0) return diagnostic("DOCUMENT_INVALID", `${path}.grid.majorSpacing`, "Grid major spacing must be a finite positive number.");
  if (!Number.isSafeInteger(grid.minorStep) || grid.minorStep < 1) return diagnostic("DOCUMENT_INVALID", `${path}.grid.minorStep`, "Grid minor step must be a positive safe integer.");
  if (!finite(grid.originX) || !finite(grid.originY)) return diagnostic("DOCUMENT_INVALID", `${path}.grid.origin`, "Grid origin must be finite.");
  if (grid.visible !== undefined && typeof grid.visible !== "boolean") return diagnostic("DOCUMENT_INVALID", `${path}.grid.visible`, "Grid visibility must be a boolean.");
  const rest = canvas.rest;
  if (!finite(rest.panX) || Math.abs(rest.panX) > WORLD_LIMIT || !finite(rest.panY) || Math.abs(rest.panY) > WORLD_LIMIT) return diagnostic("DOCUMENT_INVALID", `${path}.rest`, `Rest camera pan must be finite within +/-${WORLD_LIMIT}.`);
  if (!finite(rest.zoom) || rest.zoom < ZOOM_MIN || rest.zoom > ZOOM_MAX) return diagnostic("DOCUMENT_INVALID", `${path}.rest.zoom`, `Rest camera zoom must be within [${ZOOM_MIN}, ${ZOOM_MAX}].`);
  if (typeof canvas.rulers.showRulers !== "boolean" || !(canvas.rulers.unit === "px" || canvas.rulers.unit === "pt" || canvas.rulers.unit === "cm" || canvas.rulers.unit === "in")) return diagnostic("DOCUMENT_INVALID", `${path}.rulers`, "Ruler settings must carry a boolean visibility and a known unit.");
  if (typeof canvas.snap.grid !== "boolean" || typeof canvas.snap.guides !== "boolean" || typeof canvas.snap.objects !== "boolean" || typeof canvas.snap.pixel !== "boolean") return diagnostic("DOCUMENT_INVALID", `${path}.snap`, "Snap settings must be booleans.");
  const guideIds = new Set<string>();
  for (const [index, guide] of canvas.guides.entries()) {
    if (!record(guide) || typeof guide.id !== "string" || !guide.id || (guide.axis !== "x" && guide.axis !== "y") || !finite(guide.position) || Math.abs(guide.position) > WORLD_LIMIT || typeof guide.visible !== "boolean") return diagnostic("DOCUMENT_INVALID", `${path}.guides[${index}]`, "Guide records require an id, axis, finite position within the world limit, and visibility.");
    if (guideIds.has(guide.id)) return diagnostic("DOCUMENT_DUPLICATE_ID", `${path}.guides[${index}]`, `Duplicate guide id '${guide.id}'.`);
    guideIds.add(guide.id);
  }
  return { ok: true, value: canvas, diagnostics: [] };
};

const validatePageV1 = (page: PageRecordV1, path: string): ValidationResult<PageRecordV1> => {
  if (!record(page) || typeof page.id !== "string" || typeof page.name !== "string" || typeof page.rootId !== "string") return diagnostic("DOCUMENT_INVALID", path, "Page identity, name, and root reference are required.");
  return { ok: true, value: page, diagnostics: [] };
};

interface DocumentShape {
  pages: Record<string, unknown>;
  pageOrder: string[];
  nodes: Record<string, HistoricalDocumentNode>;
}

const validateDocumentStructure = (
  input: unknown,
  expectedVersion: number,
  validatePage: (page: unknown, path: string) => ValidationResult<unknown>,
  acceptedKinds: ReadonlySet<NodeKind>,
  semanticRequired = false,
  requireText = false,
): ValidationResult<DocumentShape> => {
  if (!record(input) || input.schemaVersion !== expectedVersion || typeof input.id !== "string" || !record(input.pages) || !record(input.nodes) || !Array.isArray(input.pageOrder)) return diagnostic("DOCUMENT_INVALID", "/", "Document schema version, identity, pages, nodes, and page order are required.");
  const document = input as unknown as DocumentShape;
  const seen = new Set<string>();
  for (const id of [...Object.keys(document.pages), ...Object.keys(document.nodes)]) {
    if (seen.has(id)) return diagnostic("DOCUMENT_DUPLICATE_ID", `/${id}`, `Duplicate document identity '${id}'.`);
    seen.add(id);
  }
  for (const [id, node] of Object.entries(document.nodes)) {
    if (id !== node.id) return diagnostic("DOCUMENT_INVALID", `/nodes/${id}`, "Node map key must match node id.");
    const result = validateNode(node, `/nodes/${id}`, acceptedKinds, requireText);
    if (!result.ok) return { ok: false, diagnostics: result.diagnostics };
    if (node.parentId !== null && !document.nodes[node.parentId]) return diagnostic("DOCUMENT_REFERENCE_MISSING", `/nodes/${id}.parentId`, "Node parent does not exist.");
    for (const childId of node.childIds) if (!document.nodes[childId]) return diagnostic("DOCUMENT_REFERENCE_MISSING", `/nodes/${id}.childIds`, `Child '${childId}' does not exist.`);
  }
  for (const [pageId, page] of Object.entries(document.pages)) {
    const pageResult = validatePage(page, `/pages/${pageId}`);
    if (!pageResult.ok) return { ok: false, diagnostics: pageResult.diagnostics };
    const rootId = (page as { rootId?: unknown }).rootId;
    if (typeof rootId !== "string" || !document.nodes[rootId] || document.nodes[rootId]?.kind !== "page-root" || document.nodes[rootId]?.parentId !== null) return diagnostic("DOCUMENT_REFERENCE_MISSING", `/pages/${pageId}.rootId`, "Page root must reference an existing root node without a parent.");
  }
  for (const pageId of document.pageOrder) {
    if (!document.pages[pageId]) return diagnostic("DOCUMENT_REFERENCE_MISSING", `/pageOrder/${pageId}`, "Page order references a missing page.");
  }
  for (const node of Object.values(document.nodes)) {
    for (const childId of node.childIds) if (document.nodes[childId]?.parentId !== node.id) return diagnostic("DOCUMENT_PARENT_MISMATCH", `/nodes/${node.id}.childIds`, `Child '${childId}' does not point back to its parent.`);
  }
  // Compound members must be shape-producing kinds — rectangle, frame or
  // path. Groups, text, images and nested compounds are refused: the outline
  // projection consumes member geometry directly (no nested resolution), and
  // a group member would silently drop its subtree from the outline.
  for (const node of Object.values(document.nodes)) {
    if (node.kind !== "compound") continue;
    for (const childId of node.childIds) {
      const member = document.nodes[childId];
      if (member && member.kind !== "rectangle" && member.kind !== "frame" && member.kind !== "path") return diagnostic("DOCUMENT_INVALID", `/nodes/${node.id}.compound`, `COMPOUND_MEMBER_KIND_UNSUPPORTED:${childId}`);
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const walk = (id: string): ValidationResult<true> => {
    if (visiting.has(id)) return diagnostic("DOCUMENT_CYCLE", `/nodes/${id}`, "Hierarchy cycles are not permitted.");
    if (visited.has(id)) return { ok: true, value: true, diagnostics: [] };
    visiting.add(id);
    for (const childId of document.nodes[id]?.childIds ?? []) {
      const result = walk(childId);
      if (!result.ok) return result;
    }
    visiting.delete(id);
    visited.add(id);
    return { ok: true, value: true, diagnostics: [] };
  };
  for (const nodeId of Object.keys(document.nodes)) {
    const result = walk(nodeId);
    if (!result.ok) return { ok: false, diagnostics: result.diagnostics };
  }
  if (semanticRequired) {
    const semantic = validateSemanticRecords(input as unknown as Record<string, unknown>, document.nodes as Record<string, DocumentNode>, "/");
    if (!semantic.ok) return { ok: false, diagnostics: semantic.diagnostics };
    const components = validateComponentGraph(input as unknown as EditorDocument);
    if (!components.ok) return { ok: false, diagnostics: components.diagnostics };
  }
  return { ok: true, value: { pages: document.pages, pageOrder: document.pageOrder, nodes: document.nodes }, diagnostics: [] };
};

const validateAtVersion = (input: unknown, version: number): ValidationResult<unknown> => {
  if (version === EDITOR_DOCUMENT_SCHEMA_V1) return validateDocumentStructure(input, version, (page, path) => validatePageV1(page as PageRecordV1, path), NODE_KINDS_V1);
  if (version === EDITOR_DOCUMENT_SCHEMA_V2) return validateDocumentStructure(input, version, (page, path) => validatePageCanvas((page as PageRecord).canvas, path), NODE_KINDS_V2);
  if (version === EDITOR_DOCUMENT_SCHEMA_V3) return validateDocumentStructure(input, version, (page, path) => validatePageCanvas((page as PageRecord).canvas, path), NODE_KINDS_V3);
  if (version === EDITOR_DOCUMENT_SCHEMA_V4) return validateDocumentStructure(input, version, (page, path) => validatePageCanvas((page as PageRecord).canvas, path), NODE_KINDS_V3, true);
  return validateDocumentStructure(input, version, (page, path) => validatePageCanvas((page as PageRecord).canvas, path), NODE_KINDS_V3, true, true);
};

export const validateEditorDocument = (input: unknown): ValidationResult<EditorDocument> => {
  const result = validateDocumentStructure(input, EDITOR_DOCUMENT_SCHEMA_VERSION, (page, path) => validatePageCanvas((page as PageRecord).canvas, path), NODE_KINDS_V3, true, true);
  if (!result.ok) return { ok: false, diagnostics: result.diagnostics };
  return { ok: true, value: structuredClone(input as EditorDocument), diagnostics: [] };
};

export const validateEditorDocumentV1 = (input: unknown): ValidationResult<EditorDocumentV1> => {
  const result = validateDocumentStructure(input, EDITOR_DOCUMENT_SCHEMA_V1, (page, path) => validatePageV1(page as PageRecordV1, path), NODE_KINDS_V1);
  if (!result.ok) return { ok: false, diagnostics: result.diagnostics };
  return { ok: true, value: structuredClone(input as EditorDocumentV1), diagnostics: [] };
};

/** A v2 reader: accepts schema version 2 and the six v2 kinds. A v3 document must fail here (I10). */
export const validateEditorDocumentV2 = (input: unknown): ValidationResult<EditorDocumentV2> => {
  const result = validateDocumentStructure(input, EDITOR_DOCUMENT_SCHEMA_V2, (page, path) => validatePageCanvas((page as PageRecord).canvas, path), NODE_KINDS_V2);
  if (!result.ok) return { ok: false, diagnostics: result.diagnostics };
  return { ok: true, value: structuredClone(input as EditorDocumentV2), diagnostics: [] };
};

export const validateEditorDocumentV3 = (input: unknown): ValidationResult<EditorDocumentV3> => {
  const result = validateDocumentStructure(input, EDITOR_DOCUMENT_SCHEMA_V3, (page, path) => validatePageCanvas((page as PageRecord).canvas, path), NODE_KINDS_V3);
  if (!result.ok) return { ok: false, diagnostics: result.diagnostics };
  return { ok: true, value: structuredClone(input as EditorDocumentV3), diagnostics: [] };
};

export const validateEditorDocumentV4 = (input: unknown): ValidationResult<EditorDocumentV4> => {
  const result = validateDocumentStructure(input, EDITOR_DOCUMENT_SCHEMA_V4, (page, path) => validatePageCanvas((page as PageRecord).canvas, path), NODE_KINDS_V3, true);
  if (!result.ok) return { ok: false, diagnostics: result.diagnostics };
  return { ok: true, value: structuredClone(input as EditorDocumentV4), diagnostics: [] };
};

export const canonicalEditorDocumentString = (document: EditorDocument): string => {
  const validation = validateEditorDocument(document);
  if (!validation.ok || !validation.value) throw new Error("EDITOR_DOCUMENT_INVALID");
  const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : record(value) ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
  return JSON.stringify(canonical(validation.value));
};

export const parseEditorDocument = (serialized: string): ValidationResult<EditorDocument> => {
  try {
    return validateEditorDocument(JSON.parse(serialized) as unknown);
  } catch {
    return diagnostic("DOCUMENT_INVALID", "/", "Document payload is not valid JSON.");
  }
};

export interface DocumentMigration {
  id: string;
  from: number;
  to: number;
  apply(input: unknown): { document: unknown; diagnostics: string[] };
}

export const v1ToV2DocumentMigration: DocumentMigration = {
  id: "v1-to-v2-add-page-canvas",
  from: EDITOR_DOCUMENT_SCHEMA_V1,
  to: EDITOR_DOCUMENT_SCHEMA_V2,
  apply(input) {
    const v1 = input as EditorDocumentV1;
    const pages: Record<DocumentId, PageRecord> = {};
    for (const [pageId, page] of Object.entries(v1.pages)) pages[pageId] = { ...page, canvas: createDefaultPageCanvas() };
    return { document: { ...v1, schemaVersion: EDITOR_DOCUMENT_SCHEMA_V2, pages }, diagnostics: [] };
  }
};

export const v2ToV3DocumentMigration: DocumentMigration = {
  id: "v2-to-v3-add-path-kind",
  from: EDITOR_DOCUMENT_SCHEMA_V2,
  to: EDITOR_DOCUMENT_SCHEMA_V3,
  apply(input) {
    return { document: { ...(input as object), schemaVersion: EDITOR_DOCUMENT_SCHEMA_V3 }, diagnostics: [] };
  }
};

export const v3ToV4DocumentMigration: DocumentMigration = {
  id: "v3-to-v4-add-semantic-surfaces",
  from: EDITOR_DOCUMENT_SCHEMA_V3,
  to: EDITOR_DOCUMENT_SCHEMA_V4,
  apply(input) {
    return { document: { ...(input as object), schemaVersion: EDITOR_DOCUMENT_SCHEMA_V4, surfaces: {}, semanticRelations: {} }, diagnostics: [] };
  }
};

export const v4ToV5RequireTextContentDocumentMigration: DocumentMigration = {
  id: "v4-to-v5-require-text-content",
  from: EDITOR_DOCUMENT_SCHEMA_V4,
  to: EDITOR_DOCUMENT_SCHEMA_VERSION,
  apply(input) {
    const document = input as EditorDocumentV4;
    const nodes = Object.fromEntries(Object.entries(document.nodes).map(([id, node]) => [id, node.kind === "text" && !Object.prototype.hasOwnProperty.call(node, "text") ? { ...node, text: "" } : node]));
    return { document: { ...document, schemaVersion: EDITOR_DOCUMENT_SCHEMA_VERSION, nodes }, diagnostics: [] };
  }
};

export const DOCUMENT_MIGRATIONS: DocumentMigration[] = [v1ToV2DocumentMigration, v2ToV3DocumentMigration, v3ToV4DocumentMigration, v4ToV5RequireTextContentDocumentMigration];

export interface MigrationResult {
  ok: boolean;
  document?: EditorDocument;
  applied: string[];
  diagnostics: ValidationDiagnostic[];
}

const migrationFailure = (diagnostics: ValidationDiagnostic[], applied: string[]): MigrationResult => ({ ok: false, applied, diagnostics });

export const migrateDocument = (input: unknown): MigrationResult => {
  if (!record(input) || typeof input.schemaVersion !== "number") return migrationFailure([{ code: "DOCUMENT_INVALID", path: "/", message: "Document payload is missing a numeric schema version." }], []);
  if (input.schemaVersion === EDITOR_DOCUMENT_SCHEMA_VERSION) {
    const validated = validateEditorDocument(input);
    if (!validated.ok || !validated.value) return migrationFailure(validated.diagnostics, []);
    return { ok: true, document: validated.value, applied: [], diagnostics: [] };
  }
  const chain = DOCUMENT_MIGRATIONS.filter((migration) => migration.from === input.schemaVersion).sort((left, right) => left.to - right.to);
  if (chain.length === 0) return migrationFailure([{ code: "DOCUMENT_UNSUPPORTED_SCHEMA", path: "/", message: `Unsupported document schema version '${input.schemaVersion}'; unknown versions are rejected, never coerced.` }], []);
  const applied: string[] = [];
  let current: unknown = input;
  let steps = chain;
  while (steps.length > 0) {
    const step = steps[0]!;
    // Each step validates its input at the step's *from* version: the v1→v2
    // step validates as v1, the v2→v3 step as v2. Validating with the current
    // version would reject an older document the moment the version moves.
    const at = validateAtVersion(current, step.from);
    if (!at.ok) return migrationFailure(at.diagnostics, applied);
    const migrated = step.apply(current);
    current = migrated.document;
    applied.push(step.id);
    steps = DOCUMENT_MIGRATIONS.filter((candidate) => candidate.from === step.to).sort((left, right) => left.to - right.to);
  }
  const final = validateEditorDocument(current);
  if (!final.ok || !final.value) return migrationFailure(final.diagnostics, applied);
  return { ok: true, document: final.value, applied, diagnostics: [] };
};

export const loadEditorDocument = (serialized: string): MigrationResult => {
  try {
    return migrateDocument(JSON.parse(serialized) as unknown);
  } catch {
    return migrationFailure([{ code: "DOCUMENT_INVALID", path: "/", message: "Document payload is not valid JSON." }], []);
  }
};

export const createFoundationDocument = (): EditorDocument => {
  const pageId = "page-home";
  const rootId = "page-root-home";
  const frameId = "frame-foundation";
  const rectangleId = "rectangle-foundation";
  const textId = "text-foundation";
  const nodes: Record<string, DocumentNode> = {
    [rootId]: { id: rootId, kind: "page-root", name: "Home", parentId: null, childIds: [frameId], bounds: { x: 0, y: 0, width: 1200, height: 800 }, transform: identity(), visible: true, locked: false, opacity: 1, fill: "#111318", stroke: "#2b3039", cornerRadius: 0, zIndex: 0 },
    [frameId]: { id: frameId, kind: "frame", name: "Foundation frame", parentId: rootId, childIds: [rectangleId, textId], bounds: { x: 180, y: 120, width: 520, height: 320 }, transform: identity(), visible: true, locked: false, opacity: 1, fill: "#202531", stroke: "#566078", cornerRadius: 24, zIndex: 1 },
    [rectangleId]: { id: rectangleId, kind: "rectangle", name: "Foundation rectangle", parentId: frameId, childIds: [], bounds: { x: 64, y: 84, width: 240, height: 132 }, transform: identity(), visible: true, locked: false, opacity: 1, fill: "#40d6c7", stroke: "#b4fff5", cornerRadius: 18, zIndex: 1 },
    [textId]: { id: textId, kind: "text", name: "Text placeholder", parentId: frameId, childIds: [], bounds: { x: 64, y: 240, width: 340, height: 42 }, transform: identity(), visible: true, locked: false, opacity: 1, fill: "#eef4ff", stroke: "#eef4ff", cornerRadius: 0, zIndex: 2, text: "Resolve authored state" }
  };
  return { schemaVersion: EDITOR_DOCUMENT_SCHEMA_VERSION, id: "document-foundation", workspace: { id: "workspace-local", name: "Crafty local workspace" }, project: { id: "project-foundation", name: "Foundation project" }, file: { id: "file-foundation", name: "Foundation file" }, pages: { [pageId]: { id: pageId, name: "Home", rootId, canvas: createDefaultPageCanvas() } }, pageOrder: [pageId], nodes, components: {}, instances: {}, libraries: [], variables: {}, metadata: { authoring: "editor-kernel-foundation" }, surfaces: {}, semanticRelations: {} };
};
