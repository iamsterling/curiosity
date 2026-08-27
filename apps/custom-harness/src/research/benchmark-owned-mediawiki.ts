export const benchmarkConnector = "mediawiki-rest-v1" as const;
export const benchmarkDiscoveryEndpoint =
  "https://en.wikipedia.org/w/rest.php/v1/search/page";

export interface BenchmarkDiscoveryDocument {
  readonly canonicalUrl: string;
  readonly connectorRank: number;
  readonly excerpt: string;
  readonly title: string;
}

const invalid = (): never => {
  throw new Error("SEARCH_BENCHMARK_DISCOVERY_INVALID");
};

const bounded = (value: string, maximum: number): boolean =>
  value.length > 0 &&
  Buffer.byteLength(value) <= maximum &&
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);

const decodeEntity = (entity: string): string => {
  const named: Readonly<Record<string, string>> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  if (entity in named) return named[entity]!;
  const numeric = entity.startsWith("#x")
    ? Number.parseInt(entity.slice(2), 16)
    : entity.startsWith("#")
      ? Number.parseInt(entity.slice(1), 10)
      : Number.NaN;
  return Number.isSafeInteger(numeric) &&
    numeric > 0 &&
    numeric <= 0x10ffff &&
    !(numeric >= 0xd800 && numeric <= 0xdfff)
    ? String.fromCodePoint(numeric)
    : `&${entity};`;
};

const plainText = (value: string): string =>
  value
    .replace(/<[^>]{0,512}>/gu, "")
    .replace(/&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/giu, (_, entity) =>
      decodeEntity(String(entity).toLowerCase()),
    )
    .replace(/\s+/gu, " ")
    .trim();

export const benchmarkDiscoveryUrl = (
  query: string,
  maximum: number,
): string => {
  const url = new URL(benchmarkDiscoveryEndpoint);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(maximum));
  return url.toString();
};

export const isBenchmarkDiscoveryUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "en.wikipedia.org" &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      url.pathname === "/w/rest.php/v1/search/page"
    );
  } catch {
    return false;
  }
};

export const decodeMediaWikiDiscovery = (
  body: string,
  maximum: number,
): readonly BenchmarkDiscoveryDocument[] => {
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return invalid();
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    return invalid();
  const pages = (value as Record<string, unknown>).pages;
  if (!Array.isArray(pages) || pages.length > maximum || pages.length > 10)
    return invalid();
  return pages.map((value, connectorRank) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return invalid();
    const page = value as Record<string, unknown>;
    if (
      typeof page.key !== "string" ||
      !bounded(page.key, 512) ||
      typeof page.title !== "string" ||
      !bounded(page.title, 300) ||
      typeof page.excerpt !== "string" ||
      Buffer.byteLength(page.excerpt) > 4_096
    )
      return invalid();
    const title = plainText(page.title);
    const excerpt =
      plainText(page.excerpt) ||
      (typeof page.description === "string"
        ? plainText(page.description)
        : "") ||
      title;
    if (!bounded(title, 300) || !bounded(excerpt, 2_000)) return invalid();
    return {
      canonicalUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.key)}`,
      connectorRank,
      excerpt,
      title,
    };
  });
};
