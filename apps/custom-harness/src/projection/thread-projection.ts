import { Schema } from "effect";
import type { StoredEvent } from "../domain/event.js";

class ThreadOpenedBody extends Schema.Class<ThreadOpenedBody>(
  "@curiosity/custom-harness/ThreadOpenedBody",
)({
  threadId: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
}) {}

const decodeThreadOpened = Schema.decodeUnknownSync(ThreadOpenedBody);

export interface ThreadProjection {
  readonly threadId: string;
  readonly title: string;
  readonly openedBy: string;
  readonly sequence: number;
}

export const projectThreads = (
  events: readonly StoredEvent[],
): readonly ThreadProjection[] =>
  Object.freeze(
    events.flatMap((event) => {
      if (event.type !== "thread.opened") return [];
      const body = decodeThreadOpened(event.body);
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
