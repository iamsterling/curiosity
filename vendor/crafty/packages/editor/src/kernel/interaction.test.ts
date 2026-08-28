import { describe, expect, it } from "vitest";
import { initialInteractionState, marqueeSelectableIds, transitionInteraction, TOOL_EFFECT_VOCABULARIES, type EditorTool, type InteractionEffect, type InteractionState } from "./interaction.js";
import { createFoundationDocument } from "./document.js";
import { createEditorKernel } from "./kernel.js";

const context = { viewport: { panX: 0, panY: 0, zoom: 1, devicePixelRatio: 1 }, dragThreshold: 4, hitTest: () => undefined };
const down = (state: InteractionState, tool: EditorTool, point = { x: 10, y: 10 }, shiftKey = false): InteractionState => transitionInteraction(state, { type: "pointer-down", pointerId: 1, point, button: 0, altKey: false, shiftKey, spaceKey: false }, { ...context, hitTest: () => undefined }).state;
const move = (state: InteractionState, point: { x: number; y: number }, shiftKey = false): InteractionState => transitionInteraction(state, { type: "pointer-move", pointerId: 1, point, button: 0, altKey: false, shiftKey, spaceKey: false }, context).state;
const up = (state: InteractionState, point: { x: number; y: number }, shiftKey = false): { state: InteractionState; effects: InteractionEffect[] } => transitionInteraction(state, { type: "pointer-up", pointerId: 1, point, button: 0, altKey: false, shiftKey, spaceKey: false }, context);
const wheel = (state: InteractionState, point = { x: 10, y: 10 }, deltaY = 100, ctrlKey = false): { state: InteractionState; effects: InteractionEffect[] } => transitionInteraction(state, { type: "wheel", point, deltaY, ctrlKey, metaKey: false }, context);

