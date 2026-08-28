export type LayerType = "frame" | "group" | "rectangle" | "text" | "image";

export * from "./constants.js";

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Transform2D {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export const identityTransform = (): Transform2D => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });

export const multiplyTransforms = (parent: Transform2D, child: Transform2D): Transform2D => ({
  a: parent.a * child.a + parent.c * child.b,
  b: parent.b * child.a + parent.d * child.b,
  c: parent.a * child.c + parent.c * child.d,
  d: parent.b * child.c + parent.d * child.d,
  e: parent.a * child.e + parent.c * child.f + parent.e,
  f: parent.b * child.e + parent.d * child.f + parent.f
});

export const transformPoint = (point: { x: number; y: number }, transform: Transform2D): { x: number; y: number } => ({
  x: transform.a * point.x + transform.c * point.y + transform.e,
  y: transform.b * point.x + transform.d * point.y + transform.f
});

export const transformBounds = (bounds: Bounds, transform: Transform2D): Bounds => {
  const points = [
    transformPoint({ x: bounds.x, y: bounds.y }, transform),
    transformPoint({ x: bounds.x + bounds.width, y: bounds.y }, transform),
    transformPoint({ x: bounds.x, y: bounds.y + bounds.height }, transform),
    transformPoint({ x: bounds.x + bounds.width, y: bounds.y + bounds.height }, transform)
  ];
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
};

export const inverseTransformPoint = (point: { x: number; y: number }, transform: Transform2D): { x: number; y: number } | undefined => {
  const determinant = transform.a * transform.d - transform.b * transform.c;
  if (Math.abs(determinant) < 1e-9) return undefined;
  const x = point.x - transform.e;
  const y = point.y - transform.f;
  return { x: (transform.d * x - transform.c * y) / determinant, y: (-transform.b * x + transform.a * y) / determinant };
};

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  bounds: Bounds;
  transform: Transform2D;
  fill: string;
  stroke: string;
  opacity: number;
  cornerRadius: number;
  visible: boolean;
  locked?: boolean;
  zIndex: number;
  text?: string;
  children?: Layer[];
}

export type LayerOverride = Partial<Pick<Layer, "bounds" | "transform" | "fill" | "stroke" | "opacity" | "cornerRadius" | "visible" | "text">>;

export interface Story {
  id: string;
  name: string;
  labels: string[];
  overrides: Record<string, LayerOverride>;
}

export interface Frame {
  id: string;
  name: string;
  bounds: Bounds;
  layers: Layer[];
  stories: Story[];
}

export interface Scene {
  schemaVersion: 1;
  id: string;
  name: string;
  revision: number;
  frames: Frame[];
}

export interface SceneDiagnostic {
  code: "SCENE_INPUT_INVALID" | "SCENE_REVISION_STALE" | "SCENE_CANONICAL_INVALID";
  message: string;
  path: string;
}

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  diagnostics: SceneDiagnostic[];
}

export interface SaveResult {
  ok: boolean;
  scene?: Scene;
  diagnostics: SceneDiagnostic[];
  currentRevision: number;
}

const layerTypes = new Set<LayerType>(["frame", "group", "rectangle", "text", "image"]);
const layerKeys = new Set(["id", "name", "type", "bounds", "transform", "fill", "stroke", "opacity", "cornerRadius", "visible", "locked", "zIndex", "text", "children"]);
const overrideKeys = new Set(["bounds", "transform", "fill", "stroke", "opacity", "cornerRadius", "visible", "text"]);

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const isString = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 512;
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isSafeInteger = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value);

const invalid = (path: string, message: string): ValidationResult<never> => ({ ok: false, diagnostics: [{ code: "SCENE_INPUT_INVALID", message, path }] });

const parseTransform = (input: unknown, path: string): Transform2D | SceneDiagnostic => {
  if (input === undefined) return identityTransform();
  if (!isRecord(input) || Object.keys(input).some((key) => !["a", "b", "c", "d", "e", "f"].includes(key))) return { code: "SCENE_INPUT_INVALID", message: "Transform must contain only affine matrix values", path };
  const { a, b, c, d, e, f } = input;
  if (![a, b, c, d, e, f].every(isFiniteNumber) || Math.abs((a as number) * (d as number) - (b as number) * (c as number)) < 1e-9) return { code: "SCENE_INPUT_INVALID", message: "Transform must be finite and invertible", path };
  return { a: a as number, b: b as number, c: c as number, d: d as number, e: e as number, f: f as number };
};

