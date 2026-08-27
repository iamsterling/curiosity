import type {
  ResearchAdapter,
  ResearchSearchRequest,
} from "./adapter.js";

export interface CuriosityQueryRuntimePort {
  readonly close: () => void;
  readonly webSearch: (
    input: unknown,
    principal: unknown,
  ) => Promise<unknown> | unknown;
}

export interface RuntimeQueryResearchAdapterOptions {
  readonly queryCapability: Uint8Array;
  readonly runtime: CuriosityQueryRuntimePort;
  readonly source: "local" | "searxng-gateway";
  readonly workspaceScope: string;
}

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

export const createRuntimeQueryResearchAdapter = (
  options: RuntimeQueryResearchAdapterOptions,
): ResearchAdapter => {
  if (
    !(options.queryCapability instanceof Uint8Array) ||
    options.queryCapability.byteLength < 1 ||
    options.queryCapability.byteLength > 256 ||
    !options.workspaceScope
  )
    throw new Error("RUNTIME_RESEARCH_ADAPTER_CONFIG_INVALID");
  const queryCapability = options.queryCapability.slice();
  let closed = false;
  return Object.freeze({
    close: () => {
      if (closed) return;
      closed = true;
      queryCapability.fill(0);
      options.runtime.close();
    },
    receipt: Object.freeze({
      adapterId: "curiosity-runtime-query",
      adapterVersion: "1.0.0",
      capabilities: ["network.search"] as const,
      securityProfile: "curiosity-runtime-query-v1" as const,
    }),
    search: async ({
      deadlineUnixMs,
      maxResults,
      query,
      requestId,
    }: ResearchSearchRequest) => {
      if (closed) throw new Error("SEARCH_ADAPTER_CLOSED");
      const response = await options.runtime.webSearch(
        {
          apiVersion: "curiosity.runtime/v0",
          deadlineUnixMs,
          maxResults,
          operation: "web_search",
          query,
          requestId,
          source: options.source,
        },
        {
          operation: "web_search",
          queryCapability,
          role: "researcher",
          workspaceScope: options.workspaceScope,
        },
      );
      const result = record(response);
      if (result?.status !== "ok" || !Array.isArray(result.results)) {
        const diagnostic = record(result?.diagnostic);
        const code =
          typeof diagnostic?.code === "string"
            ? diagnostic.code.toUpperCase().replace(/[^A-Z0-9_]/gu, "_")
            : "UNKNOWN";
        throw new Error(`SEARCH_RUNTIME_REJECTED_${code}`);
      }
      return {
        queriedAt: new Date().toISOString(),
        results: result.results.slice(0, maxResults).map((value) => {
          const item = record(value);
          if (
            typeof item?.title !== "string" ||
            typeof item.url !== "string" ||
            typeof item.content !== "string" ||
            item.trust !== "untrusted-search-result"
          )
            throw new Error("SEARCH_RUNTIME_RESPONSE_INVALID");
          return {
            canonicalUrl: item.url,
            snippet: item.content,
            title: item.title,
          };
        }),
      };
    },
  });
};
