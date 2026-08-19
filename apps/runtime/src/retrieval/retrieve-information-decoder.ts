import {
  RETRIEVE_INFORMATION_LIMITS as LIMITS,
  type RetrieveInformationReport,
  type RetrieveInformationRequest,
  type RetrievalResult,
} from "./retrieve-information-contracts.js";
import { validHttpUrl, validRfc3339 } from "./validation.js";

const fail = (code = "RETRIEVE_INFORMATION_INVALID"): never => {
  throw new Error(code);
};
const ownRecord = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return fail();
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return fail();
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
    fail("RETRIEVE_INFORMATION_UNKNOWN_FIELD");
  if (required.some((key) => !Object.hasOwn(value, key))) fail();
};
const text = (value: unknown, maximum: number = LIMITS.id): string => {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value) > maximum ||
    /[\u0000-\u001f\u007f]/u.test(value)
  )
    return fail();
  return value;
};
const id = (value: unknown): string => {
  const result = text(value);
  if (
    !/^[A-Za-z0-9][A-Za-z0-9:._/-]*$/u.test(result) ||
    /^(?:Bearer|Basic)\b/iu.test(result)
  )
    return fail();
  return result;
};
const integer = (value: unknown, maximum: number): number => {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < 1 ||
    (value as number) > maximum
  )
    return fail("RETRIEVE_INFORMATION_LIMIT_EXCEEDED");
  return value as number;
};
const nonnegativeInteger = (value: unknown, maximum: number): number => {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < 0 ||
    (value as number) > maximum
  )
    return fail("RETRIEVE_INFORMATION_LIMIT_EXCEEDED");
  return value as number;
};
const timestamp = (value: unknown): string => {
  const result = text(value, 64);
  return validRfc3339(result) ? result : fail();
};
const enumValue = <T extends string>(
  value: unknown,
  values: readonly T[],
): T => (values.includes(value as T) ? (value as T) : fail());

const boundedGraph = (
  input: unknown,
  maxBytes: number,
  maxNodes: number,
): void => {
  let bytes = 0;
  let nodes = 0;
  const visit = (value: unknown): void => {
    nodes += 1;
    if (nodes > maxNodes) fail("RETRIEVE_INFORMATION_LIMIT_EXCEEDED");
    if (typeof value === "string") bytes += Buffer.byteLength(value);
    if (Array.isArray(value)) for (const item of value) visit(item);
    else if (value && typeof value === "object") {
      const record = ownRecord(value);
      for (const key of Reflect.ownKeys(record)) {
        if (
          typeof key !== "string" ||
          ["__proto__", "prototype", "constructor"].includes(key)
        )
          fail();
        const ownKey = key as string;
        nodes += 1;
        if (nodes > maxNodes) fail("RETRIEVE_INFORMATION_LIMIT_EXCEEDED");
        bytes += Buffer.byteLength(ownKey);
        visit(record[ownKey]);
      }
    }
    if (bytes > maxBytes) fail("RETRIEVE_INFORMATION_LIMIT_EXCEEDED");
  };
  visit(input);
};

