import {
  RETRIEVAL_V3_LIMITS as LIMITS,
  RETRIEVAL_V3_SURFACES,
  type RetrieveInformationV3Report,
  type RetrieveInformationV3Request,
  type RetrievalV3Leg,
  type RetrievalV3Profile,
  type SurfaceRef,
} from "./contracts.js";

const fail = (code = "RETRIEVE_INFORMATION_V3_INVALID"): never => {
  throw new Error(code);
};
const record = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return fail();
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return fail();
  const descriptors = Object.getOwnPropertyDescriptors(input);
  if (
    Reflect.ownKeys(descriptors).some((key) => {
      if (typeof key !== "string") return true;
      const descriptor = descriptors[key]!;
      return (
        descriptor.get !== undefined ||
        descriptor.set !== undefined ||
        descriptor.enumerable !== true
      );
    })
  )
    return fail();
  return input as Record<string, unknown>;
};
const exact = (
  value: Record<string, unknown>,
  allowed: readonly string[],
  required = allowed,
): void => {
  if (
    Reflect.ownKeys(value).some(
      (key) => typeof key !== "string" || !allowed.includes(key),
    )
  )
    fail("RETRIEVE_INFORMATION_V3_UNKNOWN_FIELD");
  if (required.some((key) => !Object.hasOwn(value, key))) fail();
};
const text = (input: unknown, maximum: number = LIMITS.id): string => {
  if (
    typeof input !== "string" ||
    !input ||
    Buffer.byteLength(input) > maximum ||
    /[\u0000-\u001f\u007f]/u.test(input)
  )
    return fail();
  return input;
};
const id = (input: unknown): string => {
  const value = text(input);
  if (
    !/^[A-Za-z0-9][A-Za-z0-9:._/-]*$/u.test(value) ||
    /^(?:Bearer|Basic)\b/iu.test(value)
  )
    return fail();
  return value;
};
const integer = (input: unknown, maximum: number): number => {
  if (
    !Number.isSafeInteger(input) ||
    (input as number) < 1 ||
    (input as number) > maximum
  )
    return fail("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
  return input as number;
};
const nonnegativeInteger = (input: unknown, maximum: number): number => {
  if (
    !Number.isSafeInteger(input) ||
    (input as number) < 0 ||
    (input as number) > maximum
  )
    return fail("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
  return input as number;
};
const timestamp = (input: unknown): string => {
  const value = text(input, 64);
  if (!Number.isFinite(Date.parse(value)) || !value.includes("T"))
    return fail();
  return value;
};
const bounded = (input: unknown, bytes: number, nodesLimit: number): void => {
  let nodes = 0;
  const visit = (value: unknown): void => {
    nodes += 1;
    if (nodes > nodesLimit) fail("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype) fail();
      const descriptors = Object.getOwnPropertyDescriptors(value);
      const length = Object.getOwnPropertyDescriptor(value, "length")?.value;
      if (!Number.isSafeInteger(length) || length < 0) fail();
      if (length > nodesLimit - nodes)
        fail("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
      if (Reflect.ownKeys(descriptors).length - 1 !== length) fail();
      for (const rawKey of Reflect.ownKeys(descriptors)) {
        if (rawKey === "length") continue;
        if (typeof rawKey !== "string" || !/^(?:0|[1-9][0-9]*)$/u.test(rawKey))
          fail();
        const descriptor = descriptors[rawKey as string]!;
        if (
          descriptor.get !== undefined ||
          descriptor.set !== undefined ||
          descriptor.enumerable !== true
        )
          fail();
        nodes += 1;
        visit(descriptor.value);
      }
    } else if (value && typeof value === "object") {
      record(value);
      const descriptors = Object.getOwnPropertyDescriptors(value);
      for (const rawKey of Reflect.ownKeys(descriptors)) {
        if (
          typeof rawKey !== "string" ||
          ["__proto__", "prototype", "constructor", "toJSON"].includes(rawKey)
        )
          fail();
        const descriptor = descriptors[rawKey as string]!;
        if (
          descriptor.get !== undefined ||
          descriptor.set !== undefined ||
          descriptor.enumerable !== true
        )
          fail();
        nodes += 1;
        visit(descriptor.value);
      }
    }
  };
  visit(input);
  let encoded: string | undefined;
  try {
    encoded = JSON.stringify(input);
  } catch {
    fail();
  }
  if (encoded === undefined || Buffer.byteLength(encoded) > bytes)
    fail("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
};
const profiles: Record<RetrievalV3Profile, readonly SurfaceRef[]> = {
  OWNED_WEB: ["surface:owned-web:v1"],
  OWNED_WEB_MEMORY: ["surface:owned-web:v1", "surface:curiosity-memory:v1"],
  OWNED_WEB_MEMORY_MCP: [
    "surface:owned-web:v1",
    "surface:curiosity-memory:v1",
    "surface:authorized-mcp:v1",
  ],
};

export const decodeRetrieveInformationV3Request = (
  input: unknown,
): RetrieveInformationV3Request => {
  bounded(input, LIMITS.requestBytes, LIMITS.requestNodes);
  const value = record(input);
  exact(value, [
    "schemaVersion",
    "contract",
    "requestId",
    "authenticatedContextRef",
    "purpose",
    "objective",
    "validAsOf",
    "knownAsOf",
    "profile",
    "legs",
    "budget",
  ]);
  if (
    value.schemaVersion !== 3 ||
    value.contract !== "curiosity.retrieval/retrieve-information-request/v3"
  )
    fail();
  const objective = record(value.objective);
  exact(objective, ["question"]);
  if (
    !Array.isArray(value.legs) ||
    value.legs.length < 1 ||
    value.legs.length > LIMITS.legs
  )
    fail();
  const requestId = id(value.requestId);
  const authenticatedContextRef = id(value.authenticatedContextRef);
  const knownAsOf = timestamp(value.knownAsOf);
  const legs: RetrievalV3Leg[] = (value.legs as unknown[]).map(
    (input: unknown) => {
      const leg = record(input);
      const surfaceRef = text(leg.surfaceRef) as SurfaceRef;
      const manifest = RETRIEVAL_V3_SURFACES[surfaceRef];
      if (
        !manifest ||
        leg.mode !== manifest.mode ||
        !["REQUIRED", "OPTIONAL"].includes(String(leg.obligation))
      )
        fail();
      const common = {
        legId: id(leg.legId),
        obligation: leg.obligation as "REQUIRED" | "OPTIONAL",
        maxResults: integer(leg.maxResults, LIMITS.results),
      };
      if (surfaceRef !== "surface:authorized-mcp:v1") {
        exact(leg, ["legId", "surfaceRef", "mode", "obligation", "maxResults"]);
        return { ...common, surfaceRef, mode: "INDEXED" as const };
      }
      exact(leg, [
        "legId",
        "surfaceRef",
        "mode",
        "obligation",
        "maxResults",
        "intentRef",
        "requestId",
        "authenticatedContextRef",
        "sessionRef",
        "agentRef",
        "messageRef",
        "parentCallRef",
        "canonicalInputDigest",
      ]);
      const canonicalInputDigest = text(leg.canonicalInputDigest);
      if (!/^sha256:[a-f0-9]{64}$/u.test(canonicalInputDigest)) fail();
      const boundRequestId = id(leg.requestId);
      const boundContext = id(leg.authenticatedContextRef);
      if (
        boundRequestId !== requestId ||
        boundContext !== authenticatedContextRef
      )
        fail();
      return {
        ...common,
        surfaceRef,
        mode: "LIVE" as const,
        intentRef: id(leg.intentRef),
        requestId: boundRequestId,
        authenticatedContextRef: boundContext,
        sessionRef: id(leg.sessionRef),
        agentRef: id(leg.agentRef),
        messageRef: id(leg.messageRef),
        parentCallRef: id(leg.parentCallRef),
        canonicalInputDigest,
      };
    },
  );
  const profile = text(value.profile) as RetrievalV3Profile;
  const expected = profiles[profile];
  if (
    !expected ||
    expected.join("|") !== legs.map(({ surfaceRef }) => surfaceRef).join("|") ||
    new Set(legs.map(({ legId }) => legId)).size !== legs.length
  )
    fail("RETRIEVE_INFORMATION_V3_PROFILE_INVALID");
  const budget = record(value.budget);
  exact(budget, [
    "maxLegs",
    "maxResults",
    "maxUtf8Bytes",
    "maxNodes",
    "deadlineUnixMs",
  ]);
  const decodedBudget = {
    maxLegs: integer(budget.maxLegs, LIMITS.legs),
    maxResults: integer(budget.maxResults, LIMITS.results),
    maxUtf8Bytes: integer(budget.maxUtf8Bytes, LIMITS.reportBytes),
    maxNodes: integer(budget.maxNodes, LIMITS.reportNodes),
    deadlineUnixMs: integer(budget.deadlineUnixMs, Number.MAX_SAFE_INTEGER),
  };
  if (
    decodedBudget.maxLegs !== legs.length ||
    decodedBudget.maxUtf8Bytes < 2_048 ||
    decodedBudget.maxNodes < 32
  )
    fail("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
  return {
    schemaVersion: 3,
    contract: "curiosity.retrieval/retrieve-information-request/v3",
    requestId,
    authenticatedContextRef,
    purpose: id(value.purpose),
    objective: { question: text(objective.question, 1_000) },
    validAsOf: value.validAsOf === null ? null : timestamp(value.validAsOf),
    knownAsOf,
    profile,
    legs,
    budget: decodedBudget,
  };
};

export const measureRetrieveInformationV3Report = (
  report: RetrieveInformationV3Report,
): { utf8Bytes: number; nodes: number } => {
  let nodes = 0;
  const visit = (value: unknown): void => {
    nodes += 1;
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object")
      for (const [key, item] of Object.entries(value)) {
        nodes += 1;
        void key;
        visit(item);
      }
  };
  visit(report);
  return { utf8Bytes: Buffer.byteLength(JSON.stringify(report)), nodes };
};
export const decodeRetrieveInformationV3Report = (
  input: unknown,
  context?: { readonly maxResults: number },
): RetrieveInformationV3Report => {
  bounded(input, LIMITS.reportBytes, LIMITS.reportNodes);
  const value = record(input);
  exact(
    value,
    [
      "schemaVersion",
      "contract",
      "status",
      "requestId",
      "authorityRef",
      "asOf",
      "strata",
      "legs",
      "partial",
      "residualUncertainty",
      "stoppingReason",
      "diagnostic",
    ],
    [
      "schemaVersion",
      "contract",
      "status",
      "requestId",
      "authorityRef",
      "asOf",
      "strata",
      "legs",
      "partial",
      "residualUncertainty",
      "stoppingReason",
    ],
  );
  if (
    value.schemaVersion !== 3 ||
    value.contract !== "curiosity.retrieval/retrieve-information-report/v3" ||
    !["OK", "DENIED"].includes(String(value.status)) ||
    !Array.isArray(value.strata) ||
    !Array.isArray(value.legs) ||
    !Array.isArray(value.residualUncertainty) ||
    typeof value.partial !== "boolean"
  )
    fail();
  if (
    (value.legs as unknown[]).length > LIMITS.legs ||
    (value.strata as unknown[]).length > LIMITS.legs * 3 ||
    (value.residualUncertainty as unknown[]).length >
      LIMITS.results * LIMITS.legs
  )
    fail("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
  id(value.requestId);
  id(value.authorityRef);
  timestamp(value.asOf);
  const legs = (value.legs as unknown[]).map((input) => {
    const leg = record(input);
    exact(
      leg,
      [
        "legId",
        "surfaceRef",
        "mode",
        "obligation",
        "coverage",
        "freshness",
        "failures",
        "deliveredItems",
        "projectionSnapshotRef",
      ],
      [
        "legId",
        "surfaceRef",
        "mode",
        "obligation",
        "coverage",
        "freshness",
        "failures",
        "deliveredItems",
      ],
    );
    const surfaceRef = text(leg.surfaceRef) as SurfaceRef;
    const manifest = RETRIEVAL_V3_SURFACES[surfaceRef];
    if (
      !manifest ||
      leg.mode !== manifest.mode ||
      !["REQUIRED", "OPTIONAL"].includes(String(leg.obligation))
    )
      fail();
    const coverage = record(leg.coverage);
    exact(
      coverage,
      [
        "measurement",
        "completeness",
        "observedItems",
        "declaredItems",
        "corpusCellRef",
      ],
      ["measurement", "completeness", "observedItems"],
    );
    if (
      !["MEASURED", "UNKNOWN"].includes(String(coverage.measurement)) ||
      !["COMPLETE", "PARTIAL", "UNKNOWN"].includes(
        String(coverage.completeness),
      )
    )
      fail();
    const observedItems = nonnegativeInteger(
      coverage.observedItems,
      LIMITS.results,
    );
    if (coverage.declaredItems !== undefined)
      nonnegativeInteger(coverage.declaredItems, Number.MAX_SAFE_INTEGER);
    if (coverage.corpusCellRef !== undefined) id(coverage.corpusCellRef);
    const freshness = record(leg.freshness);
    exact(freshness, ["state", "observedAt"], ["state"]);
    if (
      !["CURRENT", "UNKNOWN"].includes(String(freshness.state)) ||
      (freshness.state === "CURRENT") !== Object.hasOwn(freshness, "observedAt")
    )
      fail();
    if (freshness.observedAt !== undefined) timestamp(freshness.observedAt);
    if (!Array.isArray(leg.failures)) fail();
    const failures = leg.failures as unknown[];
    if (failures.length > LIMITS.failures)
      fail("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
    for (const input of failures) {
      const failure = record(input);
      exact(failure, ["code"]);
      id(failure.code);
    }
    const deliveredItems = nonnegativeInteger(
      leg.deliveredItems,
      LIMITS.results,
    );
    const projectionSnapshotRef =
      leg.projectionSnapshotRef === undefined
        ? undefined
        : id(leg.projectionSnapshotRef);
    if (
      (surfaceRef === "surface:owned-web:v1" &&
        projectionSnapshotRef === undefined &&
        failures.length === 0) ||
      (surfaceRef !== "surface:owned-web:v1" &&
        projectionSnapshotRef !== undefined)
    )
      fail();
    if (
      surfaceRef === "surface:owned-web:v1" &&
      projectionSnapshotRef !== undefined &&
      (coverage.measurement !== "MEASURED" ||
        coverage.declaredItems === undefined ||
        coverage.corpusCellRef === undefined)
    )
      fail();
    if (failures.length && coverage.completeness === "COMPLETE") fail();
    return {
      legId: id(leg.legId),
      surfaceRef,
      deliveredItems,
      observedItems,
      projectionSnapshotRef,
      incomplete: coverage.completeness !== "COMPLETE" || failures.length > 0,
    };
  });
  const lifecycleKeys = [
    "custody",
    "assertion",
    "queryEligibility",
    "authorizationFreshness",
    "validation",
    "deletion",
  ];
  const strata = (value.strata as unknown[]).map((input) => {
    const stratum = record(input);
    exact(stratum, ["stratumId", "legId", "epistemicKind", "items"]);
    const kind = text(stratum.epistemicKind);
    if (
      ![
        "source-observation",
        "custodied-evidence",
        "active-assertion",
      ].includes(kind) ||
      !Array.isArray(stratum.items)
    )
      fail();
    if ((stratum.items as unknown[]).length > LIMITS.results)
      fail("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
    const summaries: Array<{
      identity: string;
      surfaceRef: SurfaceRef;
      captureRef: string | null;
      receiptRef: string;
      projectionSnapshotRef: string | null;
      committedCaptureRef?: string;
      itemReceiptRef?: string;
      hostReceiptRef?: string;
    }> = [];
    for (const input of stratum.items as unknown[]) {
      const item = record(input);
      if (item.recordKind !== kind) fail();
      const common = [
        "recordKind",
        kind === "source-observation" ? "observationId" : "evidenceId",
        "title",
        "excerpt",
        "sourceLocator",
        "observedAt",
        "provenance",
      ];
      const evidence = [
        "committedCaptureRef",
        "representationRef",
        "spanRef",
        "receiptRef",
        "lifecycle",
      ];
      const assertion = [
        "assertionId",
        "beliefRevisionRef",
        "evidenceSetRef",
        "validationPolicyRef",
        "validationDecisionRef",
      ];
      exact(
        item,
        kind === "source-observation"
          ? [...common, "trust"]
          : kind === "custodied-evidence"
            ? [...common, ...evidence]
            : [...common, ...evidence, ...assertion],
      );
      id(item[kind === "source-observation" ? "observationId" : "evidenceId"]);
      text(item.title, 300);
      text(item.excerpt, LIMITS.text);
      text(item.sourceLocator, 2_048);
      timestamp(item.observedAt);
      const provenance = record(item.provenance);
      exact(
        provenance,
        [
          "surfaceRef",
          "sourceObjectRef",
          "captureRef",
          "receiptRef",
          "projectionSnapshotRef",
          "hostReceipt",
        ],
        [
          "surfaceRef",
          "sourceObjectRef",
          "captureRef",
          "receiptRef",
          "projectionSnapshotRef",
        ],
      );
      const provenanceSurface = text(provenance.surfaceRef) as SurfaceRef;
      if (!RETRIEVAL_V3_SURFACES[provenanceSurface]) fail();
      const sourceObjectRef = id(provenance.sourceObjectRef);
      const captureRef =
        provenance.captureRef === null ? null : id(provenance.captureRef);
      const receiptRef = id(provenance.receiptRef);
      const projectionSnapshotRef =
        provenance.projectionSnapshotRef === null
          ? null
          : id(provenance.projectionSnapshotRef);
      const identity = id(
        item[
          kind === "source-observation"
            ? "observationId"
            : kind === "active-assertion"
              ? "assertionId"
              : "evidenceId"
        ],
      );
      if (kind === "source-observation") {
        if (
          item.trust !== "untrusted-source-observation" ||
          !Object.hasOwn(provenance, "hostReceipt")
        )
          fail();
        const host = record(provenance.hostReceipt);
        exact(host, [
          "receiptRef",
          "compatibilityMode",
          "sessionRef",
          "agentRef",
          "messageRef",
          "parentCallRef",
          "canonicalInputDigest",
          "capturedAt",
        ]);
        for (const key of [
          "receiptRef",
          "sessionRef",
          "agentRef",
          "messageRef",
          "parentCallRef",
        ] as const)
          id(host[key]);
        if (
          host.compatibilityMode !== "MODEL_MEDIATED" ||
          !/^sha256:[a-f0-9]{64}$/u.test(text(host.canonicalInputDigest))
        )
          fail();
        timestamp(host.capturedAt);
        const hostReceiptRef = id(host.receiptRef);
        if (
          hostReceiptRef !== receiptRef ||
          captureRef !== null ||
          projectionSnapshotRef !== null ||
          !sourceObjectRef.startsWith(`${receiptRef}:item:`)
        )
          fail();
        summaries.push({
          identity,
          surfaceRef: provenanceSurface,
          captureRef,
          receiptRef,
          projectionSnapshotRef,
          hostReceiptRef,
        });
      } else {
        if (Object.hasOwn(provenance, "hostReceipt")) fail();
        const lifecycle = record(item.lifecycle);
        exact(lifecycle, lifecycleKeys);
        if (
          lifecycle.custody !== "DURABLE" ||
          lifecycle.queryEligibility !== "ELIGIBLE" ||
          lifecycle.authorizationFreshness !== "CURRENT" ||
          lifecycle.validation !== "CURRENT" ||
          lifecycle.deletion !== "LIVE" ||
          lifecycle.assertion !==
            (kind === "active-assertion" ? "ACTIVE" : "NOT_APPLICABLE")
        )
          fail();
        for (const key of evidence.slice(0, 4)) id(item[key]);
        if (kind === "active-assertion")
          for (const key of assertion) id(item[key]);
        const committedCaptureRef = id(item.committedCaptureRef);
        const itemReceiptRef = id(item.receiptRef);
        if (committedCaptureRef !== captureRef || itemReceiptRef !== receiptRef)
          fail();
        summaries.push({
          identity,
          surfaceRef: provenanceSurface,
          captureRef,
          receiptRef,
          projectionSnapshotRef,
          committedCaptureRef,
          itemReceiptRef,
        });
      }
    }
    return {
      stratumId: id(stratum.stratumId),
      legId: id(stratum.legId),
      kind,
      count: (stratum.items as unknown[]).length,
      summaries,
    };
  });
  if (
    new Set(legs.map(({ legId }) => legId)).size !== legs.length ||
    new Set(strata.map(({ stratumId }) => stratumId)).size !== strata.length ||
    strata.some((stratum) => !legs.some((leg) => leg.legId === stratum.legId))
  )
    fail();
  const allItems = strata.flatMap(({ summaries }) => summaries);
  const maximum = context?.maxResults ?? LIMITS.results;
  if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > LIMITS.results)
    fail("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
  if (allItems.length > LIMITS.results || allItems.length > maximum)
    fail("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
  if (
    new Set(allItems.map(({ identity }) => identity)).size !== allItems.length
  )
    fail();
  for (const stratum of strata) {
    const leg = legs.find(({ legId }) => legId === stratum.legId)!;
    for (const item of stratum.summaries) {
      if (item.surfaceRef !== leg.surfaceRef) fail();
      if (leg.surfaceRef === "surface:owned-web:v1") {
        if (
          item.projectionSnapshotRef !== leg.projectionSnapshotRef ||
          item.captureRef === null
        )
          fail();
      } else if (item.projectionSnapshotRef !== null) fail();
    }
  }
  if ((value.status === "DENIED") !== Object.hasOwn(value, "diagnostic"))
    fail();
  let diagnosticCode: string | undefined;
  if (value.diagnostic !== undefined) {
    const diagnostic = record(value.diagnostic);
    exact(diagnostic, ["code"]);
    if (
      ![
        "RETRIEVE_INFORMATION_V3_DENIED",
        "RETRIEVE_INFORMATION_V3_DELIVERY_DENIED",
      ].includes(String(diagnostic.code))
    )
      fail();
    diagnosticCode = String(diagnostic.code);
  }
  const residualUncertainty = value.residualUncertainty as unknown[];
  for (const uncertainty of residualUncertainty) id(uncertainty);
  const stoppingReason = text(value.stoppingReason);
  const allowedStops = [
    "DECLARED_LEGS_COMPLETED",
    "INITIAL_AUTHORITY_DENIED",
    "DELIVERY_AUTHORITY_DENIED",
    "DEADLINE_EXHAUSTED",
    "REQUIRED_LEG_UNAVAILABLE",
    "OUTPUT_BUDGET_EXHAUSTED",
  ];
  if (!allowedStops.includes(stoppingReason)) fail();
  if (value.status === "DENIED") {
    const initial = diagnosticCode === "RETRIEVE_INFORMATION_V3_DENIED";
    const expected = initial
      ? "INITIAL_AUTHORITY_DENIED"
      : "DELIVERY_AUTHORITY_DENIED";
    if (
      legs.length ||
      strata.length ||
      value.partial !== true ||
      stoppingReason !== expected ||
      residualUncertainty.length !== 1 ||
      residualUncertainty[0] !== expected
    )
      fail();
  } else if (stoppingReason === "OUTPUT_BUDGET_EXHAUSTED") {
    if (
      legs.length ||
      strata.length ||
      value.partial !== true ||
      residualUncertainty.length !== 1 ||
      residualUncertainty[0] !== "OUTPUT_BUDGET_EXHAUSTED"
    )
      fail();
  } else {
    if (legs.length < 1 || legs.length > LIMITS.legs) fail();
    for (const leg of legs) {
      const delivered = strata
        .filter(({ legId }) => legId === leg.legId)
        .reduce((sum, stratum) => sum + stratum.count, 0);
      if (
        delivered !== leg.deliveredItems ||
        leg.deliveredItems > leg.observedItems
      )
        fail();
    }
    if (
      value.partial !==
      (legs.some(({ incomplete }) => incomplete) ||
        stoppingReason !== "DECLARED_LEGS_COMPLETED")
    )
      fail();
    if (
      ["DEADLINE_EXHAUSTED", "REQUIRED_LEG_UNAVAILABLE"].includes(
        stoppingReason,
      ) &&
      strata.length
    )
      fail();
    if (
      strata.some((stratum) => {
        const surfaceRef = legs.find(
          ({ legId }) => legId === stratum.legId,
        )!.surfaceRef;
        return surfaceRef === "surface:authorized-mcp:v1"
          ? stratum.kind !== "source-observation"
          : stratum.kind === "source-observation";
      })
    )
      fail();
  }
  return input as RetrieveInformationV3Report;
};
