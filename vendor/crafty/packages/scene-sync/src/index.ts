import { createEditorKernel, type DocumentCommand, type EditorDocument, type EditorDocumentV1, type EditorKernel, type EditorTool, type Point } from "@crafty/editor/kernel";

export const SYNC_PROTOCOL = "crafty-sync-v1" as const;
export const MAX_PRESENCE = 8;
export const MAX_FRAME_BYTES = 256 * 1024;
export const SYNC_REVISION_CONFLICT = "SYNC_REVISION_CONFLICT";
export const SYNC_NOT_JOINED = "SYNC_NOT_JOINED";
export const SYNC_INVALID_FRAME = "SYNC_INVALID_FRAME";

export interface JoinFrame { protocol: typeof SYNC_PROTOCOL; type: "join"; room: string; clientId: string; baseRevision: number }
export interface CommandFrame { protocol: typeof SYNC_PROTOCOL; type: "command"; command: DocumentCommand; baseRevision: number }
export interface PresenceFrame { protocol: typeof SYNC_PROTOCOL; type: "presence"; point?: Point; tool?: EditorTool }
export type ClientFrame = JoinFrame | CommandFrame | PresenceFrame;
export interface SnapshotFrame { protocol: typeof SYNC_PROTOCOL; type: "snapshot"; document: EditorDocument; documentRevision: number }
export interface AppliedFrame { protocol: typeof SYNC_PROTOCOL; type: "applied"; command: DocumentCommand; baseRevision: number; documentRevision: number }
export interface RejectedFrame { protocol: typeof SYNC_PROTOCOL; type: "rejected"; command?: DocumentCommand; code: string; documentRevision: number }
export interface RemotePresenceFrame { protocol: typeof SYNC_PROTOCOL; type: "presence"; clientId: string; point?: Point; tool?: EditorTool }
export type ServerFrame = SnapshotFrame | AppliedFrame | RejectedFrame | RemotePresenceFrame;

export interface SyncTransport { send(frame: ServerFrame | ClientFrame): void; subscribe(listener: (frame: ServerFrame) => void): () => void; close?(): void }
export interface RoomPeer { readonly clientId: string; send(frame: ServerFrame): void }

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const validPoint = (value: unknown): value is Point => isRecord(value) && finite(value.x) && finite(value.y);
const validRevision = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const validClientId = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9._-]{1,128}$/.test(value);

export const validateClientFrame = (value: unknown): { ok: true; frame: ClientFrame } | { ok: false; code: string } => {
  if (!isRecord(value) || value.protocol !== SYNC_PROTOCOL || typeof value.type !== "string") return { ok: false, code: SYNC_INVALID_FRAME };
  if (value.type === "join" && typeof value.room === "string" && /^\/sync\/files\/[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value.room) && validClientId(value.clientId) && validRevision(value.baseRevision)) return { ok: true, frame: value as unknown as JoinFrame };
  if (value.type === "command" && isRecord(value.command) && typeof value.command.type === "string" && validRevision(value.baseRevision)) return { ok: true, frame: value as unknown as CommandFrame };
  if (value.type === "presence" && (value.point === undefined || validPoint(value.point)) && (value.tool === undefined || typeof value.tool === "string")) return { ok: true, frame: value as unknown as PresenceFrame };
  return { ok: false, code: SYNC_INVALID_FRAME };
};

export const encodeFrame = (frame: ClientFrame | ServerFrame): string => {
  const encoded = JSON.stringify(frame);
  if (Buffer.byteLength(encoded, "utf8") > MAX_FRAME_BYTES) throw new Error("SYNC_FRAME_TOO_LARGE");
  return encoded;
};
export const decodeClientFrame = (encoded: string): ClientFrame => {
  if (Buffer.byteLength(encoded, "utf8") > MAX_FRAME_BYTES) throw new Error("SYNC_FRAME_TOO_LARGE");
  let parsed: unknown;
  try { parsed = JSON.parse(encoded) as unknown; } catch { throw new Error(SYNC_INVALID_FRAME); }
  const result = validateClientFrame(parsed);
  if (!result.ok) throw new Error(result.code);
  return result.frame;
};

