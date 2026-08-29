import {
  initialInteractionState,
  screenToWorld,
  transitionInteraction,
  type EditorKernel,
  type InteractionContext,
  type InteractionEffect,
  type InteractionState,
  type ShapeCreationStyle,
} from "@crafty/editor/kernel";
import type { CanvasPointerInput } from "../../modules/curiosity-canvas";
import { toCraftyPointerInput } from "./crafty-pointer-input";

const DRAG_THRESHOLD = 4;

export type CraftyCreationTool = "rectangle" | "ellipse" | "line" | "frame";

export class CraftyCreationInteraction {
  private interaction: InteractionState;
  private style?: ShapeCreationStyle;

  public constructor(
    private readonly kernel: EditorKernel,
    tool: CraftyCreationTool,
  ) {
    this.interaction = initialInteractionState(tool);
  }

  public handle = (input: CanvasPointerInput): void => {
    if (input.phase === "down") {
      this.style = { ...this.kernel.getState().creationStyle };
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
      this.style = undefined;
    }
  };

  private context(): InteractionContext {
    return {
      dragThreshold: DRAG_THRESHOLD,
      hitTest: () => undefined,
      viewport: this.kernel.getState().viewport,
    };
  }

  private applyEffect(effect: InteractionEffect): void {
    if (effect.type === "commit-rectangle") {
      this.commitBox("rectangle", effect.bounds);
      return;
    }
    if (effect.type === "commit-ellipse") {
      this.commitBox("ellipse", effect.bounds);
      return;
    }
    if (effect.type === "commit-frame") {
      this.commitBox("frame", effect.bounds);
      return;
    }
    if (effect.type === "commit-line") {
      const viewport = this.kernel.getState().viewport;
      this.kernel.createShape(
        {
          tool: "line",
          start: screenToWorld(effect.start, viewport),
          end: screenToWorld(effect.end, viewport),
        },
        this.style,
      );
    }
  }

  private commitBox(
    tool: Exclude<CraftyCreationTool, "line">,
    bounds: Readonly<{ x: number; y: number; width: number; height: number }>,
  ): void {
    const viewport = this.kernel.getState().viewport;
    const start = screenToWorld({ x: bounds.x, y: bounds.y }, viewport);
    const end = screenToWorld(
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      viewport,
    );
    this.kernel.createShape(
      {
        tool,
        bounds: {
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          width: Math.abs(end.x - start.x),
          height: Math.abs(end.y - start.y),
        },
      },
      this.style,
    );
  }
}
