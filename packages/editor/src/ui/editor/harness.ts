"use client"
import { useCallback, useSyncExternalStore } from "react";
import {
  applyStoryOverrides,
  createSceneSpatialIndex,
  multiplyTransforms,
  transformBounds,
  type Bounds,
  type Frame,
  type Scene,
  type SceneSpatialIndex,
  type Transform2D,
} from "@crafty/scene-model";
import {
  computePathBounds,
  constrainHandleDrag,
  convertPointType,
  createDefaultPageCanvas,
  createEditorKernel,
  documentDeepHitTest,
  documentHitTest,
  editorDocumentToScene,
  hitTestPathEndpoint,
  hitTestPathHandle,
  hitTestPathPoint,
  hitTestPathSegment,
  identityTransform,
  initialInteractionState,
  objectSnapPositions,
  orderKeyBetween,
  orderKeyForSigned,
  parseClipboardPayload,
  parseDocument,
  planGroup,
  planUngroup,
  pointsOfSubpath,
  projectGlassRecords,
  resolveAutoHandles,
  resolveCompoundOutlineResult,
  serializeClipboardPayload,
  screenToWorld,
  snapCornerDecision,
  snapMove,
  snapPenPoint,
  splitSegment,
  transformPoint,
  inverseTransformPoint,
  transitionInteraction,
  unionWorldBounds,
  worldToScreen,
  zoomAt,
  zoomTo,
  type ClipboardContent,
  type DocumentCommand,
  type DocumentId,
  type DocumentNode,
  type EditorDocument,
  type AffineTransform,
  type AcceptedGridRenderContext,
  type PageCanvas,
  type BooleanOperation,
  type EditorKernel,
  type AgentActivity,
  type AgentActivityStore,
  createAgentActivityStore,
  type EditorTool,
  type GridDescriptor,
  type GuideRecord,
  type InteractionContext,
  type InteractionEffect,
  type CornerHandle,
  type InteractionInput,
  type InteractionState,
  type LayoutEvaluator,
  type LayoutSizing,
  type LegalDropDestination,
  type PageRecord,
  type PasteDiagnostic,
  type PasteOutcome,
  type PathGeometry,
  type PathHandle,
  type PathPoint,
  type PenSnapPayload,
  type Rect,
  type ResizeHandle,
  type SnapGuidesPayload,
  type SnapChoicesPayload,
  type SnapObjectPositions,
  type SnapSettings,
  type SnapTargetsOptions,
  type Viewport,
  acceptedGridOpacityForViewport,
  snapshotGridDescriptor,
} from "../../kernel/index.js";
import {
  defaultViewport,
  hasMinimumBounds,
  normalizeBounds,
  type DrawCommand,
  type DrawGlassSurface,
  type DrawPathGeometry,
  type DrawPathPoint,
  type DrawPathSubpath,
} from "@crafty/scene-renderer";
import { buildStructureProjection, type StructureProjection } from "./structure-projection.js";

export interface Point {
  x: number;
  y: number;
}

/** A selected path point in world coordinates, with its resolved handle
 *  endpoints — the node tool's grippy overlay data. A handle endpoint
 *  includes the anchor, so a line from the anchor to the endpoint draws it. */
export interface SelectedPointGrippy {
  x: number;
  y: number;
  handleIn?: Point;
  handleOut?: Point;
}

/** One in-progress pen anchor in world coordinates; a dragged click authors
 *  an outgoing handle on the point. */
export interface PenSessionWorldPoint {
  x: number;
  y: number;
  handle?: Point;
}

/** The pen tool's pending anchor (and pulled handle) in world coordinates,
 *  with the snap it landed on — the overlay's midpoint indicator. */
export interface PenPreviewWorldPoint {
  point: Point;
  handle?: Point;
  snap?: PenSnapPayload;
}

export interface EditorProjection {
  structure: StructureProjection;
  scene: Scene;
  frame: Frame | undefined;
  pages: PageRecord[];
  activePageId: DocumentId;
  /** The active page's authored grid visibility — the option pill's state. */
  gridVisible: boolean;
  selectedId: string | undefined;
  selectedIds: string[];
  selectedLayout: { sizing?: LayoutSizing; layoutPosition?: "flow" | "absolute" } | undefined;
  /** The node under the cursor (select tool, not dragging) — the hover
   *  highlight's driver. Undefined when nothing is hovered. */
  hoveredId: string | undefined;
  viewport: Viewport;
  draftBounds: Bounds | undefined;
  revision: number;
  documentRevision: number;
  storyId: string;
  canUndo: boolean;
  canRedo: boolean;
  interaction: InteractionState;
  pastePreview: { bounds: Bounds } | undefined;
  pasteDiagnostics: PasteDiagnostic[];
  /** Glass surfaces projected from the authored document — protocol-shaped
   *  surfaces the renderer's composite pass draws. Empty when no glass. */
  glassSurfaces: DrawGlassSurface[];
  /**
   * Path draw commands projected from the authored document — the packet
   * channel that carries path geometry the legacy Scene cannot express (its
   * path layers project invisible). The commands carry the RESOLVED geometry
   * (auto handles materialized) and the composed world transform; the module
   * re-sorts by `(zIndex, order)`, so they interleave with the rect layers
   * exactly where the authored node draws. Empty when no paths.
   */
  pathCommands: DrawCommand[];
  /** The selected nodes' bounding box for the selection overlay — the
   *  Figma-style outline + handles. A single selection carries its LOCAL
   *  bounds with the composed WORLD transform, so the box follows the node's
   *  rotation and scale; a multi-selection carries the union of the world
   *  axis-aligned boxes with the identity transform. Undefined when empty. */
   selectionBox: { bounds: Bounds; transform: Transform2D; cornerRadius?: number } | undefined;
  /** The hovered node's box (same shape as `selectionBox`) — the hover
   *  highlight's outline. Undefined when nothing is hovered or the hovered
   *  node is already selected. */
  hoverBox: { bounds: Bounds; transform: Transform2D } | undefined;
  /** Selected path points in world coordinates with their resolved handle
   *  endpoints — the node tool's grippy overlay data. Empty when the point
   *  selection is empty. */
  selectedPointGrippies: SelectedPointGrippy[];
  /** The in-progress pen session's anchors in world coordinates (with the
   *  first point's dragged handle, when authored). Empty outside a session. */
  penSessionWorld: PenSessionWorldPoint[];
  /** The pen tool's pending anchor and pulled handle in world coordinates. */
  penPreviewWorld: PenPreviewWorldPoint | undefined;
  /** The current move/resize snap's aligned positions (world) — the guide
   *  overlay's lines. Undefined between gestures. */
  moveSnapGuides: SnapGuidesPayload | undefined;
  /** Ephemeral chosen candidate evidence; never authored or sent to Rust. */
  snapChoices: SnapChoicesPayload | undefined;
  /** Pointer-down creation snap evidence, separate from the moving corner. */
  creationStartSnapChoices: SnapChoicesPayload | undefined;
  /**
   * Monotonic counter bumped on every emit — document, viewport, selection,
   * draft geometry, everything the canvas draws. The renderer loop compares it
   * against the last drawn value to decide whether a frame is needed, so the
   * render path never depends on a React render happening.
   */
  renderRevision: number;
  /** The canvas's last reported size — the zoom-to-fit and Back-to-Content
   *  math's viewport. Fed by the stage's `setCanvasSize`. */
  canvasSize: { width: number; height: number };
  creationStyle: { fill: string; stroke: string };
  /** Remote-agent activity is ephemeral and never serialized or undoable. */
  agentActivities: readonly AgentActivity[];
}

const DEFAULT_STORY_ID = "story-default";
const DRAG_THRESHOLD = 4;
const EMISSION_DRAIN_LIMIT = 100;
const MIN_LAYER_SIZE = 1;
const makeId = (prefix: string): string =>
  `${prefix}-${crypto.randomUUID?.() ?? Date.now().toString(36)}`;
const distance = (left: Point, right: Point): number =>
  Math.hypot(right.x - left.x, right.y - left.y);
const midpoint = (left: Point, right: Point): Point => ({
  x: (left.x + right.x) / 2,
  y: (left.y + right.y) / 2,
});

export interface ResizeOptions {
  /** Shift: keep the start aspect ratio; the primary axis is the one with
   *  the larger relative delta and the secondary follows. */
  constrainAspect: boolean;
  /** Alt: resize symmetrically around the box center (the opposite edge is
   *  NOT the anchor). */
  fromCenter: boolean;
  minSize: number;
}

/** Grows/shrinks a LOCAL rect from one of the eight handles. The anchor is
 *  the opposite edge (east handles pin the left edge, west pin the right,
 *  south pin the top, north pin the bottom); corner handles pin both.
 *  Pure local-space arithmetic — the caller converts the world delta. */
export const projectConstrainedResize = (
  start: Bounds,
  handle: ResizeHandle,
  worldDelta: Point,
  worldTransform: Transform2D,
  options: ResizeOptions,
): Bounds => {
  const det = worldTransform.a * worldTransform.d - worldTransform.b * worldTransform.c;
  const dx = det !== 0
    ? (worldTransform.d * worldDelta.x - worldTransform.c * worldDelta.y) / det
    : worldDelta.x;
  const dy = det !== 0
    ? (-worldTransform.b * worldDelta.x + worldTransform.a * worldDelta.y) / det
    : worldDelta.y;
  const east = handle === "e" || handle === "ne" || handle === "se";
  const west = handle === "w" || handle === "nw" || handle === "sw";
  const south = handle === "s" || handle === "se" || handle === "sw";
  const north = handle === "n" || handle === "ne" || handle === "nw";
  let width = start.width + (east ? dx : west ? -dx : 0);
  let height = start.height + (south ? dy : north ? -dy : 0);
  if (options.constrainAspect && start.width > 0 && start.height > 0) {
    const ratio = start.width / start.height;
    const relDx = Math.abs(width - start.width) / start.width;
    const relDy = Math.abs(height - start.height) / start.height;
    if (relDx >= relDy) height = width / ratio;
    else width = height * ratio;
  }
  width = Math.max(options.minSize, width);
  height = Math.max(options.minSize, height);
  if (options.fromCenter) {
    return {
      x: start.x + (start.width - width) / 2,
      y: start.y + (start.height - height) / 2,
      width,
      height,
    };
  }
  const sideX = (east || west) && !north && !south;
  const sideY = (north || south) && !east && !west;
  return {
    x: sideY && options.constrainAspect ? start.x + (start.width - width) / 2 : east ? start.x : west ? start.x + (start.width - width) : start.x,
    y: sideX && options.constrainAspect ? start.y + (start.height - height) / 2 : south ? start.y : north ? start.y + (start.height - height) : start.y,
    width,
    height,
  };
};

/** `#rrggbb` → straight-alpha sRGB, the packet's fill convention. */
const hexToRgba = (hex: string): [number, number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 0xff) / 255,
    ((value >> 8) & 0xff) / 255,
    (value & 0xff) / 255,
    1,
  ];
};

/** Kernel glass records → protocol surfaces: the projection the renderer's
 *  composite pass consumes. Plain disposable values, never written back. The
 *  packet tint's alpha carries `tintOpacity`; the surface's own `opacity`
 *  carries the authored node opacity — the composite multiplies the two,
 *  exactly like solid fills fold node opacity into the fill alpha. */
const projectGlassSurfaces = (document: EditorDocument): DrawGlassSurface[] =>
  projectGlassRecords(document).map((record) => {
    const tint = hexToRgba(record.tint);
    return {
      nodeId: record.nodeId,
      bounds: record.bounds,
      transform: record.transform,
      blurRadius: record.blurRadius,
      tint: [tint[0], tint[1], tint[2], record.tintOpacity],
      saturation: record.saturation,
      refraction: record.refraction,
      opacity: record.opacity,
      zIndex: record.zIndex,
      order: record.order,
    };
  });

/** The packet shape shared by path nodes and compound outlines: the composed
 *  WORLD transform, the RESOLVED geometry (auto handles materialized — the
 *  packet vocabulary has no `auto` mode), and the visible-slot `order` the
 *  node's layer occupies in the encoder's walk. `bounds` is the geometry's
 *  world draw rect: for a path node the authored bounds (validated equal to
 *  the geometry bbox); for a compound the outline's DERIVED bbox at its
 *  derived placement — the authored compound bounds may be stale after a
 *  member edit and are never trusted here. */
const drawPathCommand = (
  node: DocumentNode,
  resolved: PathGeometry,
  bounds: { x: number; y: number; width: number; height: number },
  transform: Transform2D,
  order: number,
): DrawCommand => {
  if (typeof node.fill !== "string")
    throw new Error(`SCENE_ADAPTER_INVALID_FILL:${node.id}`);
  const points: Record<string, DrawPathPoint> = {};
  for (const point of Object.values(resolved.points)) {
    points[point.id] = {
      id: point.id,
      subpathId: point.subpathId,
      order: point.order,
      x: point.x,
      y: point.y,
      // Resolved geometry never carries `auto` — resolveAutoHandles
      // materializes derived handles as `asymmetric`, the packet vocabulary.
      handleMode: point.handleMode as DrawPathPoint["handleMode"],
      ...(point.handleIn !== undefined
        ? { handleIn: { ...point.handleIn } }
        : {}),
      ...(point.handleOut !== undefined
        ? { handleOut: { ...point.handleOut } }
        : {}),
    };
  }
  const subpaths: Record<string, DrawPathSubpath> = {};
  for (const subpath of Object.values(resolved.subpaths))
    subpaths[subpath.id] = { id: subpath.id, closed: subpath.closed };
  return {
    geometry: "path",
    nodeId: node.id,
    bounds,
    transform,
    fill: hexToRgba(node.fill),
    opacity: node.opacity,
    zIndex: node.zIndex,
    order,
    path: { points, subpaths },
    fillRule: resolved.fillRule,
  };
};

/** The packet shape of one path node: authored bounds and fill with the
 *  composed WORLD transform and the RESOLVED geometry. */
const pathCommandFor = (
  node: DocumentNode,
  transform: Transform2D,
  order: number,
): DrawCommand =>
  drawPathCommand(
    node,
    resolveAutoHandles(node.path!),
    { ...node.bounds },
    transform,
    order,
  );

/** The packet shape of one text node (protocol v5): the string and its
 *  size, drawn with the authored fill. The model carries no font metrics —
 *  the box height is the size proxy until a font-size property exists. The
 *  encoder tessellates the glyphs from its embedded font. A glass fill has
 *  no hex colour to draw with, so glass text keeps the rect pass (the node
 *  still draws its glass); hex text renders as glyphs. */
const textCommandFor = (
  node: DocumentNode,
  transform: Transform2D,
  order: number,
): DrawCommand | undefined => {
  if (typeof node.fill !== "string") return undefined;
  const fill = hexToRgba(node.fill);
  return {
    geometry: "text",
    nodeId: node.id,
    bounds: { x: 0, y: 0, width: node.bounds.width, height: node.bounds.height },
    transform,
    fill,
    opacity: node.opacity,
    zIndex: node.zIndex,
    order,
    ...(node.text !== undefined ? { text: node.text } : {}),
    fontSize: Math.max(node.bounds.height, 1),
  };
};

/** The packet shape of one compound: the RESOLVED outline (a resolution
 *  product — never authored geometry) placed at its DERIVED world bbox
 *  corner, with the compound's surface (fill, opacity, zIndex). */
const compoundCommandFor = (
  node: DocumentNode,
  outline: { geometry: PathGeometry; placement: { x: number; y: number } },
  transform: Transform2D,
  order: number,
): DrawCommand => {
  const resolved = resolveAutoHandles(outline.geometry);
  const bbox = computePathBounds(resolved);
  return drawPathCommand(
    node,
    resolved,
    {
      x: outline.placement.x,
      y: outline.placement.y,
      width: bbox.maxX - bbox.minX,
      height: bbox.maxY - bbox.minY,
    },
    transform,
    order,
  );
};

/**
 * Projects the active page's path nodes as packet draw commands. Walks the
 * node tree exactly like the scene encoder walks the projected layers
 * (depth-first pre-order, one order slot per visible node), so a command's
 * `order` is the slot its invisible rect layer occupies — sorting commands by
 * `(zIndex, order)` reproduces the authored draw sequence. Only the ACTIVE
 * page projects: the renderer draws one frame, and another page's paths must
 * never leak into it (unlike glass, which the composite draws from records
 * that carry their own world bounds — pre-existing behavior, not replicated).
 */
const projectPathCommands = (
  document: EditorDocument,
  pageId: DocumentId,
): DrawCommand[] => {
  const commands: DrawCommand[] = [];
  let order = 0;
  const walk = (
    parentId: DocumentId,
    inheritedVisible: boolean,
    parentWorld: Transform2D,
  ): void => {
    const parent = document.nodes[parentId];
    if (!parent) return;
    for (const childId of parent.childIds) {
      const node = document.nodes[childId];
      if (!node) continue;
      const visible = inheritedVisible && node.visible;
      // The kernel's authoritative composition (interaction.ts
      // `visiblePathNodes`): bounds carry the placement, the transform is the
      // extra affine — path points are node-local, so the translate is the
      // only thing that positions them. A compound's outline sits at its
      // DERIVED placement (the outline re-resolves on member edits, so the
      // authored compound bounds may be stale) — the same composition, with
      // the derived corner in place of the authored bounds corner.
      const position = {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: node.bounds.x,
        f: node.bounds.y,
      };
      const world = multiplyTransforms(
        parentWorld,
        multiplyTransforms(position, node.transform),
      );
      if (visible) {
        order += 1;
        // Compound members never draw individually: the outline is the only
        // visual, so a member's own path stays out of the channel. The
        // member subtrees still consume their encoder slots below.
        const isMember = parent.kind === "compound";
        if (node.kind === "path" && node.path && !isMember)
          commands.push(pathCommandFor(node, world, order));
        else if (node.kind === "text" && node.text && !isMember) {
          const textCommand = textCommandFor(node, world, order);
          if (textCommand) commands.push(textCommand);
        } else if (node.kind === "compound" && !isMember) {
          const outline = resolveCompoundOutlineResult(document, node.id);
          if (outline) {
            const placement = {
              a: 1,
              b: 0,
              c: 0,
              d: 1,
              e: outline.placement.x,
              f: outline.placement.y,
            };
            const outlineWorld = multiplyTransforms(
              parentWorld,
              multiplyTransforms(placement, node.transform),
            );
            commands.push(
              compoundCommandFor(node, outline, outlineWorld, order),
            );
          }
        }
      }
      walk(childId, visible, world);
    }
  };
  const page = document.pages[pageId];
  if (page) walk(page.rootId, true, identityTransform());
  return commands;
};

