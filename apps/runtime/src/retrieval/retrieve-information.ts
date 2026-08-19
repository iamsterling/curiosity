import {
  decodeRetrieveInformationReport,
  decodeRetrieveInformationRequest,
} from "./retrieve-information-decoder.js";
import type {
  EpistemicKind,
  RetrieveInformationReport,
  RetrieveInformationRequest,
  RetrievalResult,
} from "./retrieve-information-contracts.js";
import {
  DevelopmentMemoryIndexedAdapter,
  SearxngLiveAdapter,
  type DevelopmentMemoryFixture,
  type LegExecution,
  type LegExecutionContext,
  type MemoryPreparation,
} from "./retrieve-information-adapters.js";

export {
  decodeRetrieveInformationReport,
  decodeRetrieveInformationRequest,
} from "./retrieve-information-decoder.js";
export {
  DevelopmentMemoryIndexedAdapter,
  SearxngLiveAdapter,
} from "./retrieve-information-adapters.js";
export type { DevelopmentMemoryFixture } from "./retrieve-information-adapters.js";
export type {
  RetrieveInformationReport,
  RetrieveInformationRequest,
} from "./retrieve-information-contracts.js";

export interface AuthorityPolicyPort {
  authorize(
    context: Pick<
      RetrieveInformationRequest,
      | "authenticatedContextRef"
      | "purpose"
      | "objective"
      | "validAsOf"
      | "knownAsOf"
      | "legs"
      | "budget"
    >,
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
  }): Promise<{ readonly decision: "ALLOW" | "DENY" }>;
}
interface Dependencies {
  readonly authority: AuthorityPolicyPort;
  readonly web: SearxngLiveAdapter;
  readonly memory: DevelopmentMemoryIndexedAdapter;
  readonly now: () => string;
  /** Injectable elapsed-time source; production semantics are not claimed. */
  readonly monotonicNow?: () => number;
}
const denied = (
  request: RetrieveInformationRequest,
  authorityRef: string,
  asOf: string,
  final: boolean,
): RetrieveInformationReport => ({
  schemaVersion: 2,
  contract: "curiosity.retrieval/retrieve-information-report/v2",
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
      ? "RETRIEVE_INFORMATION_DELIVERY_DENIED"
      : "RETRIEVE_INFORMATION_DENIED",
  },
});
const strata = (legId: string, items: readonly RetrievalResult[]) => {
  const kinds: EpistemicKind[] = [
    "source-observation",
    "custodied-evidence",
    "remembered-belief",
    "active-assertion",
  ];
  return kinds.flatMap((epistemicKind) => {
    const selected = items.filter((item) => item.recordKind === epistemicKind);
    return selected.length
      ? [
          {
            stratumId: `${legId}:${epistemicKind}`,
            legId,
            epistemicKind,
            items: selected,
          },
        ]
      : [];
  });
};

const measureClosedValue = (
  input: unknown,
): { readonly utf8Bytes: number; readonly nodes: number } => {
  let nodes = 0;
  const visit = (value: unknown): void => {
    nodes += 1;
    if (Array.isArray(value)) for (const item of value) visit(item);
    else if (value && typeof value === "object")
      for (const item of Object.values(value)) {
        nodes += 1;
        visit(item);
      }
  };
  visit(input);
  return { utf8Bytes: Buffer.byteLength(JSON.stringify(input)), nodes };
};

export const measureRetrievalResult = (
  input: RetrievalResult,
): { readonly utf8Bytes: number; readonly nodes: number } =>
  measureClosedValue(input);

export const measureRetrieveInformationReport = (
  input: RetrieveInformationReport,
): { readonly utf8Bytes: number; readonly nodes: number } =>
  measureClosedValue(input);

