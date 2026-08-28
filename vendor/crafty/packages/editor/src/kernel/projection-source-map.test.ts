import { describe, expect, it } from "vitest";

import { applyDocumentCommand } from "./commands.js";
import { canonicalEditorDocumentString, createFoundationDocument, type ComponentDefinition, type DocumentNode, type EditorDocument, type PathGeometry } from "./document.js";
import { orderKeyForSigned } from "./path-geometry.js";
import { createProjectionTextBuilder, projectionAnchorExists, projectionAnchorKey } from "./projection-source-map.js";

const pathNode = (): { node: DocumentNode; geometry: PathGeometry } => {
  const geometry: PathGeometry = {
    points: {
      "point-a": { id: "point-a", subpathId: "subpath-1", order: orderKeyForSigned(0), x: 0, y: 0, handleMode: "corner" },
      "point-b": { id: "point-b", subpathId: "subpath-1", order: orderKeyForSigned(1), x: 10, y: 0, handleMode: "corner" },
    },
    subpaths: { "subpath-1": { id: "subpath-1", closed: false } },
    fillRule: "nonzero",
  };
  return {
    geometry,
    node: {
      id: "path-line",
      kind: "path",
      name: "Line",
      parentId: "frame-foundation",
      childIds: [],
      bounds: { x: 64, y: 84, width: 10, height: 0 },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true,
      locked: false,
      opacity: 1,
      fill: "#ffffff",
      stroke: "#000000",
      cornerRadius: 0,
      zIndex: 3,
      path: geometry,
    },
  };
};

const instanceNode = (id: string, parentId: string): DocumentNode => ({
  id,
  kind: "frame",
  name: id,
  parentId,
  childIds: [],
  bounds: { x: 20, y: 20, width: 120, height: 80 },
  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  visible: true,
  locked: false,
  opacity: 1,
  fill: "#202531",
  stroke: "#566078",
  cornerRadius: 0,
  zIndex: 4,
});

const definition = (id: string): ComponentDefinition => ({
  id,
  name: "Card",
  rootNodeId: "frame-foundation",
  propertyDefinitions: { label: { type: "text", defaultValue: "Default" } },
  variants: {},
  states: {},
});

const projectionFixture = (): EditorDocument => {
  let document = createFoundationDocument();
  const { node } = pathNode();
  document = { ...document, nodes: { ...document.nodes, [node.id]: node } };
  document = {
    ...document,
    surfaces: {
      "surface-home": { id: "surface-home", nodeId: "frame-foundation", role: "screen", behaviorVersion: 1, route: { id: "route-home", path: "/" } },
    },
    semanticRelations: {
      "relation-home": { id: "relation-home", kind: "link", sourceNodeId: "rectangle-foundation", targetSurfaceId: "surface-home", name: "home" },
    },
  };
  document = applyDocumentCommand(document, { type: "create-component-definition", definition: definition("component-card") }).document;
  document = applyDocumentCommand(document, { type: "create-component-instance", instanceId: "instance-card", node: instanceNode("instance-card", "page-root-home"), instance: { definitionId: "component-card", properties: { label: "Default" }, overrides: {} } }).document;
  return document;
};

describe("projection source-map foundation", () => {
  it("keys anchors deterministically from existing stable ids", () => {
    expect(projectionAnchorKey({ kind: "document", documentId: "document-foundation" })).toBe("document:document-foundation");
    expect(projectionAnchorKey({ kind: "node", nodeId: "frame-foundation" })).toBe("node:frame-foundation");
    expect(projectionAnchorKey({ kind: "path-point", nodeId: "path-line", pointId: "point-a" })).toBe("path-point:path-line:point-a");
  });

  it("accepts only anchors that the current schema can address stably", () => {
    const document = projectionFixture();
    expect(projectionAnchorExists(document, { kind: "document", documentId: document.id })).toBe(true);
    expect(projectionAnchorExists(document, { kind: "page", pageId: "page-home" })).toBe(true);
    expect(projectionAnchorExists(document, { kind: "node", nodeId: "frame-foundation" })).toBe(true);
    expect(projectionAnchorExists(document, { kind: "path-subpath", nodeId: "path-line", subpathId: "subpath-1" })).toBe(true);
    expect(projectionAnchorExists(document, { kind: "path-point", nodeId: "path-line", pointId: "point-a" })).toBe(true);
    expect(projectionAnchorExists(document, { kind: "surface", surfaceId: "surface-home" })).toBe(true);
    expect(projectionAnchorExists(document, { kind: "semantic-relation", relationId: "relation-home" })).toBe(true);
    expect(projectionAnchorExists(document, { kind: "component-definition", definitionId: "component-card" })).toBe(true);
    expect(projectionAnchorExists(document, { kind: "component-instance", instanceId: "instance-card" })).toBe(true);
    expect(projectionAnchorExists(document, { kind: "path-point", nodeId: "rectangle-foundation", pointId: "point-a" })).toBe(false);
  });

  it("builds a disposable text artifact without mutating authored bytes", () => {
    const document = projectionFixture();
    const before = canonicalEditorDocumentString(document);
    const builder = createProjectionTextBuilder(document);
    builder.append("component Card\n", { kind: "component-definition", definitionId: "component-card" });
    builder.append("frame instance-card\n", [
      { kind: "component-instance", instanceId: "instance-card" },
      { kind: "node", nodeId: "instance-card" },
    ]);
    builder.append("point point-a\n", { kind: "path-point", nodeId: "path-line", pointId: "point-a" });
    builder.append("point point-b\n", { kind: "path-point", nodeId: "path-line", pointId: "point-a" });
    const artifact = builder.build();

    expect(canonicalEditorDocumentString(document)).toBe(before);
    expect(artifact.documentId).toBe(document.id);
    expect(artifact.schemaVersion).toBe(document.schemaVersion);
    expect(artifact.text).toBe("component Card\nframe instance-card\npoint point-a\npoint point-b\n");
    expect(artifact.sourceMap).toEqual([
      {
        range: { start: 0, end: 15 },
        anchors: [{ kind: "component-definition", definitionId: "component-card" }],
      },
      {
        range: { start: 15, end: 35 },
        anchors: [
          { kind: "component-instance", instanceId: "instance-card" },
          { kind: "node", nodeId: "instance-card" },
        ],
      },
      {
        range: { start: 35, end: 63 },
        anchors: [{ kind: "path-point", nodeId: "path-line", pointId: "point-a" }],
      },
    ]);
  });

  it("rejects anchors the authored document cannot support", () => {
    const builder = createProjectionTextBuilder(createFoundationDocument());
    expect(() => builder.append("corner\n", { kind: "path-point", nodeId: "rectangle-foundation", pointId: "corner-0" })).toThrow("PROJECTION_ANCHOR_INVALID:path-point:rectangle-foundation:corner-0");
  });
});