/**
 * Kernel-backed document adapter for the browser surface. Owns the kernel,
 * the ephemeral viewport, the interaction state machine ref, and the
 * story-overridden scene projection; React consumes it through
 * `subscribe`/`getSnapshot` (see `useCanvasEditor`). All document mutation
 * flows through kernel commands and transactions; the harness never calls
 * React setState for document data. Persistence is document-native: the
 * save surface (`snapshotForSave`, `replaceDocument`, `confirmSaved`) moves
 * the kernel's `EditorDocument`, not a Scene; the Scene remains the
 * render-side projection only.
 */
export class CanvasEditor {
  private kernel: EditorKernel;
  private frameId: string;
  private storyId: string;
  private revision: number;
  private devicePixelRatio: number;
  /**
   * The LIVE camera. The kernel is its single owner (`EditorState.viewport`);
   * this getter is the read surface, and every write goes through
   * `kernel.setViewport` — there is no second viewport object to drift from
   * the kernel's (the old harness-owned field + `syncKernelViewport` mirror
   * were the second and third representations of one camera).
   */
  private get viewport(): Viewport {
    return this.kernel.getState().viewport;
  }
  /** True until the user pans, zooms or pinches: the canvas stage keeps the
   *  world origin centred while the camera is still unpositioned. Set by
   *  `initialViewport` and `syncPageContext`. */
  private cameraFresh = true;
  private interaction: InteractionState;
  private spatialIndex: SceneSpatialIndex | undefined;
  private sceneCache:
    | {
        key: string;
        scene: Scene;
        glassSurfaces: DrawGlassSurface[];
        pathCommands: DrawCommand[];
        authoredIdForProjectionId: Record<DocumentId, DocumentId>;
      }
    | undefined;
  /** Immutable style captured at a shape gesture or pen session boundary. */
  private creationStyleCapture: { fill: string; stroke: string } | undefined;
  private projectionCache: EditorProjection | undefined;
  private structureCache: { revision: number; pageId: DocumentId; isolation?: DocumentId; projection: StructureProjection } | undefined;
  private listeners = new Set<() => void>();
  private emissionBatchDepth = 0;
  private emissionPending = false;
  private emissionDraining = false;
  private transactionArmed = false;
  private panStart: { pointer: Point; viewport: Viewport } | undefined;
  private moveStart: { key: string; bounds: Map<string, Bounds> } | undefined;
  /** Last grid packet successfully accepted by the renderer. Ephemeral render
   * context only: it is never projected, serialized, or added to history. */
  private acceptedGridRenderContext: AcceptedGridRenderContext | undefined;
  /** The in-flight camera animation (zoom-to-fit/selection): any user input
   *  cancels it — the user always preempts the camera. */
  private cameraAnim: { start: number; raf: number } | undefined;
  /** The alt-drag duplicate's copy map: dragged-root id → minted copy id,
   *  established at the first preview and cleared at gesture end. */
  private duplicateDragMap: Map<string, string> | undefined;
  /** The marquee's scope container id (a frame/group the drag started
   *  inside), resolved at begin-marquee and consumed at commit. */
  private marqueeScope: DocumentId | undefined;
  /** The rotate gesture's start angle (box-center → cursor), keyed by node —
   *  the delta that follows the cursor. Cleared at gesture end. */
  private rotateStart: { key: string; angle: number } | undefined;
  private cornerRadiusStart: { nodeId: string; value: number } | undefined;
  /** The last alt-drag's world delta — ⌘D's repeat offset ("smart
   *  duplicate"). A fresh editor duplicates by 10px on each axis. */
  private lastDuplicateOffset: { x: number; y: number } = { x: 10, y: 10 };
  private pointers = new Map<number, Point>();
  private ignoredPointers = new Set<number>();
  private pinch:
    { distance: number; midpoint: Point; viewport: Viewport } | undefined;
  private draftBounds: Bounds | undefined;
  private lastPointerPoint: Point = { x: 0, y: 0 };
  private lastPointerModifiers = { altKey: false, shiftKey: false, ctrlKey: false };
  private canvasWidth = 1280;
  private canvasHeight = 800;
  private canvasPixelRatio = 1;
  private pastePreviewBounds: Bounds | undefined;
  private pasteDiagnostics: PasteDiagnostic[] = [];
  private renderRevision = 0;
  /** The move/resize snap's aligned positions (world) — drawn as the guide
   *  overlay while the drag is live, cleared at gesture end. */
  private moveSnapGuides: SnapGuidesPayload | undefined;
  private snapChoices: SnapChoicesPayload | undefined;
  private creationStartSnapChoices: SnapChoicesPayload | undefined;
  /** The moving selection's PRE-drag world box, captured on the first snap
   *  of a move gesture — the reference the cumulative delta snaps against. */
  private moveSnapStart:
    | {
        key: string;
        bounds: Rect;
        resize?: { bounds: Bounds; transform: Transform2D };
      }
    | undefined;
  /** The in-progress pen path: WORLD-space anchors — a point stays where it
   *  was dropped when the user pans or zooms mid-session (screen points would
   *  drift with the viewport). The pending segment preview is `penPreview`,
   *  never the document. The session owns ONE transaction that spans clicks
   *  and navigation; gestures and tool changes must not commit or roll it
   *  back under the session (that is the mid-session navigation bug: a pan's
   *  gesture-finish committed the session's empty transaction, and the close
   *  then failed with EDITOR_TRANSACTION_REQUIRED). */
  private penSession:
    | {
        style: { fill: string; stroke: string };
        points: Array<{
          x: number;
          y: number;
          handle?: { x: number; y: number };
        }>;
      }
    | undefined;
  private penPreview: { point: Point; handle?: Point; snap?: PenSnapPayload } | undefined;
  private readonly agentActivityStore: AgentActivityStore;

  constructor(
    document: EditorDocument,
    revision: number,
    options: {
      frameId?: string;
      storyId?: string;
      devicePixelRatio?: number;
    } = {},
  ) {
    this.kernel = createEditorKernel(document);
    this.frameId =
      options.frameId ??
      this.kernel.getState().currentPageId.replace(/^page-/u, "");
    this.storyId = options.storyId ?? DEFAULT_STORY_ID;
    this.revision = revision;
    this.devicePixelRatio = options.devicePixelRatio ?? 1;
    this.agentActivityStore = createAgentActivityStore();
    this.cameraFresh = this.initialViewportIsFresh();
    if (this.cameraFresh) this.seedFreshCamera();
    this.interaction = initialInteractionState("select");
    this.kernel.subscribe(() => {
      this.projectionCache = undefined;
      this.emit();
    });
    this.agentActivityStore.subscribe(() => {
      this.projectionCache = undefined;
      this.emit();
    });
  }

  setLayoutEvaluator(evaluator?: LayoutEvaluator): void {
    this.kernel.setLayoutEvaluator(evaluator);
    this.sceneCache = undefined;
    this.spatialIndex = undefined;
    this.renderRevision += 1;
  }

  /** Publishes the last successfully accepted grid packet context. Absence
   * clears eligibility and any evidence derived from it. It never enters
   * canonical editor state. */
  setAcceptedGridRenderContext(
    context: AcceptedGridRenderContext | undefined,
  ): void {
    if (!context && !this.acceptedGridRenderContext) return;
    this.emissionBatchDepth += 1;
    try {
      this.acceptedGridRenderContext = context
        ? {
            opacity: Math.max(0, context.opacity),
            pageId: context.pageId,
            viewport: { ...context.viewport },
            grid: snapshotGridDescriptor(context.grid),
          }
        : undefined;
      if (this.acceptedGridOpacity() <= 0) {
        this.clearGridSnapEvidence();
        const active = this.interaction;
        if (active.pointerId !== undefined && active.rawCurrent) {
          // Clearing and replay are one external-store transition: kernel
          // preview emissions are held until geometry and evidence agree.
          this.interaction = { ...active, current: active.rawCurrent };
          this.kernel.setInteraction(this.interaction);
          this.applyInteraction({
            type: "pointer-move",
            pointerId: active.pointerId,
            point: active.rawCurrent,
            button: 0,
            ...this.lastPointerModifiers,
            spaceKey: false,
          });
        }
      }
    } finally {
      this.emissionBatchDepth -= 1;
      if (this.emissionBatchDepth === 0 && this.emissionPending) {
        this.emit();
      }
    }
  }

  /** Invalidating a rendered grid removes only evidence that came from that
   * packet. Path and guide evidence remain valid because their targets are
   * kernel-owned and independent of renderer acceptance. */
  private clearGridSnapEvidence(): void {
    let changed = false;
    const withoutGrid = (choices: SnapChoicesPayload | undefined): SnapChoicesPayload | undefined => {
      if (!choices) return undefined;
      const next: SnapChoicesPayload = {
        ...(choices.x?.family !== "grid" ? { x: choices.x } : {}),
        ...(choices.y?.family !== "grid" ? { y: choices.y } : {}),
      };
      return next.x || next.y ? next : undefined;
    };
    const nextChoices = withoutGrid(this.snapChoices);
    if (nextChoices !== this.snapChoices) {
      if (this.snapChoices?.x?.family === "grid" || this.snapChoices?.y?.family === "grid") changed = true;
      this.snapChoices = nextChoices;
      this.moveSnapGuides = nextChoices
        ? {
            ...(nextChoices.x ? { x: nextChoices.x.value } : {}),
            ...(nextChoices.y ? { y: nextChoices.y.value } : {}),
          }
        : undefined;
    }
    if (this.penPreview?.snap?.kind === "axis") {
      const choices = withoutGrid(this.penPreview.snap.choices);
      if (choices !== this.penPreview.snap.choices && (this.penPreview.snap.choices?.x?.family === "grid" || this.penPreview.snap.choices?.y?.family === "grid")) {
        changed = true;
        const resnapped = this.snapPenPointScreen(this.lastPointerPoint);
        const { snap: _snap, ...preview } = this.penPreview;
        this.penPreview = {
          ...preview,
          point: screenToWorld(resnapped.point, this.viewport),
          ...(resnapped.snap ? { snap: resnapped.snap } : {}),
        };
      }
    }
    if (changed) this.emit();
  }

  private acceptedGridOpacity(): number {
    const state = this.kernel.getState();
    const grid = this.kernel.getDocument().pages[state.currentPageId]?.canvas.grid;
    if (!grid) return 0;
    return acceptedGridOpacityForViewport(
      state.currentPageId,
      {
        ...this.viewport,
        width: this.canvasWidth,
        height: this.canvasHeight,
        pixelRatio: this.canvasPixelRatio,
      },
      grid,
      this.acceptedGridRenderContext,
    );
  }

  private initialViewportIsFresh(): boolean {
    const viewport = this.kernel.getState().viewport;
    // A default rest camera (0,0,1) means nobody has positioned it yet: the
    // canvas stage will centre the world origin until the user moves it.
    return viewport.panX === 0 && viewport.panY === 0 && viewport.zoom === 1;
  }

