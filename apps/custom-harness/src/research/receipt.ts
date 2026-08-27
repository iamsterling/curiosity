import { createHash } from "node:crypto";
import type { StoredEvent } from "../domain/event.js";
import { canonicalJson } from "../kernel/canonical-json.js";

export type ResearchReceiptFailure =
  | "RESEARCH_CITATION_UNRESOLVED"
  | "RESEARCH_CITATIONS_REQUIRED"
  | "RESEARCH_SOURCE_CUSTODY_INVALID";

interface CapturedSource {
  readonly callId: string;
  readonly canonicalUrl: string;
  readonly capturedAt: string;
  readonly contentDigest: string;
  readonly retrievalKind: string;
  readonly sourceId: string;
}

export interface GeneratedResearchReceipt {
  readonly answerDigest: string;
  readonly assistantMessageId: string;
  readonly citationCount: number;
  readonly citations: readonly {
    readonly canonicalUrl: string;
    readonly sourceIds: readonly string[];
  }[];
  readonly modelId: string;
  readonly receiptId: string;
  readonly schemaVersion: 1;
  readonly sourceCount: number;
  readonly sources: readonly CapturedSource[];
  readonly threadId: string;
  readonly toolCallCount: number;
  readonly turnId: string;
  readonly verification: "not-applicable" | "verified";
}

export type ResearchReceiptResult =
  | { readonly failure: ResearchReceiptFailure; readonly ok: false }
  | { readonly ok: true; readonly receipt: GeneratedResearchReceipt };

const digest = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const normalizeUrl = (value: string): string | undefined => {
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return undefined;
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
};

const sourceFrom = (event: StoredEvent): CapturedSource | undefined => {
  const source = record(event.body);
  if (
    source?.schemaVersion !== 1 ||
    source.provenance !== "untrusted-evidence" ||
    typeof source.sourceId !== "string" ||
    typeof source.callId !== "string" ||
    typeof source.canonicalUrl !== "string" ||
    typeof source.capturedAt !== "string" ||
    typeof source.contentDigest !== "string" ||
    typeof source.retrievalKind !== "string" ||
    !normalizeUrl(source.canonicalUrl)
  )
    return undefined;
  return {
    callId: source.callId,
    canonicalUrl: source.canonicalUrl,
    capturedAt: source.capturedAt,
    contentDigest: source.contentDigest,
    retrievalKind: source.retrievalKind,
    sourceId: source.sourceId,
  };
};

const citedUrls = (text: string): readonly string[] => {
  const matches = text.match(/https?:\/\/[^\s<>"'`]+/giu) ?? [];
  const normalized = matches.flatMap((match) => {
    const trimmed = match.replace(/[\])},.;:!?]+$/gu, "");
    const url = normalizeUrl(trimmed);
    return url ? [url] : [];
  });
  return [...new Set(normalized)];
};

const citedSourceIds = (text: string): readonly string[] => [
  ...new Set(text.match(/source:[a-f0-9]{64}/giu) ?? []),
];

export const generateResearchReceipt = (input: {
  readonly assistantMessageId: string;
  readonly events: readonly StoredEvent[];
  readonly modelId: string;
  readonly text: string;
  readonly threadId: string;
  readonly turnId: string;
}): ResearchReceiptResult => {
  const sourceEvents = input.events.filter((event) => {
    if (event.type !== "source.captured") return false;
    const source = record(event.body);
    return source?.threadId === input.threadId && source.turnId === input.turnId;
  });
  const sources = sourceEvents.map(sourceFrom);
  if (sources.some((source) => !source))
    return { failure: "RESEARCH_SOURCE_CUSTODY_INVALID", ok: false };
  const captured = sources as CapturedSource[];
  const byUrl = new Map<string, CapturedSource[]>();
  const byId = new Map(captured.map((source) => [source.sourceId, source]));
  for (const source of captured) {
    const normalized = normalizeUrl(source.canonicalUrl)!;
    byUrl.set(normalized, [...(byUrl.get(normalized) ?? []), source]);
  }

  const urls = citedUrls(input.text);
  const sourceIds = citedSourceIds(input.text);
  if (
    urls.some((url) => !byUrl.has(url)) ||
    sourceIds.some((sourceId) => !byId.has(sourceId))
  )
    return { failure: "RESEARCH_CITATION_UNRESOLVED", ok: false };
  if (captured.length > 0 && urls.length === 0 && sourceIds.length === 0)
    return { failure: "RESEARCH_CITATIONS_REQUIRED", ok: false };

  const citations = urls.map((canonicalUrl) => ({
    canonicalUrl,
    sourceIds: byUrl.get(canonicalUrl)!.map(({ sourceId }) => sourceId),
  }));
  for (const sourceId of sourceIds) {
    const source = byId.get(sourceId)!;
    const canonicalUrl = normalizeUrl(source.canonicalUrl)!;
    if (
      citations.some((citation) => citation.canonicalUrl === canonicalUrl)
    )
      continue;
    citations.push({ canonicalUrl, sourceIds: [sourceId] });
  }
  const identity = {
    answerDigest: digest(input.text),
    assistantMessageId: input.assistantMessageId,
    citations,
    modelId: input.modelId,
    sources: captured,
    threadId: input.threadId,
    turnId: input.turnId,
  };
  return {
    ok: true,
    receipt: {
      ...identity,
      citationCount: citations.length,
      receiptId: `research-receipt:${digest(identity)}`,
      schemaVersion: 1,
      sourceCount: captured.length,
      toolCallCount: new Set(captured.map(({ callId }) => callId)).size,
      verification: captured.length === 0 ? "not-applicable" : "verified",
    },
  };
};