const deadlineLeg = (leg: RetrieveInformationRequest["legs"][number]) => ({
  legId: leg.legId,
  surfaceSelector: leg.surfaceSelector,
  mode: leg.mode,
  obligation: leg.obligation,
  coverage: {
    measurement: "UNKNOWN" as const,
    completeness: "PARTIAL" as const,
    observedItems: 0,
  },
  freshness: { state: "UNKNOWN" as const },
  failures: [{ code: "DEADLINE_NOT_STARTED" }],
  deliveredItems: 0,
});
const unavailableExecution = (
  leg: RetrieveInformationRequest["legs"][number],
  code:
    | "WEB_RETRIEVE_UNAVAILABLE"
    | "MEMORY_PREPARE_UNAVAILABLE"
    | "MEMORY_FINALIZE_UNAVAILABLE",
): LegExecution => ({
  items: [],
  report: {
    legId: leg.legId,
    surfaceSelector: leg.surfaceSelector,
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
  },
});

const hasDeadlineFailure = (execution: {
  readonly report: { readonly failures: readonly { readonly code: string }[] };
}): boolean =>
  execution.report.failures.some(({ code }) => code.startsWith("DEADLINE_"));
const withoutDelivery = (executions: readonly LegExecution[]) => {
  const hasFailure = executions.some(hasDeadlineFailure);
  return executions.map(({ report }, index) => ({
    ...report,
    deliveredItems: 0,
    failures:
      !hasFailure && index === executions.length - 1
        ? [...report.failures, { code: "DEADLINE_EXHAUSTED" }]
        : report.failures,
  }));
};

const prefixExecutions = (
  executions: readonly LegExecution[],
  prefixLength: number,
): LegExecution[] => {
  let remaining = prefixLength;
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
        failures:
          omitted &&
          !execution.report.failures.some(
            ({ code }) => code === "OUTPUT_BUDGET_EXHAUSTED",
          )
            ? [
                ...execution.report.failures,
                { code: "OUTPUT_BUDGET_EXHAUSTED" },
              ]
            : execution.report.failures,
      },
    };
  });
};

const withinReportBudget = (
  report: RetrieveInformationReport,
  budget: RetrieveInformationRequest["budget"],
): boolean => {
  const measured = measureRetrieveInformationReport(report);
  return (
    measured.utf8Bytes <= budget.maxUtf8Bytes &&
    measured.nodes <= budget.maxNodes
  );
};

