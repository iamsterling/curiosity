import type { ChatMessageProjection } from "../projection/chat-projection.js";
import type { ThreadProjection } from "../projection/thread-projection.js";
import type { TuiHarness } from "../tui/session.js";
import { sanitizeConversationText } from "../tui/terminal-text.js";
import type { TuiHostSnapshot } from "./protocol.js";

export interface BubbleTeaProjectionIdentity {
  readonly actorId: string;
  readonly effort: string;
  readonly modelId: string;
  readonly workingDirectory: string;
}

export class BubbleTeaProjectionState {
  readonly #capabilities: TuiHostSnapshot["capabilities"];
  readonly #catalog: TuiHostSnapshot["catalog"];
  readonly #identity: BubbleTeaProjectionIdentity;
  readonly #profile: string;
  error = "";
  inspectorText = "";
  messages: readonly ChatMessageProjection[];
  status: "idle" | "working" = "idle";
  streamingText = "";
  submittedText = "";
  thread: ThreadProjection | undefined;

  private constructor(
    identity: BubbleTeaProjectionIdentity,
    harness: TuiHarness,
    capabilityStatus: Awaited<ReturnType<TuiHarness["status"]>>,
    thread: ThreadProjection | undefined,
    messages: readonly ChatMessageProjection[],
  ) {
    this.#identity = Object.freeze({
      actorId: identity.actorId,
      effort: identity.effort,
      modelId: identity.modelId,
      workingDirectory: identity.workingDirectory,
    });
    this.#profile = capabilityStatus.profile;
    this.#capabilities = Object.freeze(
      capabilityStatus.capabilities.map(({ id, reason, state }) =>
        Object.freeze({ id, reason, state }),
      ),
    );
    this.#catalog = Object.freeze({
      commands: Object.freeze(
        harness.catalog.promptCommands.map(({ description, name, status }) =>
          Object.freeze({ description, name, status }),
        ),
      ),
      digest: harness.catalog.digest,
      pluginIds: harness.catalog.pluginIds,
      toolNames: harness.catalog.tools,
      workflowNames: harness.catalog.workflows,
    });
    this.thread = thread;
    this.messages = messages;
  }

  static async create(
    identity: BubbleTeaProjectionIdentity,
    harness: TuiHarness,
  ): Promise<BubbleTeaProjectionState> {
    const [capabilityStatus, threads] = await Promise.all([
      harness.status(),
      harness.projections.threads(),
    ]);
    const thread = threads.reduce<ThreadProjection | undefined>(
      (latest, candidate) =>
        !latest || candidate.sequence > latest.sequence ? candidate : latest,
      undefined,
    );
    const messages = thread
      ? await harness.projections.messages(thread.threadId)
      : [];
    return new BubbleTeaProjectionState(
      identity,
      harness,
      capabilityStatus,
      thread,
      messages,
    );
  }

  snapshot(): TuiHostSnapshot {
    return Object.freeze({
      ...this.#identity,
      capabilities: this.#capabilities,
      catalog: this.#catalog,
      error: presentationText(this.error, 2 * 1024),
      inspectorText: presentationText(this.inspectorText, 128 * 1024),
      messages: Object.freeze(
        this.messages
          .slice(-64)
          .map(({ role, sequence, text }) =>
            Object.freeze({
              role,
              sequence,
              text: presentationText(text, 8 * 1024),
            }),
          ),
      ),
      profile: this.#profile,
      status: this.status,
      streamingText: presentationText(this.streamingText, 128 * 1024),
      submittedText: presentationText(this.submittedText, 64 * 1024),
      threadId: this.thread?.threadId ?? "",
      threadTitle: presentationText(this.thread?.title ?? "", 1024),
    });
  }

  begin(text: string): void {
    this.error = "";
    this.inspectorText = "";
    this.status = "working";
    this.streamingText = "";
    this.submittedText = text;
  }

  finish(
    thread: ThreadProjection,
    messages: readonly ChatMessageProjection[],
  ): void {
    this.messages = messages;
    this.thread = thread;
    this.status = "idle";
    this.streamingText = "";
    this.submittedText = "";
  }

  fail(error: string, messages: readonly ChatMessageProjection[]): void {
    this.error = error;
    this.messages = messages.length > 0 ? messages : this.messages;
    this.status = "idle";
    this.streamingText = "";
    if (messages.length > 0) this.submittedText = "";
  }

  clearThread(): void {
    this.error = "";
    this.messages = [];
    this.streamingText = "";
    this.submittedText = "";
    this.thread = undefined;
  }

  inspect(text: string): void {
    this.error = "";
    this.inspectorText = text;
    this.status = "idle";
    this.streamingText = "";
    this.submittedText = "";
  }

  selectThread(
    thread: ThreadProjection,
    messages: readonly ChatMessageProjection[],
  ): void {
    this.error = "";
    this.inspectorText = "";
    this.messages = messages;
    this.status = "idle";
    this.streamingText = "";
    this.submittedText = "";
    this.thread = thread;
  }
}

const presentationText = (value: string, byteLimit: number): string => {
  const sanitized = sanitizeConversationText(value);
  const bytes = Buffer.from(sanitized);
  if (bytes.byteLength <= byteLimit) return sanitized;
  return `${bytes
    .subarray(0, Math.max(0, byteLimit - 3))
    .toString("utf8")
    .replace(/�$/u, "")}…`;
};
