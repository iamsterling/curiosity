import { migrateDocument, sceneToEditorDocument, type EditorDocument } from "@crafty/editor/kernel";
import { validateScene, type Frame, type Layer, type Scene } from "@crafty/scene-model";

export interface PenImportDiagnostic {
  code: string;
  message: string;
  path: string;
}

export type PenImportResult =
  | { ok: true; document: EditorDocument; diagnostics: PenImportDiagnostic[] }
  | { ok: false; diagnostics: PenImportDiagnostic[] };

interface ThemeContext {
  [axis: string]: string;
}

interface VariableDefinition {
  type: "boolean" | "color" | "number" | "string";
  value: unknown;
}

interface PenDocument {
  version: string;
  themes?: Record<string, string[]>;
  variables?: Record<string, VariableDefinition>;
  children: PenNode[];
}

interface PenNode {
  id: string;
  type: string;
  name?: string;
  x?: unknown;
  y?: unknown;
  width?: unknown;
  height?: unknown;
  fill?: unknown;
  stroke?: unknown;
  opacity?: unknown;
  enabled?: unknown;
  rotation?: unknown;
  cornerRadius?: unknown;
  theme?: Record<string, string>;
  layout?: "none" | "vertical" | "horizontal";
  gap?: unknown;
  padding?: unknown;
  justifyContent?: string;
  alignItems?: string;
  layoutPosition?: string;
  reusable?: boolean;
  ref?: string;
  descendants?: Record<string, Record<string, unknown>>;
  content?: unknown;
  children?: PenNode[];
  [key: string]: unknown;
}

