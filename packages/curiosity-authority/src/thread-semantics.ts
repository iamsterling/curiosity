import { PortableAuthorityError, type ProposedEvent } from "./domain.js";

export interface OpenThreadPayload {
  readonly threadId: string;
  readonly title: string;
}

export const decodeOpenThreadPayload = (value: unknown): OpenThreadPayload => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new PortableAuthorityError("THREAD_OPEN_PAYLOAD_INVALID");
  const payload = value as Record<string, unknown>;
  if (
    typeof payload.threadId !== "string" ||
    payload.threadId.length === 0 ||
    typeof payload.title !== "string" ||
    payload.title.length === 0
  )
    throw new PortableAuthorityError("THREAD_OPEN_PAYLOAD_INVALID");
  return Object.freeze({ threadId: payload.threadId, title: payload.title });
};

export const proposeThreadOpen = (
  payload: OpenThreadPayload,
): readonly ProposedEvent[] =>
  Object.freeze([
    {
      body: {
        schemaVersion: 1,
        threadId: payload.threadId,
        title: payload.title,
      },
      streamId: payload.threadId,
      type: "thread.opened",
    },
  ]);
