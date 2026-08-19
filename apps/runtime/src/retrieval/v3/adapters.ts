import type {
  ActiveAssertionV3,
  CustodiedEvidenceV3,
  McpSourceObservationV3,
  RetrievalV3Leg,
  RetrievalV3LegReport,
  RetrievalV3Result,
  SurfaceRef,
} from "./contracts.js";
import {
  consumeMcpCapability,
  type McpConsumerCapability,
} from "./mcp-receipt-bridge.js";

export interface LegContextV3 {
  readonly question: string;
  readonly leg: RetrievalV3Leg;
  readonly deadlineUnixMs: number;
  readonly wallNow: () => string;
  readonly checkDeadline: () => boolean;
  readonly signal: AbortSignal;
}
export interface LegExecutionV3 {
  readonly report: RetrievalV3LegReport;
  readonly items: readonly RetrievalV3Result[];
}
export interface RetrievalAdapterV3 {
  readonly surfaceRef: SurfaceRef;
  prepare(context: LegContextV3): Promise<unknown>;
  finalize(
    preparation: unknown,
    context: LegContextV3,
  ): Promise<LegExecutionV3>;
}
const truncate = (value: string, maximum: number): string => {
  const bytes = Buffer.from(value);
  if (bytes.byteLength <= maximum) return value;
  return new TextDecoder()
    .decode(bytes.subarray(0, maximum))
    .replace(/\uFFFD$/u, "");
};
const failed = (leg: RetrievalV3Leg, code: string): LegExecutionV3 => ({
  items: [],
  report: {
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
  },
});
const lifecycle = (assertion: "ACTIVE" | "NOT_APPLICABLE") =>
  ({
    custody: "DURABLE",
    assertion,
    queryEligibility: "ELIGIBLE",
    authorizationFreshness: "CURRENT",
    validation: "CURRENT",
    deletion: "LIVE",
  }) as const;

export interface OwnedSnapshotResult {
  readonly documentId: string;
  readonly title: string;
  readonly excerpt: string;
  readonly sourceLocator: string;
  readonly observedAt: string;
  readonly captureRef: string;
  readonly representationRef: string;
  readonly spanRef: string;
  readonly receiptRef: string;
}
export interface OwnedSnapshotPort {
  readonly snapshotRef: string;
  readonly projectionSnapshotRef: string;
  readonly declaredCoverage: {
    readonly corpusCellRef: string;
    readonly documents: number;
  };
  search(input: {
    readonly snapshotRef: string;
    readonly query: string;
    readonly maxResults: number;
  }): {
    readonly status: "ok" | "no_answer" | "rejected";
    readonly results: readonly OwnedSnapshotResult[];
  };
}
export class OwnedWebSnapshotAdapter implements RetrievalAdapterV3 {
  readonly surfaceRef = "surface:owned-web:v1" as const;
  constructor(private readonly port: OwnedSnapshotPort) {}
  async prepare(context: LegContextV3): Promise<unknown> {
    if (
      context.leg.surfaceRef !== this.surfaceRef ||
      context.leg.mode !== "INDEXED"
    )
      throw new Error("RETRIEVAL_V3_ADAPTER_MISMATCH");
    if (!context.checkDeadline())
      return failed(context.leg, "DEADLINE_NOT_STARTED");
    return this.port.search({
      snapshotRef: this.port.snapshotRef,
      query: context.question,
      maxResults: context.leg.maxResults,
    });
  }
  async finalize(
    preparation: unknown,
    context: LegContextV3,
  ): Promise<LegExecutionV3> {
    if (!context.checkDeadline())
      return failed(context.leg, "DEADLINE_EXHAUSTED");
    const output = preparation as ReturnType<OwnedSnapshotPort["search"]>;
    if (output.status === "rejected")
      return failed(context.leg, "OWNED_SNAPSHOT_UNAVAILABLE");
    if (output.status === "no_answer" && output.results.length !== 0)
      return failed(context.leg, "OWNED_SNAPSHOT_MALFORMED");
    const items: CustodiedEvidenceV3[] = output.results
      .slice(0, context.leg.maxResults)
      .map((item) => ({
        recordKind: "custodied-evidence",
        evidenceId: `${context.leg.legId}:${item.documentId}`,
        title: truncate(item.title, 300),
        excerpt: truncate(item.excerpt, 2_000),
        sourceLocator: item.sourceLocator,
        observedAt: item.observedAt,
        committedCaptureRef: item.captureRef,
        representationRef: item.representationRef,
        spanRef: item.spanRef,
        receiptRef: item.receiptRef,
        provenance: {
          surfaceRef: this.surfaceRef,
          sourceObjectRef: item.documentId,
          captureRef: item.captureRef,
          receiptRef: item.receiptRef,
          projectionSnapshotRef: this.port.projectionSnapshotRef,
        },
        lifecycle: lifecycle("NOT_APPLICABLE"),
      }));
    return {
      items,
      report: {
        legId: context.leg.legId,
        surfaceRef: this.surfaceRef,
        mode: "INDEXED",
        obligation: context.leg.obligation,
        coverage: {
          measurement: "MEASURED",
          completeness: "COMPLETE",
          observedItems: items.length,
          declaredItems: this.port.declaredCoverage.documents,
          corpusCellRef: this.port.declaredCoverage.corpusCellRef,
        },
        freshness: { state: "CURRENT", observedAt: context.wallNow() },
        failures: [],
        deliveredItems: items.length,
        projectionSnapshotRef: this.port.projectionSnapshotRef,
      },
    };
  }
}

