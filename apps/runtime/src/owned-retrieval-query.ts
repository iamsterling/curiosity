import { isAbsolute, resolve } from "node:path";
import {
  AuthorizedMcpReceiptAdapter,
  createRetrieveInformationV3,
  DevelopmentMemoryV3Adapter,
  OwnedWebSnapshotAdapter,
  type OwnedSnapshotPort,
  type RetrieveInformationV3Report,
} from "./retrieval/v3/retrieve-information-v3.js";

const operation = "retrieve_information";
const maximumDeadlineAheadMs = 60_000;

export type OwnedRetrievalPrincipal = {
  readonly operation: typeof operation;
  readonly queryCapability: Uint8Array;
  readonly role: "researcher";
  readonly workspaceScope: string;
};

export type OwnedRetrievalQueryRequest = {
  readonly deadlineUnixMs: number;
  readonly maxResults: number;
  readonly query: string;
  readonly requestId: string;
};

export type OwnedRetrievalQueryResult =
  | {
      readonly partial: boolean;
      readonly projectionSnapshotRef: string;
      readonly queriedAt: string;
      readonly residualUncertainty: readonly string[];
      readonly results: readonly {
        readonly canonicalUrl: string;
        readonly snippet: string;
        readonly title: string;
      }[];
      readonly snapshotRef: string;
      readonly status: "ok";
      readonly stoppingReason: string;
    }
  | {
      readonly diagnostic: {
        readonly code:
          | "authority_rejected"
          | "invalid_request"
          | "retrieval_unavailable"
          | "runtime_closed"
          | "runtime_failure";
      };
      readonly status: "rejected";
    };

type OwnedRetrievalDiagnosticCode =
  Extract<OwnedRetrievalQueryResult, { status: "rejected" }>[
    "diagnostic"
  ]["code"];

export type OwnedRetrievalQueryRuntimeOptions = {
  readonly mode: "owned-retrieval-v3";
  readonly now?: () => number;
  readonly ownedSnapshot: OwnedSnapshotPort;
  readonly queryCapability: Uint8Array;
  readonly workspaceScope: string;
};

export type OwnedRetrievalQueryRuntime = {
  readonly close: () => void;
  readonly retrieveInformation: (
    request: unknown,
    principal: unknown,
  ) => Promise<OwnedRetrievalQueryResult>;
};

export type { OwnedSnapshotPort, OwnedSnapshotResult } from "./retrieval/v3/retrieve-information-v3.js";

const rejection = (
  code: OwnedRetrievalDiagnosticCode,
): OwnedRetrievalQueryResult => ({ diagnostic: { code }, status: "rejected" });

const validCapability = (value: unknown): value is Uint8Array =>
  value instanceof Uint8Array && value.byteLength > 0 && value.byteLength <= 256;

const sameCapability = (left: Uint8Array, right: Uint8Array): boolean => {
  if (left.byteLength !== right.byteLength) return false;
  let difference = 0;
  for (let index = 0; index < left.byteLength; index += 1)
    difference |= left[index]! ^ right[index]!;
  return difference === 0;
};

const canonicalAbsolutePath = (value: unknown): value is string =>
  typeof value === "string" &&
  Buffer.byteLength(value) <= 4_096 &&
  isAbsolute(value) &&
  resolve(value) === value;

const ownDataRecord = (
  value: unknown,
  fields: readonly string[],
): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return undefined;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(descriptors);
  if (
    keys.length !== fields.length ||
    keys.some((key) => typeof key !== "string" || !fields.includes(key)) ||
    Object.values(descriptors).some(
      (descriptor) => !("value" in descriptor) || !descriptor.enumerable,
    )
  )
    return undefined;
  return Object.fromEntries(
    Object.entries(descriptors).map(([key, descriptor]) => [
      key,
      (descriptor as PropertyDescriptor & { value: unknown }).value,
    ]),
  );
};

const validPrincipal = (
  value: unknown,
  workspaceScope: string,
  queryCapability: Uint8Array,
): boolean => {
  const principal = ownDataRecord(value, [
    "operation",
    "queryCapability",
    "role",
    "workspaceScope",
  ]);
  return !!principal &&
    principal.operation === operation &&
    principal.role === "researcher" &&
    principal.workspaceScope === workspaceScope &&
    validCapability(principal.queryCapability) &&
    sameCapability(principal.queryCapability, queryCapability);
};

const validRequest = (
  value: unknown,
  now: number,
): OwnedRetrievalQueryRequest | undefined => {
  const request = ownDataRecord(value, [
    "deadlineUnixMs",
    "maxResults",
    "query",
    "requestId",
  ]);
  if (
    !request ||
    typeof request.query !== "string" ||
    request.query.trim().length === 0 ||
    request.query.length > 1_024 ||
    Buffer.byteLength(request.query) > 2_000 ||
    typeof request.requestId !== "string" ||
    !/^[A-Za-z0-9._:-]{1,128}$/u.test(request.requestId) ||
    typeof request.maxResults !== "number" ||
    !Number.isSafeInteger(request.maxResults) ||
    request.maxResults < 1 ||
    request.maxResults > 10 ||
    typeof request.deadlineUnixMs !== "number" ||
    !Number.isSafeInteger(request.deadlineUnixMs) ||
    request.deadlineUnixMs <= now ||
    request.deadlineUnixMs - now > maximumDeadlineAheadMs
  )
    return undefined;
  return request as OwnedRetrievalQueryRequest;
};

