import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import type { IncomingHttpHeaders } from "node:http";
import type {
  ResearchAdapter,
  ResearchFetchRequest,
  ResearchFetchResponse,
} from "./adapter.js";

const maximumFetchBytes = 40_960;
const maximumFetchDurationMs = 10_000;
const maximumRedirects = 5;
const maximumResolvedAddresses = 16;
const allowedMediaTypes = new Set([
  "application/atom+xml",
  "application/json",
  "application/ld+json",
  "application/rss+xml",
  "application/xhtml+xml",
  "application/xml",
]);

export interface BoundedHttpTransportRequest {
  readonly address: string;
  readonly deadlineUnixMs: number;
  readonly maxBytes: number;
  readonly url: URL;
}

export interface BoundedHttpTransportResponse {
  readonly body: Uint8Array;
  readonly headers: Readonly<Record<string, string | readonly string[] | undefined>>;
  readonly statusCode: number;
}

export interface BoundedHttpResearchAdapterOptions {
  readonly now?: () => number;
  readonly resolveAddresses?: (hostname: string) => Promise<readonly string[]>;
  readonly transport?: (
    request: BoundedHttpTransportRequest,
  ) => Promise<BoundedHttpTransportResponse>;
}

const stableError = (code: string): Error => new Error(code);

const ipv4Number = (address: string): number | undefined => {
  const parts = address.split(".");
  if (parts.length !== 4) return undefined;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/u.test(part)) return undefined;
    const octet = Number(part);
    if (octet > 255) return undefined;
    value = value * 256 + octet;
  }
  return value >>> 0;
};

const inIpv4Range = (value: number, base: number, prefix: number): boolean => {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (value & mask) === (base & mask);
};

const publicIpv4 = (address: string): boolean => {
  const value = ipv4Number(address);
  if (value === undefined) return false;
  const denied = [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.31.196.0", 24],
    ["192.52.193.0", 24],
    ["192.88.99.0", 24],
    ["192.168.0.0", 16],
    ["192.175.48.0", 24],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
  ] as const;
  return !denied.some(([base, prefix]) =>
    inIpv4Range(value, ipv4Number(base)!, prefix),
  );
};

const ipv6Words = (input: string): readonly number[] | undefined => {
  const address = input.toLowerCase().split("%", 1)[0] ?? "";
  if (!address || address.includes(".")) return undefined;
  if ((address.match(/::/gu) ?? []).length > 1) return undefined;
  const [left = "", right = ""] = address.split("::");
  const leftWords = left ? left.split(":") : [];
  const rightWords = right ? right.split(":") : [];
  if (
    [...leftWords, ...rightWords].some(
      (word) => !/^[a-f0-9]{1,4}$/u.test(word),
    )
  )
    return undefined;
  const omitted = 8 - leftWords.length - rightWords.length;
  if ((address.includes("::") && omitted < 1) || (!address.includes("::") && omitted !== 0))
    return undefined;
  return [
    ...leftWords.map((word) => Number.parseInt(word, 16)),
    ...Array.from({ length: omitted }, () => 0),
    ...rightWords.map((word) => Number.parseInt(word, 16)),
  ];
};

const publicIpv6 = (address: string): boolean => {
  const words = ipv6Words(address);
  if (!words || words.length !== 8) return false;
  const inRange = (base: string, prefix: number): boolean => {
    const baseWords = ipv6Words(base);
    if (!baseWords) return false;
    const completeWords = Math.floor(prefix / 16);
    for (let index = 0; index < completeWords; index += 1)
      if (words[index] !== baseWords[index]) return false;
    const remainingBits = prefix % 16;
    if (remainingBits === 0) return true;
    const mask = (0xffff << (16 - remainingBits)) & 0xffff;
    return (
      ((words[completeWords] ?? 0) & mask) ===
      ((baseWords[completeWords] ?? 0) & mask)
    );
  };
  // Only 2000::/3 global unicast is eligible, with special-purpose ranges
  // removed conservatively (IETF assignments, documentation, 6to4, and AS112).
  if (((words[0] ?? 0) & 0xe000) !== 0x2000) return false;
  return ![
    ["2001::", 23],
    ["2001:db8::", 32],
    ["2002::", 16],
    ["2620:4f:8000::", 48],
    ["3fff::", 20],
  ].some(([base, prefix]) => inRange(base as string, prefix as number));
};

export const isPublicResearchAddress = (address: string): boolean => {
  const kind = isIP(address);
  return kind === 4
    ? publicIpv4(address)
    : kind === 6
      ? publicIpv6(address)
      : false;
};

const hostname = (url: URL): string =>
  url.hostname.startsWith("[") && url.hostname.endsWith("]")
    ? url.hostname.slice(1, -1)
    : url.hostname;

