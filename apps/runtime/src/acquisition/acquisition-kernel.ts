export type DiscoveryKind = "SEED" | "SITEMAP" | "FEED" | "LINK";
export type AcquisitionEvent =
  | {
      readonly eventId: string;
      readonly type: "CORPUS_CELL_REGISTERED";
      readonly cellRef: string;
      readonly policyRef: string;
    }
  | {
      readonly eventId: string;
      readonly type: "URL_DISCOVERED";
      readonly urlRef: string;
      readonly discovery: DiscoveryKind;
      readonly parentUrlRef: string | null;
    }
  | {
      readonly eventId: string;
      readonly type: "ROBOTS_DECIDED";
      readonly urlRef: string;
      readonly decision: "ALLOW" | "DENY";
      readonly policyRef: string;
    }
  | {
      readonly eventId: string;
      readonly type: "FRONTIER_SCHEDULED";
      readonly urlRef: string;
      readonly notBeforeUnixMs: number;
      readonly politenessKey: string;
    }
  | {
      readonly eventId: string;
      readonly type: "FETCH_STARTED";
      readonly urlRef: string;
      readonly attemptRef: string;
    }
  | {
      readonly eventId: string;
      readonly type: "FETCH_SETTLED";
      readonly attemptRef: string;
      readonly outcome: "CAPTURE_CANDIDATE" | "NOT_MODIFIED" | "FAILED";
      readonly byteDigest: string | null;
    }
  | {
      readonly eventId: string;
      readonly type: "CAPTURE_COMMITTED";
      readonly attemptRef: string;
      readonly captureRef: string;
      readonly receiptRef: string;
    }
  | {
      readonly eventId: string;
      readonly type: "TOMBSTONED";
      readonly captureRef: string;
      readonly tombstoneRef: string;
    }
  | {
      readonly eventId: string;
      readonly type: "PROJECTION_MANIFESTED";
      readonly captureRef: string;
      readonly manifestRef: string;
    };

export interface AcquisitionState {
  readonly corpusCell: {
    readonly cellRef: string;
    readonly policyRef: string;
  } | null;
  readonly urls: Readonly<
    Record<
      string,
      {
        readonly discovery: DiscoveryKind;
        readonly parentUrlRef: string | null;
        readonly robots?: "ALLOW" | "DENY";
        readonly frontier?: {
          readonly notBeforeUnixMs: number;
          readonly politenessKey: string;
        };
      }
    >
  >;
  readonly attempts: Readonly<
    Record<
      string,
      {
        readonly urlRef: string;
        readonly state: "STARTED" | "SETTLED";
        readonly outcome?: "CAPTURE_CANDIDATE" | "NOT_MODIFIED" | "FAILED";
        readonly byteDigest?: string | null;
      }
    >
  >;
  readonly captures: Readonly<
    Record<
      string,
      {
        readonly attemptRef: string;
        readonly receiptRef: string;
        readonly projectionManifestRef?: string;
        readonly tombstoneRef?: string;
      }
    >
  >;
  readonly appliedEvents: Readonly<Record<string, string>>;
}

export interface RobotsPolicyPort {
  decide(input: {
    readonly cellRef: string;
    readonly urlRef: string;
    readonly policyRef: string;
  }): Promise<"ALLOW" | "DENY">;
}
export interface PolitenessPort {
  schedule(input: {
    readonly urlRef: string;
    readonly politenessKey: string;
    readonly earliestUnixMs: number;
  }): Promise<number>;
}
/** The kernel never invokes this port; an authorized outer driver may produce FETCH_* events. */
export interface FetchAttemptPort {
  acquire(input: {
    readonly urlRef: string;
    readonly attemptRef: string;
  }): Promise<never>;
}
export interface CaptureCommitPort {
  commit(input: {
    readonly attemptRef: string;
    readonly byteDigest: string;
  }): Promise<{ readonly captureRef: string; readonly receiptRef: string }>;
}
export interface ProjectionManifestPort {
  manifest(input: {
    readonly captureRef: string;
  }): Promise<{ readonly manifestRef: string }>;
}

export const initialAcquisitionState = (): AcquisitionState => ({
  corpusCell: null,
  urls: {},
  attempts: {},
  captures: {},
  appliedEvents: {},
});
const invalid = (code = "ACQUISITION_EVENT_INVALID"): never => {
  throw new Error(code);
};
const validRef = (value: unknown): string => {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    Buffer.byteLength(value) > 128 ||
    !/^[A-Za-z0-9][A-Za-z0-9:._/-]*$/u.test(value)
  )
    return invalid();
  return value;
};
const safeRecord = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return invalid();
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return invalid();
  const descriptors = Object.getOwnPropertyDescriptors(input);
  for (const key of Reflect.ownKeys(descriptors)) {
    if (
      typeof key !== "string" ||
      ["__proto__", "prototype", "constructor", "toJSON"].includes(key)
    )
      return invalid();
    const descriptor = descriptors[key]!;
    if (descriptor.get !== undefined || descriptor.set !== undefined)
      return invalid();
  }
  return input as Record<string, unknown>;
};
const exact = (
  value: Record<string, unknown>,
  keys: readonly string[],
): void => {
  if (
    Reflect.ownKeys(value).some(
      (key) => typeof key !== "string" || !keys.includes(key),
    )
  )
    invalid("ACQUISITION_EVENT_UNKNOWN_FIELD");
  if (keys.some((key) => !Object.hasOwn(value, key))) invalid();
};
const common = <T extends AcquisitionEvent["type"]>(
  value: Record<string, unknown>,
  type: T,
): { eventId: string; type: T } => ({ eventId: validRef(value.eventId), type });

