import type { HostedWebSearch } from "../providers/ai-sdk.js";
import type {
  ResearchAdapter,
  ResearchSearchRequest,
  ResearchSearchResult,
} from "./adapter.js";

const maximumActiveSearches = 4;
const maximumSearchDurationMs = 10_000;
let activeSearches = 0;

const stableError = (code: string): Error => new Error(code);

const boundedText = (value: string, maximumBytes: number): string => {
  let result = value;
  while (Buffer.byteLength(result) > maximumBytes) result = result.slice(0, -1);
  return result;
};

const canonicalPublicUrl = (value: string): string | undefined => {
  if (Buffer.byteLength(value) > 4_096) return undefined;
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return undefined;
    url.hash = "";
    return url.href;
  } catch {
    return undefined;
  }
};

const sourceTitle = (canonicalUrl: string): string => {
  const url = new URL(canonicalUrl);
  let path = url.pathname === "/" ? "" : url.pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    // Keep the safely parsed URL path when percent-decoding is malformed.
  }
  return boundedText(`${url.hostname}${path}`, 512);
};

const sourceResults = (
  urls: readonly string[],
  query: string,
  maximum: number,
): readonly ResearchSearchResult[] => {
  const results: ResearchSearchResult[] = [];
  const seen = new Set<string>();
  const snippet = boundedText(
    `Discovered by OpenAI hosted web search for query: ${query}`,
    2_048,
  );
  for (const value of urls) {
    const canonicalUrl = canonicalPublicUrl(value);
    if (!canonicalUrl || seen.has(canonicalUrl)) continue;
    seen.add(canonicalUrl);
    results.push({
      canonicalUrl,
      snippet,
      title: sourceTitle(canonicalUrl),
    });
    if (results.length === maximum) break;
  }
  return results;
};

const searchFailure = (cause: unknown): Error => {
  const message = cause instanceof Error ? cause.message : "";
  if (message === "OPENAI_OAUTH_AUTHENTICATION_REQUIRED")
    return stableError("SEARCH_OPENAI_OAUTH_AUTHENTICATION_REQUIRED");
  if (
    message === "AI_SDK_STREAM_ABORTED" ||
    message.includes("Timeout") ||
    message.includes("aborted")
  )
    return stableError("SEARCH_DEADLINE_EXCEEDED");
  return stableError("SEARCH_OPENAI_OAUTH_FAILED");
};

export const createOpenAiOAuthSearchAdapter = (options: {
  readonly now?: () => number;
  readonly search: HostedWebSearch;
}): ResearchAdapter => {
  const now = options.now ?? Date.now;
  const active = new Set<AbortController>();
  let closed = false;
  return Object.freeze({
    close: () => {
      if (closed) return;
      closed = true;
      for (const controller of active) controller.abort();
      active.clear();
    },
    receipt: Object.freeze({
      adapterId: "curiosity-openai-oauth-web-search",
      adapterVersion: "1.0.0",
      capabilities: ["network.search"] as const,
      securityProfile: "openai-oauth-web-search-v1" as const,
    }),
    search: async (request: ResearchSearchRequest) => {
      if (closed) throw stableError("SEARCH_ADAPTER_CLOSED");
      if (
        !request.query.trim() ||
        request.query.length > 1_024 ||
        !Number.isSafeInteger(request.maxResults) ||
        request.maxResults < 1 ||
        request.maxResults > 10
      )
        throw stableError("SEARCH_INPUT_INVALID");
      if (activeSearches >= maximumActiveSearches)
        throw stableError("SEARCH_ADAPTER_BUSY");
      const timeoutMs = Math.min(
        request.deadlineUnixMs - now(),
        maximumSearchDurationMs,
      );
      if (timeoutMs <= 0) throw stableError("SEARCH_DEADLINE_EXCEEDED");
      const controller = new AbortController();
      active.add(controller);
      activeSearches += 1;
      try {
        const response = await options.search({
          abortSignal: controller.signal,
          query: request.query,
          timeoutMs,
        });
        if (closed) throw stableError("SEARCH_ADAPTER_CLOSED");
        return {
          queriedAt: new Date(now()).toISOString(),
          results: sourceResults(
            response.urls,
            request.query,
            request.maxResults,
          ),
        };
      } catch (cause) {
        if (cause instanceof Error && cause.message === "SEARCH_ADAPTER_CLOSED")
          throw cause;
        throw searchFailure(cause);
      } finally {
        active.delete(controller);
        activeSearches -= 1;
      }
    },
  });
};
