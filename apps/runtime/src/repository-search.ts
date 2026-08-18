import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP } from "node:net";

export const SEARXNG_GATEWAY_ENDPOINT = "https://search.formerhuman.com/agent-search";
const HOSTNAME = "search.formerhuman.com";
const MAX_BODY_BYTES = 256_000;
const MAX_ACTIVE_PROVIDER_CALLS = 8;

export type RepositoryTransportCall = {
  readonly url: typeof SEARXNG_GATEWAY_ENDPOINT;
  readonly method: "POST";
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
};

export type RepositoryTransportResponse = {
  readonly status: number;
  readonly headers: Readonly<Record<string, string | undefined>>;
  readonly body: Uint8Array;
};

export type RepositoryTransport = (
  call: RepositoryTransportCall,
  signal: AbortSignal,
) => Promise<RepositoryTransportResponse>;

export type RepositoryRequest = {
  readonly query: string;
  readonly maxResults: number;
  readonly deadlineUnixMs: number;
};

export type RepositoryResult = {
  readonly title: string;
  readonly url: string;
  readonly content: string;
  readonly provenance: string[];
  readonly trust: "untrusted-search-result";
};

export type RepositoryOutcome = {
  readonly results: RepositoryResult[];
  readonly partialFailures: Array<{ readonly source: string; readonly reason: string }>;
};

export interface RepositorySearch {
  search(request: RepositoryRequest): Promise<RepositoryOutcome>;
  close(): void;
}

export type ProviderDiagnosticCode =
  | "deadline_expired"
  | "provider_auth_rejected"
  | "provider_rate_limited"
  | "provider_redirect_rejected"
  | "provider_response_invalid"
  | "provider_response_too_large"
  | "provider_unavailable"
  | "runtime_busy"
  | "runtime_failure";

export class ProviderFailure extends Error {
  constructor(readonly code: ProviderDiagnosticCode) {
    super(code);
    this.name = "ProviderFailure";
  }
}

type SpecialPurposeCidr = {
  readonly network: string;
  readonly prefix: number;
  readonly family: "ipv4" | "ipv6";
  readonly first: string;
  readonly last: string;
};

