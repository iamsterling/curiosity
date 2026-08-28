import type { DrawChromeGlassSurface } from "@crafty/scene-renderer";

/**
 * The chrome glass springs and tracker: the floating chrome's pills measured
 * every frame (canvas-relative CSS-px rects), their press/hover lift states
 * from DOM listeners, and the spring integrator that turns those 0/1 inputs
 * into the packet's `scaleX`/`scaleY`/`pressed`/`hovered` values.
 *
 * The integrator is the demo's spring model (semi-implicit Euler, sub-stepped
 * at 1/120, per-property stiffness/damping), re-implemented here in the
 * editor's own terms — the recorded constants: deformationX/Y 300/15 (the
 * underdamped liquid overshoot), glassBgOpacity 800/50, specularOpacity
 * 420/20. Kernel-free, no React on the path; the canvas stage integrates with
 * rAF dt and packs the result into the render packet.
 */

export interface SpringState {
  value: number;
  velocity: number;
}

export const springAtRest = (value: number): SpringState => ({ value, velocity: 0 });

const SPRING_SUBSTEP = 1 / 120;

/** One semi-implicit Euler step toward `target` (Hooke + damping). */
export const stepSpring = (
  state: SpringState,
  target: number,
  stiffness: number,
  damping: number,
  dt: number,
): SpringState => {
  const velocity =
    state.velocity + (target - state.value) * stiffness * dt - state.velocity * damping * dt;
  return { value: state.value + velocity * dt, velocity };
};

/** Integrate a spring over `dt`, sub-stepped at 1/120 so fast springs stay
 *  stable at any frame rate. */
export const integrateSpring = (
  state: SpringState,
  target: number,
  stiffness: number,
  damping: number,
  dt: number,
): SpringState => {
  let next = state;
  const clamped = Math.min(dt, 1 / 6);
  let remaining = clamped;
  while (remaining > 0) {
    const step = Math.min(SPRING_SUBSTEP, remaining);
    next = stepSpring(next, target, stiffness, damping, step);
    remaining -= step;
  }
  return next;
};

/** The spring constants per property (the recorded demo values). */
export const CHROME_SPRINGS = {
  scale: { stiffness: 300, damping: 15 },
  pressed: { stiffness: 800, damping: 50 },
  hovered: { stiffness: 420, damping: 20 },
} as const;

/** The press squash target: the pill compresses ~7% (the overshoot carries
 *  it further, then settles). */
export const PRESS_SQUASH = 0.93 as const;

/** Per-element spring set + the DOM-derived 0/1 inputs. */
export interface ChromeGlassSprings {
  scaleX: SpringState;
  scaleY: SpringState;
  pressed: SpringState;
  hovered: SpringState;
  pressedTarget: 0 | 1;
  hoveredTarget: 0 | 1;
}

export const chromeGlassSprings = (): ChromeGlassSprings => ({
  scaleX: springAtRest(1),
  scaleY: springAtRest(1),
  pressed: springAtRest(0),
  hovered: springAtRest(0),
  pressedTarget: 0,
  hoveredTarget: 0,
});

/** Integrate one element's springs toward its current input targets. A
 *  spring within epsilon of its target with negligible velocity is snapped
 *  and parked: the packet then carries exactly its target (0/1/1) at rest,
 *  the chrome change key stabilizes, and the draw loop idles — without the
 *  park, the decay oscillation keeps re-rendering every frame at rest. */
export const integrateChromeGlassSprings = (
  springs: ChromeGlassSprings,
  dt: number,
): void => {
  const squash = springs.pressedTarget === 1 ? PRESS_SQUASH : 1;
  springs.scaleX = park(integrateSpring(springs.scaleX, squash, CHROME_SPRINGS.scale.stiffness, CHROME_SPRINGS.scale.damping, dt), squash);
  springs.scaleY = park(integrateSpring(springs.scaleY, squash, CHROME_SPRINGS.scale.stiffness, CHROME_SPRINGS.scale.damping, dt), squash);
  springs.pressed = park(integrateSpring(springs.pressed, springs.pressedTarget, CHROME_SPRINGS.pressed.stiffness, CHROME_SPRINGS.pressed.damping, dt), springs.pressedTarget);
  springs.hovered = park(integrateSpring(springs.hovered, springs.hoveredTarget, CHROME_SPRINGS.hovered.stiffness, CHROME_SPRINGS.hovered.damping, dt), springs.hoveredTarget);
};

const park = (state: SpringState, target: number): SpringState =>
  Math.abs(state.value - target) < 1e-3 && Math.abs(state.velocity) < 1e-3
    ? { value: target, velocity: 0 }
    : state;

/** The DOM selector for chrome glass surfaces; `data-chrome-radius` carries
 *  the pill's CSS-px corner radius. */
export const CHROME_GLASS_SELECTOR = "[data-chrome-glass]" as const;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Measures the chrome pills and drives their springs. Constructor is DOM-free
 * (SSR-safe); `attach` and `measure` run in the canvas stage's rAF loop.
 * Listener wiring is lazy per element — a pill gets its press/hover listeners
 * the first frame it is measured, so panels opening mid-session work.
 */
export class ChromeGlassTracker {
  private readonly elements = new Map<HTMLElement, ChromeGlassSprings>();

  attach(element: HTMLElement): ChromeGlassSprings {
    let springs = this.elements.get(element);
    if (springs) return springs;
    springs = chromeGlassSprings();
    this.elements.set(element, springs);
    element.addEventListener("pointerenter", () => {
      springs!.hoveredTarget = 1;
    });
    element.addEventListener("pointerleave", () => {
      springs!.hoveredTarget = 0;
      springs!.pressedTarget = 0;
    });
    element.addEventListener("pointerdown", () => {
      springs!.pressedTarget = 1;
    });
    element.addEventListener("pointerup", () => {
      springs!.pressedTarget = 0;
    });
    element.addEventListener("pointercancel", () => {
      springs!.pressedTarget = 0;
    });
    return springs;
  }

  /** Integrate every live element's springs with rAF dt (clamped; the
   *  integrator sub-steps internally). */
  update(dt: number): void {
    for (const [element, springs] of this.elements) {
      if (!element.isConnected) {
        this.elements.delete(element);
        continue;
      }
      integrateChromeGlassSprings(springs, dt);
    }
  }

  /** Measure the live pills into packet surfaces, canvas-relative. The
   *  shadow quad padding is the module's constant, applied at draw time —
   *  the packet bounds stay exactly the DOM rects so the transparent DOM
   *  buttons line up with the drawn glass. */
  measure(canvasRect: DOMRect): DrawChromeGlassSurface[] {
    const surfaces: DrawChromeGlassSurface[] = [];
    for (const [element, springs] of this.elements) {
      if (!element.isConnected) continue;
      const rect = element.getBoundingClientRect();
      const radius = Number(element.getAttribute("data-chrome-radius"));
      surfaces.push({
        id: element.id || element.dataset.chromeGlassId || `chrome-${surfaces.length}`,
        bounds: {
          x: rect.left - canvasRect.left,
          y: rect.top - canvasRect.top,
          width: rect.width,
          height: rect.height,
        },
        radius: Number.isFinite(radius) && radius >= 0 ? radius : 0,
        scaleX: clamp01(springs.scaleX.value),
        scaleY: clamp01(springs.scaleY.value),
        pressed: clamp01(springs.pressed.value),
        hovered: clamp01(springs.hovered.value),
      });
    }
    return surfaces;
  }

  dispose(): void {
    this.elements.clear();
  }
}
