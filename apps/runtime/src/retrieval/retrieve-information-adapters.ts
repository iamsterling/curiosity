import type {
  RepositoryOutcome,
  RepositoryRequest,
} from "../repository-search.js";
import type {
  ActiveAssertion,
  CustodiedEvidence,
  LegReport,
  RetrievalLeg,
  RetrievalResult,
  SourceObservation,
} from "./retrieve-information-contracts.js";
import { truncateUtf8 } from "./validation.js";

export interface LegExecutionContext {
  readonly question: string;
  readonly leg: RetrievalLeg;
  readonly deadlineUnixMs: number;
  readonly wallNow: () => string;
  readonly checkDeadline: () => boolean;
}
export interface LegExecution {
  readonly report: LegReport;
  readonly items: readonly RetrievalResult[];
}
export interface LiveWebRetrievalPort {
  readonly surfaceSelector: RetrievalLeg["surfaceSelector"];
  retrieve(context: LegExecutionContext): Promise<LegExecution>;
}
export interface IndexedMemoryRetrievalPort {
  readonly surfaceSelector: RetrievalLeg["surfaceSelector"];
  prepare(context: LegExecutionContext): Promise<MemoryPreparation>;
  finalize(
    preparation: MemoryPreparation,
    context: LegExecutionContext,
  ): Promise<LegExecution>;
}

export type SearxngFixtureTransport = (input: {
  readonly question: string;
  readonly maxResults: number;
  readonly deadlineUnixMs: number;
}) => Promise<RepositoryOutcome>;

export class SearxngLiveAdapter implements LiveWebRetrievalPort {
  readonly surfaceSelector = "public-web/searxng-gateway" as const;
  constructor(private readonly transport: SearxngFixtureTransport) {}
  async retrieve(context: LegExecutionContext): Promise<LegExecution> {
    if (
      context.leg.surfaceSelector !== this.surfaceSelector ||
      context.leg.mode !== "LIVE"
    )
      throw new Error("RETRIEVE_INFORMATION_ADAPTER_MISMATCH");
    try {
      if (!context.checkDeadline())
        return deadlineExecution(
          context.leg,
          this.surfaceSelector,
          "DEADLINE_NOT_STARTED",
        );
      const outcome = await this.transport({
        question: context.question,
        maxResults: context.leg.maxResults,
        deadlineUnixMs: context.deadlineUnixMs,
      });
      if (!context.checkDeadline())
        return deadlineExecution(
          context.leg,
          this.surfaceSelector,
          "DEADLINE_EXHAUSTED",
        );
      const observedAt = context.wallNow();
      const items: SourceObservation[] = outcome.results
        .slice(0, context.leg.maxResults)
        .map((item, index) => ({
          recordKind: "source-observation",
          observationId: `${context.leg.legId}:observation:${index + 1}`,
          title: truncateUtf8(item.title, 300),
          excerpt: truncateUtf8(item.content, 2_000),
          sourceLocator: item.url,
          observedAt,
          nativeRank: {
            namespace: "org.searxng.providers/v1",
            labels: item.provenance.slice(0, 8),
          },
          trust: "untrusted-source-observation",
        }));
      const failures = outcome.partialFailures
        .slice(0, 16)
        .map(() => ({ code: "SOURCE_PARTIAL_FAILURE" }));
      return {
        items,
        report: {
          legId: context.leg.legId,
          surfaceSelector: this.surfaceSelector,
          mode: "LIVE",
          obligation: context.leg.obligation,
          coverage: {
            measurement: "UNKNOWN",
            completeness: failures.length ? "PARTIAL" : "UNKNOWN",
            observedItems: items.length,
          },
          freshness: { state: "CURRENT", observedAt },
          failures,
          deliveredItems: items.length,
        },
      };
    } catch {
      if (!context.checkDeadline())
        return deadlineExecution(
          context.leg,
          this.surfaceSelector,
          "DEADLINE_EXHAUSTED",
        );
      return {
        items: [],
        report: {
          legId: context.leg.legId,
          surfaceSelector: this.surfaceSelector,
          mode: "LIVE",
          obligation: context.leg.obligation,
          coverage: {
            measurement: "UNKNOWN",
            completeness: "PARTIAL",
            observedItems: 0,
          },
          freshness: { state: "UNKNOWN" },
          failures: [{ code: "SOURCE_UNAVAILABLE" }],
          deliveredItems: 0,
        },
      };
    }
  }
}

