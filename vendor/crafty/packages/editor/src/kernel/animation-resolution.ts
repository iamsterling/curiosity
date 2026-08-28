import type { ResolvedScene } from "./component-resolution.js";
import type { DocumentId, DocumentNode } from "./document.js";

export type AnimationTrigger =
  | { kind: "click" | "hover" | "press" | "appear" }
  | { kind: "delay"; delayMs: number }
  | { kind: "drag"; axis: "x" | "y"; threshold: number }
  | { kind: "key"; key: string };

export type AnimationAction =
  | { kind: "set-state"; target?: DocumentId; stateSelection: Record<string, string | boolean> }
  | { kind: "navigate"; target: DocumentId }
  | { kind: "open-overlay"; target: DocumentId }
  | { kind: "close-overlay"; target?: DocumentId }
  | { kind: "scroll-to"; target: DocumentId };

export type AnimationEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export type AnimationTransition =
  | {
    kind: "tween";
    durationMs: number;
    easing: AnimationEasing;
    delayMs?: number;
  }
  | {
    kind: "spring";
    stiffness: number;
    damping: number;
    mass: number;
    delayMs?: number;
  };

export interface PrototypeConnection {
  id: DocumentId;
  sourceNodeId: DocumentId;
  trigger: AnimationTrigger;
  action: AnimationAction;
  transition: AnimationTransition;
}

export type EvaluatedNodePatch = Partial<Pick<DocumentNode, "opacity" | "visible" | "fill" | "stroke" | "cornerRadius" | "text">>;
export type EvaluatedValueMap = Record<DocumentId, EvaluatedNodePatch>;
export type NumericVelocityPatch = Partial<Record<"opacity" | "cornerRadius", number>>;
export type NumericVelocityMap = Record<DocumentId, NumericVelocityPatch>;

export interface ActiveTransitionPlayback {
  connection: PrototypeConnection;
  startedAtMs: number;
  from: EvaluatedValueMap;
  to: EvaluatedValueMap;
  initialVelocity?: NumericVelocityMap;
}

export interface AnimationDiagnostic {
  code: `ANIMATION_INVALID:${string}` | `ANIMATION_UNSUPPORTED:${string}`;
  path: string;
  message: string;
}

export interface AnimationEvaluationResult {
  values: EvaluatedValueMap;
  diagnostics: AnimationDiagnostic[];
}

export interface EvaluatedAnimationFrame extends AnimationEvaluationResult {
  scene: ResolvedScene;
}

type NumericProperty = "opacity" | "cornerRadius";

const NUMERIC_PROPERTIES: readonly NumericProperty[] = ["opacity", "cornerRadius"];
const DISCRETE_PROPERTIES: readonly (keyof EvaluatedNodePatch)[] = ["visible", "fill", "stroke", "text"];
const clone = <T>(value: T): T => structuredClone(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const diagnostic = (code: AnimationDiagnostic["code"], path: string, message: string): AnimationDiagnostic => ({ code, path, message });

const easingAt = (easing: AnimationEasing, progress: number): number => {
  if (easing === "linear") return progress;
  if (easing === "ease-in") return progress * progress * progress;
  if (easing === "ease-out") return 1 - Math.pow(1 - progress, 3);
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
};

const springAt = (from: number, to: number, velocity: number, elapsedSeconds: number, transition: Extract<AnimationTransition, { kind: "spring" }>): number => {
  const mass = transition.mass;
  const stiffness = transition.stiffness;
  const damping = transition.damping;
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const displacement = from - to;
  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const coefficient = (velocity + zeta * omega0 * displacement) / omegaD;
    const envelope = Math.exp(-zeta * omega0 * elapsedSeconds);
    return to + envelope * (displacement * Math.cos(omegaD * elapsedSeconds) + coefficient * Math.sin(omegaD * elapsedSeconds));
  }
  if (Math.abs(zeta - 1) < 1e-6) {
    const envelope = Math.exp(-omega0 * elapsedSeconds);
    return to + envelope * (displacement + (velocity + omega0 * displacement) * elapsedSeconds);
  }
  const r1 = -omega0 * (zeta - Math.sqrt(zeta * zeta - 1));
  const r2 = -omega0 * (zeta + Math.sqrt(zeta * zeta - 1));
  const c2 = (velocity - displacement * r1) / (r2 - r1);
  const c1 = displacement - c2;
  return to + c1 * Math.exp(r1 * elapsedSeconds) + c2 * Math.exp(r2 * elapsedSeconds);
};

const evaluateNumericProperty = (
  from: number,
  to: number,
  transition: AnimationTransition,
  elapsedMs: number,
  velocity: number,
): number => {
  if (transition.kind === "tween") {
    const progress = clamp01(elapsedMs / transition.durationMs);
    return from + (to - from) * easingAt(transition.easing, progress);
  }
  return springAt(from, to, velocity, elapsedMs / 1000, transition);
};

