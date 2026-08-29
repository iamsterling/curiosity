import type {
  CommandAcknowledgement,
  CommandInput,
  ProposedEvent,
  StoredEvent,
} from "./domain.js";

export interface JournalAdmission {
  readonly acceptedAt: string;
  readonly actorId: string;
  readonly command: CommandInput;
  readonly contributionId: string;
  readonly contributionVersion: string;
  readonly events: readonly ProposedEvent[];
  readonly pluginId: string;
}

export interface AuthorityJournal {
  events(): readonly StoredEvent[];
  admit(input: JournalAdmission): Promise<CommandAcknowledgement>;
}