describe("creation start evidence", () => {
  it("keeps start choices and publishes them with current-corner evidence", () => {
    const startChoice = { family: "guide" as const, axis: "x" as const, value: 10, source: "point" as const };
    const endChoice = { family: "grid" as const, axis: "y" as const, value: 30, source: "point" as const };
    const snapContext = {
      ...context,
      snapCornerPoint: (point: { x: number; y: number }) => point.x < 15
        ? { point: { x: 10, y: point.y }, choices: { x: startChoice } }
        : { point: { x: point.x, y: 30 }, choices: { y: endChoice } },
    };
    const armed = transitionInteraction(initialInteractionState("rectangle"), { type: "pointer-down", pointerId: 1, point: { x: 10.2, y: 20 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, snapContext).state;
    expect(armed.startSnapChoices).toEqual({ x: startChoice });
    const preview = transitionInteraction(armed, { type: "pointer-move", pointerId: 1, point: { x: 20, y: 30.2 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, snapContext);
    expect(preview.effects).toContainEqual({ type: "preview-rectangle", bounds: { x: 10, y: 20, width: 10, height: 10 }, startSnapChoices: { x: startChoice }, snapChoices: { y: endChoice } });
  });
});

describe("marquee selection effects", () => {
  it("arms a marquee only after the drag threshold and emits update effects", () => {
    let state = initialInteractionState("select");
    state = down(state, "select");
    state = move(state, { x: 12, y: 12 });
    expect(state.phase).toBe("armed");
    const crossed = transitionInteraction(state, { type: "pointer-move", pointerId: 1, point: { x: 40, y: 30 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, context);
    expect(crossed.effects[0]).toEqual({ type: "begin-marquee", start: { x: 10, y: 10 } });
    const updated = transitionInteraction(crossed.state, { type: "pointer-move", pointerId: 1, point: { x: 44, y: 34 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, context);
    expect(updated.effects[0]).toEqual({ type: "update-marquee", bounds: { x: 10, y: 10, width: 34, height: 24 } });
    expect(updated.state.draftBounds).toEqual({ x: 10, y: 10, width: 34, height: 24 });
  });

  it("commits the marquee rect on pointer-up with the shift-additive flag", () => {
    let state = initialInteractionState("select");
    state = down(state, "select");
    state = move(state, { x: 60, y: 50 });
    const result = up(state, { x: 60, y: 50 }, true);
    expect(result.effects).toEqual([{ type: "commit-marquee", bounds: { x: 10, y: 10, width: 50, height: 40 }, additive: true }]);
    expect(result.state.phase).toBe("committed");
  });

  it("does not commit a marquee below the drag threshold", () => {
    let state = initialInteractionState("select");
    state = down(state, "select");
    const result = up(state, { x: 12, y: 12 });
    expect(result.effects).toEqual([]);
    expect(result.state.phase).toBe("committed");
  });

  it("keeps the first selection effect additive for shift-pointer-down", () => {
    const result = transitionInteraction(initialInteractionState("select"), { type: "pointer-down", pointerId: 1, point: { x: 10, y: 10 }, button: 0, altKey: false, shiftKey: true, spaceKey: false }, { ...context, hitTest: () => "node-a" });
    expect(result.effects[0]).toEqual({ type: "select", nodeId: "node-a", additive: true });
  });
});

describe("tool effect vocabularies are disjoint", () => {
  it("never emits creation effects for select or hand tools", () => {
    const creationTypes = new Set<InteractionEffect["type"]>(["preview-rectangle", "commit-rectangle"]);
    for (const tool of ["select", "hand"] as const) {
      let state = initialInteractionState(tool);
      state = down(state, tool);
      state = move(state, { x: 60, y: 50 });
      const result = up(state, { x: 60, y: 50 });
      const types = new Set(result.effects.map((effect) => effect.type));
      for (const type of creationTypes) expect(types.has(type)).toBe(false);
      expect(TOOL_EFFECT_VOCABULARIES[tool].has("commit-rectangle")).toBe(false);
      expect(TOOL_EFFECT_VOCABULARIES[tool].has("preview-rectangle")).toBe(false);
    }
  });

  it("never emits selection or move effects for the rectangle or hand tools", () => {
    const selectionTypes = new Set<InteractionEffect["type"]>(["select", "begin-marquee", "update-marquee", "commit-marquee", "move"]);
    for (const tool of ["rectangle", "hand"] as const) {
      let state = initialInteractionState(tool);
      state = down(state, tool);
      state = move(state, { x: 60, y: 50 });
      const result = up(state, { x: 60, y: 50 });
      const types = new Set(result.effects.map((effect) => effect.type));
      for (const type of selectionTypes) expect(types.has(type)).toBe(false);
      for (const type of selectionTypes) expect(TOOL_EFFECT_VOCABULARIES[tool].has(type)).toBe(false);
    }
  });

  it("declares the shared navigation vocabulary for every tool", () => {
    for (const tool of ["select", "rectangle", "hand"] as const) {
      expect(TOOL_EFFECT_VOCABULARIES[tool].has("zoom")).toBe(true);
      expect(TOOL_EFFECT_VOCABULARIES[tool].has("begin-pan")).toBe(true);
      expect(TOOL_EFFECT_VOCABULARIES[tool].has("pan")).toBe(true);
      expect(TOOL_EFFECT_VOCABULARIES[tool].has("cancel")).toBe(true);
    }
  });
});

describe("wheel and pinch never arm creation", () => {
  it("cancels an armed rectangle session on wheel and emits only zoom", () => {
    let state = initialInteractionState("rectangle");
    state = down(state, "rectangle");
    expect(state.phase).toBe("armed");
    const result = wheel(state);
    expect(result.state.phase).toBe("idle");
    expect(result.state.pointerId).toBeUndefined();
    expect(result.effects).toEqual([{ type: "zoom", point: { x: 10, y: 10 }, factor: 0.9 }]);
    const release = up(result.state, { x: 60, y: 50 });
    expect(release.effects).toEqual([]);
  });

  it("cancels an in-flight marquee on a ctrl-key pinch wheel", () => {
    let state = initialInteractionState("select");
    state = down(state, "select");
    state = move(state, { x: 60, y: 50 });
    expect(state.phase).toBe("preview");
    const result = wheel(state, { x: 30, y: 30 }, 40, true);
    expect(result.state.phase).toBe("idle");
    expect(result.effects).toEqual([{ type: "zoom", point: { x: 30, y: 30 }, factor: 0.9 }]);
  });

  it("honors an explicit smooth-zoom factor from the caller", () => {
    const result = wheel(initialInteractionState("select"), { x: 5, y: 5 }, 200, false);
    const zoom = result.effects.find((effect): effect is { type: "zoom"; point: { x: number; y: number }; factor: number } => effect.type === "zoom");
    expect(zoom?.factor).toBe(0.9);
    const smooth = transitionInteraction(initialInteractionState("select"), { type: "wheel", point: { x: 5, y: 5 }, deltaY: 100, ctrlKey: false, metaKey: false, factor: 1.05 }, context);
    expect(smooth.effects[0]).toEqual({ type: "zoom", point: { x: 5, y: 5 }, factor: 1.05 });
  });

  it("never arms creation from a wheel when idle", () => {
    const result = wheel(initialInteractionState("select"));
    expect(result.state.phase).toBe("idle");
    expect(result.effects.every((effect) => effect.type !== "commit-rectangle" && effect.type !== "preview-rectangle")).toBe(true);
  });
});

describe("multi-selection drag", () => {
  const grab = (selectedIds: string[] | undefined, targetId: string): InteractionEffect[] => {
    const grabContext = { ...context, hitTest: () => targetId, ...(selectedIds === undefined ? {} : { selectedIds }) };
    const armed = transitionInteraction(initialInteractionState("select"), { type: "pointer-down", pointerId: 1, point: { x: 10, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, grabContext).state;
    return transitionInteraction(armed, { type: "pointer-move", pointerId: 1, point: { x: 60, y: 50 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, grabContext).effects;
  };

  it("moves the whole selection when the grabbed node belongs to it", () => {
    expect(grab(["layer-a", "layer-b", "layer-c"], "layer-b")).toEqual([{ type: "move", nodeIds: ["layer-a", "layer-b", "layer-c"], delta: { x: 50, y: 40 } }]);
  });

  it("moves only the grabbed node when it sits outside the selection", () => {
    expect(grab(["layer-a", "layer-b"], "layer-z")).toEqual([{ type: "move", nodeIds: ["layer-z"], delta: { x: 50, y: 40 } }]);
  });

  it("falls back to the grabbed node when the context supplies no selection", () => {
    expect(grab(undefined, "layer-a")).toEqual([{ type: "move", nodeIds: ["layer-a"], delta: { x: 50, y: 40 } }]);
  });

  it("emits nothing below the drag threshold even with a multi-selection", () => {
    const grabContext = { ...context, hitTest: () => "layer-a", selectedIds: ["layer-a", "layer-b"] };
    const armed = transitionInteraction(initialInteractionState("select"), { type: "pointer-down", pointerId: 1, point: { x: 10, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, grabContext).state;
    expect(transitionInteraction(armed, { type: "pointer-move", pointerId: 1, point: { x: 12, y: 11 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, grabContext).effects).toEqual([]);
  });
});

describe("marquee selection over the authored document", () => {
  // Foundation geometry: frame-foundation at world (180,120,520,320); its
  // children are LOCAL to it — rectangle-foundation world (244,204,240,132),
  // text-foundation world (244,360,340,42).
  it("selects the nodes whose world bounds intersect the marquee", () => {
    const document = createFoundationDocument();
    expect(marqueeSelectableIds(document, "page-home", { x: 244, y: 204, width: 240, height: 132 })).toEqual(["frame-foundation", "rectangle-foundation"]);
  });

  it("intersects on AABB overlap, not containment or adjacency", () => {
    const document = createFoundationDocument();
    expect(marqueeSelectableIds(document, "page-home", { x: 244, y: 204, width: 120, height: 132 })).toEqual(["frame-foundation", "rectangle-foundation"]);
    expect(marqueeSelectableIds(document, "page-home", { x: 0, y: 120, width: 180, height: 100 })).toEqual([]);
  });

  it("never selects the page root", () => {
    const document = createFoundationDocument();
    expect(marqueeSelectableIds(document, "page-home", { x: 0, y: 0, width: 2000, height: 2000 })).toEqual(["frame-foundation", "rectangle-foundation", "text-foundation"]);
  });

  it("selects nothing over empty space", () => {
    const document = createFoundationDocument();
    expect(marqueeSelectableIds(document, "page-home", { x: 5000, y: 5000, width: 100, height: 100 })).toEqual([]);
  });

  it("excludes locked nodes and whole subtrees under a locked parent", () => {
    const lockedNode = createFoundationDocument();
    lockedNode.nodes["rectangle-foundation"] = { ...lockedNode.nodes["rectangle-foundation"]!, locked: true };
    expect(marqueeSelectableIds(lockedNode, "page-home", { x: 244, y: 204, width: 240, height: 132 })).toEqual(["frame-foundation"]);
    const lockedParent = createFoundationDocument();
    lockedParent.nodes["frame-foundation"] = { ...lockedParent.nodes["frame-foundation"]!, locked: true };
    expect(marqueeSelectableIds(lockedParent, "page-home", { x: 244, y: 204, width: 240, height: 132 })).toEqual([]);
  });

  it("excludes hidden nodes and whole subtrees under a hidden parent", () => {
    const hiddenNode = createFoundationDocument();
    hiddenNode.nodes["text-foundation"] = { ...hiddenNode.nodes["text-foundation"]!, visible: false };
    expect(marqueeSelectableIds(hiddenNode, "page-home", { x: 244, y: 360, width: 340, height: 42 })).toEqual(["frame-foundation"]);
    const hiddenParent = createFoundationDocument();
    hiddenParent.nodes["frame-foundation"] = { ...hiddenParent.nodes["frame-foundation"]!, visible: false };
    expect(marqueeSelectableIds(hiddenParent, "page-home", { x: 244, y: 204, width: 240, height: 132 })).toEqual([]);
  });

  it("folds the node's own transform into the world box", () => {
    const scaled = createFoundationDocument();
    scaled.nodes["rectangle-foundation"] = { ...scaled.nodes["rectangle-foundation"]!, transform: { a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 } };
    // rectangle world box = translate(244,204) × scale(2) over (0,0,240,132) → (244..724, 204..468).
    expect(marqueeSelectableIds(scaled, "page-home", { x: 300, y: 250, width: 20, height: 20 })).toEqual(["frame-foundation", "rectangle-foundation"]);
    expect(marqueeSelectableIds(scaled, "page-home", { x: 200, y: 250, width: 20, height: 20 })).toEqual(["frame-foundation"]);
  });

  it("kernel marqueeSelect replaces or toggles through the selection methods", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.marqueeSelect({ x: 244, y: 204, width: 240, height: 132 }, false);
    expect(kernel.getState().selectedIds).toEqual(["frame-foundation", "rectangle-foundation"]);
    kernel.marqueeSelect({ x: 244, y: 360, width: 340, height: 42 }, false);
    expect(kernel.getState().selectedIds).toEqual(["frame-foundation", "text-foundation"]);
    kernel.marqueeSelect({ x: 244, y: 204, width: 240, height: 132 }, true);
    expect(kernel.getState().selectedIds).toEqual(["text-foundation", "rectangle-foundation"]);
  });
});

describe("resize arming", () => {
  const single = {
    selectedBounds: { x: 0, y: 0, width: 100, height: 100 },
    handlePositionsOf: () => [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 100, y: 100 },
      { x: 50, y: 100 },
      { x: 0, y: 100 },
      { x: 0, y: 50 },
    ],
    selectedIds: ["layer-a"],
    hitTest: () => "layer-a",
  };
  const drag = (from: { x: number; y: number }, to: { x: number; y: number }, ctx: object): InteractionEffect[] => {
    const armed = transitionInteraction(initialInteractionState("select"), { type: "pointer-down", pointerId: 1, point: from, button: 0, altKey: false, shiftKey: false, spaceKey: false }, { ...context, ...ctx }).state;
    return transitionInteraction(armed, { type: "pointer-move", pointerId: 1, point: to, button: 0, altKey: false, shiftKey: false, spaceKey: false }, { ...context, ...ctx }).effects;
  };

  it("arms a resize from the bottom-right corner handle, naming the handle", () => {
    // (96,96) sits inside the 16-screen-px corner-handle circle at (100,100).
    expect(drag({ x: 96, y: 96 }, { x: 126, y: 126 }, single)).toEqual([{ type: "move", nodeIds: ["layer-a"], delta: { x: 30, y: 30 }, resize: true, handle: "se" }]);
  });

  it("arms a corner-radius drag only on the selected shape's inset handle", () => {
    const withRadiusHandle = {
      ...single,
      cornerHandlePositionsOf: () => [
        { handle: "nw" as const, point: { x: 20, y: 20 } },
        { handle: "ne" as const, point: { x: 80, y: 20 } },
        { handle: "se" as const, point: { x: 80, y: 80 } },
        { handle: "sw" as const, point: { x: 20, y: 80 } },
      ],
    };
    const armed = transitionInteraction(initialInteractionState("select"), { type: "pointer-down", pointerId: 1, point: { x: 20, y: 20 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, { ...context, ...withRadiusHandle });
    expect(armed.state.cornerHandle).toBe("nw");
    const moved = transitionInteraction(armed.state, { type: "pointer-move", pointerId: 1, point: { x: 30, y: 30 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, { ...context, ...withRadiusHandle });
    expect(moved.effects).toEqual([{ type: "corner-radius", nodeId: "layer-a", delta: { x: 10, y: 10 }, handle: "nw" }]);
  });

  it("arms a resize from every corner and edge midpoint handle", () => {
    const arms = (at: { x: number; y: number }, handle: string): void => {
      expect(drag(at, { x: at.x + 20, y: at.y + 20 }, single)[0]).toMatchObject({ type: "move", resize: true, handle });
    };
    arms({ x: 4, y: 4 }, "nw");
    arms({ x: 50, y: 4 }, "n");
    arms({ x: 96, y: 4 }, "ne");
    arms({ x: 96, y: 50 }, "e");
    arms({ x: 96, y: 96 }, "se");
    arms({ x: 50, y: 96 }, "s");
    arms({ x: 4, y: 96 }, "sw");
    arms({ x: 4, y: 50 }, "w");
  });

  it.each([
    { name: "Shift", shiftKey: true, altKey: false },
    { name: "Shift+Alt", shiftKey: true, altKey: true },
  ])("does not emit additive selection while arming a resize with $name", ({ shiftKey, altKey }) => {
    const result = transitionInteraction(initialInteractionState("select"), {
      type: "pointer-down", pointerId: 1, point: { x: 96, y: 96 }, button: 0, altKey, shiftKey, spaceKey: false,
    }, { ...context, ...single });
    expect(result.state.resizeHandle).toBe("se");
    expect(result.effects).toEqual([]);
  });

  it.each([
    { name: "resize", point: { x: 96, y: 96 }, expected: "resizeHandle", value: "se" },
    { name: "corner radius", point: { x: 20, y: 20 }, expected: "cornerHandle", value: "nw" },
    { name: "rotate", point: { x: 120, y: 120 }, expected: "rotate", value: true },
  ] as const)("gives the selected $name affordance precedence over an overlapping node", ({ point, expected, value }) => {
    const overlap = {
      ...single,
      hitTest: () => "layer-underneath",
      handlePositionsOf: (nodeId: string) => nodeId === "layer-a" ? single.handlePositionsOf() : undefined,
      cornerHandlePositionsOf: (nodeId: string) => nodeId === "layer-a"
        ? [{ handle: "nw" as const, point: { x: 20, y: 20 } }]
        : undefined,
    };
    for (const modifiers of [
      { shiftKey: false, ctrlKey: false, clickCount: 1 },
      { shiftKey: true, ctrlKey: false, clickCount: 1 },
      { shiftKey: false, ctrlKey: true, clickCount: 1 },
      { shiftKey: false, ctrlKey: false, clickCount: 2 },
    ]) {
      const result = transitionInteraction(initialInteractionState("select"), {
        type: "pointer-down", pointerId: 1, point, button: 0, altKey: false, spaceKey: false, ...modifiers,
      }, { ...context, ...overlap });
      expect(result.state.targetId).toBe("layer-a");
      expect(result.state[expected]).toBe(value);
      expect(result.effects).toEqual([]);
    }
  });

  it.each([
    { name: "resize", point: { x: 96, y: 96 } },
    { name: "corner radius", point: { x: 20, y: 20 } },
    { name: "rotate", point: { x: 120, y: 120 } },
  ])("defensively rejects a stale $name affordance for an immutable selection", ({ point }) => {
    const stale = {
      ...single,
      hitTest: () => "layer-underneath",
      canMutateNode: (nodeId: string) => nodeId !== "layer-a",
      handlePositionsOf: (nodeId: string) => nodeId === "layer-a" ? single.handlePositionsOf() : undefined,
      cornerHandlePositionsOf: (nodeId: string) => nodeId === "layer-a"
        ? [{ handle: "nw" as const, point: { x: 20, y: 20 } }]
        : undefined,
    };
    for (const shiftKey of [false, true]) {
      const result = transitionInteraction(initialInteractionState("select"), {
        type: "pointer-down", pointerId: 1, point, button: 0, altKey: false, shiftKey, spaceKey: false,
      }, { ...context, ...stale });
      expect(result.state.targetId).toBe("layer-underneath");
      expect(result.state.resizeHandle).toBeUndefined();
      expect(result.state.cornerHandle).toBeUndefined();
      expect(result.state.rotate).toBeUndefined();
    }
  });

  it.each([
    { name: "move", point: { x: 50, y: 50 }, context: {} },
    { name: "resize", point: { x: 96, y: 96 }, context: {} },
    { name: "corner radius", point: { x: 20, y: 20 }, context: { cornerHandlePositionsOf: () => [{ handle: "nw" as const, point: { x: 20, y: 20 } }] } },
    { name: "rotate", point: { x: 120, y: 120 }, context: {} },
  ])("cancels an armed $name when its target becomes immutable", ({ point, context: affordanceContext }) => {
    const mutable = { ...context, ...single, ...affordanceContext, canMutateNode: () => true };
    const armed = transitionInteraction(initialInteractionState("select"), {
      type: "pointer-down", pointerId: 1, point, button: 0, altKey: false, shiftKey: false, spaceKey: false,
    }, mutable).state;

    const invalid = transitionInteraction(armed, {
      type: "pointer-move", pointerId: 1, point: { x: point.x + 20, y: point.y + 20 }, button: 0, altKey: false, shiftKey: false, spaceKey: false,
    }, { ...mutable, canMutateNode: () => false });

    expect(invalid.state.phase).toBe("cancelled");
    expect(invalid.effects).toEqual([{ type: "cancel" }]);
    expect(transitionInteraction(invalid.state, {
      type: "pointer-up", pointerId: 1, point: { x: point.x + 20, y: point.y + 20 }, button: 0, altKey: false, shiftKey: false, spaceKey: false,
    }, { ...mutable, canMutateNode: () => false }).effects).toEqual([]);
  });

  it("cancels a preview rather than emitting a second move after mutability changes", () => {
    const mutable = { ...context, ...single, canMutateNode: () => true };
    const armed = transitionInteraction(initialInteractionState("select"), {
      type: "pointer-down", pointerId: 1, point: { x: 50, y: 50 }, button: 0, altKey: false, shiftKey: false, spaceKey: false,
    }, mutable).state;
    const preview = transitionInteraction(armed, {
      type: "pointer-move", pointerId: 1, point: { x: 70, y: 70 }, button: 0, altKey: false, shiftKey: false, spaceKey: false,
    }, mutable);
    expect(preview.effects[0]).toMatchObject({ type: "move" });
    const invalid = transitionInteraction(preview.state, {
      type: "pointer-move", pointerId: 1, point: { x: 90, y: 90 }, button: 0, altKey: false, shiftKey: false, spaceKey: false,
    }, { ...mutable, canMutateNode: () => false });
    expect(invalid.effects).toEqual([{ type: "cancel" }]);
    expect(invalid.state.phase).toBe("cancelled");
  });

  it.each([
    { name: "single selection", selectedIds: ["layer-a"], immutable: "layer-a" },
    { name: "multi-selection", selectedIds: ["layer-a", "layer-b"], immutable: "layer-b" },
  ])("cancels a $name release when its preview mutation set becomes immutable", ({ selectedIds, immutable }) => {
    const mutable = { ...context, selectedIds, hitTest: () => "layer-a", canMutateNode: () => true };
    const armed = transitionInteraction(initialInteractionState("select"), {
      type: "pointer-down", pointerId: 1, point: { x: 50, y: 50 }, button: 0, altKey: false, shiftKey: false, spaceKey: false,
    }, mutable).state;
    const preview = transitionInteraction(armed, {
      type: "pointer-move", pointerId: 1, point: { x: 70, y: 70 }, button: 0, altKey: false, shiftKey: false, spaceKey: false,
    }, mutable).state;

    const release = transitionInteraction(preview, {
      type: "pointer-up", pointerId: 1, point: { x: 70, y: 70 }, button: 0, altKey: false, shiftKey: false, spaceKey: false,
    }, { ...mutable, canMutateNode: (nodeId: string) => nodeId !== immutable });

    expect(release.state.phase).toBe("cancelled");
    expect(release.effects).toEqual([{ type: "cancel" }]);
  });

  it.each(["before a preview", "after a preview"])("cancels a multi-selection move when a non-grabbed member becomes immutable %s", (when) => {
    const mutable = { ...context, selectedIds: ["layer-a", "layer-b"], hitTest: () => "layer-a", canMutateNode: () => true };
    const armed = transitionInteraction(initialInteractionState("select"), {
      type: "pointer-down", pointerId: 1, point: { x: 50, y: 50 }, button: 0, altKey: false, shiftKey: false, spaceKey: false,
    }, mutable).state;
    const state = when === "after a preview"
      ? transitionInteraction(armed, {
          type: "pointer-move", pointerId: 1, point: { x: 70, y: 70 }, button: 0, altKey: false, shiftKey: false, spaceKey: false,
        }, mutable).state
      : armed;

    const invalid = transitionInteraction(state, {
      type: "pointer-move", pointerId: 1, point: { x: 90, y: 90 }, button: 0, altKey: false, shiftKey: false, spaceKey: false,
    }, { ...mutable, canMutateNode: (nodeId: string) => nodeId !== "layer-b" });

    expect(invalid.state.phase).toBe("cancelled");
    expect(invalid.effects).toEqual([{ type: "cancel" }]);
    expect(transitionInteraction(invalid.state, {
      type: "pointer-up", pointerId: 1, point: { x: 90, y: 90 }, button: 0, altKey: false, shiftKey: false, spaceKey: false,
    }, { ...mutable, canMutateNode: (nodeId: string) => nodeId !== "layer-b" }).effects).toEqual([]);
  });

  it("emits a move for every mutable member of a multi-selection", () => {
    const mutable = { ...context, selectedIds: ["layer-a", "layer-b"], hitTest: () => "layer-a", canMutateNode: () => true };
    const armed = transitionInteraction(initialInteractionState("select"), {
      type: "pointer-down", pointerId: 1, point: { x: 50, y: 50 }, button: 0, altKey: false, shiftKey: false, spaceKey: false,
    }, mutable).state;

    expect(transitionInteraction(armed, {
      type: "pointer-move", pointerId: 1, point: { x: 70, y: 70 }, button: 0, altKey: false, shiftKey: false, spaceKey: false,
    }, mutable).effects).toEqual([{ type: "move", nodeIds: ["layer-a", "layer-b"], delta: { x: 20, y: 20 } }]);
  });

  it("arms a rotate for the ring just outside a corner handle", () => {
    // (120,120) is 28px from the (100,100) corner: inside the rotate ring
    // (16px..40px), outside the handle circle.
    const result = transitionInteraction(initialInteractionState("select"), { type: "pointer-down", pointerId: 1, point: { x: 120, y: 120 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, { ...context, ...single });
    expect(result.effects).toEqual([]);
    const moved = transitionInteraction(result.state, { type: "pointer-move", pointerId: 1, point: { x: 140, y: 120 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, { ...context, ...single });
    expect(moved.effects).toEqual([{ type: "rotate", point: { x: 140, y: 120 }, shiftKey: false }]);
  });

  it.each([
    { name: "corner radius with Shift", point: { x: 20, y: 20 }, expected: "cornerHandle", altKey: false },
    { name: "corner radius with Shift+Alt", point: { x: 20, y: 20 }, expected: "cornerHandle", altKey: true },
    { name: "rotate with Shift", point: { x: 120, y: 120 }, expected: "rotate", altKey: false },
    { name: "rotate with Shift+Alt", point: { x: 120, y: 120 }, expected: "rotate", altKey: true },
  ] as const)("does not emit additive selection while arming $name", ({ point, expected, altKey }) => {
    const result = transitionInteraction(initialInteractionState("select"), {
      type: "pointer-down", pointerId: 1, point, button: 0, altKey, shiftKey: true, spaceKey: false,
    }, {
      ...context,
      ...single,
      cornerHandlePositionsOf: () => [{ handle: "nw" as const, point: { x: 20, y: 20 } }],
    });
    expect(result.state[expected]).toBe(expected === "rotate" ? true : "nw");
    expect(result.effects).toEqual([]);
  });

  it("arms an alt-drag as a duplicate move", () => {
    const result = transitionInteraction(initialInteractionState("select"), { type: "pointer-down", pointerId: 1, point: { x: 50, y: 50 }, button: 0, altKey: true, shiftKey: false, spaceKey: false }, { ...context, ...single });
    const moved = transitionInteraction(result.state, { type: "pointer-move", pointerId: 1, point: { x: 80, y: 80 }, button: 0, altKey: true, shiftKey: false, spaceKey: false }, { ...context, ...single });
    expect(moved.effects).toEqual([{ type: "move", nodeIds: ["layer-a"], delta: { x: 30, y: 30 }, duplicate: true, altKey: true }]);
  });

  it("deep-selects with ⌘-click (ctrlKey)", () => {
    const deep = { ...single, hitTest: () => "layer-a", hitTestDeep: () => "layer-deep" };
    const result = transitionInteraction(initialInteractionState("select"), { type: "pointer-down", pointerId: 1, point: { x: 50, y: 50 }, button: 0, altKey: false, shiftKey: false, spaceKey: false, ctrlKey: true }, { ...context, ...deep });
    expect(result.effects).toEqual([{ type: "select", nodeId: "layer-deep", additive: false }]);
  });

  it("descends on double-click", () => {
    const deep = { ...single, hitTest: () => "layer-a", hitTestDeep: () => "layer-deep" };
    const result = transitionInteraction(initialInteractionState("select"), { type: "pointer-down", pointerId: 1, point: { x: 50, y: 50 }, button: 0, altKey: false, shiftKey: false, spaceKey: false, clickCount: 2 }, { ...context, ...deep });
    expect(result.effects).toEqual([{ type: "select", nodeId: "layer-deep", additive: false }]);
  });

  it("emits a plain move for a drag that does not start in the corner", () => {
    expect(drag({ x: 50, y: 50 }, { x: 80, y: 80 }, single)).toEqual([{ type: "move", nodeIds: ["layer-a"], delta: { x: 30, y: 30 } }]);
  });

  it("never arms a resize for a multi-selection drag", () => {
    const multi = { selectedIds: ["layer-a", "layer-b"], hitTest: () => "layer-a" };
    expect(drag({ x: 90, y: 90 }, { x: 120, y: 120 }, multi)).toEqual([{ type: "move", nodeIds: ["layer-a", "layer-b"], delta: { x: 30, y: 30 } }]);
  });

  it("never arms a resize when the context supplies no selected bounds", () => {
    expect(drag({ x: 90, y: 90 }, { x: 120, y: 120 }, { selectedIds: ["layer-a"], hitTest: () => "layer-a" })).toEqual([{ type: "move", nodeIds: ["layer-a"], delta: { x: 30, y: 30 } }]);
  });
});

describe("snap wiring (every tool)", () => {
  const snapped = { point: { x: 120, y: 120 }, snap: { kind: "path-segment" as const, midpoint: { x: 115, y: 115 } } };
  const penContext = { ...context, snapPenPoint: () => snapped };

  it("previews the snapped landing dot on an idle pen hover, before any click", () => {
    const result = transitionInteraction(initialInteractionState("pen"), { type: "pointer-move", pointerId: 1, point: { x: 130, y: 130 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, penContext);
    expect(result.effects).toEqual([
      { type: "pen-preview", point: { x: 120, y: 120 }, snap: { kind: "path-segment", midpoint: { x: 115, y: 115 } } },
    ]);
    expect(result.state.phase).toBe("idle");
  });

  it("idle pen hover without a snap context emits the raw cursor point and no payload", () => {
    const result = transitionInteraction(initialInteractionState("pen"), { type: "pointer-move", pointerId: 1, point: { x: 130, y: 130 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, context);
    expect(result.effects).toEqual([{ type: "pen-preview", point: { x: 130, y: 130 } }]);
  });

  it("arms a pen click with the snapped start so a click without a drag lands on the target", () => {
    const result = transitionInteraction(initialInteractionState("pen"), { type: "pointer-down", pointerId: 1, point: { x: 130, y: 130 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, penContext);
    expect(result.state.start).toEqual({ x: 120, y: 120 });
  });

  it("commits the snapped anchor on pen release (what the dot previewed)", () => {
    let state = transitionInteraction(initialInteractionState("pen"), { type: "pointer-down", pointerId: 1, point: { x: 130, y: 130 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, penContext).state;
    state = transitionInteraction(state, { type: "pointer-move", pointerId: 1, point: { x: 150, y: 150 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, penContext).state;
    const result = transitionInteraction(state, { type: "pointer-up", pointerId: 1, point: { x: 150, y: 150 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, penContext);
    expect(result.effects).toEqual([{ type: "pen-begin", point: { x: 120, y: 120 }, handle: { x: 150, y: 150 } }]);
  });

  it("keeps the anchor at the click start without a snap context (the handle-pull preview)", () => {
    let state = transitionInteraction(initialInteractionState("pen"), { type: "pointer-down", pointerId: 1, point: { x: 130, y: 130 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, context).state;
    const result = transitionInteraction(state, { type: "pointer-move", pointerId: 1, point: { x: 150, y: 150 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, context);
    expect(result.effects).toEqual([{ type: "pen-preview", point: { x: 130, y: 130 }, handle: { x: 150, y: 150 } }]);
  });

  it("snaps the rectangle's dragging corner on every preview", () => {
    const rectContext = { ...context, snapCornerPoint: (point: { x: number; y: number }) => ({ point: { x: point.x + 6, y: point.y - 4 }, choices: {} }) };
    let state = transitionInteraction(initialInteractionState("rectangle"), { type: "pointer-down", pointerId: 1, point: { x: 10, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, rectContext).state;
    // The down corner snaps too: start (10,10) → (16,6); the dragged corner
    // (100,80) → (106,76); the box spans the two.
    expect(state.start).toEqual({ x: 16, y: 6 });
    const result = transitionInteraction(state, { type: "pointer-move", pointerId: 1, point: { x: 100, y: 80 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, rectContext);
    expect(result.effects).toEqual([{ type: "preview-rectangle", bounds: { x: 16, y: 6, width: 90, height: 70 } }]);
    expect(result.state.draftBounds).toEqual({ x: 16, y: 6, width: 90, height: 70 });
  });

  it("applies the snapped move delta and carries the alignment guides", () => {
    const moveContext = {
      ...context,
      selectedIds: ["layer-a"],
      hitTest: () => "layer-a",
      snapMoveDelta: () => ({ delta: { x: 40, y: 0 }, guides: { y: 300 }, choices: {} }),
    };
    let state = transitionInteraction(initialInteractionState("select"), { type: "pointer-down", pointerId: 1, point: { x: 10, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, moveContext).state;
    const result = transitionInteraction(state, { type: "pointer-move", pointerId: 1, point: { x: 60, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, moveContext);
    expect(result.effects).toEqual([{ type: "move", nodeIds: ["layer-a"], delta: { x: 40, y: 0 }, guides: { y: 300 } }]);
  });

  it("passes the current move's Ctrl/Meta bypass to snapping on that same event", () => {
    const observed: boolean[] = [];
    const moveContext = {
      ...context,
      selectedIds: ["layer-a"],
      hitTest: () => "layer-a",
      snapMoveDelta: (delta: { x: number; y: number }, _nodeIds: string[], _resize: unknown, bypass: boolean) => {
        observed.push(bypass);
        return { delta: bypass ? delta : { x: 40, y: 0 }, guides: {}, choices: {} };
      },
    };
    let state = transitionInteraction(initialInteractionState("select"), { type: "pointer-down", pointerId: 1, point: { x: 10, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, moveContext).state;
    const bypassed = transitionInteraction(state, { type: "pointer-move", pointerId: 1, point: { x: 60, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false, ctrlKey: true }, moveContext);
    state = bypassed.state;
    const enabled = transitionInteraction(state, { type: "pointer-move", pointerId: 1, point: { x: 61, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false, ctrlKey: false }, moveContext);

    expect(observed).toEqual([true, false]);
    expect(bypassed.effects[0]).toMatchObject({ type: "move", delta: { x: 50, y: 0 } });
    expect(enabled.effects[0]).toMatchObject({ type: "move", delta: { x: 40, y: 0 } });
  });

  it("emits the raw delta and no guides without a snap context", () => {
    const moveContext = { ...context, selectedIds: ["layer-a"], hitTest: () => "layer-a" };
    let state = transitionInteraction(initialInteractionState("select"), { type: "pointer-down", pointerId: 1, point: { x: 10, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, moveContext).state;
    const result = transitionInteraction(state, { type: "pointer-move", pointerId: 1, point: { x: 60, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, moveContext);
    expect(result.effects).toEqual([{ type: "move", nodeIds: ["layer-a"], delta: { x: 50, y: 0 } }]);
  });
});
