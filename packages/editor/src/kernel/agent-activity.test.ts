import { describe, expect, it } from "vitest";
import { createFoundationDocument } from "./document.js";
import { createEditorKernel } from "./kernel.js";
import {
  createAgentActivityStore,
  createAgentReceiptStore,
  createCommandRoom,
  createLocalAgentOperationService,
} from "./agent-activity.js";

describe("agent activity", () => {
  it("keeps activity outside the authored document", () => {
    const store = createAgentActivityStore();
    const kernel = createEditorKernel(createFoundationDocument());
    store.set({
      operationId: "op-1",
      nodeIds: ["rectangle-foundation"],
      phase: "previewing",
      intensity: 2,
      seed: 7,
    });

    expect(store.getSnapshot()[0]?.intensity).toBe(1);
    expect(kernel.serialize()).not.toContain("op-1");
  });

  it("clears terminal activity and deduplicates node ids", () => {
    const store = createAgentActivityStore();
    store.set({
      operationId: "op-1",
      nodeIds: ["a", "a", "b"],
      phase: "committed",
      intensity: 0.5,
      seed: 1,
    });

    expect(store.getSnapshot()).toEqual([]);
  });

  it("does not notify when clearing an unknown operation", () => {
    const store = createAgentActivityStore();
    let notifications = 0;
    store.subscribe(() => {
      notifications += 1;
    });
    store.clear("missing");
    expect(notifications).toBe(0);
  });

  it("bounds active operations and expires leased activity", () => {
    const store = createAgentActivityStore({ maxActivities: 2 });
    store.set({
      operationId: "op-1",
      nodeIds: [],
      phase: "thinking",
      intensity: 1,
      seed: 1,
    });
    store.set({
      operationId: "op-2",
      nodeIds: [],
      phase: "thinking",
      intensity: 1,
      seed: 2,
      expiresAt: 10,
    });
    store.set({
      operationId: "op-3",
      nodeIds: [],
      phase: "thinking",
      intensity: 1,
      seed: 3,
    });
    expect(store.getSnapshot().map(({ operationId }) => operationId)).toEqual([
      "op-2",
      "op-3",
    ]);
    expect(store.expire(10)).toEqual(["op-2"]);
    expect(store.getSnapshot().map(({ operationId }) => operationId)).toEqual([
      "op-3",
    ]);
  });

  it("commits through the kernel once and returns the original idempotent result", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const activities = createAgentActivityStore();
    const receipts = createAgentReceiptStore();
    const service = createLocalAgentOperationService(
      kernel,
      activities,
      receipts,
    );
    const request = {
      operationId: "op-commit",
      transactionId: "tx-commit",
      idempotencyKey: "idem-1",
      scope: { fileId: "file-1", nodeIds: ["rectangle-foundation"] },
      baseRevision: kernel.getState().documentRevision,
    };
    expect(service.start(request).phase).toBe("thinking");
    const first = service.commit(request.operationId, request.idempotencyKey);
    const second = service.commit(request.operationId, request.idempotencyKey);
    expect(first.receipt?.persisted).toBe(false);
    expect(second.receipt?.receiptId).toBe(first.receipt?.receiptId);
    expect(second.diagnostics[0]?.code).toBe("AGENT_COMMIT_DUPLICATE");
    expect(receipts.values()).toHaveLength(1);
    expect(activities.getSnapshot()).toEqual([]);
  });

  it("rejects a stale operation before opening a kernel transaction", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const service = createLocalAgentOperationService(
      kernel,
      createAgentActivityStore(),
    );
    const response = service.start({
      operationId: "stale",
      transactionId: "tx",
      idempotencyKey: "id",
      scope: { fileId: "f", nodeIds: [] },
      baseRevision: 99,
    });
    expect(response.diagnostics[0]?.code).toBe("AGENT_REVISION_CONFLICT");
    expect(kernel.canUndo()).toBe(false);
  });

  it("rejects a second owner and an idempotency key that was not reserved", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const service = createLocalAgentOperationService(
      kernel,
      createAgentActivityStore(),
    );
    const baseRevision = kernel.getState().documentRevision;
    const first = {
      operationId: "owner-1",
      transactionId: "tx-1",
      idempotencyKey: "key-1",
      scope: { fileId: "f", nodeIds: [] },
      baseRevision,
    };
    expect(service.start(first).phase).toBe("thinking");
    expect(
      service.start({ ...first, operationId: "owner-2", transactionId: "tx-2", idempotencyKey: "key-2" }).diagnostics[0]?.code,
    ).toBe("AGENT_TRANSACTION_OWNER_MISMATCH");
    expect(service.commit(first.operationId, "other-key").diagnostics[0]?.code).toBe(
      "AGENT_IDEMPOTENCY_KEY_MISMATCH",
    );
    service.rollback(first.operationId);
  });

  it("expires a leased transaction before preview or commit can change the document", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const activities = createAgentActivityStore();
    let clock = 100;
    const service = createLocalAgentOperationService(
      kernel,
      activities,
      createAgentReceiptStore(),
      () => clock,
    );
    const request = {
      operationId: "leased",
      transactionId: "tx-leased",
      idempotencyKey: "key-leased",
      scope: { fileId: "f", nodeIds: ["rectangle-foundation"] },
      baseRevision: kernel.getState().documentRevision,
      leaseMs: 10,
    };
    service.start(request);
    clock = 110;
    const response = service.commit(request.operationId, request.idempotencyKey);
    expect(response.phase).toBe("expired");
    expect(response.diagnostics[0]?.code).toBe("AGENT_PREVIEW_EXPIRED");
    expect(kernel.canUndo()).toBe(false);
    expect(activities.getSnapshot()).toEqual([]);
  });

  it("answers bounded command-room queries without exposing an unbounded document", () => {
    const room = createCommandRoom(createEditorKernel(createFoundationDocument()));
    const result = room.query({
      envelopeId: "query-nodes",
      actorId: "agent-1",
      capabilities: ["query:read"],
      baseRevision: 0,
      query: { type: "nodes", nodeIds: ["rectangle-foundation", "text-foundation"], limit: 1 },
    });

    expect(result.diagnostics[0]?.code).toBe("AGENT_QUERY_LIMIT");
    expect((result.data as { nodes: Array<{ id: string }> }).nodes.map((node) => node.id)).toEqual(["rectangle-foundation"]);
    const summary = room.query({ envelopeId: "summary", actorId: "agent-1", capabilities: ["query:read"], query: { type: "document-summary" } });
    expect(summary.data).toMatchObject({ documentId: "document-foundation", fileId: "file-foundation", nodeCount: 4 });
  });

  it("gates command envelopes by revision and capability before reaching the kernel", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const room = createCommandRoom(kernel);
    const request = {
      operationId: "room-op",
      transactionId: "room-tx",
      idempotencyKey: "room-key",
      scope: { fileId: "file-1", nodeIds: ["rectangle-foundation"] },
      baseRevision: 0,
    };

    expect(room.command({ envelopeId: "start-denied", actorId: "agent-1", capabilities: ["query:read"], baseRevision: 0, command: { type: "start", request } }).diagnostics[0]?.code).toBe("AGENT_CAPABILITY_DENIED");
    expect(kernel.canUndo()).toBe(false);
    expect(room.command({ envelopeId: "start", actorId: "agent-1", capabilities: ["command:write"], baseRevision: 0, command: { type: "start", request } }).phase).toBe("thinking");
    const preview = room.command({
      envelopeId: "preview",
      actorId: "agent-1",
      capabilities: ["command:set-property"],
      baseRevision: 0,
      command: { type: "preview", operationId: request.operationId, commands: { type: "set-property", nodeId: "rectangle-foundation", property: "name", value: "Agent rename" } },
    });
    expect(preview.phase).toBe("previewing");
    expect(kernel.getDocument().nodes["rectangle-foundation"]?.name).toBe("Agent rename");
    expect(room.command({ envelopeId: "commit-stale", actorId: "agent-1", capabilities: ["command:write"], baseRevision: 99, command: { type: "commit", operationId: request.operationId, idempotencyKey: request.idempotencyKey } }).diagnostics[0]?.code).toBe("AGENT_REVISION_CONFLICT");
    expect(room.command({ envelopeId: "commit", actorId: "agent-1", capabilities: ["command:write"], baseRevision: 1, command: { type: "commit", operationId: request.operationId, idempotencyKey: request.idempotencyKey } }).receipt?.committedRevision).toBe(1);
  });

  it("tracks persistence status separately from command execution receipts", () => {
    const receipts = createAgentReceiptStore();
    const room = createCommandRoom(createEditorKernel(createFoundationDocument()), createAgentActivityStore(), receipts);
    const request = {
      operationId: "persist-op",
      transactionId: "persist-tx",
      idempotencyKey: "persist-key",
      scope: { fileId: "file-1", nodeIds: [] },
      baseRevision: 0,
    };
    room.command({ envelopeId: "start", actorId: "agent-1", capabilities: ["command:write"], baseRevision: 0, command: { type: "start", request } });
    const committed = room.command({ envelopeId: "commit", actorId: "agent-1", capabilities: ["command:write"], baseRevision: 0, command: { type: "commit", operationId: request.operationId, idempotencyKey: request.idempotencyKey } });
    const receiptId = committed.receipt!.receiptId;

    expect(committed.receipt?.persistence.state).toBe("unsaved");
    room.setPersistenceStatus({ state: "persisted", persistenceRevision: 12 });
    expect(room.query({ envelopeId: "persistence", actorId: "agent-1", capabilities: ["persistence:read"], query: { type: "persistence" } }).data).toEqual({ persistence: { state: "persisted", persistenceRevision: 12 } });
    const updated = room.markReceiptPersistence(receiptId, { state: "persisted", persistenceRevision: 12 });
    expect(updated?.persisted).toBe(true);
    expect(receipts.get(receiptId)?.persistence.persistenceRevision).toBe(12);
  });
});
