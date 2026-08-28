"use client";

import { useEffect, useLayoutEffect, useState, type RefObject } from "react";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

function findEl(target: string | RefObject<HTMLElement | null>): HTMLElement | null {
  return typeof target === "string" ? document.querySelector(target) : target.current;
}

/**
 * Progress of a tall section whose first child is `position: sticky`.
 *
 * 0 when the sticky stage first pins, 1 when the section's bottom edge reaches
 * it. Quantised to `steps` so a render only happens when something can visibly
 * change — the raw value updates every frame, this one updates ~once per 8px.
 *
 * ## Why this measures the stage instead of the window
 *
 * The obvious formula is `sectionHeight - (window.innerHeight - stickyTop)`.
 * It is wrong on mobile Safari, and wrong in a way that reads as "scrollytelling
 * is broken" rather than as a rounding error.
 *
 * The stage is sized in `svh` — the *small* viewport, the height you get with
 * the browser toolbars showing. `window.innerHeight` reports the *current*
 * visual viewport, which grows to the large viewport as Safari retracts its
 * toolbars during a scroll. So the two disagree by the toolbar height, and the
 * disagreement changes while the user is scrolling:
 *
 *   - computed travel is short by ~toolbar height, so progress hits 1 early and
 *     the last screens of the section play nothing;
 *   - `innerHeight` changing mid-gesture moves the denominator under a scroll
 *     already in flight, so progress jumps rather than advances.
 *
 * Measuring the sticky child's own `getBoundingClientRect().height` sidesteps
 * all of it: whatever unit the CSS chose, that is the height actually being
 * pinned, so the arithmetic agrees with the layout by construction.
 */
export function useScrollScene(
  target: string | RefObject<HTMLElement | null>,
  { stickyTop = 0, steps = 500 }: { stickyTop?: number; steps?: number } = {}
): number {
  const [step, setStep] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const el = findEl(target);
    if (!el) return;

    // The pinned child, whose height is the part of the section that does not
    // scroll. Falls back to the viewport if the section has no element child —
    // wrong in the way described above, but better than dividing by zero.
    const stageHeight = (): number => {
      const stage = el.firstElementChild;
      const h = stage instanceof HTMLElement ? stage.getBoundingClientRect().height : 0;
      return h > 0 ? h : window.innerHeight - stickyTop;
    };

    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const travel = rect.height - stageHeight();
      const p = travel <= 0 ? 0 : clamp01((stickyTop - rect.top) / travel);
      setStep(Math.round(p * steps));
    };

    // Coalesce to one measurement per frame. Reading `getBoundingClientRect`
    // straight out of a scroll handler forces a synchronous layout on every
    // event, and iOS delivers scroll events in bursts during momentum — the
    // reads pile up and the scene stutters exactly when it should be smoothest.
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);

    // Safari resizes the visual viewport without firing `resize` on the window
    // when its toolbars slide away. Without this the scene keeps using the
    // pre-collapse measurement until the next scroll event happens to land.
    const vv = window.visualViewport;
    vv?.addEventListener("resize", schedule);

    // The stage height is not constant — `svh` changes with orientation, and
    // fonts landing late reflow the section. Watching both beats guessing when
    // they settle.
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    if (el.firstElementChild instanceof HTMLElement) ro.observe(el.firstElementChild);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      vv?.removeEventListener("resize", schedule);
      ro.disconnect();
    };
  }, [target, stickyTop, steps]);

  return step / steps;
}

/** True once mounted if the user asked for less motion. False during SSR. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}

/**
 * True while the viewport is at or below `width`.
 *
 * False during SSR and on the first client render, so the markup the server
 * produced and the markup React first commits agree; the real value lands in an
 * effect. Anything gated on this must therefore be safe to render in its
 * desktop form for one frame.
 */
export function useNarrow(width = 768): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${width}px)`);
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [width]);

  return narrow;
}