/** In-memory room authority. Adapters can translate its peer callbacks to any socket. */
export class SyncRoom {
  readonly kernel: EditorKernel;
  private readonly peers = new Map<string, RoomPeer>();
  constructor(public readonly room: string, document: EditorDocument | EditorDocumentV1) { this.kernel = createEditorKernel(document); }
  join(peer: RoomPeer, baseRevision: number): void {
    if (this.peers.has(peer.clientId)) throw new Error("SYNC_CLIENT_EXISTS");
    this.peers.set(peer.clientId, peer);
    peer.send(this.snapshot());
    // A join is also the snapshot request used after divergence. The snapshot
    // is authoritative; rejecting the request would only create a retry loop.
  }
  leave(clientId: string): void { this.peers.delete(clientId); }
  receive(clientId: string, frame: CommandFrame | PresenceFrame): void {
    const sender = this.peers.get(clientId);
    if (!sender) throw new Error(SYNC_NOT_JOINED);
    if (frame.type === "presence") {
      const allowed = [...this.peers.keys()].slice(0, MAX_PRESENCE).includes(clientId);
      if (!allowed) return;
      for (const [id, peer] of this.peers) if (id !== clientId) {
        const presence: RemotePresenceFrame = { protocol: SYNC_PROTOCOL, type: "presence", clientId, ...(frame.point ? { point: frame.point } : {}), ...(frame.tool ? { tool: frame.tool } : {}) };
        peer.send(presence);
      }
      return;
    }
    if (frame.baseRevision !== this.revision) { sender.send({ protocol: SYNC_PROTOCOL, type: "rejected", command: frame.command, code: SYNC_REVISION_CONFLICT, documentRevision: this.revision }); sender.send(this.snapshot()); return; }
    try {
      this.kernel.dispatch(frame.command, "Remote edit");
      const applied: AppliedFrame = { protocol: SYNC_PROTOCOL, type: "applied", command: frame.command, baseRevision: frame.baseRevision, documentRevision: this.revision };
      for (const peer of this.peers.values()) peer.send(applied);
    } catch (error) {
      const code = error instanceof Error ? error.message.split(":", 1)[0]! : "DOCUMENT_COMMAND_REJECTED";
      sender.send({ protocol: SYNC_PROTOCOL, type: "rejected", command: frame.command, code, documentRevision: this.revision });
      sender.send(this.snapshot());
    }
  }
  get revision(): number { return this.kernel.getState().documentRevision; }
  snapshot(): SnapshotFrame { return { protocol: SYNC_PROTOCOL, type: "snapshot", document: this.kernel.getDocument(), documentRevision: this.revision }; }
}

export interface SyncClientOptions { clientId: string; room: string; kernel: EditorKernel; transport: SyncTransport; onDiagnostic?: (code: string) => void }
export class SyncClient {
  private unsubscribe: (() => void) | undefined;
  private lastPresenceFrame = -1;
  private readonly remote = new Map<string, RemotePresenceFrame>();
  constructor(private readonly options: SyncClientOptions) {}
  connect(): void { this.unsubscribe = this.options.transport.subscribe((frame) => this.receive(frame)); this.send({ protocol: SYNC_PROTOCOL, type: "join", room: this.options.room, clientId: this.options.clientId, baseRevision: this.options.kernel.getState().documentRevision }); }
  disconnect(): void { this.unsubscribe?.(); this.options.transport.close?.(); this.unsubscribe = undefined; }
  sendCommand(command: DocumentCommand, baseRevision = this.options.kernel.getState().documentRevision): void { this.send({ protocol: SYNC_PROTOCOL, type: "command", command, baseRevision }); }
  publishPresence(frame: Omit<PresenceFrame, "protocol" | "type">, renderFrame: number): void { if (renderFrame === this.lastPresenceFrame) return; this.lastPresenceFrame = renderFrame; this.send({ protocol: SYNC_PROTOCOL, type: "presence", ...frame }); }
  getRemotePresence(): ReadonlyMap<string, RemotePresenceFrame> { return new Map(this.remote); }
  private send(frame: ClientFrame): void { this.options.transport.send(frame); }
  private receive(frame: ServerFrame): void {
    if (frame.type === "snapshot") { this.options.kernel.replaceDocument(frame.document, frame.documentRevision); this.remote.clear(); return; }
    if (frame.type === "presence") { if (!this.remote.has(frame.clientId) && this.remote.size >= MAX_PRESENCE) return; this.remote.set(frame.clientId, frame); return; }
    if (frame.type === "rejected") { this.options.onDiagnostic?.(frame.code); this.requestSnapshot(); return; }
    // The sender already applied its optimistic local command. The identical
    // applied frame is an acknowledgement, not a second mutation.
    if (frame.documentRevision === this.options.kernel.getState().documentRevision) return;
    if (frame.documentRevision !== this.options.kernel.getState().documentRevision + 1) { this.options.onDiagnostic?.(SYNC_REVISION_CONFLICT); this.requestSnapshot(); return; }
    this.options.kernel.dispatch(frame.command, "Remote edit");
  }
  private requestSnapshot(): void { this.send({ protocol: SYNC_PROTOCOL, type: "join", room: this.options.room, clientId: this.options.clientId, baseRevision: this.options.kernel.getState().documentRevision }); }
}
