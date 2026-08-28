import type { ComponentDefinition, ComponentInstance, DocumentId, DocumentNode, EditorDocument, Rect, ValidationDiagnostic, ValidationResult } from "./document.js";

export interface ResolvedProvenance {
  definitionId?: DocumentId;
  definitionNodeId?: DocumentId;
  instanceId?: DocumentId;
  instancePath: DocumentId[];
}

export type ResolvedNode = DocumentNode & {
  provenance: ResolvedProvenance;
  childIds: DocumentId[];
};

export interface ResolvedScene {
  pageId: DocumentId;
  nodes: Record<DocumentId, ResolvedNode>;
  rootIds: DocumentId[];
  diagnostics: ValidationDiagnostic[];
}

/**
 * Materialize the disposable resolved page as an EditorDocument-shaped view.
 * The registries remain present for editor consumers, but the visual tree is
 * only the resolved page. This is deliberately an adapter, not persistence:
 * derived ids and provenance never enter the authored document.
 */
export const resolvedSceneToDocument = (
  document: EditorDocument,
  resolved: ResolvedScene,
): EditorDocument => {
  const page = document.pages[resolved.pageId];
  if (!page) return clone(document);
  const root = document.nodes[page.rootId];
  if (!root) return clone(document);
  const nodes: Record<DocumentId, DocumentNode> = { ...document.nodes };
  for (const id of Object.keys(resolved.nodes)) delete nodes[id];
  for (const [id, node] of Object.entries(resolved.nodes))
    nodes[id] = { ...clone(node), parentId: node.parentId ?? page.rootId };
  nodes[page.rootId] = {
    ...clone(root),
    childIds: [...resolved.rootIds],
  };
  return { ...clone(document), nodes };
};

export interface ResolutionContext {
  pageId: DocumentId;
  theme?: string;
  stateSelections?: Record<DocumentId, Record<string, string | boolean>>;
  timeMs?: number;
  libraryVersions?: Record<DocumentId, string>;
  documentRevision?: number;
}

export type SupportedOverrideProperty = "name" | "fill" | "stroke" | "opacity" | "visible" | "locked" | "text" | "cornerRadius";
const SUPPORTED_OVERRIDES: ReadonlySet<string> = new Set<SupportedOverrideProperty>(["name", "fill", "stroke", "opacity", "visible", "locked", "text", "cornerRadius"]);

const diagnostic = (code: ValidationDiagnostic["code"], path: string, message: string): ValidationDiagnostic => ({ code, path, message });
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const clone = <T>(value: T): T => structuredClone(value);

const propertyTypeValid = (definition: ComponentDefinition, key: string, value: unknown): boolean => {
  const property = definition.propertyDefinitions[key];
  if (!property) return false;
  return property.type === "boolean" ? typeof value === "boolean" : typeof value === "string";
};