const parseBounds = (input: unknown, path: string): Bounds | SceneDiagnostic => {
  if (!isRecord(input) || Object.keys(input).some((key) => !["x", "y", "width", "height"].includes(key))) return { code: "SCENE_INPUT_INVALID", message: "Bounds must contain only x, y, width, and height", path };
  const { x, y, width, height } = input;
  if (![x, y, width, height].every(isFiniteNumber)) return { code: "SCENE_INPUT_INVALID", message: "Bounds must be finite and have positive width and height", path };
  const numericWidth = width as number;
  const numericHeight = height as number;
  if (numericWidth <= 0 || numericHeight <= 0) return { code: "SCENE_INPUT_INVALID", message: "Bounds must be finite and have positive width and height", path };
  return { x: x as number, y: y as number, width: numericWidth, height: numericHeight };
};

const parseLayer = (input: unknown, path: string, ids: Set<string>): Layer | SceneDiagnostic => {
  if (!isRecord(input) || Object.keys(input).some((key) => !layerKeys.has(key))) return { code: "SCENE_INPUT_INVALID", message: "Layer has an unknown property", path };
  const { id, name, type, fill, stroke, opacity, cornerRadius, visible, zIndex } = input;
  if (!isString(id) || !isString(name) || typeof type !== "string" || !layerTypes.has(type as LayerType) || !isString(fill) || !isString(stroke) || !isFiniteNumber(opacity) || opacity < 0 || opacity > 1 || !isFiniteNumber(cornerRadius) || cornerRadius < 0 || !isSafeInteger(zIndex) || typeof visible !== "boolean") return { code: "SCENE_INPUT_INVALID", message: "Layer fields are invalid", path };
  if (ids.has(id)) return { code: "SCENE_INPUT_INVALID", message: `Duplicate layer id '${id}'`, path: `${path}.id` };
  ids.add(id);
  const bounds = parseBounds(input.bounds, `${path}.bounds`);
  if ("code" in bounds) return bounds;
  const transform = parseTransform(input.transform, `${path}.transform`);
  if ("code" in transform) return transform;
  if (input.locked !== undefined && typeof input.locked !== "boolean") return { code: "SCENE_INPUT_INVALID", message: "Layer locked must be a boolean", path: `${path}.locked` };
  if (input.text !== undefined && typeof input.text !== "string") return { code: "SCENE_INPUT_INVALID", message: "Layer text must be a string", path: `${path}.text` };
  if (input.children !== undefined && (!Array.isArray(input.children) || type !== "group")) return { code: "SCENE_INPUT_INVALID", message: "Only group layers may have children", path: `${path}.children` };
  const children: Layer[] = [];
  for (const [index, child] of (input.children ?? []).entries()) {
    const parsed = parseLayer(child, `${path}.children[${index}]`, ids);
    if ("code" in parsed) return parsed;
    children.push(parsed);
  }
  return { id, name, type: type as LayerType, bounds, transform, fill, stroke, opacity, cornerRadius, visible, ...(input.locked !== undefined ? { locked: input.locked } : {}), zIndex, ...(input.text !== undefined ? { text: input.text } : {}), ...(input.children !== undefined ? { children } : {}) };
};

