import { PortableAuthorityError, type ProposedEvent } from "./domain.js";
import {
  memoryIdentifier,
  validateActiveMemory,
  type ActiveMemory,
} from "./memory-domain.js";

const record = (value: unknown): Record<string, unknown> | undefined =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype
    ? (value as Record<string, unknown>)
    : undefined;

export const projectActiveMemories = (
  events: readonly Pick<ProposedEvent, "body" | "type">[],
): readonly ActiveMemory[] => {
  const active = new Map<string, ActiveMemory>();
  for (const event of events) {
    const body = record(event.body);
    if (event.type === "memory.recorded") {
      if (
        !body ||
        Object.keys(body).sort().join(",") !== "memory,schemaVersion" ||
        body.schemaVersion !== 1
      )
        throw new PortableAuthorityError("MEMORY_EVENT_INVALID");
      const next = validateActiveMemory(body.memory);
      if (next.version !== 1 || active.has(next.memoryId))
        throw new PortableAuthorityError("MEMORY_EVENT_VERSION_CONFLICT");
      active.set(next.memoryId, next);
      continue;
    }
    if (event.type === "memory.superseded") {
      if (
        !body ||
        Object.keys(body).sort().join(",") !==
          "memory,previousVersion,schemaVersion" ||
        body.schemaVersion !== 1
      )
        throw new PortableAuthorityError("MEMORY_EVENT_INVALID");
      const next = validateActiveMemory(body.memory);
      const current = active.get(next.memoryId);
      if (
        !current ||
        body?.previousVersion !== current.version ||
        next.version !== current.version + 1
      )
        throw new PortableAuthorityError("MEMORY_EVENT_VERSION_CONFLICT");
      active.set(next.memoryId, next);
      continue;
    }
    if (event.type === "memory.retired") {
      if (
        !body ||
        Object.keys(body).sort().join(",") !==
          "memoryId,schemaVersion,version" ||
        body.schemaVersion !== 1 ||
        !memoryIdentifier(body?.memoryId) ||
        !Number.isSafeInteger(body.version)
      )
        throw new PortableAuthorityError("MEMORY_EVENT_INVALID");
      const current = active.get(body.memoryId);
      if (!current || current.version !== body.version)
        throw new PortableAuthorityError("MEMORY_EVENT_VERSION_CONFLICT");
      active.delete(body.memoryId);
    }
  }
  return Object.freeze(
    [...active.values()].sort((left, right) =>
      left.memoryId.localeCompare(right.memoryId),
    ),
  );
};
