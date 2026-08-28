import type { AutoLayout, DocumentId, DocumentNode, EditorDocument, LayoutSizing, Rect } from "./document.js";

export const LAYOUT_CONTRACT_VERSION = 1 as const;

export interface LayoutContractNode {
  id: DocumentId;
  bounds: Rect;
  position: "flow" | "absolute";
  container: Omit<AutoLayout, "behavior"> | null;
  sizing: LayoutSizing;
  measurement: IntrinsicMeasurement | null;
  children: LayoutContractNode[];
}

export interface IntrinsicMeasurement {
  key: string;
  width: number;
  height: number;
}

export interface MeasurementDependency {
  nodeId: DocumentId;
  key: string;
}

export interface LayoutContractInput {
  version: typeof LAYOUT_CONTRACT_VERSION;
  root: LayoutContractNode;
}

export interface LayoutContractOutput {
  version: typeof LAYOUT_CONTRACT_VERSION;
  boxes: Record<DocumentId, Rect>;
  diagnostics: string[];
  measurementDependencies: MeasurementDependency[];
}

export type LayoutEvaluator = (inputJson: string) => string;

export interface ResolvedLayout {
  boxes: Record<DocumentId, Rect>;
  diagnostics: string[];
  measurementDependencies: MeasurementDependency[];
}

const fixedSizing = (): LayoutSizing => ({ horizontal: "fixed", vertical: "fixed" });

export const intrinsicMeasurementKey = (node: DocumentNode): string => JSON.stringify({ id: node.id, text: node.text ?? null, width: node.bounds.width, height: node.bounds.height });

const contractNode = (document: EditorDocument, node: DocumentNode): LayoutContractNode => ({
  id: node.id,
  bounds: structuredClone(node.bounds),
  position: node.layoutPosition ?? "flow",
  container: node.autoLayout === undefined
    ? null
    : {
        direction: node.autoLayout.direction,
        wrap: node.autoLayout.wrap,
        padding: structuredClone(node.autoLayout.padding),
        gap: structuredClone(node.autoLayout.gap),
        primaryAlign: node.autoLayout.primaryAlign,
        counterAlign: node.autoLayout.counterAlign,
      },
  sizing: structuredClone(node.sizing ?? fixedSizing()),
  measurement: node.sizing?.horizontal === "hug" || node.sizing?.vertical === "hug"
    ? { key: intrinsicMeasurementKey(node), width: node.bounds.width, height: node.bounds.height }
    : null,
  children: node.childIds.map((id) => document.nodes[id]).filter((child): child is DocumentNode => child !== undefined).map((child) => contractNode(document, child)),
});

const finiteRect = (value: unknown): value is Rect => {
  if (value === null || typeof value !== "object") return false;
  const rect = value as Partial<Rect>;
  return [rect.x, rect.y, rect.width, rect.height].every((part) => typeof part === "number" && Number.isFinite(part)) && (rect.width ?? -1) >= 0 && (rect.height ?? -1) >= 0;
};

const parseOutput = (json: string, expectedIds: ReadonlySet<DocumentId>): LayoutContractOutput => {
  const value = JSON.parse(json) as Partial<LayoutContractOutput>;
  if (value.version !== LAYOUT_CONTRACT_VERSION || value.boxes === null || typeof value.boxes !== "object" || !Array.isArray(value.diagnostics) || value.diagnostics.some((code) => typeof code !== "string") || !Array.isArray(value.measurementDependencies)) throw new Error("LAYOUT_OUTPUT_INVALID");
  for (const [id, bounds] of Object.entries(value.boxes)) {
    if (!expectedIds.has(id) || !finiteRect(bounds)) throw new Error(`LAYOUT_OUTPUT_INVALID:${id}`);
  }
  for (const id of expectedIds) if (!value.boxes[id]) throw new Error(`LAYOUT_OUTPUT_MISSING:${id}`);
  return value as LayoutContractOutput;
};

const collectIds = (node: LayoutContractNode, ids: Set<DocumentId>): void => {
  ids.add(node.id);
  for (const child of node.children) collectIds(child, ids);
};

/**
 * Adapts authored layout intent into the renderer-independent contract. The
 * evaluator is injected so the kernel subpath never depends on the renderer or
 * a WASM package; browser, native and tests can provide different hosts for the
 * same versioned contract.
 */
export const resolveDocumentLayout = (document: EditorDocument, pageId: DocumentId, evaluate: LayoutEvaluator): ResolvedLayout => {
  const page = document.pages[pageId];
  if (!page) throw new Error(`DOCUMENT_PAGE_MISSING:${pageId}`);
  const boxes: Record<DocumentId, Rect> = {};
  const diagnostics: string[] = [];
  const measurementDependencies: MeasurementDependency[] = [];
  const visit = (node: DocumentNode): void => {
    if (node.autoLayout) {
      const root = contractNode(document, node);
      const ids = new Set<DocumentId>();
      collectIds(root, ids);
      const output = parseOutput(evaluate(JSON.stringify({ version: LAYOUT_CONTRACT_VERSION, root } satisfies LayoutContractInput)), ids);
      Object.assign(boxes, output.boxes);
      diagnostics.push(...output.diagnostics);
      measurementDependencies.push(...output.measurementDependencies);
      for (const id of ids) {
        const leaf = document.nodes[id];
        if (leaf?.kind === "text" && (leaf.sizing?.horizontal === "hug" || leaf.sizing?.vertical === "hug")) diagnostics.push(`LAYOUT_INTRINSIC_FALLBACK:${id}`);
      }
      return;
    }
    for (const childId of node.childIds) {
      const child = document.nodes[childId];
      if (child) visit(child);
    }
  };
  const root = document.nodes[page.rootId];
  if (!root) throw new Error(`DOCUMENT_ROOT_MISSING:${page.rootId}`);
  visit(root);
  return { boxes, diagnostics: [...new Set(diagnostics)], measurementDependencies };
};

export class LastValidLayoutResolver {
  readonly #evaluate: LayoutEvaluator;
  #last: ResolvedLayout = { boxes: {}, diagnostics: [], measurementDependencies: [] };

  constructor(evaluate: LayoutEvaluator) {
    this.#evaluate = evaluate;
  }

  resolve(document: EditorDocument, pageId: DocumentId): ResolvedLayout {
    try {
      this.#last = resolveDocumentLayout(document, pageId, this.#evaluate);
      return structuredClone(this.#last);
    } catch {
      return { boxes: structuredClone(this.#last.boxes), diagnostics: [...this.#last.diagnostics, "LAYOUT_EVALUATOR_FAILED"], measurementDependencies: structuredClone(this.#last.measurementDependencies) };
    }
  }
}

export const projectResolvedDocument = (document: EditorDocument, boxes: Readonly<Record<DocumentId, Rect>>): EditorDocument => {
  if (Object.keys(boxes).length === 0) return document;
  const nodes = { ...document.nodes };
  for (const [id, bounds] of Object.entries(boxes)) {
    const node = nodes[id];
    if (node) nodes[id] = { ...node, bounds: structuredClone(bounds) };
  }
  return { ...document, nodes };
};