interface Placed {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MaterializeContext {
  variables: Record<string, VariableDefinition>;
  components: Map<string, PenNode>;
  theme: ThemeContext;
  visitedRefs: Set<string>;
  path: string;
  diagnostics: PenImportDiagnostic[];
  placements: Map<string, Placed>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isVariable = (value: unknown): value is string => isString(value) && value.startsWith("$");
const hexColorPattern = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/u;

const diagnostic = (diagnostics: PenImportDiagnostic[], code: string, message: string, path: string): void => {
  diagnostics.push({ code, message, path });
};

const asPenNode = (value: unknown, path: string): PenNode | undefined => {
  if (!isRecord(value)) return undefined;
  const node = value as PenNode;
  if (!isString(node.id) || node.id.includes("/") || !isString(node.type) || node.type.length === 0) return undefined;
  return node;
};

const parsePenDocument = (input: unknown, diagnostics: PenImportDiagnostic[]): PenDocument | undefined => {
  if (!isRecord(input)) {
    diagnostic(diagnostics, "PEN_DOCUMENT_INVALID", "The .pen document must be a JSON object.", "/");
    return undefined;
  }
  if (input.version !== "2.14") {
    diagnostic(diagnostics, "PEN_DOCUMENT_INVALID", "Only .pen schema version 2.14 is supported.", "/version");
    return undefined;
  }
  if (!Array.isArray(input.children)) {
    diagnostic(diagnostics, "PEN_DOCUMENT_INVALID", "The .pen document must contain a children array.", "/children");
    return undefined;
  }
  const document: PenDocument = { version: "2.14", children: [] };
  if (input.themes !== undefined) {
    const themes = isRecord(input.themes) && Object.entries(input.themes).every(([, values]) => Array.isArray(values) && values.every(isString)) ? (input.themes as Record<string, string[]>) : undefined;
    if (!themes) {
      diagnostic(diagnostics, "PEN_DOCUMENT_INVALID", "The themes map must map axis names to string arrays.", "/themes");
      return undefined;
    }
    document.themes = themes;
  }
  if (input.variables !== undefined) {
    if (!isRecord(input.variables)) {
      diagnostic(diagnostics, "PEN_DOCUMENT_INVALID", "Variables must map names to typed definitions.", "/variables");
      return undefined;
    }
    const variables: Record<string, VariableDefinition> = {};
    for (const [name, raw] of Object.entries(input.variables)) {
      if (!isRecord(raw) || !isString(raw.type) || !["boolean", "color", "number", "string"].includes(raw.type)) {
        diagnostic(diagnostics, "PEN_DOCUMENT_INVALID", `Variable '${name}' must declare a supported type.`, `/variables/${name}`);
        return undefined;
      }
      variables[name] = { type: raw.type as VariableDefinition["type"], value: raw.value };
    }
    document.variables = variables;
  }
  const children: PenNode[] = [];
  const ids = new Set<string>();
  for (const [index, rawChild] of input.children.entries()) {
    const path = `/children[${index}]`;
    const node = asPenNode(rawChild, path);
    if (!node) {
      diagnostic(diagnostics, "PEN_DOCUMENT_INVALID", "Every child must be an object with a unique id and a non-empty type.", path);
      return undefined;
    }
    if (ids.has(node.id)) {
      diagnostic(diagnostics, "PEN_DOCUMENT_INVALID", `Duplicate node id '${node.id}'.`, `${path}.id`);
      return undefined;
    }
    ids.add(node.id);
    children.push(node);
  }
  document.children = children;
  return document;
};

const themeDefault = (document: PenDocument): ThemeContext => {
  const defaults: ThemeContext = {};
  for (const [axis, values] of Object.entries(document.themes ?? {})) {
    const first = values[0];
    if (first !== undefined) defaults[axis] = first;
  }
  return defaults;
};

const themeMatches = (theme: ThemeContext | undefined, context: ThemeContext): boolean => {
  if (!theme) return true;
  return Object.entries(theme).every(([axis, value]) => context[axis] === value);
};

const resolveVariableValue = (name: string, context: MaterializeContext): { ok: true; value: unknown } | { ok: false; reason: string } => {
  const definition = context.variables[name.startsWith("$") ? name.slice(1) : name];
  if (!definition) return { ok: false, reason: `Unknown variable '${name}'` };
  if (Array.isArray(definition.value)) {
    const candidates = definition.value.filter((entry) => isRecord(entry) && themeMatches(parseTheme(entry.theme), context.theme));
    if (candidates.length === 0) return { ok: false, reason: `No theme entry for variable '${name}' under the current theme` };
    const rawValue = (candidates[candidates.length - 1] as Record<string, unknown>).value;
    return resolveVariableReference(rawValue, name, context);
  }
  return resolveVariableReference(definition.value, name, context);
};

const resolveVariableReference = (rawValue: unknown, name: string, context: MaterializeContext): { ok: true; value: unknown } | { ok: false; reason: string } => {
  if (isVariable(rawValue)) {
    const key = `var:${name}`;
    if (context.visitedRefs.has(key)) return { ok: false, reason: `Circular variable reference involving '${name}'` };
    context.visitedRefs.add(key);
    const resolved = resolveVariableValue(rawValue, context);
    context.visitedRefs.delete(key);
    return resolved;
  }
  return { ok: true, value: rawValue };
};

const parseTheme = (value: unknown): ThemeContext | undefined => {
  if (!isRecord(value) || Object.entries(value).some(([, axisValue]) => !isString(axisValue))) return undefined;
  return value as ThemeContext;
};

const resolveValue = (value: unknown, context: MaterializeContext): unknown => {
  if (!isVariable(value)) return value;
  const resolved = resolveVariableValue(value, context);
  if (!resolved.ok) {
    diagnostic(context.diagnostics, "PEN_VARIABLE_UNRESOLVED", resolved.reason, context.path);
    return undefined;
  }
  return resolved.value;
};

const resolveNumber = (value: unknown, context: MaterializeContext): number | undefined => {
  const resolved = resolveValue(value, context);
  return isFiniteNumber(resolved) ? resolved : undefined;
};

const resolveBoolean = (value: unknown, context: MaterializeContext): boolean | undefined => {
  const resolved = resolveValue(value, context);
  return typeof resolved === "boolean" ? resolved : undefined;
};

const resolveColor = (value: unknown, context: MaterializeContext): string | undefined => {
  const resolved = resolveValue(value, context);
  if (!isString(resolved) || !hexColorPattern.test(resolved)) {
    diagnostic(context.diagnostics, "PEN_COLOR_INVALID", `Expected a hex color, got ${JSON.stringify(resolved)}.`, context.path);
    return undefined;
  }
  return resolved;
};

const firstColorFill = (fills: unknown, context: MaterializeContext): { color: string; opacity: number | undefined } | undefined => {
  const entries = Array.isArray(fills) ? fills : fills === undefined ? [] : [fills];
  for (const entry of entries) {
    if (isString(entry)) {
      const color = resolveColor(entry, context);
      return color ? { color, opacity: undefined } : undefined;
    }
    if (isRecord(entry) && (entry.type === "color" || entry.type === undefined) && entry.enabled !== false) {
      const color = resolveColor(entry.color, context);
      if (!color) return undefined;
      const opacity = resolveNumber(entry.opacity, context);
      return { color, opacity };
    }
  }
  for (const entry of entries) {
    if (isRecord(entry) && entry.enabled !== false && entry.type !== "color") {
      diagnostic(context.diagnostics, "PEN_FILL_UNSUPPORTED", `Fill type '${String(entry.type)}' is not supported; earlier color fills are used when present.`, context.path);
      return undefined;
    }
  }
  return undefined;
};

const firstColorStroke = (fills: unknown, context: MaterializeContext): string | undefined => {
  const entries = Array.isArray(fills) ? fills : fills === undefined ? [] : [fills];
  for (const entry of entries) {
    if (isString(entry)) return resolveColor(entry, context);
    if (isRecord(entry) && (entry.type === "color" || entry.type === undefined) && entry.enabled !== false) return resolveColor(entry.color, context);
  }
  return undefined;
};

const resolveCornerRadius = (value: unknown, context: MaterializeContext): number | undefined => {
  const resolved = resolveValue(value, context);
  if (isFiniteNumber(resolved)) return Math.max(0, resolved);
  if (Array.isArray(resolved)) {
    const first = resolved[0];
    return isFiniteNumber(first) ? Math.max(0, first) : undefined;
  }
  return undefined;
};

const parsePadding = (value: unknown, context: MaterializeContext): [number, number, number, number] => {
  if (isFiniteNumber(value)) return [value, value, value, value];
  if (Array.isArray(value) && value.length === 2 && isFiniteNumber(value[0]) && isFiniteNumber(value[1])) {
    const vertical = value[0];
    const horizontal = value[1];
    return [vertical, horizontal, vertical, horizontal];
  }
  if (Array.isArray(value) && value.length === 4 && value.every(isFiniteNumber)) {
    return [value[0] as number, value[1] as number, value[2] as number, value[3] as number];
  }
  if (value !== undefined) diagnostic(context.diagnostics, "PEN_LAYOUT_UNSUPPORTED", "Padding must be a number, [vertical, horizontal], or [top, right, bottom, left].", context.path);
  return [0, 0, 0, 0];
};

const isLayoutContainer = (node: PenNode): node is PenNode & { children: PenNode[] } => Array.isArray(node.children);

const childMainSize = (placed: Placed, layout: "vertical" | "horizontal"): number => (layout === "vertical" ? placed.height : placed.width);
const childCrossSize = (placed: Placed, layout: "vertical" | "horizontal"): number => (layout === "vertical" ? placed.width : placed.height);

const estimatedTextSize = (node: PenNode, context: MaterializeContext): Placed | undefined => {
  if (node.type !== "text") return undefined;
  const content = isString(node.content) ? (resolveValue(node.content, context) as string) : undefined;
  const fontSize = resolveNumber(node.fontSize, context) ?? 16;
  const width = Math.max(20, (content?.length ?? 0) * fontSize * 0.62);
  return { x: 0, y: 0, width, height: fontSize * 1.25 };
};

const fittedSize = (node: PenNode, context: MaterializeContext): Placed | undefined => {
  const estimated = estimatedTextSize(node, context);
  if (estimated) return estimated;
  if (!isLayoutContainer(node)) return undefined;
  const layout = node.layout ?? (node.type === "frame" ? "horizontal" : "none");
  if (layout === "none") return undefined;
  const gap = resolveNumber(node.gap, context) ?? 0;
  const padding = parsePadding(resolveValue(node.padding, context), context);
  let main = 0;
  let cross = 0;
  for (const child of (node.children ?? []).filter((child) => child.layoutPosition !== "absolute")) {
    const width = resolveNumber(child.width, context);
    const height = resolveNumber(child.height, context);
    const placed: Placed = width !== undefined && height !== undefined ? { x: 0, y: 0, width, height } : (fittedSize(child, context) ?? { x: 0, y: 0, width: 0, height: 0 });
    main += childMainSize(placed, layout);
    cross = Math.max(cross, childCrossSize(placed, layout));
  }
  main += Math.max(0, (node.children ?? []).filter((child) => child.layoutPosition !== "absolute").length - 1) * gap;
  return layout === "vertical"
    ? { x: 0, y: 0, width: cross + padding[1] + padding[3], height: main + padding[0] + padding[2] }
    : { x: 0, y: 0, width: main + padding[1] + padding[3], height: cross + padding[0] + padding[2] };
};

const arrangeChildren = (parent: PenNode, children: PenNode[], context: MaterializeContext, parentPlaced?: Placed): void => {
  const layout = parent.layout ?? (parent.type === "frame" ? "horizontal" : "none");
  const padding = parsePadding(resolveValue(parent.padding, context), context);
  const gap = resolveNumber(parent.gap, context) ?? 0;
  const parentWidth = parentPlaced?.width ?? resolveNumber(parent.width, context);
  const parentHeight = parentPlaced?.height ?? resolveNumber(parent.height, context);
  const contentWidth = parentWidth !== undefined ? Math.max(0, parentWidth - padding[1] - padding[3]) : undefined;
  const contentHeight = parentHeight !== undefined ? Math.max(0, parentHeight - padding[0] - padding[2]) : undefined;
  const justifyContent = parent.justifyContent ?? "start";
  const alignItems = parent.alignItems ?? "start";
  if (justifyContent !== "start" && justifyContent !== "center" && justifyContent !== "end") {
    diagnostic(context.diagnostics, "PEN_LAYOUT_UNSUPPORTED", `justifyContent '${justifyContent}' falls back to start.`, context.path);
  }
  const mainAxis = layout === "vertical" ? "y" : "x" as const;
  const crossAxis = layout === "vertical" ? "x" : "y" as const;

  if (layout === "none") {
    for (const child of children) {
      const width = resolveNumber(child.width, context);
      const height = resolveNumber(child.height, context);
      const placed: Placed | undefined = width !== undefined && height !== undefined ? { x: 0, y: 0, width, height } : fittedSize(child, context);
      if (!placed) {
        diagnostic(context.diagnostics, "PEN_SIZE_UNSPECIFIED", `Cannot size node '${child.id}'.`, `${context.path}/children/${child.id}`);
        continue;
      }
      placed.x = resolveNumber(child.x, context) ?? 0;
      placed.y = resolveNumber(child.y, context) ?? 0;
      context.placements.set(child.id, placed);
    }
    return;
  }

  const entries: { node: PenNode; placed: Placed; fillMain: boolean }[] = [];
  let totalMain = 0;
  for (const child of children) {
    if (child.layoutPosition === "absolute") continue;
    const fillMain = (layout === "vertical" ? child.height === "fill_container" : child.width === "fill_container");
    const fillCross = (layout === "vertical" ? child.width === "fill_container" : child.height === "fill_container");
    let width = resolveNumber(child.width, context);
    let height = resolveNumber(child.height, context);
    if (width === undefined || height === undefined) {
      if (layout === "vertical") {
        if (fillMain && height === undefined) height = 0;
        if (fillCross && width === undefined) width = 0;
      } else {
        if (fillMain && width === undefined) width = 0;
        if (fillCross && height === undefined) height = 0;
      }
      if (width === undefined || height === undefined) {
        const fitted = fittedSize(child, context);
        if (fitted) {
          if (width === undefined) width = fitted.width;
          if (height === undefined) height = fitted.height;
        }
      }
    }
    if (width === undefined || height === undefined) {
      diagnostic(context.diagnostics, "PEN_SIZE_UNSPECIFIED", `Cannot size child '${child.id}' of layout '${layout}'.`, `${context.path}/children/${child.id}`);
      continue;
    }
    const resolved: Placed = { x: 0, y: 0, width, height };
    if (fillCross) {
      const crossSize = layout === "vertical" ? contentWidth : contentHeight;
      if (crossSize !== undefined) {
        if (layout === "vertical") resolved.width = Math.max(0, crossSize);
        else resolved.height = Math.max(0, crossSize);
      }
    }
    if (!fillMain) totalMain += childMainSize(resolved, layout);
    entries.push({ node: child, placed: resolved, fillMain });
  }
  const fillers = entries.filter((entry) => entry.fillMain);
  const contentMain = layout === "horizontal" ? contentWidth : contentHeight;
  const available = contentMain !== undefined ? Math.max(0, contentMain - totalMain - Math.max(0, entries.length - 1) * gap) : 0;
  const fillSize = fillers.length > 0 ? available / fillers.length : 0;
  const totalContent = totalMain + fillers.length * fillSize + Math.max(0, entries.length - 1) * gap;
  const justifyOffset = contentMain === undefined || justifyContent === "start" ? 0 : justifyContent === "end" ? Math.max(0, contentMain - totalContent) : Math.max(0, contentMain - totalContent) / 2;

  let cursor = (mainAxis === "x" ? padding[3] : padding[0]) + justifyOffset;
  for (const entry of entries) {
    const width = entry.fillMain && layout === "horizontal" ? entry.placed.width + fillSize : entry.placed.width;
    const height = entry.fillMain && layout === "vertical" ? entry.placed.height + fillSize : entry.placed.height;
    const crossSize = layout === "vertical" ? contentWidth : contentHeight;
    const cross = crossSize !== undefined ? Math.max(0, crossSize) : undefined;
    const childCross = layout === "vertical" ? width : height;
    const crossOffset = cross === undefined || alignItems === "start" ? 0 : alignItems === "end" ? Math.max(0, cross - childCross) : Math.max(0, cross - childCross) / 2;
    const x = layout === "horizontal" ? cursor : padding[1] + crossOffset;
    const y = layout === "vertical" ? cursor : padding[0] + crossOffset;
    context.placements.set(entry.node.id, { x, y, width, height });
    cursor += (layout === "vertical" ? height : width) + gap;
  }

  for (const child of children) {
    if (child.layoutPosition !== "absolute") continue;
    let width = resolveNumber(child.width, context);
    let height = resolveNumber(child.height, context);
    if (width === undefined || height === undefined) {
      const fitted = fittedSize(child, context);
      if (fitted) {
        if (width === undefined) width = fitted.width;
        if (height === undefined) height = fitted.height;
      }
    }
    if (width === undefined || height === undefined) {
      diagnostic(context.diagnostics, "PEN_SIZE_UNSPECIFIED", `Cannot size absolute child '${child.id}'.`, `${context.path}/children/${child.id}`);
      continue;
    }
    const placed: Placed = { x: 0, y: 0, width, height };
    placed.x = resolveNumber(child.x, context) ?? 0;
    placed.y = resolveNumber(child.y, context) ?? 0;
    context.placements.set(child.id, placed);
  }
};

const layoutTree = (node: PenNode, context: MaterializeContext, placed?: Placed): void => {
  const children = Array.isArray(node.children) ? node.children : [];
  if (children.length > 0) arrangeChildren(node, children, context, placed);
  for (const child of children) {
    if (isLayoutContainer(child) && (child.children ?? []).length > 0) {
      const childPlaced = context.placements.get(child.id);
      if (childPlaced) layoutTree(child, context, childPlaced);
    }
  }
};

const parseChildren = (value: unknown, diagnostics: PenImportDiagnostic[], path: string): PenNode[] | undefined => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    diagnostic(diagnostics, "PEN_DOCUMENT_INVALID", "children must be an array.", path);
    return undefined;
  }
  const children: PenNode[] = [];
  for (const [index, rawChild] of value.entries()) {
    const childPath = `${path}/children[${index}]`;
    const node = asPenNode(rawChild, childPath);
    if (!node) {
      diagnostic(diagnostics, "PEN_DOCUMENT_INVALID", "Every child must be an object with a unique id and a non-empty type.", childPath);
      return undefined;
    }
    children.push(node);
  }
  return children;
};

