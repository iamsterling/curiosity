import {
  documentDeepHitTest,
  documentHitTest,
  initialInteractionState,
  projectConstrainedResize,
  projectNodeWorldTransform,
  projectRotatedTransform,
  projectSelectionBox,
  screenToWorld,
  selectionHandlePositions,
  transitionInteraction,
  type AffineTransform,
  type DocumentCommand,
  type EditorKernel,
  type InteractionContext,
  type InteractionEffect,
  type InteractionState,
  type Rect,
  type ResizeHandle,
  type SelectionProjectionBox,
} from "@crafty/editor/kernel";
import type { CanvasPointerInput } from "../../modules/curiosity-canvas";
import { toCraftyPointerInput } from "./crafty-pointer-input";

const DRAG_THRESHOLD = 4;

export class CraftySelectionInteraction {
  private interaction: InteractionState = initialInteractionState("select");
  private marqueeScope?: string;
  private moveStart?: Map<string, Rect>;
  private resizeStart?: {
    bounds: Rect;
    nodeId: string;
    worldTransform: AffineTransform;
  };
  private rotateStart?: {
    box: SelectionProjectionBox;
    nodeId: string;
    point: Readonly<{ x: number; y: number }>;
    transform: AffineTransform;
  };
  private transactionArmed = false;

  public constructor(private readonly kernel: EditorKernel) {}

  public handle = (input: CanvasPointerInput): void => {
    if (input.phase === "down") {
      const world = screenToWorld(
        { x: input.x, y: input.y },
        this.kernel.getState().viewport,
      );
      this.kernel.exitIsolationAt(world);
      if ((input.clickCount ?? 1) >= 2) this.kernel.deepSelectAt(world);
    }
    const transition = transitionInteraction(
      this.interaction,
      toCraftyPointerInput(input),
      this.context(),
    );
    this.interaction = transition.state;
    this.kernel.setInteraction(transition.state);
    for (const effect of transition.effects) this.applyEffect(effect);

    if (input.phase === "up" || input.phase === "cancel") {
      this.finish(input.phase === "cancel");
    }
  };

  private context(): InteractionContext {
    const projection = this.kernel.getProjection();
    const viewport = projection.state.viewport;
    const authoredDocument = projection.document;
    return {
      canMutateNode: (nodeId) => {
        let node = authoredDocument.nodes[nodeId];
        while (node) {
          if (!node.visible || node.locked) return false;
          node = node.parentId
            ? authoredDocument.nodes[node.parentId]
            : undefined;
        }
        return true;
      },
      dragThreshold: DRAG_THRESHOLD,
      hitTest: (point) =>
        documentHitTest(
          authoredDocument,
          projection.state.currentPageId,
          screenToWorld(point, viewport),
          projection.state.isolationRootId,
        ),
      handlePositionsOf: (nodeId) => {
        const box = projectSelectionBox(
          authoredDocument,
          projection.state.currentPageId,
          [nodeId],
        );
        return box ? selectionHandlePositions(box) : undefined;
      },
      selectedIds: projection.state.selectedIds,
      viewport,
    };
  }

  private applyEffect(effect: InteractionEffect): void {
    if (effect.type === "select") {
      if (effect.additive && effect.nodeId) {
        this.kernel.toggleSelection([effect.nodeId]);
      } else if (effect.nodeId) {
        this.kernel.setSelection([effect.nodeId]);
      } else if (!effect.additive) {
        this.kernel.setSelection([]);
      }
      return;
    }
    if (effect.type === "begin-marquee") {
      this.marqueeScope = this.hitContainerAtScreen(effect.start);
      return;
    }
    if (effect.type === "update-marquee") return;
    if (effect.type === "commit-marquee") {
      this.kernel.marqueeSelect(
        this.screenBoundsToWorld(effect.bounds),
        effect.additive,
        this.marqueeScope,
      );
      this.marqueeScope = undefined;
      return;
    }
    if (effect.type === "move") {
      if (effect.resize && effect.handle) {
        this.previewResize(
          effect.nodeIds[0],
          effect.handle,
          effect.delta,
          effect.shiftKey ?? false,
          effect.altKey ?? false,
        );
      } else {
        this.previewMove(effect.nodeIds, effect.delta);
      }
      return;
    }
    if (effect.type === "rotate") {
      this.previewRotate(effect.point, effect.shiftKey);
      return;
    }
    if (effect.type === "cancel") this.finish(true);
  }

