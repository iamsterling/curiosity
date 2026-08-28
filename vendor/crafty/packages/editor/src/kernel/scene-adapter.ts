import type { Frame, Layer, LayerType, Scene, Story } from "@crafty/scene-model";
import { type DocumentNode, type EditorDocument, type EditorDocumentV1, type HistoricalDocumentNode, type NodeKind, isGlassFill } from "./document.js";
import { multiplyTransforms } from "./coordinates.js";

const identityTransform = (): DocumentNode["transform"] => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });

interface LegacyMetadata extends Record<string, unknown> {
  legacySceneId: string;
  legacySceneName: string;
  legacyFrameStories: Record<string, Story[]>;
}

const nodeKindFor = (type: LayerType): NodeKind => type === "frame" ? "frame" : type === "group" ? "group" : type === "rectangle" ? "rectangle" : type === "text" ? "text" : "image";
// Exhaustive on purpose. The legacy Scene has no way to carry a node kind it
// does not know, so a fall-through would silently persist the node as an image
// and drop whatever made it that kind — path geometry, for instance. Any new
// NodeKind must either gain a Scene representation or fail loudly here.
const layerTypeFor = (kind: NodeKind): LayerType => {
  switch (kind) {
    case "frame": return "frame";
    case "group": return "group";
    case "rectangle": return "rectangle";
    case "text": return "text";
    case "image": return "image";
    // The legacy Scene has no path geometry to carry; path layers project as
    // rectangles with opacity 0 (the glass-records pattern) and the real
    // geometry rides the packet's path commands, composed host-side. The
    // compound's outline rides the same channel; its own layer (and every
    // member layer) projects invisible too — the outline is the only visual.
    case "path": return "rectangle";
    case "compound": return "rectangle";
    default: throw new Error(`SCENE_ADAPTER_UNSUPPORTED_KIND:${kind as string}`);
  }
};

const nodeFromLayer = (layer: Layer, parentId: string): HistoricalDocumentNode => ({
  id: layer.id,
  kind: nodeKindFor(layer.type),
  name: layer.name,
  parentId,
  childIds: layer.children?.map((child) => child.id) ?? [],
  bounds: structuredClone(layer.bounds),
  transform: structuredClone(layer.transform ?? identityTransform()),
  visible: layer.visible,
  locked: layer.locked ?? false,
  opacity: layer.opacity,
  fill: layer.fill,
  stroke: layer.stroke,
  cornerRadius: layer.cornerRadius,
  zIndex: layer.zIndex,
  ...(layer.text === undefined ? {} : { text: layer.text })
});

const visitLayers = (layers: Layer[], parentId: string, nodes: Record<string, HistoricalDocumentNode>): void => {
  for (const layer of layers) {
    if (nodes[layer.id]) throw new Error(`EDITOR_DOCUMENT_DUPLICATE_NODE:${layer.id}`);
    nodes[layer.id] = nodeFromLayer(layer, parentId);
    if (layer.children) visitLayers(layer.children, layer.id, nodes);
  }
};

const metadataFor = (scene: Scene): LegacyMetadata => ({
  legacySceneId: scene.id,
  legacySceneName: scene.name,
  legacyFrameStories: Object.fromEntries(scene.frames.map((frame) => [frame.id, structuredClone(frame.stories)]))
});

export const sceneToEditorDocument = (scene: Scene): EditorDocumentV1 => {
  const nodes: Record<string, HistoricalDocumentNode> = {};
  const pages: EditorDocumentV1["pages"] = {};
  const pageOrder: string[] = [];
  for (const frame of scene.frames) {
    const pageId = `page-${frame.id}`;
    const rootId = `page-root-${frame.id}`;
    pages[pageId] = { id: pageId, name: frame.name, rootId };
    pageOrder.push(pageId);
    nodes[rootId] = { id: rootId, kind: "page-root", name: frame.name, parentId: null, childIds: frame.layers.map((layer) => layer.id), bounds: structuredClone(frame.bounds), transform: identityTransform(), visible: true, locked: false, opacity: 1, fill: "#111318", stroke: "#2b3039", cornerRadius: 0, zIndex: 0 };
    visitLayers(frame.layers, rootId, nodes);
  }
  const metadata = metadataFor(scene);
  return { schemaVersion: 1, id: scene.id, workspace: { id: "workspace-local", name: "Crafty local workspace" }, project: { id: "project-local", name: "Crafty local project" }, file: { id: scene.id, name: scene.name }, pages, pageOrder, nodes, components: {}, instances: {}, libraries: [], variables: {}, metadata };
};

/**
 * A projected glass surface: the authored glass params plus the ordering keys
 * the composite draws by. Plain disposable values — the composite never reads
 * the document. `order` mirrors the encoder's traversal counter (a per-visible
 * layer slot, depth-first pre-order), so sorting records by `(zIndex, order)`
 * reproduces the scene's relative draw sequence for glass surfaces.
 */
export interface GlassFillRecord {
  nodeId: string;
  bounds: DocumentNode["bounds"];
  transform: DocumentNode["transform"];
  blurRadius: number;
  tint: string;
  tintOpacity: number;
  saturation: number;
  refraction: number;
  opacity: number;
  zIndex: number;
  order: number;
}

