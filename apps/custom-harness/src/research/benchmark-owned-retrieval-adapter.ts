import {
  createQueryRuntime,
  type OwnedRetrievalPrincipal,
} from "@curiosity/runtime/query";
import type {
  ResearchAdapter,
  ResearchSearchRequest,
} from "./adapter.js";
import { BenchmarkOwnedCorpus } from "./benchmark-owned-corpus.js";
import {
  benchmarkDiscoveryUrl,
  decodeMediaWikiDiscovery,
} from "./benchmark-owned-mediawiki.js";

export interface BenchmarkOwnedResearchAdapterOptions {
  readonly acquisitionMode?: "acquire" | "snapshot-only";
  readonly discovery: ResearchAdapter;
  readonly now?: () => number;
  readonly queryCapability: Uint8Array;
  readonly stateRoot: string;
  readonly workspaceScope: string;
}

const stableError = (code: string): Error => new Error(code);

export const createBenchmarkOwnedResearchAdapter = (
  options: BenchmarkOwnedResearchAdapterOptions,
): ResearchAdapter => {
  if (!options.discovery.fetch)
    throw stableError("SEARCH_BENCHMARK_DISCOVERY_REQUIRED");
  const now = options.now ?? Date.now;
  const corpus = new BenchmarkOwnedCorpus(options.stateRoot);
  const runtime = createQueryRuntime({
    mode: "owned-retrieval-v3",
    now,
    ownedSnapshot: corpus,
    queryCapability: options.queryCapability,
    workspaceScope: options.workspaceScope,
  });
  const principal: OwnedRetrievalPrincipal = {
    operation: "retrieve_information",
    queryCapability: options.queryCapability,
    role: "researcher",
    workspaceScope: options.workspaceScope,
  };
  let closed = false;

  return Object.freeze({
    close: () => {
      if (closed) return;
      closed = true;
      runtime.close();
      options.discovery.close();
    },
    receipt: Object.freeze({
      adapterId: "curiosity-benchmark-owned-retrieval",
      adapterVersion: "1.0.0",
      capabilities: ["network.search"] as const,
      securityProfile: "benchmark-owned-retrieval-v1" as const,
    }),
    search: async (request: ResearchSearchRequest) => {
      if (closed) throw stableError("SEARCH_ADAPTER_CLOSED");
      if (request.deadlineUnixMs <= now())
        throw stableError("SEARCH_DEADLINE_EXCEEDED");
      if (options.acquisitionMode === "snapshot-only") {
        if (!corpus.hasActiveSnapshot)
          throw stableError("SEARCH_BENCHMARK_SNAPSHOT_REQUIRED");
      } else {
        const response = await options.discovery.fetch!({
          deadlineUnixMs: request.deadlineUnixMs,
          maxBytes: 40_960,
          requestId: `${request.requestId}:discovery`,
          url: benchmarkDiscoveryUrl(request.query, request.maxResults),
        });
        const documents = decodeMediaWikiDiscovery(
          response.body,
          request.maxResults,
        );
        corpus.indexDiscovery({
          body: response.body,
          canonicalUrl: response.canonicalUrl,
          documents,
          mediaType: response.mediaType,
          observedAt: response.retrievedAt,
          statusCode: response.statusCode,
        });
      }
      const result = await runtime.retrieveInformation(request, principal);
      if (result.status !== "ok") {
        if (result.diagnostic.code === "authority_rejected")
          throw stableError("SEARCH_BENCHMARK_AUTHORITY_DENIED");
        throw stableError("SEARCH_BENCHMARK_RETRIEVAL_UNAVAILABLE");
      }
      return {
        ...(result.partial
          ? {
              partialFailures: result.residualUncertainty.map((code) => ({
                code: code.toUpperCase().replace(/[^A-Z0-9_]/gu, "_"),
              })),
            }
          : {}),
        queriedAt: result.queriedAt,
        results: result.results,
      };
    },
  });
};
