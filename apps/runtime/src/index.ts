import { dlopen, FFIType, ptr, suffix } from "bun:ffi";
import { isAbsolute, relative, resolve } from "node:path";
import {
  createSearxngGatewayAdapter,
  ProviderFailure,
  type RepositoryTransport,
} from "./repository-search.js";

export { isGlobalUnicastAddress, resolvePinnedAddresses, SEARXNG_GATEWAY_ENDPOINT, SPECIAL_PURPOSE_CIDRS } from "./repository-search.js";
export type { RepositorySearch, RepositoryTransport, RepositoryTransportCall, RepositoryTransportResponse } from "./repository-search.js";

const API_VERSION = "curiosity.runtime/v0";
const OPERATION = "web_search";
const ALLOWED_FIELDS = new Set(["apiVersion", "operation", "requestId", "query", "maxResults", "deadlineUnixMs", "source"]);

type DiagnosticCode =
  | "invalid_request"
  | "unsupported_version"
  | "unsupported_operation"
  | "deadline_expired"
  | "limit_exceeded"
  | "runtime_busy"
  | "runtime_failure"
  | "authority_denied"
  | "corpus_corrupt"
  | "projection_corrupt"
  | "provider_auth_rejected"
  | "provider_rate_limited"
  | "provider_redirect_rejected"
  | "provider_response_invalid"
  | "provider_response_too_large"
  | "provider_unavailable";

const DIAGNOSTICS: Record<DiagnosticCode, string> = {
  invalid_request: "The request is invalid.",
  unsupported_version: "The API version is unsupported.",
  unsupported_operation: "The operation is unsupported.",
  deadline_expired: "The request deadline has expired.",
  limit_exceeded: "A request limit was exceeded.",
  runtime_busy: "The runtime is at capacity.",
  runtime_failure: "The runtime failed.",
  authority_denied: "Corpus query authority was denied.",
  corpus_corrupt: "The configured corpus failed integrity checks.",
  projection_corrupt: "The corpus projection failed integrity checks.",
  provider_auth_rejected: "The repository provider rejected authentication.",
  provider_rate_limited: "The repository provider is at capacity.",
  provider_redirect_rejected: "The repository provider redirect was rejected.",
  provider_response_invalid: "The repository provider response is invalid.",
  provider_response_too_large: "The repository provider response exceeded its limit.",
  provider_unavailable: "The repository provider is unavailable.",
};

export type PrincipalEnvelope = {
  readonly role: string;
  readonly workspaceScope: string;
  readonly operation: string;
  readonly queryCapability: QueryCapability;
};

const STATUS_CODES: Record<number, DiagnosticCode | "corpus_absent"> = {
  0: "corpus_absent",
  1: "invalid_request",
  2: "unsupported_version",
  3: "unsupported_operation",
  4: "deadline_expired",
  5: "limit_exceeded",
  6: "runtime_busy",
  7: "runtime_failure",
};

type RuntimeRequest = {
  apiVersion: string;
  operation: string;
  requestId: string;
  query: string;
  maxResults: number;
  deadlineUnixMs: number;
  source: "local" | "searxng-gateway";
};

export type QueryCapability = Uint8Array;
export type AdminCapability = Uint8Array;
const validCapability = (value: Uint8Array | undefined): value is Uint8Array => value instanceof Uint8Array && value.byteLength > 0 && value.byteLength <= 256;

const rejected = (code: DiagnosticCode) => ({
  status: "rejected" as const,
  diagnostic: { code, message: DIAGNOSTICS[code] },
});

