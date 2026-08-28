import { GridOpacityTransition } from "./overlay.js";

export interface GridHostFrameState {
  timestamp: number;
  targetOpacity: number;
  renderRevision: number;
  lastRendered: number;
  resizeDirty: boolean;
  chromeChanged: boolean;
  hasAgentActivities: boolean;
}

export interface GridHostFrameInput<Packet, Result> extends GridHostFrameState {
  publishAcceptedGridRenderContext: (
    packet: Packet,
    opacity: number,
    result: Result,
  ) => void;
  buildPacket: (opacity: number) => Packet;
  submit: (packet: Packet) => Result;
}

export type GridHostFrameResult<Result> =
  | { emitted: false; opacity: number }
  | { emitted: true; opacity: number; result: Result };

export type RendererCreationCause =
  "initial-creation" | "recreation" | "device-recovery";

/** Production-used lifecycle events keep renderer reset causes explicit. */
export class RendererLifecycleCoordinator {
  private generation = 0;

  constructor(
    private readonly reconcile: (cause: RendererCreationCause) => void,
  ) {}

  rendererInitiallyCreated(): void {
    this.reconcile("initial-creation");
  }

  rendererRecreated(): void {
    this.reconcile("recreation");
  }

  rendererRecovered(): void {
    this.reconcile("device-recovery");
  }

  beginDeviceRecovery(): number {
    return this.generation;
  }

  completeDeviceRecovery(token: number): boolean {
    return token === this.generation;
  }

  replace(): void {
    this.generation += 1;
  }
}

/** Purely host-side rAF seam shared by CanvasStage and renderer-free tests. */
export class GridHostRenderLoop<Packet, Result> {
  private readonly transition = new GridOpacityTransition();
  private lastTimestamp: number | undefined;

  get opacity(): number {
    return this.transition.opacity;
  }

  rendererCreated(): void {
    this.lastTimestamp = undefined;
    this.transition.reconcileAfterRendererReset();
  }

  frame(
    input: GridHostFrameInput<Packet, Result>,
  ): GridHostFrameResult<Result> {
    const elapsedSeconds =
      this.lastTimestamp === undefined
        ? 0
        : Math.min(
            0.25,
            Math.max(0, input.timestamp - this.lastTimestamp) / 1000,
          );
    this.lastTimestamp = input.timestamp;
    this.transition.advance(input.targetOpacity, elapsedSeconds);
    if (!(
      input.renderRevision !== input.lastRendered ||
      input.resizeDirty ||
      input.chromeChanged ||
      this.transition.needsRender ||
      input.hasAgentActivities
    ))
      return { emitted: false, opacity: this.transition.opacity };

    const packet = input.buildPacket(this.transition.opacity);
    const result = input.submit(packet);
    // Publish with the submission result so the production host can keep a
    // failed packet ineligible. JavaScript cannot interleave pointer input
    // within this synchronous build/submit/publish sequence.
    input.publishAcceptedGridRenderContext(
      packet,
      this.transition.opacity,
      result,
    );
    // Every attempted submission consumes the host animation frame. Renderer
    // retry policy is independent and must explicitly schedule its own cause.
    this.transition.markSubmitted();
    return { emitted: true, opacity: this.transition.opacity, result };
  }
}