type FixtureLifecycle = {
  readonly custody: "DURABLE" | "PROVISIONAL";
  readonly assertion: "ACTIVE" | "PENDING";
  readonly queryEligibility: "ELIGIBLE" | "SUPPRESSED";
  readonly authorizationFreshness: "CURRENT" | "STALE" | "UNKNOWN" | "REVOKED";
  readonly validation: "CURRENT" | "STALE";
  readonly deletion: "LIVE" | "TOMBSTONED";
};
export interface DevelopmentMemoryFixture {
  readonly id: string;
  readonly recordKind: "custodied-evidence" | "active-assertion";
  readonly title: string;
  readonly excerpt: string;
  readonly sourceLocator: string;
  readonly observedAt: string;
  readonly evidenceId: string;
  readonly committedCaptureRef: string;
  readonly representationRef: string;
  readonly spanRef: string;
  readonly receiptRef: string;
  readonly assertionId?: string;
  readonly beliefRevisionRef?: string;
  readonly evidenceSetRef?: string;
  readonly validationPolicyRef: string;
  readonly validationDecisionRef: string;
  readonly lifecycle: FixtureLifecycle;
  readonly rightsClearance: "PROJECT_AUTHORED_CC0_FIXTURE";
}
export interface DevelopmentMemoryAdapterHooks {
  readonly observe?: (
    event:
      | "memory-projection-read"
      | "memory-hydration-read"
      | "memory-final-state-check",
  ) => void | Promise<void>;
}
const eligible = (fixture: DevelopmentMemoryFixture): boolean =>
  fixture.lifecycle.custody === "DURABLE" &&
  fixture.lifecycle.queryEligibility === "ELIGIBLE" &&
  fixture.lifecycle.authorizationFreshness === "CURRENT" &&
  fixture.lifecycle.validation === "CURRENT" &&
  fixture.lifecycle.deletion === "LIVE" &&
  (fixture.recordKind !== "active-assertion" ||
    fixture.lifecycle.assertion === "ACTIVE");

export interface MemoryPreparation {
  readonly kind: "memory-preparation";
  readonly ids: readonly string[];
  readonly report: LegReport;
}

const memoryReport = (
  leg: RetrievalLeg,
  observedAt: string,
  failures: readonly { code: string }[],
  observedItems = 0,
): LegReport => ({
  legId: leg.legId,
  surfaceSelector: "development-memory/evidence",
  mode: "INDEXED",
  obligation: leg.obligation,
  coverage: {
    measurement: failures.length ? "UNKNOWN" : "MEASURED",
    completeness: failures.length ? "PARTIAL" : "COMPLETE",
    observedItems,
  },
  freshness: failures.length
    ? { state: "UNKNOWN" }
    : { state: "CURRENT", observedAt },
  failures,
  deliveredItems: 0,
});