  /** Applies the fresh-camera policy to the kernel's live viewport: an
   *  unpositioned rest camera becomes the scene-renderer default (the stage
   *  then re-centres the origin on its first measure, keeping the default
   *  zoom). The kernel remains the single owner; this is the harness seeding
   *  the policy once, never a second viewport. */
  private seedFreshCamera(): void {
    this.kernel.setViewport({
      ...defaultViewport(),
      devicePixelRatio: this.devicePixelRatio,
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): EditorProjection {
    if (this.projectionCache) return this.projectionCache;
    const { document, resolvedDocument, resolvedScene, state, documentRevision } = this.kernel.getProjection();
    if (!this.structureCache || this.structureCache.revision !== documentRevision || this.structureCache.pageId !== state.currentPageId || this.structureCache.isolation !== state.isolationRootId) {
      this.structureCache = { revision: documentRevision, pageId: state.currentPageId, ...(state.isolationRootId ? { isolation: state.isolationRootId } : {}), projection: buildStructureProjection(document, state.currentPageId, state.isolationRootId, documentRevision) };
    }
    const scene = this.buildScene(resolvedDocument, documentRevision);
    const frame =
      scene.frames.find((candidate) => candidate.id === this.frameId) ??
      scene.frames[0];
    const selectedNode = state.selectedIds[0] ? document.nodes[state.selectedIds[0]] : undefined;
    const resolvedSelectionIds = state.selectedIds.map((id) => this.resolvedIdForAuthoredId(id, resolvedScene));
    const projection: EditorProjection = {
      structure: this.structureCache.projection,
      scene,
      frame,
      pages: document.pageOrder
        .map((pageId) => document.pages[pageId])
        .filter((page): page is PageRecord => Boolean(page)),
      activePageId: state.currentPageId,
      gridVisible: true,
      selectedId: state.selectedIds[0],
      selectedIds: state.selectedIds,
      selectedLayout: selectedNode
        ? { ...(selectedNode.sizing ? { sizing: selectedNode.sizing } : {}), ...(selectedNode.layoutPosition ? { layoutPosition: selectedNode.layoutPosition } : {}) }
        : undefined,
      hoveredId: state.hoveredId,
      // The projection mirrors the kernel viewport verbatim so consumers read
      // one authoritative camera, including device pixel ratio.
      viewport: {
        panX: state.viewport.panX,
        panY: state.viewport.panY,
        zoom: state.viewport.zoom,
        devicePixelRatio: state.viewport.devicePixelRatio,
      },
      draftBounds: this.draftBounds,
      revision: this.revision,
      documentRevision,
      storyId: this.storyId,
      canUndo: this.kernel.canUndo(),
      canRedo: this.kernel.canRedo(),
      interaction: this.interaction,
      pastePreview: this.pastePreviewBounds
        ? { bounds: { ...this.pastePreviewBounds } }
        : undefined,
      pasteDiagnostics: [...this.pasteDiagnostics],
      glassSurfaces: this.sceneCache?.glassSurfaces ?? [],
      pathCommands: this.sceneCache?.pathCommands ?? [],
      selectionBox: this.projectSelectionBox(
        resolvedDocument,
        state.currentPageId,
        resolvedSelectionIds,
      ),
      hoverBox:
        state.hoveredId && !state.selectedIds.includes(state.hoveredId)
          ? this.projectSelectionBox(resolvedDocument, state.currentPageId, [this.resolvedIdForAuthoredId(state.hoveredId, resolvedScene)])
          : undefined,
      selectedPointGrippies: this.projectSelectedGrippies(
        document,
        state.currentPageId,
        state.selectedPointIds,
      ),
      penSessionWorld: this.projectPenSession(),
      penPreviewWorld: this.projectPenPreview(),
      moveSnapGuides: this.moveSnapGuides
        ? { ...this.moveSnapGuides }
        : undefined,
      snapChoices: this.snapChoices ? structuredClone(this.snapChoices) : undefined,
      creationStartSnapChoices: this.creationStartSnapChoices ? structuredClone(this.creationStartSnapChoices) : undefined,
      renderRevision: this.renderRevision,
      canvasSize: { width: this.canvasWidth, height: this.canvasHeight },
      creationStyle: state.creationStyle,
      agentActivities: this.agentActivityStore.getSnapshot(),
    };
    this.projectionCache = projection;
    return projection;
  }

  /** Selection remains authored identity; overlays use the disposable
   * projection id when an instance expands into resolved nodes. */
  private resolvedIdForAuthoredId(id: DocumentId, resolved: { nodes: Record<DocumentId, { provenance: { instanceId?: DocumentId; definitionNodeId?: DocumentId } }> }): DocumentId {
    if (resolved.nodes[id]) return id;
    const match = Object.entries(resolved.nodes).find(([, node]) => node.provenance.instanceId === id && node.provenance.definitionNodeId === this.kernel.getDocument().components[this.kernel.getDocument().instances[id]?.definitionId ?? ""]?.rootNodeId);
    return match?.[0] ?? id;
  }

  private authoredIdForProjectionId(id: DocumentId): DocumentId {
    return this.sceneCache?.authoredIdForProjectionId[id] ?? id;
  }

  // -- Document commands ---------------------------------------------------

  setAgentActivity(activity: AgentActivity): void {
    this.agentActivityStore.set(activity);
  }

  clearAgentActivity(operationId: string): void {
    this.agentActivityStore.clear(operationId);
  }

  dispatch(command: DocumentCommand, label: string = command.type): void {
    this.kernel.dispatch(command, label);
  }

  setSelection(ids: DocumentId[]): void {
    this.kernel.setSelection(ids);
  }

  enterIsolation(rootId: DocumentId): boolean {
    return this.kernel.enterIsolation(rootId);
  }

  exitIsolation(): boolean {
    return this.kernel.exitIsolation();
  }

  legalDropDestinations(nodeId: DocumentId): LegalDropDestination[] {
    return this.kernel.legalDropDestinations(nodeId);
  }

  componentSource(instanceId: DocumentId): void {
    const instance = this.kernel.getDocument().instances[instanceId];
    const definition = instance ? this.kernel.getDocument().components[instance.definitionId] : undefined;
    if (definition) this.kernel.setSelection([definition.rootNodeId]);
  }

  resetComponentOverrides(instanceId: DocumentId): void {
    const document = this.kernel.getDocument();
    const instance = document.instances[instanceId];
    if (!instance) return;
    const commands = Object.entries(instance.overrides).flatMap(([nodeId, values]) => Object.keys(values).map((property) => ({ type: "clear-instance-override" as const, instanceId, nodeId, property })));
    if (commands.length) this.kernel.dispatchBatch(commands, "Reset component overrides");
  }

  detachComponentInstance(instanceId: DocumentId): void {
    if (this.kernel.getDocument().instances[instanceId]) this.kernel.dispatch({ type: "detach-component-instance", instanceId }, "Detach component instance");
  }

  /** ⇧H/⇧V: reflect the single selection around its box center — the same
   *  center-anchored composition rotation uses, with S(-1,1)/S(1,-1) in
   *  place of R. One history entry. */
  flip(axis: "h" | "v"): void {
    const { document, state } = this.kernel.getProjection();
    const pageId = state.currentPageId;
    const selectedIds = state.selectedIds;
    if (selectedIds.length !== 1) return;
    const nodeId = selectedIds[0]!;
    const node = document.nodes[nodeId];
    if (!node) return;
    const box = this.projectSelectionBox(document, pageId, selectedIds);
    if (!box) return;
    const world = transformBounds(box.bounds, box.transform);
    const center = {
      x: world.x + world.width / 2,
      y: world.y + world.height / 2,
    };
    const b = { x: box.transform.e, y: box.transform.f };
    const tx = (x: number, y: number): AffineTransform => ({ a: 1, b: 0, c: 0, d: 1, e: x, f: y });
    const scale = (sx: number, sy: number): AffineTransform => ({ a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 });
    const a = multiplyTransforms(
      tx(center.x - b.x, center.y - b.y),
      multiplyTransforms(
        axis === "h" ? scale(-1, 1) : scale(1, -1),
        tx(b.x - center.x, b.y - center.y),
      ),
    );
    this.kernel.dispatch(
      {
        type: "set-transform",
        nodeId,
        transform: multiplyTransforms(a, node.transform),
      },
      axis === "h" ? "Flip horizontal" : "Flip vertical",
    );
  }

  /** Number-key opacity: 1–9 → 10–90% on the selection. */
  setSelectionOpacity(percent: number): void {
    const { state } = this.kernel.getProjection();
    const opacity = Math.min(0.9, Math.max(0.1, percent / 100));
    const ids = state.selectedIds;
    if (ids.length === 0) return;
    this.kernel.dispatchBatch(
      ids.map((nodeId) => ({
        type: "set-property" as const,
        nodeId,
        property: "opacity" as const,
        value: opacity,
      })),
      `Set opacity ${Math.round(opacity * 100)}%`,
    );
  }

  /** ⌘A: every visible, unlocked node on the current page. */
  selectAll(): void {
    this.kernel.selectAll();
  }

  toggleSelection(ids: DocumentId[]): void {
    this.kernel.toggleSelection(ids);
  }

  setTool(tool: EditorTool): void {
    // Leaving the pen tool ends the session: the path commits (or rolls back
    // for a single point), so no later gesture can collide with the session's
    // open transaction. The session's close owns the transaction.
    if (this.penSession) {
      this.commitPenSession(false);
    } else if (this.transactionArmed) {
      this.kernel.rollback();
      this.transactionArmed = false;
    }
    this.interaction = initialInteractionState(tool);
    this.kernel.setTool(tool);
    this.kernel.setHovered(undefined);
    this.clearDraft();
    this.emit();
  }

  setCreationFill(fill: string): void {
    this.kernel.setCreationFill(fill);
  }

  setCreationStroke(stroke: string): void {
    this.kernel.setCreationStroke(stroke);
  }

  setStory(storyId: string): void {
    if (this.storyId === storyId) return;
    this.storyId = storyId;
    this.sceneCache = undefined;
    this.spatialIndex = undefined;
    this.projectionCache = undefined;
    this.emit();
  }

  // -- Page management -----------------------------------------------------

  setPage(pageId: DocumentId): void {
    if (pageId === this.kernel.getState().currentPageId) return;
    this.cancelGesture();
    const state = this.kernel.getState();
    const current = state.currentPageId;
    const rest = this.kernel.getDocument().pages[current]?.canvas.rest;
    if (
      rest &&
      (rest.panX !== this.viewport.panX ||
        rest.panY !== this.viewport.panY ||
        rest.zoom !== this.viewport.zoom)
    ) {
      this.kernel.dispatch(
        {
          type: "set-page-viewport",
          pageId: current,
          viewport: {
            panX: this.viewport.panX,
            panY: this.viewport.panY,
            zoom: this.viewport.zoom,
          },
        },
        "Persist page camera",
      );
    }
    this.kernel.dispatch({ type: "set-page", pageId });
    this.syncPageContext();
  }

  createPage(name: string): DocumentId {
    const frameId = makeId("frame");
    const pageId = `page-${frameId}`;
    const rootId = `page-root-${frameId}`;
    const inherit = { ...this.viewport };
    this.kernel.dispatch(
      {
        type: "create-page",
        page: { id: pageId, name, rootId, canvas: createDefaultPageCanvas() },
      },
      "Create page",
    );
    this.setPage(pageId);
    this.kernel.dispatch(
      {
        type: "set-page-viewport",
        pageId,
        viewport: {
          panX: inherit.panX,
          panY: inherit.panY,
          zoom: inherit.zoom,
        },
      },
      "Inherit page camera",
    );
    this.syncPageContext();
    return pageId;
  }

  deletePage(pageId: DocumentId): void {
    this.kernel.dispatch({ type: "delete-page", pageId }, "Delete page");
    this.syncPageContext();
  }

  reorderPage(pageId: DocumentId, direction: -1 | 1): void {
    const document = this.kernel.getDocument();
    const index = document.pageOrder.indexOf(pageId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= document.pageOrder.length) return;
    this.kernel.dispatch(
      { type: "reorder-page", pageId, index: next },
      direction < 0 ? "Move page up" : "Move page down",
    );
  }

  serializeDocument(): string {
    return this.kernel.serialize();
  }

  undo(): boolean {
    const result = this.kernel.undo();
    this.syncPageContext();
    return result;
  }
  redo(): boolean {
    const result = this.kernel.redo();
    this.syncPageContext();
    return result;
  }

  /** Wraps the selection in a new group and selects it. Returns false when the
   *  selection cannot be grouped (empty, or spanning more than one parent). */
  groupSelection(): boolean {
    const selectedIds = this.kernel.getState().selectedIds;
    if (selectedIds.length === 0) return false;
    const groupId = makeId("group");
    let commands: DocumentCommand[];
    try {
      commands = planGroup(this.kernel.getDocument(), selectedIds, groupId);
    } catch {
      return false;
    }
    this.kernel.dispatchBatch(commands, "Group selection");
    this.kernel.setSelection([groupId]);
    return true;
  }

  /** Dissolves every selected group, selecting the freed children. */
  ungroupSelection(): boolean {
    const document = this.kernel.getDocument();
    const groupIds = this.kernel
      .getState()
      .selectedIds.filter((id) => document.nodes[id]?.kind === "group");
    if (groupIds.length === 0) return false;
    const freed = groupIds.flatMap((id) => document.nodes[id]?.childIds ?? []);
    const commands = groupIds.flatMap((id) => planUngroup(document, id));
    this.kernel.dispatchBatch(commands, "Ungroup selection");
    this.kernel.setSelection(freed);
    return true;
  }

  duplicate(): void {
    this.kernel.duplicateSelection();
  }

  deleteSelection(): void {
    const selected = this.kernel.getState().selectedIds;
    if (selected.length === 0) return;
    const document = this.kernel.getDocument();
    const selectedSet = new Set(selected);
    const topmost = selected.filter((id) => {
      let cursor = document.nodes[id]?.parentId;
      while (cursor) {
        if (selectedSet.has(cursor)) return false;
        cursor = document.nodes[cursor]?.parentId ?? null;
      }
      return true;
    });
    if (topmost.length > 0)
      this.kernel.dispatchBatch(
        topmost.map((id) => ({ type: "delete-subtree", nodeId: id })),
        "Delete layer",
      );
    this.kernel.setSelection([]);
  }

  // -- Clipboard: copy/paste across pages (S5) ----------------------------

  copySelection(): ClipboardContent | undefined {
    const content = this.kernel.copySelection();
    if (content) {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText)
          void navigator.clipboard
            .writeText(serializeClipboardPayload(content))
            .catch(() => undefined);
      } catch {
        // Process-local kernel clipboard remains the paste source.
      }
    }
    return content;
  }

