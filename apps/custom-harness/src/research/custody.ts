import { createHash } from "node:crypto";
import { canonicalJson } from "../kernel/canonical-json.js";
import type {
  ResearchAdapterReceipt,
  ResearchFetchRequest,
  ResearchFetchResponse,
  ResearchSearchRequest,
  ResearchSearchResponse,
} from "./adapter.js";

const digest = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const boundedText = (value: unknown, maximumBytes: number): value is string =>
  typeof value === "string" && Buffer.byteLength(value) <= maximumBytes;

const publicUrl = (value: unknown): value is string => {
  if (!boundedText(value, 4_096)) return false;
  try {
    const parsed = new URL(value);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
};

const adapterIdentity = (receipt: ResearchAdapterReceipt) => ({
  id: receipt.adapterId,
  securityProfile: receipt.securityProfile,
  version: receipt.adapterVersion,
});

const sourceIdentity = (input: {
  readonly callId: string;
  readonly canonicalUrl: string;
  readonly contentDigest: string;
  readonly ordinal: number;
  readonly retrievalKind: "fetch" | "search-result";
}) => `source:${digest(input)}`;

export const captureSearchResponse = (input: {
  readonly adapter: ResearchAdapterReceipt;
  readonly callId: string;
  readonly request: ResearchSearchRequest;
  readonly response: ResearchSearchResponse;
}) => {
  const partialFailures = input.response.partialFailures ?? [];
  if (
    !boundedText(input.response.queriedAt, 64) ||
    !Number.isFinite(Date.parse(input.response.queriedAt)) ||
    !Array.isArray(input.response.results) ||
    input.response.results.length > input.request.maxResults ||
    !Array.isArray(partialFailures) ||
    partialFailures.length > 16 ||
    partialFailures.some(
      (failure) =>
        !failure ||
        typeof failure.code !== "string" ||
        !/^[A-Z][A-Z0-9_]{0,127}$/u.test(failure.code),
    )
  )
    throw new Error("SEARCH_RECEIPT_INVALID");
  const sources = input.response.results.map((result, ordinal) => {
    if (
      !publicUrl(result.canonicalUrl) ||
      !boundedText(result.title, 512) ||
      !boundedText(result.snippet, 2_048)
    )
      throw new Error("SEARCH_RECEIPT_INVALID");
    const contentDigest = digest({
      canonicalUrl: result.canonicalUrl,
      snippet: result.snippet,
      title: result.title,
    });
    const identity = {
      callId: input.callId,
      canonicalUrl: result.canonicalUrl,
      contentDigest,
      ordinal,
      retrievalKind: "search-result" as const,
    };
    return {
      ...identity,
      byteLength: Buffer.byteLength(result.title) + Buffer.byteLength(result.snippet),
      capturedAt: input.response.queriedAt,
      excerpt: result.snippet,
      mediaType: "text/plain",
      sourceId: sourceIdentity(identity),
      title: result.title,
    };
  });
  return {
    adapter: adapterIdentity(input.adapter),
    ...(partialFailures.length > 0
      ? { partialFailures: partialFailures.map(({ code }) => ({ code })) }
      : {}),
    provenance: "untrusted-evidence" as const,
    query: input.request.query,
    sources,
  };
};

export const captureFetchResponse = (input: {
  readonly adapter: ResearchAdapterReceipt;
  readonly callId: string;
  readonly request: ResearchFetchRequest;
  readonly response: ResearchFetchResponse;
}) => {
  if (
    !publicUrl(input.response.canonicalUrl) ||
    !boundedText(input.response.body, input.request.maxBytes) ||
    !boundedText(input.response.mediaType, 256) ||
    !boundedText(input.response.retrievedAt, 64) ||
    !Number.isFinite(Date.parse(input.response.retrievedAt)) ||
    !Number.isSafeInteger(input.response.statusCode) ||
    input.response.statusCode < 200 ||
    input.response.statusCode > 299 ||
    !Array.isArray(input.response.redirectChain) ||
    input.response.redirectChain.length > 5 ||
    input.response.redirectChain.some((url) => !publicUrl(url))
  )
    throw new Error("FETCH_RECEIPT_INVALID");
  const contentDigest = digest(input.response.body);
  const identity = {
    callId: input.callId,
    canonicalUrl: input.response.canonicalUrl,
    contentDigest,
    ordinal: 0,
    retrievalKind: "fetch" as const,
  };
  return {
    adapter: adapterIdentity(input.adapter),
    content: input.response.body,
    provenance: "untrusted-evidence" as const,
    redirectChain: [...input.response.redirectChain],
    sources: [
      {
        ...identity,
        byteLength: Buffer.byteLength(input.response.body),
        capturedAt: input.response.retrievedAt,
        mediaType: input.response.mediaType,
        sourceId: sourceIdentity(identity),
        statusCode: input.response.statusCode,
      },
    ],
  };
};