export const decodeAcquisitionEvent = (input: unknown): AcquisitionEvent => {
  const value = safeRecord(input);
  const type = value.type;
  if (typeof type !== "string") return invalid();
  switch (type) {
    case "CORPUS_CELL_REGISTERED":
      exact(value, ["eventId", "type", "cellRef", "policyRef"]);
      return {
        ...common(value, type),
        cellRef: validRef(value.cellRef),
        policyRef: validRef(value.policyRef),
      };
    case "URL_DISCOVERED": {
      exact(value, ["eventId", "type", "urlRef", "discovery", "parentUrlRef"]);
      if (
        !["SEED", "SITEMAP", "FEED", "LINK"].includes(
          String(value.discovery),
        ) ||
        (value.parentUrlRef !== null && typeof value.parentUrlRef !== "string")
      )
        return invalid();
      return {
        ...common(value, type),
        urlRef: validRef(value.urlRef),
        discovery: value.discovery as DiscoveryKind,
        parentUrlRef:
          value.parentUrlRef === null ? null : validRef(value.parentUrlRef),
      };
    }
    case "ROBOTS_DECIDED":
      exact(value, ["eventId", "type", "urlRef", "decision", "policyRef"]);
      if (!["ALLOW", "DENY"].includes(String(value.decision))) return invalid();
      return {
        ...common(value, type),
        urlRef: validRef(value.urlRef),
        decision: value.decision as "ALLOW" | "DENY",
        policyRef: validRef(value.policyRef),
      };
    case "FRONTIER_SCHEDULED":
      exact(value, [
        "eventId",
        "type",
        "urlRef",
        "notBeforeUnixMs",
        "politenessKey",
      ]);
      if (
        !Number.isSafeInteger(value.notBeforeUnixMs) ||
        (value.notBeforeUnixMs as number) < 0
      )
        return invalid();
      return {
        ...common(value, type),
        urlRef: validRef(value.urlRef),
        notBeforeUnixMs: value.notBeforeUnixMs as number,
        politenessKey: validRef(value.politenessKey),
      };
    case "FETCH_STARTED":
      exact(value, ["eventId", "type", "urlRef", "attemptRef"]);
      return {
        ...common(value, type),
        urlRef: validRef(value.urlRef),
        attemptRef: validRef(value.attemptRef),
      };
    case "FETCH_SETTLED": {
      exact(value, ["eventId", "type", "attemptRef", "outcome", "byteDigest"]);
      if (
        !["CAPTURE_CANDIDATE", "NOT_MODIFIED", "FAILED"].includes(
          String(value.outcome),
        ) ||
        (value.byteDigest !== null &&
          (typeof value.byteDigest !== "string" ||
            !/^sha256:[a-f0-9]{64}$/u.test(value.byteDigest)))
      )
        return invalid();
      return {
        ...common(value, type),
        attemptRef: validRef(value.attemptRef),
        outcome: value.outcome as
          "CAPTURE_CANDIDATE" | "NOT_MODIFIED" | "FAILED",
        byteDigest: value.byteDigest as string | null,
      };
    }
    case "CAPTURE_COMMITTED":
      exact(value, [
        "eventId",
        "type",
        "attemptRef",
        "captureRef",
        "receiptRef",
      ]);
      return {
        ...common(value, type),
        attemptRef: validRef(value.attemptRef),
        captureRef: validRef(value.captureRef),
        receiptRef: validRef(value.receiptRef),
      };
    case "TOMBSTONED":
      exact(value, ["eventId", "type", "captureRef", "tombstoneRef"]);
      return {
        ...common(value, type),
        captureRef: validRef(value.captureRef),
        tombstoneRef: validRef(value.tombstoneRef),
      };
    case "PROJECTION_MANIFESTED":
      exact(value, ["eventId", "type", "captureRef", "manifestRef"]);
      return {
        ...common(value, type),
        captureRef: validRef(value.captureRef),
        manifestRef: validRef(value.manifestRef),
      };
    default:
      return invalid();
  }
};

const canonical = (value: unknown): string =>
  value && typeof value === "object"
    ? `{${Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
        .join(",")}}`
    : JSON.stringify(value);
const transitionInvalid = (): never => {
  throw new Error("ACQUISITION_TRANSITION_INVALID");
};
const identityCollision = (): never => {
  throw new Error("ACQUISITION_IDENTITY_COLLISION");
};

