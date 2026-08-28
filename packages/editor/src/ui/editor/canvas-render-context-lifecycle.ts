interface ResolutionMediaQuery {
  addEventListener(type: "change", listener: () => void): void;
  removeEventListener(type: "change", listener: () => void): void;
}

export interface CanvasRenderSize {
  width: number;
  height: number;
  pixelRatio: number;
}

interface CanvasRenderContextLifecycleOptions {
  readPixelRatio: () => number;
  /** Reads the same CSS viewport dimensions and DPR used to build a packet. */
  readRenderSize?: () => CanvasRenderSize;
  matchMedia?: (query: string) => ResolutionMediaQuery;
  invalidateAcceptedContext: () => void;
  markResizeDirty: () => void;
}

const normalizedPixelRatio = (value: number): number =>
  Number.isFinite(value) ? Math.max(1, value) : 1;

/** Coordinates the browser signals that can make an accepted canvas packet
 * stale before the next render. It invalidates only; rendering remains on rAF. */
export class CanvasRenderContextLifecycle {
  private pixelRatio: number;
  private renderSize: CanvasRenderSize | undefined;
  private resolutionQuery: ResolutionMediaQuery | undefined;
  private resolutionListener: (() => void) | undefined;
  private generation = 0;
  private disposed = false;

  constructor(private readonly options: CanvasRenderContextLifecycleOptions) {
    this.pixelRatio = normalizedPixelRatio(options.readPixelRatio());
    this.renderSize = options.readRenderSize?.();
    this.watchPixelRatio();
  }

  canvasResized(): void {
    if (this.disposed) return;
    this.options.invalidateAcceptedContext();
    this.options.markResizeDirty();
  }

  /** Pointer handlers call this before entering the interaction reducer, which
   * closes the DPR-change window even if the media-query event is delayed. */
  beforeInteraction(): void {
    this.synchronizeRenderContext();
  }

  /** The idle rAF check is one scalar comparison. Packet construction remains
   * lazy and occurs only after invalidation marks the existing render dirty. */
  observeFramePixelRatio(): number {
    this.synchronizeRenderContext();
    return this.pixelRatio;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.generation += 1;
    this.unwatchPixelRatio();
  }

  private synchronizeRenderContext(): void {
    if (this.disposed) return;
    const nextRenderSize = this.options.readRenderSize?.();
    const next = normalizedPixelRatio(
      nextRenderSize?.pixelRatio ?? this.options.readPixelRatio(),
    );
    const pixelRatioChanged = next !== this.pixelRatio;
    const sizeChanged =
      nextRenderSize !== undefined &&
      (this.renderSize === undefined ||
        nextRenderSize.width !== this.renderSize.width ||
        nextRenderSize.height !== this.renderSize.height ||
        nextRenderSize.pixelRatio !== this.renderSize.pixelRatio);
    if (!pixelRatioChanged && !sizeChanged) return;
    this.pixelRatio = next;
    this.renderSize = nextRenderSize;
    this.options.invalidateAcceptedContext();
    this.options.markResizeDirty();
    if (pixelRatioChanged) this.watchPixelRatio();
  }

  private watchPixelRatio(): void {
    this.unwatchPixelRatio();
    if (!this.options.matchMedia || this.disposed) return;
    const generation = ++this.generation;
    const query = this.options.matchMedia(
      `(resolution: ${this.pixelRatio}dppx)`,
    );
    const listener = (): void => {
      if (this.disposed || generation !== this.generation) return;
      // The old resolution query changing is itself proof that the accepted
      // packet may be stale. Invalidate even if the DPR getter has not caught
      // up to the event yet; pointer/rAF checks will observe the eventual value.
      this.options.invalidateAcceptedContext();
      this.options.markResizeDirty();
      this.pixelRatio = normalizedPixelRatio(this.options.readPixelRatio());
      this.watchPixelRatio();
    };
    this.resolutionQuery = query;
    this.resolutionListener = listener;
    query.addEventListener("change", listener);
  }

  private unwatchPixelRatio(): void {
    if (this.resolutionQuery && this.resolutionListener) {
      this.resolutionQuery.removeEventListener(
        "change",
        this.resolutionListener,
      );
    }
    this.resolutionQuery = undefined;
    this.resolutionListener = undefined;
  }
}