export const decodeRetrieveInformationRequest = (
  input: unknown,
): RetrieveInformationRequest => {
  boundedGraph(input, LIMITS.requestBytes, LIMITS.requestNodes);
  const value = ownRecord(input);
  exact(value, [
    "schemaVersion",
    "contract",
    "requestId",
    "authenticatedContextRef",
    "purpose",
    "objective",
    "validAsOf",
    "knownAsOf",
    "legs",
    "budget",
  ]);
  if (
    value.schemaVersion !== 2 ||
    value.contract !== "curiosity.retrieval/retrieve-information-request/v2"
  )
    fail();
  const objective = ownRecord(value.objective);
  exact(objective, ["question"]);
  const question = text(objective.question, 1_000);
  if (!Array.isArray(value.legs) || value.legs.length !== LIMITS.legs) fail();
  const legInputs = value.legs as unknown[];
  const legs = legInputs.map((input) => {
    const leg = ownRecord(input);
    exact(leg, [
      "legId",
      "surfaceSelector",
      "mode",
      "obligation",
      "maxResults",
    ]);
    const surfaceSelector = enumValue(leg.surfaceSelector, [
      "public-web/searxng-gateway",
      "development-memory/evidence",
    ] as const);
    const mode = enumValue(leg.mode, ["LIVE", "INDEXED"] as const);
    if (
      (surfaceSelector.startsWith("public-web/") && mode !== "LIVE") ||
      (surfaceSelector.startsWith("development-memory/") && mode !== "INDEXED")
    )
      fail();
    const common = {
      legId: id(leg.legId),
      obligation: enumValue(leg.obligation, ["REQUIRED", "OPTIONAL"] as const),
      maxResults: integer(leg.maxResults, LIMITS.results),
    };
    return surfaceSelector === "public-web/searxng-gateway"
      ? { ...common, surfaceSelector, mode: "LIVE" as const }
      : { ...common, surfaceSelector, mode: "INDEXED" as const };
  });
  if (
    new Set(legs.map(({ legId }) => legId)).size !== 2 ||
    new Set(legs.map(({ surfaceSelector }) => surfaceSelector)).size !== 2
  )
    fail();
  const budget = ownRecord(value.budget);
  exact(budget, [
    "maxLegs",
    "maxResults",
    "maxUtf8Bytes",
    "maxNodes",
    "deadlineUnixMs",
  ]);
  if (budget.maxLegs !== 2) fail("RETRIEVE_INFORMATION_LIMIT_EXCEEDED");
  const decodedBudget = {
    maxLegs: 2 as const,
    maxResults: integer(budget.maxResults, LIMITS.results),
    maxUtf8Bytes: integer(budget.maxUtf8Bytes, LIMITS.reportBytes),
    maxNodes: integer(budget.maxNodes, LIMITS.reportNodes),
    deadlineUnixMs: integer(budget.deadlineUnixMs, Number.MAX_SAFE_INTEGER),
  };
  if (decodedBudget.maxNodes < 32 || decodedBudget.maxUtf8Bytes < 2_048)
    fail("RETRIEVE_INFORMATION_LIMIT_EXCEEDED");
  return {
    schemaVersion: 2,
    contract: "curiosity.retrieval/retrieve-information-request/v2",
    requestId: id(value.requestId),
    authenticatedContextRef: id(value.authenticatedContextRef),
    purpose: id(value.purpose),
    objective: { question },
    validAsOf: value.validAsOf === null ? null : timestamp(value.validAsOf),
    knownAsOf: timestamp(value.knownAsOf),
    legs,
    budget: decodedBudget,
  };
};

const decodeItem = (input: unknown): RetrievalResult => {
  const value = ownRecord(input);
  const kind = enumValue(value.recordKind, [
    "source-observation",
    "custodied-evidence",
    "remembered-belief",
    "active-assertion",
  ] as const);
  if (kind === "source-observation") {
    exact(value, [
      "recordKind",
      "observationId",
      "title",
      "excerpt",
      "sourceLocator",
      "observedAt",
      "nativeRank",
      "trust",
    ]);
    const rank = ownRecord(value.nativeRank);
    exact(rank, ["namespace", "labels"]);
    if (
      rank.namespace !== "org.searxng.providers/v1" ||
      !Array.isArray(rank.labels) ||
      rank.labels.length > 8
    )
      fail();
    const labels = rank.labels as unknown[];
    const sourceLocator = text(value.sourceLocator, 2_048);
    if (!validHttpUrl(sourceLocator)) fail();
    return {
      recordKind: kind,
      observationId: id(value.observationId),
      title: text(value.title, 300),
      excerpt: text(value.excerpt, LIMITS.text),
      sourceLocator,
      observedAt: timestamp(value.observedAt),
      nativeRank: {
        namespace: "org.searxng.providers/v1",
        labels: labels.map((label) => id(label)),
      },
      trust:
        value.trust === "untrusted-source-observation" ? value.trust : fail(),
    };
  }
  const evidence = [
    "recordKind",
    "evidenceId",
    "title",
    "excerpt",
    "sourceLocator",
    "observedAt",
    "committedCaptureRef",
    "representationRef",
    "spanRef",
    "receiptRef",
    "lifecycle",
  ];
  const beliefKeys = [
    "beliefRevisionRef",
    "evidenceSetRef",
    "validationPolicyRef",
    "validationDecisionRef",
  ];
  const allowed =
    kind === "custodied-evidence"
      ? evidence
      : kind === "remembered-belief"
        ? [...evidence, ...beliefKeys]
        : [...evidence, ...beliefKeys, "assertionId"];
  exact(value, allowed);
  const lifecycle = ownRecord(value.lifecycle);
  exact(lifecycle, [
    "custody",
    "assertion",
    "queryEligibility",
    "authorizationFreshness",
    "validation",
    "deletion",
  ]);
  if (
    lifecycle.custody !== "DURABLE" ||
    lifecycle.queryEligibility !== "ELIGIBLE" ||
    lifecycle.authorizationFreshness !== "CURRENT" ||
    lifecycle.validation !== "CURRENT" ||
    lifecycle.deletion !== "LIVE"
  )
    fail();
  if (
    lifecycle.assertion !==
    (kind === "active-assertion" ? "ACTIVE" : "NOT_APPLICABLE")
  )
    fail();
  const common = {
    evidenceId: id(value.evidenceId),
    title: text(value.title, 300),
    excerpt: text(value.excerpt, LIMITS.text),
    sourceLocator: id(value.sourceLocator),
    observedAt: timestamp(value.observedAt),
    committedCaptureRef: id(value.committedCaptureRef),
    representationRef: id(value.representationRef),
    spanRef: id(value.spanRef),
    receiptRef: id(value.receiptRef),
    lifecycle:
      lifecycle as unknown as import("./retrieve-information-contracts.js").ResultLifecycle,
  };
  if (kind === "custodied-evidence")
    return { ...common, recordKind: "custodied-evidence" };
  const beliefFields = {
    beliefRevisionRef: id(value.beliefRevisionRef),
    evidenceSetRef: id(value.evidenceSetRef),
    validationPolicyRef: id(value.validationPolicyRef),
    validationDecisionRef: id(value.validationDecisionRef),
  };
  if (kind === "remembered-belief")
    return { ...common, ...beliefFields, recordKind: "remembered-belief" };
  return {
    ...common,
    ...beliefFields,
    recordKind: "active-assertion",
    assertionId: id(value.assertionId),
  };
};