// IANA IPv4/IPv6 Special-Purpose Address Registries, including globally routed
// anycast and transition allocations: this boundary permits ordinary global
// destinations, not special-purpose endpoints.
export const SPECIAL_PURPOSE_CIDRS: readonly SpecialPurposeCidr[] = [
  { network: "0.0.0.0", prefix: 8, family: "ipv4", first: "0.0.0.0", last: "0.255.255.255" },
  { network: "10.0.0.0", prefix: 8, family: "ipv4", first: "10.0.0.0", last: "10.255.255.255" },
  { network: "100.64.0.0", prefix: 10, family: "ipv4", first: "100.64.0.0", last: "100.127.255.255" },
  { network: "127.0.0.0", prefix: 8, family: "ipv4", first: "127.0.0.0", last: "127.255.255.255" },
  { network: "169.254.0.0", prefix: 16, family: "ipv4", first: "169.254.0.0", last: "169.254.255.255" },
  { network: "172.16.0.0", prefix: 12, family: "ipv4", first: "172.16.0.0", last: "172.31.255.255" },
  { network: "192.0.0.0", prefix: 24, family: "ipv4", first: "192.0.0.0", last: "192.0.0.255" },
  { network: "192.0.2.0", prefix: 24, family: "ipv4", first: "192.0.2.0", last: "192.0.2.255" },
  { network: "192.31.196.0", prefix: 24, family: "ipv4", first: "192.31.196.0", last: "192.31.196.255" },
  { network: "192.52.193.0", prefix: 24, family: "ipv4", first: "192.52.193.0", last: "192.52.193.255" },
  { network: "192.88.99.0", prefix: 24, family: "ipv4", first: "192.88.99.0", last: "192.88.99.255" },
  { network: "192.168.0.0", prefix: 16, family: "ipv4", first: "192.168.0.0", last: "192.168.255.255" },
  { network: "192.175.48.0", prefix: 24, family: "ipv4", first: "192.175.48.0", last: "192.175.48.255" },
  { network: "198.18.0.0", prefix: 15, family: "ipv4", first: "198.18.0.0", last: "198.19.255.255" },
  { network: "198.51.100.0", prefix: 24, family: "ipv4", first: "198.51.100.0", last: "198.51.100.255" },
  { network: "203.0.113.0", prefix: 24, family: "ipv4", first: "203.0.113.0", last: "203.0.113.255" },
  { network: "224.0.0.0", prefix: 4, family: "ipv4", first: "224.0.0.0", last: "239.255.255.255" },
  { network: "240.0.0.0", prefix: 4, family: "ipv4", first: "240.0.0.0", last: "255.255.255.255" },
  { network: "::", prefix: 128, family: "ipv6", first: "::", last: "::" },
  { network: "::1", prefix: 128, family: "ipv6", first: "::1", last: "::1" },
  { network: "::ffff:0:0", prefix: 96, family: "ipv6", first: "::ffff:0.0.0.0", last: "::ffff:255.255.255.255" },
  { network: "::ffff:0:0:0", prefix: 96, family: "ipv6", first: "::ffff:0:0:0", last: "::ffff:0:ffff:ffff" },
  { network: "64:ff9b::", prefix: 96, family: "ipv6", first: "64:ff9b::", last: "64:ff9b::ffff:ffff" },
  { network: "64:ff9b:1::", prefix: 48, family: "ipv6", first: "64:ff9b:1::", last: "64:ff9b:1:ffff:ffff:ffff:ffff:ffff" },
  { network: "100::", prefix: 64, family: "ipv6", first: "100::", last: "100::ffff:ffff:ffff:ffff" },
  { network: "100:0:0:1::", prefix: 64, family: "ipv6", first: "100:0:0:1::", last: "100:0:0:1:ffff:ffff:ffff:ffff" },
  { network: "2001::", prefix: 23, family: "ipv6", first: "2001::", last: "2001:1ff:ffff:ffff:ffff:ffff:ffff:ffff" },
  { network: "2001::", prefix: 32, family: "ipv6", first: "2001::", last: "2001::ffff:ffff:ffff:ffff" },
  { network: "2001:1::1", prefix: 128, family: "ipv6", first: "2001:1::1", last: "2001:1::1" },
  { network: "2001:1::2", prefix: 128, family: "ipv6", first: "2001:1::2", last: "2001:1::2" },
  { network: "2001:2::", prefix: 48, family: "ipv6", first: "2001:2::", last: "2001:2:0:ffff:ffff:ffff:ffff:ffff" },
  { network: "2001:3::", prefix: 32, family: "ipv6", first: "2001:3::", last: "2001:3:ffff:ffff:ffff:ffff:ffff:ffff" },
  { network: "2001:4:112::", prefix: 48, family: "ipv6", first: "2001:4:112::", last: "2001:4:112:ffff:ffff:ffff:ffff:ffff" },
  { network: "2001:10::", prefix: 28, family: "ipv6", first: "2001:10::", last: "2001:1f:ffff:ffff:ffff:ffff:ffff:ffff" },
  { network: "2001:20::", prefix: 28, family: "ipv6", first: "2001:20::", last: "2001:2f:ffff:ffff:ffff:ffff:ffff:ffff" },
  { network: "2001:30::", prefix: 28, family: "ipv6", first: "2001:30::", last: "2001:3f:ffff:ffff:ffff:ffff:ffff:ffff" },
  { network: "2001:db8::", prefix: 32, family: "ipv6", first: "2001:db8::", last: "2001:db8:ffff:ffff:ffff:ffff:ffff:ffff" },
  { network: "2002::", prefix: 16, family: "ipv6", first: "2002::", last: "2002:ffff:ffff:ffff:ffff:ffff:ffff:ffff" },
  { network: "2620:4f:8000::", prefix: 48, family: "ipv6", first: "2620:4f:8000::", last: "2620:4f:8000:ffff:ffff:ffff:ffff:ffff" },
  { network: "3fff::", prefix: 20, family: "ipv6", first: "3fff::", last: "3fff:fff:ffff:ffff:ffff:ffff:ffff:ffff" },
  { network: "5f00::", prefix: 16, family: "ipv6", first: "5f00::", last: "5f00:ffff:ffff:ffff:ffff:ffff:ffff:ffff" },
  { network: "fc00::", prefix: 7, family: "ipv6", first: "fc00::", last: "fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff" },
  { network: "fe80::", prefix: 10, family: "ipv6", first: "fe80::", last: "febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff" },
  { network: "ff00::", prefix: 8, family: "ipv6", first: "ff00::", last: "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff" },
] as const;