const policyHostname = (url: URL): string =>
  hostname(url).toLowerCase().replace(/\.$/u, "");

const validateUrl = (value: string): URL => {
  if (Buffer.byteLength(value) > 4_096) throw stableError("FETCH_URL_INVALID");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw stableError("FETCH_URL_INVALID");
  }
  const host = policyHostname(url);
  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    (url.port !== "" && url.port !== "443") ||
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".home") ||
    host.endsWith(".arpa") ||
    host.endsWith(".onion")
  )
    throw stableError("FETCH_URL_DENIED");
  url.hash = "";
  return url;
};

const defaultResolveAddresses = async (
  host: string,
): Promise<readonly string[]> => {
  if (isIP(host)) return [host];
  const addresses = await lookup(host, { all: true, verbatim: true });
  return addresses.map(({ address }) => address);
};

const headerValue = (
  headers: Readonly<Record<string, string | readonly string[] | undefined>>,
  name: string,
): string | undefined => {
  const matches = Object.entries(headers).filter(
    ([key]) => key.toLowerCase() === name.toLowerCase(),
  );
  if (matches.length > 1) throw stableError("FETCH_RESPONSE_HEADER_INVALID");
  const value = matches[0]?.[1];
  if (Array.isArray(value)) {
    if (value.length !== 1) throw stableError("FETCH_RESPONSE_HEADER_INVALID");
    return value[0];
  }
  return typeof value === "string" ? value : undefined;
};

const defaultTransport = (
  input: BoundedHttpTransportRequest,
): Promise<BoundedHttpTransportResponse> =>
  new Promise((resolve, reject) => {
    const remainingMs = input.deadlineUnixMs - Date.now();
    if (remainingMs <= 0) {
      reject(stableError("FETCH_DEADLINE_EXCEEDED"));
      return;
    }
    let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
    const clearDeadline = () => {
      if (deadlineTimer) clearTimeout(deadlineTimer);
      deadlineTimer = undefined;
    };
    const request = httpsRequest(
      {
        family: isIP(input.address),
        headers: {
          accept:
            "text/html,text/plain,application/xhtml+xml,application/json,application/ld+json,application/xml;q=0.9,*/*;q=0.1",
          "accept-encoding": "identity",
          connection: "close",
          host: input.url.host,
          "user-agent": "Curiosity-Research/1.0",
        },
        hostname: input.address,
        method: "GET",
        maxHeaderSize: 16_384,
        path: `${input.url.pathname}${input.url.search}`,
        port: 443,
        protocol: "https:",
        rejectUnauthorized: true,
          servername: policyHostname(input.url),
      },
      (response) => {
        const chunks: Buffer[] = [];
        let bytes = 0;
        response.on("data", (chunk: Buffer | Uint8Array | string) => {
          const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          bytes += value.byteLength;
          if (bytes > input.maxBytes) {
            response.destroy(stableError("FETCH_RESPONSE_TOO_LARGE"));
            return;
          }
          chunks.push(value);
        });
        response.on("end", () => {
          clearDeadline();
          resolve({
            body: Buffer.concat(chunks),
            headers: response.headers as IncomingHttpHeaders,
            statusCode: response.statusCode ?? 0,
          });
        });
        response.on("error", (cause) => {
          clearDeadline();
          reject(cause);
        });
      },
    );
    deadlineTimer = setTimeout(() =>
      request.destroy(stableError("FETCH_DEADLINE_EXCEEDED")),
      remainingMs,
    );
    request.on("error", (cause) => {
      clearDeadline();
      reject(cause);
    });
    request.end();
  });

const validateAddresses = (addresses: readonly string[]): readonly string[] => {
  const unique = [...new Set(addresses)];
  if (
    unique.length < 1 ||
    unique.length > maximumResolvedAddresses ||
    unique.some((address) => !isPublicResearchAddress(address))
  )
    throw stableError("FETCH_ADDRESS_DENIED");
  return unique.sort();
};