/** Validates the component registries without changing the authored document. */
export const validateComponentGraph = (document: EditorDocument): ValidationResult<true> => {
  const diagnostics: ValidationDiagnostic[] = [];
  const dependencies = new Map<DocumentId, DocumentId[]>();
  for (const [id, definition] of Object.entries(document.components)) {
    if (!definition || definition.id !== id || !definition.name || !definition.rootNodeId) {
      diagnostics.push(diagnostic("COMPONENT_DEFINITION_INVALID", `/components/${id}`, "Definition identity, name, and root are required."));
      continue;
    }
    const root = document.nodes[definition.rootNodeId];
    if (!root) diagnostics.push(diagnostic(`COMPONENT_ROOT_MISSING:${id}`, `/components/${id}/rootNodeId`, "Definition root does not exist."));
    else if (root.kind === "page-root") diagnostics.push(diagnostic("COMPONENT_ROOT_INVALID", `/components/${id}/rootNodeId`, "A component definition cannot use a page root."));
    if (definition.surfaceId !== undefined) {
      const surface = document.surfaces[definition.surfaceId];
      if (!surface || surface.role !== "component" || surface.nodeId !== definition.rootNodeId) diagnostics.push(diagnostic(`COMPONENT_SURFACE_INVALID:${id}`, `/components/${id}/surfaceId`, "Definition surface must be an existing component-role surface anchored to its root."));
    }
    for (const [key, property] of Object.entries(definition.propertyDefinitions ?? {})) {
      if (!isRecord(property) || (property.type !== "boolean" && property.type !== "text" && property.type !== "variant") || !propertyTypeValid({ ...definition, propertyDefinitions: { [key]: property as never } }, key, property.defaultValue)) {
        diagnostics.push(diagnostic("COMPONENT_PROPERTY_INVALID", `/components/${id}/propertyDefinitions/${key}`, "Property declaration or default value is invalid."));
      }
    }
    for (const [key, value] of Object.entries(definition.variants ?? {})) if (!isRecord(value)) diagnostics.push(diagnostic("COMPONENT_PROPERTY_INVALID", `/components/${id}/variants/${key}`, "Variant patch must be a record."));
    for (const [key, value] of Object.entries(definition.states ?? {})) if (!isRecord(value)) diagnostics.push(diagnostic("COMPONENT_PROPERTY_INVALID", `/components/${id}/states/${key}`, "State patch must be a record."));
    const nested: DocumentId[] = [];
    if (root) {
      const visit = (node: DocumentNode): void => {
        const instance = document.instances[node.id];
        if (instance) nested.push(instance.definitionId);
        for (const childId of node.childIds) { const child = document.nodes[childId]; if (child) visit(child); }
      };
      visit(root);
    }
    dependencies.set(id, nested);
  }
  for (const [instanceId, instance] of Object.entries(document.instances)) {
    if (!document.nodes[instanceId]) diagnostics.push(diagnostic("COMPONENT_INSTANCE_INVALID", `/instances/${instanceId}`, "Instance must be attached to an authored node."));
    const definition = document.components[instance.definitionId];
    if (!definition) diagnostics.push(diagnostic(`COMPONENT_DEFINITION_MISSING:${instance.definitionId}`, `/instances/${instanceId}/definitionId`, "Instance definition is missing."));
    if (!isRecord(instance.properties) || !isRecord(instance.overrides)) diagnostics.push(diagnostic("COMPONENT_INSTANCE_INVALID", `/instances/${instanceId}`, "Instance properties and overrides must be records."));
    if (definition) {
      for (const [key, value] of Object.entries(instance.properties)) if (!propertyTypeValid(definition, key, value)) diagnostics.push(diagnostic("COMPONENT_PROPERTY_INVALID", `/instances/${instanceId}/properties/${key}`, "Instance property is not declared or has the wrong type."));
      for (const [nodeId, overrides] of Object.entries(instance.overrides)) {
        if (!isRecord(overrides)) { diagnostics.push(diagnostic("COMPONENT_OVERRIDE_INVALID", `/instances/${instanceId}/overrides/${nodeId}`, "Override must be a record.")); continue; }
        for (const key of Object.keys(overrides)) if (!SUPPORTED_OVERRIDES.has(key)) diagnostics.push(diagnostic(`COMPONENT_OVERRIDE_UNSUPPORTED:${key}`, `/instances/${instanceId}/overrides/${nodeId}/${key}`, "Override property is outside the supported vocabulary."));
      }
    }
  }
  const visiting = new Set<DocumentId>();
  const visited = new Set<DocumentId>();
  const walk = (id: DocumentId): void => {
    if (visiting.has(id)) { diagnostics.push(diagnostic(`COMPONENT_DEPENDENCY_CYCLE:${id}`, `/components/${id}`, "Component dependency cycles are not permitted.")); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of dependencies.get(id) ?? []) if (document.components[dependency]) walk(dependency);
    visiting.delete(id); visited.add(id);
  };
  for (const id of Object.keys(document.components).sort()) walk(id);
  return diagnostics.length === 0 ? { ok: true, value: true, diagnostics: [] } : { ok: false, diagnostics };
};

export const resolvedProjectionId = (instancePath: readonly DocumentId[], definitionNodeId: DocumentId): DocumentId => `resolved:${instancePath.join("/")}:${definitionNodeId}`;

const applyOverride = (node: DocumentNode, overrides: Record<string, unknown>, path: string, diagnostics: ValidationDiagnostic[]): DocumentNode => {
  const next = clone(node);
  for (const [key, value] of Object.entries(overrides)) {
    if (!SUPPORTED_OVERRIDES.has(key)) { diagnostics.push(diagnostic(`COMPONENT_OVERRIDE_UNSUPPORTED:${key}`, `${path}/${key}`, "Override property is unsupported.")); continue; }
    if (key === "text" && typeof value !== "string") { diagnostics.push(diagnostic("COMPONENT_PROPERTY_INVALID", `${path}/${key}`, "Text override must be a string.")); continue; }
    if ((key === "opacity" || key === "cornerRadius") && (typeof value !== "number" || !Number.isFinite(value))) { diagnostics.push(diagnostic("COMPONENT_PROPERTY_INVALID", `${path}/${key}`, "Numeric override is invalid.")); continue; }
    if ((key === "visible" || key === "locked") && typeof value !== "boolean") { diagnostics.push(diagnostic("COMPONENT_PROPERTY_INVALID", `${path}/${key}`, "Boolean override is invalid.")); continue; }
    (next as unknown as Record<string, unknown>)[key] = clone(value);
  }
  return next;
};