/**
 * Projects the document's glass surfaces for the renderer's composite pass.
 * Walks the node tree exactly like the scene encoder walks the projected
 * layers (depth-first pre-order, one order slot per visible node), so a
 * record's `order` is the slot its layer would have occupied — invisible
 * nodes emit no record, matching the encoder's no-draw rule. The record's
 * `transform` is the composed WORLD transform (parent × node), the same value
 * the scene encoder applies to the layer — the composite draws in world
 * space, so a local-only transform would misplace glass inside any
 * transformed parent.
 */
export const projectGlassRecords = (document: EditorDocument): GlassFillRecord[] => {
  const records: GlassFillRecord[] = [];
  let order = 0;
  const walk = (parentId: string, inheritedVisible: boolean, parentWorld: DocumentNode["transform"]): void => {
    const parent = document.nodes[parentId];
    if (!parent) return;
    for (const childId of parent.childIds) {
      const node = document.nodes[childId];
      if (!node) continue;
      const visible = inheritedVisible && node.visible;
      const world = multiplyTransforms(parentWorld, node.transform);
      if (visible) {
        order += 1;
        if (isGlassFill(node.fill) && (node.kind === "rectangle" || node.kind === "frame")) {
          records.push({
            nodeId: node.id,
            bounds: structuredClone(node.bounds),
            transform: world,
            blurRadius: node.fill.blurRadius,
            tint: node.fill.tint,
            tintOpacity: node.fill.tintOpacity,
            saturation: node.fill.saturation,
            refraction: node.fill.refraction ?? 0,
            opacity: node.opacity,
            zIndex: node.zIndex,
            order,
          });
        }
      }
      walk(childId, visible, world);
    }
  };
  for (const pageId of document.pageOrder) {
    const page = document.pages[pageId];
    if (page) walk(page.rootId, true, identityTransform());
  }
  return records;
};

const layerFromNode = (node: DocumentNode, nodes: Record<string, DocumentNode>, invisible: boolean): Layer => {
  // Compound members (and their descendants) draw nothing in the legacy
  // Scene: `invisible` is inherited from a compound ancestor, the outline is
  // the only visual. The layers stay in the tree for hierarchy, selection
  // and the spatial index.
  const children = node.childIds.map((childId) => nodes[childId]).filter((child): child is DocumentNode => Boolean(child)).map((child) => layerFromNode(child, nodes, invisible || node.kind === "compound"));
  const type = layerTypeFor(node.kind);
  // Glass nodes project with opacity 0 and the glass tint as their hex: the
  // legacy Scene cannot express "draw nothing" (every layer emits a fill
  // rect), and `visible: false` would hide the subtree of a glass frame. The
  // composite pass owns the surface; the scene only carries the tint colour
  // so nothing downstream reads an object where the Scene expects a string.
  let fill: string;
  let opacity = node.opacity;
  if (typeof node.fill === "string") {
    fill = node.fill;
  } else if (isGlassFill(node.fill)) {
    fill = node.fill.tint;
    opacity = 0;
  } else {
    // A kernel document is validated before it reaches the projection; a
    // malformed fill here means an unvalidated document was projected — loud.
    throw new Error(`SCENE_ADAPTER_INVALID_FILL:${node.id}`);
  }
  // Path layers carry no geometry in the legacy Scene: they project invisible
  // and draw through the packet's path commands (the glass-records pattern).
  // The same holds for compounds and their member subtrees — the outline
  // rides the packet's path commands, never the members.
  if (node.kind === "path" || node.kind === "compound" || invisible) opacity = 0;
  return { id: node.id, name: node.name, type: children.length > 0 && type !== "group" ? "group" : type, bounds: structuredClone(node.bounds), transform: structuredClone(node.transform), fill, stroke: node.stroke, opacity, cornerRadius: node.cornerRadius, visible: node.visible, ...(node.locked ? { locked: true } : {}), zIndex: node.zIndex, ...(node.text === undefined ? {} : { text: node.text }), ...(children.length === 0 ? {} : { children }) };
};

export const editorDocumentToScene = (document: EditorDocument, revision: number): Scene => {
  const metadata = document.metadata as Partial<LegacyMetadata>;
  const frames: Frame[] = document.pageOrder.map((pageId) => {
    const page = document.pages[pageId];
    if (!page) throw new Error(`EDITOR_DOCUMENT_PAGE_MISSING:${pageId}`);
    const root = document.nodes[page.rootId];
    if (!root) throw new Error(`EDITOR_DOCUMENT_ROOT_MISSING:${page.rootId}`);
    return { id: page.id.replace(/^page-/u, ""), name: page.name, bounds: structuredClone(root.bounds), layers: root.childIds.map((childId) => document.nodes[childId]).filter((child): child is DocumentNode => Boolean(child)).map((child) => layerFromNode(child, document.nodes, false)), stories: structuredClone(metadata.legacyFrameStories?.[page.id.replace(/^page-/u, "")] ?? []) };
  });
  return { schemaVersion: 1, id: metadata.legacySceneId ?? document.file.id, name: metadata.legacySceneName ?? document.file.name, revision, frames };
};