const validate = (input: unknown, now: number): RuntimeRequest | DiagnosticCode => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return "invalid_request";
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return "invalid_request";
  const descriptors = Object.getOwnPropertyDescriptors(input);
  const keys = Reflect.ownKeys(descriptors);
  if (keys.some((key) => typeof key !== "string" || !ALLOWED_FIELDS.has(key))) return "invalid_request";
  if (Object.values(descriptors).some((descriptor) => !("value" in descriptor))) return "invalid_request";
  const request = input as Record<string, unknown>;
  if (
    typeof request.apiVersion !== "string" ||
    typeof request.operation !== "string" ||
    typeof request.requestId !== "string" ||
    typeof request.query !== "string" ||
    ("maxResults" in request && typeof request.maxResults !== "number") ||
    ("source" in request && request.source !== undefined && typeof request.source !== "string") ||
    typeof request.deadlineUnixMs !== "number"
  ) return "invalid_request";
  if (request.apiVersion !== API_VERSION) return "unsupported_version";
  if (request.operation !== OPERATION) return "unsupported_operation";
  if (request.source !== undefined && request.source !== "local" && request.source !== "searxng-gateway") return "invalid_request";
  if (!/^[A-Za-z0-9._:-]{1,64}$/.test(request.requestId)) return "invalid_request";
  if (request.query.length > 500 || Buffer.byteLength(request.query) > 2_000) return "limit_exceeded";
  if (request.query.trim().length === 0) return "invalid_request";
  const maxResults = request.maxResults === undefined ? 5 : request.maxResults;
  if (typeof maxResults !== "number" || !Number.isInteger(maxResults)) return "invalid_request";
  if (maxResults < 1 || maxResults > 10) return "limit_exceeded";
  if (!Number.isSafeInteger(request.deadlineUnixMs) || !Number.isSafeInteger(now)) return "invalid_request";
  if (request.deadlineUnixMs <= now) return "deadline_expired";
  if (request.deadlineUnixMs - now > 15_000) return "limit_exceeded";
  return {
    apiVersion: request.apiVersion,
    operation: request.operation,
    requestId: request.requestId,
    query: request.query,
    maxResults,
    deadlineUnixMs: request.deadlineUnixMs,
    source: (request.source ?? "local") as "local" | "searxng-gateway",
  };
};

const nativeLibraryPath = (profile: "development" | "release") => profile === "release"
  ? `${import.meta.dir}/../native/libcuriosity_runtime_native.${suffix}`
  : `${import.meta.dir}/../native/target/debug/libcuriosity_runtime_native.${suffix}`;

export type RuntimeOptions = {
  now?: () => number;
  libraryPath?: string;
  /** Required unless libraryPath is supplied; release never probes a development build. */
  nativeProfile?: "development" | "release";
  stateRoot?: string;
  queryCapability?: QueryCapability;
  repository?: { readonly source: "searxng-gateway"; readonly bearerToken: string };
  /** Deterministic test/embedding seam. Production uses the pinned HTTPS transport. */
  repositoryTransport?: RepositoryTransport;
};

export type QueryRuntimeOptions = RuntimeOptions & {
  readonly stateRoot: string;
  readonly workspaceScope: string;
  readonly queryCapability: QueryCapability;
};

export type QueryRuntime = {
  webSearch(input: unknown, principal: unknown): Promise<unknown> | unknown;
  close(): void;
};

const validAbsolutePath = (value: string) => isAbsolute(value) && resolve(value) === value && Buffer.byteLength(value) <= 4_096;

const validStateRoot = (stateRoot: string) => {
  if (!validAbsolutePath(stateRoot)) return false;
  const sourceRoot = resolve(import.meta.dir, "..");
  const distance = relative(sourceRoot, stateRoot);
  return distance.startsWith("..") && !isAbsolute(distance);
};
const validWorkspaceScope = validAbsolutePath;

const openLibrary = (options: Pick<RuntimeOptions, "libraryPath" | "nativeProfile">) => {
  const configuredProfile = options.nativeProfile;
  if (!options.libraryPath && configuredProfile !== "development" && configuredProfile !== "release") {
    throw new Error("QUERY_RUNTIME_NATIVE_PROFILE_REQUIRED");
  }
  const libraryPath = options.libraryPath ?? nativeLibraryPath(configuredProfile as "development" | "release");
  return dlopen(libraryPath, {
  curiosity_runtime_v0_web_search: {
    args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.i32, FFIType.i64, FFIType.i64],
    returns: FFIType.i32,
  },
  curiosity_runtime_v1_corpus_query: {
    args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u64],
    returns: FFIType.i32,
  },
  });
};

