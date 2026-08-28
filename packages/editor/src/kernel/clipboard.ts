import type { AffineTransform, ComponentDefinition, ComponentInstance, Compound, DocumentId, DocumentNode, EditorDocument, GlassFill, LibraryReference, NodeKind, PathGeometry, Rect, SemanticRelation, SemanticSurface } from "./document.js";
import { isGlassFill } from "./document.js";
import { WORLD_LIMIT } from "./coordinates.js";
import type { DocumentCommand } from "./commands.js";

/**
 * Clipboard (S5): an ephemeral kernel record with a serializable payload.
 * Clipboard content is never part of the authored document; paste mints fresh
 * IDs, remaps instance override paths, and lands one history entry.
 *
 * Override remap: overrides keyed by source node id are re-keyed through the
 * paste id map (primary). Keys that miss the id map fall back to the recorded
 * `overridePath` (child-index path from the nearest instance root, pen.dev's
 * id-path pattern) so path-keyed overrides from foreign or restructured
 * payloads still re-key deterministically; unresolvable keys are dropped with
 * a post-paste validation diagnostic (the pen.dev orphan guard).
 */

export interface ClipboardNode {
  id: DocumentId;
  kind: NodeKind;
  name: string;
  bounds: Rect;
  transform: AffineTransform;
  visible: boolean;
  locked: boolean;
  opacity: number;
  fill: string | GlassFill;
  stroke: string;
  cornerRadius: number;
  zIndex: number;
  text?: string;
  path?: PathGeometry;
  compound?: Compound;
  surface?: SemanticSurface;
  overridePath: string[];
  children: ClipboardNode[];
}

export type VariableDefinition = { type: "color" | "number" | "string" | "boolean"; value: string | number | boolean };

export interface ClipboardContent {
  type: "crafty-nodes";
  nodes: ClipboardNode[];
  components: Record<DocumentId, ComponentDefinition>;
  instances: Record<DocumentId, ComponentInstance>;
  variables: Record<string, VariableDefinition>;
  libraries: LibraryReference[];
  surfaces?: Record<DocumentId, SemanticSurface>;
  semanticRelations?: Record<DocumentId, SemanticRelation>;
  sourcePageId: DocumentId;
  sourceFileId: DocumentId;
}

export const CLIPBOARD_MIME = "application/x-crafty-nodes" as const;

export type PasteDiagnosticCode = "PASTE_COMPONENT_LOCAL_COPY" | "PASTE_COMPONENT_MISSING" | "PASTE_OVERRIDE_DROPPED" | "PASTE_SEMANTIC_ROUTE_DROPPED" | "PASTE_SEMANTIC_RELATION_DROPPED";

export interface PasteDiagnostic {
  code: PasteDiagnosticCode;
  path: string;
  message: string;
}

export interface PasteOutcome {
  mintedRootIds: DocumentId[];
  diagnostics: PasteDiagnostic[];
}

export interface ClipboardInsertPlan {
  command: Extract<DocumentCommand, { type: "mint-and-insert" }>;
  mintedRootIds: DocumentId[];
  diagnostics: PasteDiagnostic[];
}

const clone = <T>(value: T): T => structuredClone(value);
const isVariableBinding = (value: string): boolean => /^\$[\w-]+$/u.test(value);

