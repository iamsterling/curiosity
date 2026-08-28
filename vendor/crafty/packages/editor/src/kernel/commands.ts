import type { AffineTransform, AutoLayout, ComponentDefinition, ComponentInstance, Compound, CompoundOperation, DocumentId, DocumentNode, EditorDocument, GlassFill, GridDescriptor, GuideRecord, LayoutSizing, NodeKind, PageCanvas, PageRecord, PathFillRule, PathGeometry, PathHandle, PathHandleMode, PathPoint, PointId, Rect, RulerSettings, SemanticRelation, SemanticSurface, SnapSettings, SubpathId, ViewportRest } from "./document.js";
import { PATH_BOUNDS_TOLERANCE, validateEditorDocument } from "./document.js";
import { computePathBounds, pointsOfSubpath, reverseOrderKey } from "./path-geometry.js";
import { booleanOperate, type BooleanOperation, type BooleanOperand, type BooleanResult } from "./boolean.js";
import { compoundMemberOperand } from "./compound.js";
import { resolveScene, type SupportedOverrideProperty } from "./component-resolution.js";

export type DocumentCommand =
  | { type: "create-component-definition"; definition: ComponentDefinition; surfaceId?: DocumentId }
  | { type: "update-component-definition"; definition: ComponentDefinition; surfaceId?: DocumentId }
  | { type: "delete-component-definition"; definitionId: DocumentId }
  | { type: "create-component-instance"; instanceId: DocumentId; node: DocumentNode; instance: ComponentInstance }
  | { type: "set-instance-properties"; instanceId: DocumentId; properties: Record<string, string | boolean> }
  | { type: "set-instance-override"; instanceId: DocumentId; nodeId: DocumentId; property: string; value: unknown }
  | { type: "clear-instance-override"; instanceId: DocumentId; nodeId: DocumentId; property: string }
  | { type: "detach-component-instance"; instanceId: DocumentId }
  | { type: "restore-detached-instance"; instanceId: DocumentId; node: DocumentNode; instance: ComponentInstance; nodes: DocumentNode[] }
  | { type: "create-node"; node: DocumentNode }
  | { type: "delete-node"; nodeId: DocumentId }
  | { type: "delete-subtree"; nodeId: DocumentId }
  | { type: "restore-subtree"; nodes: DocumentNode[]; parentId: DocumentId; index: number; surfaces?: Record<DocumentId, SemanticSurface>; semanticRelations?: Record<DocumentId, SemanticRelation> }
  | { type: "reorder-node"; nodeId: DocumentId; parentId: DocumentId; index: number }
  | { type: "reparent-node"; nodeId: DocumentId; parentId: DocumentId; index: number }
  | { type: "set-bounds"; nodeId: DocumentId; bounds: Rect }
  | { type: "set-transform"; nodeId: DocumentId; transform: AffineTransform }
  | { type: "set-auto-layout"; nodeId: DocumentId; autoLayout?: AutoLayout }
  | { type: "set-sizing"; nodeId: DocumentId; sizing?: LayoutSizing }
  | { type: "set-layout-position"; nodeId: DocumentId; layoutPosition?: "flow" | "absolute" }
  | { type: "set-surface"; surface: SemanticSurface }
  | { type: "clear-surface"; surfaceId: DocumentId }
  | { type: "set-semantic-relation"; relation: SemanticRelation }
  | { type: "delete-semantic-relation"; relationId: DocumentId }
  | { type: "set-path-points"; nodeId: DocumentId; pointRecords: Record<PointId, PathPoint>; bounds: Rect }
  | { type: "insert-path-point"; nodeId: DocumentId; point: PathPoint; prev: PathPoint; next: PathPoint; bounds: Rect }
  | { type: "remove-path-point"; nodeId: DocumentId; point: PathPoint; prev: PathPoint; next: PathPoint; bounds: Rect }
  | { type: "set-subpath-closed"; nodeId: DocumentId; subpathId: SubpathId; closed: boolean; endAnchors: { first: PathPoint; last: PathPoint }; bounds: Rect }
  | { type: "reverse-subpath"; nodeId: DocumentId; subpathId: SubpathId }
  | { type: "set-path-fill-rule"; nodeId: DocumentId; fillRule: PathFillRule }
  | { type: "replace-path-geometry"; nodeId: DocumentId; geometry: PathGeometry; bounds: Rect }
  | { type: "set-point-type"; nodeId: DocumentId; pointId: PointId; mode: PathHandleMode; handleIn?: PathHandle; handleOut?: PathHandle; bounds: Rect }
  | { type: "boolean-operate"; nodeIds: DocumentId[]; operation: BooleanOperation }
  | { type: "restore-boolean-operands"; resultNodeId: DocumentId; operands: DocumentNode[]; parentId: DocumentId; index: number; operation: BooleanOperation }
  | { type: "create-compound"; nodeId: DocumentId; parentId: DocumentId; index: number; memberIds: DocumentId[]; operation: CompoundOperation }
  | { type: "restore-compound-members"; compoundNodeId: DocumentId; members: DocumentNode[]; parentId: DocumentId; index: number; operation: CompoundOperation }
  | { type: "set-compound-op"; nodeId: DocumentId; operation: CompoundOperation }
  | { type: "reorder-compound-member"; nodeId: DocumentId; fromIndex: number; toIndex: number }
  | { type: "flatten-compound"; nodeId: DocumentId }
  | { type: "restore-flattened-compound"; flattenedNodeId: DocumentId; compoundNodeId: DocumentId; nodes: DocumentNode[]; parentId: DocumentId; index: number }
  | { type: "align-nodes"; nodeIds: DocumentId[]; axis: "left" | "centerX" | "right" | "top" | "centerY" | "bottom" }
  | { type: "distribute-nodes"; nodeIds: DocumentId[]; axis: "horizontal" | "vertical" }
  | { type: "move-nodes"; nodeIds: DocumentId[]; delta: { dx: number; dy: number } }
  | { type: "restore-node-bounds"; entries: Array<{ nodeId: DocumentId; bounds: Rect }> }
  | { type: "set-property"; nodeId: DocumentId; property: "text"; value: string }
  | { type: "set-property"; nodeId: DocumentId; property: "name" | "fill" | "stroke" | "opacity" | "visible" | "locked" | "cornerRadius"; value: string | number | boolean | GlassFill }
  | { type: "set-metadata"; key: string; value: unknown }
  | { type: "delete-metadata"; key: string }
  | { type: "set-page-grid"; pageId: DocumentId; grid: GridDescriptor }
  | { type: "set-ruler-settings"; pageId: DocumentId; rulers: RulerSettings }
  | { type: "set-snap-settings"; pageId: DocumentId; snap: SnapSettings }
  | { type: "set-page-viewport"; pageId: DocumentId; viewport: ViewportRest }
  | { type: "add-guide"; pageId: DocumentId; guide: GuideRecord }
  | { type: "move-guide"; pageId: DocumentId; guideId: DocumentId; position: number }
  | { type: "remove-guide"; pageId: DocumentId; guideId: DocumentId }
  | { type: "create-page"; page: PageRecord }
  | { type: "delete-page"; pageId: DocumentId }
  | { type: "restore-page"; page: PageRecord; root: DocumentNode; nodes: DocumentNode[]; index: number }
  | { type: "reorder-page"; pageId: DocumentId; index: number }
  | { type: "set-page-name"; pageId: DocumentId; name: string }
  | { type: "set-page"; pageId: DocumentId }
  | { type: "mint-and-insert"; parentId: DocumentId; index: number; nodes: DocumentNode[]; instances: Record<DocumentId, ComponentInstance>; components: Record<DocumentId, ComponentDefinition>; surfaces?: Record<DocumentId, SemanticSurface>; semanticRelations?: Record<DocumentId, SemanticRelation> }
  | { type: "delete-pasted-nodes"; nodeIds: DocumentId[] };

export interface CommandResult { document: EditorDocument; inverse: DocumentCommand; changed: boolean; }

const clone = <T>(value: T): T => structuredClone(value);
const replaceNode = (document: EditorDocument, nodeId: string, replace: (node: DocumentNode) => DocumentNode): EditorDocument => ({ ...document, nodes: { ...document.nodes, [nodeId]: replace(document.nodes[nodeId]!) } });

const assertValid = (document: EditorDocument): EditorDocument => {
  const result = validateEditorDocument(document);
  if (!result.ok || !result.value) {
    const failure = result.diagnostics[0];
    throw new Error(failure ? `${failure.code}:${failure.message}` : "EDITOR_DOCUMENT_INVALID");
  }
  return result.value;
};

type ComponentCommand = Extract<DocumentCommand, { type: "create-component-definition" | "update-component-definition" | "delete-component-definition" | "create-component-instance" | "set-instance-properties" | "set-instance-override" | "clear-instance-override" | "detach-component-instance" | "restore-detached-instance" }>;

