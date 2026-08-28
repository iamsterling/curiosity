import { applyDocumentCommand, type DocumentCommand } from "./commands.js";
import { buildClipboardContent, clipboardSubtreeBounds, planClipboardInsert, type ClipboardContent, type PasteDiagnostic, type PasteOutcome } from "./clipboard.js";
import { clampViewport, clampWorldLimit, type Point } from "./coordinates.js";
import type { DocumentId, DocumentNode, EditorDocument, EditorDocumentV1, PointId, Rect } from "./document.js";
import { canonicalEditorDocumentString, migrateDocument } from "./document.js";
import { documentHitTest, initialInteractionState, marqueeSelectableIds, type EditorTool, type InteractionState } from "./interaction.js";
import { LastValidLayoutResolver, projectResolvedDocument, type LayoutEvaluator, type MeasurementDependency } from "./layout.js";
import { resolveScene, resolvedSceneToDocument, type ResolvedScene } from "./component-resolution.js";

export interface EditorState {
  activeTool: EditorTool;
  currentPageId: DocumentId;
  selectedIds: DocumentId[];
  selectedPointIds: PointId[];
  hoveredId?: DocumentId;
  focusedId?: DocumentId;
  isolationRootId?: DocumentId;
  viewport: { panX: number; panY: number; zoom: number; devicePixelRatio: number };
  interaction: InteractionState;
  documentRevision: number;
  pasteDiagnostics: PasteDiagnostic[];
  /** Session-only intent for newly authored geometry; never serialized or recorded in history. */
  creationStyle: CreationStyle;
}

export interface CreationStyle { fill: string; stroke: string }
export const DEFAULT_CREATION_STYLE: Readonly<CreationStyle> = {
  fill: "#818cf8",
  stroke: "#c4b5fd",
};

export interface KernelProjection {
  document: EditorDocument;
  resolvedDocument: EditorDocument;
  resolvedScene: ResolvedScene;
  resolvedBoxes: Record<DocumentId, Rect>;
  layoutDiagnostics: string[];
  measurementDependencies: MeasurementDependency[];
  state: EditorState;
  documentRevision: number;
}

export interface LegalDropDestination {
  parentId: DocumentId;
  index: number;
  /** The row affordance this destination represents. */
  position: "before" | "after" | "inside";
  targetId?: DocumentId;
}

interface HistoryEntry { label: string; commands: DocumentCommand[]; inverses: DocumentCommand[]; pageId: DocumentId; selectionBefore: DocumentId[]; selectionAfter: DocumentId[]; pointSelectionBefore: PointId[]; pointSelectionAfter: PointId[]; }
interface Transaction { label: string; commands: DocumentCommand[]; inverses: DocumentCommand[]; beforeDocument: EditorDocument; workingDocument: EditorDocument; pageId: DocumentId; selectionBefore: DocumentId[]; pointSelectionBefore: PointId[]; }