const unionBounds = (nodes: ClipboardNode[]): Rect => {
  const first = nodes[0];
  if (!first) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = first.bounds.x;
  let minY = first.bounds.y;
  let maxX = first.bounds.x + first.bounds.width;
  let maxY = first.bounds.y + first.bounds.height;
  for (const node of nodes) {
    minX = Math.min(minX, node.bounds.x);
    minY = Math.min(minY, node.bounds.y);
    maxX = Math.max(maxX, node.bounds.x + node.bounds.width);
    maxY = Math.max(maxY, node.bounds.y + node.bounds.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

const findNodeById = (nodes: ClipboardNode[], id: DocumentId): ClipboardNode | undefined => {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return undefined;
};

const resolveChildPath = (node: ClipboardNode, path: string[]): ClipboardNode | undefined => {
  let cursor: ClipboardNode | undefined = node;
  for (const step of path) {
    const index = Number(step);
    if (!Number.isSafeInteger(index) || index < 0 || !cursor) return undefined;
    cursor = cursor.children[index];
  }
  return cursor;
};

/**
 * Builds the clipboard payload from the current selection. Selected parents
 * collapse their selected descendants (deepest-first prune); referenced
 * component definitions, instance records, variable bindings, and library
 * pins ship by stable key. Returns undefined for an empty selection.
 */
export const buildClipboardContent = (
  document: EditorDocument,
  selectedIds: DocumentId[],
  sourcePageId: DocumentId,
  sourceFileId: DocumentId,
): ClipboardContent | undefined => {
  const selected = new Set(selectedIds);
  const topmost = selectedIds.filter((id) => {
    let cursor = document.nodes[id]?.parentId;
    while (cursor) {
      if (selected.has(cursor)) return false;
      cursor = document.nodes[cursor]?.parentId ?? null;
    }
    return true;
  });
  const roots = topmost.map((id) => document.nodes[id]).filter((node): node is DocumentNode => Boolean(node));
  if (roots.length === 0) return undefined;
  const instances: Record<DocumentId, ComponentInstance> = {};
  const components: Record<DocumentId, ComponentDefinition> = {};
  const variables: Record<string, VariableDefinition> = {};
  const surfaces: Record<DocumentId, SemanticSurface> = {};
  const semanticRelations: Record<DocumentId, SemanticRelation> = {};
  const visit = (node: DocumentNode, parentPath: string[]): ClipboardNode => {
    const isInstance = document.instances[node.id] !== undefined;
    if (isInstance) {
      instances[node.id] = clone(document.instances[node.id]!);
      const definition = document.components[document.instances[node.id]!.definitionId];
      if (definition) components[definition.id] = clone(definition);
    }
    const selfPath = isInstance ? [] : parentPath;
    for (const binding of [node.fill, node.stroke]) {
      if (typeof binding === "string" && isVariableBinding(binding) && document.variables[binding.slice(1)]) variables[binding.slice(1)] = clone(document.variables[binding.slice(1)]!);
    }
    const children = node.childIds.map((childId, index) => visit(document.nodes[childId]!, [...selfPath, String(index)]));
    const surface = Object.values(document.surfaces).find((candidate) => candidate.nodeId === node.id);
    if (surface) surfaces[surface.id] = clone(surface);
    for (const relation of Object.values(document.semanticRelations)) if (relation.sourceNodeId === node.id || relation.targetNodeId === node.id || (relation.targetSurfaceId !== undefined && surface?.id === relation.targetSurfaceId)) semanticRelations[relation.id] = clone(relation);
    return {
      id: node.id,
      kind: node.kind,
      name: node.name,
      bounds: clone(node.bounds),
      transform: clone(node.transform),
      visible: node.visible,
      locked: node.locked,
      opacity: node.opacity,
      fill: node.fill,
      stroke: node.stroke,
      cornerRadius: node.cornerRadius,
      zIndex: node.zIndex,
      ...(node.text === undefined ? {} : { text: node.text }),
      ...(node.path === undefined ? {} : { path: clone(node.path) }),
      ...(node.compound === undefined ? {} : { compound: clone(node.compound) }),
      ...(surface === undefined ? {} : { surface: clone(surface) }),
      overridePath: selfPath,
      children
    };
  };
  return { type: "crafty-nodes", nodes: roots.map((root) => visit(root, [])), components, instances, variables, libraries: clone(document.libraries), ...(Object.keys(surfaces).length === 0 ? {} : { surfaces }), ...(Object.keys(semanticRelations).length === 0 ? {} : { semanticRelations }), sourcePageId, sourceFileId };
};

const randomToken = (): string => {
  const uuid = globalThis.crypto?.randomUUID?.();
  return (uuid ?? Math.random().toString(36).slice(2)).slice(0, 8);
};

const mintId = (sourceId: DocumentId, used: Set<string>): DocumentId => {
  let id = `clip-${sourceId}-${randomToken()}`;
  while (used.has(id)) id = `clip-${sourceId}-${randomToken()}`;
  used.add(id);
  return id;
};

const remapOverrides = (overrides: Record<string, Record<string, unknown>>, idMap: Map<string, string>, content: ClipboardContent, instanceSourceId: DocumentId, diagnostics: PasteDiagnostic[]): Record<DocumentId, Record<string, unknown>> => {
  const remapped: Record<DocumentId, Record<string, unknown>> = {};
  const instanceNode = findNodeById(content.nodes, instanceSourceId);
  for (const [key, value] of Object.entries(overrides)) {
    const minted = idMap.get(key);
    if (minted) {
      remapped[minted] = clone(value);
      continue;
    }
    const resolved = instanceNode ? resolveChildPath(instanceNode, key.split("/")) : undefined;
    if (resolved) {
      const viaPath = idMap.get(resolved.id);
      if (viaPath) {
        remapped[viaPath] = clone(value);
        continue;
      }
    }
    diagnostics.push({ code: "PASTE_OVERRIDE_DROPPED", path: `/instances/${instanceSourceId}/overrides/${key}`, message: `Override '${key}' did not resolve to a pasted node and was dropped.` });
  }
  return remapped;
};

/**
 * Plans a paste without mutating the document. Mints fresh IDs for the whole
 * pasted subtree (unique within the document map keys and within the batch),
 * shifts relative bounds so the subtree top-left lands at `atWorld`, remaps
 * instance overrides, and creates local copies of referenced component
 * definitions that the target file lacks (with diagnostics). Returns undefined
 * when the target parent is missing or the payload is empty.
 */
export const planClipboardInsert = (
  document: EditorDocument,
  content: ClipboardContent,
  parentId: DocumentId,
  index: number,
  atWorld: { x: number; y: number },
): ClipboardInsertPlan | undefined => {
  const parent = document.nodes[parentId];
  if (!parent || content.nodes.length === 0) return undefined;
  const diagnostics: PasteDiagnostic[] = [];
  const used = new Set(Object.keys(document.nodes));
  const usedDefinitions = new Set(Object.keys(document.components));
  const usedPoints = new Set<string>();
  const usedSubpaths = new Set<string>();
  const idMap = new Map<string, string>();
  const nodes: DocumentNode[] = [];
  const targetIndex = Number.isSafeInteger(index) ? Math.max(0, Math.min(index, parent.childIds.length)) : parent.childIds.length;
  const clamp = (value: number): number => (Number.isFinite(value) ? Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, value)) : 0);
  const anchor = { x: clamp(atWorld.x), y: clamp(atWorld.y) };
  const union = unionBounds(content.nodes);
  const delta = { x: anchor.x - union.x, y: anchor.y - union.y };
  const mintPathGeometry = (source: PathGeometry): PathGeometry => {
    // Subpath ids first, then point ids — each point's subpathId remaps
    // through the same map, so referential integrity survives the paste.
    const subpathMap: Record<string, PathGeometry["subpaths"][string]> = {};
    const subpathIdMap = new Map<string, string>();
    for (const [sourceId, subpath] of Object.entries(source.subpaths)) {
      const mintedId = mintId(`subpath-${sourceId}`, usedSubpaths);
      subpathIdMap.set(sourceId, mintedId);
      subpathMap[mintedId] = { id: mintedId, closed: subpath.closed };
    }
    const pointMap: Record<string, PathGeometry["points"][string]> = {};
    for (const [sourceId, point] of Object.entries(source.points)) {
      const mintedId = mintId(`point-${sourceId}`, usedPoints);
      pointMap[mintedId] = { ...clone(point), id: mintedId, subpathId: subpathIdMap.get(point.subpathId) ?? mintId(`subpath-${point.subpathId}`, usedSubpaths) };
    }
    return { points: pointMap, subpaths: subpathMap, fillRule: source.fillRule };
  };
  const mintTree = (source: ClipboardNode, mintedParentId: DocumentId | null): DocumentNode => {
    const id = mintId(source.id, used);
    idMap.set(source.id, id);
    const base = {
      id,
      name: source.name,
      parentId: mintedParentId,
      childIds: [],
      bounds: { ...source.bounds, x: source.bounds.x + delta.x, y: source.bounds.y + delta.y },
      transform: clone(source.transform),
      visible: source.visible,
      locked: source.locked,
      opacity: source.opacity,
      fill: source.fill,
      stroke: source.stroke,
      cornerRadius: source.cornerRadius,
      zIndex: source.zIndex,
      ...(source.path === undefined ? {} : { path: mintPathGeometry(source.path) }),
        ...(source.compound === undefined ? {} : { compound: { ...source.compound } })
    };
    const node: DocumentNode = source.kind === "text"
      ? { ...base, kind: "text", text: source.text ?? "" }
      : { ...base, kind: source.kind as Exclude<NodeKind, "text"> };
    nodes.push(node);
    for (const child of source.children) node.childIds.push(mintTree(child, node.id).id);
    return node;
  };
  const mintedRootIds: DocumentId[] = [];
  for (const root of content.nodes) mintedRootIds.push(mintTree(root, parentId).id);
  const instances: Record<DocumentId, ComponentInstance> = {};
  const components: Record<DocumentId, ComponentDefinition> = {};
  for (const [sourceInstanceId, instance] of Object.entries(content.instances)) {
    const mintedId = idMap.get(sourceInstanceId);
    if (!mintedId) continue;
    let definitionId = instance.definitionId;
    if (!document.components[definitionId]) {
      const local = content.components[definitionId];
      if (local) {
        const localDefinitionId = mintId(`component-${local.id}`, usedDefinitions);
        components[localDefinitionId] = { ...clone(local), id: localDefinitionId };
        definitionId = localDefinitionId;
        diagnostics.push({ code: "PASTE_COMPONENT_LOCAL_COPY", path: `/instances/${sourceInstanceId}`, message: `Component '${local.name}' was not present in the target file and was copied locally as '${localDefinitionId}'.` });
      } else {
        diagnostics.push({ code: "PASTE_COMPONENT_MISSING", path: `/instances/${sourceInstanceId}`, message: `Component definition '${definitionId}' is missing and was pasted as a placeholder instance.` });
      }
    }
    instances[mintedId] = { ...clone(instance), definitionId, overrides: remapOverrides(instance.overrides, idMap, content, sourceInstanceId, diagnostics) };
  }
  const mintedSurfaces: Record<DocumentId, SemanticSurface> = {};
  const surfaceMap = new Map<DocumentId, DocumentId>();
  for (const surface of Object.values(content.surfaces ?? {})) {
    const nodeId = idMap.get(surface.nodeId);
    if (!nodeId) continue;
    const id = mintId(`surface-${surface.id}`, used);
    surfaceMap.set(surface.id, id);
    const route = surface.route && !Object.values(document.surfaces).some((candidate) => candidate.route?.path === surface.route?.path) ? { ...surface.route, id: mintId(`route-${surface.route.id}`, used) } : undefined;
    if (surface.route && !route) diagnostics.push({ code: "PASTE_SEMANTIC_ROUTE_DROPPED", path: `/surfaces/${surface.id}/route`, message: `Route '${surface.route.path}' already exists and was dropped from the pasted surface.` });
    mintedSurfaces[id] = { ...clone(surface), id, nodeId, ...(route ? { route } : {}) };
  }
  const mintedRelations: Record<DocumentId, SemanticRelation> = {};
  for (const relation of Object.values(content.semanticRelations ?? {})) {
    const sourceNodeId = idMap.get(relation.sourceNodeId);
    const targetNodeId = relation.targetNodeId ? idMap.get(relation.targetNodeId) : undefined;
    const targetSurfaceId = relation.targetSurfaceId ? surfaceMap.get(relation.targetSurfaceId) : undefined;
    if (!sourceNodeId || (relation.targetNodeId && !targetNodeId) || (relation.targetSurfaceId && !targetSurfaceId)) {
      diagnostics.push({ code: "PASTE_SEMANTIC_RELATION_DROPPED", path: `/semanticRelations/${relation.id}`, message: `Relation '${relation.id}' referenced content outside the pasted subtree and was dropped.` });
      continue;
    }
    const id = mintId(`relation-${relation.id}`, used);
    mintedRelations[id] = { ...clone(relation), id, sourceNodeId, ...(targetNodeId ? { targetNodeId } : {}), ...(targetSurfaceId ? { targetSurfaceId } : {}) };
  }
  const command = { type: "mint-and-insert", parentId, index: targetIndex, nodes, instances, components, surfaces: mintedSurfaces, semanticRelations: mintedRelations } as const;
  return { command, mintedRootIds, diagnostics };
};

/**
 * World-space bounds the pasted subtree would occupy if inserted at
 * `atWorld` (its top-left lands at `atWorld`). Used for the ephemeral paste
 * preview overlay; never mutates the document.
 */
export const clipboardSubtreeBounds = (content: ClipboardContent, atWorld: { x: number; y: number }): Rect => {
  const union = unionBounds(content.nodes);
  return { x: atWorld.x, y: atWorld.y, width: union.width, height: union.height };
};

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const validateClipboardNode = (value: unknown): value is ClipboardNode => {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || !value.id) return false;
  if (typeof value.name !== "string" || typeof value.kind !== "string") return false;
  const bounds = value.bounds;
  if (!isRecord(bounds) || !isFiniteNumber(bounds.x) || !isFiniteNumber(bounds.y) || !isFiniteNumber(bounds.width) || !isFiniteNumber(bounds.height)) return false;
  if (value.kind !== "path" && (bounds.width <= 0 || bounds.height <= 0)) return false;
  const transform = value.transform;
  if (!isRecord(transform) || !isFiniteNumber(transform.a) || !isFiniteNumber(transform.b) || !isFiniteNumber(transform.c) || !isFiniteNumber(transform.d) || !isFiniteNumber(transform.e) || !isFiniteNumber(transform.f)) return false;
  if (typeof value.visible !== "boolean" || typeof value.locked !== "boolean" || !isFiniteNumber(value.opacity) || value.opacity < 0 || value.opacity > 1) return false;
  if ((typeof value.fill !== "string" && !isGlassFill(value.fill)) || typeof value.stroke !== "string" || !isFiniteNumber(value.cornerRadius)) return false;
  if (!Number.isSafeInteger(value.zIndex)) return false;
  if (value.path !== undefined && !isRecord(value.path)) return false;
  if (value.compound !== undefined && (!isRecord(value.compound) || (value.compound.operation !== "union" && value.compound.operation !== "intersect" && value.compound.operation !== "subtract" && value.compound.operation !== "exclude"))) return false;
  if (!Array.isArray(value.overridePath) || !value.overridePath.every((step) => typeof step === "string")) return false;
  if (!Array.isArray(value.children) || !value.children.every(validateClipboardNode)) return false;
  return true;
};

