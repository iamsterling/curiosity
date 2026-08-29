import {
  canonicalJson,
  commandDigestSource,
  PortableAuthorityError,
  type AuthorityJournal,
  type CommandAcknowledgement,
  type JournalAdmission,
  type Sha256,
  type StoredEvent,
} from "@curiosity/authority";
import CuriosityRuntimeModule from "../modules/curiosity-runtime";

const journalAbiVersion = 1;
const journalSchemaVersion = 15;
const pageSize = 32;
const nativeJournalCodes = new Set([
  "COMMAND_DIGEST_CONFLICT",
  "EVENT_HASH_CHAIN_INVALID",
  "EVENT_SCHEMA_VERSION_UNSUPPORTED",
  "NATIVE_JOURNAL_ABI_UNSUPPORTED",
  "NATIVE_JOURNAL_REQUEST_INVALID",
  "NATIVE_JOURNAL_RESPONSE_INVALID",
  "NATIVE_JOURNAL_RESPONSE_TOO_LARGE",
  "NATIVE_JOURNAL_STORAGE_PROTECTION_FAILED",
  "NATIVE_JOURNAL_STORAGE_UNAVAILABLE",
  "NATIVE_JOURNAL_TRANSACTION_FAILED",
]);

const nativeJournalCode = (error: unknown): string => {
  if (error && typeof error === "object") {
    const code = (error as { readonly code?: unknown }).code;
    if (typeof code === "string" && nativeJournalCodes.has(code)) return code;
  }
  if (error instanceof Error && nativeJournalCodes.has(error.message))
    return error.message;
  return "NATIVE_JOURNAL_TRANSACTION_FAILED";
};

const nativeCall = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    throw new PortableAuthorityError(nativeJournalCode(error));
  }
};

const parseJson = (json: string): unknown => {
  try {
    return JSON.parse(json) as unknown;
  } catch {
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  }
};

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return value as Record<string, unknown>;
};

const stringField = (value: Record<string, unknown>, key: string): string => {
  const field = value[key];
  if (typeof field !== "string")
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return field;
};

const numberField = (value: Record<string, unknown>, key: string): number => {
  const field = value[key];
  if (!Number.isSafeInteger(field))
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return field as number;
};

const storedEvent = (value: unknown): StoredEvent => {
  const source = record(value);
  const event = {
    actorId: stringField(source, "actorId"),
    aggregateVersion: numberField(source, "aggregateVersion"),
    body: source.body,
    catalogDigest: stringField(source, "catalogDigest"),
    causationId: stringField(source, "causationId"),
    childExecutionId: stringField(source, "childExecutionId"),
    commandId: stringField(source, "commandId"),
    contributionId: stringField(source, "contributionId"),
    contributionVersion: stringField(source, "contributionVersion"),
    correlationId: stringField(source, "correlationId"),
    eventHash: stringField(source, "eventHash"),
    eventId: stringField(source, "eventId"),
    eventSchemaVersion: numberField(source, "eventSchemaVersion"),
    occurredAt: stringField(source, "occurredAt"),
    parentExecutionId: stringField(source, "parentExecutionId"),
    pluginId: stringField(source, "pluginId"),
    previousHash: stringField(source, "previousHash"),
    rootExecutionId: stringField(source, "rootExecutionId"),
    sequence: numberField(source, "sequence"),
    streamId: stringField(source, "streamId"),
    type: stringField(source, "type"),
  } satisfies StoredEvent;
  if (event.eventSchemaVersion !== 1)
    throw new PortableAuthorityError("EVENT_SCHEMA_VERSION_UNSUPPORTED");
  return Object.freeze(event);
};

const acknowledgement = (value: unknown): CommandAcknowledgement => {
  const source = record(value);
  const disposition = stringField(source, "disposition");
  if (disposition !== "accepted" && disposition !== "duplicate")
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return Object.freeze({
    actorId: stringField(source, "actorId"),
    commandId: stringField(source, "commandId"),
    disposition,
    eventCount: numberField(source, "eventCount"),
    firstSequence: numberField(source, "firstSequence"),
    lastSequence: numberField(source, "lastSequence"),
  });
};

const parseEvents = (json: string): readonly StoredEvent[] => {
  const parsed = parseJson(json);
  if (!Array.isArray(parsed))
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return parsed.map(storedEvent);
};

class NativeAuthorityJournal implements AuthorityJournal {
  readonly #events: StoredEvent[];
  readonly #sha256: Sha256;

  constructor(events: readonly StoredEvent[], sha256: Sha256) {
    this.#events = [...events];
    this.#sha256 = sha256;
  }

  events(): readonly StoredEvent[] {
    return Object.freeze([...this.#events]);
  }

  async admit(input: JournalAdmission): Promise<CommandAcknowledgement> {
    const commandDigest = await this.#sha256(
      commandDigestSource(input.command),
    );
    const response = record(
      parseJson(
        await nativeCall(() =>
          CuriosityRuntimeModule.journalAdmit(
            canonicalJson({
              acceptedAt: input.acceptedAt,
              actorId: input.actorId,
              commandDigest,
              commandId: input.command.id,
              contributionId: input.contributionId,
              contributionVersion: input.contributionVersion,
              events: input.events.map((event) => ({
                body: event.body,
                streamId: event.streamId,
                type: event.type,
              })),
              pluginId: input.pluginId,
            }),
          ),
        ),
      ),
    );
    const result = acknowledgement(response.acknowledgement);
    const appended = Array.isArray(response.events)
      ? response.events.map(storedEvent)
      : (() => {
          throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
        })();
    const firstNewSequence = this.#events.length + 1;
    if (
      result.actorId !== input.actorId ||
      result.commandId !== input.command.id ||
      (result.disposition === "duplicate" && appended.length !== 0) ||
      (result.disposition === "accepted" &&
        (appended.length !== result.eventCount ||
          result.firstSequence !== firstNewSequence ||
          result.lastSequence !== firstNewSequence + appended.length - 1))
    )
      throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
    for (const event of appended) {
      if (
        event.sequence !== this.#events.length + 1 ||
        event.actorId !== input.actorId ||
        event.commandId !== input.command.id
      )
        throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
      this.#events.push(event);
    }
    return result;
  }
}

export const openNativeJournal = async (
  catalogDigest: string,
  sha256: Sha256,
): Promise<AuthorityJournal> => {
  const status = await nativeCall(() =>
    CuriosityRuntimeModule.journalOpen(catalogDigest),
  );
  if (status.abiVersion !== journalAbiVersion)
    throw new PortableAuthorityError("NATIVE_JOURNAL_ABI_UNSUPPORTED");
  if (status.schemaVersion !== journalSchemaVersion)
    throw new PortableAuthorityError("EVENT_SCHEMA_VERSION_UNSUPPORTED");

  const events: StoredEvent[] = [];
  for (;;) {
    const page = parseEvents(
      await nativeCall(() =>
        CuriosityRuntimeModule.journalRead(events.length, pageSize),
      ),
    );
    for (const event of page) {
      if (event.sequence !== events.length + 1)
        throw new PortableAuthorityError("EVENT_SEQUENCE_INVALID");
      events.push(event);
    }
    if (page.length < pageSize) break;
  }
  return new NativeAuthorityJournal(events, sha256);
};