const ipv4Blocks = new BlockList();
const ipv6Blocks = new BlockList();
for (const block of SPECIAL_PURPOSE_CIDRS)
  (block.family === "ipv4" ? ipv4Blocks : ipv6Blocks).addSubnet(block.network, block.prefix, block.family);

export const isGlobalUnicastAddress = (address: string): boolean => {
  if (address.includes("%")) return false;
  const family = isIP(address);
  if (family === 4) return !ipv4Blocks.check(address, "ipv4");
  if (family !== 6 || ipv6Blocks.check(address, "ipv6")) return false;
  const first = Number.parseInt(address.split(":", 1)[0] || "0", 16);
  return (first & 0xe000) === 0x2000;
};

type Address = { readonly address: string; readonly family: 4 | 6 };
export const resolvePinnedAddresses = async (
  hostname: string,
  resolver: (hostname: string) => Promise<readonly Address[]> = async (name) =>
    await dnsLookup(name, { all: true, verbatim: true }) as Address[],
): Promise<readonly Address[]> => {
  const answers = await resolver(hostname);
  if (answers.length < 1) throw new ProviderFailure("provider_unavailable");
  const family = answers[0]!.family;
  if (answers.some((answer) => answer.family !== family || !isGlobalUnicastAddress(answer.address)))
    throw new ProviderFailure("provider_unavailable");
  return answers;
};

const headerRecord = (headers: import("node:http").IncomingHttpHeaders): Record<string, string | undefined> =>
  Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), Array.isArray(value) ? value.join(",") : value]));

export const httpsRepositoryTransport: RepositoryTransport = async (call, signal) => {
  const addresses = await resolvePinnedAddresses(HOSTNAME);
  const pinned = addresses[0]!;
  return await new Promise<RepositoryTransportResponse>((resolve, reject) => {
    const request = httpsRequest({
      protocol: "https:", hostname: HOSTNAME, port: 443, path: "/agent-search", method: call.method,
      servername: HOSTNAME, rejectUnauthorized: true, agent: false, signal,
      headers: call.headers,
      lookup: (_hostname, _options, callback) => {
        const pinnedCallback = callback as unknown as (error: null, addresses: Address[]) => void;
        pinnedCallback(null, [pinned]);
      },
    }, (response) => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.byteLength;
        if (size > MAX_BODY_BYTES) {
          response.destroy(new ProviderFailure("provider_response_too_large"));
          return;
        }
        chunks.push(chunk);
      });
      response.once("end", () => resolve({ status: response.statusCode ?? 0, headers: headerRecord(response.headers), body: Buffer.concat(chunks) }));
      response.once("error", reject);
    });
    request.once("error", reject);
    request.end(call.body);
  });
};

const reflected = (value: string, token: string): boolean => value.includes(token) || value.includes(`Bearer ${token}`);
const bounded = (value: unknown, maximum: number, token: string): string => {
  if (typeof value !== "string") return "";
  if (reflected(value, token)) throw new ProviderFailure("provider_response_invalid");
  return value.slice(0, maximum);
};
const normalizedUrl = (value: unknown, token: string): string | undefined => {
  if (typeof value !== "string" || value.length > 2_048) return undefined;
  if (reflected(value, token)) throw new ProviderFailure("provider_response_invalid");
  try {
    const url = new URL(value);
    if (!(["http:", "https:"] as string[]).includes(url.protocol) || url.username || url.password) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
};

const normalizeResults = (payload: Record<string, unknown>, maximum: number, token: string): RepositoryResult[] => {
  const seen = new Set<string>();
  const values = payload.results as unknown[];
  return values.flatMap((value) => {
    if (typeof value !== "object" || value === null || Array.isArray(value) || seen.size >= maximum) return [];
    const candidate = value as Record<string, unknown>;
    const url = normalizedUrl(candidate.url, token);
    if (!url || seen.has(url)) return [];
    seen.add(url);
    const labels = (Array.isArray(candidate.engines) ? candidate.engines : [candidate.engine])
      .map((label) => bounded(label, 64, token)).filter(Boolean).slice(0, 8);
    return [{
      title: bounded(candidate.title, 300, token), url, content: bounded(candidate.content, 2_000, token),
      provenance: ["searxng-gateway", ...labels], trust: "untrusted-search-result" as const,
    }];
  });
};

const normalizeFailures = (value: unknown, token: string): RepositoryOutcome["partialFailures"] => !Array.isArray(value) ? [] : value
  .flatMap((failure) => {
    if (!Array.isArray(failure) || failure.length < 2) return [];
    const source = bounded(failure[0], 64, token);
    const reason = bounded(failure[1], 160, token);
    return source && reason ? [{ source, reason }] : [];
  }).slice(0, 16);

const parseResponse = (response: RepositoryTransportResponse, maximum: number, token: string): RepositoryOutcome => {
  if (Buffer.from(response.body).includes(Buffer.from(token, "utf8")))
    throw new ProviderFailure("provider_response_invalid");
  if (response.status === 401 || response.status === 403) throw new ProviderFailure("provider_auth_rejected");
  if (response.status === 429) throw new ProviderFailure("provider_rate_limited");
  if (response.status >= 300 && response.status < 400) throw new ProviderFailure("provider_redirect_rejected");
  if (response.status < 200 || response.status >= 300) throw new ProviderFailure("provider_unavailable");
  const contentType = response.headers["content-type"] ?? "";
  const encoding = response.headers["content-encoding"];
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?\s*$/iu.test(contentType) || (encoding !== undefined && encoding.toLowerCase() !== "identity"))
    throw new ProviderFailure("provider_response_invalid");
  if (response.body.byteLength > MAX_BODY_BYTES) throw new ProviderFailure("provider_response_too_large");
  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(response.body));
  } catch {
    throw new ProviderFailure("provider_response_invalid");
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload) || !Array.isArray((payload as Record<string, unknown>).results))
    throw new ProviderFailure("provider_response_invalid");
  const record = payload as Record<string, unknown>;
  return { results: normalizeResults(record, maximum, token), partialFailures: normalizeFailures(record.unresponsive_engines, token) };
};

