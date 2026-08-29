import {
  projectThreads as projectPortableThreads,
  type ThreadProjection,
} from "@curiosity/authority";
import type { StoredEvent } from "../domain/event.js";
export type { ThreadProjection } from "@curiosity/authority";

export const projectThreads = (
  events: readonly StoredEvent[],
): readonly ThreadProjection[] => projectPortableThreads(events);