const materializeNode = (node: PenNode, context: MaterializeContext): PenNode | undefined => {
  const nodePath = `${context.path}/${node.id}`;
  const nodeContext: MaterializeContext = { ...context, path: nodePath, theme: node.theme ? { ...context.theme, ...node.theme } : context.theme };
  if (node.type === "ref") {
    if (!isString(node.ref)) {
      diagnostic(context.diagnostics, "PEN_REF_UNRESOLVED", `Instance '${node.id}' has no ref target.`, nodePath);
      return undefined;
    }
    if (context.visitedRefs.has(node.ref)) {
      diagnostic(context.diagnostics, "PEN_REF_CYCLE", `Instance '${node.id}' references '${node.ref}' in a cycle.`, nodePath);
      return undefined;
    }
    const component = context.components.get(node.ref);
    if (!component) {
      diagnostic(context.diagnostics, "PEN_REF_UNRESOLVED", `Instance '${node.id}' references missing component '${node.ref}'.`, nodePath);
      return undefined;
    }
    const visitedRefs = new Set(context.visitedRefs);
    visitedRefs.add(node.ref);
    return cloneComponent(component, node, { ...nodeContext, visitedRefs });
  }
  if (node.type === "frame" || node.type === "group") {
    const children = parseChildren(node.children, context.diagnostics, nodePath);
    if (children === undefined) return undefined;
    return { ...node, children: children.map((child) => materializeNode(child, nodeContext)).filter((child): child is PenNode => child !== undefined) };
  }
  return node;
};

