import type { ResearchAdapter } from "./adapter.js";

export const combineResearchAdapters = (
  searchAdapter: ResearchAdapter | undefined,
  fetchAdapter: ResearchAdapter | undefined,
): ResearchAdapter | undefined => {
  if (!searchAdapter) return fetchAdapter;
  if (!fetchAdapter) return searchAdapter;
  if (!searchAdapter.search || !fetchAdapter.fetch)
    throw new Error("RESEARCH_ADAPTER_COMBINATION_INVALID");
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
      adapterId: "curiosity-runtime-research",
      adapterVersion: "1.0.0",
      capabilities: ["network.fetch", "network.search"] as const,
      securityProfile: "curiosity-runtime-research-v1" as const,
    }),
    search: searchAdapter.search,
  });
};