const parseStory = (input: unknown, path: string, layerIds: Set<string>): Story | SceneDiagnostic => {
  if (!isRecord(input) || Object.keys(input).some((key) => !["id", "name", "labels", "overrides"].includes(key))) return { code: "SCENE_INPUT_INVALID", message: "Story has an unknown property", path };
  if (!isString(input.id) || !isString(input.name) || !Array.isArray(input.labels) || !input.labels.every(isString) || !isRecord(input.overrides)) return { code: "SCENE_INPUT_INVALID", message: "Story fields are invalid", path };
  const overrides: Record<string, LayerOverride> = {};
  for (const [layerId, rawOverride] of Object.entries(input.overrides)) {
    if (!layerIds.has(layerId) || !isRecord(rawOverride) || Object.keys(rawOverride).some((key) => !overrideKeys.has(key))) return { code: "SCENE_INPUT_INVALID", message: "Story override references an invalid layer or property", path: `${path}.overrides.${layerId}` };
    const override: LayerOverride = {};
    if (rawOverride.bounds !== undefined) {
      const bounds = parseBounds(rawOverride.bounds, `${path}.overrides.${layerId}.bounds`);
      if ("code" in bounds) return bounds;
      override.bounds = bounds;
    }
    if (rawOverride.transform !== undefined) {
      const transform = parseTransform(rawOverride.transform, `${path}.overrides.${layerId}.transform`);
      if ("code" in transform) return transform;
      override.transform = transform;
    }
    if (rawOverride.fill !== undefined && isString(rawOverride.fill)) override.fill = rawOverride.fill;
    else if (rawOverride.fill !== undefined) return { code: "SCENE_INPUT_INVALID", message: "Override fill must be a string", path };
    if (rawOverride.stroke !== undefined && isString(rawOverride.stroke)) override.stroke = rawOverride.stroke;
    else if (rawOverride.stroke !== undefined) return { code: "SCENE_INPUT_INVALID", message: "Override stroke must be a string", path };
    if (rawOverride.opacity !== undefined && isFiniteNumber(rawOverride.opacity) && rawOverride.opacity >= 0 && rawOverride.opacity <= 1) override.opacity = rawOverride.opacity;
    else if (rawOverride.opacity !== undefined) return { code: "SCENE_INPUT_INVALID", message: "Override opacity must be between zero and one", path };
    if (rawOverride.cornerRadius !== undefined && isFiniteNumber(rawOverride.cornerRadius) && rawOverride.cornerRadius >= 0) override.cornerRadius = rawOverride.cornerRadius;
    else if (rawOverride.cornerRadius !== undefined) return { code: "SCENE_INPUT_INVALID", message: "Override corner radius must be non-negative", path };
    if (rawOverride.visible !== undefined && typeof rawOverride.visible === "boolean") override.visible = rawOverride.visible;
    else if (rawOverride.visible !== undefined) return { code: "SCENE_INPUT_INVALID", message: "Override visibility must be boolean", path };
    if (rawOverride.text !== undefined && typeof rawOverride.text === "string") override.text = rawOverride.text;
    else if (rawOverride.text !== undefined) return { code: "SCENE_INPUT_INVALID", message: "Override text must be a string", path };
    overrides[layerId] = override;
  }
  return { id: input.id, name: input.name, labels: [...input.labels], overrides };
};

export const validateScene = (input: unknown): ValidationResult<Scene> => {
  if (!isRecord(input) || Object.keys(input).some((key) => !["schemaVersion", "id", "name", "revision", "frames"].includes(key))) return invalid("/", "Scene must be a plain object with the documented properties");
  if (input.schemaVersion !== 1 || !isString(input.id) || !isString(input.name) || !isSafeInteger(input.revision) || input.revision < 0 || !Array.isArray(input.frames) || input.frames.length === 0) return invalid("/", "Scene identity, schema version, revision, or frames are invalid");
  const frameIds = new Set<string>();
  const frames: Frame[] = [];
  for (const [index, rawFrame] of input.frames.entries()) {
    const path = `/frames/${index}`;
    if (!isRecord(rawFrame) || Object.keys(rawFrame).some((key) => !["id", "name", "bounds", "layers", "stories"].includes(key)) || !isString(rawFrame.id) || !isString(rawFrame.name) || frameIds.has(rawFrame.id) || !Array.isArray(rawFrame.layers) || !Array.isArray(rawFrame.stories)) return invalid(path, "Frame fields are invalid or the frame id is duplicated");
    frameIds.add(rawFrame.id);
    const bounds = parseBounds(rawFrame.bounds, `${path}.bounds`);
    if ("code" in bounds) return { ok: false, diagnostics: [bounds] };
    const layerIds = new Set<string>();
    const layers: Layer[] = [];
    for (const [layerIndex, rawLayer] of rawFrame.layers.entries()) {
      const parsed = parseLayer(rawLayer, `${path}.layers[${layerIndex}]`, layerIds);
      if ("code" in parsed) return { ok: false, diagnostics: [parsed] };
      layers.push(parsed);
    }
    const storyIds = new Set<string>();
    const stories: Story[] = [];
    for (const [storyIndex, rawStory] of rawFrame.stories.entries()) {
      const parsed = parseStory(rawStory, `${path}.stories[${storyIndex}]`, layerIds);
      if ("code" in parsed || storyIds.has(parsed.id)) return invalid(`${path}.stories[${storyIndex}]`, "Story is invalid or the story id is duplicated");
      storyIds.add(parsed.id);
      stories.push(parsed);
    }
    frames.push({ id: rawFrame.id, name: rawFrame.name, bounds, layers, stories });
  }
  return { ok: true, diagnostics: [], value: { schemaVersion: 1, id: input.id, name: input.name, revision: input.revision, frames } };
};

const canonicalValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (isRecord(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
  return value;
};

export const canonicalSceneString = (scene: Scene): string => {
  const validation = validateScene(scene);
  if (!validation.ok || !validation.value) throw new Error("SCENE_CANONICAL_INVALID: scene must validate before serialization");
  return JSON.stringify(canonicalValue(validation.value));
};

export const canonicalSceneBytes = (scene: Scene): Uint8Array => new TextEncoder().encode(canonicalSceneString(scene));

export const saveScene = (current: Scene, expectedRevision: number, candidate: unknown): SaveResult => {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== current.revision) return { ok: false, currentRevision: current.revision, diagnostics: [{ code: "SCENE_REVISION_STALE", message: `Expected revision ${expectedRevision}, current revision is ${current.revision}`, path: "/expectedRevision" }] };
  const validation = validateScene(candidate);
  if (!validation.ok || !validation.value) return { ok: false, currentRevision: current.revision, diagnostics: validation.diagnostics };
  if (validation.value.revision !== expectedRevision) return { ok: false, currentRevision: current.revision, diagnostics: [{ code: "SCENE_REVISION_STALE", message: "Scene revision must match expectedRevision", path: "/scene/revision" }] };
  const saved = { ...validation.value, revision: current.revision + 1 } as Scene;
  return { ok: true, scene: saved, currentRevision: saved.revision, diagnostics: [] };
};

const mapLayers = (layers: Layer[], overrides: Record<string, LayerOverride>): Layer[] => layers.map((layer) => {
  const override = overrides[layer.id];
  return { ...layer, ...(override ?? {}), ...(layer.children ? { children: mapLayers(layer.children, overrides) } : {}) };
});

export const applyStoryOverrides = (scene: Scene, frameId: string, storyId?: string): Scene => {
  if (!storyId) return structuredClone(scene);
  const frame = scene.frames.find((candidate) => candidate.id === frameId);
  const story = frame?.stories.find((candidate) => candidate.id === storyId);
  if (!frame || !story) return structuredClone(scene);
  return { ...structuredClone(scene), frames: scene.frames.map((candidate) => candidate.id === frameId ? { ...candidate, layers: mapLayers(candidate.layers, story.overrides) } : candidate) };
};

export const createSeedScene = (): Scene => ({
  schemaVersion: 1,
  id: "scene-crafty-starter",
  name: "Crafty Starter",
  revision: 0,
  frames: [{
    id: "frame-home",
    name: "Home / Card states",
    bounds: { x: 0, y: 0, width: 920, height: 620 },
    layers: [
      { id: "layer-card", name: "Feature card", type: "rectangle", bounds: { x: 260, y: 150, width: 340, height: 210 }, transform: identityTransform(), fill: "#2dd4bf", stroke: "#99f6e4", opacity: 1, cornerRadius: 24, visible: true, zIndex: 1 },
      { id: "layer-title", name: "Title placeholder", type: "text", bounds: { x: 300, y: 220, width: 260, height: 44 }, transform: identityTransform(), fill: "#062a2a", stroke: "#062a2a", opacity: 1, cornerRadius: 0, visible: true, zIndex: 2, text: "Design the state" },
      { id: "layer-badge", name: "State badge", type: "rectangle", bounds: { x: 300, y: 290, width: 130, height: 38 }, transform: identityTransform(), fill: "#fbbf24", stroke: "#fde68a", opacity: 1, cornerRadius: 19, visible: true, zIndex: 3 }
    ],
    stories: [
      { id: "story-default", name: "Default", labels: ["rest", "light"], overrides: {} },
      { id: "story-hover", name: "Hover", labels: ["interaction", "focused"], overrides: { "layer-card": { fill: "#fb7185", bounds: { x: 250, y: 140, width: 360, height: 230 } }, "layer-badge": { fill: "#38bdf8" } } }
    ]
  }]
});

export const createEmptyScene = (frameId = "frame-home"): Scene => ({
  schemaVersion: 1,
  id: "scene-crafty-empty",
  name: "Untitled",
  revision: 0,
  frames: [{
    id: frameId,
    name: "Page 1",
    bounds: { x: 0, y: 0, width: 1280, height: 800 },
    layers: [],
    stories: []
  }]
});

export * from "./spatial-index.js";
