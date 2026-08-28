import { describe, expect, it, vi } from "vitest";

import { CanvasRenderContextLifecycle } from "./canvas-render-context-lifecycle.js";
import { GridHostRenderLoop } from "./grid-host-render-loop.js";

class FakeResolutionQuery {
  private listeners = new Set<() => void>();

  addEventListener(_type: "change", listener: () => void): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: "change", listener: () => void): void {
    this.listeners.delete(listener);
  }

  change(): void {
    for (const listener of [...this.listeners]) listener();
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}

describe("canvas render-context lifecycle", () => {
  it("clears accepted context synchronously on a canvas resize before rAF", () => {
    let accepted = true;
    let resizeDirty = false;
    const lifecycle = new CanvasRenderContextLifecycle({
      readPixelRatio: () => 1,
      invalidateAcceptedContext: () => {
        accepted = false;
      },
      markResizeDirty: () => {
        resizeDirty = true;
      },
    });

    lifecycle.canvasResized();

    expect(accepted).toBe(false);
    expect(resizeDirty).toBe(true);
  });

  it("clears before pointer work when DPR changes before rAF and restores after matching success", () => {
    let pixelRatio = 1;
    let accepted: { pixelRatio: number } | undefined = { pixelRatio };
    const lifecycle = new CanvasRenderContextLifecycle({
      readPixelRatio: () => pixelRatio,
      invalidateAcceptedContext: () => {
        accepted = undefined;
      },
      markResizeDirty: () => {},
    });

    pixelRatio = 2;
    lifecycle.beforeInteraction();
    expect(accepted).toBeUndefined();

    const loop = new GridHostRenderLoop<
      { pixelRatio: number },
      { ok: boolean }
    >();
    loop.rendererCreated();
    loop.frame({
      timestamp: 0,
      targetOpacity: 0.6,
      renderRevision: 1,
      lastRendered: 0,
      resizeDirty: true,
      chromeChanged: false,
      hasAgentActivities: false,
      buildPacket: () => ({
        pixelRatio: lifecycle.observeFramePixelRatio(),
      }),
      submit: () => ({ ok: true }),
      publishAcceptedGridRenderContext: (packet, _opacity, result) => {
        accepted = result.ok ? packet : undefined;
      },
    });
    expect(accepted).toEqual({ pixelRatio: 2 });
  });

  it.each([
    ["width", { width: 801, height: 600, pixelRatio: 1 }],
    ["height", { width: 800, height: 601, pixelRatio: 1 }],
    ["pixel ratio", { width: 800, height: 600, pixelRatio: 2 }],
  ])(
    "clears accepted context before pointer work when live canvas %s changes before ResizeObserver",
    (_dimension, changedSize) => {
      let liveSize = { width: 800, height: 600, pixelRatio: 1 };
      const invalidateAcceptedContext = vi.fn();
      const lifecycle = new CanvasRenderContextLifecycle({
        readPixelRatio: () => liveSize.pixelRatio,
        readRenderSize: () => liveSize,
        invalidateAcceptedContext,
        markResizeDirty: vi.fn(),
      });

      liveSize = changedSize;
      lifecycle.beforeInteraction();

      expect(invalidateAcceptedContext).toHaveBeenCalledOnce();
    },
  );

  it("does not clear accepted context before pointer work when live canvas size and DPR match", () => {
    const liveSize = { width: 800, height: 600, pixelRatio: 1 };
    const invalidateAcceptedContext = vi.fn();
    const lifecycle = new CanvasRenderContextLifecycle({
      readPixelRatio: () => liveSize.pixelRatio,
      readRenderSize: () => liveSize,
      invalidateAcceptedContext,
      markResizeDirty: vi.fn(),
    });

    lifecycle.beforeInteraction();

    expect(invalidateAcceptedContext).not.toHaveBeenCalled();
  });

  it("observes DPR-only media-query changes without waiting for rAF", () => {
    let pixelRatio = 1;
    let accepted = true;
    const queries: FakeResolutionQuery[] = [];
    const lifecycle = new CanvasRenderContextLifecycle({
      readPixelRatio: () => pixelRatio,
      matchMedia: () => {
        const query = new FakeResolutionQuery();
        queries.push(query);
        return query;
      },
      invalidateAcceptedContext: () => {
        accepted = false;
      },
      markResizeDirty: () => {},
    });

    pixelRatio = 2;
    queries[0]?.change();

    expect(accepted).toBe(false);
    expect(queries).toHaveLength(2);
    expect(queries[0]?.listenerCount).toBe(0);
    expect(queries[1]?.listenerCount).toBe(1);
    lifecycle.dispose();
  });

  it("removes listeners and ignores stale callbacks after disposal or replacement", () => {
    const firstQuery = new FakeResolutionQuery();
    const secondQuery = new FakeResolutionQuery();
    const firstInvalidation = vi.fn();
    const secondInvalidation = vi.fn();
    const first = new CanvasRenderContextLifecycle({
      readPixelRatio: () => 1,
      matchMedia: () => firstQuery,
      invalidateAcceptedContext: firstInvalidation,
      markResizeDirty: () => {},
    });
    const staleChange = firstQuery.change.bind(firstQuery);

    first.dispose();
    const replacement = new CanvasRenderContextLifecycle({
      readPixelRatio: () => 2,
      matchMedia: () => secondQuery,
      invalidateAcceptedContext: secondInvalidation,
      markResizeDirty: () => {},
    });
    staleChange();
    first.canvasResized();

    expect(firstQuery.listenerCount).toBe(0);
    expect(firstInvalidation).not.toHaveBeenCalled();
    expect(secondInvalidation).not.toHaveBeenCalled();
    expect(secondQuery.listenerCount).toBe(1);
    replacement.dispose();
    expect(secondQuery.listenerCount).toBe(0);
  });
});
