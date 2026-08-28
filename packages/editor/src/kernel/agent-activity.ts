import type { DocumentCommand } from "./commands.js";
import type { DocumentId, Rect } from "./document.js";
import type { EditorKernel } from "./kernel.js";

/** Stable, transport-neutral diagnostics returned by the local operation seam. */
export type AgentDiagnosticCode =
  | "AGENT_REVISION_CONFLICT"
  | "AGENT_CAPABILITY_DENIED"
  | "AGENT_QUERY_LIMIT"
  | "AGENT_COMMAND_LIMIT"
  | "AGENT_PREVIEW_EXPIRED"
  | "AGENT_COMMIT_DUPLICATE"
  | "AGENT_ACTIVITY_LIMIT"
  | "AGENT_OPERATION_MISSING"
  | "AGENT_OPERATION_ALREADY_EXISTS"
  | "AGENT_TRANSACTION_OWNER_MISMATCH"
  | "AGENT_IDEMPOTENCY_KEY_MISMATCH"
  | "AGENT_COMMAND_INVALID";

export interface AgentDiagnostic {
  code: AgentDiagnosticCode;
  message?: string;
}

export interface AgentOperationScope {
  fileId: string;
  nodeIds: DocumentId[];
  bounds?: Rect[];
}

export type AgentCapability =
  | "query:read"
  | "command:write"
  | "persistence:read"
  | "persistence:write"
  | `command:${DocumentCommand["type"]}`;

export interface AgentPersistenceStatus {
  state: "unknown" | "unsaved" | "saving" | "persisted" | "failed";
  persistenceRevision?: number;
  code?: string;
}

export interface AgentOperationRequest {
  operationId: string;
  transactionId: string;
  idempotencyKey: string;
  scope: AgentOperationScope;
  baseRevision: number;
  leaseMs?: number;
}

export type AgentActivityPhase =
  | "thinking"
  | "previewing"
  | "committing"
  | "committed"
  | "rolled-back"
  | "failed"
  | "expired";

export type AgentActivityDiagnosticCode = AgentDiagnosticCode;

export interface AgentActivity {
  operationId: string;
  fileId?: string;
  transactionId?: string;
  baseRevision?: number;
  nodeIds: DocumentId[];
  phase: AgentActivityPhase;
  previewBounds?: Rect[];
  intensity: number;
  seed: number;
  expiresAt?: number;
}

export interface AgentOperationReceipt {
  receiptId: string;
  operationId: string;
  transactionId?: string;
  baseRevision: number;
  committedRevision?: number;
  changedNodeIds: DocumentId[];
  diagnostics: ReadonlyArray<AgentDiagnostic>;
  persisted: boolean;
  persistence: AgentPersistenceStatus;
}

export interface AgentOperationResult {
  operationId: string;
  transactionId: string;
  phase: AgentActivityPhase;
  baseRevision: number;
  currentRevision: number;
  changedNodeIds: DocumentId[];
  diagnostics: ReadonlyArray<AgentDiagnostic>;
  receipt?: AgentOperationReceipt;
}

export interface AgentActivityStore {
  getSnapshot(): readonly AgentActivity[];
  subscribe(listener: () => void): () => void;
  set(activity: AgentActivity): void;
  clear(operationId: string): void;
  expire(now?: number): string[];
}

export interface AgentReceiptStore {
  get(receiptId: string): AgentOperationReceipt | undefined;
  set(receipt: AgentOperationReceipt): void;
  setPersistence(receiptId: string, status: AgentPersistenceStatus): AgentOperationReceipt | undefined;
  values(): readonly AgentOperationReceipt[];
}

export type AgentQueryEnvelope = {
  envelopeId: string;
  actorId: string;
  capabilities: readonly AgentCapability[];
  baseRevision?: number;
  query:
    | { type: "state" }
    | { type: "document-summary" }
    | { type: "nodes"; nodeIds: readonly DocumentId[]; limit?: number }
    | { type: "receipts"; limit?: number }
    | { type: "persistence" };
};

export type AgentCommandEnvelope = {
  envelopeId: string;
  actorId: string;
  capabilities: readonly AgentCapability[];
  baseRevision: number;
  command:
    | { type: "start"; request: AgentOperationRequest }
    | { type: "preview"; operationId: string; commands: DocumentCommand | readonly DocumentCommand[] }
    | { type: "commit"; operationId: string; idempotencyKey: string }
    | { type: "rollback"; operationId: string };
};

