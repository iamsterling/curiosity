import { describe, expect, test } from "vitest";
import { applyEvaluatedValues, evaluateActiveTransitions, evaluateResolvedSceneAnimations, type ActiveTransitionPlayback, type PrototypeConnection } from "./animation-resolution.js";
import { createFoundationDocument, type DocumentNode } from "./document.js";
import { resolveScene } from "./component-resolution.js";

const rectangle = (id: string, parentId: string): DocumentNode => ({
  id,
  kind: "rectangle",
  name: id,
  parentId,
  childIds: [],
  bounds: { x: 0, y: 0, width: 100, height: 80 },
  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  visible: true,
  locked: false,
  opacity: 1,
  fill: "#112233",
  stroke: "#445566",
  cornerRadius: 0,
  zIndex: 1,
});

const connection: PrototypeConnection = {
  id: "connection-card-hover",
  sourceNodeId: "card",
  trigger: { kind: "hover" },
  action: { kind: "set-state", target: "card", stateSelection: { state: "hover" } },
  transition: { kind: "tween", durationMs: 200, easing: "linear" },
};

const playback = (overrides?: Partial<ActiveTransitionPlayback>): ActiveTransitionPlayback => ({
  connection,
  startedAtMs: 100,
  from: { card: { opacity: 0.2, cornerRadius: 8, fill: "#112233", visible: true } },
  to: { card: { opacity: 0.8, cornerRadius: 20, fill: "#abcdef", visible: false } },
  ...overrides,
});

describe("animation resolution seam", () => {
  test("evaluates tweened values deterministically without mutating endpoints", () => {
    const active = playback();
    const first = evaluateActiveTransitions([active], 200);
    const second = evaluateActiveTransitions([active], 200);
    expect(first).toEqual(second);
    expect(active.from.card?.opacity).toBe(0.2);
    expect(active.to.card?.opacity).toBe(0.8);
    expect(first.values.card?.opacity).toBeCloseTo(0.5);
    expect(first.values.card?.cornerRadius).toBeCloseTo(14);
    expect(first.values.card?.fill).toBe("#abcdef");
    expect(first.values.card?.visible).toBe(false);
  });

  test("evaluates springs from explicit initial conditions", () => {
    const result = evaluateActiveTransitions([
      playback({
        connection: {
          ...connection,
          id: "connection-card-press",
          transition: { kind: "spring", stiffness: 300, damping: 20, mass: 1 },
        },
        initialVelocity: { card: { opacity: 1.5 } },
      }),
    ], 220);
    expect(result.diagnostics).toEqual([]);
    expect(result.values.card?.opacity).toBeTypeOf("number");
    expect(result.values.card?.opacity).not.toBe(0.2);
    expect(result.values.card?.opacity).not.toBe(0.8);
  });

  test("patches a resolved scene without leaking authored trigger metadata into nodes", () => {
    const document = createFoundationDocument();
    document.nodes.card = rectangle("card", "page-root-home");
    document.nodes["page-root-home"] = { ...document.nodes["page-root-home"]!, childIds: [...document.nodes["page-root-home"]!.childIds, "card"] };
    const resolved = resolveScene(document, { pageId: "page-home" });
    const frame = evaluateResolvedSceneAnimations(resolved, [playback()], 200);
    expect(resolved.nodes.card?.opacity).toBe(1);
    expect(frame.scene.nodes.card?.opacity).toBeCloseTo(0.5);
    expect(JSON.stringify(frame.scene.nodes.card)).not.toContain("trigger");
    expect(JSON.stringify(frame.scene.nodes.card)).not.toContain("transition");
    expect(JSON.stringify(frame.scene.nodes.card)).not.toContain("set-state");
  });

  test("keeps applyEvaluatedValues pure", () => {
    const document = createFoundationDocument();
    document.nodes.card = rectangle("card", "page-root-home");
    document.nodes["page-root-home"] = { ...document.nodes["page-root-home"]!, childIds: [...document.nodes["page-root-home"]!.childIds, "card"] };
    const resolved = resolveScene(document, { pageId: "page-home" });
    const patched = applyEvaluatedValues(resolved, { card: { opacity: 0.3, cornerRadius: 12 } });
    expect(resolved.nodes.card?.opacity).toBe(1);
    expect(patched.nodes.card?.opacity).toBe(0.3);
    expect(patched.nodes.card?.cornerRadius).toBe(12);
  });
});