const applyComponentCommand = (document: EditorDocument, command: ComponentCommand): CommandResult => {
  if (command.type === "create-component-definition" || command.type === "update-component-definition") {
    const previous = document.components[command.definition.id];
    if (command.type === "create-component-definition" && previous) throw new Error(`COMPONENT_DEFINITION_EXISTS:${command.definition.id}`);
    if (command.type === "update-component-definition" && !previous) throw new Error(`COMPONENT_DEFINITION_MISSING:${command.definition.id}`);
    const definition = clone(command.definition);
    if (command.surfaceId !== undefined) definition.surfaceId = command.surfaceId;
    const next = assertValid({ ...document, components: { ...document.components, [definition.id]: definition } });
    return { document: next, inverse: previous ? { type: "update-component-definition", definition: clone(previous) } : { type: "delete-component-definition", definitionId: definition.id }, changed: JSON.stringify(previous) !== JSON.stringify(definition) };
  }
  if (command.type === "delete-component-definition") {
    const previous = document.components[command.definitionId];
    if (!previous) return { document, inverse: command, changed: false };
    if (Object.values(document.instances).some((instance) => instance.definitionId === command.definitionId)) throw new Error(`COMPONENT_DEFINITION_IN_USE:${command.definitionId}`);
    const components = { ...document.components }; delete components[command.definitionId];
    return { document: assertValid({ ...document, components }), inverse: { type: "create-component-definition", definition: clone(previous) }, changed: true };
  }
  if (command.type === "create-component-instance") {
    if (document.nodes[command.instanceId] || document.instances[command.instanceId]) throw new Error(`COMPONENT_INSTANCE_EXISTS:${command.instanceId}`);
    if (command.node.id !== command.instanceId) throw new Error("COMPONENT_INSTANCE_NODE_ID_MISMATCH");
    const parent = command.node.parentId ? document.nodes[command.node.parentId] : undefined;
    if (command.node.parentId && !parent) throw new Error(`DOCUMENT_PARENT_MISSING:${command.node.parentId}`);
    const node = clone(command.node);
    const next = { ...document, nodes: { ...document.nodes, [node.id]: node }, instances: { ...document.instances, [node.id]: clone(command.instance) } };
    if (parent) next.nodes[parent.id] = { ...parent, childIds: [...parent.childIds, node.id] };
    return { document: assertValid(next), inverse: { type: "delete-pasted-nodes", nodeIds: [node.id] }, changed: true };
  }
  if (command.type === "set-instance-properties") {
    const before = document.instances[command.instanceId];
    if (!before) throw new Error(`COMPONENT_INSTANCE_MISSING:${command.instanceId}`);
    const next = assertValid({ ...document, instances: { ...document.instances, [command.instanceId]: { ...before, properties: clone(command.properties) } } });
    return { document: next, inverse: { type: "set-instance-properties", instanceId: command.instanceId, properties: clone(before.properties) }, changed: JSON.stringify(before.properties) !== JSON.stringify(command.properties) };
  }
  if (command.type === "set-instance-override" || command.type === "clear-instance-override") {
    const before = document.instances[command.instanceId];
    if (!before) throw new Error(`COMPONENT_INSTANCE_MISSING:${command.instanceId}`);
    if (!["name", "fill", "stroke", "opacity", "visible", "locked", "text", "cornerRadius"].includes(command.property)) throw new Error(`COMPONENT_OVERRIDE_UNSUPPORTED:${command.property}`);
    const overrides = clone(before.overrides); const target = { ...(overrides[command.nodeId] ?? {}) };
    if (command.type === "set-instance-override") target[command.property as SupportedOverrideProperty] = clone(command.value); else delete target[command.property];
    if (Object.keys(target).length === 0) delete overrides[command.nodeId]; else overrides[command.nodeId] = target;
    const next = assertValid({ ...document, instances: { ...document.instances, [command.instanceId]: { ...before, overrides } } });
    const inverse: DocumentCommand = Object.prototype.hasOwnProperty.call(before.overrides[command.nodeId] ?? {}, command.property) ? { type: "set-instance-override", instanceId: command.instanceId, nodeId: command.nodeId, property: command.property, value: clone(before.overrides[command.nodeId]![command.property]) } : { type: "clear-instance-override", instanceId: command.instanceId, nodeId: command.nodeId, property: command.property };
    return { document: next, inverse, changed: JSON.stringify(before.overrides) !== JSON.stringify(overrides) };
  }
  if (command.type === "restore-detached-instance") {
    if (document.instances[command.instanceId]) throw new Error(`COMPONENT_INSTANCE_EXISTS:${command.instanceId}`);
    const next = { ...document, nodes: { ...document.nodes }, instances: { ...document.instances, [command.instanceId]: clone(command.instance) } };
    for (const node of command.nodes) delete next.nodes[node.id];
    next.nodes[command.instanceId] = clone(command.node);
    if (command.node.parentId) next.nodes[command.node.parentId] = { ...next.nodes[command.node.parentId]!, childIds: next.nodes[command.node.parentId]!.childIds.map((id) => id === command.instanceId ? command.instanceId : id) };
    return { document: assertValid(next), inverse: { type: "detach-component-instance", instanceId: command.instanceId }, changed: true };
  }
  const instance = document.instances[command.instanceId];
  const host = document.nodes[command.instanceId];
  if (!instance || !host) throw new Error(`COMPONENT_INSTANCE_MISSING:${command.instanceId}`);
  const definition = document.components[instance.definitionId];
  if (!definition) throw new Error(`COMPONENT_DEFINITION_MISSING:${instance.definitionId}`);
  const resolved = resolveScene(document, { pageId: document.pageOrder.find((pageId) => document.pages[pageId]?.rootId === host.parentId) ?? document.pageOrder[0]! });
  const materialized = Object.values(resolved.nodes).filter((node) => node.provenance.instancePath[0] === command.instanceId);
  if (materialized.length === 0) throw new Error("COMPONENT_DETACH_EMPTY");
  const idMap = new Map(materialized.map((node) => [node.id, node.id === resolved.rootIds.find((id) => id === node.id) ? command.instanceId : `detached:${command.instanceId}:${node.provenance.definitionNodeId ?? node.id}`]));
  const nodes = materialized.map((node) => {
    const { provenance: _provenance, ...authored } = clone(node);
    return { ...authored, id: idMap.get(node.id)!, parentId: node.parentId === null ? host.parentId : idMap.get(node.parentId) ?? host.parentId, childIds: node.childIds.map((id) => idMap.get(id)!).filter((id): id is string => Boolean(id)) } as DocumentNode;
  });
  const roots = nodes.filter((node) => node.parentId === host.parentId); if (roots.length === 0) throw new Error("COMPONENT_DETACH_ROOT_MISSING");
  const next = { ...document, nodes: { ...document.nodes }, instances: { ...document.instances } }; delete next.instances[command.instanceId]; delete next.nodes[command.instanceId];
  for (const node of nodes) next.nodes[node.id] = node;
  const parent = next.nodes[host.parentId!]; if (!parent) throw new Error("COMPONENT_DETACH_PARENT_MISSING");
  next.nodes[parent.id] = { ...parent, childIds: parent.childIds.flatMap((id) => id === command.instanceId ? roots.map((root) => root.id) : [id]) };
  return { document: assertValid(next), inverse: { type: "restore-detached-instance", instanceId: command.instanceId, node: clone(host), instance: clone(instance), nodes: clone(nodes) }, changed: true };
};

const replacePageCanvas = (document: EditorDocument, pageId: string, replace: (canvas: PageCanvas) => PageCanvas): EditorDocument => {
  const page = document.pages[pageId];
  if (!page) throw new Error(`DOCUMENT_PAGE_MISSING:${pageId}`);
  return { ...document, pages: { ...document.pages, [pageId]: { ...page, canvas: replace(page.canvas) } } };
};

const findGuide = (canvas: PageCanvas, guideId: string): GuideRecord | undefined => canvas.guides.find((guide) => guide.id === guideId);

const applySemanticCommand = (document: EditorDocument, command: Extract<DocumentCommand, { type: "set-surface" | "clear-surface" | "set-semantic-relation" | "delete-semantic-relation" }>): CommandResult => {
  if (command.type === "set-surface") {
    const previous = document.surfaces[command.surface.id];
    const surfaces = { ...document.surfaces, [command.surface.id]: clone(command.surface) };
    const next = assertValid({ ...document, surfaces });
    return { document: next, inverse: previous ? { type: "set-surface", surface: clone(previous) } : { type: "clear-surface", surfaceId: command.surface.id }, changed: JSON.stringify(previous) !== JSON.stringify(command.surface) };
  }
  if (command.type === "clear-surface") {
    const previous = document.surfaces[command.surfaceId];
    if (!previous) return { document, inverse: command, changed: false };
    const surfaces = { ...document.surfaces };
    delete surfaces[command.surfaceId];
    const relations = { ...document.semanticRelations };
    for (const [id, relation] of Object.entries(relations)) if (relation.targetSurfaceId === command.surfaceId) delete relations[id];
    const next = assertValid({ ...document, surfaces, semanticRelations: relations });
    return { document: next, inverse: { type: "set-surface", surface: clone(previous) }, changed: true };
  }
  if (command.type === "set-semantic-relation") {
    const previous = document.semanticRelations[command.relation.id];
    const semanticRelations = { ...document.semanticRelations, [command.relation.id]: clone(command.relation) };
    const next = assertValid({ ...document, semanticRelations });
    return { document: next, inverse: previous ? { type: "set-semantic-relation", relation: clone(previous) } : { type: "delete-semantic-relation", relationId: command.relation.id }, changed: JSON.stringify(previous) !== JSON.stringify(command.relation) };
  }
  const previous = document.semanticRelations[command.relationId];
  if (!previous) return { document, inverse: command, changed: false };
  const semanticRelations = { ...document.semanticRelations };
  delete semanticRelations[command.relationId];
  return { document: assertValid({ ...document, semanticRelations }), inverse: { type: "set-semantic-relation", relation: clone(previous) }, changed: true };
};

type PageCommand = Extract<DocumentCommand, { pageId: string }>;

const applyPageCommand = (document: EditorDocument, command: PageCommand): CommandResult => {
  if (command.type === "set-page-grid") {
    const canvas = document.pages[command.pageId]?.canvas;
    if (!canvas) throw new Error(`DOCUMENT_PAGE_MISSING:${command.pageId}`);
    const next = assertValid(replacePageCanvas(document, command.pageId, (current) => ({ ...current, grid: clone(command.grid) })));
    return { document: next, inverse: { type: "set-page-grid", pageId: command.pageId, grid: clone(canvas.grid) }, changed: JSON.stringify(canvas.grid) !== JSON.stringify(command.grid) };
  }
  if (command.type === "set-ruler-settings") {
    const canvas = document.pages[command.pageId]?.canvas;
    if (!canvas) throw new Error(`DOCUMENT_PAGE_MISSING:${command.pageId}`);
    const next = assertValid(replacePageCanvas(document, command.pageId, (current) => ({ ...current, rulers: clone(command.rulers) })));
    return { document: next, inverse: { type: "set-ruler-settings", pageId: command.pageId, rulers: clone(canvas.rulers) }, changed: JSON.stringify(canvas.rulers) !== JSON.stringify(command.rulers) };
  }
  if (command.type === "set-snap-settings") {
    const canvas = document.pages[command.pageId]?.canvas;
    if (!canvas) throw new Error(`DOCUMENT_PAGE_MISSING:${command.pageId}`);
    const next = assertValid(replacePageCanvas(document, command.pageId, (current) => ({ ...current, snap: clone(command.snap) })));
    return { document: next, inverse: { type: "set-snap-settings", pageId: command.pageId, snap: clone(canvas.snap) }, changed: JSON.stringify(canvas.snap) !== JSON.stringify(command.snap) };
  }
  if (command.type === "set-page-viewport") {
    const canvas = document.pages[command.pageId]?.canvas;
    if (!canvas) throw new Error(`DOCUMENT_PAGE_MISSING:${command.pageId}`);
    const next = assertValid(replacePageCanvas(document, command.pageId, (current) => ({ ...current, rest: clone(command.viewport) })));
    return { document: next, inverse: { type: "set-page-viewport", pageId: command.pageId, viewport: clone(canvas.rest) }, changed: JSON.stringify(canvas.rest) !== JSON.stringify(command.viewport) };
  }
  if (command.type === "add-guide") {
    const canvas = document.pages[command.pageId]?.canvas;
    if (!canvas) throw new Error(`DOCUMENT_PAGE_MISSING:${command.pageId}`);
    if (findGuide(canvas, command.guide.id)) throw new Error(`DOCUMENT_GUIDE_EXISTS:${command.guide.id}`);
    const next = assertValid(replacePageCanvas(document, command.pageId, (current) => ({ ...current, guides: [...current.guides, clone(command.guide)] })));
    return { document: next, inverse: { type: "remove-guide", pageId: command.pageId, guideId: command.guide.id }, changed: true };
  }
  if (command.type === "remove-guide") {
    const canvas = document.pages[command.pageId]?.canvas;
    const guide = canvas ? findGuide(canvas, command.guideId) : undefined;
    if (!guide) throw new Error(`DOCUMENT_GUIDE_MISSING:${command.guideId}`);
    const next = assertValid(replacePageCanvas(document, command.pageId, (current) => ({ ...current, guides: current.guides.filter((candidate) => candidate.id !== command.guideId) })));
    return { document: next, inverse: { type: "add-guide", pageId: command.pageId, guide: clone(guide) }, changed: true };
  }
  if (command.type === "move-guide") {
    const canvas = document.pages[command.pageId]?.canvas;
    const guide = canvas ? findGuide(canvas, command.guideId) : undefined;
    if (!guide) throw new Error(`DOCUMENT_GUIDE_MISSING:${command.guideId}`);
    if (!Number.isFinite(command.position)) throw new Error("DOCUMENT_GUIDE_POSITION_INVALID");
    const next = assertValid(replacePageCanvas(document, command.pageId, (current) => ({ ...current, guides: current.guides.map((candidate) => candidate.id === command.guideId ? { ...candidate, position: command.position } : candidate) })));
    return { document: next, inverse: { type: "move-guide", pageId: command.pageId, guideId: command.guideId, position: guide.position }, changed: guide.position !== command.position };
  }
  return { document, inverse: command, changed: false };
};