export type AgentQueryResult = {
  envelopeId: string;
  currentRevision: number;
  diagnostics: ReadonlyArray<AgentDiagnostic>;
  data?: unknown;
};

export interface CommandRoom {
  query(envelope: AgentQueryEnvelope): AgentQueryResult;
  command(envelope: AgentCommandEnvelope): AgentOperationResult;
  setPersistenceStatus(status: AgentPersistenceStatus): void;
  markReceiptPersistence(receiptId: string, status: AgentPersistenceStatus): AgentOperationReceipt | undefined;
}

export interface LocalAgentOperationService {
  start(request: AgentOperationRequest): AgentOperationResult;
  preview(
    operationId: string,
    commands: DocumentCommand | DocumentCommand[],
  ): AgentOperationResult;
  commit(operationId: string, idempotencyKey: string): AgentOperationResult;
  rollback(operationId: string): AgentOperationResult;
  expire(now?: number): AgentOperationResult[];
}

const TERMINAL_PHASES = new Set<AgentActivityPhase>([
  "committed",
  "rolled-back",
  "failed",
  "expired",
]);

const clampIntensity = (intensity: number): number =>
  Number.isFinite(intensity) ? Math.min(1, Math.max(0, intensity)) : 0;

const DEFAULT_ACTIVITY_LIMIT = 8;
const MAX_NODE_IDS = 64;
const MAX_PREVIEW_BOUNDS = 16;
const MAX_COMMANDS = 32;
const MAX_RECEIPTS = 64;

export const createAgentActivityStore = (
  options: { maxActivities?: number } = {},
): AgentActivityStore => {
  const maxActivities = Math.max(
    1,
    Math.floor(options.maxActivities ?? DEFAULT_ACTIVITY_LIMIT),
  );
  let activities: readonly AgentActivity[] = [];
  const listeners = new Set<() => void>();
  const emit = (): void => {
    for (const listener of listeners) listener();
  };

  return {
    getSnapshot: () => activities,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(activity) {
      const normalized: AgentActivity = {
        ...activity,
        nodeIds: [...new Set(activity.nodeIds)].slice(0, MAX_NODE_IDS),
        ...(activity.previewBounds
          ? {
              previewBounds: activity.previewBounds.slice(
                0,
                MAX_PREVIEW_BOUNDS,
              ),
            }
          : {}),
        intensity: clampIntensity(activity.intensity),
      };
      activities = [
        ...activities.filter(
          (entry) => entry.operationId !== activity.operationId,
        ),
        normalized,
      ].slice(-maxActivities);
      emit();
      if (TERMINAL_PHASES.has(normalized.phase)) {
        activities = activities.filter(
          (entry) => entry.operationId !== normalized.operationId,
        );
        emit();
      }
    },
    clear(operationId) {
      const next = activities.filter(
        (activity) => activity.operationId !== operationId,
      );
      if (next.length === activities.length) return;
      activities = next;
      emit();
    },
    expire(now = Date.now()) {
      const expired = activities
        .filter(
          (activity) =>
            activity.expiresAt !== undefined && activity.expiresAt <= now,
        )
        .map((activity) => activity.operationId);
      if (expired.length === 0) return [];
      activities = activities.filter(
        (activity) => !expired.includes(activity.operationId),
      );
      emit();
      return expired;
    },
  };
};

export const createAgentReceiptStore = (
  maxReceipts = 64,
): AgentReceiptStore => {
  const limit = Math.max(1, Math.floor(maxReceipts));
  const receipts = new Map<string, AgentOperationReceipt>();
  return {
    get: (id) => receipts.get(id),
    set(receipt) {
      receipts.delete(receipt.receiptId);
      receipts.set(receipt.receiptId, structuredClone(receipt));
      while (receipts.size > limit)
        receipts.delete(receipts.keys().next().value!);
    },
    setPersistence(receiptId, status) {
      const receipt = receipts.get(receiptId);
      if (!receipt) return undefined;
      const next: AgentOperationReceipt = {
        ...receipt,
        persisted: status.state === "persisted",
        persistence: structuredClone(status),
      };
      receipts.set(receiptId, next);
      return structuredClone(next);
    },
    values: () =>
      [...receipts.values()].map((receipt) => structuredClone(receipt)),
  };
};

const hasCapability = (
  capabilities: readonly AgentCapability[],
  required: AgentCapability,
): boolean => capabilities.includes(required);