export const decodeRetrieveInformationReport = (
  input: unknown,
): RetrieveInformationReport => {
  boundedGraph(input, LIMITS.reportBytes, LIMITS.reportNodes);
  const value = ownRecord(input);
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
    value.schemaVersion !== 2 ||
    value.contract !== "curiosity.retrieval/retrieve-information-report/v2" ||
    !Array.isArray(value.strata) ||
    !Array.isArray(value.legs) ||
    !Array.isArray(value.residualUncertainty) ||
    typeof value.partial !== "boolean"
  )
    fail();
  const stratumInputs = value.strata as unknown[];
  const strata = stratumInputs.map((input) => {
    const stratum = ownRecord(input);
    exact(stratum, ["stratumId", "legId", "epistemicKind", "items"]);
    if (!Array.isArray(stratum.items)) fail();
    const epistemicKind = enumValue(stratum.epistemicKind, [
      "source-observation",
      "custodied-evidence",
      "remembered-belief",
      "active-assertion",
    ] as const);
    const items = (stratum.items as unknown[]).map(decodeItem);
    if (items.some((item) => item.recordKind !== epistemicKind)) fail();
    return {
      stratumId: id(stratum.stratumId),
      legId: id(stratum.legId),
      epistemicKind,
      items,
    };
  });
  const legInputs = value.legs as unknown[];
  const legs = legInputs.map((input) => {
    const leg = ownRecord(input);
    exact(leg, [
      "legId",
      "surfaceSelector",
      "mode",
      "obligation",
      "coverage",
      "freshness",
      "failures",
      "deliveredItems",
    ]);
    const coverage = ownRecord(leg.coverage);
    exact(coverage, ["measurement", "completeness", "observedItems"]);
    const freshness = ownRecord(leg.freshness);
    exact(freshness, ["state", "observedAt"], ["state"]);
    if (!Array.isArray(leg.failures)) fail();
    const failures = (leg.failures as unknown[]).map((input) => {
      const failure = ownRecord(input);
      exact(failure, ["code"]);
      return { code: id(failure.code) };
    });
    const state = enumValue(freshness.state, ["CURRENT", "UNKNOWN"] as const);
    if (state === "CURRENT" && !Object.hasOwn(freshness, "observedAt")) fail();
    return {
      legId: id(leg.legId),
      surfaceSelector: enumValue(leg.surfaceSelector, [
        "public-web/searxng-gateway",
        "development-memory/evidence",
      ] as const),
      mode: enumValue(leg.mode, ["LIVE", "INDEXED"] as const),
      obligation: enumValue(leg.obligation, ["REQUIRED", "OPTIONAL"] as const),
      coverage: {
        measurement: enumValue(coverage.measurement, [
          "MEASURED",
          "UNKNOWN",
        ] as const),
        completeness: enumValue(coverage.completeness, [
          "COMPLETE",
          "PARTIAL",
          "UNKNOWN",
        ] as const),
        observedItems: nonnegativeInteger(
          coverage.observedItems,
          LIMITS.results,
        ),
      },
      freshness: {
        state,
        ...(freshness.observedAt === undefined
          ? {}
          : { observedAt: timestamp(freshness.observedAt) }),
      },
      failures,
      deliveredItems: nonnegativeInteger(leg.deliveredItems, LIMITS.results),
    };
  });
  const uncertainties = value.residualUncertainty as unknown[];
  let diagnostic: RetrieveInformationReport["diagnostic"];
  if (value.diagnostic !== undefined) {
    const input = ownRecord(value.diagnostic);
    exact(input, ["code"]);
    diagnostic = {
      code: enumValue(input.code, [
        "RETRIEVE_INFORMATION_DENIED",
        "RETRIEVE_INFORMATION_DELIVERY_DENIED",
      ] as const),
    };
  }
  const status = enumValue(value.status, ["OK", "DENIED"] as const);
  const stoppingReason = enumValue(value.stoppingReason, [
    "DECLARED_LEGS_COMPLETED",
    "INITIAL_AUTHORITY_DENIED",
    "DELIVERY_AUTHORITY_DENIED",
    "DEADLINE_EXHAUSTED",
    "REQUIRED_LEG_UNAVAILABLE",
    "OUTPUT_BUDGET_EXHAUSTED",
  ] as const);
  const residualUncertainty = uncertainties.map((reason) => id(reason));
  if (status === "DENIED") {
    const initial = diagnostic?.code === "RETRIEVE_INFORMATION_DENIED";
    const expectedStop = initial
      ? "INITIAL_AUTHORITY_DENIED"
      : "DELIVERY_AUTHORITY_DENIED";
    if (
      !diagnostic ||
      legs.length ||
      strata.length ||
      value.partial !== true ||
      stoppingReason !== expectedStop ||
      residualUncertainty.length !== 1 ||
      residualUncertainty[0] !== expectedStop
    )
      fail();
  } else {
    if (
      stoppingReason === "INITIAL_AUTHORITY_DENIED" ||
      stoppingReason === "DELIVERY_AUTHORITY_DENIED"
    )
      fail();
    if (stoppingReason === "OUTPUT_BUDGET_EXHAUSTED") {
      if (
        diagnostic ||
        legs.length ||
        strata.length ||
        value.partial !== true ||
        residualUncertainty.length !== 1 ||
        residualUncertainty[0] !== "OUTPUT_BUDGET_EXHAUSTED"
      )
        fail();
    } else {
      if (
        diagnostic ||
        legs.length !== 2 ||
        new Set(legs.map(({ legId }) => legId)).size !== legs.length ||
        new Set(legs.map(({ surfaceSelector }) => surfaceSelector)).size !==
          legs.length
      )
        fail();
      if (
        legs.some(
          (leg) =>
            (leg.surfaceSelector === "public-web/searxng-gateway") !==
            (leg.mode === "LIVE"),
        )
      )
        fail();
      for (const leg of legs) {
        if (
          (leg.freshness.state === "UNKNOWN") ===
          (leg.freshness.observedAt !== undefined)
        )
          fail();
        if (leg.failures.length > 0 && leg.coverage.completeness === "COMPLETE")
          fail();
        if (leg.surfaceSelector === "public-web/searxng-gateway") {
          if (
            leg.coverage.measurement !== "UNKNOWN" ||
            leg.coverage.completeness === "COMPLETE"
          )
            fail();
          if (
            leg.failures.length > 0 !==
            (leg.coverage.completeness === "PARTIAL")
          )
            fail();
        } else {
          const onlyOutputBudget =
            leg.failures.length > 0 &&
            leg.failures.every(
              ({ code }) => code === "OUTPUT_BUDGET_EXHAUSTED",
            );
          if (
            leg.failures.length === 0 &&
            (leg.coverage.measurement !== "MEASURED" ||
              leg.coverage.completeness !== "COMPLETE" ||
              leg.freshness.state !== "CURRENT")
          )
            fail();
          if (
            onlyOutputBudget &&
            (leg.coverage.measurement !== "MEASURED" ||
              leg.coverage.completeness !== "PARTIAL" ||
              leg.freshness.state !== "CURRENT")
          )
            fail();
          if (
            leg.failures.length > 0 &&
            !onlyOutputBudget &&
            (leg.coverage.measurement !== "UNKNOWN" ||
              leg.coverage.completeness !== "PARTIAL" ||
              leg.freshness.state !== "UNKNOWN")
          )
            fail();
        }
      }
      const legIds = new Set(legs.map(({ legId }) => legId));
      if (
        new Set(strata.map(({ stratumId }) => stratumId)).size !==
          strata.length ||
        new Set(
          strata.map(({ legId, epistemicKind }) => `${legId}:${epistemicKind}`),
        ).size !== strata.length ||
        strata.some((stratum) => !legIds.has(stratum.legId))
      )
        fail();
      if (
        strata.some((stratum) => {
          const leg = legs.find(({ legId }) => legId === stratum.legId)!;
          return leg.surfaceSelector === "public-web/searxng-gateway"
            ? stratum.epistemicKind !== "source-observation"
            : stratum.epistemicKind === "source-observation";
        })
      )
        fail();
      for (const leg of legs) {
        const delivered = strata
          .filter(({ legId }) => legId === leg.legId)
          .flatMap(({ items }) => items).length;
        if (
          delivered !== leg.deliveredItems ||
          leg.deliveredItems > leg.coverage.observedItems
        )
          fail();
      }
      if (
        legs.reduce((sum, leg) => sum + leg.deliveredItems, 0) > LIMITS.results
      )
        fail();
      const incomplete = legs.some(
        (leg) =>
          leg.coverage.completeness !== "COMPLETE" || leg.failures.length > 0,
      );
      if (
        value.partial !==
        (incomplete || stoppingReason !== "DECLARED_LEGS_COMPLETED")
      )
        fail();
      if (
        stoppingReason === "DECLARED_LEGS_COMPLETED" &&
        legs.some(
          (leg) =>
            leg.obligation === "REQUIRED" &&
            leg.failures.some(({ code }) => code !== "OUTPUT_BUDGET_EXHAUSTED"),
        )
      )
        fail();
      if (
        (stoppingReason === "DEADLINE_EXHAUSTED" ||
          stoppingReason === "REQUIRED_LEG_UNAVAILABLE") &&
        strata.length
      )
        fail();
      if (
        stoppingReason === "DEADLINE_EXHAUSTED" &&
        (residualUncertainty.length !== 1 ||
          residualUncertainty[0] !== "DEADLINE_EXHAUSTED" ||
          !legs.some((leg) =>
            leg.failures.some(({ code }) => code.startsWith("DEADLINE_")),
          ))
      )
        fail();
      if (
        stoppingReason === "REQUIRED_LEG_UNAVAILABLE" &&
        (!residualUncertainty.includes("REQUIRED_LEG_UNAVAILABLE") ||
          !legs.some(
            (leg) =>
              leg.obligation === "REQUIRED" &&
              leg.failures.some(
                ({ code }) => code !== "OUTPUT_BUDGET_EXHAUSTED",
              ),
          ))
      )
        fail();
      const asOfMs = Date.parse(timestamp(value.asOf));
      if (
        legs.some(
          (leg) =>
            leg.freshness.observedAt &&
            Date.parse(leg.freshness.observedAt) > asOfMs,
        ) ||
        strata
          .flatMap(({ items }) => items)
          .some((item) => Date.parse(item.observedAt) > asOfMs)
      )
        fail();
    }
  }
  const report = {
    ...value,
    schemaVersion: 2,
    contract: "curiosity.retrieval/retrieve-information-report/v2",
    status,
    requestId: id(value.requestId),
    authorityRef: id(value.authorityRef),
    asOf: timestamp(value.asOf),
    strata,
    legs,
    residualUncertainty,
    stoppingReason,
    ...(diagnostic ? { diagnostic } : {}),
  };
  return report as unknown as RetrieveInformationReport;
};