const pageRootNode = (page: PageRecord): DocumentNode => ({ id: page.rootId, kind: "page-root", name: page.name, parentId: null, childIds: [], bounds: { x: 0, y: 0, width: 1200, height: 800 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } as AffineTransform, visible: true, locked: false, opacity: 1, fill: "#111318", stroke: "#2b3039", cornerRadius: 0, zIndex: 0 });

const applyPageCrudCommand = (
  document: EditorDocument,
  command: Extract<DocumentCommand, { type: "create-page" | "delete-page" | "restore-page" | "reorder-page" | "set-page-name" | "set-page" }>
): CommandResult => {
  if (command.type === "create-page") {
    const page = command.page;
    if (!page || !page.id || !page.name || !page.rootId) throw new Error("DOCUMENT_PAGE_RECORD_INVALID");
    if (document.pages[page.id] || document.pageOrder.includes(page.id)) throw new Error(`DOCUMENT_PAGE_EXISTS:${page.id}`);
    if (document.nodes[page.rootId]) throw new Error(`DOCUMENT_NODE_EXISTS:${page.rootId}`);
    const next = { ...document, pages: { ...document.pages, [page.id]: clone(page) }, pageOrder: [...document.pageOrder, page.id], nodes: { ...document.nodes, [page.rootId]: pageRootNode(page) } };
    return { document: assertValid(next), inverse: { type: "delete-page", pageId: page.id }, changed: true };
  }
  if (command.type === "delete-page") {
    const page = document.pages[command.pageId];
    if (!page) throw new Error(`DOCUMENT_PAGE_MISSING:${command.pageId}`);
    if (document.pageOrder.length <= 1) throw new Error("DOCUMENT_LAST_PAGE");
    const root = document.nodes[page.rootId];
    if (!root) throw new Error(`DOCUMENT_ROOT_MISSING:${page.rootId}`);
    const removed: DocumentNode[] = [];
    const collect = (node: DocumentNode): void => { removed.push(clone(node)); for (const childId of node.childIds) collect(document.nodes[childId]!); };
    collect(root);
    const index = document.pageOrder.indexOf(command.pageId);
    const pages = { ...document.pages };
    delete pages[command.pageId];
    const nodes = { ...document.nodes };
    for (const node of removed) delete nodes[node.id];
    const next = { ...document, pages, pageOrder: document.pageOrder.filter((id) => id !== command.pageId), nodes };
    return { document: assertValid(next), inverse: { type: "restore-page", page: clone(page), root: removed[0]!, nodes: removed, index }, changed: true };
  }
  if (command.type === "restore-page") {
    const { page, root, nodes, index } = command;
    if (document.pages[page.id] || document.pageOrder.includes(page.id) || nodes.some((node) => document.nodes[node.id])) throw new Error("DOCUMENT_RESTORE_INVALID");
    const pageOrder = [...document.pageOrder];
    pageOrder.splice(Math.max(0, Math.min(index, pageOrder.length)), 0, page.id);
    const next = { ...document, pages: { ...document.pages, [page.id]: clone(page) }, pageOrder, nodes: { ...document.nodes } };
    for (const node of [root, ...nodes]) next.nodes[node.id] = clone(node);
    return { document: assertValid(next), inverse: { type: "delete-page", pageId: page.id }, changed: true };
  }
  if (command.type === "reorder-page") {
    if (!document.pages[command.pageId]) throw new Error(`DOCUMENT_PAGE_MISSING:${command.pageId}`);
    const oldIndex = document.pageOrder.indexOf(command.pageId);
    if (oldIndex < 0) throw new Error(`DOCUMENT_PAGE_MISSING:${command.pageId}`);
    if (!Number.isSafeInteger(command.index) || command.index < 0 || command.index >= document.pageOrder.length) throw new Error("DOCUMENT_PAGE_INDEX_INVALID");
    if (oldIndex === command.index) return { document, inverse: command, changed: false };
    const pageOrder = document.pageOrder.filter((id) => id !== command.pageId);
    pageOrder.splice(command.index, 0, command.pageId);
    return { document: assertValid({ ...document, pageOrder }), inverse: { type: "reorder-page", pageId: command.pageId, index: oldIndex }, changed: true };
  }
  if (command.type === "set-page-name") {
    const page = document.pages[command.pageId];
    if (!page) throw new Error(`DOCUMENT_PAGE_MISSING:${command.pageId}`);
    if (typeof command.name !== "string" || command.name.trim().length === 0) throw new Error("DOCUMENT_PAGE_NAME_INVALID");
    const next = assertValid({ ...document, pages: { ...document.pages, [command.pageId]: { ...page, name: command.name.trim() } } });
    return { document: next, inverse: { type: "set-page-name", pageId: command.pageId, name: page.name }, changed: page.name !== command.name.trim() };
  }
  if (command.type === "set-page") {
    if (!document.pages[command.pageId]) throw new Error(`DOCUMENT_PAGE_MISSING:${command.pageId}`);
    return { document, inverse: command, changed: false };
  }
  return { document, inverse: command, changed: false };
};

type PathCommand = Extract<DocumentCommand, { type: "set-path-points" | "insert-path-point" | "remove-path-point" | "set-subpath-closed" | "reverse-subpath" | "set-path-fill-rule" | "replace-path-geometry" | "set-point-type" }>;

const pathNodeOf = (document: EditorDocument, nodeId: string): DocumentNode => {
  const node = document.nodes[nodeId];
  if (!node) throw new Error(`DOCUMENT_NODE_MISSING:${nodeId}`);
  if (node.kind !== "path" || !node.path) throw new Error(`DOCUMENT_PATH_GEOMETRY_MISSING:${nodeId}`);
  return node;
};

/**
 * Applies point records, then recomputes the tight bbox and rebases the whole
 * geometry so its minimum corner is (0,0), moving `bounds.x/y` by the same
 * delta — the on-screen position is unchanged, and every point (touched or
 * not) participates in the rebase. The caller's payload `bounds` is verified
 * against the computed result: a stale caller never silently corrupts.
 */
const orderedNeighbours = (geometry: PathGeometry, subpathId: string, pointId: string): { prev: PathPoint; next: PathPoint } => {
  const ordered = pointsOfSubpath(geometry, subpathId);
  const index = ordered.findIndex((point) => point.id === pointId);
  if (index < 0) throw new Error(`DOCUMENT_POINT_MISSING:${pointId}`);
  if (ordered.length < 3) throw new Error("DOCUMENT_PATH_MIN_POINTS");
  return { prev: ordered[(index - 1 + ordered.length) % ordered.length]!, next: ordered[(index + 1) % ordered.length]! };
};

const verifyAdjacent = (geometry: PathGeometry, prev: PathPoint, point: PathPoint, next: PathPoint): void => {
  const ordered = pointsOfSubpath(geometry, point.subpathId);
  const prevIndex = ordered.findIndex((candidate) => candidate.id === prev.id);
  const nextIndex = ordered.findIndex((candidate) => candidate.id === next.id);
  if (prevIndex < 0 || nextIndex < 0 || nextIndex !== prevIndex + 1) throw new Error("DOCUMENT_PATH_NEIGHBOURS_NOT_ADJACENT");
  if (!(prev.order < point.order && point.order < next.order)) throw new Error("DOCUMENT_PATH_ORDER_KEY");
  for (const candidate of ordered) {
    if (candidate.id === prev.id || candidate.id === point.id || candidate.id === next.id) continue;
    if (candidate.order > prev.order && candidate.order < next.order) throw new Error("DOCUMENT_PATH_ORDER_KEY");
  }
};

/**
 * Applies a complete target point/subpath state exactly as given — nothing
 * moves except the points the payload names, which is what makes every
 * inverse exact. Placement (`bounds.x/y`) is authored by the caller (a drag
 * handler that moved a point past the left edge passes the shifted placement
 * and rebased records; an undo passes the historical ones). Width/height are
 * derived from the geometry and verified against the payload, and the
 * rebase rule (geometry min corner at (0,0)) is enforced by `assertValid` —
 * a caller that forgets it fails loudly, never silently.
 */
const applyPathState = (node: DocumentNode, points: Record<string, PathPoint>, subpaths: PathGeometry["subpaths"], expectedBounds: Rect): { node: DocumentNode } => {
  const geometry: PathGeometry = { ...node.path!, points, subpaths };
  const bbox = computePathBounds(geometry);
  const width = bbox.maxX - bbox.minX;
  const height = bbox.maxY - bbox.minY;
  if (Math.abs(expectedBounds.width - width) > PATH_BOUNDS_TOLERANCE || Math.abs(expectedBounds.height - height) > PATH_BOUNDS_TOLERANCE) throw new Error(`DOCUMENT_PATH_BOUNDS_STALE:${node.id}`);
  return { node: { ...node, bounds: { x: expectedBounds.x, y: expectedBounds.y, width, height }, path: geometry } };
};