const minimalBudgetReport = (
  request: RetrieveInformationRequest,
  authorityRef: string,
  asOf: string,
): RetrieveInformationReport => ({
  schemaVersion: 2,
  contract: "curiosity.retrieval/retrieve-information-report/v2",
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

export const createRetrieveInformation =
  (dependencies: Dependencies) =>
  async (input: unknown): Promise<RetrieveInformationReport> => {
    const request = decodeRetrieveInformationRequest(input);
    const deliver = (
      report: RetrieveInformationReport,
    ): RetrieveInformationReport => {
      const selected = withinReportBudget(report, request.budget)
        ? report
        : minimalBudgetReport(request, report.authorityRef, report.asOf);
      if (!withinReportBudget(selected, request.budget))
        throw new Error("RETRIEVE_INFORMATION_MINIMUM_BUDGET_INVALID");
      return decodeRetrieveInformationReport(selected);
    };
    const startedAt = dependencies.now();
    const monotonic = dependencies.monotonicNow ?? (() => performance.now());
    let lastMonotonic = monotonic();
    const expiredAtStart =
      request.budget.deadlineUnixMs < Date.parse(startedAt);
    const monotonicDeadline =
      lastMonotonic +
      Math.max(0, request.budget.deadlineUnixMs - Date.parse(startedAt));
    const checkDeadline = (): boolean => {
      const current = monotonic();
      if (expiredAtStart || current < lastMonotonic) return false;
      lastMonotonic = current;
      return current <= monotonicDeadline;
    };
    const contextFor = (
      leg: RetrieveInformationRequest["legs"][number],
    ): LegExecutionContext => ({
      question: request.objective.question,
      leg,
      deadlineUnixMs: request.budget.deadlineUnixMs,
      wallNow: dependencies.now,
      checkDeadline,
    });
    if (!checkDeadline())
      return deliver({
        schemaVersion: 2,
        contract: "curiosity.retrieval/retrieve-information-report/v2",
        status: "OK",
        requestId: request.requestId,
        authorityRef: "authority:withheld",
        asOf: dependencies.now(),
        strata: [],
        legs: request.legs.map(deadlineLeg),
        partial: true,
        residualUncertainty: ["DEADLINE_EXHAUSTED"],
        stoppingReason: "DEADLINE_EXHAUSTED",
      });
    const decision = await dependencies.authority.authorize(request);
    if (!checkDeadline())
      return deliver({
        schemaVersion: 2,
        contract: "curiosity.retrieval/retrieve-information-report/v2",
        status: "OK",
        requestId: request.requestId,
        authorityRef: decision.authorityRef,
        asOf: dependencies.now(),
        strata: [],
        legs: request.legs.map(deadlineLeg),
        partial: true,
        residualUncertainty: ["DEADLINE_EXHAUSTED"],
        stoppingReason: "DEADLINE_EXHAUSTED",
      });
    if (decision.decision !== "ALLOW")
      return deliver(
        denied(request, decision.authorityRef, dependencies.now(), false),
      );
    const executions: LegExecution[] = [];
    let memoryPreparation:
      | {
          readonly preparation: MemoryPreparation;
          readonly context: LegExecutionContext;
        }
      | undefined;
    let deadlineExpired = false;
    for (const [index, leg] of request.legs.entries()) {
      if (!checkDeadline()) {
        deadlineExpired = true;
        for (const pending of request.legs.slice(index))
          executions.push({ items: [], report: deadlineLeg(pending) });
        break;
      }
      const context = contextFor(leg);
      if (leg.surfaceSelector === dependencies.web.surfaceSelector) {
        let execution: LegExecution;
        try {
          execution = await dependencies.web.retrieve(context);
        } catch {
          execution = checkDeadline()
            ? unavailableExecution(leg, "WEB_RETRIEVE_UNAVAILABLE")
            : { items: [], report: deadlineLeg(leg) };
        }
        executions.push(execution);
        if (!checkDeadline() || hasDeadlineFailure(execution))
          deadlineExpired = true;
      } else {
        let preparation: MemoryPreparation;
        let finalizable = true;
        try {
          preparation = await dependencies.memory.prepare(context);
        } catch {
          finalizable = false;
          preparation = {
            kind: "memory-preparation",
            ids: [],
            report: checkDeadline()
              ? unavailableExecution(leg, "MEMORY_PREPARE_UNAVAILABLE").report
              : deadlineLeg(leg),
          };
        }
        executions.push({ items: [], report: preparation.report });
        if (finalizable) memoryPreparation = { preparation, context };
        if (!checkDeadline() || hasDeadlineFailure(preparation))
          deadlineExpired = true;
      }
      if (deadlineExpired) {
        for (const pending of request.legs.slice(index + 1))
          executions.push({ items: [], report: deadlineLeg(pending) });
        break;
      }
    }
    if (deadlineExpired)
      return deliver({
        schemaVersion: 2,
        contract: "curiosity.retrieval/retrieve-information-report/v2",
        status: "OK",
        requestId: request.requestId,
        authorityRef: decision.authorityRef,
        asOf: dependencies.now(),
        strata: [],
        legs: withoutDelivery(executions),
        partial: true,
        residualUncertainty: ["DEADLINE_EXHAUSTED"],
        stoppingReason: "DEADLINE_EXHAUSTED",
      });
    if (!checkDeadline())
      return deliver({
        schemaVersion: 2,
        contract: "curiosity.retrieval/retrieve-information-report/v2",
        status: "OK",
        requestId: request.requestId,
        authorityRef: decision.authorityRef,
        asOf: dependencies.now(),
        strata: [],
        legs: withoutDelivery(executions),
        partial: true,
        residualUncertainty: ["DEADLINE_EXHAUSTED"],
        stoppingReason: "DEADLINE_EXHAUSTED",
      });
    const final = await dependencies.authority.revalidateDelivery({
      authorityRef: decision.authorityRef,
      authenticatedContextRef: request.authenticatedContextRef,
      purpose: request.purpose,
      requestId: request.requestId,
    });
    if (!checkDeadline())
      return deliver({
        schemaVersion: 2,
        contract: "curiosity.retrieval/retrieve-information-report/v2",
        status: "OK",
        requestId: request.requestId,
        authorityRef: decision.authorityRef,
        asOf: dependencies.now(),
        strata: [],
        legs: withoutDelivery(executions),
        partial: true,
        residualUncertainty: ["DEADLINE_EXHAUSTED"],
        stoppingReason: "DEADLINE_EXHAUSTED",
      });
    if (final.decision !== "ALLOW")
      return deliver(
        denied(request, decision.authorityRef, dependencies.now(), true),
      );
    if (memoryPreparation) {
      let finalized: LegExecution;
      try {
        finalized = await dependencies.memory.finalize(
          memoryPreparation.preparation,
          memoryPreparation.context,
        );
      } catch {
        finalized = checkDeadline()
          ? unavailableExecution(
              memoryPreparation.context.leg,
              "MEMORY_FINALIZE_UNAVAILABLE",
            )
          : { items: [], report: deadlineLeg(memoryPreparation.context.leg) };
      }
      const index = executions.findIndex(
        ({ report }) => report.legId === memoryPreparation!.context.leg.legId,
      );
      executions[index] = finalized;
      if (!checkDeadline() || hasDeadlineFailure(finalized))
        return deliver({
          schemaVersion: 2,
          contract: "curiosity.retrieval/retrieve-information-report/v2",
          status: "OK",
          requestId: request.requestId,
          authorityRef: decision.authorityRef,
          asOf: dependencies.now(),
          strata: [],
          legs: withoutDelivery(executions),
          partial: true,
          residualUncertainty: ["DEADLINE_EXHAUSTED"],
          stoppingReason: "DEADLINE_EXHAUSTED",
        });
    }
    const requiredUnavailable = executions
      .map(({ report }) => report)
      .some(
        (leg) =>
          leg.obligation === "REQUIRED" &&
          leg.failures.some(({ code }) => code !== "OUTPUT_BUDGET_EXHAUSTED"),
      );
    const asOf = dependencies.now();
    const compose = (
      selected: readonly LegExecution[],
    ): RetrieveInformationReport => {
      const legReports = requiredUnavailable
        ? selected.map(({ report }) => ({ ...report, deliveredItems: 0 }))
        : selected.map(({ report }) => report);
      return {
        schemaVersion: 2,
        contract: "curiosity.retrieval/retrieve-information-report/v2",
        status: "OK",
        requestId: request.requestId,
        authorityRef: decision.authorityRef,
        asOf,
        strata: requiredUnavailable
          ? []
          : selected.flatMap((execution, index) =>
              strata(request.legs[index]!.legId, execution.items),
            ),
        legs: legReports,
        partial: legReports.some(
          (leg) =>
            leg.coverage.completeness !== "COMPLETE" || leg.failures.length > 0,
        ),
        residualUncertainty: [
          ...legReports.flatMap((leg) => [
            ...(leg.coverage.measurement === "UNKNOWN"
              ? [
                  leg.surfaceSelector.startsWith("public-web/")
                    ? "WEB_COVERAGE_UNKNOWN"
                    : "MEMORY_COVERAGE_UNKNOWN",
                ]
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
    const totalItems = executions.reduce(
      (sum, execution) => sum + execution.items.length,
      0,
    );
    const maximumPrefix = Math.min(totalItems, request.budget.maxResults);
    let selected: RetrieveInformationReport | undefined;
    for (let prefix = 0; prefix <= maximumPrefix; prefix += 1) {
      const candidate = compose(prefixExecutions(executions, prefix));
      if (withinReportBudget(candidate, request.budget)) selected = candidate;
    }
    return deliver(
      selected ?? minimalBudgetReport(request, decision.authorityRef, asOf),
    );
  };

export const projectRetrieveInformationReport = (
  report: RetrieveInformationReport,
): RetrieveInformationReport =>
  decodeRetrieveInformationReport(structuredClone(report));

// Keep fixture semantics explicit without importing plugin infrastructure across package direction.
const _developmentBoundary: DevelopmentMemoryFixture | undefined = undefined;
void _developmentBoundary;