const openAdminLibrary = (options: Pick<RuntimeOptions, "libraryPath" | "nativeProfile">) => {
  const configuredProfile = options.nativeProfile;
  if (!options.libraryPath && configuredProfile !== "development") throw new Error("QUERY_RUNTIME_ADMIN_DEVELOPMENT_ONLY");
  return dlopen(options.libraryPath ?? nativeLibraryPath("development"), {
    curiosity_runtime_v1_corpus_admin: {
      args: [FFIType.i32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64],
      returns: FFIType.i32,
    },
  });
};

export const createRuntime = (options: RuntimeOptions = {}) => {
  const repository = options.repository
    ? createSearxngGatewayAdapter({
        bearerToken: options.repository.bearerToken,
        ...(options.repositoryTransport ? { transport: options.repositoryTransport } : {}),
        ...(options.now ? { now: options.now } : {}),
      })
    : undefined;
  const library = openLibrary(options);
  const corpusConfigured = typeof options.stateRoot === "string" && validStateRoot(options.stateRoot) && validCapability(options.queryCapability);
  let closed = false;

  return {
    async webSearch(input: unknown): Promise<any> {
      if (closed) return rejected("runtime_failure");
      let now: number;
      try {
        now = (options.now ?? Date.now)();
      } catch {
        return rejected("runtime_failure");
      }
      let request: RuntimeRequest | DiagnosticCode;
      try {
        request = validate(input, now);
      } catch {
        return rejected("invalid_request");
      }
      if (typeof request === "string") return rejected(request);
      if (request.source === "searxng-gateway") {
        if (!repository || options.repository?.source !== "searxng-gateway") return rejected("provider_unavailable");
        try {
          const outcome = await repository.search(request);
          if (closed) return rejected("runtime_failure");
          return {
            apiVersion: API_VERSION,
            operation: OPERATION,
            requestId: request.requestId,
            status: "ok" as const,
            results: outcome.results,
            partialFailures: outcome.partialFailures,
          };
        } catch (error) {
          if (error instanceof ProviderFailure) return rejected(error.code);
          return rejected("provider_unavailable");
        }
      }
      const values = [request.apiVersion, request.operation, request.requestId, request.query].map((value) => Buffer.from(value));
      try {
        const nativeStatus = library.symbols.curiosity_runtime_v0_web_search(
          ptr(values[0]!), values[0]!.length,
          ptr(values[1]!), values[1]!.length,
          ptr(values[2]!), values[2]!.length,
          ptr(values[3]!), values[3]!.length,
          request.maxResults, BigInt(request.deadlineUnixMs), BigInt(now),
        );
        const code = STATUS_CODES[nativeStatus] ?? "runtime_failure";
        if (code !== "corpus_absent") return rejected(code);
          if (corpusConfigured) {
            const root = Buffer.from(options.stateRoot!);
            const capability = Buffer.from(options.queryCapability!);
            const query = values[3]!;
            const output = Buffer.alloc(32_768);
            const length = library.symbols.curiosity_runtime_v1_corpus_query(ptr(root), root.length, ptr(capability), capability.length, ptr(query), query.length, request.maxResults, ptr(output), output.length);
          if (length >= 0) {
            const payload = JSON.parse(output.subarray(0, length).toString("utf8")) as { results: unknown[] };
            return { apiVersion: API_VERSION, operation: OPERATION, requestId: request.requestId, status: "ok" as const, results: payload.results };
          }
          const corpusStatus = -length - 1;
           if (corpusStatus === 2) return rejected("authority_denied");
           if (corpusStatus === 4) return rejected("corpus_corrupt");
          if (corpusStatus === 8) return rejected("projection_corrupt");
          if (corpusStatus !== 3) return rejected("runtime_failure");
        }
        return {
          apiVersion: API_VERSION,
          operation: OPERATION,
          requestId: request.requestId,
          status: "unavailable" as const,
          diagnostic: { code: "corpus_absent" as const, message: "No corpus is available." },
          results: [],
        };
      } catch {
        return rejected("runtime_failure");
      }
    },
    close() {
      if (closed) return;
      closed = true;
      repository?.close();
      try {
        library.close();
      } catch {
        // Closing is idempotent and cannot expose native diagnostics.
      }
    },
  };
};