const applyPathCommand = (document: EditorDocument, command: PathCommand): CommandResult => {
  const node = pathNodeOf(document, command.nodeId);
  if (command.type === "set-path-points") {
    if (Object.keys(command.pointRecords).length === 0) throw new Error("DOCUMENT_PATH_RECORDS_EMPTY");
    const points = { ...node.path!.points };
    for (const [id, record] of Object.entries(command.pointRecords)) {
      if (!points[id]) throw new Error(`DOCUMENT_POINT_MISSING:${id}`);
      if (points[id]!.subpathId !== record.subpathId || points[id]!.order !== record.order) throw new Error(`DOCUMENT_POINT_STRUCTURE_FIXED:${id}`);
      points[id] = clone(record);
    }
    const applied = applyPathState(node, points, node.path!.subpaths, command.bounds);
    const next = assertValid(replaceNode(document, node.id, () => applied.node));
    const inverseRecords: Record<string, PathPoint> = {};
    for (const id of Object.keys(command.pointRecords)) inverseRecords[id] = clone(node.path!.points[id]!);
    return { document: next, inverse: { type: "set-path-points", nodeId: node.id, pointRecords: inverseRecords, bounds: clone(node.bounds) }, changed: Object.keys(inverseRecords).some((id) => JSON.stringify(points[id]) !== JSON.stringify(node.path!.points[id])) };
  }
  if (command.type === "set-point-type") {
    const point = node.path!.points[command.pointId];
    if (!point) throw new Error(`DOCUMENT_POINT_MISSING:${command.pointId}`);
    // The target mode dictates the stored handle shape; a caller carrying
    // handles a mode forbids is a contract violation, refused loudly.
    if ((command.mode === "corner" || command.mode === "auto") && (command.handleIn || command.handleOut)) throw new Error("VECTOR_POINT_AUTO_HANDLES");
    if (command.mode === "mirrored" && command.handleIn) throw new Error("DOCUMENT_PATH_MIRRORED_HANDLE_IN");
    const updated: PathPoint = {
      id: point.id,
      subpathId: point.subpathId,
      order: point.order,
      x: point.x,
      y: point.y,
      handleMode: command.mode,
      ...(command.handleIn !== undefined ? { handleIn: clone(command.handleIn) } : {}),
      ...(command.handleOut !== undefined ? { handleOut: clone(command.handleOut) } : {}),
    };
    if (command.mode === "corner" || command.mode === "auto" || command.mode === "mirrored") {
      // corner/auto store nothing; mirrored stores only the outgoing handle.
      delete updated.handleIn;
      if (command.mode !== "mirrored") delete updated.handleOut;
    }
    const points = { ...node.path!.points, [point.id]: updated };
    const applied = applyPathState(node, points, node.path!.subpaths, command.bounds);
    const next = assertValid(replaceNode(document, node.id, () => applied.node));
    // The inverse restores the pre-conversion point record exactly — mode
    // and handles — so undo is byte-exact regardless of the matrix.
    const inverse: DocumentCommand = {
      type: "set-point-type",
      nodeId: node.id,
      pointId: point.id,
      mode: point.handleMode,
      bounds: clone(node.bounds),
      ...(point.handleIn !== undefined ? { handleIn: clone(point.handleIn) } : {}),
      ...(point.handleOut !== undefined ? { handleOut: clone(point.handleOut) } : {}),
    };
    return { document: next, inverse, changed: JSON.stringify(updated) !== JSON.stringify(point) };
  }
  if (command.type === "insert-path-point") {
    if (node.path!.points[command.point.id]) throw new Error(`DOCUMENT_POINT_EXISTS:${command.point.id}`);
    if (!node.path!.subpaths[command.point.subpathId]) throw new Error(`DOCUMENT_SUBPATH_MISSING:${command.point.subpathId}`);
    verifyAdjacent(node.path!, command.prev, command.point, command.next);
    const points = { ...node.path!.points, [command.point.id]: clone(command.point), [command.prev.id]: clone(command.prev), [command.next.id]: clone(command.next) };
    const applied = applyPathState(node, points, node.path!.subpaths, command.bounds);
    const next = assertValid(replaceNode(document, node.id, () => applied.node));
    // The inverse removes the inserted point and restores the PRE-SPLIT
    // neighbour records — the state that existed before this insert, not the
    // post-split records the payload carried.
    return { document: next, inverse: { type: "remove-path-point", nodeId: node.id, point: clone(command.point), prev: clone(node.path!.points[command.prev.id]!), next: clone(node.path!.points[command.next.id]!), bounds: clone(node.bounds) }, changed: true };
  }
  if (command.type === "remove-path-point") {
    if (!node.path!.points[command.point.id]) throw new Error(`DOCUMENT_POINT_MISSING:${command.point.id}`);
    if (node.path!.points[command.point.id]!.subpathId !== command.point.subpathId) throw new Error("DOCUMENT_PATH_ORDER_KEY");
    const ordered = pointsOfSubpath(node.path!, command.point.subpathId);
    if (ordered.length <= 2) throw new Error("DOCUMENT_PATH_MIN_POINTS");
    const index = ordered.findIndex((candidate) => candidate.id === command.point.id);
    if (index < 0) throw new Error(`DOCUMENT_POINT_MISSING:${command.point.id}`);
    const prevId = ordered[(index - 1 + ordered.length) % ordered.length]!.id;
    const nextId = ordered[(index + 1) % ordered.length]!.id;
    if (command.prev.id !== prevId || command.next.id !== nextId) throw new Error("DOCUMENT_PATH_NEIGHBOURS_NOT_ADJACENT");
    const removed = node.path!.points[command.point.id]!;
    const points = { ...node.path!.points };
    delete points[command.point.id];
    points[command.prev.id] = clone(command.prev);
    points[command.next.id] = clone(command.next);
    const applied = applyPathState(node, points, node.path!.subpaths, command.bounds);
    const next = assertValid(replaceNode(document, node.id, () => applied.node));
    // The inverse re-inserts the removed point and restores the ORIGINAL
    // (pre-delete) neighbour records — the payload's records live in the
    // post-remove frame and would corrupt the restore.
    return { document: next, inverse: { type: "insert-path-point", nodeId: node.id, point: clone(removed), prev: clone(node.path!.points[command.prev.id]!), next: clone(node.path!.points[command.next.id]!), bounds: clone(node.bounds) }, changed: true };
  }
  if (command.type === "set-subpath-closed") {
    const subpath = node.path!.subpaths[command.subpathId];
    if (!subpath) throw new Error(`DOCUMENT_SUBPATH_MISSING:${command.subpathId}`);
    const ordered = pointsOfSubpath(node.path!, command.subpathId);
    if (ordered.length < 2) throw new Error("DOCUMENT_PATH_MIN_POINTS");
    const firstId = ordered[0]!.id;
    const lastId = ordered[ordered.length - 1]!.id;
    if (command.endAnchors.first.id !== firstId || command.endAnchors.last.id !== lastId) throw new Error("DOCUMENT_PATH_END_ANCHORS");
    const points = { ...node.path!.points, [command.endAnchors.first.id]: clone(command.endAnchors.first), [command.endAnchors.last.id]: clone(command.endAnchors.last) };
    const subpaths = { ...node.path!.subpaths, [command.subpathId]: { id: command.subpathId, closed: command.closed } };
    const applied = applyPathState(node, points, subpaths, command.bounds);
    const next = assertValid(replaceNode(document, node.id, () => applied.node));
    return { document: next, inverse: { type: "set-subpath-closed", nodeId: node.id, subpathId: command.subpathId, closed: !command.closed, endAnchors: { first: clone(ordered[0]!), last: clone(ordered[ordered.length - 1]!) }, bounds: clone(node.bounds) }, changed: subpath.closed !== command.closed || JSON.stringify({ first: command.endAnchors.first, last: command.endAnchors.last }) !== JSON.stringify({ first: ordered[0]!, last: ordered[ordered.length - 1]! }) };
  }
  if (command.type === "reverse-subpath") {
    if (!node.path!.subpaths[command.subpathId]) throw new Error(`DOCUMENT_SUBPATH_MISSING:${command.subpathId}`);
    const ordered = pointsOfSubpath(node.path!, command.subpathId);
    const points: Record<string, PathPoint> = { ...node.path!.points };
    for (const point of ordered) {
      if (point.handleMode === "corner") points[point.id] = { ...point, order: reverseOrderKey(point.order) };
      else if (point.handleMode === "mirrored") {
        const out = point.handleOut;
        points[point.id] = out ? { ...point, order: reverseOrderKey(point.order), handleOut: { dx: out.dx === 0 ? 0 : -out.dx, dy: out.dy === 0 ? 0 : -out.dy } } : { ...point, order: reverseOrderKey(point.order) };
      } else {
        points[point.id] = { ...point, order: reverseOrderKey(point.order), ...(point.handleOut ? { handleIn: point.handleOut } : {}), ...(point.handleIn ? { handleOut: point.handleIn } : {}) };
      }
    }
    const geometry: PathGeometry = { ...node.path!, points };
    const next = assertValid(replaceNode(document, node.id, (candidate) => ({ ...candidate, path: geometry })));
    return { document: next, inverse: command, changed: true };
  }
  if (command.type === "set-path-fill-rule") {
    if (command.fillRule !== "nonzero" && command.fillRule !== "evenodd") throw new Error("DOCUMENT_PATH_FILL_RULE");
    if (node.path!.fillRule === command.fillRule) return { document, inverse: command, changed: false };
    const geometry: PathGeometry = { ...node.path!, fillRule: command.fillRule };
    const next = assertValid(replaceNode(document, node.id, (candidate) => ({ ...candidate, path: geometry })));
    return { document: next, inverse: { type: "set-path-fill-rule", nodeId: node.id, fillRule: node.path!.fillRule }, changed: true };
  }
  // replace-path-geometry: whole-content replacement; the inverse is the previous geometry.
  if (JSON.stringify(node.path) === JSON.stringify(command.geometry)) return { document, inverse: command, changed: false };
  const applied = applyPathState(node, clone(command.geometry).points, clone(command.geometry).subpaths, command.bounds);
  const geometry: PathGeometry = { ...applied.node.path!, fillRule: command.geometry.fillRule };
  const finalNode = { ...applied.node, path: geometry };
  const next = assertValid(replaceNode(document, node.id, () => finalNode));
  return { document: next, inverse: { type: "replace-path-geometry", nodeId: node.id, geometry: clone(node.path!), bounds: clone(node.bounds) }, changed: true };
};

/**
 * The boolean commands (the `vector-editing` change, section 4): a
 * DESTRUCTIVE join of path operands (the non-destructive compound is the
 * additive form). `boolean-operate` validates the preconditions (the engine
 * throws the `VECTOR_BOOLEAN_*` codes), computes the merged geometry from the
 * operands' RESOLVED geometry (pinned geometry + bounds placement), creates
 * ONE new path node with the topmost operand's fill and zIndex, and deletes
 * the operands. The inverse is `restore-boolean-operands` carrying the
 * original operand records byte-exactly, so undo is exact regardless of the
 * computation. Both commands go through `assertValid` — the multi-node
 * mutation must produce a valid document.
 */
type BooleanCommand = Extract<DocumentCommand, { type: "boolean-operate" } | { type: "restore-boolean-operands" }>;

const BOOLEAN_OPERATION_NAMES: Record<BooleanOperation, string> = { union: "Union", intersect: "Intersect", subtract: "Subtract", exclude: "Exclude" };

const mintBooleanNodeId = (document: EditorDocument): DocumentId => {
  let n = 0;
  while (document.nodes[`boolean-${n}`]) n += 1;
  return `boolean-${n}`;
};