const cloneComponent = (component: PenNode, instance: PenNode, context: MaterializeContext): PenNode | undefined => {
  const cloned = materializeNode(component, context);
  if (!cloned) return undefined;
  const root = structuredClone({ ...cloned, id: instance.id });
  applyDescendants(root, instance.descendants ?? {}, component, context);
  for (const child of Array.isArray(root.children) ? root.children : []) remapInstanceIds(child, `${instance.id}__`);
  for (const key of ["fill", "stroke", "opacity", "enabled", "rotation", "cornerRadius", "content", "width", "height", "x", "y"] as const) {
    if (instance[key] !== undefined) (root as Record<string, unknown>)[key] = instance[key];
  }
  return root;
};

const remapInstanceIds = (node: PenNode, prefix: string): void => {
  if (node.id.startsWith(prefix)) return;
  const original = node.id;
  node.id = `${prefix}${original}`;
  for (const child of Array.isArray(node.children) ? node.children : []) remapInstanceIds(child, prefix);
};

const applyDescendants = (cloned: PenNode, descendants: Record<string, Record<string, unknown>>, component: PenNode, context: MaterializeContext): void => {
  const clonedChildren = Array.isArray(cloned.children) ? cloned.children : [];
  const componentChildren = Array.isArray(component.children) ? component.children : [];
  for (const [key, value] of Object.entries(descendants)) {
    if (key === component.id) {
      applyOverride(cloned, value, component, context);
      continue;
    }
    const slash = key.indexOf("/");
    const head = slash >= 0 ? key.slice(0, slash) : key;
    const rest = slash >= 0 ? key.slice(slash + 1) : undefined;
    const index = componentChildren.findIndex((child) => child.id === head);
    const clonedChild = index >= 0 ? clonedChildren[index] : undefined;
    if (!clonedChild) continue;
    if (rest === undefined) applyOverride(clonedChild, value, componentChildren[index]!, context);
    else applyDescendants(clonedChild, { [rest]: value }, componentChildren[index]!, context);
  }
};