const projectReport = (
  report: RetrieveInformationV3Report,
  snapshotRef: string,
  projectionSnapshotRef: string,
): OwnedRetrievalQueryResult => {
  if (report.status === "DENIED") return rejection("authority_rejected");
  if (
    report.stoppingReason !== "DECLARED_LEGS_COMPLETED" ||
    report.legs.length !== 1 ||
    report.legs[0]?.projectionSnapshotRef !== projectionSnapshotRef
  )
    return rejection("retrieval_unavailable");
  const items = report.strata.flatMap(({ items }) => items);
  if (items.some(({ recordKind }) => recordKind !== "custodied-evidence"))
    return rejection("runtime_failure");
  return {
    partial: report.partial,
    projectionSnapshotRef,
    queriedAt: report.asOf,
    residualUncertainty: report.residualUncertainty,
    results: items.map((item) => ({
      canonicalUrl: item.sourceLocator,
      snippet: item.excerpt,
      title: item.title,
    })),
    snapshotRef,
    status: "ok",
    stoppingReason: report.stoppingReason,
  };
};

export const createOwnedRetrievalQueryRuntime = (
  options: OwnedRetrievalQueryRuntimeOptions,
): OwnedRetrievalQueryRuntime => {
  if (
    options.mode !== "owned-retrieval-v3" ||
    !canonicalAbsolutePath(options.workspaceScope) ||
    !validCapability(options.queryCapability) ||
    !options.ownedSnapshot ||
    typeof options.ownedSnapshot.search !== "function"
  )
    throw new Error("QUERY_RUNTIME_CONFIG_INVALID");
  const queryCapability = options.queryCapability.slice();
  const now = options.now ?? Date.now;
  let closed = false;

  return Object.freeze({
    close: () => {
      closed = true;
    },
    retrieveInformation: async (
      input: unknown,
      principal: unknown,
    ): Promise<OwnedRetrievalQueryResult> => {
      if (closed) return rejection("runtime_closed");
      let startedAt: number;
      try {
        startedAt = now();
      } catch {
        return rejection("runtime_failure");
      }
      if (!Number.isSafeInteger(startedAt)) return rejection("runtime_failure");
      const request = validRequest(input, startedAt);
      if (!request) return rejection("invalid_request");
      const authorized = () =>
        !closed &&
        validPrincipal(principal, options.workspaceScope, queryCapability);
      if (!authorized()) return rejection("authority_rejected");

      const snapshotRef = options.ownedSnapshot.snapshotRef;
      const projectionSnapshotRef =
        options.ownedSnapshot.projectionSnapshotRef;
      const scopedSnapshot: OwnedSnapshotPort = {
        declaredCoverage: options.ownedSnapshot.declaredCoverage,
        projectionSnapshotRef,
        search: (request) => options.ownedSnapshot.search(request),
        snapshotRef,
      };
      const retrieve = createRetrieveInformationV3({
        authority: {
          authorize: async () => ({
            authorityRef: "authority:query-runtime:owned-retrieval-v3",
            decision: authorized() ? ("ALLOW" as const) : ("DENY" as const),
            policyVersion: "query-runtime-owned-retrieval-v1",
          }),
          revalidateDelivery: async () => ({
            decision: authorized() ? ("ALLOW" as const) : ("DENY" as const),
          }),
        },
        memory: new DevelopmentMemoryV3Adapter([]),
        mcp: new AuthorizedMcpReceiptAdapter(undefined),
        now: () => new Date(now()).toISOString(),
        owned: new OwnedWebSnapshotAdapter(scopedSnapshot),
      });
      try {
        const report = await retrieve({
          authenticatedContextRef: "auth:query-runtime:researcher",
          budget: {
            deadlineUnixMs: request.deadlineUnixMs,
            maxLegs: 1,
            maxNodes: 512,
            maxResults: request.maxResults,
            maxUtf8Bytes: 48 * 1_024,
          },
          contract: "curiosity.retrieval/retrieve-information-request/v3",
          knownAsOf: new Date(startedAt).toISOString(),
          legs: [
            {
              legId: "owned-query-runtime",
              maxResults: request.maxResults,
              mode: "INDEXED",
              obligation: "REQUIRED",
              surfaceRef: "surface:owned-web:v1",
            },
          ],
          objective: { question: request.query },
          profile: "OWNED_WEB",
          purpose: "read-only-owned-retrieval",
          requestId: request.requestId,
          schemaVersion: 3,
          validAsOf: null,
        });
        return projectReport(report, snapshotRef, projectionSnapshotRef);
      } catch {
        return rejection("runtime_failure");
      }
    },
  });
};