const applyBooleanCommand = (document: EditorDocument, command: BooleanCommand): CommandResult => {
  if (command.type === "restore-boolean-operands") {
    const resultNode = document.nodes[command.resultNodeId];
    if (!resultNode) throw new Error(`DOCUMENT_NODE_MISSING:${command.resultNodeId}`);
    if (resultNode.kind !== "path" || resultNode.childIds.length > 0) throw new Error("DOCUMENT_RESTORE_INVALID");
    if (command.operands.length < 2) throw new Error("VECTOR_BOOLEAN_MIN_OPERANDS");
    if (command.operands.some((node) => document.nodes[node.id])) throw new Error("DOCUMENT_RESTORE_INVALID");
    const parent = document.nodes[command.parentId];
    if (!parent) throw new Error(`DOCUMENT_PARENT_MISSING:${command.parentId}`);
    const next = { ...document, nodes: { ...document.nodes } };
    delete next.nodes[command.resultNodeId];
    for (const node of command.operands) next.nodes[node.id] = clone(node);
    const childIds = parent.childIds.filter((id) => id !== command.resultNodeId);
    childIds.splice(Math.max(0, Math.min(command.index, childIds.length)), 0, ...command.operands.map((node) => node.id));
    next.nodes[parent.id] = { ...parent, childIds };
    // The inverse is the forward `boolean-operate` with the same payload —
    // the result node is recomputed (a fresh id), the operands removed.
    return { document: assertValid(next), inverse: { type: "boolean-operate", nodeIds: command.operands.map((node) => node.id), operation: command.operation }, changed: true };
  }
  const ids = [...new Set(command.nodeIds)];
  if (ids.length < 2) throw new Error("VECTOR_BOOLEAN_MIN_OPERANDS");
  const nodes = ids.map((id) => pathNodeOf(document, id));
  const parentId = nodes[0]!.parentId;
  // The inverse restores ONE parent/index, so mixed parents are unrepresentable — refused loudly.
  if (parentId === null || nodes.some((node) => node.parentId !== parentId)) throw new Error("VECTOR_BOOLEAN_PARENTS_DIFFER");
  const parent = document.nodes[parentId]!;
  const indices = nodes.map((node) => parent.childIds.indexOf(node.id));
  if (indices.some((index) => index < 0)) throw new Error("DOCUMENT_REORDER_CHILD_MISSING");
  const operands: BooleanOperand[] = nodes.map((node) => ({ geometry: node.path!, placement: { x: node.bounds.x, y: node.bounds.y } }));
  const resultId = mintBooleanNodeId(document);
  const result = booleanOperate(operands, command.operation, resultId);
  const bbox = computePathBounds(result.geometry);
  const topmost = nodes[indices.indexOf(Math.max(...indices))]!;
  const resultNode: DocumentNode = {
    id: resultId,
    kind: "path",
    name: BOOLEAN_OPERATION_NAMES[command.operation],
    parentId,
    childIds: [],
    bounds: { x: result.placement.x, y: result.placement.y, width: bbox.maxX - bbox.minX, height: bbox.maxY - bbox.minY },
    transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    visible: true,
    locked: false,
    opacity: 1,
    fill: topmost.fill,
    stroke: topmost.stroke,
    cornerRadius: 0,
    zIndex: topmost.zIndex,
    path: result.geometry,
  };
  const insertIndex = Math.min(...indices);
  const childIds = parent.childIds.filter((id) => !ids.includes(id));
  childIds.splice(insertIndex, 0, resultId);
  const next = { ...document, nodes: { ...document.nodes } };
  for (const node of nodes) delete next.nodes[node.id];
  next.nodes[resultId] = resultNode;
  next.nodes[parentId] = { ...parent, childIds };
  // The inverse restores the operands in their original child order, so the
  // undone document is byte-exact (the payload order is the caller's order —
  // selection order, which need not be the z-order).
  const inChildOrder = nodes.map((node, i) => ({ node, index: indices[i]! })).sort((left, right) => left.index - right.index).map(({ node }) => clone(node));
  return { document: assertValid(next), inverse: { type: "restore-boolean-operands", resultNodeId: resultId, operands: inChildOrder, parentId, index: insertIndex, operation: command.operation }, changed: true };
};

/**
 * The compound commands (the `vector-editing` change, section 5): the
 * NON-DESTRUCTIVE boolean form. `create-compound` wraps shape nodes (the
 * members become the compound's ordered `childIds` — subtract/exclude read
 * the order) and derives the outline bounds from the merged geometry;
 * `set-compound-op` and `reorder-compound-member` change the outline's
 * inputs and re-derive the bounds; `flatten-compound` is the destructive
 * bake — ONE path node carrying the resolved outline (multi-subpath results
 * are fully representable: holes and disjoint contours are ordinary
 * subpaths), and the compound + member subtrees are deleted. The compound's
 * `bounds` are DERIVED state everywhere: commands recompute them from the
 * outline and carry no bounds in their inverses (undo/redo re-derive from
 * the restored members).
 *
 * Inverses follow the boolean precedent: `restore-compound-members` carries
 * the member records byte-exactly (its own inverse is the forward
 * `create-compound` with the same payload, recomputing the derived state);
 * `restore-flattened-compound` carries the whole removed set — the compound
 * record and every member subtree — byte-exactly (its own inverse is the
 * forward `flatten-compound`, which mints a fresh result id on redo).
 * Everything goes through `assertValid`.
 */
type CompoundCommand = Extract<DocumentCommand,
  | { type: "create-compound" }
  | { type: "restore-compound-members" }
  | { type: "set-compound-op" }
  | { type: "reorder-compound-member" }
  | { type: "flatten-compound" }
  | { type: "restore-flattened-compound" }>;

const COMPOUND_OPERATION_NAMES: Record<CompoundOperation, string> = { union: "Union", intersect: "Intersect", subtract: "Subtract", exclude: "Exclude" };

const isCompoundOperation = (operation: unknown): operation is CompoundOperation =>
  operation === "union" || operation === "intersect" || operation === "subtract" || operation === "exclude";

/** The shape-producing member kinds: rectangle, frame, path. Groups, text,
 *  images and nested compounds are refused (a group member would silently
 *  drop its subtree from the outline — the projection consumes member
 *  geometry directly, with no nested resolution in v1). */
const isCompoundMemberKind = (kind: NodeKind): boolean => kind === "rectangle" || kind === "frame" || kind === "path";

const compoundNodeOf = (document: EditorDocument, nodeId: DocumentId): DocumentNode & { kind: "compound"; compound: Compound } => {
  const node = document.nodes[nodeId];
  if (!node) throw new Error(`DOCUMENT_NODE_MISSING:${nodeId}`);
  if (node.kind !== "compound" || !node.compound) throw new Error(`DOCUMENT_COMPOUND_MISSING:${nodeId}`);
  return node as DocumentNode & { kind: "compound"; compound: Compound };
};

/** The compound's outline under `operation` (default: the current one),
 *  resolved STRICTLY — member kinds are validated loudly and the engine's
 *  `VECTOR_BOOLEAN_*` precondition codes surface as-is. `node` may be a
 *  virtual compound (e.g. a reordered view of the same members): the outline
 *  reads the member ORDER it carries, so subtract/exclude re-resolve. */
const compoundOutlineResult = (document: EditorDocument, node: DocumentNode & { kind: "compound"; compound: Compound }, operation?: CompoundOperation): BooleanResult => {
  if (operation !== undefined && !isCompoundOperation(operation)) throw new Error("COMPOUND_OPERATION_INVALID");
  const members: BooleanOperand[] = node.childIds.map((childId) => {
    const member = document.nodes[childId];
    if (!member) throw new Error(`DOCUMENT_NODE_MISSING:${childId}`);
    if (!isCompoundMemberKind(member.kind)) throw new Error(`COMPOUND_MEMBER_KIND_UNSUPPORTED:${childId}`);
    const operand = compoundMemberOperand(document, childId);
    if (!operand) throw new Error(`DOCUMENT_PATH_GEOMETRY_MISSING:${childId}`);
    return operand;
  });
  if (members.length < 2) throw new Error("COMPOUND_MIN_MEMBERS");
  return booleanOperate(members, operation ?? node.compound.operation, `${node.id}-outline`);
};

/** The derived bounds of a resolved outline: the world bbox (pinned geometry
 *  + placement), the compound's auto-fit (Figma's published behavior). */
const outlineBounds = (result: BooleanResult): Rect => {
  const bbox = computePathBounds(result.geometry);
  return { x: result.placement.x, y: result.placement.y, width: bbox.maxX - bbox.minX, height: bbox.maxY - bbox.minY };
};

/** A boolean result that produced no outline at all (disjoint intersect,
 *  full-cover subtract, identical exclude) encloses no area: the derived
 *  bounds model cannot hold it. The engine's own vocabulary — the aggregate
 *  region fails the same area precondition the operands do. */
const requireOutlineArea = (result: BooleanResult): void => {
  if (Object.keys(result.geometry.subpaths).length === 0) throw new Error("VECTOR_BOOLEAN_NO_AREA");
};

const mintFlattenNodeId = (document: EditorDocument): DocumentId => {
  let n = 0;
  while (document.nodes[`flatten-${n}`]) n += 1;
  return `flatten-${n}`;
};

const collectSubtree = (document: EditorDocument, root: DocumentNode, removed: DocumentNode[]): void => {
  removed.push(clone(root));
  for (const childId of root.childIds) collectSubtree(document, document.nodes[childId]!, removed);
};