export const applyAcquisitionEvent = (
  state: AcquisitionState,
  input: AcquisitionEvent | Record<string, unknown>,
): {
  readonly status: "APPLIED" | "DUPLICATE";
  readonly state: AcquisitionState;
} => {
  const event = decodeAcquisitionEvent(input);
  const encoded = canonical(event);
  const previous = state.appliedEvents[event.eventId];
  if (previous !== undefined) {
    if (previous !== encoded) throw new Error("ACQUISITION_EVENT_COLLISION");
    return { status: "DUPLICATE", state };
  }
  const next = structuredClone(state);
  const mutable = next as {
    corpusCell: AcquisitionState["corpusCell"];
    urls: Record<string, any>;
    attempts: Record<string, any>;
    captures: Record<string, any>;
    appliedEvents: Record<string, string>;
  };
  switch (event.type) {
    case "CORPUS_CELL_REGISTERED":
      if (state.corpusCell) transitionInvalid();
      mutable.corpusCell = {
        cellRef: event.cellRef,
        policyRef: event.policyRef,
      };
      break;
    case "URL_DISCOVERED":
      if (!state.corpusCell) transitionInvalid();
      if (state.urls[event.urlRef]) identityCollision();
      if (
        (event.discovery === "LINK" &&
          (!event.parentUrlRef || !state.urls[event.parentUrlRef])) ||
        (event.discovery !== "LINK" && event.parentUrlRef !== null)
      )
        transitionInvalid();
      mutable.urls[event.urlRef] = {
        discovery: event.discovery,
        parentUrlRef: event.parentUrlRef,
      };
      break;
    case "ROBOTS_DECIDED": {
      if (!state.corpusCell) transitionInvalid();
      const url = state.urls[event.urlRef];
      if (!url || url.robots) transitionInvalid();
      mutable.urls[event.urlRef] = { ...url, robots: event.decision };
      break;
    }
    case "FRONTIER_SCHEDULED": {
      if (!state.corpusCell) transitionInvalid();
      const url = state.urls[event.urlRef];
      if (!url || url.robots !== "ALLOW" || url.frontier) transitionInvalid();
      mutable.urls[event.urlRef] = {
        ...url,
        frontier: {
          notBeforeUnixMs: event.notBeforeUnixMs,
          politenessKey: event.politenessKey,
        },
      };
      break;
    }
    case "FETCH_STARTED": {
      if (!state.corpusCell) transitionInvalid();
      const url = state.urls[event.urlRef];
      if (!url?.frontier) transitionInvalid();
      if (state.attempts[event.attemptRef]) identityCollision();
      mutable.attempts[event.attemptRef] = {
        urlRef: event.urlRef,
        state: "STARTED",
      };
      break;
    }
    case "FETCH_SETTLED": {
      if (!state.corpusCell) transitionInvalid();
      const attempt = state.attempts[event.attemptRef];
      if (
        !attempt ||
        attempt.state !== "STARTED" ||
        (event.outcome === "CAPTURE_CANDIDATE") !== (event.byteDigest !== null)
      )
        transitionInvalid();
      mutable.attempts[event.attemptRef] = {
        ...attempt,
        state: "SETTLED",
        outcome: event.outcome,
        byteDigest: event.byteDigest,
      };
      break;
    }
    case "CAPTURE_COMMITTED": {
      if (!state.corpusCell) transitionInvalid();
      const attempt = state.attempts[event.attemptRef];
      if (
        !attempt ||
        attempt.outcome !== "CAPTURE_CANDIDATE" ||
        Object.values(state.captures).some(
          (capture) => capture.attemptRef === event.attemptRef,
        )
      )
        transitionInvalid();
      if (
        state.captures[event.captureRef] ||
        Object.values(state.captures).some(
          (capture) => capture.receiptRef === event.receiptRef,
        )
      )
        identityCollision();
      mutable.captures[event.captureRef] = {
        attemptRef: event.attemptRef,
        receiptRef: event.receiptRef,
      };
      break;
    }
    case "PROJECTION_MANIFESTED": {
      if (!state.corpusCell) transitionInvalid();
      const capture = state.captures[event.captureRef];
      if (!capture || capture.projectionManifestRef || capture.tombstoneRef)
        transitionInvalid();
      if (
        Object.values(state.captures).some(
          (item) => item.projectionManifestRef === event.manifestRef,
        )
      )
        identityCollision();
      mutable.captures[event.captureRef] = {
        ...capture,
        projectionManifestRef: event.manifestRef,
      };
      break;
    }
    case "TOMBSTONED": {
      if (!state.corpusCell) transitionInvalid();
      const capture = state.captures[event.captureRef];
      if (!capture || capture.tombstoneRef) transitionInvalid();
      if (
        Object.values(state.captures).some(
          (item) => item.tombstoneRef === event.tombstoneRef,
        )
      )
        identityCollision();
      mutable.captures[event.captureRef] = {
        ...capture,
        tombstoneRef: event.tombstoneRef,
      };
      break;
    }
    default:
      return transitionInvalid();
  }
  mutable.appliedEvents[event.eventId] = encoded;
  return { status: "APPLIED", state: next };
};
