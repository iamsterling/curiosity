import { describe, expect, it } from "vitest";
import { createFoundationDocument, createEditorKernel, type DocumentCommand, type EditorDocument } from "@crafty/editor/kernel";
import { MAX_PRESENCE, SYNC_PROTOCOL, SYNC_REVISION_CONFLICT, SyncClient, SyncRoom, decodeClientFrame, encodeFrame, type ServerFrame, type SyncTransport } from "./index.js";

class Link implements SyncTransport {
  readonly sent: Array<ServerFrame | Parameters<SyncTransport["send"]>[0]> = [];
  private listener: ((frame: ServerFrame) => void) | undefined;
  send(frame: ServerFrame | Parameters<SyncTransport["send"]>[0]): void { this.sent.push(frame); }
  subscribe(listener: (frame: ServerFrame) => void): () => void { this.listener = listener; return () => { this.listener = undefined; }; }
  deliver(frame: ServerFrame): void { this.listener?.(frame); }
}

const command = (id: string): DocumentCommand => ({ type: "set-property", nodeId: id, property: "name", value: "Renamed" });

describe("scene sync protocol and room authority", () => {
  it("round trips bounded, versioned frames and rejects oversized frames", () => {
    const frame = { protocol: SYNC_PROTOCOL, type: "join", room: "/sync/files/card", clientId: "a", baseRevision: 0 } as const;
    expect(decodeClientFrame(encodeFrame(frame))).toEqual(frame);
    expect(() => encodeFrame({ ...frame, clientId: "x".repeat(300_000) } as never)).toThrow("SYNC_FRAME_TOO_LARGE");
  });

  it("applies commands in deterministic room order and broadcasts the new revision", () => {
    const document = createFoundationDocument();
    const root = document.pages[document.pageOrder[0]!]!.rootId;
    const room = new SyncRoom("/sync/files/card", document);
    const a = { clientId: "a", frames: [] as ServerFrame[], send(frame: ServerFrame) { this.frames.push(frame); } };
    const b = { clientId: "b", frames: [] as ServerFrame[], send(frame: ServerFrame) { this.frames.push(frame); } };
    room.join(a, 0); room.join(b, 0);
    room.receive("a", { protocol: SYNC_PROTOCOL, type: "command", command: command(root), baseRevision: 0 });
    expect(room.revision).toBe(1);
    expect(a.frames.at(-1)?.type).toBe("applied");
    expect(b.frames.at(-1)?.type).toBe("applied");
    expect(room.kernel.getDocument().nodes[root]!.name).toBe("Renamed");
    room.receive("a", { protocol: SYNC_PROTOCOL, type: "command", command: { type: "set-property", nodeId: root, property: "name", value: "Page" }, baseRevision: 1 });
    expect(room.kernel.getDocument().nodes[root]!.name).toBe("Page");
  });

  it("rejects stale commands with a stable code and snapshot", () => {
    const room = new SyncRoom("/sync/files/card", createFoundationDocument());
    const a = { clientId: "a", frames: [] as ServerFrame[], send(frame: ServerFrame) { this.frames.push(frame); } };
    room.join(a, 0);
    const root = room.kernel.getDocument().pages[room.kernel.getDocument().pageOrder[0]!]!.rootId;
    room.receive("a", { protocol: SYNC_PROTOCOL, type: "command", command: command(root), baseRevision: 1 });
    expect(a.frames.at(-2)).toMatchObject({ type: "rejected", code: SYNC_REVISION_CONFLICT });
    expect(a.frames.at(-1)?.type).toBe("snapshot");
  });
});

describe("framework-neutral client", () => {
  it("applies matching remote commands, acknowledges local commands, and bounds presence", () => {
    const document = createFoundationDocument();
    const root = document.pages[document.pageOrder[0]!]!.rootId;
    const kernel = createEditorKernel(document);
    const transport = new Link();
    const diagnostics: string[] = [];
    const client = new SyncClient({ clientId: "a", room: "/sync/files/card", kernel, transport, onDiagnostic: (code) => diagnostics.push(code) });
    client.connect();
    transport.deliver({ protocol: SYNC_PROTOCOL, type: "snapshot", document, documentRevision: 0 });
    kernel.dispatch(command(root));
    client.sendCommand(command(root), 0);
    transport.deliver({ protocol: SYNC_PROTOCOL, type: "applied", command: command(root), baseRevision: 0, documentRevision: 1 });
    expect(diagnostics).toEqual([]);
    for (let i = 0; i < MAX_PRESENCE + 1; i++) transport.deliver({ protocol: SYNC_PROTOCOL, type: "presence", clientId: `peer-${i}`, point: { x: i, y: i }, tool: "select" });
    expect(client.getRemotePresence()).toHaveLength(MAX_PRESENCE);
  });

  it("requests a snapshot after rejection and restores the authoritative revision", () => {
    const document = createFoundationDocument();
    const kernel = createEditorKernel(document);
    const transport = new Link();
    const diagnostics: string[] = [];
    const client = new SyncClient({ clientId: "a", room: "/sync/files/card", kernel, transport, onDiagnostic: (code) => diagnostics.push(code) });
    client.connect();
    transport.sent.length = 0;
    transport.deliver({ protocol: SYNC_PROTOCOL, type: "rejected", code: "DOCUMENT_NODE_MISSING:nope", documentRevision: 0 });
    expect(diagnostics).toEqual(["DOCUMENT_NODE_MISSING:nope"]);
    expect(transport.sent.at(-1)).toMatchObject({ type: "join", room: "/sync/files/card" });
    transport.deliver({ protocol: SYNC_PROTOCOL, type: "snapshot", document, documentRevision: 4 });
    expect(kernel.getState().documentRevision).toBe(4);
  });
});