const ADMIN_ACTIONS = { initialize: 0, importFixture: 1, activate: 2, withdraw: 3, delete: 4, rebuild: 5 } as const;

export const createCorpusAdmin = (options: { stateRoot: string; adminCapability: AdminCapability; libraryPath?: string; nativeProfile?: "development" | "release" }) => {
  const authorized = validCapability(options.adminCapability) && validStateRoot(options.stateRoot);
  const library = openAdminLibrary(options);
  let closed = false;
  const invoke = (action: keyof typeof ADMIN_ACTIONS, fixtureRoot?: string) => {
    if (closed || !authorized || (fixtureRoot !== undefined && !isAbsolute(fixtureRoot))) return rejected("runtime_failure");
    const root = Buffer.from(options.stateRoot);
    const capability = Buffer.from(options.adminCapability);
    const fixture = Buffer.from(fixtureRoot ?? "");
    const status = library.symbols.curiosity_runtime_v1_corpus_admin(ADMIN_ACTIONS[action], ptr(root), root.length, ptr(capability), capability.length, fixture.length ? ptr(fixture) : null, fixture.length);
    if (status !== 0) return { status: "rejected" as const, diagnostic: { code: "runtime_failure" as const, message: DIAGNOSTICS.runtime_failure } };
    return { status: "ok" as const };
  };
  return {
    initialize: () => invoke("initialize"),
    importFixture: (fixtureRoot: string) => invoke("importFixture", fixtureRoot),
    activate: () => invoke("activate"),
    withdraw: () => invoke("withdraw"),
    delete: () => invoke("delete"),
    rebuild: () => invoke("rebuild"),
    close: () => { if (!closed) { closed = true; library.close(); } },
  };
};

export const runtimeCapabilities = (options: { stateRoot?: string; queryCapability?: QueryCapability; repository?: { source: "searxng-gateway" } } = {}) => ({
  apiVersions: [API_VERSION],
  operations: [OPERATION],
  limits: { maxQueryUtf16: 500, maxQueryUtf8: 2_000, maxResults: 10, maxDeadlineAheadMs: 15_000, maxConcurrency: 8 },
  network: options.repository?.source === "searxng-gateway",
  corpus: !!options.stateRoot && validStateRoot(options.stateRoot) && validCapability(options.queryCapability),
  persistence: !!options.stateRoot && validStateRoot(options.stateRoot) && validCapability(options.queryCapability),
});

const sameCapability = (left: Uint8Array, right: Uint8Array): boolean => {
  if (left.byteLength !== right.byteLength) return false;
  let difference = 0;
  for (let index = 0; index < left.byteLength; index += 1) difference |= left[index]! ^ right[index]!;
  return difference === 0;
};

const authorizedPrincipal = (
  value: unknown,
  workspaceScope: string,
  queryCapability: QueryCapability,
): value is PrincipalEnvelope => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (Reflect.ownKeys(candidate).some((key) => !["role", "workspaceScope", "operation", "queryCapability"].includes(String(key)))) return false;
  return candidate.role === "researcher" &&
    candidate.workspaceScope === workspaceScope &&
    candidate.operation === OPERATION &&
    candidate.queryCapability instanceof Uint8Array &&
    validCapability(candidate.queryCapability) &&
    sameCapability(candidate.queryCapability, queryCapability);
};

export const createQueryRuntime = (options: QueryRuntimeOptions) => {
  if (!validCapability(options.queryCapability) || !validStateRoot(options.stateRoot ?? "") || !validWorkspaceScope(options.workspaceScope)) throw new Error("QUERY_RUNTIME_CONFIG_INVALID");
  const queryCapability = options.queryCapability;
  const runtime = createRuntime(options);
  return {
    async webSearch(input: unknown, principal: unknown): Promise<any> {
      if (!authorizedPrincipal(principal, options.workspaceScope, queryCapability)) {
        return { status: "rejected" as const, diagnostic: { code: "authority_rejected" as const, message: "Query authority was rejected." } };
      }
      return await runtime.webSearch(input);
    },
    close: () => runtime.close(),
  };
};

export const queryRuntimeCapabilities = runtimeCapabilities;