let activeProviderCalls = 0;

export const createSearxngGatewayAdapter = (options: {
  readonly bearerToken: string;
  readonly transport?: RepositoryTransport;
  readonly now?: () => number;
}): RepositorySearch => {
  if (typeof options.bearerToken !== "string" || options.bearerToken.length < 1 || options.bearerToken.length > 4_096 || options.bearerToken.trim() !== options.bearerToken || /[\u0000-\u001f\u007f]/u.test(options.bearerToken))
    throw new Error("REPOSITORY_SEARCH_CONFIG_INVALID");
  const transport = options.transport ?? httpsRepositoryTransport;
  const now = options.now ?? Date.now;
  const active = new Set<AbortController>();
  let closed = false;
  return {
    async search(request: RepositoryRequest): Promise<RepositoryOutcome> {
      if (closed) throw new ProviderFailure("runtime_failure");
      if (activeProviderCalls >= MAX_ACTIVE_PROVIDER_CALLS) throw new ProviderFailure("runtime_busy");
      const remaining = request.deadlineUnixMs - now();
      if (remaining <= 0) throw new ProviderFailure("deadline_expired");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), remaining);
      active.add(controller);
      activeProviderCalls += 1;
      let rejectAbort!: (error: ProviderFailure) => void;
      const aborted = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
      const abort = () => rejectAbort(new ProviderFailure("deadline_expired"));
      controller.signal.addEventListener("abort", abort, { once: true });
      try {
        const transportResult = transport({
          url: SEARXNG_GATEWAY_ENDPOINT, method: "POST",
          headers: { accept: "application/json", authorization: `Bearer ${options.bearerToken}`, "content-type": "application/json" },
          body: JSON.stringify({ query: request.query, maxResults: request.maxResults }),
        }, controller.signal);
        const response = await Promise.race([transportResult, aborted]);
        if (closed) throw new ProviderFailure("runtime_failure");
        if (controller.signal.aborted || now() >= request.deadlineUnixMs) throw new ProviderFailure("deadline_expired");
        return parseResponse(response, request.maxResults, options.bearerToken);
      } catch (error) {
        if (closed) throw new ProviderFailure("runtime_failure");
        if (error instanceof ProviderFailure) throw error;
        if (controller.signal.aborted || now() >= request.deadlineUnixMs) throw new ProviderFailure("deadline_expired");
        throw new ProviderFailure("provider_unavailable");
      } finally {
        clearTimeout(timer);
        controller.signal.removeEventListener("abort", abort);
        active.delete(controller);
        activeProviderCalls -= 1;
      }
    },
    close() {
      if (closed) return;
      closed = true;
      for (const controller of active) controller.abort();
      active.clear();
    },
  };
};
