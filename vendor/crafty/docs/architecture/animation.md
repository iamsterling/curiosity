# Interaction and Animation

Status: **Target for the canvas.** A deterministic kernel-only evaluation seam
exists in `packages/editor/src/kernel/animation-resolution.ts`, but no authored
document schema, preview/runtime mode, or render-loop wiring consumes it yet.

The dormant lineage's `packages/animation` — semantic motion intents, keyframe
tracks, target capability profiles, deterministic frame resolution — was
**retired** with that lineage (ADR 0016). This document keeps its useful
instincts as target design: the separation of *intent* from *resolved frame* and
the determinism requirement are the same instincts this document argues for.
See [`legacy-and-cleanup.md`](legacy-and-cleanup.md).

## The separation that matters

Four distinct things, routinely collapsed into one:

```
1. TRIGGER          "on click", "on hover", "after 300ms", "on drag past x"
2. ACTION           "navigate to page P", "change state to pressed", "open overlay"
3. TRANSITION       "spring, stiffness 300, damping 20" / "ease-out 200ms"
4. EVALUATED VALUE  opacity = 0.63 at t = 120ms
```

1–3 are **authored**. 4 is **resolved**, at an explicit time, and is disposable.

The renderer receives only 4 — concrete geometry and paint. It never learns what
a trigger is (I30). Put another way: **the GPU renders evaluated state; it does
not own motion semantics.**

## What to take from Framer/Motion

Motion's model separates exactly these layers, and the separation is the reusable
idea:

- **Variants** are *named target states* — `{ visible: {opacity: 1}, hidden:
  {opacity: 0} }` — referenced by label and propagated down a component tree.
- **`transition`** is a separate concern describing *how* values change: spring
  physics for transforms, duration-based easing for things like opacity.
- **Gestures** (`whileHover`, `whileTap`, `whileDrag`) are triggers that select a
  target state and automatically return to the base state when the gesture ends.
- **Presence** keeps an element alive through its exit animation before removal.
- **Orchestration** — `when`, `delayChildren`, stagger — is declared on the
  parent, not scattered across children.

The alignment with Crafty is unusually clean: **a named target state is the same
object as a component state** (see
[`components-and-design-systems.md`](components-and-design-systems.md)). A
transition is then "how to get from state A to state B", and a trigger is "what
causes it". One state model serves both the static state matrix and the motion
system.

What does **not** transfer: Motion is a React runtime. Crafty does not execute
React on the canvas. Take the conceptual layering; do not infer implementation
from observed product behaviour.

## Proposed authored records

Sketch, not ratified.

```ts
interface Trigger {
  kind: "click" | "hover" | "press" | "drag" | "delay" | "appear" | "key";
  // kind-specific parameters
}

interface Action {
  kind: "set-state" | "navigate" | "open-overlay" | "close-overlay" | "scroll-to";
  target?: DocumentId;
  stateSelection?: Record<string, string | boolean>;
}

interface Transition {
  kind: "spring" | "tween";
  spring?: { stiffness; damping; mass };
  tween?:  { durationMs; easing };
  delayMs?: number;
  stagger?: { perChildMs; from: "first" | "last" | "center" };
}

interface PrototypeConnection {
  id; sourceNodeId; trigger: Trigger; action: Action; transition: Transition;
}
```

These live on the document as their own record type — **not** as fields on
`DocumentNode`, and **not** in the render packet.

## What exists now

The kernel exports a pure motion-evaluation seam with three explicit boundaries:

- **Authored intent types**: `Trigger`, `Action`, `Transition`,
  `PrototypeConnection`
- **Resolved playback input**: explicit `from` / `to` evaluated value maps and an
  explicit `startedAtMs`
- **Evaluated output**: a disposable per-node property patch, optionally applied
  over a `ResolvedScene`

That seam is intentionally **not** persisted in `EditorDocument` yet. The current
schema still lacks a ratified authored binding from component state/property
space to concrete node values, so wiring trigger/action records into persistence
today would guess product semantics rather than implement them.

## Evaluation

Stage 6 of the resolution pipeline
([`scene-resolution.md`](scene-resolution.md)), after layout and before transform
flattening. Layout position must exist before it can be interpolated.

Non-negotiable properties:

- **Time is an explicit input.** `ResolutionContext.timeMs`. No wall-clock inside
  the evaluator.
- **Deterministic.** The same `(document, context, timeMs)` yields identical
  output. This is what makes scrubbing, snapshot testing and export possible.
- **Springs are deterministic too.** A spring is a function of elapsed time and
  initial conditions, evaluated analytically or with a fixed timestep — never
  integrated against real frame deltas, which vary per machine.
- **Interruption is modelled.** A transition interrupted mid-flight starts from
  the current evaluated value with the current velocity. This is the difference
  between motion that feels right and motion that snaps.
- **Layout animation** (a node's box changing because layout changed) is a
  distinct case: measure the before and after boxes, interpolate between them.
  Do not animate layout inputs.

## Where the render loop comes in

Animation is the forcing function for the render-loop fix described in
[`react-boundary.md`](react-boundary.md). Playing a transition means producing
frames at display rate from a rAF loop reading the store directly. It cannot be
driven by React re-renders. Do not start motion work before that is fixed — you
will build it on the wrong substrate.

## Scope discipline

Ordered by value per unit of risk:

1. **State transitions** — a component moving between two named states with a
   transition. This is the highest-value piece and reuses the component state
   model directly.
2. **Trigger/action prototyping** — click-to-navigate between pages, hover
   states. Needs a preview mode distinct from the edit mode.
3. **Layout animation** — automatic interpolation when layout changes.
4. **Timeline authoring** — keyframes, tracks, scrubbing. Large. Defer.

## Open decisions

| Question | Notes |
|---|---|
| Is preview mode a separate surface or an editor mode? | Affects the interaction model, tool routing, and whether triggers can fire while editing. |
| Do connections live on the document or a sibling "prototype" record? | Sibling keeps `DocumentNode` clean and lets prototyping be optional. |
| Is `packages/animation` retired, adapted, or reused? | Its determinism and capability-profile ideas are good; its vocabulary is from the other lineage. Decide with an ADR rather than drifting into a second motion model. |
