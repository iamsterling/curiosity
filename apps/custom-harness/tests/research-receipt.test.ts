import { describe, expect, test } from "bun:test";
import type { StoredEvent } from "../src/domain/event.js";
import { generateResearchReceipt } from "../src/research/receipt.js";

const sourceId = `source:${"a".repeat(64)}`;
const sourceEvent = (overrides: Record<string, unknown> = {}): StoredEvent => ({
  aggregateVersion: 1,
  actorId: "curiosity-kernel",
  body: {
    callId: "call-001",
    canonicalUrl: "https://example.com/primary",
    capturedAt: "2026-08-26T15:00:00.000Z",
    contentDigest: "b".repeat(64),
    provenance: "untrusted-evidence",
    retrievalKind: "fetch",
    schemaVersion: 1,
    sourceId,
    threadId: "thread-001",
    turnId: "turn-001",
    ...overrides,
  },
  catalogDigest: "c".repeat(64),
  causationId: "command-001",
  childExecutionId: "turn-001",
  commandId: "command-001",
  contributionId: "curiosity.stock.search",
  contributionVersion: "1",
  correlationId: "turn-001",
  eventHash: "event-hash",
  eventId: "event-001",
  eventSchemaVersion: 1,
  occurredAt: "2026-08-26T15:00:00.000Z",
  parentExecutionId: "turn-001",
  pluginId: "curiosity.stock.search",
  previousHash: "previous-hash",
  rootExecutionId: "turn-001",
  sequence: 1,
  streamId: sourceId,
  type: "source.captured",
});

const generate = (text: string, events: readonly StoredEvent[] = [sourceEvent()]) =>
  generateResearchReceipt({
    assistantMessageId: "assistant-001",
    events,
    modelId: "test:research",
    text,
    threadId: "thread-001",
    turnId: "turn-001",
  });

describe("research receipt generation", () => {
  test("resolves cited URLs to captured sources and emits a stable receipt", () => {
    const result = generate(
      "Finding [Primary](https://example.com/primary#section).",
    );
    expect(result).toMatchObject({
      ok: true,
      receipt: {
        citationCount: 1,
        citations: [
          {
            canonicalUrl: "https://example.com/primary",
            sourceIds: [sourceId],
          },
        ],
        sourceCount: 1,
        toolCallCount: 1,
        verification: "verified",
      },
    });
    if (result.ok)
      expect(result.receipt.receiptId).toMatch(
        /^research-receipt:[a-f0-9]{64}$/u,
      );
  });

  test("preserves balanced URL parentheses while trimming Markdown delimiters", () => {
    const canonicalUrl =
      "https://en.wikipedia.org/wiki/Pok%C3%A9mon_(video_game_series)";
    expect(
      generate(`Finding [Series](${canonicalUrl}).`, [
        sourceEvent({ canonicalUrl }),
      ]),
    ).toMatchObject({
      ok: true,
      receipt: {
        citationCount: 1,
        citations: [{ canonicalUrl, sourceIds: [sourceId] }],
      },
    });
  });

  test("rejects absent and unresolved citations when sources were captured", () => {
    expect(generate("Finding without a citation.")).toMatchObject({
      failure: "RESEARCH_CITATIONS_REQUIRED",
      ok: false,
    });
    expect(generate("Finding https://example.net/not-captured")).toMatchObject({
      failure: "RESEARCH_CITATION_UNRESOLVED",
      ok: false,
    });
  });

  test("ignores custody from another turn and permits a zero-source receipt", () => {
    expect(
      generate("Workspace-only finding.", [
        sourceEvent({ turnId: "turn-other" }),
      ]),
    ).toMatchObject({
      ok: true,
      receipt: {
        citationCount: 0,
        sourceCount: 0,
        verification: "not-applicable",
      },
    });
  });
});
