import type {
  ComponentDefinition,
  DocumentId,
  EditorDocument,
  NodeKind,
  SemanticSurfaceRole,
  ValidationDiagnostic,
} from "../../kernel/index.js";
import type { ResolvedProvenance } from "../../kernel/component-resolution.js";

export interface StructureDiagnostic {
  code: string;
  path: string;
  message: string;
}

export interface StructureRow {
  rowId: string;
  authoredId?: DocumentId;
  parentAuthoredId: DocumentId | null;
  name: string;
  kind: NodeKind | "component-definition" | "diagnostic";
  children: StructureRow[];
  visible: boolean;
  locked: boolean;
  selectable: boolean;
  draggable: boolean;
  canContain: boolean;
  surface?: { id: DocumentId; role: SemanticSurfaceRole; route?: string };
  component?: { definitionId: DocumentId; name: string; overrideCount: number; status: "linked" | "missing" };
  provenance?: ResolvedProvenance;
  diagnostics?: StructureDiagnostic[];
}

export interface ComponentDefinitionRow {
  rowId: string;
  definitionId: DocumentId;
  name: string;
  rootNodeId: DocumentId;
  instanceCount: number;
  status: "available" | "missing-root";
}

export interface StructureProjection {
  pageId: DocumentId;
  roots: StructureRow[];
  definitions: ComponentDefinitionRow[];
  isolation: { rootId?: DocumentId; ancestry: DocumentId[]; canExit: boolean };
  diagnostics: StructureDiagnostic[];
  revision: number;
}

const diagnostic = (entry: ValidationDiagnostic): StructureDiagnostic => ({ code: entry.code, path: entry.path, message: entry.message });

const makeRow = (document: EditorDocument, nodeId: DocumentId, parentAuthoredId: DocumentId | null): StructureRow | undefined => {
  const node = document.nodes[nodeId];
  if (!node) return undefined;
  const surface = Object.values(document.surfaces).find((candidate) => candidate.nodeId === node.id);
  const instance = document.instances[node.id];
  const definition = instance ? document.components[instance.definitionId] : undefined;
  const overrideCount = instance ? Object.values(instance.overrides).reduce((count, values) => count + Object.keys(values).length, 0) : 0;
  return {
    rowId: node.id,
    authoredId: node.id,
    parentAuthoredId,
    name: node.name,
    kind: node.kind,
    children: node.childIds.flatMap((childId) => { const row = makeRow(document, childId, node.id); return row ? [row] : []; }),
    visible: node.visible,
    locked: node.locked,
    selectable: node.kind !== "page-root",
    draggable: node.kind !== "page-root",
    // Frames and groups are containers even while empty. Compound nodes are
    // intentionally not treated as containers: their children are structural.
    canContain: node.kind === "frame" || node.kind === "group" || node.kind === "page-root",
    ...(surface ? { surface: { id: surface.id, role: surface.role, ...(surface.route ? { route: surface.route.path } : {}) } } : {}),
    ...(instance ? { component: { definitionId: instance.definitionId, name: definition?.name ?? "Missing component", overrideCount, status: definition ? "linked" : "missing" } } : {}),
    ...(instance && !definition ? { diagnostics: [{ code: `COMPONENT_DEFINITION_MISSING:${instance.definitionId}`, path: `/instances/${node.id}/definitionId`, message: "Component definition is unavailable." }] } : {}),
  };
};

export const buildStructureProjection = (
  document: EditorDocument,
  pageId: DocumentId,
  isolationRootId: DocumentId | undefined,
  revision: number,
  extraDiagnostics: readonly StructureDiagnostic[] = [],
): StructureProjection => {
  const page = document.pages[pageId];
  const pageRoot = page ? document.nodes[page.rootId] : undefined;
  const scopedRoot = isolationRootId ? document.nodes[isolationRootId] : undefined;
  const roots = (scopedRoot?.childIds ?? pageRoot?.childIds ?? []).flatMap((id) => {
    const row = makeRow(document, id, scopedRoot?.id ?? null);
    return row ? [row] : [];
  });
  const ancestry: DocumentId[] = [];
  let cursor = scopedRoot;
  while (cursor) { ancestry.unshift(cursor.id); cursor = cursor.parentId ? document.nodes[cursor.parentId] : undefined; }
  const definitions = Object.values(document.components).sort((a, b) => a.name.localeCompare(b.name)).map((definition: ComponentDefinition) => ({
    rowId: `component-definition:${definition.id}`,
    definitionId: definition.id,
    name: definition.name,
    rootNodeId: definition.rootNodeId,
    instanceCount: Object.values(document.instances).filter((instance) => instance.definitionId === definition.id).length,
    status: document.nodes[definition.rootNodeId] ? "available" as const : "missing-root" as const,
  }));
  return {
    pageId,
    roots,
    definitions,
    isolation: { ...(isolationRootId ? { rootId: isolationRootId } : {}), ancestry, canExit: ancestry.length > 0 },
    diagnostics: [...extraDiagnostics],
    revision,
  };
};
