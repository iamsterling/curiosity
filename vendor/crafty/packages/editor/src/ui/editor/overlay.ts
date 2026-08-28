import {
  gridPlan,
  GRID_MAX_OPACITY,
  gridVisibilityProgressAt,
  isZoomDrivenGridDisplayed,
  type GridDescriptor,
  type GridLine,
  type PageRecord,
} from "../../kernel/index.js";
import { WORLD_LIMIT } from "../../kernel/index.js";
import type { DrawOverlayPacket, Viewport } from "@crafty/scene-renderer";

export const GRID_OPACITY_TRANSITION_SECONDS = 0.45 as const;

export const gridOpacityAt = (zoom: number): number =>
  gridVisibilityProgressAt({ zoom }) * GRID_MAX_OPACITY;

/** Host-owned transition state; the grid plan remains a pure kernel service. */
export class GridOpacityTransition {
  opacity = 0;
  private submittedOpacity = 0;
  private submittedTarget = 0;
  private segmentStart = 0;
  private segmentEnd = 0;
  private segmentElapsed = 0;
  private settleAfterReversal = false;

  get isActive(): boolean {
    return this.opacity !== this.target;
  }

  get needsRender(): boolean {
    return (
      this.opacity !== this.submittedOpacity ||
      this.target !== this.submittedTarget
    );
  }

  private target = 0;

  advance(target: number, elapsedSeconds: number): number {
    if (target !== this.target) {
      const previousTarget = this.target;
      const wasActive = this.isActive;
      this.target = target;
      this.segmentStart = this.opacity;
      this.segmentElapsed = 0;
      // During an unfinished reveal, a lower zoom target must first reverse
      // the visible motion even when that target remains above the current
      // opacity. Scaling by the target ratio gives that reversal a positive,
      // bounded endpoint; a fresh 450 ms segment prevents a capped rAF delta
      // from skipping across it.
      this.segmentEnd =
        target < previousTarget &&
        wasActive &&
        target > this.opacity &&
        previousTarget > 0
          ? (this.opacity * target) / previousTarget
          : target;
      this.settleAfterReversal = this.segmentEnd !== target;
    }

    if (this.opacity !== this.segmentEnd) {
      this.segmentElapsed = Math.min(
        GRID_OPACITY_TRANSITION_SECONDS,
        this.segmentElapsed + Math.max(0, elapsedSeconds),
      );
      const progress = this.segmentElapsed / GRID_OPACITY_TRANSITION_SECONDS;
      this.opacity =
        this.segmentStart + (this.segmentEnd - this.segmentStart) * progress;
      if (
        this.segmentElapsed >=
        GRID_OPACITY_TRANSITION_SECONDS - Number.EPSILON
      ) {
        this.opacity = this.segmentEnd;
        if (this.settleAfterReversal) {
          this.segmentStart = this.opacity;
          this.segmentEnd = this.target;
          this.segmentElapsed = 0;
          this.settleAfterReversal = false;
        }
      }
    }
    return this.opacity;
  }

  markSubmitted(): void {
    this.submittedOpacity = this.opacity;
    this.submittedTarget = this.target;
  }

  reconcileAfterRendererReset(): void {
    this.submittedOpacity = Number.NaN;
  }
}

/**
 * Builds the kernel-neutral `DrawOverlayPacket` for the active page from the
 * kernel grid/guide services. The renderer host consumes this packet to draw
 * the adaptive grid and guides as overlays — never authored geometry.
 * Kernel-neutral: this module only translates shapes.
 */

export interface PageOverlay {
  packet: DrawOverlayPacket;
  level: number;
}

export const pageOverlay = (
  page: PageRecord | undefined,
  viewport: Viewport,
  canvasSize: { width: number; height: number },
  animatedGridOpacity?: number,
): PageOverlay | undefined => {
  if (!page) return undefined;
  const gridViewport = {
    panX: viewport.panX,
    panY: viewport.panY,
    zoom: viewport.zoom,
    width: Math.max(1, canvasSize.width),
    height: Math.max(1, canvasSize.height),
  };
  const grid: GridDescriptor = page.canvas.grid;
  const plan = gridPlan(gridViewport, grid, WORLD_LIMIT);
  const guides = page.canvas.guides
    .filter((guide) => guide.visible)
    .map((guide) => ({
      id: guide.id,
      axis: guide.axis,
      position: guide.position,
      visible: guide.visible,
    }));
  // The grid is a canvas affordance strictly above 510%. `visible` remains
  // readable for older documents, but it does not control emission.
  const gridOpacity = animatedGridOpacity ?? gridOpacityAt(viewport.zoom);
  const gridVisible = isZoomDrivenGridDisplayed(gridViewport, grid) && gridOpacity > 0;
  const fadeLine = (line: GridLine) => ({
    ...line,
    alpha: (line.alpha ?? 1) * gridOpacity,
  });

  return {
    level: plan.level,
    packet: {
      ...(gridVisible
        ? {
            grid: {
              mode: grid.mode,
              level: plan.level,
              minorStep: plan.minorStep,
              majorStep: plan.majorStep,
              lines: plan.lines.map(fadeLine),
              ...(plan.dots
                ? {
                    dots: plan.dots.map((dot) => ({
                      ...dot,
                      alpha: (dot.alpha ?? 1) * gridOpacity,
                    })),
                  }
                : {}),
              ...(plan.axes.length > 0
                ? { axes: plan.axes.map(fadeLine) }
                : {}),
            },
          }
        : {}),
      ...(guides.length > 0 ? { guides } : {}),
    },
  };
};
