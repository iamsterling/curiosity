import { Database } from "bun:sqlite";

type EvidenceRow = Readonly<Record<string, string | number | null>>;

export interface ResearchRunEvidence {
  readonly actions: readonly EvidenceRow[];
  readonly events: readonly EvidenceRow[];
  readonly linkedSources: number;
  readonly providerCalls: readonly EvidenceRow[];
  readonly researchSources: number;
  readonly terminalEvent: string;
  readonly toolCalls: readonly EvidenceRow[];
}

const rows = (value: unknown[]): readonly EvidenceRow[] =>
  Object.freeze(
    value.map((row) => Object.freeze(row as Record<string, string | number | null>)),
  );

export const readResearchRunEvidence = (
  databasePath: string,
): ResearchRunEvidence => {
  const database = new Database(databasePath, { readonly: true, strict: true });
  try {
    const events = rows(
      database.query("SELECT * FROM events ORDER BY global_sequence").all(),
    );
    const actions = rows(database.query("SELECT * FROM actions ORDER BY rowid").all());
    const providerCalls = rows(
      database.query("SELECT * FROM provider_calls ORDER BY rowid").all(),
    );
    const toolCalls = rows(
      database.query("SELECT * FROM tool_calls ORDER BY rowid").all(),
    );
    const terminalEvent = [...events]
      .reverse()
      .find(
        (event) =>
          event.event_type === "turn.completed" || event.event_type === "turn.failed",
      )?.event_type;
    const sourceUrls = new Set<string>();
    let researchSources = 0;
    for (const event of events) {
      if (event.event_type !== "source.captured" || typeof event.body_json !== "string")
        continue;
      researchSources += 1;
      try {
        const body = JSON.parse(event.body_json) as Record<string, unknown>;
        if (typeof body.canonicalUrl === "string") sourceUrls.add(body.canonicalUrl);
      } catch {
        // Canonical event JSON is validated before storage. A malformed read is
        // retained as a source count but cannot become a linked source.
      }
    }
    return Object.freeze({
      actions,
      events,
      linkedSources: sourceUrls.size,
      providerCalls,
      researchSources,
      terminalEvent:
        typeof terminalEvent === "string" ? terminalEvent : "none",
      toolCalls,
    });
  } finally {
    database.close();
  }
};