export interface EditorKernel {
  getDocument(): EditorDocument;
  getState(): EditorState;
  getProjection(): KernelProjection;
  setLayoutEvaluator(evaluator?: LayoutEvaluator): void;
  subscribe(listener: () => void): () => void;
  setTool(tool: EditorTool): void;
  setCreationFill(fill: string): void;
  setCreationStroke(stroke: string): void;
  setSelection(ids: DocumentId[]): void;
  toggleSelection(ids: DocumentId[]): void;
  /** Ephemeral structure-panel scope; never serialized or recorded in history. */
  enterIsolation(rootId: DocumentId): boolean;
  exitIsolation(): boolean;
  legalDropDestinations(nodeId: DocumentId): LegalDropDestination[];
  /** Select every visible, unlocked node on the current page — ⌘A. */
  selectAll(): void;
  /** The hovered node under the cursor (select tool, not dragging) — the
   *  highlight's driver. Undefined clears it. */
  setHovered(id?: DocumentId): void;
  duplicateSelection(offset?: { x: number; y: number }): void;
  /** The clone commands for a named set — the alt-drag duplicate's plan.
   *  `mintedIds[i]` is the copy of `ids[i]`; children of a named ancestor
   *  ride along inside its clone and get no root of their own. */
  planDuplicate(ids: DocumentId[], offset: { x: number; y: number }): { commands: DocumentCommand[]; mintedIds: DocumentId[] };
  marqueeSelect(world: Rect, additive: boolean, scopeId?: DocumentId): void;
  setPointSelection(ids: PointId[]): void;
  togglePointSelection(ids: PointId[]): void;
  setViewport(viewport: EditorState["viewport"]): void;
  setInteraction(interaction: InteractionState): void;
  beginTransaction(label: string): void;
  preview(command: DocumentCommand | DocumentCommand[]): void;
  commit(command?: DocumentCommand): void;
  rollback(): void;
  dispatch(command: DocumentCommand, label?: string): void;
  dispatchBatch(commands: DocumentCommand[], label: string): void;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  getHistoryDepths(): { undo: number; redo: number };
  serialize(): string;
  /** Replace authored state at a sync/save boundary; never records history. */
  replaceDocument(document: EditorDocument | EditorDocumentV1, documentRevision?: number): void;
  getClipboard(): ClipboardContent | undefined;
  setClipboard(content: ClipboardContent | undefined): void;
  copySelection(): ClipboardContent | undefined;
  paste(content: ClipboardContent | undefined, atWorld: Point, options?: { parentId?: DocumentId }): PasteOutcome | undefined;
  pasteInPlace(): PasteOutcome | undefined;
  pastePreview(atWorld: Point, options?: { parentId?: DocumentId }): { bounds: Rect; parentId: DocumentId } | undefined;
}

const clone = <T>(value: T): T => structuredClone(value);

/** Point ids are node-local to a path node's geometry; selection filters against live geometry everywhere a node id would. */
const pointExistsInDocument = (document: EditorDocument, pointId: string): boolean => {
  for (const node of Object.values(document.nodes)) {
    if (node.kind === "path" && node.path && node.path.points[pointId]) return true;
  }
  return false;
};

