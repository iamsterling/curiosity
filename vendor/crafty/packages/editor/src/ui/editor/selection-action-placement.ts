import {
  transformPoint,
  worldToScreen,
  type AffineTransform,
  type Rect,
  type Viewport,
} from "../../kernel/index.js";

export interface SelectionProjectionBox {
  bounds: Rect;
  transform: AffineTransform;
}

export interface ScreenAabb {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const projectSelectionScreenAabb = (
  box: SelectionProjectionBox,
  viewport: Viewport,
): ScreenAabb => {
  const { bounds } = box;
  const corners = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x, y: bounds.y + bounds.height },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
  ].map((point) => worldToScreen(transformPoint(point, box.transform), viewport));
  const x = Math.min(...corners.map((point) => point.x));
  const y = Math.min(...corners.map((point) => point.y));
  return {
    x,
    y,
    width: Math.max(...corners.map((point) => point.x)) - x,
    height: Math.max(...corners.map((point) => point.y)) - y,
  };
};

export type SelectionActionPlacement =
  | { hidden: true }
  | { hidden: false; x: number; y: number; side: "above" | "below" };

export interface SelectionActionPlacementInputs {
  element: HTMLElement | null;
  selectionBox: SelectionProjectionBox | undefined;
  viewport: Viewport;
  stage: { width: number; height: number };
  surface: { width: number; height: number };
}

export const placeSelectionActions = (
  selectionBox: SelectionProjectionBox | undefined,
  viewport: Viewport,
  stage: { width: number; height: number },
  surface: { width: number; height: number },
): SelectionActionPlacement => {
  if (
    !selectionBox ||
    !Number.isFinite(viewport.zoom) ||
    viewport.zoom <= 0 ||
    stage.width <= 0 ||
    stage.height <= 0 ||
    surface.width <= 0 ||
    surface.height <= 0
  ) return { hidden: true };
  const box = projectSelectionScreenAabb(selectionBox, viewport);
  const intersectionWidth = Math.min(box.x + box.width, stage.width) - Math.max(box.x, 0);
  const intersectionHeight = Math.min(box.y + box.height, stage.height) - Math.max(box.y, 0);
  if (intersectionWidth <= 0 || intersectionHeight <= 0) return { hidden: true };
  const centered = box.x + box.width / 2 - surface.width / 2;
  const x = surface.width <= stage.width
    ? Math.min(stage.width - surface.width, Math.max(0, centered))
    : centered;
  const above = box.y - 10 - surface.height;
  return above >= 0
    ? { hidden: false, x, y: above, side: "above" }
    : { hidden: false, x, y: box.y + box.height + 10, side: "below" };
};

export const positionSelectionActionElement = (
  element: HTMLElement | null,
  selectionBox: SelectionProjectionBox | undefined,
  viewport: Viewport,
  stage: { width: number; height: number },
  surface: { width: number; height: number },
): void => {
  if (!element) return;
  const placement = placeSelectionActions(selectionBox, viewport, stage, surface);
  element.style.visibility = placement.hidden ? "hidden" : "visible";
  if (!placement.hidden) element.style.transform = `translate3d(${placement.x}px, ${placement.y}px, 0)`;
};

const sameSelectionBox = (
  left: SelectionProjectionBox | undefined,
  right: SelectionProjectionBox | undefined,
): boolean =>
  left === right ||
  (!!left &&
    !!right &&
    left.bounds.x === right.bounds.x &&
    left.bounds.y === right.bounds.y &&
    left.bounds.width === right.bounds.width &&
    left.bounds.height === right.bounds.height &&
    left.transform.a === right.transform.a &&
    left.transform.b === right.transform.b &&
    left.transform.c === right.transform.c &&
    left.transform.d === right.transform.d &&
    left.transform.e === right.transform.e &&
    left.transform.f === right.transform.f);

const sameInputs = (
  left: SelectionActionPlacementInputs,
  right: SelectionActionPlacementInputs,
): boolean =>
  left.element === right.element &&
  sameSelectionBox(left.selectionBox, right.selectionBox) &&
  left.viewport.panX === right.viewport.panX &&
  left.viewport.panY === right.viewport.panY &&
  left.viewport.zoom === right.viewport.zoom &&
  left.stage.width === right.stage.width &&
  left.stage.height === right.stage.height &&
  left.surface.width === right.surface.width &&
  left.surface.height === right.surface.height;

/**
 * The rAF loop calls this every frame, but unchanged scalar inputs stop before
 * placement work or DOM writes. ResizeObserver owns surface measurement; this
 * coordinator consumes only its cached size and never reads layout itself.
 */
export class SelectionActionPlacementCoordinator {
  private previous: SelectionActionPlacementInputs | undefined;
  private applied:
    | { element: HTMLElement; placement: SelectionActionPlacement }
    | undefined;

  update(inputs: SelectionActionPlacementInputs): boolean {
    if (this.previous && sameInputs(this.previous, inputs)) return false;
    this.previous = inputs;
    const element = inputs.element;
    if (!element) {
      this.applied = undefined;
      return true;
    }
    const placement = placeSelectionActions(
      inputs.selectionBox,
      inputs.viewport,
      inputs.stage,
      inputs.surface,
    );
    const previous = this.applied?.element === element
      ? this.applied.placement
      : undefined;
    if (!previous || previous.hidden !== placement.hidden)
      element.style.visibility = placement.hidden ? "hidden" : "visible";
    if (!placement.hidden) {
      const transform = `translate3d(${placement.x}px, ${placement.y}px, 0)`;
      if (
        !previous ||
        previous.hidden ||
        previous.x !== placement.x ||
        previous.y !== placement.y
      ) element.style.transform = transform;
    }
    this.applied = { element, placement };
    return true;
  }
}
