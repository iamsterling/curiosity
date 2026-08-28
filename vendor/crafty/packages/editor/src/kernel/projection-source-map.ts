import type { DocumentId, EditorDocument, PointId, SubpathId } from "./document.js";

export type ProjectionAnchor =
  | { kind: "document"; documentId: DocumentId }
  | { kind: "page"; pageId: DocumentId }
  | { kind: "node"; nodeId: DocumentId }
  | { kind: "path-subpath"; nodeId: DocumentId; subpathId: SubpathId }
  | { kind: "path-point"; nodeId: DocumentId; pointId: PointId }
  | { kind: "surface"; surfaceId: DocumentId }
  | { kind: "semantic-relation"; relationId: DocumentId }
  | { kind: "component-definition"; definitionId: DocumentId }
  | { kind: "component-instance"; instanceId: DocumentId };

export interface ProjectionTextRange {
  start: number;
  end: number;
}

export interface ProjectionSourceMapEntry {
  range: ProjectionTextRange;
  anchors: ProjectionAnchor[];
}

export interface ProjectionTextArtifact {
  documentId: DocumentId;
  schemaVersion: EditorDocument["schemaVersion"];
  text: string;
  sourceMap: ProjectionSourceMapEntry[];
}

const clone = <T>(value: T): T => structuredClone(value);

export const projectionAnchorKey = (anchor: ProjectionAnchor): string => {
  switch (anchor.kind) {
    case "document":
      return `document:${anchor.documentId}`;
    case "page":
      return `page:${anchor.pageId}`;
    case "node":
      return `node:${anchor.nodeId}`;
    case "path-subpath":
      return `path-subpath:${anchor.nodeId}:${anchor.subpathId}`;
    case "path-point":
      return `path-point:${anchor.nodeId}:${anchor.pointId}`;
    case "surface":
      return `surface:${anchor.surfaceId}`;
    case "semantic-relation":
      return `semantic-relation:${anchor.relationId}`;
    case "component-definition":
      return `component-definition:${anchor.definitionId}`;
    case "component-instance":
      return `component-instance:${anchor.instanceId}`;
  }
};

export const projectionAnchorExists = (document: EditorDocument, anchor: ProjectionAnchor): boolean => {
  switch (anchor.kind) {
    case "document":
      return document.id === anchor.documentId;
    case "page":
      return document.pages[anchor.pageId] !== undefined;
    case "node":
      return document.nodes[anchor.nodeId] !== undefined;
    case "path-subpath": {
      const node = document.nodes[anchor.nodeId];
      return node?.kind === "path" && node.path?.subpaths[anchor.subpathId] !== undefined;
    }
    case "path-point": {
      const node = document.nodes[anchor.nodeId];
      return node?.kind === "path" && node.path?.points[anchor.pointId] !== undefined;
    }
    case "surface":
      return document.surfaces[anchor.surfaceId] !== undefined;
    case "semantic-relation":
      return document.semanticRelations[anchor.relationId] !== undefined;
    case "component-definition":
      return document.components[anchor.definitionId] !== undefined;
    case "component-instance":
      return document.instances[anchor.instanceId] !== undefined;
  }
};

const normalizeAnchors = (document: EditorDocument, anchors: ProjectionAnchor[]): ProjectionAnchor[] => {
  const keyed = new Map<string, ProjectionAnchor>();
  for (const anchor of anchors) {
    if (!projectionAnchorExists(document, anchor)) throw new Error(`PROJECTION_ANCHOR_INVALID:${projectionAnchorKey(anchor)}`);
    keyed.set(projectionAnchorKey(anchor), anchor);
  }
  return [...keyed.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, anchor]) => anchor);
};

const sameAnchors = (left: readonly ProjectionAnchor[], right: readonly ProjectionAnchor[]): boolean => {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) if (projectionAnchorKey(left[index]!) !== projectionAnchorKey(right[index]!)) return false;
  return true;
};

/**
 * Disposable text projection builder for future code surfaces. It never writes
 * a second canonical artifact; it only records spans back to existing stable ids.
 */
export const createProjectionTextBuilder = (document: EditorDocument) => {
  const chunks: string[] = [];
  const sourceMap: ProjectionSourceMapEntry[] = [];
  let length = 0;

  return {
    append(text: string, anchors?: ProjectionAnchor | ProjectionAnchor[]): void {
      if (text.length === 0) return;
      const start = length;
      chunks.push(text);
      length += text.length;
      if (!anchors) return;
      const normalized = normalizeAnchors(document, Array.isArray(anchors) ? anchors : [anchors]);
      if (normalized.length === 0) return;
      const previous = sourceMap[sourceMap.length - 1];
      if (previous && previous.range.end === start && sameAnchors(previous.anchors, normalized)) {
        previous.range.end = length;
        return;
      }
      sourceMap.push({ range: { start, end: length }, anchors: normalized });
    },
    build(): ProjectionTextArtifact {
      return {
        documentId: document.id,
        schemaVersion: document.schemaVersion,
        text: chunks.join(""),
        sourceMap: clone(sourceMap),
      };
    }
  };
};