const applyCompoundCommand = (document: EditorDocument, command: CompoundCommand): CommandResult => {
  if (command.type === "restore-compound-members") {
    const compound = compoundNodeOf(document, command.compoundNodeId);
    if (command.members.length < 2) throw new Error("COMPOUND_MIN_MEMBERS");
    if (JSON.stringify(compound.childIds) !== JSON.stringify(command.members.map((member) => member.id))) throw new Error("DOCUMENT_RESTORE_INVALID");
    // The members still EXIST at undo time (the forward command reparented
    // them under the compound — unlike the boolean join, which deleted them);
    // the payload records are the pre-reparent byte-exact originals.
    if (command.members.some((member) => !document.nodes[member.id])) throw new Error("DOCUMENT_RESTORE_INVALID");
    const parent = document.nodes[command.parentId];
    if (!parent) throw new Error(`DOCUMENT_PARENT_MISSING:${command.parentId}`);
    const next = { ...document, nodes: { ...document.nodes } };
    delete next.nodes[command.compoundNodeId];
    for (const member of command.members) next.nodes[member.id] = clone(member);
    const childIds = parent.childIds.filter((id) => id !== command.compoundNodeId);
    childIds.splice(Math.max(0, Math.min(command.index, childIds.length)), 0, ...command.members.map((member) => member.id));
    next.nodes[parent.id] = { ...parent, childIds };
    // The inverse is the forward `create-compound` with the same payload —
    // the compound's derived state (bounds, fill, zIndex) recomputes from
    // the byte-exact members, so redo reproduces the original compound.
    return { document: assertValid(next), inverse: { type: "create-compound", nodeId: command.compoundNodeId, parentId: command.parentId, index: command.index, memberIds: command.members.map((member) => member.id), operation: command.operation }, changed: true };
  }
  if (command.type === "create-compound") {
    if (document.nodes[command.nodeId]) throw new Error(`DOCUMENT_NODE_EXISTS:${command.nodeId}`);
    if (!isCompoundOperation(command.operation)) throw new Error("COMPOUND_OPERATION_INVALID");
    const memberIds = [...new Set(command.memberIds)];
    if (memberIds.length < 2) throw new Error("COMPOUND_MIN_MEMBERS");
    const members = memberIds.map((id) => {
      const member = document.nodes[id];
      if (!member) throw new Error(`DOCUMENT_NODE_MISSING:${id}`);
      return member;
    });
    const parent = document.nodes[command.parentId];
    if (!parent) throw new Error(`DOCUMENT_PARENT_MISSING:${command.parentId}`);
    // The inverse restores ONE parent and ONE index, so mixed-parent members
    // are unrepresentable — refused loudly (the boolean precedent's added
    // code for the same representational constraint).
    if (members.some((member) => member.parentId !== command.parentId)) throw new Error("COMPOUND_MEMBERS_PARENTS_DIFFER");
    for (const member of members) {
      if (!isCompoundMemberKind(member.kind)) throw new Error(`COMPOUND_MEMBER_KIND_UNSUPPORTED:${member.id}`);
    }
    const operands = members.map((member) => compoundMemberOperand(document, member.id)!);
    const result = booleanOperate(operands, command.operation, `${command.nodeId}-outline`);
    requireOutlineArea(result);
    const indices = members.map((member) => parent.childIds.indexOf(member.id));
    if (indices.some((index) => index < 0)) throw new Error("DOCUMENT_REORDER_CHILD_MISSING");
    // The compound inherits the topmost member's surface (fill, stroke,
    // zIndex) — the boolean-operate precedent.
    const topmost = members[indices.indexOf(Math.max(...indices))]!;
    const compoundNode: DocumentNode = {
      id: command.nodeId,
      kind: "compound",
      name: COMPOUND_OPERATION_NAMES[command.operation],
      parentId: command.parentId,
      childIds: memberIds,
      bounds: outlineBounds(result),
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true,
      locked: false,
      opacity: 1,
      fill: topmost.fill,
      stroke: topmost.stroke,
      cornerRadius: 0,
      zIndex: topmost.zIndex,
      compound: { operation: command.operation },
    };
    const insertIndex = Number.isSafeInteger(command.index) ? Math.max(0, Math.min(command.index, parent.childIds.length - memberIds.length)) : Math.min(...indices);
    const next = { ...document, nodes: { ...document.nodes } };
    next.nodes[command.nodeId] = compoundNode;
    for (const member of members) next.nodes[member.id] = { ...member, parentId: command.nodeId };
    const childIds = parent.childIds.filter((id) => !memberIds.includes(id));
    childIds.splice(insertIndex, 0, command.nodeId);
    next.nodes[parent.id] = { ...parent, childIds };
    const inChildOrder = members.map((member, i) => ({ member, index: indices[i]! })).sort((left, right) => left.index - right.index).map(({ member }) => clone(member));
    return { document: assertValid(next), inverse: { type: "restore-compound-members", compoundNodeId: command.nodeId, members: inChildOrder, parentId: command.parentId, index: insertIndex, operation: command.operation }, changed: true };
  }
  if (command.type === "set-compound-op") {
    const node = compoundNodeOf(document, command.nodeId);
    if (!isCompoundOperation(command.operation)) throw new Error("COMPOUND_OPERATION_INVALID");
    if (node.compound.operation === command.operation) return { document, inverse: command, changed: false };
    const result = compoundOutlineResult(document, node, command.operation);
    requireOutlineArea(result);
    const next = assertValid(replaceNode(document, node.id, (candidate) => ({
      ...candidate,
      compound: { operation: command.operation },
      bounds: outlineBounds(result),
    })));
    return { document: next, inverse: { type: "set-compound-op", nodeId: node.id, operation: node.compound.operation }, changed: true };
  }
  if (command.type === "reorder-compound-member") {
    const node = compoundNodeOf(document, command.nodeId);
    if (!Number.isSafeInteger(command.fromIndex) || !Number.isSafeInteger(command.toIndex) || command.fromIndex < 0 || command.fromIndex >= node.childIds.length || command.toIndex < 0 || command.toIndex >= node.childIds.length) throw new Error("COMPOUND_MEMBER_INDEX_INVALID");
    if (command.fromIndex === command.toIndex) return { document, inverse: command, changed: false };
    const reordered = [...node.childIds];
    const [moved] = reordered.splice(command.fromIndex, 1);
    reordered.splice(command.toIndex, 0, moved!);
    // Subtract/exclude read the member order, so a reorder can change the
    // outline itself — the outline resolves from the REORDERED members and
    // the bounds are re-derived from it (union/intersect recompute to the
    // same value).
    const result = compoundOutlineResult(document, { ...node, childIds: reordered });
    requireOutlineArea(result);
    const next = assertValid(replaceNode(document, node.id, (candidate) => ({ ...candidate, childIds: reordered, bounds: outlineBounds(result) })));
    return { document: next, inverse: { type: "reorder-compound-member", nodeId: node.id, fromIndex: command.toIndex, toIndex: command.fromIndex }, changed: true };
  }
  if (command.type === "flatten-compound") {
    const node = compoundNodeOf(document, command.nodeId);
    // The engine's precondition codes surface as-is; only a truly
    // unproducible outline is unrepresentable. Multi-subpath results (holes
    // and disjoint contours) are FULLY representable in the path model —
    // they are ordinary subpaths, never a diagnostic. (The Sketch-derived
    // warning is about a model that cannot hold them; Crafty's can.)
    const result = compoundOutlineResult(document, node);
    if (Object.keys(result.geometry.subpaths).length === 0) throw new Error("VECTOR_FLATTEN_UNREPRESENTABLE");
    const parentId = node.parentId;
    if (!parentId) throw new Error(`DOCUMENT_PARENT_MISSING:${command.nodeId}`);
    const parent = document.nodes[parentId];
    if (!parent) throw new Error(`DOCUMENT_PARENT_MISSING:${parentId}`);
    const index = parent.childIds.indexOf(node.id);
    if (index < 0) throw new Error("DOCUMENT_REORDER_CHILD_MISSING");
    const bbox = computePathBounds(result.geometry);
    const flattenedId = mintFlattenNodeId(document);
    const flattened: DocumentNode = {
      id: flattenedId,
      kind: "path",
      name: node.name,
      parentId,
      childIds: [],
      bounds: { x: result.placement.x, y: result.placement.y, width: bbox.maxX - bbox.minX, height: bbox.maxY - bbox.minY },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: node.visible,
      locked: node.locked,
      opacity: node.opacity,
      fill: node.fill,
      stroke: node.stroke,
      cornerRadius: 0,
      zIndex: node.zIndex,
      path: result.geometry,
    };
    const removed: DocumentNode[] = [];
    collectSubtree(document, node, removed);
    const next = { ...document, nodes: { ...document.nodes } };
    for (const entry of removed) delete next.nodes[entry.id];
    next.nodes[flattenedId] = flattened;
    const childIds = parent.childIds.filter((id) => id !== node.id);
    childIds.splice(Math.max(0, Math.min(index, childIds.length)), 0, flattenedId);
    next.nodes[parent.id] = { ...parent, childIds };
    // The inverse restores the whole removed set — the compound record and
    // every member subtree — byte-exactly, like restore-subtree.
    return { document: assertValid(next), inverse: { type: "restore-flattened-compound", flattenedNodeId: flattenedId, compoundNodeId: node.id, nodes: removed, parentId, index }, changed: true };
  }
  const flattened = document.nodes[command.flattenedNodeId];
  if (!flattened || flattened.kind !== "path" || flattened.childIds.length > 0) throw new Error("DOCUMENT_RESTORE_INVALID");
  if (command.nodes.some((node) => document.nodes[node.id])) throw new Error("DOCUMENT_RESTORE_INVALID");
  const compound = command.nodes.find((node) => node.id === command.compoundNodeId);
  if (!compound || compound.kind !== "compound" || compound.parentId !== command.parentId) throw new Error("DOCUMENT_RESTORE_INVALID");
  const parent = document.nodes[command.parentId];
  if (!parent) throw new Error(`DOCUMENT_PARENT_MISSING:${command.parentId}`);
  const next = { ...document, nodes: { ...document.nodes } };
  delete next.nodes[command.flattenedNodeId];
  for (const node of command.nodes) next.nodes[node.id] = clone(node);
  const childIds = parent.childIds.filter((id) => id !== command.flattenedNodeId);
  childIds.splice(Math.max(0, Math.min(command.index, childIds.length)), 0, compound.id);
  next.nodes[parent.id] = { ...parent, childIds };
  // The inverse is the forward `flatten-compound` — the outline recomputes
  // from the restored members and the result node is minted fresh on redo.
  return { document: assertValid(next), inverse: { type: "flatten-compound", nodeId: command.compoundNodeId }, changed: true };
};