const deadlineExecution = (
  leg: RetrievalLeg,
  surfaceSelector: RetrievalLeg["surfaceSelector"],
  code: string,
): LegExecution => ({
  items: [],
  report: {
    legId: leg.legId,
    surfaceSelector,
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

export class DevelopmentMemoryIndexedAdapter implements IndexedMemoryRetrievalPort {
  readonly surfaceSelector = "development-memory/evidence" as const;
  constructor(
    private readonly fixtures: DevelopmentMemoryFixture[],
    private readonly hooks: DevelopmentMemoryAdapterHooks = {},
  ) {}
  async prepare(context: LegExecutionContext): Promise<MemoryPreparation> {
    if (
      context.leg.surfaceSelector !== this.surfaceSelector ||
      context.leg.mode !== "INDEXED"
    )
      throw new Error("RETRIEVE_INFORMATION_ADAPTER_MISMATCH");
    if (!context.checkDeadline())
      return {
        kind: "memory-preparation",
        ids: [],
        report: memoryReport(context.leg, context.wallNow(), [
          { code: "DEADLINE_NOT_STARTED" },
        ]),
      };
    let selected: string[];
    try {
      await this.hooks.observe?.("memory-projection-read");
      if (!context.checkDeadline())
        return {
          kind: "memory-preparation",
          ids: [],
          report: memoryReport(context.leg, context.wallNow(), [
            { code: "DEADLINE_EXHAUSTED" },
          ]),
        };
      const tokens = context.question.toLowerCase().match(/[a-z0-9]+/gu) ?? [];
      selected = this.fixtures
        .filter((item) =>
          tokens.some((token) =>
            `${item.title} ${item.excerpt}`.toLowerCase().includes(token),
          ),
        )
        .slice(0, context.leg.maxResults)
        .map(({ id }) => id);
    } catch {
      if (!context.checkDeadline())
        return {
          kind: "memory-preparation",
          ids: [],
          report: memoryReport(context.leg, context.wallNow(), [
            { code: "DEADLINE_EXHAUSTED" },
          ]),
        };
      return {
        kind: "memory-preparation",
        ids: [],
        report: memoryReport(context.leg, context.wallNow(), [
          { code: "MEMORY_PROJECTION_UNAVAILABLE" },
        ]),
      };
    }
    const hydrated: string[] = [];
    for (const id of selected) {
      try {
        if (!context.checkDeadline())
          return {
            kind: "memory-preparation",
            ids: [],
            report: memoryReport(context.leg, context.wallNow(), [
              { code: "DEADLINE_EXHAUSTED" },
            ]),
          };
        await this.hooks.observe?.("memory-hydration-read");
        if (!context.checkDeadline())
          return {
            kind: "memory-preparation",
            ids: [],
            report: memoryReport(context.leg, context.wallNow(), [
              { code: "DEADLINE_EXHAUSTED" },
            ]),
          };
        if (this.fixtures.some((fixture) => fixture.id === id))
          hydrated.push(id);
      } catch {
        if (!context.checkDeadline())
          return {
            kind: "memory-preparation",
            ids: [],
            report: memoryReport(context.leg, context.wallNow(), [
              { code: "DEADLINE_EXHAUSTED" },
            ]),
          };
        return {
          kind: "memory-preparation",
          ids: [],
          report: memoryReport(context.leg, context.wallNow(), [
            { code: "MEMORY_HYDRATION_UNAVAILABLE" },
          ]),
        };
      }
    }
    return {
      kind: "memory-preparation",
      ids: hydrated,
      report: memoryReport(context.leg, context.wallNow(), [], hydrated.length),
    };
  }

  async finalize(
    preparation: MemoryPreparation,
    context: LegExecutionContext,
  ): Promise<LegExecution> {
    const failures: { code: string }[] = [];
    const items: RetrievalResult[] = [];
    for (const id of preparation.ids) {
      let current: DevelopmentMemoryFixture | undefined;
      try {
        if (!context.checkDeadline())
          return deadlineExecution(
            context.leg,
            this.surfaceSelector,
            "DEADLINE_EXHAUSTED",
          );
        await this.hooks.observe?.("memory-final-state-check");
        if (!context.checkDeadline())
          return deadlineExecution(
            context.leg,
            this.surfaceSelector,
            "DEADLINE_EXHAUSTED",
          );
        current = this.fixtures.find((fixture) => fixture.id === id);
      } catch {
        if (!context.checkDeadline())
          return deadlineExecution(
            context.leg,
            this.surfaceSelector,
            "DEADLINE_EXHAUSTED",
          );
        failures.push({ code: "MEMORY_FINAL_CHECK_UNAVAILABLE" });
        continue;
      }
      try {
        if (!current || !eligible(current)) {
          failures.push({ code: "FINAL_STATE_SUPPRESSED" });
          continue;
        }
        const common = {
          evidenceId: current.evidenceId,
          title: truncateUtf8(current.title, 300),
          excerpt: truncateUtf8(current.excerpt, 2_000),
          sourceLocator: current.sourceLocator,
          observedAt: current.observedAt,
          committedCaptureRef: current.committedCaptureRef,
          representationRef: current.representationRef,
          spanRef: current.spanRef,
          receiptRef: current.receiptRef,
          lifecycle: {
            custody: "DURABLE",
            assertion:
              current.recordKind === "active-assertion"
                ? "ACTIVE"
                : "NOT_APPLICABLE",
            queryEligibility: "ELIGIBLE",
            authorizationFreshness: "CURRENT",
            validation: "CURRENT",
            deletion: "LIVE",
          } as const,
        };
        if (current.recordKind === "custodied-evidence") {
          items.push({
            ...common,
            recordKind: "custodied-evidence",
          } satisfies CustodiedEvidence);
          continue;
        }
        if (
          !current.assertionId ||
          !current.beliefRevisionRef ||
          !current.evidenceSetRef
        ) {
          failures.push({ code: "MEMORY_CONTRACT_INVALID" });
          continue;
        }
        items.push({
          ...common,
          recordKind: "active-assertion",
          assertionId: current.assertionId,
          beliefRevisionRef: current.beliefRevisionRef,
          evidenceSetRef: current.evidenceSetRef,
          validationPolicyRef: current.validationPolicyRef,
          validationDecisionRef: current.validationDecisionRef,
        } satisfies ActiveAssertion);
      } catch {
        failures.push({ code: "MEMORY_FINAL_CHECK_UNAVAILABLE" });
      }
    }
    const allFailures = [...preparation.report.failures, ...failures];
    return {
      items,
      report: {
        ...preparation.report,
        coverage: {
          ...preparation.report.coverage,
          measurement: allFailures.length
            ? "UNKNOWN"
            : preparation.report.coverage.measurement,
          completeness: allFailures.length
            ? "PARTIAL"
            : preparation.report.coverage.completeness,
        },
        failures: allFailures,
        freshness: allFailures.length
          ? { state: "UNKNOWN" }
          : { state: "CURRENT", observedAt: context.wallNow() },
        deliveredItems: items.length,
      },
    };
  }
}

// Compile-time proof that the adapter does not inherit the current network transport API.
const _transportBoundary: SearxngFixtureTransport = async (_input) => ({
  results: [],
  partialFailures: [],
});
void _transportBoundary;
type _NoRepositoryRequestLeak =
  RepositoryRequest extends Parameters<SearxngFixtureTransport>[0]
    ? false
    : true;
const _noRepositoryRequestLeak: _NoRepositoryRequestLeak = true;
void _noRepositoryRequestLeak;