/** Resolves one page. Missing definitions remain placeholders with diagnostics; no source record is copied into authored state. */
export const resolveScene = (document: EditorDocument, context: ResolutionContext): ResolvedScene => {
  const nodes: Record<DocumentId, ResolvedNode> = {};
  const diagnostics: ValidationDiagnostic[] = [];
  const page = document.pages[context.pageId];
  if (!page) return { pageId: context.pageId, nodes, rootIds: [], diagnostics: [diagnostic("DOCUMENT_PAGE_MISSING", `/pages/${context.pageId}`, "Page does not exist.")] };
  const reportOrphans = (instanceId: DocumentId, definition: ComponentDefinition, overrides: Record<DocumentId, Record<string, unknown>>): void => {
    const known = new Set<DocumentId>();
    const visit = (nodeId: DocumentId): void => { if (known.has(nodeId)) return; known.add(nodeId); for (const childId of document.nodes[nodeId]?.childIds ?? []) visit(childId); };
    visit(definition.rootNodeId);
    for (const nodeId of Object.keys(overrides)) if (!known.has(nodeId)) diagnostics.push(diagnostic(`COMPONENT_OVERRIDE_ORPHANED:${nodeId}`, `/instances/${instanceId}/overrides/${nodeId}`, "Override target is not present in the definition subtree."));
  };
  const addOrdinary = (source: DocumentNode, parentId: DocumentId | null, path: DocumentId[]): DocumentId => {
    const node = clone(source) as ResolvedNode;
    node.parentId = parentId; node.provenance = { instancePath: path };
    node.childIds = source.childIds.map((childId) => {
      const child = document.nodes[childId]!;
      const instance = document.instances[childId];
      if (!instance) return addOrdinary(child, node.id, path);
      const definition = document.components[instance.definitionId];
      if (!definition) { diagnostics.push(diagnostic(`COMPONENT_DEFINITION_MISSING:${instance.definitionId}`, `/instances/${childId}/definitionId`, "Instance definition is missing.")); return addOrdinary(child, node.id, [...path, childId]); }
      reportOrphans(childId, definition, instance.overrides);
      return expand(document.nodes[definition.rootNodeId]!, definition, childId, path, node.id, instance.overrides);
    });
    nodes[node.id] = node; return node.id;
  };
  const expand = (source: DocumentNode, definition: ComponentDefinition, instanceId: DocumentId, path: DocumentId[], parentId: DocumentId | null, overrides: Record<DocumentId, Record<string, unknown>>): DocumentId => {
    const effective = applyOverride(source, overrides[source.id] ?? {}, `/instances/${instanceId}/overrides/${source.id}`, diagnostics);
    const id = resolvedProjectionId([...path, instanceId], definition.id === instanceId ? source.id : source.id);
    const node = effective as ResolvedNode; node.id = id; node.parentId = parentId;
    node.provenance = { definitionId: definition.id, definitionNodeId: source.id, instanceId, instancePath: [...path, instanceId] };
    node.childIds = [];
    const nested = document.instances[source.id];
    if (nested) {
      const nestedDefinition = document.components[nested.definitionId];
      if (!nestedDefinition) { diagnostics.push(diagnostic(`COMPONENT_DEFINITION_MISSING:${nested.definitionId}`, `/instances/${source.id}/definitionId`, "Nested definition is missing.")); }
      else { reportOrphans(source.id, nestedDefinition, nested.overrides); node.childIds = [expand(document.nodes[nestedDefinition.rootNodeId]!, nestedDefinition, source.id, [...path, instanceId], id, nested.overrides)]; }
    } else node.childIds = source.childIds.map((childId) => expand(document.nodes[childId]!, definition, instanceId, path, id, overrides));
    nodes[id] = node; return id;
  };
  const roots: DocumentId[] = [];
  for (const childId of document.nodes[page.rootId]?.childIds ?? []) {
    const source = document.nodes[childId]!; const instance = document.instances[childId];
    if (!instance) roots.push(addOrdinary(source, null, []));
    else {
      const definition = document.components[instance.definitionId];
      if (!definition) { diagnostics.push(diagnostic(`COMPONENT_DEFINITION_MISSING:${instance.definitionId}`, `/instances/${childId}/definitionId`, "Instance definition is missing.")); roots.push(addOrdinary(source, null, [childId])); }
      else roots.push(expand(document.nodes[definition.rootNodeId]!, definition, childId, [], null, instance.overrides));
      if (definition) reportOrphans(childId, definition, instance.overrides);
    }
  }
  return { pageId: context.pageId, nodes, rootIds: roots, diagnostics };
};
