import {
  decodeRetrieveInformationV3Report,
  decodeRetrieveInformationV3Request,
  measureRetrieveInformationV3Report,
} from "./decoder.js";
import type {
  RetrieveInformationV3Report,
  RetrieveInformationV3Request,
  RetrievalV3LegReport,
  RetrievalV3Result,
} from "./contracts.js";
import { RETRIEVAL_V3_LIMITS } from "./contracts.js";
import {
  type AuthorizedMcpReceiptAdapter,
  type DevelopmentMemoryV3Adapter,
  type LegContextV3,
  type LegExecutionV3,
  type OwnedWebSnapshotAdapter,
  type RetrievalAdapterV3,
  unavailableV3Execution,
} from "./adapters.js";

export interface AuthorityPolicyV3Port {
  authorize(
    context: Pick<
      RetrieveInformationV3Request,
      | "authenticatedContextRef"
      | "purpose"
      | "objective"
      | "validAsOf"
      | "knownAsOf"
      | "profile"
      | "legs"
      | "budget"
    > & { readonly signal: AbortSignal },
  ): Promise<{
    readonly decision: "ALLOW" | "DENY";
    readonly authorityRef: string;
    readonly policyVersion: string;
  }>;
  revalidateDelivery(context: {
    readonly authorityRef: string;
    readonly authenticatedContextRef: string;
    readonly purpose: string;
    readonly requestId: string;
    readonly signal: AbortSignal;
  }): Promise<{ readonly decision: "ALLOW" | "DENY" }>;
}

interface Dependencies {
  readonly authority: AuthorityPolicyV3Port;
  readonly owned: OwnedWebSnapshotAdapter;
  readonly memory: DevelopmentMemoryV3Adapter;
  readonly mcp: AuthorizedMcpReceiptAdapter;
  readonly now: () => string;
  readonly monotonicNow?: () => number;
}

type TimedOutcome<T> =
  | { readonly status: "SETTLED"; readonly value: T }
  | { readonly status: "FAILED" }
  | { readonly status: "TIMEOUT" };

const denied = (
  request: RetrieveInformationV3Request,
  authorityRef: string,
  asOf: string,
  final: boolean,
): RetrieveInformationV3Report => ({
  schemaVersion: 3,
  contract: "curiosity.retrieval/retrieve-information-report/v3",
  status: "DENIED",
  requestId: request.requestId,
  authorityRef,
  asOf,
  strata: [],
  legs: [],
  partial: true,
  residualUncertainty: [
    final ? "DELIVERY_AUTHORITY_DENIED" : "INITIAL_AUTHORITY_DENIED",
  ],
  stoppingReason: final
    ? "DELIVERY_AUTHORITY_DENIED"
    : "INITIAL_AUTHORITY_DENIED",
  diagnostic: {
    code: final
      ? "RETRIEVE_INFORMATION_V3_DELIVERY_DENIED"
      : "RETRIEVE_INFORMATION_V3_DENIED",
  },
});

const deadlineLeg = (
  leg: RetrieveInformationV3Request["legs"][number],
  code = "DEADLINE_NOT_STARTED",
): RetrievalV3LegReport => ({
  legId: leg.legId,
  surfaceRef: leg.surfaceRef,
  mode: leg.mode,
  obligation: leg.obligation,
  coverage: {
    measurement: "UNKNOWN",
    completeness: "PARTIAL",
    observedItems: 0,
  },
  freshness: { state: "UNKNOWN" },
  failures: [{ code }],
  deliveredItems: 0,
});

const deadlineReport = (
  request: RetrieveInformationV3Request,
  authorityRef: string,
  asOf: string,
  reports?: readonly RetrievalV3LegReport[],
): RetrieveInformationV3Report => ({
  schemaVersion: 3,
  contract: "curiosity.retrieval/retrieve-information-report/v3",
  status: "OK",
  requestId: request.requestId,
  authorityRef,
  asOf,
  strata: [],
  legs: reports ?? request.legs.map((leg) => deadlineLeg(leg)),
  partial: true,
  residualUncertainty: ["DEADLINE_EXHAUSTED"],
  stoppingReason: "DEADLINE_EXHAUSTED",
});

const strata = (legId: string, items: readonly RetrievalV3Result[]) =>
  (
    ["source-observation", "custodied-evidence", "active-assertion"] as const
  ).flatMap((kind) => {
    const selected = items.filter((item) => item.recordKind === kind);
    return selected.length
      ? [
          {
            stratumId: `${legId}:${kind}`,
            legId,
            epistemicKind: kind,
            items: selected,
          },
        ]
      : [];
  });

const adapterFor = (
  dependencies: Dependencies,
  surfaceRef: RetrieveInformationV3Request["legs"][number]["surfaceRef"],
): RetrievalAdapterV3 => {
  if (surfaceRef === dependencies.owned.surfaceRef) return dependencies.owned;
  if (surfaceRef === dependencies.memory.surfaceRef) return dependencies.memory;
  return dependencies.mcp;
};

