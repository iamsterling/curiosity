import {
  basicEventLineage,
  commandDigestSource,
  commandExecutionId,
  eventHashSource,
  eventIdSource,
} from "./event-identity.js";
import {
  PortableAuthorityError,
  type CommandAcknowledgement,
  type Sha256,
  type StoredEvent,
} from "./domain.js";
import type { AuthorityJournal, JournalAdmission } from "./journal-port.js";

const emptyHash = "0".repeat(64);
const sha256Pattern = /^[a-f0-9]{64}$/u;

interface AdmissionRecord {
  readonly acknowledgement: CommandAcknowledgement;
  readonly commandDigest: string;
}

export interface InMemoryJournalConfig {
  readonly catalogDigest: string;
  readonly sha256: Sha256;
}

export class InMemoryJournal implements AuthorityJournal {
  readonly #admissions = new Map<string, AdmissionRecord>();
  readonly #catalogDigest: string;
  readonly #events: StoredEvent[] = [];
  readonly #sha256: Sha256;

  constructor(config: InMemoryJournalConfig) {
    if (!sha256Pattern.test(config.catalogDigest))
      throw new PortableAuthorityError("CATALOG_DIGEST_INVALID");
    this.#catalogDigest = config.catalogDigest;
    this.#sha256 = config.sha256;
  }

  events(): readonly StoredEvent[] {
    return Object.freeze([...this.#events]);
  }

  async admit(input: JournalAdmission): Promise<CommandAcknowledgement> {
    const commandDigest = await this.#digest(
      commandDigestSource(input.command),
    );
    const admissionKey = `${input.actorId}\u0000${input.command.id}`;
    const existing = this.#admissions.get(admissionKey);
    if (existing) {
      if (existing.commandDigest !== commandDigest)
        throw new PortableAuthorityError("COMMAND_DIGEST_CONFLICT");
      return Object.freeze({
        ...existing.acknowledgement,
        disposition: "duplicate",
      });
    }

    const firstSequence = this.#events.length + 1;
    const executionId = commandExecutionId(input.events);
    const pending: StoredEvent[] = [];
    let previousHash = this.#events.at(-1)?.eventHash ?? emptyHash;
    for (const [index, event] of input.events.entries()) {
      const sequence = this.#events.length + pending.length + 1;
      const aggregateVersion =
        this.#events.filter(({ streamId }) => streamId === event.streamId)
          .length +
        pending.filter(({ streamId }) => streamId === event.streamId).length +
        1;
      const lineage = basicEventLineage(event, input.command.id, executionId);
      const envelope = {
        actorId: input.actorId,
        aggregateVersion,
        body: event.body,
        catalogDigest: this.#catalogDigest,
        causationId: lineage.causationId,
        childExecutionId: lineage.childExecutionId,
        commandId: input.command.id,
        contributionId: input.contributionId,
        contributionVersion: input.contributionVersion,
        correlationId: lineage.correlationId,
        eventSchemaVersion: 1,
        occurredAt: input.acceptedAt,
        parentExecutionId: lineage.parentExecutionId,
        pluginId: input.pluginId,
        previousHash,
        rootExecutionId: lineage.rootExecutionId,
        sequence,
        streamId: event.streamId,
        type: event.type,
      } as const;
      const eventHash = await this.#digest(eventHashSource(envelope));
      const eventId = await this.#digest(
        eventIdSource(input.actorId, input.command.id, index, eventHash),
      );
      pending.push(Object.freeze({ ...envelope, eventHash, eventId }));
      previousHash = eventHash;
    }

    this.#events.push(...pending);
    const acknowledgement = Object.freeze({
      actorId: input.actorId,
      commandId: input.command.id,
      disposition: "accepted" as const,
      eventCount: pending.length,
      firstSequence,
      lastSequence: this.#events.length,
    });
    this.#admissions.set(admissionKey, { acknowledgement, commandDigest });
    return acknowledgement;
  }

  async #digest(value: string): Promise<string> {
    const digest = await this.#sha256(value);
    if (!sha256Pattern.test(digest))
      throw new PortableAuthorityError("CRYPTO_DIGEST_INVALID");
    return digest;
  }
}