const mergePatch = (target: EvaluatedValueMap, nodeId: DocumentId, patch: EvaluatedNodePatch): void => {
  target[nodeId] = { ...(target[nodeId] ?? {}), ...patch };
};

const validateTransition = (transition: AnimationTransition, path: string): AnimationDiagnostic | undefined => {
  if (transition.delayMs !== undefined && (!finite(transition.delayMs) || transition.delayMs < 0)) return diagnostic("ANIMATION_INVALID:delay", `${path}.delayMs`, "Animation delays must be finite and non-negative.");
  if (transition.kind === "tween") {
    if (!finite(transition.durationMs) || transition.durationMs <= 0) return diagnostic("ANIMATION_INVALID:duration", `${path}.durationMs`, "Tween duration must be finite and greater than zero.");
    return undefined;
  }
  if (!finite(transition.stiffness) || transition.stiffness <= 0) return diagnostic("ANIMATION_INVALID:stiffness", `${path}.stiffness`, "Spring stiffness must be finite and greater than zero.");
  if (!finite(transition.damping) || transition.damping < 0) return diagnostic("ANIMATION_INVALID:damping", `${path}.damping`, "Spring damping must be finite and non-negative.");
  if (!finite(transition.mass) || transition.mass <= 0) return diagnostic("ANIMATION_INVALID:mass", `${path}.mass`, "Spring mass must be finite and greater than zero.");
  return undefined;
};

export const evaluateActiveTransitions = (playbacks: readonly ActiveTransitionPlayback[], timeMs: number): AnimationEvaluationResult => {
  const values: EvaluatedValueMap = {};
  const diagnostics: AnimationDiagnostic[] = [];
  const ordered = [...playbacks].sort((left, right) => left.connection.id.localeCompare(right.connection.id));
  for (const playback of ordered) {
    const transitionError = validateTransition(playback.connection.transition, `/connections/${playback.connection.id}/transition`);
    if (transitionError) {
      diagnostics.push(transitionError);
      continue;
    }
    if (!finite(playback.startedAtMs)) {
      diagnostics.push(diagnostic("ANIMATION_INVALID:startedAt", `/connections/${playback.connection.id}/startedAtMs`, "Playback start time must be finite."));
      continue;
    }
    const delayMs = playback.connection.transition.delayMs ?? 0;
    const elapsedMs = timeMs - playback.startedAtMs - delayMs;
    for (const nodeId of Object.keys({ ...playback.from, ...playback.to }).sort()) {
      const from = playback.from[nodeId] ?? {};
      const to = playback.to[nodeId] ?? {};
      const patch: EvaluatedNodePatch = elapsedMs <= 0 ? clone(from) : {};
      if (elapsedMs > 0) {
        for (const property of NUMERIC_PROPERTIES) {
          const fromValue = from[property];
          const toValue = to[property];
          if (fromValue === undefined && toValue === undefined) continue;
          if (!finite(fromValue) || !finite(toValue)) {
            diagnostics.push(diagnostic("ANIMATION_INVALID:value", `/connections/${playback.connection.id}/values/${nodeId}/${property}`, "Animated numeric values must be finite on both endpoints."));
            continue;
          }
          const velocity = playback.initialVelocity?.[nodeId]?.[property] ?? 0;
          patch[property] = evaluateNumericProperty(fromValue, toValue, playback.connection.transition, elapsedMs, velocity);
        }
        for (const property of DISCRETE_PROPERTIES) {
          const toValue = to[property];
          const fromValue = from[property];
          if (toValue !== undefined) Object.assign(patch, { [property]: clone(toValue) } satisfies EvaluatedNodePatch);
          else if (fromValue !== undefined) Object.assign(patch, { [property]: clone(fromValue) } satisfies EvaluatedNodePatch);
        }
      }
      if (Object.keys(patch).length > 0) mergePatch(values, nodeId, patch);
    }
  }
  return { values, diagnostics };
};

export const applyEvaluatedValues = (scene: ResolvedScene, values: EvaluatedValueMap): ResolvedScene => {
  const next = clone(scene);
  for (const [nodeId, patch] of Object.entries(values)) {
    const node = next.nodes[nodeId];
    if (!node) continue;
    if (node.kind === "text") {
      next.nodes[nodeId] = { ...node, ...clone(patch) };
      continue;
    }
    const { text: _text, ...nonTextPatch } = clone(patch);
    next.nodes[nodeId] = { ...node, ...nonTextPatch };
  }
  return next;
};

export const evaluateResolvedSceneAnimations = (
  scene: ResolvedScene,
  playbacks: readonly ActiveTransitionPlayback[],
  timeMs: number,
): EvaluatedAnimationFrame => {
  const evaluation = evaluateActiveTransitions(playbacks, timeMs);
  return {
    ...evaluation,
    scene: applyEvaluatedValues(scene, evaluation.values),
  };
};