const minimal = (
  request: RetrieveInformationV3Request,
  authorityRef: string,
  asOf: string,
): RetrieveInformationV3Report => ({
  schemaVersion: 3,
  contract: "curiosity.retrieval/retrieve-information-report/v3",
  status: "OK",
  requestId: request.requestId,
  authorityRef,
  asOf,
  strata: [],
  legs: [],
  partial: true,
  residualUncertainty: ["OUTPUT_BUDGET_EXHAUSTED"],
  stoppingReason: "OUTPUT_BUDGET_EXHAUSTED",
});

const within = (
  report: RetrieveInformationV3Report,
  request: RetrieveInformationV3Request,
): boolean => {
  const measured = measureRetrieveInformationV3Report(report);
  return (
    measured.utf8Bytes <= request.budget.maxUtf8Bytes &&
    measured.nodes <= request.budget.maxNodes
  );
};

const prefix = (
  executions: readonly LegExecutionV3[],
  maximum: number,
): LegExecutionV3[] => {
  let remaining = maximum;
  return executions.map((execution) => {
    const items = execution.items.slice(0, remaining);
    remaining -= items.length;
    const omitted = items.length !== execution.items.length;
    return {
      items,
      report: {
        ...execution.report,
        deliveredItems: items.length,
        coverage: omitted
          ? { ...execution.report.coverage, completeness: "PARTIAL" }
          : execution.report.coverage,
        failures: omitted
          ? [...execution.report.failures, { code: "OUTPUT_BUDGET_EXHAUSTED" }]
          : execution.report.failures,
      },
    };
  });
};