const applyOverride = (target: PenNode, override: Record<string, unknown>, original: PenNode, context: MaterializeContext): void => {
  if (isString(override.type)) {
    const replacement = materializeNode(override as PenNode, context);
    if (!replacement) return;
    const replacementId = isString(override.id) ? override.id : original.id;
    target.id = replacementId;
    for (const key of Object.keys(replacement)) delete (target as Record<string, unknown>)[key];
    Object.assign(target, replacement, { id: replacementId });
    return;
  }
  for (const key of Object.keys(override)) {
    if (key === "id" || key === "type") continue;
    (target as Record<string, unknown>)[key] = override[key];
  }
};

const collectComponents = (node: PenNode, components: Map<string, PenNode>): void => {
  if (node.reusable === true) components.set(node.id, node);
  for (const child of Array.isArray(node.children) ? node.children : []) collectComponents(child, components);
};

const sceneLayer = (node: PenNode, placed: Placed, accumulated: { x: number; y: number }, context: MaterializeContext, zIndex: number): Layer | undefined => {
  const path = `${context.path}/${node.id}`;
  const layerContext: MaterializeContext = { ...context, path, theme: node.theme ? { ...context.theme, ...node.theme } : context.theme };
  const bounds = { x: accumulated.x + placed.x, y: accumulated.y + placed.y, width: placed.width, height: placed.height };
  const fill = firstColorFill(node.fill, layerContext);
  const stroke = firstColorStroke(node.stroke, layerContext);
  const nodeOpacity = resolveNumber(node.opacity, layerContext);
  const opacity = fill?.opacity ?? nodeOpacity ?? 1;
  const visible = node.enabled === undefined ? true : (resolveBoolean(node.enabled, layerContext) ?? true);
  const name = isString(node.name) && node.name.length > 0 ? node.name : node.type;
  const base = {
    id: node.id,
    name,
    bounds,
    transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    fill: fill?.color ?? "#00000000",
    stroke: stroke ?? "#00000000",
    opacity: Math.min(1, Math.max(0, opacity)),
    cornerRadius: resolveCornerRadius(node.cornerRadius, layerContext) ?? 0,
    visible,
    zIndex
  };
  const rotation = resolveNumber(node.rotation, layerContext);
  if (rotation !== undefined && rotation !== 0) diagnostic(context.diagnostics, "PEN_ROTATION_IGNORED", `Rotation ${rotation}° is not supported yet.`, path);
  switch (node.type) {
    case "group":
    case "frame": {
      const children: Layer[] = [];
      for (const [index, child] of (Array.isArray(node.children) ? node.children : []).entries()) {
        const childPlaced = context.placements.get(child.id);
        if (!childPlaced) continue;
        const mapped = sceneLayer(child, childPlaced, { x: bounds.x, y: bounds.y }, layerContext, index);
        if (mapped) children.push(mapped);
      }
      return { ...base, type: "group", children };
    }
    case "rectangle":
      return { ...base, type: "rectangle" };
    case "ellipse":
      diagnostic(context.diagnostics, "PEN_ELLIPSE_APPROXIMATED", `Ellipse '${node.id}' is approximated as a rectangle.`, path);
      return { ...base, type: "rectangle" };
    case "text": {
      const content = isString(node.content) ? (resolveValue(node.content, layerContext) as string) : undefined;
      return { ...base, type: "text", ...(content !== undefined ? { text: content } : {}) };
    }
    default:
      diagnostic(context.diagnostics, "PEN_NODE_UNSUPPORTED", `Node type '${node.type}' is not supported yet.`, path);
      return undefined;
  }
};