export const createEditorKernel = (initialDocument: EditorDocument | EditorDocumentV1): EditorKernel => {
  const migrated = migrateDocument(initialDocument);
  if (!migrated.ok || !migrated.document) throw new Error(migrated.diagnostics[0]?.message ?? "EDITOR_DOCUMENT_INVALID");
  let document = migrated.document;
  let layoutResolver: LastValidLayoutResolver | undefined;
  const initialPageId = document.pageOrder[0]!;
  const initialRest = document.pages[initialPageId]!.canvas.rest;
  let state: EditorState = { activeTool: "select", currentPageId: initialPageId, selectedIds: [], selectedPointIds: [], viewport: { panX: initialRest.panX, panY: initialRest.panY, zoom: initialRest.zoom, devicePixelRatio: 1 }, interaction: initialInteractionState(), documentRevision: 0, pasteDiagnostics: [], creationStyle: { ...DEFAULT_CREATION_STYLE } };
  const undoStack: HistoryEntry[] = [];
  const redoStack: HistoryEntry[] = [];
  let transaction: Transaction | undefined;
  let clipboard: ClipboardContent | undefined;
  const makeId = (prefix: string): string =>
    `${prefix}-${crypto.randomUUID?.() ?? Date.now().toString(36)}`;
  const listeners = new Set<() => void>();
  let changeCounter = 0;
  let documentCache: { documentRevision: number; document: EditorDocument } | undefined;
  let projectionCache: { change: number; projection: KernelProjection } | undefined;
  const pageSelections: Record<DocumentId, DocumentId[]> = {};
  const pageCameras: Record<DocumentId, EditorState["viewport"]> = {};

  const isDescendantOf = (nodeId: DocumentId, ancestorId: DocumentId): boolean => {
    let cursor = document.nodes[nodeId];
    while (cursor?.parentId) {
      if (cursor.parentId === ancestorId) return true;
      cursor = document.nodes[cursor.parentId];
    }
    return false;
  };
  const inIsolation = (nodeId: DocumentId): boolean => !state.isolationRootId || nodeId === state.isolationRootId || isDescendantOf(nodeId, state.isolationRootId);
  const legalDropDestinations = (nodeId: DocumentId): LegalDropDestination[] => {
    const node = document.nodes[nodeId];
    if (!node || !node.parentId || !inIsolation(nodeId)) return [];
    const result: LegalDropDestination[] = [];
    const visit = (parentId: DocumentId, targetId?: DocumentId): void => {
      const parent = document.nodes[parentId];
      if (!parent || !inIsolation(parentId) || parent.locked || (parent.kind !== "frame" && parent.kind !== "group" && parent.kind !== "page-root")) return;
      const children = parent.childIds.filter((id) => id !== nodeId);
      const targetIndex = targetId ? children.indexOf(targetId) : -1;
      if (targetId && targetIndex >= 0) {
        result.push({ parentId, index: targetIndex, position: "before", targetId });
        result.push({ parentId, index: targetIndex + 1, position: "after", targetId });
      }
      if (parentId !== nodeId && !isDescendantOf(parentId, nodeId)) result.push({ parentId, index: children.length, position: "inside" });
    };
    for (const parent of Object.values(document.nodes)) {
      if (!inIsolation(parent.id)) continue;
      visit(parent.id);
      for (const childId of parent.childIds) if (childId !== nodeId) visit(parent.id, childId);
    }
    return result;
  };

  const emit = (): void => { changeCounter += 1; projectionCache = undefined; for (const listener of listeners) listener(); };
  const switchToPage = (pageId: DocumentId, selection?: DocumentId[]): void => {
    const page = document.pages[pageId];
    if (!page) return;
    const previous = state.currentPageId;
    if (previous !== pageId && document.pages[previous]) {
      pageSelections[previous] = [...state.selectedIds];
      pageCameras[previous] = { ...state.viewport };
    }
    // Undo/redo on the page you are already on must not move the camera: the
    // live viewport is ephemeral editor state, not a history subject. Only a
    // real page change restores the session or rest camera.
    const camera = pageId === state.currentPageId
      ? state.viewport
      : pageCameras[pageId] ?? { panX: page.canvas.rest.panX, panY: page.canvas.rest.panY, zoom: page.canvas.rest.zoom };
    const nextSelection = (selection ?? pageSelections[pageId] ?? []).filter((id) => document.nodes[id] !== undefined);
    pageSelections[pageId] = [...nextSelection];
    state = { ...state, currentPageId: pageId, selectedIds: nextSelection, selectedPointIds: [], viewport: { ...camera, devicePixelRatio: state.viewport.devicePixelRatio } };
    delete state.isolationRootId;
    delete state.hoveredId;
  };
  const apply = (command: DocumentCommand): { inverse: DocumentCommand; changed: boolean } => {
    if (command.type === "set-page") {
      if (!document.pages[command.pageId]) throw new Error(`DOCUMENT_PAGE_MISSING:${command.pageId}`);
      switchToPage(command.pageId);
      emit();
      return { inverse: command, changed: false };
    }
    const result = applyDocumentCommand(document, command);
    document = result.document;
    state = { ...state, documentRevision: state.documentRevision + (result.changed ? 1 : 0), selectedIds: state.selectedIds.filter((id) => document.nodes[id] !== undefined), selectedPointIds: state.selectedPointIds.filter((id) => pointExistsInDocument(document, id)) };
    if (state.isolationRootId && !document.nodes[state.isolationRootId]) delete state.isolationRootId;
    if (command.type === "delete-page") {
      delete pageSelections[command.pageId];
      delete pageCameras[command.pageId];
      if (!document.pages[state.currentPageId] && document.pageOrder.length > 0) switchToPage(document.pageOrder[0]!);
    } else if (command.type === "set-page-viewport") {
      pageCameras[command.pageId] = { ...command.viewport, devicePixelRatio: state.viewport.devicePixelRatio };
      if (command.pageId === state.currentPageId) state = { ...state, viewport: { ...command.viewport, devicePixelRatio: state.viewport.devicePixelRatio } };
    }
    emit();
    return { inverse: result.inverse, changed: result.changed };
  };
  const record = (label: string, command: DocumentCommand, inverse: DocumentCommand, selectionBefore: DocumentId[], pointSelectionBefore: PointId[], pageId: DocumentId): void => {
    undoStack.push({ label, commands: [command], inverses: [inverse], pageId, selectionBefore: [...selectionBefore], selectionAfter: [...state.selectedIds], pointSelectionBefore: [...pointSelectionBefore], pointSelectionAfter: [...state.selectedPointIds] });
    redoStack.length = 0;
  };
  // Which container receives a paste is an editing rule, resolved over the
  // AUTHORED document (visibility- and lock-respecting, topmost, path-aware) —
  // never over a projected scene or viewport state.
  const currentResolvedDocument = (): EditorDocument => {
    const resolvedScene = resolveScene(document, { pageId: state.currentPageId, documentRevision: state.documentRevision });
    const resolvedDocument = resolvedSceneToDocument(document, resolvedScene);
    if (!layoutResolver) return resolvedDocument;
    return projectResolvedDocument(resolvedDocument, layoutResolver.resolve(resolvedDocument, state.currentPageId).boxes);
  };
  const pasteTargetParent = (atWorld: Point): DocumentId => {
    const rootId = document.pages[state.currentPageId]?.rootId;
    if (!rootId) throw new Error(`DOCUMENT_PAGE_MISSING:${state.currentPageId}`);
    const hit = documentHitTest(currentResolvedDocument(), state.currentPageId, atWorld);
    if (hit && hit !== rootId) {
      const node = document.nodes[hit];
      if (node && (node.kind === "frame" || node.kind === "group")) return hit;
    }
    return rootId;
  };
  return {
    getDocument: () => clone(document),
    getState: () => clone(state),
    getProjection() {
      const cachedProjection = projectionCache;
      if (cachedProjection && cachedProjection.change === changeCounter) return cachedProjection.projection;
      if (!documentCache || documentCache.documentRevision !== state.documentRevision) {
        documentCache = { documentRevision: state.documentRevision, document: clone(document) };
      }
       const resolvedScene = resolveScene(documentCache.document, { pageId: state.currentPageId, documentRevision: state.documentRevision });
       const resolvedDocument = resolvedSceneToDocument(documentCache.document, resolvedScene);
       const layout = layoutResolver?.resolve(resolvedDocument, state.currentPageId) ?? { boxes: {}, diagnostics: [], measurementDependencies: [] };
       const projection: KernelProjection = { document: documentCache.document, resolvedDocument: projectResolvedDocument(resolvedDocument, layout.boxes), resolvedScene, resolvedBoxes: layout.boxes, layoutDiagnostics: [...layout.diagnostics, ...resolvedScene.diagnostics.map((entry) => entry.code)], measurementDependencies: layout.measurementDependencies, state, documentRevision: state.documentRevision };
      projectionCache = { change: changeCounter, projection };
      return projection;
    },
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setLayoutEvaluator(evaluator) { layoutResolver = evaluator ? new LastValidLayoutResolver(evaluator) : undefined; emit(); },
    setTool(tool) { state = { ...state, activeTool: tool, interaction: initialInteractionState(tool) }; delete state.hoveredId; delete state.isolationRootId; emit(); },
    setCreationFill(fill) {
      if (state.creationStyle.fill === fill) return;
      state = { ...state, creationStyle: { ...state.creationStyle, fill } };
      emit();
    },
    setCreationStroke(stroke) {
      if (state.creationStyle.stroke === stroke) return;
      state = { ...state, creationStyle: { ...state.creationStyle, stroke } };
      emit();
    },
    setSelection(ids) {
      const next = [...new Set(ids)].filter((id) => document.nodes[id] !== undefined && inIsolation(id));
      pageSelections[state.currentPageId] = [...next];
       state = { ...state, selectedIds: next }; delete state.hoveredId;
      emit();
    },
    toggleSelection(ids) {
      const next = new Set(state.selectedIds);
      for (const id of new Set(ids)) {
        if (document.nodes[id] === undefined || !inIsolation(id)) continue;
        if (next.has(id)) next.delete(id); else next.add(id);
      }
      const list = [...next];
      pageSelections[state.currentPageId] = [...list];
       state = { ...state, selectedIds: list }; delete state.hoveredId;
      emit();
    },
    enterIsolation(rootId) {
      const node = document.nodes[rootId];
      if (!node || !inIsolation(rootId) || (node.kind !== "frame" && node.kind !== "group")) return false;
      state = { ...state, isolationRootId: rootId, selectedIds: state.selectedIds.filter((id) => inIsolation(id)) };
      emit();
      return true;
    },
    exitIsolation() {
      if (!state.isolationRootId) return false;
      const current = document.nodes[state.isolationRootId];
      const parent = current?.parentId ? document.nodes[current.parentId] : undefined;
      state = { ...state, selectedIds: state.selectedIds.filter((id) => inIsolation(id)), ...(parent && parent.kind !== "page-root" ? { isolationRootId: parent.id } : {}) };
      if (!parent || parent.kind === "page-root") delete state.isolationRootId;
      emit();
      return true;
    },
    legalDropDestinations,
    selectAll() {
      const page = document.pages[state.currentPageId];
      if (!page) return;
      const ids: DocumentId[] = [];
      const scope = state.isolationRootId;
      const visit = (id: DocumentId): void => {
        const node = document.nodes[id];
        if (!node || !node.visible || node.locked) return;
        if (node.kind !== "page-root" && id !== scope) ids.push(id);
        for (const childId of node.childIds) visit(childId);
      };
      visit(scope ?? page.rootId);
      pageSelections[state.currentPageId] = [...ids];
      state = { ...state, selectedIds: ids };
      emit();
    },
    setHovered(id) {
      const next = id !== undefined && document.nodes[id] !== undefined ? id : undefined;
      if (next === state.hoveredId) return;
      const nextState = { ...state };
      if (next !== undefined) nextState.hoveredId = next;
      else delete nextState.hoveredId;
      state = nextState;
      emit();
    },
    // Duplication is one semantic edit: the subtree clone plus its reorder
    // commit as a single batch so undo removes the whole copy at once. The
    // copy is authored, so its ids are freshly minted, never reused. Every
    // named ROOT is cloned (a selected node whose ancestor is also named
    // rides along inside the ancestor's clone — the same rule as a drag);
    // `mintedIds[i]` is the copy of `ids[i]`. `offset` shifts the copies;
    // the harness feeds it the last alt-drag delta so ⌘D repeats ("smart
    // duplicate").
    planDuplicate(ids, offset) {
      const roots: DocumentNode[] = [];
      const selected = new Set(ids);
      for (const id of ids) {
        const node = document.nodes[id];
        if (!node) continue;
        let ancestor = node.parentId;
        let ridesAlong = false;
        while (ancestor) {
          if (selected.has(ancestor)) {
            ridesAlong = true;
            break;
          }
          ancestor = document.nodes[ancestor]?.parentId ?? null;
        }
        if (!ridesAlong) roots.push(node);
      }
      const commands: DocumentCommand[] = [];
      const mintedIds: DocumentId[] = [];
      const cloneNode = (node: DocumentNode, parentId: DocumentId, root: boolean): void => {
        const id = makeId("layer");
        const cloneChildren = (source: DocumentNode, targetId: DocumentId): void => {
          for (const childId of source.childIds) {
            const child = document.nodes[childId];
            if (!child) continue;
            const copiedId = makeId("layer");
            commands.push({
              type: "create-node",
              node: {
                ...structuredClone(child),
                id: copiedId,
                parentId: targetId,
                childIds: [],
              },
            });
            cloneChildren(child, copiedId);
          }
        };
        commands.push({
          type: "create-node",
          node: {
            ...structuredClone(node),
            id,
            parentId,
            childIds: [],
            name: root ? `${node.name} copy` : node.name,
            ...(root
              ? {
                  bounds: {
                    x: node.bounds.x + offset.x,
                    y: node.bounds.y + offset.y,
                    width: node.bounds.width,
                    height: node.bounds.height,
                  },
                }
              : {}),
          },
        });
        cloneChildren(node, id);
        mintedIds.push(id);
      };
      for (const root of roots) {
        const sourceIndex = root.parentId ? (document.nodes[root.parentId]?.childIds.indexOf(root.id) ?? -1) : -1;
        cloneNode(root, root.parentId!, true);
        const copyId = mintedIds[mintedIds.length - 1]!;
        if (sourceIndex >= 0)
          commands.push({ type: "reorder-node", nodeId: copyId, parentId: root.parentId!, index: sourceIndex + 1 });
      }
      return { commands, mintedIds };
    },
    duplicateSelection(offset = { x: 24, y: 24 }) {
      const { commands, mintedIds } = this.planDuplicate(state.selectedIds, offset);
      if (commands.length === 0) return;
      this.dispatchBatch(commands, "Duplicate layer");
      this.setSelection(mintedIds);
    },
    marqueeSelect(world, additive, scopeId) {
      const ids = marqueeSelectableIds(document, state.currentPageId, world, scopeId);
      if (additive) this.toggleSelection(ids);
      else this.setSelection(ids);
    },
    setPointSelection(ids) {
      const next = [...new Set(ids)].filter((id) => pointExistsInDocument(document, id));
      state = { ...state, selectedPointIds: next };
      emit();
    },
    togglePointSelection(ids) {
      const next = new Set(state.selectedPointIds);
      for (const id of new Set(ids)) {
        if (!pointExistsInDocument(document, id)) continue;
        if (next.has(id)) next.delete(id); else next.add(id);
      }
      state = { ...state, selectedPointIds: [...next] };
      emit();
    },
    setViewport(viewport) { state = { ...state, viewport: clampViewport(viewport) }; emit(); },
    setInteraction(interaction) { state = { ...state, interaction }; emit(); },
    beginTransaction(label) { if (transaction) throw new Error("EDITOR_TRANSACTION_ACTIVE"); transaction = { label, commands: [], inverses: [], beforeDocument: clone(document), workingDocument: clone(document), pageId: state.currentPageId, selectionBefore: [...state.selectedIds], pointSelectionBefore: [...state.selectedPointIds] }; },
    preview(command) {
      if (!transaction) throw new Error("EDITOR_TRANSACTION_REQUIRED");
      const commands = Array.isArray(command) ? command : [command];
      // Commands ACCUMULATE across preview calls — an alt-drag mints copies
      // in one preview and moves them in later ones, and one history entry
      // must carry the whole gesture. The inverses are computed
      // INCREMENTALLY against the document state BEFORE each command applied
      // (the resize's inverse must see the copies minted moments earlier, or
      // it fails with DOCUMENT_NODE_MISSING). The transaction's
      // workingDocument advances with each preview; rollback still restores
      // the whole pre-transaction document.
      let working = transaction.workingDocument;
      const inverses: DocumentCommand[] = [];
      for (const entry of commands) {
        apply(entry);
        const result = applyDocumentCommand(working, entry);
        inverses.unshift(result.inverse);
        working = result.document;
      }
      transaction.commands = [...transaction.commands, ...commands];
      transaction.inverses = [...inverses, ...transaction.inverses];
      transaction.workingDocument = working;
    },
    commit(command) {
      if (!transaction) { if (command) this.dispatch(command); return; }
      if (command) apply(command);
      const current = transaction;
      transaction = undefined;
      if (current.commands.length > 0) { undoStack.push({ label: current.label, commands: current.commands, inverses: current.inverses, pageId: current.pageId, selectionBefore: [...current.selectionBefore], selectionAfter: [...state.selectedIds], pointSelectionBefore: [...current.pointSelectionBefore], pointSelectionAfter: [...state.selectedPointIds] }); redoStack.length = 0; }
      emit();
    },
    rollback() { if (!transaction) return; document = transaction.beforeDocument; state = { ...state, documentRevision: state.documentRevision + 1, selectedIds: state.selectedIds.filter((id) => document.nodes[id] !== undefined), selectedPointIds: state.selectedPointIds.filter((id) => pointExistsInDocument(document, id)) }; transaction = undefined; emit(); },
    dispatch(command, label = command.type) {
      if (transaction) throw new Error("EDITOR_TRANSACTION_ACTIVE");
      if ((command.type === "set-page-viewport" || command.type === "set-page") && state.interaction.phase !== "idle") throw new Error("EDITOR_VIEWPORT_GESTURE_ACTIVE");
      const selectionBefore = [...state.selectedIds];
      const pointSelectionBefore = [...state.selectedPointIds];
      const pageId = state.currentPageId;
      const result = apply(command);
      // The live camera is ephemeral editor state: persisting it into the
      // page's rest camera on switch is bookkeeping, never an undoable edit.
      if (result.changed && command.type !== "set-page-viewport") record(label, command, result.inverse, selectionBefore, pointSelectionBefore, pageId);
    },
    dispatchBatch(commands, label) {
      if (transaction) throw new Error("EDITOR_TRANSACTION_ACTIVE");
      if (commands.some((command) => command.type === "set-page-viewport" || command.type === "set-page") && state.interaction.phase !== "idle") throw new Error("EDITOR_VIEWPORT_GESTURE_ACTIVE");
      const selectionBefore = [...state.selectedIds];
      const pointSelectionBefore = [...state.selectedPointIds];
      const pageId = state.currentPageId;
      const inverses: DocumentCommand[] = [];
      const changedCommands: DocumentCommand[] = [];
      // A batch is one semantic edit, so it applies all-or-nothing. Without
      // this, a command that throws partway leaves the earlier ones applied and
      // unrecorded in history — a state the user cannot undo out of.
      const documentBefore = document;
      const stateBefore = state;
      const pageSelectionsBefore = structuredClone(pageSelections);
      const pageCamerasBefore = structuredClone(pageCameras);
      try {
        for (const command of commands) {
          const result = apply(command);
          // Viewport persistence is bookkeeping, never an undoable edit.
          if (result.changed && command.type !== "set-page-viewport") { changedCommands.push(command); inverses.unshift(result.inverse); }
        }
      } catch (error) {
        document = documentBefore;
        state = stateBefore;
        for (const key of Object.keys(pageSelections)) delete pageSelections[key];
        Object.assign(pageSelections, pageSelectionsBefore);
        for (const key of Object.keys(pageCameras)) delete pageCameras[key];
        Object.assign(pageCameras, pageCamerasBefore);
        emit();
        throw error;
      }
      if (changedCommands.length > 0) { undoStack.push({ label, commands: changedCommands, inverses, pageId, selectionBefore: [...selectionBefore], selectionAfter: [...state.selectedIds], pointSelectionBefore: [...pointSelectionBefore], pointSelectionAfter: [...state.selectedPointIds] }); redoStack.length = 0; }
    },
    undo() {
      const entry = undoStack.pop();
      if (!entry) return false;
      for (const command of entry.inverses) apply(command);
      switchToPage(entry.pageId, entry.selectionBefore);
      state = { ...state, selectedPointIds: entry.pointSelectionBefore.filter((id) => pointExistsInDocument(document, id)) };
      emit();
      redoStack.push(entry);
      return true;
    },
    redo() {
      const entry = redoStack.pop();
      if (!entry) return false;
      for (const command of entry.commands) apply(command);
      switchToPage(entry.pageId, entry.selectionAfter);
      state = { ...state, selectedPointIds: entry.pointSelectionAfter.filter((id) => pointExistsInDocument(document, id)) };
      emit();
      undoStack.push(entry);
      return true;
    },
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
    getHistoryDepths: () => ({ undo: undoStack.length, redo: redoStack.length }),
    serialize() { return canonicalEditorDocumentString(document); },
    replaceDocument(nextDocument, documentRevision = 0) {
      const migrated = migrateDocument(nextDocument);
      if (!migrated.ok || !migrated.document) throw new Error(migrated.diagnostics[0]?.code ?? "EDITOR_DOCUMENT_INVALID");
      if (!Number.isInteger(documentRevision) || documentRevision < 0) throw new Error("SYNC_REVISION_INVALID");
      document = migrated.document;
      transaction = undefined;
      undoStack.length = 0;
      redoStack.length = 0;
      for (const key of Object.keys(pageSelections)) delete pageSelections[key];
      for (const key of Object.keys(pageCameras)) delete pageCameras[key];
      const pageId = document.pageOrder[0];
      if (!pageId) throw new Error("DOCUMENT_PAGE_MISSING");
      const rest = document.pages[pageId]!.canvas.rest;
      state = { ...state, currentPageId: pageId, selectedIds: [], selectedPointIds: [], viewport: { panX: rest.panX, panY: rest.panY, zoom: rest.zoom, devicePixelRatio: state.viewport.devicePixelRatio }, documentRevision };
      emit();
    },
    getClipboard: () => (clipboard ? clone(clipboard) : undefined),
    setClipboard(content) { clipboard = content ? clone(content) : undefined; emit(); },
    copySelection() {
      const content = buildClipboardContent(document, state.selectedIds, state.currentPageId, document.file.id);
      clipboard = content ? clone(content) : undefined;
      emit();
      return content;
    },
    paste(content, atWorld, options) {
      const resolved = content ?? clipboard;
      if (!resolved) return undefined;
      const parentId = options?.parentId ?? pasteTargetParent(atWorld);
      if (!parentId || !document.nodes[parentId]) return undefined;
      const plan = planClipboardInsert(document, resolved, parentId, document.nodes[parentId]!.childIds.length, { x: clampWorldLimit(atWorld.x), y: clampWorldLimit(atWorld.y) });
      if (!plan) return undefined;
      state = { ...state, pasteDiagnostics: plan.diagnostics };
      this.dispatch(plan.command, "Paste");
      this.setSelection(plan.mintedRootIds);
      return { mintedRootIds: plan.mintedRootIds, diagnostics: plan.diagnostics };
    },
    pastePreview(atWorld, options) {
      const content = clipboard;
      if (!content) return undefined;
      const parentId = options?.parentId ?? pasteTargetParent(atWorld);
      if (!parentId || !document.nodes[parentId]) return undefined;
      return { bounds: clipboardSubtreeBounds(content, { x: clampWorldLimit(atWorld.x), y: clampWorldLimit(atWorld.y) }), parentId };
    },
    pasteInPlace() {
      const content = clipboard;
      if (!content) return undefined;
      // The copied nodes carry their absolute bounds; paste-in-place anchors
      // the subtree at the source's own top-left corner, so the copy lands
      // exactly where the original was — the ⌘⇧V contract.
      const first = content.nodes[0];
      if (!first) return undefined;
      let minX = first.bounds.x;
      let minY = first.bounds.y;
      for (const node of content.nodes) {
        minX = Math.min(minX, node.bounds.x);
        minY = Math.min(minY, node.bounds.y);
      }
      return this.paste(content, { x: minX, y: minY });
    }
  };
};

export type { Rect };