type MemoryLifecycle = {
  custody: "DURABLE" | "PROVISIONAL";
  assertion: "ACTIVE" | "PENDING";
  queryEligibility: "ELIGIBLE" | "SUPPRESSED";
  authorizationFreshness: "CURRENT" | "STALE" | "UNKNOWN" | "REVOKED";
  validation: "CURRENT" | "STALE";
  deletion: "LIVE" | "TOMBSTONED";
};
export interface DevelopmentMemoryV3Fixture {
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
  readonly lifecycle: MemoryLifecycle;
  readonly rightsClearance: "PROJECT_AUTHORED_CC0_FIXTURE";
}
const memoryEligible = (item: DevelopmentMemoryV3Fixture): boolean =>
  item.lifecycle.custody === "DURABLE" &&
  item.lifecycle.queryEligibility === "ELIGIBLE" &&
  item.lifecycle.authorizationFreshness === "CURRENT" &&
  item.lifecycle.validation === "CURRENT" &&
  item.lifecycle.deletion === "LIVE" &&
  (item.recordKind !== "active-assertion" ||
    item.lifecycle.assertion === "ACTIVE");
export class DevelopmentMemoryV3Adapter implements RetrievalAdapterV3 {
  readonly surfaceRef = "surface:curiosity-memory:v1" as const;
  constructor(
    private readonly fixtures: DevelopmentMemoryV3Fixture[],
    private readonly hooks: {
      readonly observe?: (
        event:
          | "memory-projection-read"
          | "memory-hydration-read"
          | "memory-final-state-check",
        signal: AbortSignal,
      ) => unknown | Promise<unknown>;
    } = {},
  ) {}
  async prepare(context: LegContextV3): Promise<unknown> {
    if (!context.checkDeadline())
      return { ids: [], failure: "DEADLINE_NOT_STARTED" };
    await this.hooks.observe?.("memory-projection-read", context.signal);
    if (!context.checkDeadline())
      return { ids: [], failure: "DEADLINE_EXHAUSTED" };
    const tokens = context.question.toLowerCase().match(/[a-z0-9]+/gu) ?? [];
    const ids = this.fixtures
      .filter((item) =>
        tokens.some((token) =>
          `${item.title} ${item.excerpt}`.toLowerCase().includes(token),
        ),
      )
      .slice(0, context.leg.maxResults)
      .map(({ id }) => id);
    for (const _id of ids) {
      void _id;
      await this.hooks.observe?.("memory-hydration-read", context.signal);
      if (!context.checkDeadline())
        return { ids: [], failure: "DEADLINE_EXHAUSTED" };
    }
    return { ids };
  }
  async finalize(
    preparation: unknown,
    context: LegContextV3,
  ): Promise<LegExecutionV3> {
    const value = preparation as { ids: string[]; failure?: string };
    if (value.failure) return failed(context.leg, value.failure);
    const items: RetrievalV3Result[] = [];
    const failures: { code: string }[] = [];
    for (const id of value.ids) {
      if (!context.checkDeadline())
        return failed(context.leg, "DEADLINE_EXHAUSTED");
      await this.hooks.observe?.("memory-final-state-check", context.signal);
      if (!context.checkDeadline())
        return failed(context.leg, "DEADLINE_EXHAUSTED");
      const item = this.fixtures.find((fixture) => fixture.id === id);
      if (!item || !memoryEligible(item)) {
        failures.push({ code: "FINAL_STATE_SUPPRESSED" });
        continue;
      }
      const common = {
        evidenceId: item.evidenceId,
        title: truncate(item.title, 300),
        excerpt: truncate(item.excerpt, 2_000),
        sourceLocator: item.sourceLocator,
        observedAt: item.observedAt,
        committedCaptureRef: item.committedCaptureRef,
        representationRef: item.representationRef,
        spanRef: item.spanRef,
        receiptRef: item.receiptRef,
        provenance: {
          surfaceRef: this.surfaceRef,
          sourceObjectRef: item.id,
          captureRef: item.committedCaptureRef,
          receiptRef: item.receiptRef,
          projectionSnapshotRef: null,
        },
        lifecycle: lifecycle(
          item.recordKind === "active-assertion" ? "ACTIVE" : "NOT_APPLICABLE",
        ),
      };
      if (item.recordKind === "custodied-evidence")
        items.push({ ...common, recordKind: "custodied-evidence" });
      else
        items.push({
          ...common,
          recordKind: "active-assertion",
          assertionId: item.assertionId!,
          beliefRevisionRef: item.beliefRevisionRef!,
          evidenceSetRef: item.evidenceSetRef!,
          validationPolicyRef: item.validationPolicyRef,
          validationDecisionRef: item.validationDecisionRef,
        });
    }
    return {
      items,
      report: {
        legId: context.leg.legId,
        surfaceRef: this.surfaceRef,
        mode: "INDEXED",
        obligation: context.leg.obligation,
        coverage: {
          measurement: failures.length ? "UNKNOWN" : "MEASURED",
          completeness: failures.length ? "PARTIAL" : "COMPLETE",
          observedItems: value.ids.length,
        },
        freshness: failures.length
          ? { state: "UNKNOWN" }
          : { state: "CURRENT", observedAt: context.wallNow() },
        failures,
        deliveredItems: items.length,
      },
    };
  }
}

