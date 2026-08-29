import {
  PortableAuthorityError,
  type ChatMessageProjection,
  type StoredEvent,
  type ThreadProjection,
} from "./domain.js";
import {
  validateGenerationRouteReceipt,
  type GenerationRouteReceipt,
} from "./generation-route.js";

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const researchReceipt = (value: unknown) => {
  if (value === undefined) return undefined;
  const receipt = record(value);
  if (
    typeof receipt?.citationCount !== "number" ||
    typeof receipt.receiptId !== "string" ||
    !receipt.receiptId ||
    typeof receipt.sourceCount !== "number" ||
    typeof receipt.toolCallCount !== "number" ||
    (receipt.verification !== "not-applicable" &&
      receipt.verification !== "verified")
  )
    throw new PortableAuthorityError("MESSAGE_APPENDED_EVENT_INVALID");
  return Object.freeze({
    citationCount: receipt.citationCount,
    receiptId: receipt.receiptId,
    sourceCount: receipt.sourceCount,
    toolCallCount: receipt.toolCallCount,
    verification: receipt.verification,
  });
};

export const projectThreads = (
  events: readonly StoredEvent[],
): readonly ThreadProjection[] =>
  Object.freeze(
    events.flatMap((event) => {
      if (event.type !== "thread.opened") return [];
      const body = record(event.body);
      if (
        typeof body?.threadId !== "string" ||
        !body.threadId ||
        typeof body.title !== "string" ||
        !body.title
      )
        throw new PortableAuthorityError("THREAD_OPEN_EVENT_INVALID");
      return [
        Object.freeze({
          openedBy: event.actorId,
          sequence: event.sequence,
          threadId: body.threadId,
          title: body.title,
        }),
      ];
    }),
  );

export const projectChatMessages = (
  events: readonly StoredEvent[],
  threadId?: string,
): readonly ChatMessageProjection[] =>
  Object.freeze(
    events.flatMap((event) => {
      if (event.type !== "message.appended") return [];
      const body = record(event.body);
      if (
        typeof body?.messageId !== "string" ||
        (body.role !== "assistant" && body.role !== "user") ||
        typeof body.text !== "string" ||
        typeof body.threadId !== "string" ||
        typeof body.turnId !== "string"
      )
        throw new PortableAuthorityError("MESSAGE_APPENDED_EVENT_INVALID");
      if (threadId && body.threadId !== threadId) return [];
      const receipt = researchReceipt(body.researchReceipt);
      const routeReceipt =
        body.routeReceipt === undefined
          ? undefined
          : validateGenerationRouteReceipt(body.routeReceipt);
      return [
        Object.freeze({
          ...(typeof body.durationMs === "number"
            ? { durationMs: body.durationMs }
            : {}),
          ...(typeof body.effort === "string" ? { effort: body.effort } : {}),
          messageId: body.messageId,
          ...(typeof body.modelId === "string"
            ? { modelId: body.modelId }
            : {}),
          ...(receipt ? { researchReceipt: receipt } : {}),
          ...(routeReceipt ? { routeReceipt } : {}),
          role: body.role,
          sequence: event.sequence,
          text: body.text,
          threadId: body.threadId,
          turnId: body.turnId,
        }),
      ];
    }),
  );

export const projectGenerationRoute = (
  events: readonly StoredEvent[],
  turnId: string,
): GenerationRouteReceipt | undefined => {
  let selected: GenerationRouteReceipt | undefined;
  for (const event of events) {
    if (event.type !== "generation.route.selected") continue;
    const body = record(event.body);
    if (body?.turnId !== turnId) continue;
    const receipt = validateGenerationRouteReceipt(body.routeReceipt);
    if (selected && selected.selectionId !== receipt.selectionId)
      throw new PortableAuthorityError("GENERATION_ROUTE_SELECTION_CONFLICT");
    selected = receipt;
  }
  return selected;
};

export type TurnTerminalStatus =
  "cancelled" | "completed" | "failed" | "pending";

export const projectTurnStatus = (
  events: readonly StoredEvent[],
  turnId: string,
): TurnTerminalStatus => {
  for (const event of [...events].reverse()) {
    const body = record(event.body);
    if (body?.turnId !== turnId && body?.executionId !== turnId) continue;
    if (event.type === "turn.completed") return "completed";
    if (event.type === "execution.cancelled") return "cancelled";
    if (event.type === "turn.failed")
      return body.errorCode === "ACTION_CANCELLED" ? "cancelled" : "failed";
  }
  return "pending";
};