export const applyDocumentCommand = (document: EditorDocument, command: DocumentCommand): CommandResult => {
  if (command.type === "create-component-definition" || command.type === "update-component-definition" || command.type === "delete-component-definition" || command.type === "create-component-instance" || command.type === "set-instance-properties" || command.type === "set-instance-override" || command.type === "clear-instance-override" || command.type === "detach-component-instance" || command.type === "restore-detached-instance") return applyComponentCommand(document, command);
  if (command.type === "set-path-points" || command.type === "insert-path-point" || command.type === "remove-path-point" || command.type === "set-subpath-closed" || command.type === "reverse-subpath" || command.type === "set-path-fill-rule" || command.type === "replace-path-geometry" || command.type === "set-point-type") return applyPathCommand(document, command);
  if (command.type === "boolean-operate" || command.type === "restore-boolean-operands") return applyBooleanCommand(document, command);
  if (command.type === "create-compound" || command.type === "restore-compound-members" || command.type === "set-compound-op" || command.type === "reorder-compound-member" || command.type === "flatten-compound" || command.type === "restore-flattened-compound") return applyCompoundCommand(document, command);
  if (command.type === "set-page-grid" || command.type === "set-ruler-settings" || command.type === "set-snap-settings" || command.type === "set-page-viewport" || command.type === "add-guide" || command.type === "move-guide" || command.type === "remove-guide") return applyPageCommand(document, command);
  if (command.type === "create-page" || command.type === "delete-page" || command.type === "restore-page" || command.type === "reorder-page" || command.type === "set-page-name" || command.type === "set-page") return applyPageCrudCommand(document, command);
  if (command.type === "set-surface" || command.type === "clear-surface" || command.type === "set-semantic-relation" || command.type === "delete-semantic-relation") return applySemanticCommand(document, command);
   const multiNodeCommand = command.type === "align-nodes" || command.type === "distribute-nodes" || command.type === "move-nodes";
   const current = command.type === "create-node" || command.type === "set-metadata" || command.type === "delete-metadata" || command.type === "restore-subtree" || command.type === "mint-and-insert" || command.type === "delete-pasted-nodes" || multiNodeCommand || command.type === "restore-node-bounds" ? undefined : document.nodes[command.nodeId];
   if (command.type !== "create-node" && command.type !== "restore-subtree" && command.type !== "set-metadata" && command.type !== "delete-metadata" && command.type !== "mint-and-insert" && command.type !== "delete-pasted-nodes" && !multiNodeCommand && command.type !== "restore-node-bounds" && !current) throw new Error(`DOCUMENT_NODE_MISSING:${"nodeId" in command ? command.nodeId : "unknown"}`);
  if (command.type === "create-node") {
    if (document.nodes[command.node.id]) throw new Error(`DOCUMENT_NODE_EXISTS:${command.node.id}`);
    const parent = command.node.parentId ? document.nodes[command.node.parentId] : undefined;
    if (command.node.parentId && !parent) throw new Error(`DOCUMENT_PARENT_MISSING:${command.node.parentId}`);
    const next = { ...document, nodes: { ...document.nodes, [command.node.id]: clone(command.node) } };
    if (parent) next.nodes[parent.id] = { ...parent, childIds: [...parent.childIds, command.node.id] };
    return { document: assertValid(next), inverse: { type: "delete-node", nodeId: command.node.id }, changed: true };
  }
  if (command.type === "delete-node") {
    if (current!.childIds.length > 0) throw new Error("DOCUMENT_DELETE_NON_LEAF");
    const next = { ...document, nodes: { ...document.nodes } };
    delete next.nodes[current!.id];
    if (current!.parentId) next.nodes[current!.parentId] = { ...next.nodes[current!.parentId]!, childIds: next.nodes[current!.parentId]!.childIds.filter((id) => id !== current!.id) };
    return { document: assertValid(next), inverse: { type: "create-node", node: clone(current!) }, changed: true };
  }
  if (command.type === "delete-subtree") {
    const root = current!;
    const removed: DocumentNode[] = [];
    const collect = (node: DocumentNode): void => {
      removed.push(clone(node));
      for (const childId of node.childIds) collect(document.nodes[childId]!);
    };
    collect(root);
    const removedIds = new Set(removed.map((node) => node.id));
    if (Object.values(document.surfaces).some((surface) => removedIds.has(surface.nodeId)) || Object.values(document.semanticRelations).some((relation) => removedIds.has(relation.sourceNodeId) || (relation.targetNodeId !== undefined && removedIds.has(relation.targetNodeId)))) throw new Error("DOCUMENT_SEMANTIC_SUBTREE_DELETE");
    const next = { ...document, nodes: { ...document.nodes } };
    for (const node of removed) delete next.nodes[node.id];
    const parentId = root.parentId;
    if (!parentId) throw new Error("DOCUMENT_DELETE_ROOT");
    const parent = next.nodes[parentId];
    if (!parent) throw new Error(`DOCUMENT_PARENT_MISSING:${parentId}`);
    const index = parent.childIds.indexOf(root.id);
    next.nodes[parentId] = { ...parent, childIds: parent.childIds.filter((id) => id !== root.id) };
    return { document: assertValid(next), inverse: { type: "restore-subtree", nodes: removed, parentId, index }, changed: true };
  }
  if (command.type === "restore-subtree") {
    const parent = document.nodes[command.parentId];
    if (!parent || command.nodes.some((node) => document.nodes[node.id])) throw new Error("DOCUMENT_RESTORE_INVALID");
    const next = { ...document, nodes: { ...document.nodes }, surfaces: { ...document.surfaces }, semanticRelations: { ...document.semanticRelations } };
    for (const node of command.nodes) next.nodes[node.id] = clone(node);
    for (const [id, surface] of Object.entries(command.surfaces ?? {})) next.surfaces[id] = clone(surface);
    for (const [id, relation] of Object.entries(command.semanticRelations ?? {})) next.semanticRelations[id] = clone(relation);
    const roots = command.nodes.filter((node) => node.parentId === command.parentId);
    if (roots.length === 0) throw new Error("DOCUMENT_RESTORE_ROOT_MISSING");
    const childIds = [...parent.childIds];
    childIds.splice(Math.max(0, Math.min(command.index, childIds.length)), 0, ...roots.map((node) => node.id));
    next.nodes[parent.id] = { ...parent, childIds };
    return { document: assertValid(next), inverse: { type: "delete-pasted-nodes", nodeIds: roots.map((node) => node.id) }, changed: true };
  }
  if (command.type === "mint-and-insert") {
    const parent = document.nodes[command.parentId];
    if (!parent) throw new Error(`DOCUMENT_PARENT_MISSING:${command.parentId}`);
    if (command.nodes.length === 0) throw new Error("DOCUMENT_PASTE_EMPTY");
    if (command.nodes.some((node) => document.nodes[node.id])) throw new Error("DOCUMENT_PASTE_ID_COLLISION");
    const ids = new Set(command.nodes.map((node) => node.id));
    const roots = command.nodes.filter((node) => node.parentId === command.parentId);
    if (roots.length === 0) throw new Error("DOCUMENT_PASTE_ROOT_MISSING");
    for (const node of command.nodes) {
      if (node.parentId !== null && node.parentId !== command.parentId && !ids.has(node.parentId)) throw new Error("DOCUMENT_PASTE_PARENT_INVALID");
      for (const childId of node.childIds) if (!ids.has(childId)) throw new Error("DOCUMENT_PASTE_CHILD_MISSING");
    }
    const next = { ...document, nodes: { ...document.nodes }, instances: { ...document.instances }, components: { ...document.components }, surfaces: { ...document.surfaces }, semanticRelations: { ...document.semanticRelations } };
    for (const node of command.nodes) next.nodes[node.id] = clone(node);
    for (const [id, instance] of Object.entries(command.instances)) if (!next.instances[id]) next.instances[id] = clone(instance);
    for (const [id, definition] of Object.entries(command.components)) if (!next.components[id]) next.components[id] = clone(definition);
    for (const [id, surface] of Object.entries(command.surfaces ?? {})) if (!next.surfaces[id]) next.surfaces[id] = clone(surface);
    for (const [id, relation] of Object.entries(command.semanticRelations ?? {})) if (!next.semanticRelations[id]) next.semanticRelations[id] = clone(relation);
    const childIds = [...parent.childIds];
    childIds.splice(Math.max(0, Math.min(command.index, childIds.length)), 0, ...roots.map((node) => node.id));
    next.nodes[parent.id] = { ...parent, childIds };
    return { document: assertValid(next), inverse: { type: "delete-pasted-nodes", nodeIds: roots.map((node) => node.id) }, changed: true };
  }
  if (command.type === "delete-pasted-nodes") {
    if (command.nodeIds.length === 0) throw new Error("DOCUMENT_DELETE_EMPTY");
    const removed: DocumentNode[] = [];
    const seen = new Set<string>();
    const collect = (node: DocumentNode): void => {
      if (seen.has(node.id)) return;
      seen.add(node.id);
      removed.push(clone(node));
      for (const childId of node.childIds) collect(document.nodes[childId]!);
    };
    for (const nodeId of command.nodeIds) {
      const node = document.nodes[nodeId];
      if (!node) throw new Error(`DOCUMENT_NODE_MISSING:${nodeId}`);
      if (node.parentId === null) throw new Error("DOCUMENT_DELETE_ROOT");
      collect(node);
    }
    const firstRoot = removed.find((node) => command.nodeIds.includes(node.id))!;
    const parent = document.nodes[firstRoot.parentId!];
    if (!parent) throw new Error(`DOCUMENT_PARENT_MISSING:${firstRoot.parentId}`);
    const index = parent.childIds.indexOf(firstRoot.id);
    if (index < 0) throw new Error("DOCUMENT_DELETE_CHILD_MISSING");
    const next = { ...document, nodes: { ...document.nodes }, instances: { ...document.instances }, surfaces: { ...document.surfaces }, semanticRelations: { ...document.semanticRelations } };
    const removedSurfaces: Record<DocumentId, SemanticSurface> = {};
    const removedRelations: Record<DocumentId, SemanticRelation> = {};
    for (const [id, surface] of Object.entries(document.surfaces)) if (seen.has(surface.nodeId)) removedSurfaces[id] = clone(surface);
    for (const [id, relation] of Object.entries(document.semanticRelations)) if (seen.has(relation.sourceNodeId) || (relation.targetNodeId !== undefined && seen.has(relation.targetNodeId)) || (relation.targetSurfaceId !== undefined && removedSurfaces[relation.targetSurfaceId])) removedRelations[id] = clone(relation);
    for (const node of removed) {
      delete next.nodes[node.id];
      delete next.instances[node.id];
      const surface = Object.values(next.surfaces).find((candidate) => candidate.nodeId === node.id);
      if (surface) delete next.surfaces[surface.id];
    }
    for (const [id, relation] of Object.entries(next.semanticRelations)) if (seen.has(relation.sourceNodeId) || (relation.targetNodeId !== undefined && seen.has(relation.targetNodeId)) || (relation.targetSurfaceId !== undefined && !next.surfaces[relation.targetSurfaceId])) delete next.semanticRelations[id];
    next.nodes[parent.id] = { ...parent, childIds: parent.childIds.filter((id) => !command.nodeIds.includes(id)) };
    return { document: assertValid(next), inverse: { type: "restore-subtree", nodes: removed, parentId: parent.id, index, ...(Object.keys(removedSurfaces).length === 0 ? {} : { surfaces: removedSurfaces }), ...(Object.keys(removedRelations).length === 0 ? {} : { semanticRelations: removedRelations }) }, changed: true };
  }
  if (command.type === "reorder-node") {
    const parent = document.nodes[command.parentId];
    if (!parent || current!.parentId !== command.parentId) throw new Error("DOCUMENT_REORDER_PARENT_INVALID");
    const oldIndex = parent.childIds.indexOf(current!.id);
    if (oldIndex < 0) throw new Error("DOCUMENT_REORDER_CHILD_MISSING");
    const childIds = parent.childIds.filter((id) => id !== current!.id);
    childIds.splice(Math.max(0, Math.min(command.index, childIds.length)), 0, current!.id);
    const next = replaceNode(document, parent.id, (node) => ({ ...node, childIds }));
    for (const [zIndex, childId] of childIds.entries()) next.nodes[childId] = { ...next.nodes[childId]!, zIndex: zIndex + 1 };
    return { document: assertValid(next), inverse: { type: "reorder-node", nodeId: current!.id, parentId: parent.id, index: oldIndex }, changed: oldIndex !== command.index };
  }
  if (command.type === "reparent-node") {
    const node = current!;
    const previousParentId = node.parentId;
    if (!previousParentId) throw new Error("DOCUMENT_REPARENT_ROOT");
    const previousParent = document.nodes[previousParentId];
    if (!previousParent) throw new Error(`DOCUMENT_PARENT_MISSING:${previousParentId}`);
    const nextParent = document.nodes[command.parentId];
    if (!nextParent) throw new Error(`DOCUMENT_PARENT_MISSING:${command.parentId}`);
    // Reject before building the object: validateDocumentStructure would also
    // catch the cycle, but only after the corrupt state exists and with a
    // message carrying no node ids.
    const subtree = new Set<DocumentId>();
    const collect = (id: DocumentId): void => {
      if (subtree.has(id)) return;
      subtree.add(id);
      for (const childId of document.nodes[id]?.childIds ?? []) collect(childId);
    };
    collect(node.id);
    if (subtree.has(command.parentId)) throw new Error(`DOCUMENT_REPARENT_CYCLE:${command.parentId}`);
    const oldIndex = previousParent.childIds.indexOf(node.id);
    if (oldIndex < 0) throw new Error("DOCUMENT_REPARENT_CHILD_MISSING");
    const sameParent = previousParentId === command.parentId;
    const detached = previousParent.childIds.filter((id) => id !== node.id);
    const limit = sameParent ? detached.length : nextParent.childIds.length;
    if (!Number.isSafeInteger(command.index) || command.index < 0 || command.index > limit) throw new Error("DOCUMENT_REPARENT_INDEX_INVALID");
    const next = { ...document, nodes: { ...document.nodes } };
    next.nodes[previousParentId] = { ...previousParent, childIds: detached };
    const attached = [...(sameParent ? detached : next.nodes[command.parentId]!.childIds)];
    attached.splice(command.index, 0, node.id);
    next.nodes[command.parentId] = { ...next.nodes[command.parentId]!, childIds: attached };
    next.nodes[node.id] = { ...node, parentId: command.parentId };
    for (const [zIndex, childId] of next.nodes[previousParentId]!.childIds.entries()) next.nodes[childId] = { ...next.nodes[childId]!, zIndex: zIndex + 1 };
    for (const [zIndex, childId] of next.nodes[command.parentId]!.childIds.entries()) next.nodes[childId] = { ...next.nodes[childId]!, zIndex: zIndex + 1 };
    return { document: assertValid(next), inverse: { type: "reparent-node", nodeId: node.id, parentId: previousParentId, index: oldIndex }, changed: !sameParent || oldIndex !== command.index };
  }
  if (command.type === "set-metadata") {
    const hadValue = Object.prototype.hasOwnProperty.call(document.metadata, command.key);
    const previous = document.metadata[command.key];
    const next = assertValid({ ...document, metadata: { ...document.metadata, [command.key]: clone(command.value) } });
    return { document: next, inverse: hadValue ? { type: "set-metadata", key: command.key, value: clone(previous) } : { type: "delete-metadata", key: command.key }, changed: JSON.stringify(previous) !== JSON.stringify(command.value) };
  }
  if (command.type === "delete-metadata") {
    const hadValue = Object.prototype.hasOwnProperty.call(document.metadata, command.key);
    const previous = document.metadata[command.key];
    if (!hadValue) return { document, inverse: command, changed: false };
    const metadata = { ...document.metadata };
    delete metadata[command.key];
    return { document: assertValid({ ...document, metadata }), inverse: { type: "set-metadata", key: command.key, value: clone(previous) }, changed: true };
  }
  if (command.type === "set-bounds") return { document: assertValid(replaceNode(document, current!.id, (node) => ({ ...node, bounds: clone(command.bounds) }))), inverse: { type: "set-bounds", nodeId: current!.id, bounds: clone(current!.bounds) }, changed: JSON.stringify(current!.bounds) !== JSON.stringify(command.bounds) };
  if (command.type === "set-transform") return { document: assertValid(replaceNode(document, current!.id, (node) => ({ ...node, transform: clone(command.transform) }))), inverse: { type: "set-transform", nodeId: current!.id, transform: clone(current!.transform) }, changed: JSON.stringify(current!.transform) !== JSON.stringify(command.transform) };
  if (command.type === "set-auto-layout") {
    const before = current!.autoLayout;
    const next = assertValid(replaceNode(document, current!.id, (node) => {
      const candidate = { ...node };
      if (command.autoLayout === undefined) delete candidate.autoLayout;
      else candidate.autoLayout = clone(command.autoLayout);
      return candidate;
    }));
    return { document: next, inverse: { type: "set-auto-layout", nodeId: current!.id, ...(before === undefined ? {} : { autoLayout: clone(before) }) }, changed: JSON.stringify(before) !== JSON.stringify(command.autoLayout) };
  }
  if (command.type === "set-sizing") {
    const before = current!.sizing;
    const next = assertValid(replaceNode(document, current!.id, (node) => {
      const candidate = { ...node };
      if (command.sizing === undefined) delete candidate.sizing;
      else candidate.sizing = clone(command.sizing);
      return candidate;
    }));
    return { document: next, inverse: { type: "set-sizing", nodeId: current!.id, ...(before === undefined ? {} : { sizing: clone(before) }) }, changed: JSON.stringify(before) !== JSON.stringify(command.sizing) };
  }
  if (command.type === "set-layout-position") {
    const before = current!.layoutPosition;
    const next = assertValid(replaceNode(document, current!.id, (node) => {
      const candidate = { ...node };
      if (command.layoutPosition === undefined) delete candidate.layoutPosition;
      else candidate.layoutPosition = command.layoutPosition;
      return candidate;
    }));
    return { document: next, inverse: { type: "set-layout-position", nodeId: current!.id, ...(before === undefined ? {} : { layoutPosition: before }) }, changed: before !== command.layoutPosition };
  }
  if (command.type === "align-nodes") {
    // Alignment moves siblings inside one parent, so the union bounds live in
    // a single coordinate space. Nodes from different parents are rejected:
    // aligning across spaces would require world-space resolution.
    const ids = [...new Set(command.nodeIds)];
    if (ids.length < 2) throw new Error("DOCUMENT_ALIGN_REQUIRES_TWO");
    const nodes = ids.map((nodeId) => document.nodes[nodeId]);
    if (nodes.some((node) => node === undefined)) throw new Error(`DOCUMENT_NODE_MISSING:${ids.find((nodeId) => document.nodes[nodeId] === undefined) ?? "unknown"}`);
    const firstParentId = nodes[0]!.parentId;
    if (firstParentId === null || nodes.some((node) => node!.parentId !== firstParentId)) throw new Error("DOCUMENT_ALIGN_PARENTS_DIFFER");
    const first = nodes[0]!;
    let minX = first.bounds.x;
    let minY = first.bounds.y;
    let maxX = first.bounds.x + first.bounds.width;
    let maxY = first.bounds.y + first.bounds.height;
    for (const node of nodes) {
      minX = Math.min(minX, node!.bounds.x);
      minY = Math.min(minY, node!.bounds.y);
      maxX = Math.max(maxX, node!.bounds.x + node!.bounds.width);
      maxY = Math.max(maxY, node!.bounds.y + node!.bounds.height);
    }
    const union: Rect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    let next = document;
    const entries: Array<{ nodeId: DocumentId; bounds: Rect }> = [];
    for (const node of nodes) {
      const original = clone(node!.bounds);
      const bounds = clone(node!.bounds);
      if (command.axis === "left") bounds.x = union.x;
      if (command.axis === "right") bounds.x = union.x + union.width - bounds.width;
      if (command.axis === "centerX") bounds.x = union.x + (union.width - bounds.width) / 2;
      if (command.axis === "top") bounds.y = union.y;
      if (command.axis === "bottom") bounds.y = union.y + union.height - bounds.height;
      if (command.axis === "centerY") bounds.y = union.y + (union.height - bounds.height) / 2;
      if (bounds.x === original.x && bounds.y === original.y) continue;
      entries.push({ nodeId: node!.id, bounds: original });
      next = assertValid(replaceNode(next, node!.id, (candidate) => ({ ...candidate, bounds })));
    }
    return { document: next, inverse: { type: "restore-node-bounds", entries }, changed: entries.length > 0 };
  }
  if (command.type === "distribute-nodes") {
    const ids = [...new Set(command.nodeIds)];
    if (ids.length < 3) throw new Error("DOCUMENT_DISTRIBUTE_REQUIRES_THREE");
    const nodes = ids.map((nodeId) => document.nodes[nodeId]);
    const missing = ids.find((nodeId) => !document.nodes[nodeId]);
    if (missing) throw new Error(`DOCUMENT_NODE_MISSING:${missing}`);
    const parentId = nodes[0]!.parentId;
    if (parentId === null || nodes.some((node) => node!.parentId !== parentId)) throw new Error("DOCUMENT_ALIGN_PARENTS_DIFFER");
    const horizontal = command.axis === "horizontal";
    const ordered = [...nodes].sort((a, b) => {
      const ac = horizontal ? a!.bounds.x + a!.bounds.width / 2 : a!.bounds.y + a!.bounds.height / 2;
      const bc = horizontal ? b!.bounds.x + b!.bounds.width / 2 : b!.bounds.y + b!.bounds.height / 2;
      return ac - bc || a!.id.localeCompare(b!.id);
    });
    const start = horizontal ? Math.min(...ordered.map((node) => node!.bounds.x)) : Math.min(...ordered.map((node) => node!.bounds.y));
    const end = horizontal ? Math.max(...ordered.map((node) => node!.bounds.x + node!.bounds.width)) : Math.max(...ordered.map((node) => node!.bounds.y + node!.bounds.height));
    const totalSize = ordered.reduce((sum, node) => sum + (horizontal ? node!.bounds.width : node!.bounds.height), 0);
    const gap = (end - start - totalSize) / (ordered.length - 1);
    let cursor = start;
    let next = document;
    const entries: Array<{ nodeId: DocumentId; bounds: Rect }> = [];
    for (const node of ordered) {
      const bounds = clone(node!.bounds);
      if (horizontal) bounds.x = cursor; else bounds.y = cursor;
      cursor += (horizontal ? bounds.width : bounds.height) + gap;
      if (bounds.x === node!.bounds.x && bounds.y === node!.bounds.y) continue;
      entries.push({ nodeId: node!.id, bounds: clone(node!.bounds) });
      next = assertValid(replaceNode(next, node!.id, (candidate) => ({ ...candidate, bounds })));
    }
    return { document: next, inverse: { type: "restore-node-bounds", entries }, changed: entries.length > 0 };
  }
  if (command.type === "move-nodes") {
    const ids = [...new Set(command.nodeIds)];
    if (ids.length === 0) throw new Error("DOCUMENT_MOVE_REQUIRES_ONE");
    if (!Number.isFinite(command.delta.dx) || !Number.isFinite(command.delta.dy)) throw new Error("DOCUMENT_MOVE_DELTA_INVALID");
    const missing = ids.find((nodeId) => !document.nodes[nodeId]);
    if (missing) throw new Error(`DOCUMENT_NODE_MISSING:${missing}`);
    let next = document;
    for (const nodeId of ids) next = assertValid(replaceNode(next, nodeId, (node) => ({ ...node, bounds: { ...node.bounds, x: node.bounds.x + command.delta.dx, y: node.bounds.y + command.delta.dy } })));
    const changed = command.delta.dx !== 0 || command.delta.dy !== 0;
    return { document: next, inverse: { type: "move-nodes", nodeIds: ids, delta: { dx: -command.delta.dx, dy: -command.delta.dy } }, changed };
  }
  if (command.type === "restore-node-bounds") {
    const entries = command.entries.filter((entry) => document.nodes[entry.nodeId]);
    if (entries.length === 0) return { document, inverse: command, changed: false };
    let next = document;
    for (const entry of entries) next = assertValid(replaceNode(next, entry.nodeId, (node) => ({ ...node, bounds: clone(entry.bounds) })));
    return { document: next, inverse: { type: "restore-node-bounds", entries: entries.map((entry) => ({ nodeId: entry.nodeId, bounds: clone(next.nodes[entry.nodeId]!.bounds) })) }, changed: true };
  }
  if (command.property === "text") {
    if (typeof command.value !== "string") throw new Error("DOCUMENT_TEXT_VALUE_INVALID");
    if (current!.kind !== "text") throw new Error("DOCUMENT_TEXT_KIND_INVALID");
  }
  // Glass fills are the only object values, and only for `fill`. Any other
  // object reaching the generic setter would silently persist a non-string in
  // a string-typed field (validation checks `fill` only) — refuse loudly.
  if (typeof command.value === "object" && command.value !== null && command.property !== "fill") throw new Error(`DOCUMENT_PROPERTY_VALUE_INVALID:${command.property}`);
  const before = current![command.property];
  const next = assertValid(replaceNode(document, current!.id, (node) => ({ ...node, [command.property]: command.value })));
  // Object values never compare equal by reference; deep-compare the fill so
  // re-applying an identical glass fill is a no-op instead of a history entry.
  const changed = command.property === "fill" ? JSON.stringify(before) !== JSON.stringify(command.value) : before !== command.value;
  return { document: next, inverse: { type: "set-property", nodeId: current!.id, property: command.property, value: before as string | number | boolean | GlassFill } as DocumentCommand, changed };
};

export const applyCommandList = (document: EditorDocument, commands: DocumentCommand[]): EditorDocument => commands.reduce((current, command) => applyDocumentCommand(current, command).document, document);