export class AuthorizedMcpReceiptAdapter implements RetrievalAdapterV3 {
  readonly surfaceRef = "surface:authorized-mcp:v1" as const;
  constructor(private readonly capability: McpConsumerCapability | undefined) {}
  async prepare(context: LegContextV3): Promise<unknown> {
    if (context.leg.surfaceRef !== this.surfaceRef)
      return failed(context.leg, "MCP_UNSUPPORTED");
    const outcome = consumeMcpCapability(this.capability, {
      intentRef: context.leg.intentRef,
      requestId: context.leg.requestId,
      authenticatedContextRef: context.leg.authenticatedContextRef,
      sessionRef: context.leg.sessionRef,
      agentRef: context.leg.agentRef,
      messageRef: context.leg.messageRef,
      parentCallRef: context.leg.parentCallRef,
      canonicalInputDigest: context.leg.canonicalInputDigest,
    });
    return outcome.status === "AVAILABLE"
      ? outcome.receipt
      : failed(context.leg, "MCP_UNSUPPORTED");
  }
  async finalize(
    preparation: unknown,
    context: LegContextV3,
  ): Promise<LegExecutionV3> {
    if ((preparation as LegExecutionV3).report)
      return preparation as LegExecutionV3;
    const receipt = preparation as {
      readonly result: readonly import("./mcp-receipt-bridge.js").McpReceiptItem[];
      readonly receiptRef: string;
      readonly compatibilityMode: "MODEL_MEDIATED";
      readonly sessionRef: string;
      readonly agentRef: string;
      readonly messageRef: string;
      readonly parentCallRef: string;
      readonly canonicalInputDigest: string;
      readonly capturedAt: string;
    };
    const items: McpSourceObservationV3[] = receipt.result
      .slice(0, context.leg.maxResults)
      .map((item, index) => ({
        recordKind: "source-observation",
        observationId: `${context.leg.legId}:observation:${index + 1}`,
        title: item.title,
        excerpt: item.excerpt,
        sourceLocator: item.sourceLocator,
        observedAt: item.observedAt,
        trust: "untrusted-source-observation",
        provenance: {
          surfaceRef: this.surfaceRef,
          sourceObjectRef: `${receipt.receiptRef}:item:${index + 1}`,
          captureRef: null,
          receiptRef: receipt.receiptRef,
          projectionSnapshotRef: null,
          hostReceipt: {
            receiptRef: receipt.receiptRef,
            compatibilityMode: receipt.compatibilityMode,
            sessionRef: receipt.sessionRef,
            agentRef: receipt.agentRef,
            messageRef: receipt.messageRef,
            parentCallRef: receipt.parentCallRef,
            canonicalInputDigest: receipt.canonicalInputDigest,
            capturedAt: receipt.capturedAt,
          },
        },
      }));
    return {
      items,
      report: {
        legId: context.leg.legId,
        surfaceRef: this.surfaceRef,
        mode: "LIVE",
        obligation: context.leg.obligation,
        coverage: {
          measurement: "UNKNOWN",
          completeness: "UNKNOWN",
          observedItems: items.length,
        },
        freshness: { state: "CURRENT", observedAt: receipt.capturedAt },
        failures: [],
        deliveredItems: items.length,
      },
    };
  }
}
export { failed as unavailableV3Execution };