  async readOsClipboard(): Promise<ClipboardContent | undefined> {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.readText)
        return undefined;
      return parseClipboardPayload(await navigator.clipboard.readText());
    } catch {
      return undefined;
    }
  }

  setClipboard(content: ClipboardContent | undefined): void {
    this.kernel.setClipboard(content);
    this.clearPastePreview();
  }

  pasteAt(point?: Point): PasteOutcome | undefined {
    const world = screenToWorld(point ?? this.lastPointerPoint, this.viewport);
    const outcome = this.kernel.paste(undefined, world);
    this.pastePreviewBounds = undefined;
    if (outcome) this.pasteDiagnostics = [...outcome.diagnostics];
    this.emit();
    return outcome;
  }

  /** Paste anchored at the copy's own position — ⌘⇧V. */
  pasteInPlace(): PasteOutcome | undefined {
    const outcome = this.kernel.pasteInPlace();
    this.pastePreviewBounds = undefined;
    if (outcome) this.pasteDiagnostics = [...outcome.diagnostics];
    this.emit();
    return outcome;
  }

  /** Right-click semantics for the context menu: select the node under the
   *  cursor — keeping an existing multi-selection that already contains it —
   *  or clear the selection on empty canvas. The right button never reaches
   *  the interaction reducer (no drag, no state machine): the menu reads the
   *  resulting selection and dispatches through the same kernel commands as
   *  every other surface. */
  handleContextMenu(point: Point): void {
    const projection = this.kernel.getProjection();
    const hit = this.authoredIdForProjectionId(
      documentHitTest(
        projection.resolvedDocument,
        projection.state.currentPageId,
        screenToWorld(point, this.viewport),
        projection.state.isolationRootId,
      ) ?? "",
    );
    if (!hit) {
      this.kernel.setSelection([]);
      return;
    }
    const selected = this.kernel.getState().selectedIds;
    if (selected.includes(hit)) return;
    this.kernel.setSelection([hit]);
  }

  previewPaste(point?: Point): void {
    const world = screenToWorld(point ?? this.lastPointerPoint, this.viewport);
    const preview = this.kernel.pastePreview(world);
    this.pastePreviewBounds = preview ? { ...preview.bounds } : undefined;
    this.emit();
  }

  /** The ⌘⇧V preview: anchored at the copy's own position, not the cursor. */
  previewPasteInPlace(): void {
    const content = this.kernel.getClipboard();
    if (!content) return;
    const first = content.nodes[0];
    if (!first) return;
    let minX = first.bounds.x;
    let minY = first.bounds.y;
    for (const node of content.nodes) {
      minX = Math.min(minX, node.bounds.x);
      minY = Math.min(minY, node.bounds.y);
    }
    this.previewPaste(worldToScreen({ x: minX, y: minY }, this.viewport));
  }

  clearPastePreview(): void {
    if (!this.pastePreviewBounds) return;
    this.pastePreviewBounds = undefined;
    this.emit();
  }

  reorder(direction: -1 | 1): void {
    const selectedId = this.kernel.getState().selectedIds[0];
    if (!selectedId) return;
    this.reorderNode(selectedId, direction);
  }

  /** Moves one node within its parent's child list. Used by the layers panel;
   *  `reorder` is the keyboard shortcut surface for the selected node. */
  reorderNode(nodeId: DocumentId, direction: -1 | 1): void {
    const document = this.kernel.getDocument();
    const node = document.nodes[nodeId];
    const parent = node?.parentId ? document.nodes[node.parentId] : undefined;
    if (!node || !parent) return;
    const index = parent.childIds.indexOf(node.id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= parent.childIds.length) return;
    this.kernel.dispatch(
      {
        type: "reorder-node",
        nodeId: node.id,
        parentId: parent.id,
        index: next,
      },
      direction < 0 ? "Move layer up" : "Move layer down",
    );
  }

  /** Index-based reorder — the layers panel's drag-drop target. */
  moveNodeToIndex(nodeId: DocumentId, parentId: DocumentId, index: number, label = "Reorder layer"): void {
    this.kernel.dispatch({ type: "reorder-node", nodeId, parentId, index }, label);
  }

  /** Cross-parent move — the layers panel's drag-into-container target. The
   *  placement is REBASED into the new parent's local space (the kernel's
   *  reparent-node moves the node as-is; without the rebase the layer would
   *  jump to old-parent coordinates interpreted in the new parent). One
   *  history entry for the whole move. */
  reparentNode(nodeId: DocumentId, parentId: DocumentId, index: number, label = "Move layer"): void {
    const { document, state } = this.kernel.getProjection();
    const node = document.nodes[nodeId];
    if (!node || node.parentId === parentId) return;
    // The node's WORLD placement is its world transform's translation; the
    // new parent's local space is the inverse of the parent's world
    // transform applied to that placement.
    const worldPlacement = this.worldTransformOf(nodeId);
    const placement = { x: worldPlacement.e, y: worldPlacement.f };
    const parentWorld = this.worldTransformOf(parentId);
    const local = inverseTransformPoint(placement, parentWorld);
    if (!local) return;
    this.kernel.dispatchBatch(
      [
        {
          type: "set-bounds",
          nodeId,
          bounds: {
            x: local.x,
            y: local.y,
            width: node.bounds.width,
            height: node.bounds.height,
          },
        },
        { type: "reparent-node", nodeId, parentId, index },
      ],
      label,
    );
  }

  renamePage(pageId: DocumentId, name: string): void {
    this.kernel.dispatch(
      { type: "set-page-name", pageId, name },
      "Rename page",
    );
  }

  /** Aligns the selected nodes (same parent) to the selection's union bounds. */
  alignSelection(
    axis: "left" | "centerX" | "right" | "top" | "centerY" | "bottom",
  ): void {
    const selectedIds = this.kernel.getState().selectedIds;
    if (selectedIds.length < 2) return;
    this.kernel.dispatch(
      { type: "align-nodes", nodeIds: selectedIds, axis },
      `Align ${axis}`,
    );
  }

  addStory(): void {
    const selectedId = this.kernel.getState().selectedIds[0];
    const metadata = this.kernel.getDocument().metadata as {
      legacyFrameStories?: Record<string, unknown[]>;
    };
    const stories = metadata.legacyFrameStories?.[this.frameId] ?? [];
    const story = {
      id: makeId("story"),
      name: "New state",
      labels: ["custom"],
      overrides: selectedId
        ? { [selectedId]: { fill: "#a78bfa", opacity: 0.82 } }
        : {},
    };
    this.dispatch(
      {
        type: "set-metadata",
        key: "legacyFrameStories",
        value: {
          ...(metadata.legacyFrameStories ?? {}),
          [this.frameId]: [...stories, story],
        },
      },
      "Create visual state",
    );
  }

  // -- Persistence glue (fetch-free; the app owns the HTTP boundary) ------

  snapshotForSave(): { document: EditorDocument; revision: number } {
    return { document: this.kernel.getDocument(), revision: this.revision };
  }

  confirmSaved(revision: number): void {
    this.revision = revision;
    this.sceneCache = undefined;
    this.spatialIndex = undefined;
    this.projectionCache = undefined;
    this.emit();
  }

  replaceDocument(document: EditorDocument, revision: number): void {
    this.adoptKernel(createEditorKernel(document), revision);
  }

  replaceDocumentJson(serialized: string, revision: number): void {
    const result = parseDocument(serialized);
    if (!result.ok || !result.document) throw new Error("DOCUMENT_INVALID");
    this.adoptKernel(createEditorKernel(result.document), revision);
  }

  private adoptKernel(next: EditorKernel, revision: number): void {
    this.kernel = next;
    this.revision = revision;
    const state = next.getState();
    this.frameId = state.currentPageId.replace(/^page-/u, "");
    this.cameraFresh = this.initialViewportIsFresh();
    if (this.cameraFresh) this.seedFreshCamera();
    this.interaction = initialInteractionState(state.activeTool);
    this.transactionArmed = false;
    this.panStart = undefined;
    this.moveStart = undefined;
    this.pinch = undefined;
    this.pointers.clear();
    this.ignoredPointers.clear();
    this.draftBounds = undefined;
    this.lastPointerPoint = { x: 0, y: 0 };
    this.pastePreviewBounds = undefined;
    this.pasteDiagnostics = [];
    this.acceptedGridRenderContext = undefined;
    this.sceneCache = undefined;
    this.spatialIndex = undefined;
    this.projectionCache = undefined;
    this.kernel.subscribe(() => {
      this.projectionCache = undefined;
      this.emit();
    });
    this.emit();
  }

  // -- Kernel input router: pointer and wheel plumbing --------------------

  handlePointerDown(input: {
    pointerId: number;
    point: Point;
    button: number;
    altKey: boolean;
    shiftKey: boolean;
    spaceKey: boolean;
    ctrlKey?: boolean;
    clickCount?: number;
  }): void {
    this.cancelCameraAnimation();
    this.lastPointerPoint = input.point;
    this.lastPointerModifiers = {
      altKey: input.altKey,
      shiftKey: input.shiftKey,
      ctrlKey: input.ctrlKey ?? false,
    };
    this.pointers.set(input.pointerId, input.point);
    if (
      this.interaction.phase === "idle" &&
      ["rectangle", "ellipse", "frame", "line"].includes(this.interaction.tool)
    ) {
      this.creationStyleCapture = { ...this.kernel.getState().creationStyle };
    }
    if (this.pointers.size === 2) {
      // Two-finger pinch is navigation: cancel any in-flight gesture first so
      // a pinch can never arm or continue a creation session.
      this.cancelGesture();
      const [first, second] = [...this.pointers.values()];
      if (first && second)
        this.pinch = {
          distance: distance(first, second),
          midpoint: midpoint(first, second),
          viewport: this.viewport,
        };
      return;
    }
    const currentState = this.kernel.getState();
    const worldPoint = screenToWorld(input.point, this.viewport);
    const authored = this.kernel.getDocument();
    const page = authored.pages[currentState.currentPageId];
    const root = currentState.isolationRootId ? authored.nodes[currentState.isolationRootId] : undefined;
    if (root && (worldPoint.x < root.bounds.x || worldPoint.y < root.bounds.y || worldPoint.x > root.bounds.x + root.bounds.width || worldPoint.y > root.bounds.y + root.bounds.height)) {
      // Isolation is a temporary pointer scope. A miss outside its bounds is
      // the normal top-level click, not a click that leaves the editor trapped.
      this.kernel.exitIsolation();
    }
    if ((input.clickCount ?? 1) >= 2 && page) {
      const deep = documentDeepHitTest(authored, currentState.currentPageId, worldPoint, currentState.isolationRootId);
      let candidate = deep ? authored.nodes[deep]?.parentId : undefined;
      while (candidate) {
        const node = authored.nodes[candidate];
        if (node && (node.kind === "frame" || node.kind === "group") && currentState.selectedIds.includes(node.id)) {
          this.kernel.enterIsolation(node.id);
          if (deep) this.kernel.setSelection([deep]);
          break;
        }
        candidate = node?.parentId ?? undefined;
      }
    }
    this.applyInteraction({
      type: "pointer-down",
      pointerId: input.pointerId,
      point: input.point,
      button: input.button,
      altKey: input.altKey,
      shiftKey: input.shiftKey,
      spaceKey: input.spaceKey,
      ctrlKey: input.ctrlKey ?? false,
      ...(input.clickCount !== undefined ? { clickCount: input.clickCount } : {}),
    });
    if (this.interaction.phase === "idle") this.ignoredPointers.add(input.pointerId);
  }

  handlePointerMove(
    pointerId: number,
    point: Point,
    modifiers?: { altKey: boolean; shiftKey: boolean; ctrlKey: boolean },
  ): void {
    if (this.ignoredPointers.has(pointerId)) return;
    this.cancelCameraAnimation();
    this.lastPointerPoint = point;
    this.lastPointerModifiers = {
      altKey: modifiers?.altKey ?? false,
      shiftKey: modifiers?.shiftKey ?? false,
      ctrlKey: modifiers?.ctrlKey ?? false,
    };
    if (this.pointers.has(pointerId)) this.pointers.set(pointerId, point);
    const pinch = this.pinch;
    if (pinch && this.pointers.size >= 2) {
      const [first, second] = [...this.pointers.values()];
      if (!first || !second || pinch.distance <= 0) return;
      const mid = midpoint(first, second);
      const span = distance(first, second);
      this.cameraFresh = false;
      const transformed = zoomAt(
        pinch.viewport,
        pinch.midpoint,
        span / pinch.distance,
      );
      this.kernel.setViewport({
        ...transformed,
        panX: transformed.panX + mid.x - pinch.midpoint.x,
        panY: transformed.panY + mid.y - pinch.midpoint.y,
        devicePixelRatio: this.devicePixelRatio,
      });
      return;
    }
    // The select tool's hover highlight: only in idle (no drag), and never
    // over the pen tool's path-edit surface.
    if (this.interaction.phase === "idle" && this.interaction.tool === "select") {
      this.ensureSceneIndex();
      const hit = this.spatialIndex?.query(screenToWorld(point, this.viewport));
      this.kernel.setHovered(hit);
    }
    this.applyInteraction({
      type: "pointer-move",
      pointerId,
      point,
      button: 0,
      altKey: modifiers?.altKey ?? false,
      shiftKey: modifiers?.shiftKey ?? false,
      spaceKey: false,
      ctrlKey: modifiers?.ctrlKey ?? false,
    });
  }

  handlePointerUp(
    pointerId: number,
    point: Point,
    options: { cancel: boolean; shiftKey: boolean; clickCount?: number },
  ): void {
    if (this.ignoredPointers.delete(pointerId)) {
      this.pointers.delete(pointerId);
      return;
    }
    this.cancelCameraAnimation();
    this.applyInteraction({
      type: options.cancel ? "pointer-cancel" : "pointer-up",
      pointerId,
      point,
      button: 0,
      altKey: false,
      shiftKey: options.shiftKey,
      spaceKey: false,
      clickCount: options.clickCount ?? 1,
    });
    this.pointers.delete(pointerId);
    if (this.pointers.size < 2) this.pinch = undefined;
  }

  /** The pointer left the canvas: the idle pen cursor dot and the move snap
   *  guides must not freeze at their last position. */
  handlePointerLeave(): void {
    this.cancelCameraAnimation();
    this.kernel.setHovered(undefined);
    if (!this.penPreview && !this.moveSnapGuides && !this.snapChoices && !this.creationStartSnapChoices) return;
    this.penPreview = undefined;
    this.moveSnapGuides = undefined;
    this.snapChoices = undefined;
    this.creationStartSnapChoices = undefined;
    this.emit();
  }

  isPinching(): boolean {
    return this.pinch !== undefined;
  }

  /**
   * Keeps the world origin centred in the viewport while the camera is still
   * unpositioned: nobody has panned, zoomed or pinched since the view was
   * established, and the restored camera is the default rest (0,0,1). The
   * canvas stage calls this with its measured size; it is a no-op (no emit)
   * once the camera is centred or the user has taken it.
   */
  centerOrigin(width: number, height: number): void {
    if (!this.cameraFresh || width <= 0 || height <= 0) return;
    const panX = width / 2;
    const panY = height / 2;
    const current = this.viewport;
    if (current.panX === panX && current.panY === panY) return;
    this.kernel.setViewport({
      ...current,
      panX,
      panY,
      devicePixelRatio: this.devicePixelRatio,
    });
  }

  scrollPan(dx: number, dy: number): void {
    this.cancelCameraAnimation();
    this.cameraFresh = false;
    const current = this.viewport;
    this.kernel.setViewport({
      ...current,
      panX: current.panX + dx,
      panY: current.panY + dy,
      devicePixelRatio: this.devicePixelRatio,
    });
    // A scroll cancels an in-progress drag — but never a PEN session: the
    // session's transaction spans navigation and its points are
    // world-anchored, so panning mid-path is legal (the session's close
    // owns the transaction).
    if (this.transactionArmed && !this.penSession) {
      this.kernel.rollback();
      this.transactionArmed = false;
    }
    this.interaction = initialInteractionState(this.interaction.tool);
    this.kernel.setInteraction(this.interaction);
    this.panStart = undefined;
    this.moveStart = undefined;
    this.moveSnapGuides = undefined;
    this.snapChoices = undefined;
    this.creationStartSnapChoices = undefined;
    this.moveSnapStart = undefined;
    this.draftBounds = undefined;
    this.persistRestCamera();
    this.emit();
  }

  handleWheel(
    point: Point,
    deltaY: number,
    options: { ctrlKey?: boolean; metaKey?: boolean } = {},
  ): void {
    this.cancelCameraAnimation();
    const factor = Math.min(1.25, Math.max(0.8, Math.exp(-deltaY * 0.001)));
    this.applyInteraction({
      type: "wheel",
      point,
      deltaY,
      ctrlKey: options.ctrlKey ?? false,
      metaKey: options.metaKey ?? false,
      factor,
    });
    // Wheel zoom is a settled viewport the moment it lands — persist the
    // rest camera (the wheel input leaves the interaction idle).
    this.persistRestCamera();
  }

  zoomBy(factor: number, point: Point): void {
    this.cancelCameraAnimation();
    this.applyInteraction({
      type: "wheel",
      point,
      deltaY: 0,
      ctrlKey: false,
      metaKey: false,
      factor,
    });
    this.persistRestCamera();
  }

  /**
   * Absolute zoom for presets (100%, 200%, a typed value): anchors the world
   * point under `point` and sets the zoom exactly, clamped to the kernel's
   * window. Relative zooming cannot reach a preset in one step — `zoomAt`
   * clamps the per-step factor — so this is the menu's path, mirroring the
   * `scrollPan` bookkeeping (camera taken, gesture cancelled, viewport synced).
   */
  setZoom(zoom: number, point: Point): void {
    this.cancelCameraAnimation();
    this.cameraFresh = false;
    this.kernel.setViewport({
      ...zoomTo(this.viewport, point, zoom),
      devicePixelRatio: this.devicePixelRatio,
    });
    // Same pen-session rule as scrollPan: a preset zoom must not cancel an
    // in-progress path — its transaction spans navigation.
    if (this.transactionArmed && !this.penSession) {
      this.kernel.rollback();
      this.transactionArmed = false;
    }
    this.interaction = initialInteractionState(this.interaction.tool);
    this.kernel.setInteraction(this.interaction);
    this.panStart = undefined;
    this.moveStart = undefined;
    this.moveSnapGuides = undefined;
    this.snapChoices = undefined;
    this.creationStartSnapChoices = undefined;
    this.moveSnapStart = undefined;
    this.draftBounds = undefined;
    this.persistRestCamera();
    this.emit();
  }

  /** Frames the whole page's visible content in the viewport, with a
   *  screen-constant margin — the ⇧1 jump (and the Back-to-Content anchor).
   *  The jump animates briefly (easeInOutCubic) and cancels instantly on any
   *  input — the user is always in charge of the camera. */
  zoomToFit(): void {
    const { document, state } = this.kernel.getProjection();
    const pageId = state.currentPageId;
    const ids: DocumentId[] = [];
    const visit = (id: DocumentId): void => {
      const node = document.nodes[id];
      if (!node || !node.visible) return;
      if (node.kind !== "page-root") ids.push(id);
      for (const childId of node.childIds) visit(childId);
    };
    visit(document.pages[pageId]?.rootId ?? "");
    this.frameWorldBounds(pageId, ids, 48, true);
  }

  /** Frames the selection — the ⇧2 jump. */
  zoomToSelection(): void {
    const { state } = this.kernel.getProjection();
    this.frameWorldBounds(state.currentPageId, state.selectedIds, 48, true);
  }

  /** Sets the viewport so the named nodes' world union fills it (clamped to
   *  the kernel's zoom window), keeping the union centred. No-op on empty
   *  bounds; the live camera is ephemeral, so this is not a history entry.
   *  Animated by default — `animate: false` jumps instantly. */
  private frameWorldBounds(pageId: DocumentId, ids: DocumentId[], marginPx: number, animate = false): void {
    const { document } = this.kernel.getProjection();
    const union = unionWorldBounds(document, pageId, ids);
    if (!union || union.width <= 0 || union.height <= 0) return;
    const canvas = this.canvasSize();
    const width = Math.max(canvas.width - marginPx * 2, 1);
    const height = Math.max(canvas.height - marginPx * 2, 1);
    const zoom = Math.min(width / union.width, height / union.height);
    const next = {
      ...zoomTo(
        this.viewport,
        { x: canvas.width / 2, y: canvas.height / 2 },
        zoom,
      ),
      panX: canvas.width / 2 - (union.x + union.width / 2) * zoom,
      panY: canvas.height / 2 - (union.y + union.height / 2) * zoom,
      devicePixelRatio: this.devicePixelRatio,
    };
    this.cameraFresh = false;
    if (animate) {
      this.animateCamera(next);
    } else {
      this.cancelCameraAnimation();
      this.kernel.setViewport(next);
      if (this.transactionArmed && !this.penSession) {
        this.kernel.rollback();
        this.transactionArmed = false;
      }
      this.persistRestCamera();
      this.emit();
    }
  }

  /** The camera animation: a short easeInOutCubic interpolation of the
   *  viewport, cancelled by ANY user input (every input handler calls
   *  `cancelCameraAnimation` first — the user always preempts). Without
   *  requestAnimationFrame (tests, prerendering) it jumps instantly. */
  private animateCamera(to: { panX: number; panY: number; zoom: number }): void {
    this.cancelCameraAnimation();
    if (typeof requestAnimationFrame !== "function") {
      this.kernel.setViewport({ ...to, devicePixelRatio: this.devicePixelRatio });
      this.persistRestCamera();
      this.emit();
      return;
    }
    const from = this.viewport;
    const duration = 220;
    const start = performance.now();
    const easeInOutCubic = (t: number): number =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const tick = (now: number): void => {
      if (this.cameraAnim?.start !== start) return;
      const t = Math.min(1, (now - start) / duration);
      const eased = easeInOutCubic(t);
      this.kernel.setViewport({
        panX: from.panX + (to.panX - from.panX) * eased,
        panY: from.panY + (to.panY - from.panY) * eased,
        zoom: from.zoom + (to.zoom - from.zoom) * eased,
        devicePixelRatio: this.devicePixelRatio,
      });
      this.emit();
      if (t < 1) {
        this.cameraAnim!.raf = requestAnimationFrame(tick);
      } else {
        this.cameraAnim = undefined;
        this.persistRestCamera();
      }
    };
    this.cameraAnim = { start, raf: requestAnimationFrame(tick) };
  }

  /** Any user input preempts the camera animation — see the pointer, wheel
   *  and zoom handlers. */
  private cancelCameraAnimation(): void {
    if (!this.cameraAnim) return;
    cancelAnimationFrame(this.cameraAnim.raf);
    this.cameraAnim = undefined;
  }

  private canvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  /** The stage reports the canvas rect (on resize and each draw) — the
   *  zoom-to-fit math's viewport. Never read during render. */
  setCanvasSize(width: number, height: number, pixelRatio = 1): void {
    if (width <= 0 || height <= 0) return;
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.canvasPixelRatio = pixelRatio;
  }

  /** Nudges the selection by a WORLD delta — arrows 1px, ⇧-arrows 10px.
   *  Nudging deliberately never snaps (the industry rule: nudge is raw
   *  placement, big-nudge is the grid step). One history entry per press. */
  nudgeSelection(dx: number, dy: number): void {
    const { document, state } = this.kernel.getProjection();
    const selectedIds = state.selectedIds;
    if (selectedIds.length === 0) return;
    const selected = new Set(selectedIds);
    const targets = selectedIds.filter((id) => {
      let ancestor = document.nodes[id]?.parentId;
      while (ancestor) {
        if (selected.has(ancestor)) return false;
        ancestor = document.nodes[ancestor]?.parentId ?? null;
      }
      return true;
    });
    if (targets.length === 0) return;
    this.kernel.dispatch({ type: "move-nodes", nodeIds: targets, delta: { dx, dy } }, "Nudge layer");
    this.emit();
  }

  /** ⌘D: duplicates the selection by the LAST ALT-DRAG's delta — "smart
   *  duplicate" — so pattern arrays repeat the last offset. A fresh editor
   *  offsets 10px on each axis. */
  duplicateSmart(): void {
    const offset = { ...this.lastDuplicateOffset };
    this.kernel.duplicateSelection(offset);
  }

  /** Boolean ops: the kernel's winding-number engine over the selection.
   *  Two or more selected paths; the command validates and names its own
   *  preconditions (mixed kinds, missing paths). The result node is minted
   *  by the command, so the selection is handed to the surviving path node
   *  that replaced the operands. */
  booleanOperate(operation: "union" | "intersect" | "subtract" | "exclude"): void {
    const { document, state } = this.kernel.getProjection();
    const nodeIds = state.selectedIds.filter((id) => document.nodes[id]?.kind === "path");
    if (nodeIds.length < 2) return;
    this.kernel.dispatch(
      { type: "boolean-operate", nodeIds, operation },
      `Boolean ${operation}`,
    );
    const next = this.kernel.getProjection().document;
    const parentId = document.nodes[nodeIds[0]!]?.parentId;
    const operands = new Set(nodeIds);
    const result = parentId
      ? next.nodes[parentId]?.childIds
          .map((id) => next.nodes[id])
          .find(
            (node) =>
              node &&
              node.kind === "path" &&
              !operands.has(node.id) &&
              node.parentId === parentId,
          )
      : undefined;
    if (result) this.kernel.setSelection([result.id]);
  }

  /** The active page's canvas — the guides' home. */
  private currentCanvas(): PageCanvas | undefined {
    const { document, state } = this.kernel.getProjection();
    return document.pages[state.currentPageId]?.canvas;
  }

  /** Adds a guide at a world position — one history entry. Returns the
   *  minted id so a follow-up drag can move it. */
  addGuide(axis: "x" | "y", position: number): DocumentId {
    const { state } = this.kernel.getProjection();
    const id = makeId("guide");
    this.kernel.dispatch(
      {
        type: "add-guide",
        pageId: state.currentPageId,
        guide: { id, axis, position, visible: true },
      },
      "Add guide",
    );
    return id;
  }

  moveGuide(guideId: DocumentId, position: number): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const guide = canvas.guides.find((entry) => entry.id === guideId);
    if (!guide || guide.position === position) return;
    this.kernel.dispatch(
      { type: "move-guide", pageId: this.kernel.getState().currentPageId, guideId, position },
      "Move guide",
    );
  }

  /** The guide-drag gesture: begin → preview → commit is ONE history entry
   *  (the strip drags across many pointer-moves). A fresh guide is previewed
   *  INTO the transaction (its id returned for the follow-up drags); an
   *  existing guide is dragged from its current position. A cancelled
   *  gesture rolls the whole thing back — a cancelled creation leaves
   *  nothing behind. */
  beginGuideDrag(axis: "x" | "y", position: number, existingId?: DocumentId): DocumentId {
    const pageId = this.kernel.getState().currentPageId;
    if (!this.transactionArmed) {
      this.kernel.beginTransaction(existingId ? "Move guide" : "Add guide");
      this.transactionArmed = true;
    }
    const guideId = existingId ?? makeId("guide");
    this.kernel.preview(
      existingId
        ? { type: "move-guide", pageId, guideId, position }
        : { type: "add-guide", pageId, guide: { id: guideId, axis, position, visible: true } },
    );
    return guideId;
  }

  previewGuideDrag(guideId: DocumentId, position: number): void {
    if (!this.transactionArmed) return;
    this.kernel.preview({
      type: "move-guide",
      pageId: this.kernel.getState().currentPageId,
      guideId,
      position,
    });
  }

  commitGuideDrag(cancelled: boolean): void {
    if (!this.transactionArmed) return;
    if (cancelled) this.kernel.rollback();
    else this.kernel.commit();
    this.transactionArmed = false;
    this.emit();
  }

  removeGuide(guideId: DocumentId): void {
    this.kernel.dispatch(
      { type: "remove-guide", pageId: this.kernel.getState().currentPageId, guideId },
      "Remove guide",
    );
  }

  /** The per-page snap toggles — the SnapSettings surface's command. */
  setSnapSetting(setting: "grid" | "guides" | "objects" | "pixel", enabled: boolean): void {
    const { document, state } = this.kernel.getProjection();
    const page = document.pages[state.currentPageId];
    if (!page) return;
    this.kernel.dispatch(
      { type: "set-snap-settings", pageId: state.currentPageId, snap: { ...page.canvas.snap, [setting]: enabled } },
      enabled ? `Snap: ${setting} on` : `Snap: ${setting} off`,
    );
  }

  // -- Hierarchy traversal (Enter / Esc / Tab laddering) --------------------

  /** Enter: step INTO the selected container — select its first child. */
  selectFirstChild(): void {
    const { document, state } = this.kernel.getProjection();
    const id = state.selectedIds[0];
    if (!id) return;
    const node = document.nodes[id];
    if (!node || node.childIds.length === 0) return;
    const first = node.childIds[0]!;
    this.kernel.setSelection([first]);
    this.emit();
  }

  /** Esc: ladder OUT — select the selected node's parent (skipping the page
   *  root), or clear the selection when already at the top. */
  selectParent(): boolean {
    const { document, state } = this.kernel.getProjection();
    const id = state.selectedIds[0];
    if (!id) return false;
    const node = document.nodes[id];
    const parent = node?.parentId ? document.nodes[node.parentId] : undefined;
    if (!parent || parent.kind === "page-root") return false;
    this.kernel.setSelection([parent.id]);
    this.emit();
    return true;
  }

  /** Tab: cycle to the next sibling of the selected node. */
  selectNextSibling(): void {
    const { document, state } = this.kernel.getProjection();
    const id = state.selectedIds[0];
    if (!id) return;
    const node = document.nodes[id];
    const parent = node?.parentId ? document.nodes[node.parentId] : undefined;
    if (!node || !parent) return;
    const index = parent.childIds.indexOf(id);
    const next = parent.childIds[(index + 1) % parent.childIds.length];
    if (!next) return;
    this.kernel.setSelection([next]);
    this.emit();
  }

  cancelGesture(): void {
    if (this.transactionArmed) {
      this.kernel.rollback();
      this.transactionArmed = false;
    }
    this.interaction = initialInteractionState(this.interaction.tool);
    this.kernel.setInteraction(this.interaction);
    this.panStart = undefined;
    this.moveStart = undefined;
    this.moveSnapGuides = undefined;
    this.snapChoices = undefined;
    this.creationStartSnapChoices = undefined;
    this.moveSnapStart = undefined;
    this.pinch = undefined;
    this.draftBounds = undefined;
    this.creationStyleCapture = undefined;
    this.projectionCache = undefined;
    this.emit();
  }

  /** The live viewport is ephemeral; the page's REST camera is authored
   *  bookkeeping, never a history entry. A settled viewport (a pan/zoom
   *  gesture ended) writes the rest camera so a reload restores the zoom
   *  and coordinate focus. The kernel rejects the write mid-gesture, so the
   *  interaction normalizes to idle first — the same normalization scrollPan
   *  and setZoom perform. A pen session's open transaction forbids the write
   *  entirely (its close persists instead). */
  private persistRestCamera(): void {
    if (this.penSession || this.transactionArmed) return;
    const state = this.kernel.getState();
    const pageId = state.currentPageId;
    const rest = this.kernel.getDocument().pages[pageId]?.canvas.rest;
    if (!rest) return;
    if (
      rest.panX === this.viewport.panX &&
      rest.panY === this.viewport.panY &&
      rest.zoom === this.viewport.zoom
    )
      return;
    if (state.interaction.phase !== "idle") {
      this.interaction = initialInteractionState(this.interaction.tool);
      this.kernel.setInteraction(this.interaction);
    }
    this.kernel.dispatch({
      type: "set-page-viewport",
      pageId,
      viewport: {
        panX: this.viewport.panX,
        panY: this.viewport.panY,
        zoom: this.viewport.zoom,
      },
    });
  }

  /** Ends the pen session (Escape): the path drawn so far lands as ONE
   *  history entry; a session with fewer than two points is discarded. */
  endPenSession(): void {
    this.commitPenSession(false);
    this.emit();
  }

  /** True while a pen path is in progress (for the keyboard surface). */
  hasPenSession(): boolean {
    return this.penSession !== undefined;
  }

  // -- Internals -----------------------------------------------------------

  // -- Projection helpers (ephemeral overlay data, never authored) ---------

  /** The selected nodes' box for the selection overlay. A single selection
   *  carries its LOCAL bounds with the composed WORLD transform (the box
   *  follows rotation and scale, like Figma's); a multi-selection carries
   *  the union of the world axis-aligned boxes with the identity transform.
   *  The composition mirrors the kernel's authoritative walk (bounds carry
   *  the placement, the transform is the extra affine). */
  private projectSelectionBox(
    document: EditorDocument,
    pageId: DocumentId,
    selectedIds: readonly string[],
  ): { bounds: Bounds; transform: Transform2D; cornerRadius?: number } | undefined {
    if (selectedIds.length === 0) return undefined;
    const page = document.pages[pageId];
    if (!page) return undefined;
    const composeWorld = (
      node: EditorDocument["nodes"][string],
    ): Transform2D => {
      const position = {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: node.bounds.x,
        f: node.bounds.y,
      };
      return multiplyTransforms(position, node.transform);
    };
    if (selectedIds.length === 1) {
      const wanted = selectedIds[0];
      let found: { bounds: Bounds; transform: Transform2D } | undefined;
      const walk = (parentId: DocumentId, parentWorld: Transform2D): void => {
        if (found) return;
        const parent = document.nodes[parentId];
        if (!parent || !parent.visible || parent.locked) return;
        for (const childId of parent.childIds) {
          const node = document.nodes[childId];
          if (!node || !node.visible || node.locked) continue;
          const world = multiplyTransforms(parentWorld, composeWorld(node));
          if (childId === wanted) {
            // The box is the node's LOCAL space: the placement rides the
            // world transform (e/f carry bounds.x/y), so the local box is
            // anchored at the origin — drawing the authored bounds here
            // would place it twice.
            found = {
              bounds: {
                x: 0,
                y: 0,
                width: node.bounds.width,
                height: node.bounds.height,
              },
              transform: world,
              ...(node.kind === "rectangle" || node.kind === "frame" ? { cornerRadius: node.cornerRadius } : {}),
            };
            return;
          }
          walk(childId, world);
        }
      };
      walk(page.rootId, identityTransform());
      return found;
    }
    const wanted = new Set(selectedIds);
    let union: Bounds | undefined;
    const walk = (parentId: DocumentId, parentWorld: Transform2D): void => {
      const parent = document.nodes[parentId];
      if (!parent || !parent.visible || parent.locked) return;
      for (const childId of parent.childIds) {
        const node = document.nodes[childId];
        if (!node || !node.visible || node.locked) continue;
        const world = multiplyTransforms(parentWorld, composeWorld(node));
        if (wanted.has(childId)) {
          const box = transformBounds(
            {
              x: 0,
              y: 0,
              width: node.bounds.width,
              height: node.bounds.height,
            },
            world,
          );
          union = union
            ? {
                x: Math.min(union.x, box.x),
                y: Math.min(union.y, box.y),
                width:
                  Math.max(union.x + union.width, box.x + box.width) -
                  Math.min(union.x, box.x),
                height:
                  Math.max(union.y + union.height, box.y + box.height) -
                  Math.min(union.y, box.y),
              }
            : box;
        }
        walk(childId, world);
      }
    };
    walk(page.rootId, identityTransform());
    return union
      ? { bounds: union, transform: identityTransform() }
      : undefined;
  }

  /** The selected points' world anchors and resolved handle endpoints, across
   *  every path on the active page — the node tool's grippy overlay data. */
  private projectSelectedGrippies(
    document: EditorDocument,
    pageId: DocumentId,
    selectedPointIds: readonly string[],
  ): SelectedPointGrippy[] {
    if (selectedPointIds.length === 0) return [];
    const selected = new Set(selectedPointIds);
    const grippies: SelectedPointGrippy[] = [];
    const visit = (id: string, parentWorld: Transform2D): void => {
      const node = document.nodes[id];
      if (!node) return;
      // Bounds carry the placement, the transform is the extra affine — the
      // same composition the kernel's hit tests use (interaction.ts).
      const position = {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: node.bounds.x,
        f: node.bounds.y,
      };
      const world = multiplyTransforms(
        parentWorld,
        multiplyTransforms(position, node.transform),
      );
      if (node.kind === "path" && node.path) {
        const resolved = resolveAutoHandles(node.path);
        for (const point of Object.values(resolved.points)) {
          if (!selected.has(point.id)) continue;
          const anchor = transformPoint({ x: point.x, y: point.y }, world);
          grippies.push({
            x: anchor.x,
            y: anchor.y,
            ...(point.handleIn !== undefined
              ? { handleIn: this.toWorldHandle(point.handleIn, world, anchor) }
              : {}),
            ...(point.handleOut !== undefined
              ? {
                  handleOut: this.toWorldHandle(point.handleOut, world, anchor),
                }
              : {}),
          });
        }
      }
      for (const childId of node.childIds) visit(childId, world);
    };
    const page = document.pages[pageId];
    if (page) visit(page.rootId, identityTransform());
    return grippies;
  }

  /** A node-local handle delta → world endpoint: the anchor's world position
   *  plus the delta under the transform's linear part (deltas are vectors —
   *  the translation must not apply twice). */
  private toWorldHandle(
    handle: PathHandle,
    world: Transform2D,
    anchor: Point,
  ): Point {
    return {
      x: anchor.x + world.a * handle.dx + world.c * handle.dy,
      y: anchor.y + world.b * handle.dx + world.d * handle.dy,
    };
  }

  /** The in-progress pen session's anchors — stored world points, returned
   *  directly (never re-converted: the viewport may have moved since the
   *  point was dropped, and the anchor must stay where it was dropped). */
  private projectPenSession(): PenSessionWorldPoint[] {
    const session = this.penSession;
    if (!session) return [];
    return session.points.map((entry) => ({
      x: entry.x,
      y: entry.y,
      ...(entry.handle ? { handle: entry.handle } : {}),
    }));
  }

  /** The pen tool's pending anchor and pulled handle in world coordinates. */
  private projectPenPreview(): PenPreviewWorldPoint | undefined {
    const preview = this.penPreview;
    if (!preview) return undefined;
    return {
      point: { x: preview.point.x, y: preview.point.y },
      ...(preview.handle ? { handle: { x: preview.handle.x, y: preview.handle.y } } : {}),
      ...(preview.snap ? { snap: preview.snap } : {}),
    };
  }

  private emit(): void {
    this.emissionPending = true;
    this.projectionCache = undefined;
    if (this.emissionBatchDepth > 0 || this.emissionDraining) return;
    this.emissionDraining = true;
    try {
      let passes = 0;
      while (this.emissionPending) {
        passes += 1;
        if (passes > EMISSION_DRAIN_LIMIT) {
          this.emissionPending = false;
          throw new Error("EDITOR_EMISSION_DRAIN_LIMIT");
        }
        this.emissionPending = false;
        this.renderRevision += 1;
        this.projectionCache = undefined;
        for (const listener of this.listeners) listener();
      }
    } finally {
      this.emissionDraining = false;
    }
  }

  private syncPageContext(): void {
    const state = this.kernel.getState();
    const nextFrameId = state.currentPageId.replace(/^page-/u, "");
    const pageChanged = nextFrameId !== this.frameId;
    this.frameId = nextFrameId;
    if (pageChanged) {
      // A page whose restored camera is the unpositioned default (0,0,1) is
      // fresh again: the canvas stage will centre the world origin until the
      // user takes the camera. Same-page undo/redo never touch freshness —
      // the kernel preserves the viewport and so do we.
      this.cameraFresh =
        state.viewport.panX === 0 &&
        state.viewport.panY === 0 &&
        state.viewport.zoom === 1;
    }
    this.sceneCache = undefined;
    this.spatialIndex = undefined;
    this.projectionCache = undefined;
    this.emit();
  }

  // -- Snap service (kernel-facing, screen-in/screen-out) --------------------

  /** The active page's authored snap settings and targets. */
  private snapPage(): { grid?: GridDescriptor; guides?: GuideRecord[]; snap: SnapSettings } {
    const { document, state } = this.kernel.getProjection();
    const page = document.pages[state.currentPageId];
    return page
      ? { grid: page.canvas.grid, guides: page.canvas.guides, snap: page.canvas.snap }
      : { snap: { grid: false, guides: false, objects: false, pixel: false } };
  }

  /** The pen session's anchors as per-axis magnets, so a new anchor aligns
   *  with the path being drawn. */
  private snapMagnets(): { x: number[]; y: number[] } | undefined {
    const session = this.penSession;
    if (!session || session.points.length === 0) return undefined;
    return {
      x: session.points.map((point) => point.x),
      y: session.points.map((point) => point.y),
    };
  }

  /** The full snap options for the active page — exactOptionalPropertyTypes
   *  forbids explicit undefined, so only present targets are spread. */
  private snapTargets(
    objects: SnapObjectPositions,
    magnets: { x: number[]; y: number[] } | undefined,
  ): SnapTargetsOptions {
    const page = this.snapPage();
    return {
      zoom: this.viewport.zoom,
      gridOpacity: this.acceptedGridOpacity(),
      snap: page.snap,
      objects,
      ...(magnets !== undefined ? { magnets } : {}),
      ...(page.grid ? { grid: page.grid } : {}),
      ...(page.guides ? { guides: page.guides } : {}),
    };
  }

  private snapPenPointScreen(point: Point): { point: Point; snap: PenSnapPayload | undefined } {
    const { document, state } = this.kernel.getProjection();
    const result = snapPenPoint(
      document,
      state.currentPageId,
      screenToWorld(point, this.viewport),
      this.snapTargets(objectSnapPositions(document, state.currentPageId), this.snapMagnets()),
    );
    return { point: worldToScreen(result.point, this.viewport), snap: result.snap };
  }

  private snapCornerPointScreen(point: Point): { point: Point; choices: SnapChoicesPayload } {
    const { document, state } = this.kernel.getProjection();
    const snapped = snapCornerDecision(
      screenToWorld(point, this.viewport),
      this.snapTargets(objectSnapPositions(document, state.currentPageId), this.snapMagnets()),
    );
    return { point: worldToScreen(snapped.point, this.viewport), choices: snapped.choices };
  }

  private snapMoveDeltaScreen(
    delta: Point,
    nodeIds: DocumentId[],
    resizeHandle: ResizeHandle | undefined,
    bypass: boolean,
    modifiers: { shiftKey: boolean; altKey: boolean },
  ): { delta: Point; guides: SnapGuidesPayload; choices: SnapChoicesPayload } {
    // The ⌘-held-while-dragging escape hatch: snapping is temporarily
    // bypassed so the drag lands exactly where the cursor is — the escape
    // that makes strong snapping tolerable (every mature tool has it).
    const { document, state } = this.kernel.getProjection();
    const pageId = state.currentPageId;
    const key = nodeIds.join("|");
    // The reference box is the selection's PRE-drag world box — the kernel
    // document is still un-previewed on the first call, so capture it once
    // per gesture (the cumulative delta is relative to it).
    if (!this.moveSnapStart || this.moveSnapStart.key !== key) {
      const bounds = unionWorldBounds(document, pageId, nodeIds);
      if (!bounds) return { delta, guides: {}, choices: {} };
      const node = resizeHandle && nodeIds.length === 1 ? document.nodes[nodeIds[0]!] : undefined;
      this.moveSnapStart = {
        key,
        bounds,
        ...(node
          ? {
              resize: {
                bounds: { ...node.bounds },
                transform: this.worldTransformOf(node.id),
              },
            }
          : {}),
      };
    }
    if (bypass) return { delta, guides: {}, choices: {} };
    const worldDelta = { x: delta.x / this.viewport.zoom, y: delta.y / this.viewport.zoom };
    const magnets = this.snapMagnets();
    const page = this.snapPage();
    // An alt-drag duplicate excludes BOTH the originals and their copies
    // from the snap-target set — the copies share the originals' positions
    // and would otherwise snap straight back onto them.
    const exclude = new Set(nodeIds);
    if (this.duplicateDragMap) {
      for (const copy of this.duplicateDragMap.values()) exclude.add(copy);
    }
    if (resizeHandle && nodeIds.length === 1 && this.moveSnapStart.resize) {
      const nodeId = nodeIds[0]!;
      const start = this.moveSnapStart.resize;
      const xSource = resizeHandle.includes("w") ? "left" as const : resizeHandle.includes("e") ? "right" as const : "center-x" as const;
      const ySource = resizeHandle.includes("n") ? "top" as const : resizeHandle.includes("s") ? "bottom" as const : "center-y" as const;
      const finalFeature = (candidateDelta: Point): Point => {
        const bounds = projectConstrainedResize(start.bounds, resizeHandle, candidateDelta, start.transform, {
          constrainAspect: modifiers.shiftKey,
          fromCenter: modifiers.altKey,
          minSize: MIN_LAYER_SIZE,
        });
        const transform = this.worldTransformOf(nodeId, bounds);
        return transformPoint(
          {
            x: resizeHandle.includes("w") ? 0 : resizeHandle.includes("e") ? bounds.width : bounds.width / 2,
            y: resizeHandle.includes("n") ? 0 : resizeHandle.includes("s") ? bounds.height : bounds.height / 2,
          },
          transform,
        );
      };
      const rawFeature = finalFeature(worldDelta);
      const decision = snapCornerDecision(rawFeature, {
        zoom: this.viewport.zoom,
        gridOpacity: this.acceptedGridOpacity(),
        snap: { ...page.snap, pixel: false },
        objects: objectSnapPositions(document, pageId, exclude),
        ...(magnets ? { magnets } : {}),
        ...(page.grid ? { grid: page.grid } : {}),
        ...(page.guides ? { guides: page.guides } : {}),
      });
      // Resize constraints can amplify or couple cursor axes (Alt doubles a
      // handle's travel; Shift couples width and height). Derive the local
      // linear response from the same final-feature projection instead of
      // assuming a one-to-one world correction.
      const probe = 1e-4;
      const probeX = finalFeature({ x: worldDelta.x + probe, y: worldDelta.y });
      const probeY = finalFeature({ x: worldDelta.x, y: worldDelta.y + probe });
      const probeBackX = finalFeature({ x: worldDelta.x - probe, y: worldDelta.y });
      const probeBackY = finalFeature({ x: worldDelta.x, y: worldDelta.y - probe });
      const columns = [
        { x: { x: (probeX.x - rawFeature.x) / probe, y: (probeX.y - rawFeature.y) / probe }, y: { x: (probeY.x - rawFeature.x) / probe, y: (probeY.y - rawFeature.y) / probe } },
        { x: { x: (rawFeature.x - probeBackX.x) / probe, y: (rawFeature.y - probeBackX.y) / probe }, y: { x: (probeY.x - rawFeature.x) / probe, y: (probeY.y - rawFeature.y) / probe } },
        { x: { x: (probeX.x - rawFeature.x) / probe, y: (probeX.y - rawFeature.y) / probe }, y: { x: (rawFeature.x - probeBackY.x) / probe, y: (rawFeature.y - probeBackY.y) / probe } },
        { x: { x: (rawFeature.x - probeBackX.x) / probe, y: (rawFeature.y - probeBackX.y) / probe }, y: { x: (rawFeature.x - probeBackY.x) / probe, y: (rawFeature.y - probeBackY.y) / probe } },
      ];
      const useX = decision.choices.x !== undefined;
      const useY = decision.choices.y !== undefined;
      const corrections: Point[] = [];
      for (const column of columns) {
        const j = { a: column.x.x, b: column.y.x, c: column.x.y, d: column.y.y };
        const det = j.a * j.d - j.b * j.c;
        if (useX && useY && Math.abs(det) > 1e-12) {
          corrections.push({
            x: worldDelta.x + (j.d * (decision.point.x - rawFeature.x) - j.b * (decision.point.y - rawFeature.y)) / det,
            y: worldDelta.y + (-j.c * (decision.point.x - rawFeature.x) + j.a * (decision.point.y - rawFeature.y)) / det,
          });
        } else if (useX && !useY) {
          const rowNorm = j.a * j.a + j.b * j.b;
          if (rowNorm > 1e-12) corrections.push({ x: worldDelta.x + j.a * (decision.point.x - rawFeature.x) / rowNorm, y: worldDelta.y + j.b * (decision.point.x - rawFeature.x) / rowNorm });
        } else if (useY && !useX) {
          const rowNorm = j.c * j.c + j.d * j.d;
          if (rowNorm > 1e-12) corrections.push({ x: worldDelta.x + j.c * (decision.point.y - rawFeature.y) / rowNorm, y: worldDelta.y + j.d * (decision.point.y - rawFeature.y) / rowNorm });
        } else if (useX && useY) {
          // Rank-one systems have a solution only when one row's
          // minimum-norm correction occupies both requested targets.
          const xNorm = j.a * j.a + j.b * j.b;
          const yNorm = j.c * j.c + j.d * j.d;
          if (xNorm <= 1e-12 && yNorm > 1e-12) {
            corrections.push({ x: worldDelta.x + j.c * (decision.point.y - rawFeature.y) / yNorm, y: worldDelta.y + j.d * (decision.point.y - rawFeature.y) / yNorm });
          } else if (yNorm <= 1e-12 && xNorm > 1e-12) {
            corrections.push({ x: worldDelta.x + j.a * (decision.point.x - rawFeature.x) / xNorm, y: worldDelta.y + j.b * (decision.point.x - rawFeature.x) / xNorm });
          } else if (xNorm > 1e-12) {
            corrections.push({ x: worldDelta.x + j.a * (decision.point.x - rawFeature.x) / xNorm, y: worldDelta.y + j.b * (decision.point.x - rawFeature.x) / xNorm });
          }
        }
      }
      // A target can lie across the aspect-axis or minimum-size branch from
      // the cursor. Re-linearize rejected candidates at their destination;
      // the projection has only the aspect choice and floor branches, so two
      // bounded refinement rounds traverse every possible branch change.
      for (let round = 0; round < 2; round += 1) {
        const seeds = corrections.slice();
        for (const seed of seeds) {
          const feature = finalFeature(seed);
          const px = finalFeature({ x: seed.x + probe, y: seed.y });
          const py = finalFeature({ x: seed.x, y: seed.y + probe });
          const j = {
            a: (px.x - feature.x) / probe,
            b: (py.x - feature.x) / probe,
            c: (px.y - feature.y) / probe,
            d: (py.y - feature.y) / probe,
          };
          const det = j.a * j.d - j.b * j.c;
          if (useX && useY && Math.abs(det) > 1e-12) {
            corrections.push({
              x: seed.x + (j.d * (decision.point.x - feature.x) - j.b * (decision.point.y - feature.y)) / det,
              y: seed.y + (-j.c * (decision.point.x - feature.x) + j.a * (decision.point.y - feature.y)) / det,
            });
          } else if (useX && !useY) {
            const norm = j.a * j.a + j.b * j.b;
            if (norm > 1e-12) corrections.push({ x: seed.x + j.a * (decision.point.x - feature.x) / norm, y: seed.y + j.b * (decision.point.x - feature.x) / norm });
          } else if (useY && !useX) {
            const norm = j.c * j.c + j.d * j.d;
            if (norm > 1e-12) corrections.push({ x: seed.x + j.c * (decision.point.y - feature.y) / norm, y: seed.y + j.d * (decision.point.y - feature.y) / norm });
          }
        }
      }
      // Resize projection is piecewise affine (aspect-axis choice and size
      // floor). Probe both sides of each input axis, then keep only a candidate
      // that the authoritative projection proves occupies every selected row.
      const epsilon = 1e-8;
      const corrected = corrections
        .filter((candidate) => {
          const feature = finalFeature(candidate);
          const xResponsive = columns.some((column) => column.x.x * column.x.x + column.y.x * column.y.x > 1e-12);
          const yResponsive = columns.some((column) => column.x.y * column.x.y + column.y.y * column.y.y > 1e-12);
          return (!useX || !xResponsive || Math.abs(feature.x - decision.point.x) <= epsilon) && (!useY || !yResponsive || Math.abs(feature.y - decision.point.y) <= epsilon);
        })
        .sort((left, right) => Math.hypot(left.x - worldDelta.x, left.y - worldDelta.y) - Math.hypot(right.x - worldDelta.x, right.y - worldDelta.y))[0] ?? worldDelta;
      let occupied = finalFeature(corrected);
      const choices: SnapChoicesPayload = {
        ...(decision.choices.x && Math.abs(occupied.x - decision.choices.x.value) <= epsilon
          ? { x: { ...decision.choices.x, source: xSource } }
          : {}),
        ...(decision.choices.y && Math.abs(occupied.y - decision.choices.y.value) <= epsilon
          ? { y: { ...decision.choices.y, source: ySource } }
          : {}),
      };
      const applied = choices.x || choices.y ? corrected : worldDelta;
      if (applied === worldDelta) occupied = rawFeature;
      return {
        delta: { x: applied.x * this.viewport.zoom, y: applied.y * this.viewport.zoom },
        guides: {
          ...(choices.x ? { x: choices.x.value } : {}),
          ...(choices.y ? { y: choices.y.value } : {}),
        },
        choices,
      };
    }
    const result = snapMove(this.moveSnapStart.bounds, worldDelta, {
      zoom: this.viewport.zoom,
      gridOpacity: this.acceptedGridOpacity(),
      snap: page.snap,
      ...(resizeHandle ? { resizeHandle } : {}),
      objects: objectSnapPositions(document, pageId, exclude),
      ...(magnets ? { magnets } : {}),
      ...(page.grid ? { grid: page.grid } : {}),
      ...(page.guides ? { guides: page.guides } : {}),
    });
    return {
      delta: { x: result.delta.x * this.viewport.zoom, y: result.delta.y * this.viewport.zoom },
      guides: result.guides,
      choices: result.choices,
    };
  }

  private context(): InteractionContext {
    this.ensureSceneIndex();
    const authoredDocument = this.kernel.getDocument();
    const projection = this.kernel.getProjection();
    const document = projection.resolvedDocument;
    const pageId = projection.state.currentPageId;
    // The reducer's pointer points are screen-space; the pen session stores
    // WORLD anchors (they must survive navigation), so the first point is
    // converted back to screen with the CURRENT viewport — the close-tolerance
    // check always compares like-for-like wherever the camera is now.
    const firstPoint = this.penSession?.points[0];
    const selectedIds = this.kernel.getState().selectedIds;
    // The single selection's authored bounds arm the reducer's resize corner
    // test — the same node bounds the harness used to compare against.
    const selectedNode =
      selectedIds.length === 1 ? authoredDocument.nodes[selectedIds[0]!] : undefined;
    return {
      viewport: {
        panX: this.viewport.panX,
        panY: this.viewport.panY,
        zoom: this.viewport.zoom,
        devicePixelRatio: this.devicePixelRatio,
      },
      dragThreshold: DRAG_THRESHOLD,
      hitTest: (point) =>
        this.authoredIdForProjectionId(documentHitTest(document, pageId, screenToWorld(point, this.viewport), projection.state.isolationRootId) ?? ""),
      hitTestDeep: (point) =>
        this.authoredIdForProjectionId(documentDeepHitTest(
          document,
          pageId,
          screenToWorld(point, this.viewport),
          projection.state.isolationRootId,
        ) ?? ""),
      selectedIds,
      canMutateNode: (nodeId) => {
        let node = authoredDocument.nodes[nodeId];
        while (node) {
          if (!node.visible || node.locked) return false;
          node = node.parentId ? authoredDocument.nodes[node.parentId] : undefined;
        }
        return true;
      },
      ...(selectedNode
        ? {
            selectedBounds: {
              x: selectedNode.bounds.x,
              y: selectedNode.bounds.y,
              width: selectedNode.bounds.width,
              height: selectedNode.bounds.height,
            },
          }
        : {}),
      handlePositionsOf: (nodeId) => {
        const box = this.projectSelectionBox(document, pageId, [this.resolvedIdForAuthoredId(nodeId, projection.resolvedScene)]);
        if (!box) return undefined;
        // The eight overlay-drawn handle positions, transformed into WORLD
        // space — under rotation or scale the arm zones follow the drawn
        // handles exactly (transformBounds would give the AABB, wrong).
        const { bounds, transform } = box;
        const w = bounds.width;
        const h = bounds.height;
        const local = [
          { x: 0, y: 0 },
          { x: w / 2, y: 0 },
          { x: w, y: 0 },
          { x: w, y: h / 2 },
          { x: w, y: h },
          { x: w / 2, y: h },
          { x: 0, y: h },
          { x: 0, y: h / 2 },
        ];
        return local.map((point) => transformPoint(point, transform));
      },
      cornerHandlePositionsOf: (nodeId) => {
        const node = authoredDocument.nodes[nodeId];
        if (!node || (node.kind !== "rectangle" && node.kind !== "frame")) return undefined;
        const box = this.projectSelectionBox(document, pageId, [this.resolvedIdForAuthoredId(nodeId, projection.resolvedScene)]);
        if (!box || this.viewport.zoom <= 0) return undefined;
        const inset = Math.max(
          Math.min(node.cornerRadius, Math.min(node.bounds.width, node.bounds.height) / 2),
          Math.min(12 / this.viewport.zoom, Math.min(node.bounds.width, node.bounds.height) / 4),
        );
        return [
          { handle: "nw" as const, point: transformPoint({ x: inset, y: inset }, box.transform) },
          { handle: "ne" as const, point: transformPoint({ x: node.bounds.width - inset, y: inset }, box.transform) },
          { handle: "se" as const, point: transformPoint({ x: node.bounds.width - inset, y: node.bounds.height - inset }, box.transform) },
          { handle: "sw" as const, point: transformPoint({ x: inset, y: node.bounds.height - inset }, box.transform) },
        ];
      },
      selectedPointIds: this.kernel.getState().selectedPointIds,
      ...(firstPoint !== undefined
        ? { penSessionFirstPoint: worldToScreen(firstPoint, this.viewport) }
        : {}),
      pathPointMode: (nodeId, pointId) =>
        authoredDocument.nodes[nodeId]?.path?.points[pointId]?.handleMode,
      hitTestPathPoint: (point, tolerance) =>
        hitTestPathPoint(
          authoredDocument,
          pageId,
          screenToWorld(point, this.viewport),
          tolerance,
        ),
      hitTestPathHandle: (point, tolerance) =>
        hitTestPathHandle(
          authoredDocument,
          pageId,
          screenToWorld(point, this.viewport),
          tolerance,
        ),
      hitTestPathSegment: (point, tolerance) =>
        hitTestPathSegment(
          authoredDocument,
          pageId,
          screenToWorld(point, this.viewport),
          tolerance,
        ),
      hitTestPathEndpoint: (point, tolerance) =>
        hitTestPathEndpoint(
          authoredDocument,
          pageId,
          screenToWorld(point, this.viewport),
          tolerance,
        ),
      snapPenPoint: (point) => this.snapPenPointScreen(point),
      snapCornerPoint: (point) => this.snapCornerPointScreen(point),
      snapMoveDelta: (delta, nodeIds, resizeHandle, bypass, modifiers) =>
        this.snapMoveDeltaScreen(delta, nodeIds, resizeHandle, bypass, modifiers),
    };
  }

  private ensureSceneIndex(): void {
    if (this.spatialIndex) return;
    const { resolvedDocument, documentRevision } = this.kernel.getProjection();
    this.buildScene(resolvedDocument, documentRevision);
  }

  private applyInteraction(input: InteractionInput): void {
    const previous = this.interaction;
    const transition = transitionInteraction(previous, input, this.context());
    this.interaction = transition.state;
    this.kernel.setInteraction(transition.state);
    if (input.type === "wheel" && previous.phase !== "idle") {
      // A scroll during a drag cancels the drag — but never a PEN session:
      // the session's transaction spans navigation, and its points are
      // world-anchored, so panning/zooming mid-path is legal. Clear the
      // in-progress drag's ephemerals (including the pending anchor's
      // half-pulled handle) and keep the session armed.
      if (this.transactionArmed && !this.penSession) {
        this.kernel.rollback();
        this.transactionArmed = false;
      }
      this.panStart = undefined;
      this.moveStart = undefined;
      this.draftBounds = undefined;
      if (this.penSession) this.penPreview = undefined;
    }
    for (const effect of transition.effects) this.applyEffect(effect);
    if (input.type === "pointer-up" || input.type === "pointer-cancel") {
      // A pen SESSION spans clicks and commits at close or Escape; everything
      // else (a point drag, a handle drag) finishes with the gesture.
      if (!this.penSession) this.finishGesture(input.type === "pointer-cancel");
      this.draftBounds = undefined;
    }
    this.emit();
  }

  private finishGesture(cancelled: boolean): void {
    // A pen session owns its transaction: it spans clicks AND navigation, so
    // a gesture finishing in between (a space/alt/middle-drag pan, a hand
    // pan) must not commit or roll the session's transaction back — the
    // session's close does that. The pan itself opens no transaction.
    if (!this.penSession && this.transactionArmed) {
      if (cancelled) this.kernel.rollback();
      else this.kernel.commit();
      this.transactionArmed = false;
    }
    // A committed alt-drag hands the selection to the copies.
    const copies = this.duplicateDragMap;
    if (copies && !cancelled) {
      const ids = [...copies.values()];
      this.kernel.setSelection(ids);
    }
    const navigationGesture =
      this.panStart !== undefined || this.pinch !== undefined;
    this.panStart = undefined;
    this.moveStart = undefined;
    this.duplicateDragMap = undefined;
    this.rotateStart = undefined;
    this.cornerRadiusStart = undefined;
    this.moveSnapGuides = undefined;
    this.snapChoices = undefined;
    this.creationStartSnapChoices = undefined;
    this.moveSnapStart = undefined;
    this.pinch = undefined;
    this.creationStyleCapture = undefined;
    // Only completed navigation authors the page's rest camera. Selection,
    // editing, and cancelled navigation must not create a hidden document
    // mutation or disturb exact undo/redo restoration.
    if (!cancelled && navigationGesture) this.persistRestCamera();
  }

  private applyEffect(effect: InteractionEffect): void {
    switch (effect.type) {
      case "select":
        if (effect.additive && effect.nodeId)
          this.kernel.toggleSelection([effect.nodeId]);
        else if (effect.nodeId) {
          this.kernel.setSelection([effect.nodeId]);
        } else if (!effect.additive) this.kernel.setSelection([]);
        return;
      case "begin-marquee":
        // A marquee started inside a frame or group scopes to that
        // container: it selects only the container's children (the
        // scope-aware marquee rule — the container itself is excluded).
        this.ensureSceneIndex();
        this.marqueeScope = this.hitContainerAtWorld(effect.start);
        return;
      case "update-marquee":
        this.draftBounds = this.toWorldBounds(effect.bounds);
        return;
      case "commit-marquee":
        this.commitMarquee(effect.bounds, effect.additive);
        return;
      case "begin-pan":
        this.panStart = {
          pointer: this.interaction.start ?? { x: 0, y: 0 },
          viewport: this.viewport,
        };
        return;
      case "pan": {
        const base = this.panStart;
        if (base) {
          this.cameraFresh = false;
          this.kernel.setViewport({
            ...base.viewport,
            panX: base.viewport.panX + effect.delta.x,
            panY: base.viewport.panY + effect.delta.y,
            devicePixelRatio: this.devicePixelRatio,
          });
        }
        return;
      }
      case "preview-rectangle":
        this.draftBounds = this.toWorldBounds(effect.bounds);
        this.snapChoices = effect.snapChoices ? structuredClone(effect.snapChoices) : undefined;
        this.creationStartSnapChoices = effect.startSnapChoices ? structuredClone(effect.startSnapChoices) : undefined;
        return;
      case "commit-rectangle":
        this.commitRectangle(effect.bounds);
        return;
      case "commit-ellipse":
        this.commitEllipse(effect.bounds);
        return;
      case "commit-line":
        this.commitLine(effect.start, effect.end);
        return;
      case "commit-frame":
        this.commitFrame(effect.bounds);
        return;
      case "move":
        this.previewMove(effect.nodeIds, effect.delta, {
          resize: effect.resize ?? false,
          ...(effect.handle !== undefined ? { handle: effect.handle } : {}),
          duplicate: effect.duplicate ?? false,
          shiftKey: effect.shiftKey ?? false,
          altKey: effect.altKey ?? false,
          ctrlKey: effect.ctrlKey ?? false,
        });
        if (effect.resize && effect.handle) {
          const retained = this.resizeEvidenceOnFinalGeometry(
            effect.nodeIds[0],
            effect.handle,
            effect.snapChoices,
          );
          this.snapChoices = retained;
          this.moveSnapGuides = retained
            ? {
                ...(retained.x ? { x: retained.x.value } : {}),
                ...(retained.y ? { y: retained.y.value } : {}),
              }
            : undefined;
        } else {
          this.moveSnapGuides = effect.guides ? { ...effect.guides } : undefined;
          this.snapChoices = effect.snapChoices ? structuredClone(effect.snapChoices) : undefined;
        }
        return;
      case "corner-radius":
        this.previewCornerRadius(effect.nodeId, effect.delta, effect.handle);
        return;
      case "rotate":
        this.previewRotate(effect.point, effect.shiftKey);
        return;
      case "zoom":
        this.cameraFresh = false;
        this.kernel.setViewport({
          ...zoomAt(this.viewport, effect.point, effect.factor),
          devicePixelRatio: this.devicePixelRatio,
        });
        return;
      case "cancel":
        this.cancelGesture();
        return;
      case "pen-begin": {
        if (!this.transactionArmed) {
          this.kernel.beginTransaction("Draw path");
          this.transactionArmed = true;
        }
        const beginWorld = screenToWorld(effect.point, this.viewport);
        this.penSession = {
          style: { ...this.kernel.getState().creationStyle },
          points: [
            {
              x: beginWorld.x,
              y: beginWorld.y,
              ...(effect.handle
                ? { handle: screenToWorld(effect.handle, this.viewport) }
                : {}),
            },
          ],
        };
        this.penPreview = undefined;
        return;
      }
      case "pen-add-point": {
        if (!this.penSession) return;
        const addWorld = screenToWorld(effect.point, this.viewport);
        this.penSession.points.push({
          x: addWorld.x,
          y: addWorld.y,
          ...(effect.handle
            ? { handle: screenToWorld(effect.handle, this.viewport) }
            : {}),
        });
        this.penPreview = undefined;
        return;
      }
      case "pen-preview": {
        const previewWorld = screenToWorld(effect.point, this.viewport);
        this.penPreview = {
          point: previewWorld,
          ...(effect.handle
            ? { handle: screenToWorld(effect.handle, this.viewport) }
            : {}),
          ...(effect.snap ? { snap: effect.snap } : {}),
        };
        return;
      }
      case "pen-close":
        this.commitPenSession(true);
        return;
      case "pen-join":
        this.joinPenSession(effect.nodeId, effect.pointId);
        return;
      case "pen-end":
        this.commitPenSession(false);
        return;
      case "pen-select-points":
        if (effect.additive) this.kernel.togglePointSelection(effect.pointIds);
        else this.kernel.setPointSelection(effect.pointIds);
        return;
      case "pen-move-points":
        if (!this.transactionArmed) {
          this.kernel.beginTransaction("Move points");
          this.transactionArmed = true;
        }
        this.previewMovePathPoints(
          effect.nodeId,
          effect.pointIds,
          effect.delta,
        );
        return;
      case "pen-move-handle":
        if (!this.transactionArmed) {
          this.kernel.beginTransaction("Move handle");
          this.transactionArmed = true;
        }
        this.previewMovePathHandle(effect);
        return;
      case "pen-cycle-type":
        this.cyclePointType(effect.nodeId, effect.pointId);
        return;
      case "pen-delete-point":
        this.deletePathPoint(effect.nodeId, effect.pointId);
        return;
    }
  }

  // -- Pen session -------------------------------------------------------------

  /** Builds the path's authored geometry from the session's screen points and
   *  lands it in the document as ONE history entry. A session with fewer than
   *  two points cannot form a valid subpath (min-2 rule) and is discarded.
   *  World points are rebased onto the pinned (0,0) min-corner form; the
   *  node's bounds carry the placement. */
  private commitPenSession(closed: boolean): void {
    const session = this.penSession;
    this.penSession = undefined;
    this.penPreview = undefined;
    if (!session || session.points.length < 2) {
      if (this.transactionArmed) {
        this.kernel.rollback();
        this.transactionArmed = false;
      }
      return;
    }
    const frameId = this.kernel.getState().currentPageId.replace(/^page-/u, "");
    const subpathId = makeId("sp");
    // The session's points are already world-anchored — they must NEVER be
    // re-converted at commit (the viewport may have moved since they were
    // dropped; the path must land where the anchors were dropped).
    const worldPoints = session.points.map((entry) => ({
      world: { x: entry.x, y: entry.y },
      handle: entry.handle,
    }));
    const minX = Math.min(...worldPoints.map((entry) => entry.world.x));
    const minY = Math.min(...worldPoints.map((entry) => entry.world.y));
    const points: Record<string, PathPoint> = {};
    worldPoints.forEach((entry, index) => {
      const id = makeId("pt");
      points[id] = {
        id,
        subpathId,
        order: orderKeyForSigned(index * 65536),
        x: entry.world.x - minX,
        y: entry.world.y - minY,
        handleMode: entry.handle ? "free" : "corner",
        ...(entry.handle
          ? {
              handleOut: {
                dx: entry.handle.x - entry.world.x,
                dy: entry.handle.y - entry.world.y,
              },
            }
          : {}),
      };
    });
    const geometry: PathGeometry = {
      points,
      subpaths: { [subpathId]: { id: subpathId, closed } },
      fillRule: "nonzero",
    };
    // After rebasing, the min corner is (0,0), so the tight bbox's max IS the
    // size; the node's bounds carry the placement.
    const bbox = computePathBounds(geometry);
    this.kernel.preview({
      type: "create-node",
      node: {
        id: makeId("path"),
        kind: "path",
        name: "Path",
        parentId: `page-root-${frameId}`,
        childIds: [],
        bounds: { x: minX, y: minY, width: bbox.maxX, height: bbox.maxY },
        transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
        visible: true,
        locked: false,
        opacity: 1,
        fill: session.style.fill,
        stroke: session.style.stroke,
        cornerRadius: 0,
        zIndex: 1,
        path: geometry,
      },
    });
    if (this.transactionArmed) {
      this.kernel.commit();
      this.transactionArmed = false;
    }
    // The session may have spanned navigation: the settled camera persists
    // now that the session's transaction is closed.
    this.persistRestCamera();
  }

  /** Absorbs another path's open subpath into the session's path: its points
   *  are translated so the endpoint coincides with the session's last point,
   *  and the other node is deleted — all within the session's transaction.
   *  The joined points enter the session as WORLD anchors like every other
   *  point; the commit never re-converts them. */
  private joinPenSession(nodeId: DocumentId, endpointId: string): void {
    const session = this.penSession;
    if (!session) return;
    const other = this.kernel.getDocument().nodes[nodeId];
    if (!other?.path) return;
    const endpoint = other.path.points[endpointId];
    if (!endpoint) return;
    const last = session.points[session.points.length - 1]!;
    // Point coordinates are node-local with the min corner pinned at (0,0);
    // the node's bounds carry the placement.
    const delta = {
      x: last.x - (endpoint.x + other.bounds.x),
      y: last.y - (endpoint.y + other.bounds.y),
    };
    for (const point of Object.values(other.path.points)) {
      if (point.id === endpointId) continue;
      session.points.push({
        x: point.x + delta.x,
        y: point.y + delta.y,
      });
    }
    this.kernel.preview({ type: "delete-node", nodeId });
  }

  // -- Node tool ---------------------------------------------------------------

  /** Points whose resolved anchor lies inside the marquee's world rect. */
  /** Moves the named points by the screen delta — one transaction per drag.
   *  The moved geometry is rebased onto the pinned (0,0) min-corner form and
   *  the node's bounds carry the placement. */
  private previewMovePathPoints(
    nodeId: DocumentId,
    pointIds: string[],
    delta: Point,
  ): void {
    const { document } = this.kernel.getProjection();
    const node = document.nodes[nodeId];
    if (!node?.path || pointIds.length === 0) return;
    const zoom = this.viewport.zoom;
    const worldDelta = { x: delta.x / zoom, y: delta.y / zoom };
    // The point coordinates are NODE-LOCAL; the drag delta is in WORLD
    // units. The local delta is the inverse of the world transform's LINEAR
    // part applied to the world delta — translation is irrelevant to a
    // delta, but rotation and scale must be inverted or the point drifts
    // off the cursor under any transformed parent (the coordinate bug).
    const world = this.worldTransformOf(nodeId);
    const det = world.a * world.d - world.b * world.c;
    const dx =
      det !== 0
        ? (world.d * worldDelta.x - world.c * worldDelta.y) / det
        : worldDelta.x;
    const dy =
      det !== 0
        ? (-world.b * worldDelta.x + world.a * worldDelta.y) / det
        : worldDelta.y;
    const records: Record<string, PathPoint> = {};
    for (const pointId of pointIds) {
      const point = node.path.points[pointId];
      if (!point) continue;
      records[pointId] = { ...point, x: point.x + dx, y: point.y + dy };
    }
    if (Object.keys(records).length === 0) return;
    const rebased = this.rebasedPathState(node, records);
    this.kernel.preview({
      type: "set-path-points",
      nodeId,
      pointRecords: rebased.points,
      bounds: rebased.bounds,
    });
  }

  /** The composed world transform of a node on the active page — the
   *  kernel's composition (parent × translate(bounds) × transform), the
   *  same walk the path-commands projection uses. */
  private worldTransformOf(nodeId: DocumentId, boundsOverride?: Bounds): Transform2D {
    const { document, state } = this.kernel.getProjection();
    const page = document.pages[state.currentPageId];
    if (!page) return identityTransform();
    let found: Transform2D | undefined;
    const walk = (parentId: DocumentId, parentWorld: Transform2D): void => {
      if (found) return;
      const parent = document.nodes[parentId];
      if (!parent) return;
      for (const childId of parent.childIds) {
        const node = document.nodes[childId];
        if (!node) continue;
        const bounds = childId === nodeId && boundsOverride ? boundsOverride : node.bounds;
        const position = {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: bounds.x,
          f: bounds.y,
        };
        const world = multiplyTransforms(
          parentWorld,
          multiplyTransforms(position, node.transform),
        );
        if (childId === nodeId) {
          found = world;
          return;
        }
        walk(childId, world);
      }
    };
    walk(page.rootId, identityTransform());
    return found ?? identityTransform();
  }

  /** Rebases a point-record patch so the geometry's min corner is (0,0) and
   *  the node's bounds carry the placement — the kernel's pinned form. The
   *  placement shifts by the node's transform applied to the min corner
   *  (the LINEAR part): the drawn world position is `T(local) + bounds`, so
   *  under a rotation/scale a raw `bounds + min` rebase would drift every
   *  point off its world position (the transformed-parent coordinate bug). */
  private rebasedPathState(
    node: DocumentNode,
    records: Record<string, PathPoint>,
  ): { points: Record<string, PathPoint>; bounds: Rect } {
    const points = { ...node.path!.points, ...records };
    const geometry: PathGeometry = { ...node.path!, points };
    const bbox = computePathBounds(geometry);
    const shifted: Record<string, PathPoint> = {};
    for (const [id, point] of Object.entries(points))
      shifted[id] = {
        ...point,
        x: point.x - bbox.minX,
        y: point.y - bbox.minY,
      };
    const t = node.transform;
    const minWorld = {
      x: t.a * bbox.minX + t.c * bbox.minY,
      y: t.b * bbox.minX + t.d * bbox.minY,
    };
    return {
      points: shifted,
      bounds: {
        x: node.bounds.x + minWorld.x,
        y: node.bounds.y + minWorld.y,
        width: bbox.maxX - bbox.minX,
        height: bbox.maxY - bbox.minY,
      },
    };
  }

  /** Moves one handle with the constraint grammar (mode base, shift/alt/ctrl
   *  modifiers), demoting auto points to asymmetric in the same preview.
   *  One `set-path-points` per preview carries the rebased full record set —
   *  the demote is invertible because the inverse restores the auto record. */
  private previewMovePathHandle(effect: {
    nodeId: DocumentId;
    pointId: string;
    handle: "in" | "out";
    delta: Point;
    shiftKey: boolean;
    altKey: boolean;
    ctrlKey: boolean;
  }): void {
    const { document } = this.kernel.getProjection();
    const node = document.nodes[effect.nodeId];
    if (!node?.path) return;
    const point = node.path.points[effect.pointId];
    if (!point) return;
    const resolved = resolveAutoHandles(node.path).points[effect.pointId]!;
    const constrained = constrainHandleDrag(
      resolved,
      effect.handle,
      {
        dx: effect.delta.x / this.viewport.zoom,
        dy: effect.delta.y / this.viewport.zoom,
      },
      {
        shiftKey: effect.shiftKey,
        altKey: effect.altKey,
        ctrlKey: effect.ctrlKey,
      },
    );
    const updated: PathPoint =
      point.handleMode === "auto"
        ? { ...resolved, handleMode: "asymmetric", ...constrained }
        : { ...resolved, ...constrained };
    const rebased = this.rebasedPathState(node, { [effect.pointId]: updated });
    this.kernel.preview({
      type: "set-path-points",
      nodeId: effect.nodeId,
      pointRecords: rebased.points,
      bounds: rebased.bounds,
    });
  }

  private pathBoundsAfter(
    node: DocumentNode,
    records: Record<string, PathPoint>,
  ): Rect {
    const geometry: PathGeometry = {
      ...node.path!,
      points: { ...node.path!.points, ...records },
    };
    const bbox = computePathBounds(geometry);
    // Handle edits keep the anchors pinned at (0,0); the node's bounds carry
    // the placement.
    return {
      x: node.bounds.x,
      y: node.bounds.y,
      width: bbox.maxX - bbox.minX,
      height: bbox.maxY - bbox.minY,
    };
  }

  /** The exact split: the harness computes the split records from the kernel's
   *  splitSegment and lands one `insert-path-point`. Auto neighbours demote
   *  to asymmetric with the split handles in the same command — the inverse
   *  restores the pre-split auto records, so the demote is invertible. */
  /** Cycles the point's mode corner → free → asymmetric → mirrored → auto
   *  (the reducer's control-click), one history entry per cycle. The
   *  converted geometry is rebased onto the pinned form via
   *  `replace-path-geometry` — a whole-content swap whose inverse restores
   *  the exact pre-cycle geometry. */
  private cyclePointType(nodeId: DocumentId, pointId: string): void {
    const { document } = this.kernel.getProjection();
    const node = document.nodes[nodeId];
    if (!node?.path) return;
    const point = node.path.points[pointId];
    if (!point) return;
    const cycle = ["corner", "free", "asymmetric", "mirrored", "auto"] as const;
    const index = cycle.indexOf(point.handleMode);
    const mode = cycle[(index + 1) % cycle.length]!;
    const subpath = node.path.subpaths[point.subpathId];
    const ordered = pointsOfSubpath(node.path, point.subpathId);
    const pos = ordered.findIndex((candidate) => candidate.id === pointId);
    const prev =
      pos > 0 || (subpath?.closed ?? false)
        ? ordered[(pos - 1 + ordered.length) % ordered.length]
        : undefined;
    const next =
      pos < ordered.length - 1 || (subpath?.closed ?? false)
        ? ordered[(pos + 1) % ordered.length]
        : undefined;
    const converted = convertPointType(point, prev, next, mode);
    const rebased = this.rebasedPathState(node, {
      [pointId]: { ...point, handleMode: mode, ...converted },
    });
    this.kernel.dispatch(
      {
        type: "replace-path-geometry",
        nodeId,
        geometry: { ...node.path, points: rebased.points },
        bounds: rebased.bounds,
      },
      "Cycle point type",
    );
  }

  /** Shift+click on an anchor with the pen deletes it. The removal is a full
   *  `replace-path-geometry` with the remaining points re-based (min corner
   *  back at (0,0)) and the placement carried — the pinned form every path
   *  consumer expects, and the inverse restores the geometry byte-exactly.
   *  A subpath with ≤ 2 points cannot lose one (the kernel's minimum). */
  private deletePathPoint(nodeId: DocumentId, pointId: string): void {
    const { document } = this.kernel.getProjection();
    const node = document.nodes[nodeId];
    if (!node?.path) return;
    const point = node.path.points[pointId];
    if (!point) return;
    const ordered = pointsOfSubpath(node.path, point.subpathId);
    if (ordered.length <= 2) return;
    const points = { ...node.path.points };
    delete points[pointId];
    const geometry: PathGeometry = { ...node.path, points };
    const bbox = computePathBounds(geometry);
    const shifted: Record<string, PathPoint> = {};
    for (const [id, entry] of Object.entries(points))
      shifted[id] = {
        ...entry,
        x: entry.x - bbox.minX,
        y: entry.y - bbox.minY,
      };
    const t = node.transform;
    const minWorld = {
      x: t.a * bbox.minX + t.c * bbox.minY,
      y: t.b * bbox.minX + t.d * bbox.minY,
    };
    this.kernel.dispatch(
      {
        type: "replace-path-geometry",
        nodeId,
        geometry: { ...geometry, points: shifted },
        bounds: {
          x: node.bounds.x + minWorld.x,
          y: node.bounds.y + minWorld.y,
          width: bbox.maxX - bbox.minX,
          height: bbox.maxY - bbox.minY,
        },
      },
      "Delete point",
    );
  }

  private previewMove(
    nodeIds: DocumentId[],
    delta: Point,
    options: {
      resize: boolean;
      handle?: ResizeHandle;
      duplicate: boolean;
      shiftKey: boolean;
      altKey: boolean;
      ctrlKey: boolean;
    },
  ): void {
    const { document } = this.kernel.getProjection();
    const targets = nodeIds.filter((id) => document.nodes[id]);
    if (targets.length === 0) return;
    if (!this.transactionArmed) {
      this.kernel.beginTransaction(options.duplicate ? "Duplicate and move layer" : "Move layer");
      this.transactionArmed = true;
    }
    const selected = new Set(targets);
    // Only the SELECTED ROOTS move: the kernel model is parent-relative —
    // a node's bounds are its placement within its parent, so moving a
    // parent moves its whole subtree with it. Shifting a descendant's
    // bounds too would double-count the ancestor's delta (the parallax
    // bug: children appeared to move twice as far as the parent). A
    // selected node whose ancestor is also selected rides along with the
    // ancestor — moving it directly would double-count the same way.
    const roots = targets.filter((id) => {
      let ancestor = document.nodes[id]!.parentId;
      while (ancestor) {
        if (selected.has(ancestor)) return false;
        ancestor = document.nodes[ancestor]?.parentId ?? null;
      }
      return true;
    });
    // Alt-drag duplicates: mint the copies at the FIRST preview so the
    // drag moves the copies, and the whole gesture is one history entry.
    // The mapping is by the dragged set's order: copies[i] is the copy of
    // roots[i].
    let moveIds = roots;
    if (options.duplicate && !this.duplicateDragMap) {
      const plan = this.kernel.planDuplicate(roots, { x: 0, y: 0 });
      if (plan.commands.length > 0) {
        this.kernel.preview(plan.commands);
        this.duplicateDragMap = new Map(
          roots.map((id, index) => [id, plan.mintedIds[index]!]),
        );
        moveIds = plan.mintedIds.filter((id): id is DocumentId => Boolean(id));
      }
    } else if (options.duplicate && this.duplicateDragMap) {
      moveIds = roots.map((id) => this.duplicateDragMap!.get(id)).filter((id): id is DocumentId => Boolean(id));
    }
    const key = moveIds.join("|");
    if (!this.moveStart || this.moveStart.key !== key) {
      // A fresh read: an alt-drag's copies were just minted by the preview
      // above, and the projection captured at the top of this call predates
      // them — capturing from it would leave an empty bounds map and the
      // gesture would commit an empty transaction.
      const currentDocument = this.kernel.getProjection().document;
      const startBounds = new Map<string, Bounds>();
      for (const id of moveIds) {
        const current = currentDocument.nodes[id];
        if (current) startBounds.set(id, { ...current.bounds });
      }
      this.moveStart = { key, bounds: startBounds };
    }
    const zoom = this.viewport.zoom;
    const dx = delta.x / zoom;
    const dy = delta.y / zoom;
    const startBounds = this.moveStart.bounds.get(moveIds[0]!);
    if (options.resize && moveIds.length === 1 && startBounds !== undefined) {
      const nodeId = moveIds[0]!;
      const node = document.nodes[nodeId]!;
      const world = this.worldTransformOf(nodeId);
      // The drag delta is WORLD; the bounds are NODE-LOCAL. The local delta
      // is the inverse of the world transform's LINEAR part — under rotation
      // or scale the cursor must not drift off the handle (the same inverse
      // the point drags use).
      this.kernel.preview({
        type: "set-bounds",
        nodeId,
        bounds: projectConstrainedResize(startBounds, options.handle ?? "se", { x: dx, y: dy }, world, {
          constrainAspect: options.shiftKey,
          fromCenter: options.altKey,
          minSize: MIN_LAYER_SIZE,
        }),
      });
      return;
    }
    const previews: DocumentCommand[] = [];
    for (const [id, original] of this.moveStart.bounds) {
      previews.push({
        type: "set-bounds",
        nodeId: id,
        bounds: {
          x: original.x + dx,
          y: original.y + dy,
          width: original.width,
          height: original.height,
        },
      });
    }
    this.kernel.preview(previews);
    if (options.duplicate && this.duplicateDragMap) {
      this.lastDuplicateOffset = { x: dx, y: dy };
    }
  }

  /** Retains only candidate evidence occupied by the actual constrained resize
   * handle after local transform, aspect lock, centre resize, and size floor.
   * The overlay therefore cannot describe pre-constraint geometry. */
  private resizeEvidenceOnFinalGeometry(
    nodeId: DocumentId | undefined,
    handle: ResizeHandle,
    choices: SnapChoicesPayload | undefined,
  ): SnapChoicesPayload | undefined {
    if (!nodeId || !choices) return undefined;
    const node = this.kernel.getDocument().nodes[nodeId];
    if (!node) return undefined;
    const local = {
      x: handle.includes("w") ? 0 : handle.includes("e") ? node.bounds.width : node.bounds.width / 2,
      y: handle.includes("n") ? 0 : handle.includes("s") ? node.bounds.height : node.bounds.height / 2,
    };
    const feature = transformPoint(local, this.worldTransformOf(nodeId));
    const epsilon = 1e-8;
    const retained: SnapChoicesPayload = {
      ...(choices.x && Math.abs(feature.x - choices.x.value) <= epsilon ? { x: choices.x } : {}),
      ...(choices.y && Math.abs(feature.y - choices.y.value) <= epsilon ? { y: choices.y } : {}),
    };
    return retained.x || retained.y ? retained : undefined;
  }

  private previewCornerRadius(nodeId: DocumentId, delta: Point, handle: CornerHandle): void {
    const { document } = this.kernel.getProjection();
    const node = document.nodes[nodeId];
    if (!node || (node.kind !== "rectangle" && node.kind !== "frame")) return;
    const world = this.worldTransformOf(nodeId);
    const det = world.a * world.d - world.b * world.c;
    const dx = delta.x / this.viewport.zoom;
    const dy = delta.y / this.viewport.zoom;
    const localX = det !== 0 ? (world.d * dx - world.c * dy) / det : dx;
    const localY = det !== 0 ? (-world.b * dx + world.a * dy) / det : dy;
    const inward = handle === "nw" ? localX + localY : handle === "ne" ? -localX + localY : handle === "se" ? -localX - localY : localX - localY;
    const change = inward / 2;
    if (!this.cornerRadiusStart || this.cornerRadiusStart.nodeId !== nodeId) {
      this.cornerRadiusStart = { nodeId, value: node.cornerRadius };
      this.kernel.beginTransaction("Adjust corner radius");
      this.transactionArmed = true;
    }
    const max = Math.min(node.bounds.width, node.bounds.height) / 2;
    const value = Math.max(0, Math.min(max, this.cornerRadiusStart.value + change));
    this.kernel.preview({ type: "set-property", nodeId, property: "cornerRadius", value });
  }

  /** Rotates the single selection around its world center — the cursor
   *  follows the box corner (grab the ring just outside any corner handle).
   *  Shift snaps the angle to 15° steps. The rotation composes on the node's
   *  authored transform: A = T(C−b)·R(θ)·T(b−C), M' = A·M, so the box stays
   *  centered and the placement (bounds) is untouched — the inverse restores
   *  the exact prior transform. */
  private previewRotate(point: Point, shiftKey: boolean): void {
    const { document, state } = this.kernel.getProjection();
    const pageId = state.currentPageId;
    const selectedIds = state.selectedIds;
    if (selectedIds.length !== 1) return;
    const nodeId = selectedIds[0]!;
    const node = document.nodes[nodeId];
    if (!node) return;
    const box = this.projectSelectionBox(document, pageId, selectedIds);
    if (!box) return;
    const world = transformBounds(box.bounds, box.transform);
    const center = {
      x: world.x + world.width / 2,
      y: world.y + world.height / 2,
    };
    const cursor = screenToWorld(point, this.viewport);
    const angle = Math.atan2(cursor.y - center.y, cursor.x - center.x);
    if (!this.rotateStart || this.rotateStart.key !== nodeId) {
      // The start angle is the POINTER-DOWN point's angle — the cursor
      // grabbed the ring there — so the first move already rotates.
      const startPoint = this.interaction.start;
      const startCursor = startPoint
        ? screenToWorld(startPoint, this.viewport)
        : cursor;
      this.rotateStart = {
        key: nodeId,
        angle: Math.atan2(startCursor.y - center.y, startCursor.x - center.x),
      };
      if (!this.transactionArmed) {
        this.kernel.beginTransaction("Rotate layer");
        this.transactionArmed = true;
      }
    }
    let delta = angle - this.rotateStart.angle;
    if (shiftKey) {
      const step = Math.PI / 12; // 15°
      delta = Math.round(delta / step) * step;
    }
    if (Math.abs(delta) < 1e-6) return;
    // b = the world position of the local origin = the world transform's
    // translation (e, f); C = the box's world center.
    const b = { x: box.transform.e, y: box.transform.f };
    const tx = (x: number, y: number): AffineTransform => ({ a: 1, b: 0, c: 0, d: 1, e: x, f: y });
    const rotate = (radians: number): AffineTransform => {
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
    };
    const a = multiplyTransforms(
      tx(center.x - b.x, center.y - b.y),
      multiplyTransforms(rotate(delta), tx(b.x - center.x, b.y - center.y)),
    );
    this.kernel.preview({
      type: "set-transform",
      nodeId,
      transform: multiplyTransforms(a, node.transform),
    });
  }

  private commitRectangle(bounds: Rect): void {
    const style = this.creationStyleCapture ?? this.kernel.getState().creationStyle;
    const world = this.toWorldBounds(bounds);
    if (!hasMinimumBounds(world)) return;
    const parentId = `page-root-${this.frameId}`;
    const { document } = this.kernel.getProjection();
    const zIndex = document.nodes[parentId]?.childIds.length ?? 0;
    const node: DocumentNode = {
      id: makeId("rectangle"),
      kind: "rectangle",
      name: "New rectangle",
      parentId,
      childIds: [],
      bounds: world,
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true,
      locked: false,
      opacity: 1,
      fill: style.fill,
      stroke: style.stroke,
      cornerRadius: 16,
      zIndex,
    };
    this.kernel.dispatch({ type: "create-node", node }, "Create rectangle");
    this.kernel.setSelection([node.id]);
  }

  /** The ellipse tool commits a PATH node whose geometry is the standard
   *  4-cubic circle approximation (k = 0.55228r, mirrored handles) — the
   *  industry's own ellipse representation (Figma and Sketch store ellipses
   *  as path geometry), so no new node kind touches the schema. */
  private commitEllipse(bounds: Rect): void {
    const style = this.creationStyleCapture ?? this.kernel.getState().creationStyle;
    const world = this.toWorldBounds(bounds);
    if (!hasMinimumBounds(world)) return;
    const parentId = `page-root-${this.frameId}`;
    const { document } = this.kernel.getProjection();
    const zIndex = document.nodes[parentId]?.childIds.length ?? 0;
    const width = world.width;
    const height = world.height;
    const kx = width / 2 * 0.5522847498;
    const ky = height / 2 * 0.5522847498;
    const subpathId = "sp-ellipse";
    const points: Record<string, PathPoint> = {
      "pt-top": { id: "pt-top", subpathId, order: orderKeyForSigned(0), x: width / 2, y: 0, handleMode: "mirrored", handleOut: { dx: kx, dy: 0 } },
      "pt-right": { id: "pt-right", subpathId, order: orderKeyForSigned(65536), x: width, y: height / 2, handleMode: "mirrored", handleOut: { dx: 0, dy: ky } },
      "pt-bottom": { id: "pt-bottom", subpathId, order: orderKeyForSigned(131072), x: width / 2, y: height, handleMode: "mirrored", handleOut: { dx: -kx, dy: 0 } },
      "pt-left": { id: "pt-left", subpathId, order: orderKeyForSigned(196608), x: 0, y: height / 2, handleMode: "mirrored", handleOut: { dx: 0, dy: -ky } },
    };
    const node: DocumentNode = {
      id: makeId("ellipse"),
      kind: "path",
      name: "Ellipse",
      parentId,
      childIds: [],
      bounds: world,
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true,
      locked: false,
      opacity: 1,
      fill: style.fill,
      stroke: style.stroke,
      cornerRadius: 0,
      zIndex,
      path: {
        points,
        subpaths: { [subpathId]: { id: subpathId, closed: true } },
        fillRule: "nonzero",
      },
    };
    this.kernel.dispatch({ type: "create-node", node }, "Create ellipse");
    this.kernel.setSelection([node.id]);
  }

  /** The line tool commits a 2-point OPEN path — a path node, like every
   *  other vector shape. A click without a drag already carried a default
   *  endpoint from the reducer. */
  private commitLine(start: Point, end: Point): void {
    const style = this.creationStyleCapture ?? this.kernel.getState().creationStyle;
    const worldStart = screenToWorld(start, this.viewport);
    const worldEnd = screenToWorld(end, this.viewport);
    const minX = Math.min(worldStart.x, worldEnd.x);
    const minY = Math.min(worldStart.y, worldEnd.y);
    const width = Math.abs(worldEnd.x - worldStart.x);
    const height = Math.abs(worldEnd.y - worldStart.y);
    // A line may legitimately be horizontal or vertical; only reject a
    // genuinely zero-length drag.
    if (width < MIN_LAYER_SIZE && height < MIN_LAYER_SIZE) return;
    const parentId = `page-root-${this.frameId}`;
    const { document } = this.kernel.getProjection();
    const zIndex = document.nodes[parentId]?.childIds.length ?? 0;
    const subpathId = "sp-line";
    const points: Record<string, PathPoint> = {
      "pt-a": { id: "pt-a", subpathId, order: orderKeyForSigned(0), x: worldStart.x - minX, y: worldStart.y - minY, handleMode: "corner" },
      "pt-b": { id: "pt-b", subpathId, order: orderKeyForSigned(65536), x: worldEnd.x - minX, y: worldEnd.y - minY, handleMode: "corner" },
    };
    const node: DocumentNode = {
      id: makeId("line"),
      kind: "path",
      name: "Line",
      parentId,
      childIds: [],
      bounds: { x: minX, y: minY, width, height },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true,
      locked: false,
      opacity: 1,
      fill: style.fill,
      stroke: style.stroke,
      cornerRadius: 0,
      zIndex,
      path: {
        points,
        subpaths: { [subpathId]: { id: subpathId, closed: false } },
        fillRule: "nonzero",
      },
    };
    this.kernel.dispatch({ type: "create-node", node }, "Create line");
    this.kernel.setSelection([node.id]);
  }

  /** The frame tool commits a FRAME node, then absorbs every top-level node
   *  fully contained in the drawn box as its children — one history entry,
   *  the frame tool's contract (drawing a frame around objects groups them
   *  into it). */
  private commitFrame(bounds: Rect): void {
    const style = this.creationStyleCapture ?? this.kernel.getState().creationStyle;
    const world = this.toWorldBounds(bounds);
    if (!hasMinimumBounds(world)) return;
    const parentId = `page-root-${this.frameId}`;
    const { document } = this.kernel.getProjection();
    const zIndex = document.nodes[parentId]?.childIds.length ?? 0;
    const frame: DocumentNode = {
      id: makeId("frame"),
      kind: "frame",
      name: "Frame",
      parentId,
      childIds: [],
      bounds: world,
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true,
      locked: false,
      opacity: 1,
      fill: style.fill,
      stroke: style.stroke,
      cornerRadius: 0,
      zIndex,
    };
    if (!this.transactionArmed) {
      this.kernel.beginTransaction("Create frame");
      this.transactionArmed = true;
    }
    this.kernel.preview({ type: "create-node", node: frame });
    // Absorb fully-contained top-level siblings (visibility- and lock-
    // respecting) as children of the new frame.
    const contained = document.nodes[parentId]?.childIds
      .map((id) => document.nodes[id])
      .filter(
        (node): node is DocumentNode =>
          node !== undefined &&
          node.visible &&
          !node.locked &&
          node.id !== frame.id &&
          node.bounds.x >= world.x &&
          node.bounds.y >= world.y &&
          node.bounds.x + node.bounds.width <= world.x + world.width &&
          node.bounds.y + node.bounds.height <= world.y + world.height,
      ) ?? [];
    for (const node of contained) {
      // Absorption REBASES each node's placement into the frame's local
      // space: the frame's world box is its (identity) placement, so the
      // local bounds are the world bounds minus the frame's origin. Without
      // the rebase the node keeps page-root-local coordinates and jumps to
      // (frame.x + bounds.x) in world space.
      this.kernel.preview([
        {
          type: "set-bounds",
          nodeId: node.id,
          bounds: {
            x: node.bounds.x - world.x,
            y: node.bounds.y - world.y,
            width: node.bounds.width,
            height: node.bounds.height,
          },
        },
        {
          type: "reparent-node",
          nodeId: node.id,
          parentId: frame.id,
          index: document.nodes[frame.id]?.childIds.length ?? 0,
        },
      ]);
    }
    this.kernel.commit();
    this.transactionArmed = false;
    this.kernel.setSelection([frame.id]);
  }

  private commitMarquee(bounds: Rect, additive: boolean): void {
    this.kernel.marqueeSelect(this.toWorldBounds(bounds), additive, this.marqueeScope);
    this.marqueeScope = undefined;
  }

  /** The deepest frame or group ANCESTOR of the node under a world point —
   *  the marquee's scope container (a marquee started on a leaf inside a
   *  frame still scopes to the frame). The page root never scopes. */
  private hitContainerAtWorld(point: Point): DocumentId | undefined {
    const hit = this.authoredIdForProjectionId(this.spatialIndex?.query(screenToWorld(point, this.viewport)) ?? "");
    if (!hit) return undefined;
    const document = this.kernel.getDocument();
    let node = document.nodes[hit];
    while (node && node.kind !== "page-root") {
      if ((node.kind === "frame" || node.kind === "group") && node.childIds.length > 0) {
        return node.id;
      }
      node = node.parentId ? document.nodes[node.parentId] : undefined;
    }
    return undefined;
  }

  private toWorldBounds(bounds: Rect): Bounds {
    const start = screenToWorld({ x: bounds.x, y: bounds.y }, this.viewport);
    const end = screenToWorld(
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      this.viewport,
    );
    return normalizeBounds(start, end);
  }

  private clearDraft(): void {
    this.panStart = undefined;
    this.moveStart = undefined;
    this.duplicateDragMap = undefined;
    this.marqueeScope = undefined;
    this.rotateStart = undefined;
    this.moveSnapGuides = undefined;
    this.snapChoices = undefined;
    this.creationStartSnapChoices = undefined;
    this.moveSnapStart = undefined;
    this.draftBounds = undefined;
    this.creationStyleCapture = undefined;
  }

  private buildScene(
    document: EditorDocument,
    documentRevision: number,
  ): Scene {
    const key = `${documentRevision}:${this.storyId}:${this.frameId}:${this.revision}`;
    if (this.sceneCache && this.sceneCache.key === key)
      return this.sceneCache.scene;
    // The PROJECTED scene carries the kernel's documentRevision, not the
    // persistence revision. The renderer compares the revision it is asked for
    // against the one the packet echoes, so both must come from the counter
    // that advances on every command. `this.revision` only moves on save, so
    // using it here made every frame after the first edit fail that comparison
    // and the canvas stopped updating.
    //
    // `snapshotForSave` deliberately still stamps `this.revision`: the save
    // path checks it against the store's expected revision.
    const base = editorDocumentToScene(document, documentRevision);
    const scene = applyStoryOverrides(base, this.frameId, this.storyId);
    this.sceneCache = {
      key,
      scene,
      glassSurfaces: projectGlassSurfaces(document),
      pathCommands: projectPathCommands(
        document,
        this.kernel.getState().currentPageId,
      ),
      authoredIdForProjectionId: Object.fromEntries(
        Object.entries(this.kernel.getProjection().resolvedScene.nodes).map(([id, node]) => [id, node.provenance.instanceId ?? id]),
      ),
    };
    this.spatialIndex = createSceneSpatialIndex(scene, this.frameId);
    return scene;
  }
}

export function useCanvasEditor(
  editor: CanvasEditor | undefined,
): EditorProjection | null {
  const subscribe = useCallback(
    (listener: () => void) =>
      editor ? editor.subscribe(listener) : () => undefined,
    [editor],
  );
  const getSnapshot = useCallback(
    () => (editor ? editor.getSnapshot() : null),
    [editor],
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