export const validateClipboardContent = (value: unknown): value is ClipboardContent => {
  if (!isRecord(value) || value.type !== "crafty-nodes") return false;
   if (!Array.isArray(value.nodes) || value.nodes.length === 0 || !value.nodes.every(validateClipboardNode)) return false;
  if (typeof value.sourcePageId !== "string" || typeof value.sourceFileId !== "string") return false;
   if (!isRecord(value.components) || !isRecord(value.instances) || !isRecord(value.variables) || !Array.isArray(value.libraries)) return false;
   if (value.surfaces !== undefined && !isRecord(value.surfaces)) return false;
   if (value.semanticRelations !== undefined && !isRecord(value.semanticRelations)) return false;
  return true;
};

/**
 * MIME-tagged JSON payload for the OS clipboard, with a raw-JSON text
 * fallback for boards that strip the tag. The kernel keeps a process-local
 * clipboard so in-app paste works regardless of OS permission.
 */
export const serializeClipboardPayload = (content: ClipboardContent): string => `${CLIPBOARD_MIME}\n${JSON.stringify(content)}`;

export const parseClipboardPayload = (text: string): ClipboardContent | undefined => {
  if (typeof text !== "string" || text.length === 0) return undefined;
  const json = text.startsWith(`${CLIPBOARD_MIME}\n`) ? text.slice(CLIPBOARD_MIME.length + 1) : text;
  try {
    const parsed = JSON.parse(json) as unknown;
    return validateClipboardContent(parsed) ? (parsed as ClipboardContent) : undefined;
  } catch {
    return undefined;
  }
};