  private previewMove(
    nodeIds: readonly string[],
    delta: Readonly<{ x: number; y: number }>,
  ): void {
    const document = this.kernel.getDocument();
    const selected = new Set(nodeIds);
    const roots = nodeIds.filter((nodeId) => {
      let ancestor = document.nodes[nodeId]?.parentId;
      while (ancestor) {
        if (selected.has(ancestor)) return false;
        ancestor = document.nodes[ancestor]?.parentId ?? null;
      }
      return document.nodes[nodeId] !== undefined;
    });
    if (roots.length === 0) return;

    if (!this.transactionArmed) {
      this.beginTransaction("Move layer");
      this.moveStart = new Map(
        roots.flatMap((nodeId) => {
          const node = document.nodes[nodeId];
          return node ? [[nodeId, { ...node.bounds }] as const] : [];
        }),
      );
    }

    const zoom = this.kernel.getState().viewport.zoom;
    const commands: DocumentCommand[] = [];
    for (const [nodeId, bounds] of this.moveStart ?? []) {
      commands.push({
        bounds: {
          height: bounds.height,
          width: bounds.width,
          x: bounds.x + delta.x / zoom,
          y: bounds.y + delta.y / zoom,
        },
        nodeId,
        type: "set-bounds",
      });
    }
    if (commands.length > 0) this.kernel.preview(commands);
  }

  private previewResize(
    nodeId: string | undefined,
    handle: ResizeHandle,
    delta: Readonly<{ x: number; y: number }>,
    constrainAspect: boolean,
    fromCenter: boolean,
  ): void {
    if (!nodeId) return;
    if (!this.resizeStart || this.resizeStart.nodeId !== nodeId) {
      const projection = this.kernel.getProjection();
      const node = projection.document.nodes[nodeId];
      const worldTransform = projectNodeWorldTransform(
        projection.document,
        projection.state.currentPageId,
        nodeId,
      );
      if (!node || !worldTransform) return;
      this.beginTransaction("Resize layer");
      this.resizeStart = {
        bounds: { ...node.bounds },
        nodeId,
        worldTransform,
      };
    }
    const zoom = this.kernel.getState().viewport.zoom;
    this.kernel.preview({
      bounds: projectConstrainedResize(
        this.resizeStart.bounds,
        handle,
        { x: delta.x / zoom, y: delta.y / zoom },
        this.resizeStart.worldTransform,
        { constrainAspect, fromCenter, minSize: 1 },
      ),
      nodeId,
      type: "set-bounds",
    });
  }

  private previewRotate(
    point: Readonly<{ x: number; y: number }>,
    constrainTo15Degrees: boolean,
  ): void {
    const projection = this.kernel.getProjection();
    const nodeId = projection.state.selectedIds[0];
    if (!nodeId || projection.state.selectedIds.length !== 1) return;
    const node = projection.document.nodes[nodeId];
    if (!node) return;
    if (!this.rotateStart || this.rotateStart.nodeId !== nodeId) {
      const box = projectSelectionBox(
        projection.document,
        projection.state.currentPageId,
        [nodeId],
      );
      if (!box) return;
      this.beginTransaction("Rotate layer");
      this.rotateStart = {
        box,
        nodeId,
        point: screenToWorld(
          this.interaction.start ?? point,
          projection.state.viewport,
        ),
        transform: { ...node.transform },
      };
    }
    this.kernel.preview({
      nodeId,
      transform: projectRotatedTransform(
        this.rotateStart.transform,
        this.rotateStart.box,
        this.rotateStart.point,
        screenToWorld(point, projection.state.viewport),
        constrainTo15Degrees,
      ),
      type: "set-transform",
    });
  }

  private beginTransaction(label: string): void {
    if (this.transactionArmed) return;
    this.kernel.beginTransaction(label);
    this.transactionArmed = true;
  }

  private hitContainerAtScreen(
    point: Readonly<{ x: number; y: number }>,
  ): string | undefined {
    const projection = this.kernel.getProjection();
    const document = projection.document;
    const hit = documentDeepHitTest(
      document,
      projection.state.currentPageId,
      screenToWorld(point, projection.state.viewport),
      projection.state.isolationRootId,
    );
    let node = hit ? document.nodes[hit] : undefined;
    while (node && node.kind !== "page-root") {
      if (
        (node.kind === "frame" || node.kind === "group") &&
        node.childIds.length > 0
      ) {
        return node.id;
      }
      node = node.parentId ? document.nodes[node.parentId] : undefined;
    }
    return undefined;
  }

  private screenBoundsToWorld(bounds: Rect): Rect {
    const viewport = this.kernel.getState().viewport;
    const start = screenToWorld({ x: bounds.x, y: bounds.y }, viewport);
    const end = screenToWorld(
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      viewport,
    );
    return {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  }

  private finish(cancelled: boolean): void {
    if (this.transactionArmed) {
      if (cancelled) this.kernel.rollback();
      else this.kernel.commit();
    }
    this.moveStart = undefined;
    this.marqueeScope = undefined;
    this.resizeStart = undefined;
    this.rotateStart = undefined;
    this.transactionArmed = false;
  }
}
