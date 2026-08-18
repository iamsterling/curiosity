import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";

export interface SearchInput {
  readonly query: string;
  readonly maxResults?: number;
}

export interface SearchResult {
  readonly title: string;
  readonly url: string;
  readonly content: string;
  readonly engines: string[];
  readonly trust: "untrusted-search-result";
}

export interface PartialFailure {
  readonly engine: string;
  readonly reason: string;
}

const fail = (): never => {
  throw new DiagnosticError("WEB_SEARCH_INPUT_INVALID");
};

export const validateSearchInput = (value: unknown): SearchInput => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return fail();
  const candidate = value as Record<string, unknown>;
  if (Object.keys(candidate).some((key) => key !== "query" && key !== "maxResults")) return fail();
  if (typeof candidate.query !== "string" || candidate.query.trim().length < 1 || candidate.query.length > 500)
    return fail();
  if (
    candidate.maxResults !== undefined &&
    (!Number.isInteger(candidate.maxResults) ||
      (candidate.maxResults as number) < 1 ||
      (candidate.maxResults as number) > 10)
  )
    return fail();
  return candidate.maxResults === undefined
    ? { query: candidate.query }
    : { query: candidate.query, maxResults: candidate.maxResults as number };
};

const bounded = (value: unknown, maximum: number): string => (typeof value === "string" ? value.slice(0, maximum) : "");

const resultUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string" || value.length > 2_048) return undefined;
  try {
    const url = new URL(value);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
};

export const normalizeResult = (value: unknown): SearchResult | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  const url = resultUrl(candidate.url);
  if (!url) return undefined;
  const engines = Array.isArray(candidate.engines)
    ? candidate.engines
        .map((engine) => bounded(engine, 64))
        .filter(Boolean)
        .slice(0, 8)
    : [bounded(candidate.engine, 64)].filter(Boolean);
  return {
    title: bounded(candidate.title, 300),
    url,
    content: bounded(candidate.content, 2_000),
    engines,
    trust: "untrusted-search-result",
  };
};

export const normalizePartialFailures = (value: unknown): PartialFailure[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((failure): PartialFailure | undefined => {
      if (!Array.isArray(failure) || failure.length < 2) return undefined;
      const engine = bounded(failure[0], 64);
      const reason = bounded(failure[1], 160);
      return engine && reason ? { engine, reason } : undefined;
    })
    .filter((failure): failure is PartialFailure => failure !== undefined)
    .slice(0, 16);
};