export const createRetrieveInformationV3 =
  (dependencies: Dependencies) =>
  async (input: unknown): Promise<RetrieveInformationV3Report> => {
    const request = decodeRetrieveInformationV3Request(input);
    const startedAt = dependencies.now();
    if (
      request.budget.deadlineUnixMs - Date.parse(startedAt) >
      RETRIEVAL_V3_LIMITS.deadlineHorizonMs
    )
      throw new Error("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
    const monotonic = dependencies.monotonicNow ?? (() => performance.now());
    let previous = monotonic();
    const deadline =
      previous +
      Math.max(0, request.budget.deadlineUnixMs - Date.parse(startedAt));

    const remaining = (): number => {
      const current = monotonic();
      if (current < previous) return -1;
      previous = current;
      if (Date.parse(startedAt) > request.budget.deadlineUnixMs) return -1;
      return deadline - current;
    };

    const timed = async <T>(
      invoke: (signal: AbortSignal) => Promise<T>,
    ): Promise<TimedOutcome<T>> => {
      const available = remaining();
      if (available < 0) return { status: "TIMEOUT" };
      const abort = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<TimedOutcome<T>>((resolve) => {
        timer = setTimeout(() => {
          abort.abort();
          resolve({ status: "TIMEOUT" });
        }, available);
      });
      const operation: Promise<TimedOutcome<T>> = Promise.resolve()
        .then(() => invoke(abort.signal))
        .then(
          (value) => ({ status: "SETTLED", value }),
          () => ({ status: "FAILED" }),
        ) as Promise<TimedOutcome<T>>;
      const outcome = await Promise.race([operation, timeout]);
      if (timer !== undefined) clearTimeout(timer);
      return outcome.status === "SETTLED" && remaining() < 0
        ? { status: "TIMEOUT" }
        : outcome;
    };

    const deliver = (
      report: RetrieveInformationV3Report,
    ): RetrieveInformationV3Report => {
      const selected = within(report, request)
        ? report
        : minimal(request, report.authorityRef, report.asOf);
      if (!within(selected, request))
        throw new Error("RETRIEVE_INFORMATION_V3_MINIMUM_BUDGET_INVALID");
      return decodeRetrieveInformationV3Report(selected, {
        maxResults: request.budget.maxResults,
      });
    };

    if (remaining() < 0)
      return deliver(
        deadlineReport(request, "authority:withheld", dependencies.now()),
      );

    const initial = await timed((signal) =>
      dependencies.authority.authorize({ ...request, signal }),
    );
    if (initial.status === "TIMEOUT")
      return deliver(
        deadlineReport(request, "authority:withheld", dependencies.now()),
      );
    if (initial.status === "FAILED")
      return deliver(
        denied(request, "authority:withheld", dependencies.now(), false),
      );
    const decision = initial.value;
    if (decision.decision === "DENY")
      return deliver(
        denied(request, decision.authorityRef, dependencies.now(), false),
      );

    const prepared: Array<{
      readonly adapter: RetrievalAdapterV3;
      readonly preparation: unknown;
      readonly leg: RetrieveInformationV3Request["legs"][number];
    }> = [];
    for (const leg of request.legs) {
      const adapter = adapterFor(dependencies, leg.surfaceRef);
      const outcome = await timed((signal) =>
        adapter.prepare({
          question: request.objective.question,
          leg,
          deadlineUnixMs: request.budget.deadlineUnixMs,
          wallNow: dependencies.now,
          checkDeadline: () => remaining() >= 0,
          signal,
        }),
      );
      if (outcome.status === "TIMEOUT")
        return deliver(
          deadlineReport(request, decision.authorityRef, dependencies.now()),
        );
      prepared.push({
        adapter,
        leg,
        preparation:
          outcome.status === "FAILED"
            ? unavailableV3Execution(leg, "LEG_PREPARE_UNAVAILABLE")
            : outcome.value,
      });
    }

    const executions: LegExecutionV3[] = [];
    for (const value of prepared) {
      if ((value.preparation as LegExecutionV3).report) {
        executions.push(value.preparation as LegExecutionV3);
        continue;
      }
      const outcome = await timed((signal) =>
        value.adapter.finalize(value.preparation, {
          question: request.objective.question,
          leg: value.leg,
          deadlineUnixMs: request.budget.deadlineUnixMs,
          wallNow: dependencies.now,
          checkDeadline: () => remaining() >= 0,
          signal,
        }),
      );
      if (outcome.status === "TIMEOUT")
        return deliver(
          deadlineReport(
            request,
            decision.authorityRef,
            dependencies.now(),
            executions
              .map(({ report }) => ({ ...report, deliveredItems: 0 }))
              .concat(
                request.legs
                  .slice(executions.length)
                  .map((leg) => deadlineLeg(leg)),
              ),
          ),
        );
      executions.push(
        outcome.status === "FAILED"
          ? unavailableV3Execution(value.leg, "LEG_FINALIZE_UNAVAILABLE")
          : outcome.value,
      );
    }

    // This is deliberately the final await. Composition, bounds, decoding, and return below are synchronous.
    const final = await timed((signal) =>
      dependencies.authority.revalidateDelivery({
        authorityRef: decision.authorityRef,
        authenticatedContextRef: request.authenticatedContextRef,
        purpose: request.purpose,
        requestId: request.requestId,
        signal,
      }),
    );
    if (final.status === "TIMEOUT")
      return deliver(
        deadlineReport(request, decision.authorityRef, dependencies.now()),
      );
    if (final.status === "FAILED" || final.value.decision === "DENY")
      return deliver(
        denied(request, decision.authorityRef, dependencies.now(), true),
      );

    const requiredUnavailable = executions.some(
      ({ report }) =>
        report.obligation === "REQUIRED" &&
        report.failures.some(({ code }) => code !== "OUTPUT_BUDGET_EXHAUSTED"),
    );
    const asOf = dependencies.now();
    const compose = (
      selected: readonly LegExecutionV3[],
    ): RetrieveInformationV3Report => {
      const legs = selected.map(({ report }) =>
        requiredUnavailable ? { ...report, deliveredItems: 0 } : report,
      );
      return {
        schemaVersion: 3,
        contract: "curiosity.retrieval/retrieve-information-report/v3",
        status: "OK",
        requestId: request.requestId,
        authorityRef: decision.authorityRef,
        asOf,
        strata: requiredUnavailable
          ? []
          : selected.flatMap((execution) =>
              strata(execution.report.legId, execution.items),
            ),
        legs,
        partial: legs.some(
          (leg) =>
            leg.coverage.completeness !== "COMPLETE" || leg.failures.length > 0,
        ),
        residualUncertainty: [
          ...legs.flatMap((leg) => [
            ...(leg.coverage.measurement === "UNKNOWN"
              ? [`${leg.legId.toUpperCase()}_COVERAGE_UNKNOWN`]
              : []),
            ...(leg.failures.length
              ? [`${leg.legId.toUpperCase()}_PARTIAL_FAILURE`]
              : []),
          ]),
          ...(requiredUnavailable ? ["REQUIRED_LEG_UNAVAILABLE"] : []),
        ],
        stoppingReason: requiredUnavailable
          ? "REQUIRED_LEG_UNAVAILABLE"
          : "DECLARED_LEGS_COMPLETED",
      };
    };

    if (requiredUnavailable)
      return deliver(
        compose(executions.map((execution) => ({ ...execution, items: [] }))),
      );
    const count = Math.min(
      request.budget.maxResults,
      executions.reduce((sum, execution) => sum + execution.items.length, 0),
    );
    let selected: RetrieveInformationV3Report | undefined;
    for (let size = 0; size <= count; size += 1) {
      const candidate = compose(prefix(executions, size));
      if (within(candidate, request)) selected = candidate;
    }
    return deliver(selected ?? minimal(request, decision.authorityRef, asOf));
  };