const canRunCommand = (
  capabilities: readonly AgentCapability[],
  command: DocumentCommand,
): boolean =>
  capabilities.includes("command:write") ||
  capabilities.includes(`command:${command.type}` as AgentCapability);

const boundedLimit = (value: number | undefined, max: number): number => {
  if (value === undefined) return max;
  if (!Number.isSafeInteger(value) || value < 0) return 0;
  return Math.min(value, max);
};

const result = (
  request: AgentOperationRequest,
  phase: AgentActivityPhase,
  currentRevision: number,
  diagnostics: AgentDiagnostic[] = [],
  receipt?: AgentOperationReceipt,
): AgentOperationResult => ({
  operationId: request.operationId,
  transactionId: request.transactionId,
  phase,
  baseRevision: request.baseRevision,
  currentRevision,
  changedNodeIds: [...request.scope.nodeIds],
  diagnostics,
  ...(receipt ? { receipt } : {}),
});

/** Local lifecycle adapter. It deliberately has no filesystem or transport access. */
export const createLocalAgentOperationService = (
  kernel: EditorKernel,
  activities: AgentActivityStore,
  receipts: AgentReceiptStore = createAgentReceiptStore(),
  now: () => number = Date.now,
): LocalAgentOperationService => {
  const requests = new Map<string, AgentOperationRequest>();
  const committed = new Map<string, AgentOperationResult>();
  const operationRevisions = new Map<string, number>();
  // EditorKernel exposes one transaction at a time. Keep the same ownership
  // rule at this adapter boundary instead of allowing a second remote
  // operation to fail with an implementation-specific kernel exception.
  let activeOperationId: string | undefined;
  const missing = (operationId: string, currentRevision: number): AgentOperationResult => ({
    operationId,
    transactionId: "",
    phase: "failed",
    baseRevision: currentRevision,
    currentRevision,
    changedNodeIds: [],
    diagnostics: [{ code: "AGENT_OPERATION_MISSING" }],
  });
  const expired = (request: AgentOperationRequest, at = now()): boolean =>
    request.leaseMs !== undefined &&
    (activities
      .getSnapshot()
      .find((entry) => entry.operationId === request.operationId)?.expiresAt ??
      Infinity) <= at;
  return {
    start(request) {
      const current = kernel.getState().documentRevision;
      if (request.baseRevision !== current)
        return result(request, "failed", current, [
          { code: "AGENT_REVISION_CONFLICT" },
        ]);
      if (requests.has(request.operationId))
        return result(request, "failed", current, [
          { code: "AGENT_OPERATION_ALREADY_EXISTS" },
        ]);
      if (activeOperationId !== undefined)
        return result(request, "failed", current, [
          { code: "AGENT_TRANSACTION_OWNER_MISMATCH" },
        ]);
      requests.set(request.operationId, structuredClone(request));
      operationRevisions.set(request.operationId, request.baseRevision);
      activeOperationId = request.operationId;
      activities.set({
        operationId: request.operationId,
        fileId: request.scope.fileId,
        transactionId: request.transactionId,
        baseRevision: request.baseRevision,
        nodeIds: request.scope.nodeIds,
        phase: "thinking",
        intensity: 1,
        seed: request.operationId.length,
        ...(request.scope.bounds
          ? { previewBounds: request.scope.bounds }
          : {}),
        ...(request.leaseMs !== undefined
          ? { expiresAt: now() + request.leaseMs }
          : {}),
      });
      kernel.beginTransaction(`Agent ${request.operationId}`);
      return result(request, "thinking", current);
    },
    preview(operationId, commands) {
      const request = requests.get(operationId);
      const current = kernel.getState().documentRevision;
      if (!request) return missing(operationId, current);
      if (activeOperationId !== operationId)
        return result(request, "failed", current, [
          { code: "AGENT_TRANSACTION_OWNER_MISMATCH" },
        ]);
      if (operationRevisions.get(operationId) !== current) {
        this.rollback(operationId);
        return result(request, "failed", kernel.getState().documentRevision, [
          { code: "AGENT_REVISION_CONFLICT" },
        ]);
      }
      if (expired(request)) {
        const rolledBack = this.rollback(operationId);
        return {
          ...rolledBack,
          phase: "expired",
          diagnostics: [{ code: "AGENT_PREVIEW_EXPIRED" }],
        };
      }
      try {
        kernel.preview(commands);
      } catch {
        // The kernel owns validation. Roll back the whole local transaction so
        // a failed remote batch cannot leave a partial preview behind.
        kernel.rollback();
        requests.delete(operationId);
        operationRevisions.delete(operationId);
        activeOperationId = undefined;
        activities.clear(operationId);
        return result(request, "failed", kernel.getState().documentRevision, [
          { code: "AGENT_COMMAND_INVALID" },
        ]);
      }
      activities.set({
        operationId,
        fileId: request.scope.fileId,
        transactionId: request.transactionId,
        baseRevision: request.baseRevision,
        nodeIds: request.scope.nodeIds,
        phase: "previewing",
        intensity: 1,
        seed: operationId.length,
        ...(request.leaseMs !== undefined
          ? { expiresAt: now() + request.leaseMs }
          : {}),
      });
      operationRevisions.set(operationId, kernel.getState().documentRevision);
      return result(request, "previewing", kernel.getState().documentRevision);
    },
    commit(operationId, idempotencyKey) {
      const previous = committed.get(idempotencyKey);
      if (previous)
        return {
          ...previous,
          diagnostics: [{ code: "AGENT_COMMIT_DUPLICATE" }],
          phase: "committed",
        };
      const request = requests.get(operationId);
      const current = kernel.getState().documentRevision;
      if (!request) return missing(operationId, current);
      if (request.idempotencyKey !== idempotencyKey)
        return result(request, "failed", current, [
          { code: "AGENT_IDEMPOTENCY_KEY_MISMATCH" },
        ]);
      if (activeOperationId !== operationId)
        return result(request, "failed", current, [
          { code: "AGENT_TRANSACTION_OWNER_MISMATCH" },
        ]);
      if (operationRevisions.get(operationId) !== current)
        return result(request, "failed", current, [
          { code: "AGENT_REVISION_CONFLICT" },
        ]);
      if (expired(request)) {
        const rolledBack = this.rollback(operationId);
        return {
          ...rolledBack,
          phase: "expired",
          diagnostics: [{ code: "AGENT_PREVIEW_EXPIRED" }],
        };
      }
      kernel.commit();
      const receipt: AgentOperationReceipt = {
        receiptId: `receipt:${operationId}:${idempotencyKey}`,
        operationId,
        transactionId: request.transactionId,
        baseRevision: request.baseRevision,
        committedRevision: kernel.getState().documentRevision,
        changedNodeIds: [...request.scope.nodeIds],
        diagnostics: [],
        persisted: false,
        persistence: { state: "unsaved" },
      };
      receipts.set(receipt);
      const committedResult = result(
        request,
        "committed",
        receipt.committedRevision!,
        [],
        receipt,
      );
      committed.set(idempotencyKey, committedResult);
      requests.delete(operationId);
      operationRevisions.delete(operationId);
      activeOperationId = undefined;
      activities.clear(operationId);
      return committedResult;
    },
    rollback(operationId) {
      const request = requests.get(operationId);
      const current = kernel.getState().documentRevision;
      if (!request)
        return missing(operationId, current);
      if (activeOperationId !== operationId)
        return result(request, "failed", current, [
          { code: "AGENT_TRANSACTION_OWNER_MISMATCH" },
        ]);
      kernel.rollback();
      requests.delete(operationId);
      operationRevisions.delete(operationId);
      activeOperationId = undefined;
      activities.clear(operationId);
      return result(request, "rolled-back", kernel.getState().documentRevision);
    },
    expire(at = now()) {
      const expired = activities
        .getSnapshot()
        .filter(
          (activity) =>
            activity.expiresAt !== undefined && activity.expiresAt <= at,
        )
        .map((activity) => activity.operationId);
      return expired.map((operationId) => {
        const rolledBack = this.rollback(operationId);
        return {
          ...rolledBack,
          phase: "expired",
          diagnostics: [{ code: "AGENT_PREVIEW_EXPIRED" }],
        };
      });
    },
  };
};

