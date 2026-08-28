export interface ResearchAdapterReceipt {
  readonly adapterId: string;
  readonly adapterVersion: string;
  readonly capabilities: readonly ("network.fetch" | "network.search")[];
  readonly securityProfile:
    | "bounded-http-v1"
    | "benchmark-owned-retrieval-v1"
    | "curiosity-runtime-research-v1"
    | "curiosity-runtime-query-v1"
    | "openai-oauth-research-v1"
    | "openai-oauth-web-search-v1";
}

export interface ResearchSearchRequest {
  readonly deadlineUnixMs: number;
  readonly maxResults: number;
  readonly query: string;
  readonly requestId: string;
}

export interface ResearchSearchResult {
  readonly canonicalUrl: string;
  readonly snippet: string;
  readonly title: string;
}

export interface ResearchSearchResponse {
  readonly partialFailures?: readonly { readonly code: string }[];
  readonly queriedAt: string;
  readonly results: readonly ResearchSearchResult[];
}

export interface ResearchFetchRequest {
  readonly deadlineUnixMs: number;
  readonly maxBytes: number;
  readonly requestId: string;
  readonly url: string;
}

export interface ResearchFetchResponse {
  readonly body: string;
  readonly canonicalUrl: string;
  readonly mediaType: string;
  readonly redirectChain: readonly string[];
  readonly retrievedAt: string;
  readonly statusCode: number;
}

export interface ResearchAdapter {
  readonly receipt: ResearchAdapterReceipt;
  readonly close: () => void;
  readonly fetch?: (
    request: ResearchFetchRequest,
  ) => Promise<ResearchFetchResponse>;
  readonly search?: (
    request: ResearchSearchRequest,
  ) => Promise<ResearchSearchResponse>;
}

export const validateResearchAdapter = (adapter: ResearchAdapter): void => {
  const { receipt } = adapter;
  const capabilities = [...receipt.capabilities].sort();
  if (
    typeof adapter.close !== "function" ||
    !/^[a-z0-9][a-z0-9._-]{0,127}$/u.test(receipt.adapterId) ||
    !/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/u.test(
      receipt.adapterVersion,
    ) ||
    ![
      "bounded-http-v1",
      "benchmark-owned-retrieval-v1",
      "curiosity-runtime-query-v1",
      "curiosity-runtime-research-v1",
      "openai-oauth-research-v1",
      "openai-oauth-web-search-v1",
    ].includes(receipt.securityProfile) ||
    capabilities.length < 1 ||
    capabilities.length > 2 ||
    new Set(capabilities).size !== capabilities.length ||
    capabilities.some(
      (capability) =>
        capability !== "network.fetch" && capability !== "network.search",
    ) ||
    (capabilities.includes("network.fetch") !==
      (typeof adapter.fetch === "function")) ||
    (capabilities.includes("network.search") !==
      (typeof adapter.search === "function"))
  )
    throw new Error("RESEARCH_ADAPTER_INVALID");
};