export const importPenDocument = (input: unknown): PenImportResult => {
  const diagnostics: PenImportDiagnostic[] = [];
  const document = parsePenDocument(input, diagnostics);
  if (!document) return { ok: false, diagnostics };
  const components = new Map<string, PenNode>();
  for (const child of document.children) collectComponents(child, components);
  const rootContext: MaterializeContext = {
    variables: document.variables ?? {},
    components,
    theme: themeDefault(document),
    visitedRefs: new Set(),
    path: "/",
    diagnostics,
    placements: new Map()
  };
  const materialized: PenNode[] = [];
  for (const child of document.children) {
    const node = materializeNode(child, rootContext);
    if (node) materialized.push(node);
  }
  if (materialized.length === 0) diagnostic(diagnostics, "PEN_EMPTY_DOCUMENT", "The .pen document contains no importable nodes.", "/");

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  const topLevel: { node: PenNode; placed: Placed }[] = [];
  for (const node of materialized) {
    let width = resolveNumber(node.width, rootContext);
    let height = resolveNumber(node.height, rootContext);
    if (width === undefined || height === undefined) {
      const fitted = fittedSize(node, rootContext);
      if (fitted) {
        if (width === undefined) width = fitted.width;
        if (height === undefined) height = fitted.height;
      }
    }
    if (width === undefined || height === undefined) {
      diagnostic(diagnostics, "PEN_SIZE_UNSPECIFIED", `Top-level node '${node.id}' has no resolvable size.`, `/children/${node.id}`);
      continue;
    }
    const x = resolveNumber(node.x, rootContext) ?? 0;
    const y = resolveNumber(node.y, rootContext) ?? 0;
    const placed: Placed = { x, y, width, height };
    topLevel.push({ node, placed });
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + placed.width);
    maxY = Math.max(maxY, y + placed.height);
  }
  const canvasWidth = Number.isFinite(maxX - minX) && maxX > minX ? maxX - minX : 1280;
  const canvasHeight = Number.isFinite(maxY - minY) && maxY > minY ? maxY - minY : 800;
  const canvasX = Number.isFinite(minX) ? minX : 0;
  const canvasY = Number.isFinite(minY) ? minY : 0;

  const canvasFrame: Frame = { id: "pen-canvas", name: "Imported canvas", bounds: { x: canvasX, y: canvasY, width: canvasWidth, height: canvasHeight }, layers: [], stories: [] };
  for (const { node, placed } of topLevel) {
    if (isLayoutContainer(node) && (node.children ?? []).length > 0) layoutTree(node, rootContext, placed);
    rootContext.placements.set(node.id, placed);
    const layer = sceneLayer(node, placed, { x: 0, y: 0 }, rootContext, canvasFrame.layers.length);
    if (layer) canvasFrame.layers.push(layer);
  }

  const scene: Scene = { schemaVersion: 1, id: "scene-pen-imported", name: "Imported from .pen", revision: 0, frames: [canvasFrame] };
  const validation = validateScene(scene);
  if (!validation.ok || !validation.value) {
    const reason = validation.diagnostics.map((item) => `${item.path}: ${item.message}`).join("; ");
    diagnostic(diagnostics, "PEN_SCENE_INVALID", `The imported scene failed validation: ${reason}`, "/");
    return { ok: false, diagnostics };
  }
  try {
    // The Scene is the intermediate, not the output: the kernel's adapter is
    // the single implementation of scene→document mapping, and the migration
    // chain attaches the default page canvases. Any adapter failure (a node
    // kind or id the document model rejects) surfaces as a diagnostic.
    const migrated = migrateDocument(sceneToEditorDocument(validation.value));
    if (!migrated.ok || !migrated.document) {
      const reason = migrated.diagnostics.map((item) => `${item.path}: ${item.message}`).join("; ");
      diagnostic(diagnostics, "PEN_DOCUMENT_INVALID", `The imported document failed migration: ${reason}`, "/");
      return { ok: false, diagnostics };
    }
    return { ok: true, document: migrated.document, diagnostics };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    diagnostic(diagnostics, "PEN_DOCUMENT_INVALID", message, "/");
    return { ok: false, diagnostics };
  }
};

export const parsePenFile = (source: string): PenImportResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source) as unknown;
  } catch {
    return { ok: false, diagnostics: [{ code: "PEN_JSON_INVALID", message: "The file is not valid JSON.", path: "/" }] };
  }
  return importPenDocument(parsed);
};