const beforeDeadline = async <T>(
  promise: Promise<T>,
  deadlineUnixMs: number,
  now: () => number,
): Promise<T> => {
  const remainingMs = deadlineUnixMs - now();
  if (remainingMs <= 0) throw stableError("FETCH_DEADLINE_EXCEEDED");
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(stableError("FETCH_DEADLINE_EXCEEDED")),
          remainingMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

const mediaType = (
  headers: Readonly<Record<string, string | readonly string[] | undefined>>,
): string => {
  const encoding = headerValue(headers, "content-encoding")?.toLowerCase();
  if (encoding && encoding !== "identity")
    throw stableError("FETCH_CONTENT_ENCODING_UNSUPPORTED");
  const raw = headerValue(headers, "content-type")?.toLowerCase() ?? "";
  const [type = "", ...parameters] = raw.split(";").map((part) => part.trim());
  const charset = parameters
    .map((part) => /^charset=(.+)$/u.exec(part)?.[1]?.replace(/^"|"$/gu, ""))
    .find(Boolean);
  if (charset && charset !== "utf-8" && charset !== "utf8")
    throw stableError("FETCH_CHARSET_UNSUPPORTED");
  if (!type || (!type.startsWith("text/") && !allowedMediaTypes.has(type)))
    throw stableError("FETCH_MEDIA_TYPE_UNSUPPORTED");
  return type;
};

const decodeBody = (body: Uint8Array, maxBytes: number): string => {
  if (body.byteLength > maxBytes) throw stableError("FETCH_RESPONSE_TOO_LARGE");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    throw stableError("FETCH_BODY_NOT_UTF8");
  }
};

export const createBoundedHttpResearchAdapter = (
  options: BoundedHttpResearchAdapterOptions = {},
): ResearchAdapter => {
  const now = options.now ?? Date.now;
  const resolveAddresses = options.resolveAddresses ?? defaultResolveAddresses;
  const transport = options.transport ?? defaultTransport;
  let closed = false;

  const fetch = async (
    request: ResearchFetchRequest,
  ): Promise<ResearchFetchResponse> => {
    if (closed) throw stableError("FETCH_ADAPTER_CLOSED");
    if (
      !Number.isSafeInteger(request.deadlineUnixMs) ||
      !Number.isSafeInteger(request.maxBytes) ||
      request.maxBytes < 1 ||
      request.maxBytes > maximumFetchBytes ||
      !request.requestId
    )
      throw stableError("FETCH_REQUEST_INVALID");
    if (
      request.deadlineUnixMs <= now() ||
      request.deadlineUnixMs - now() > maximumFetchDurationMs
    )
      throw stableError("FETCH_DEADLINE_EXCEEDED");

    let current = validateUrl(request.url);
    const redirectChain: string[] = [];
    for (let redirect = 0; redirect <= maximumRedirects; redirect += 1) {
      if (request.deadlineUnixMs <= now())
        throw stableError("FETCH_DEADLINE_EXCEEDED");
      let addresses: readonly string[];
      try {
        addresses = validateAddresses(
          await beforeDeadline(
            resolveAddresses(policyHostname(current)),
            request.deadlineUnixMs,
            now,
          ),
        );
      } catch (cause) {
        if (cause instanceof Error && cause.message.startsWith("FETCH_"))
          throw cause;
        throw stableError("FETCH_DNS_FAILED");
      }
      const response = await beforeDeadline(
        transport({
          address: addresses[0]!,
          deadlineUnixMs: request.deadlineUnixMs,
          maxBytes: request.maxBytes,
          url: current,
        }),
        request.deadlineUnixMs,
        now,
      );
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        if (redirect === maximumRedirects)
          throw stableError("FETCH_REDIRECT_LIMIT_EXCEEDED");
        const location = headerValue(response.headers, "location");
        if (!location) throw stableError("FETCH_REDIRECT_INVALID");
        try {
          current = validateUrl(new URL(location, current).toString());
        } catch (cause) {
          if (cause instanceof Error && cause.message.startsWith("FETCH_"))
            throw cause;
          throw stableError("FETCH_REDIRECT_INVALID");
        }
        redirectChain.push(current.toString());
        continue;
      }
      if (response.statusCode < 200 || response.statusCode > 299)
        throw stableError("FETCH_HTTP_STATUS_REJECTED");
      const contentLength = headerValue(response.headers, "content-length");
      if (
        contentLength !== undefined &&
        (!/^\d+$/u.test(contentLength) || Number(contentLength) > request.maxBytes)
      )
        throw stableError("FETCH_RESPONSE_TOO_LARGE");
      const type = mediaType(response.headers);
      const body = decodeBody(response.body, request.maxBytes);
      return {
        body,
        canonicalUrl: current.toString(),
        mediaType: type,
        redirectChain,
        retrievedAt: new Date(now()).toISOString(),
        statusCode: response.statusCode,
      };
    }
    throw stableError("FETCH_REDIRECT_LIMIT_EXCEEDED");
  };

  return Object.freeze({
    close: () => {
      closed = true;
    },
    fetch,
    receipt: Object.freeze({
      adapterId: "curiosity-bounded-http",
      adapterVersion: "1.0.0",
      capabilities: ["network.fetch"] as const,
      securityProfile: "bounded-http-v1" as const,
    }),
  });
};
