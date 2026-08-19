import { createHash } from "node:crypto";

import type { RepositoryOutcome } from "../repository-search.js";
import { RETRIEVAL_LIMITS, type DiscoveryCandidate, type RetrievalFrame } from "./contracts.js";
import { decodeRetrievalFrame } from "./decoders.js";
import { validProviderIdentifierArray } from "./provider-identifier.js";
import { truncateUtf8, validHttpUrl, validRfc3339 } from "./validation.js";

const invalid = (): never => { throw new Error("RETRIEVAL_REPOSITORY_MAPPING_INVALID"); };
const safeText = (value: unknown, maximum: number, allowEmpty = false): string => {
  if (typeof value !== "string" || (!allowEmpty && value.length === 0) || /[\u0000-\u001f\u007f]/u.test(value)) return invalid();
  return truncateUtf8(value, maximum);
};
const candidateId = (requestId: string, url: string, ordinal: number): string =>
  `candidate-${createHash("sha256").update(`${requestId}\0${url}\0${ordinal}`).digest("hex").slice(0, 24)}`;

const mapOutcome = (input: {
  readonly requestId: string;
  readonly outcome: RepositoryOutcome;
  readonly observedAt: string;
}): RetrievalFrame => {
  if (!/^[A-Za-z0-9._:-]{1,64}$/u.test(input.requestId) || !validRfc3339(input.observedAt)) return invalid();
  const candidates: DiscoveryCandidate[] = input.outcome.results.slice(0, RETRIEVAL_LIMITS.candidates).map((result, ordinal) => {
    if (!validProviderIdentifierArray(result.provenance, 0, 64)) return invalid();
    const labels = result.provenance.length === 0
      ? ["source-labels-unavailable"]
      : result.provenance.slice(0, RETRIEVAL_LIMITS.labels);
    return {
      schemaVersion: 1,
      contract: "curiosity.retrieval/discovery-candidate/v1",
      recordKind: "discovery-candidate",
      candidateId: candidateId(input.requestId, result.url, ordinal),
      surfaceId: "public-web/searxng-gateway",
      sourceLocator: validHttpUrl(result.url) && Buffer.byteLength(result.url) <= RETRIEVAL_LIMITS.locator ? result.url : invalid(),
      title: safeText(result.title, RETRIEVAL_LIMITS.title, true),
      snippet: safeText(result.content, RETRIEVAL_LIMITS.snippet, true),
      observedAt: input.observedAt,
      nativeRanking: { namespace: "org.searxng.providers/v1", labels },
      extensions: {},
      trust: "untrusted-candidate",
      authority: "none",
    };
  });
  const failed = input.outcome.partialFailures.length > 0;
  return {
    schemaVersion: 1,
    contract: "curiosity.retrieval/frame/v1",
    requestId: input.requestId,
    planRef: "runtime-web-search/live-v1",
    candidates,
    attempts: [{
      surfaceId: "public-web/searxng-gateway",
      mode: "LIVE",
      outcome: failed ? "FAILED" : "SUCCEEDED",
      freshness: failed ? { state: "UNKNOWN" } : { state: "CURRENT", observedAt: input.observedAt },
      observedItems: candidates.length,
    }],
    coverage: {
      measurement: "UNKNOWN",
      completeness: failed ? "PARTIAL" : "UNKNOWN",
      requestedScope: null,
      attemptedScope: null,
      eligibleScope: null,
      observedItems: candidates.length,
    },
    failures: input.outcome.partialFailures.slice(0, RETRIEVAL_LIMITS.failures).map((failure) => ({
      surfaceId: safeText(failure.source, RETRIEVAL_LIMITS.id),
      code: "SOURCE_PARTIAL_FAILURE",
      detail: safeText(failure.reason, RETRIEVAL_LIMITS.reason),
    })),
    // Unknown provider coverage can never claim exhaustive completeness.
    partial: true,
    asOf: input.observedAt,
  };
};

export const mapRepositoryOutcomeToRetrievalFrame = (input: {
  readonly requestId: string;
  readonly outcome: RepositoryOutcome;
  readonly observedAt: string;
}): RetrievalFrame => {
  try {
    return decodeRetrievalFrame(mapOutcome(input));
  } catch {
    return invalid();
  }
};