export const createCommandRoom = (
  kernel: EditorKernel,
  activities: AgentActivityStore = createAgentActivityStore(),
  receipts: AgentReceiptStore = createAgentReceiptStore(),
  now: () => number = Date.now,
): CommandRoom => {
  const service = createLocalAgentOperationService(kernel, activities, receipts, now);
  let persistence: AgentPersistenceStatus = { state: "unknown" };
  const revisionConflict = (envelopeId: string, currentRevision: number): AgentQueryResult => ({
    envelopeId,
    currentRevision,
    diagnostics: [{ code: "AGENT_REVISION_CONFLICT" }],
  });

  return {
    query(envelope) {
      const currentRevision = kernel.getState().documentRevision;
      if (envelope.baseRevision !== undefined && envelope.baseRevision !== currentRevision) return revisionConflict(envelope.envelopeId, currentRevision);
      if (envelope.query.type === "persistence" && !hasCapability(envelope.capabilities, "persistence:read")) {
        return { envelopeId: envelope.envelopeId, currentRevision, diagnostics: [{ code: "AGENT_CAPABILITY_DENIED" }] };
      }
      if (envelope.query.type !== "persistence" && !hasCapability(envelope.capabilities, "query:read")) {
        return { envelopeId: envelope.envelopeId, currentRevision, diagnostics: [{ code: "AGENT_CAPABILITY_DENIED" }] };
      }
      if (envelope.query.type === "state") {
        const state = kernel.getState();
        return { envelopeId: envelope.envelopeId, currentRevision, diagnostics: [], data: { currentPageId: state.currentPageId, selectedIds: state.selectedIds, activeTool: state.activeTool, documentRevision: state.documentRevision } };
      }
      if (envelope.query.type === "document-summary") {
        const document = kernel.getDocument();
        return { envelopeId: envelope.envelopeId, currentRevision, diagnostics: [], data: { documentId: document.id, fileId: document.file.id, pageOrder: document.pageOrder, nodeCount: Object.keys(document.nodes).length, componentCount: Object.keys(document.components).length } };
      }
      if (envelope.query.type === "nodes") {
        const limit = boundedLimit(envelope.query.limit, MAX_NODE_IDS);
        const ids = [...new Set(envelope.query.nodeIds)].slice(0, limit);
        const document = kernel.getDocument();
        const nodes = ids.flatMap((id) => document.nodes[id] ? [document.nodes[id]] : []);
        return { envelopeId: envelope.envelopeId, currentRevision, diagnostics: envelope.query.nodeIds.length > limit ? [{ code: "AGENT_QUERY_LIMIT" }] : [], data: { nodes } };
      }
      if (envelope.query.type === "receipts") {
        const limit = boundedLimit(envelope.query.limit, MAX_RECEIPTS);
        const values = receipts.values();
        return { envelopeId: envelope.envelopeId, currentRevision, diagnostics: values.length > limit ? [{ code: "AGENT_QUERY_LIMIT" }] : [], data: { receipts: values.slice(-limit) } };
      }
      return { envelopeId: envelope.envelopeId, currentRevision, diagnostics: [], data: { persistence } };
    },
    command(envelope) {
      const currentRevision = kernel.getState().documentRevision;
      const failed = (code: AgentDiagnosticCode): AgentOperationResult => ({
        operationId: envelope.command.type === "start" ? envelope.command.request.operationId : envelope.command.operationId,
        transactionId: envelope.command.type === "start" ? envelope.command.request.transactionId : "",
        phase: "failed",
        baseRevision: envelope.baseRevision,
        currentRevision,
        changedNodeIds: [],
        diagnostics: [{ code }],
      });
      if (envelope.baseRevision !== currentRevision) return failed("AGENT_REVISION_CONFLICT");
      if (envelope.command.type === "start") {
        if (envelope.command.request.baseRevision !== envelope.baseRevision) return failed("AGENT_REVISION_CONFLICT");
        if (!hasCapability(envelope.capabilities, "command:write")) return failed("AGENT_CAPABILITY_DENIED");
        return service.start(envelope.command.request);
      }
      if (envelope.command.type === "preview") {
        const commands = Array.isArray(envelope.command.commands) ? [...envelope.command.commands] : [envelope.command.commands];
        if (commands.length > MAX_COMMANDS) return failed("AGENT_COMMAND_LIMIT");
        if (commands.some((command) => !canRunCommand(envelope.capabilities, command))) return failed("AGENT_CAPABILITY_DENIED");
        return service.preview(envelope.command.operationId, commands);
      }
      if (envelope.command.type === "commit") {
        if (!hasCapability(envelope.capabilities, "command:write")) return failed("AGENT_CAPABILITY_DENIED");
        return service.commit(envelope.command.operationId, envelope.command.idempotencyKey);
      }
      if (!hasCapability(envelope.capabilities, "command:write")) return failed("AGENT_CAPABILITY_DENIED");
      return service.rollback(envelope.command.operationId);
    },
    setPersistenceStatus(status) {
      persistence = structuredClone(status);
    },
    markReceiptPersistence(receiptId, status) {
      return receipts.setPersistence(receiptId, status);
    },
  };
};
