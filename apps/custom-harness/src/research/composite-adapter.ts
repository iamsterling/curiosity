import type { ResearchAdapter } from "./adapter.js";

export const combineResearchAdapters = (
  searchAdapter: ResearchAdapter | undefined,
  fetchAdapter: ResearchAdapter | undefined,
): ResearchAdapter | undefined => {
  if (!searchAdapter) return fetchAdapter;
  if (!fetchAdapter) return searchAdapter;
  if (!searchAdapter.search || !fetchAdapter.fetch)
    throw new Error("RESEARCH_ADAPTER_COMBINATION_INVALID");
  const openAiOAuth =
    searchAdapter.receipt.securityProfile === "openai-oauth-web-search-v1";
  let closed = false;
  return Object.freeze({
    close: () => {
      if (closed) return;
      closed = true;
      searchAdapter.close();
      fetchAdapter.close();
    },
    fetch: fetchAdapter.fetch,
    receipt: Object.freeze({
      adapterId: openAiOAuth
        ? "curiosity-openai-oauth-research"
        : "curiosity-runtime-research",
      adapterVersion: "1.0.0",
      capabilities: ["network.fetch", "network.search"] as const,
      securityProfile: openAiOAuth
        ? ("openai-oauth-research-v1" as const)
        : ("curiosity-runtime-research-v1" as const),
    }),
    search: searchAdapter.search,
  });
};
