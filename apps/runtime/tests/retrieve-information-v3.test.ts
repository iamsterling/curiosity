import { describe, expect, test } from "bun:test";

import {
  AuthorizedMcpReceiptAdapter,
  createMcpReceiptBridge,
  createRetrieveInformationV3,
  decodeRetrieveInformationV3Report,
  decodeRetrieveInformationV3Request,
  DevelopmentMemoryV3Adapter,
  OwnedWebSnapshotAdapter,
  type AuthorityPolicyV3Port,
  type DevelopmentMemoryV3Fixture,
  RETRIEVAL_V3_LIMITS,
} from "../src/retrieval/v3/retrieve-information-v3.js";

const NOW = "2026-08-19T12:00:00.000Z";
const context = {
  requestId: "retrieve-v3",
  authenticatedContextRef: "auth:development",
  sessionRef: "session:one",
  agentRef: "agent:researcher",
  messageRef: "message:one",
  parentCallRef: "call:parent",
  canonicalInputDigest:
    "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
} as const;
const legs = [
  {
    legId: "owned",
    surfaceRef: "surface:owned-web:v1",
    mode: "INDEXED",
    obligation: "REQUIRED",
    maxResults: 2,
  },
  {
    legId: "memory",
    surfaceRef: "surface:curiosity-memory:v1",
    mode: "INDEXED",
    obligation: "OPTIONAL",
    maxResults: 2,
  },
  {
    legId: "mcp",
    surfaceRef: "surface:authorized-mcp:v1",
    mode: "LIVE",
    obligation: "OPTIONAL",
    maxResults: 2,
    intentRef: "intent:delivery",
    ...context,
  },
] as const;
const request = (
  selected: readonly unknown[] = legs,
  overrides: Record<string, unknown> = {},
) => ({
  schemaVersion: 3,
  contract: "curiosity.retrieval/retrieve-information-request/v3",
  requestId: "retrieve-v3",
  authenticatedContextRef: "auth:development",
  purpose: "development-test",
  objective: { question: "What supports Curiosity?" },
  validAsOf: null,
  knownAsOf: NOW,
  profile:
    selected.length === 1
      ? "OWNED_WEB"
      : selected.length === 2
        ? "OWNED_WEB_MEMORY"
        : "OWNED_WEB_MEMORY_MCP",
  legs: selected,
  budget: {
    maxLegs: selected.length,
    maxResults: 6,
    maxUtf8Bytes: 32_768,
    maxNodes: 512,
    deadlineUnixMs: Date.parse(NOW) + 10_000,
  },
  ...overrides,
});
const lifecycle = {
  custody: "DURABLE",
  assertion: "ACTIVE",
  queryEligibility: "ELIGIBLE",
  authorizationFreshness: "CURRENT",
  validation: "CURRENT",
  deletion: "LIVE",
} as const;
const memoryFixture = (): DevelopmentMemoryV3Fixture => ({
  id: "memory:one",
  recordKind: "active-assertion",
  title: "Curiosity memory",
  excerpt: "Curiosity is capture anchored.",
  sourceLocator: "fixture:memory-one",
  observedAt: NOW,
  evidenceId: "evidence:one",
  committedCaptureRef: "capture:memory-one",
  representationRef: "representation:one",
  spanRef: "span:one",
  receiptRef: "receipt:memory-one",
  assertionId: "assertion:one",
  beliefRevisionRef: "belief:one",
  evidenceSetRef: "evidence-set:one",
  validationPolicyRef: "policy:one",
  validationDecisionRef: "decision:one",
  lifecycle,
  rightsClearance: "PROJECT_AUTHORED_CC0_FIXTURE",
});
const owned = new OwnedWebSnapshotAdapter({
  snapshotRef: "snapshot:m6-owned-fixture",
  projectionSnapshotRef: "projection:m6-owned-fixture",
  declaredCoverage: {
    corpusCellRef: "corpus:curiosity-technical-ecosystem:v1",
    documents: 8,
  },
  search: (input) => {
    expect(input).toEqual({
      snapshotRef: "snapshot:m6-owned-fixture",
      query: "What supports Curiosity?",
      maxResults: 2,
    });
    return {
      status: "ok",
      results: [
        {
          documentId: "document:one",
          title: "Curiosity docs",
          excerpt: "Curiosity technical architecture",
          sourceLocator: "https://docs.curiosity.test/architecture",
          observedAt: NOW,
          captureRef: "capture:owned-one",
          representationRef: "representation:owned-one",
          spanRef: "span:owned-one",
          receiptRef: "receipt:owned-one",
        },
      ],
    };
  },
});
const allow = (events: string[]): AuthorityPolicyV3Port => ({
  authorize: async () => {
    events.push("authorize");
    return {
      decision: "ALLOW",
      authorityRef: "authority:v3",
      policyVersion: "policy:v3",
    };
  },
  revalidateDelivery: async () => {
    events.push("delivery");
    return { decision: "ALLOW" };
  },
});

describe("Retrieval Contracts v3", () => {
  test("decodes only the three closed profiles with one to three unique registered legs", () => {
    for (let count = 1; count <= 3; count += 1)
      expect(
        decodeRetrieveInformationV3Request(request(legs.slice(0, count))).legs,
      ).toHaveLength(count);
    expect(() =>
      decodeRetrieveInformationV3Request(request([legs[1]!])),
    ).toThrow("RETRIEVE_INFORMATION_V3_PROFILE_INVALID");
    expect(() =>
      decodeRetrieveInformationV3Request(request([legs[0]!, legs[0]!])),
    ).toThrow();
    expect(() =>
      decodeRetrieveInformationV3Request({ ...request(), token: "secret" }),
    ).toThrow("RETRIEVE_INFORMATION_V3_UNKNOWN_FIELD");
    const hostile = Object.create({ token: "inherited" });
    Object.assign(hostile, request());
    expect(() => decodeRetrieveInformationV3Request(hostile)).toThrow(
      "RETRIEVE_INFORMATION_V3_INVALID",
    );
  });

  test("bounds the deadline horizon only against orchestration start", async () => {
    const events: string[] = [];
    const exact = request(legs.slice(0, 1), {
      knownAsOf: "2020-01-01T00:00:00.000Z",
      budget: {
        ...request(legs.slice(0, 1)).budget,
        deadlineUnixMs: Date.parse(NOW) + RETRIEVAL_V3_LIMITS.deadlineHorizonMs,
      },
    });
    expect(decodeRetrieveInformationV3Request(exact).knownAsOf).toBe(
      "2020-01-01T00:00:00.000Z",
    );
    await expect(
      createRetrieveInformationV3({
        authority: allow(events),
        owned,
        memory: new DevelopmentMemoryV3Adapter([]),
        mcp: new AuthorizedMcpReceiptAdapter(undefined),
        now: () => NOW,
      })(exact),
    ).resolves.toMatchObject({ status: "OK" });
    expect(events[0]).toBe("authorize");

    const overLimitEvents: string[] = [];
    await expect(
      createRetrieveInformationV3({
        authority: allow(overLimitEvents),
        owned,
        memory: new DevelopmentMemoryV3Adapter([]),
        mcp: new AuthorizedMcpReceiptAdapter(undefined),
        now: () => NOW,
      })({
        ...exact,
        budget: {
          ...exact.budget,
          deadlineUnixMs: exact.budget.deadlineUnixMs + 1,
        },
      }),
    ).rejects.toThrow("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
    expect(overLimitEvents).toEqual([]);
  });

  test("rejects a million-hole sparse array before serialization", () => {
    let serializationCalls = 0;
    const sparse = new Array(1_000_000);
    Object.defineProperty(sparse, "toJSON", {
      enumerable: false,
      value: () => {
        serializationCalls += 1;
        return [];
      },
    });
    expect(() =>
      decodeRetrieveInformationV3Request({ ...request(), legs: sparse }),
    ).toThrow("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
    expect(serializationCalls).toBe(0);
  });

  test("authorizes before zero reads, executes no hidden fallback, and preserves separate strata", async () => {
    const deniedReads: string[] = [];
    const denied = await createRetrieveInformationV3({
      authority: {
        authorize: async () => ({
          decision: "DENY",
          authorityRef: "authority:denied",
          policyVersion: "policy:v3",
        }),
        revalidateDelivery: async () => {
          throw new Error("must not run");
        },
      },
      owned: new OwnedWebSnapshotAdapter({
        snapshotRef: "snapshot:x",
        projectionSnapshotRef: "projection:x",
        declaredCoverage: { corpusCellRef: "corpus:x", documents: 1 },
        search: () => {
          deniedReads.push("owned");
          return { status: "no_answer", results: [] };
        },
      }),
      memory: new DevelopmentMemoryV3Adapter([memoryFixture()], {
        observe: (event) => deniedReads.push(event),
      }),
      mcp: new AuthorizedMcpReceiptAdapter(undefined),
      now: () => NOW,
    })(request());
    expect(deniedReads).toEqual([]);
    expect(denied.status).toBe("DENIED");

    const events: string[] = [];
    const report = await createRetrieveInformationV3({
      authority: allow(events),
      owned,
      memory: new DevelopmentMemoryV3Adapter([memoryFixture()], {
        observe: (event) => events.push(event),
      }),
      mcp: new AuthorizedMcpReceiptAdapter(undefined),
      now: () => NOW,
    })(request());
    expect(events[0]).toBe("authorize");
    expect(report.strata.map((value) => value.epistemicKind)).toEqual([
      "custodied-evidence",
      "active-assertion",
    ]);
    expect(report.strata[0]!.items[0]).toMatchObject({
      committedCaptureRef: "capture:owned-one",
    });
    expect(report.strata[0]!.items[0]).not.toHaveProperty("score");
    expect(report.strata[0]!.items[0]).not.toHaveProperty("confidence");
    expect(report.legs[0]!.coverage).toMatchObject({
      measurement: "MEASURED",
      completeness: "COMPLETE",
      declaredItems: 8,
    });
    expect(report.legs[0]).toMatchObject({
      projectionSnapshotRef: "projection:m6-owned-fixture",
    });
    expect(report.strata[0]!.items[0]).toMatchObject({
      provenance: {
        surfaceRef: "surface:owned-web:v1",
        projectionSnapshotRef: "projection:m6-owned-fixture",
      },
    });
    expect(report.legs[2]!.failures).toEqual([{ code: "MCP_UNSUPPORTED" }]);
    expect(report.strata.some((value) => value.legId === "mcp")).toBe(false);
    expect(() =>
      decodeRetrieveInformationV3Report({ ...report, confidence: 1 }),
    ).toThrow("RETRIEVE_INFORMATION_V3_UNKNOWN_FIELD");
    const hostileReport = Object.create({ score: 1 });
    Object.assign(hostileReport, report);
    expect(() => decodeRetrieveInformationV3Report(hostileReport)).toThrow(
      "RETRIEVE_INFORMATION_V3_INVALID",
    );
  });

  test("required MCP unsupported suppresses all delivery while optional is partial", async () => {
    const required = legs.map((leg) => ({
      ...leg,
      obligation: leg.legId === "mcp" ? "REQUIRED" : "OPTIONAL",
    }));
    const report = await createRetrieveInformationV3({
      authority: allow([]),
      owned,
      memory: new DevelopmentMemoryV3Adapter([memoryFixture()]),
      mcp: new AuthorizedMcpReceiptAdapter(undefined),
      now: () => NOW,
    })(request(required));
    expect(report.stoppingReason).toBe("REQUIRED_LEG_UNAVAILABLE");
    expect(report.strata).toEqual([]);
  });

  test("rejects contradictory owned no-answer results and accepts a zero-document complete snapshot", async () => {
    const malformed = new OwnedWebSnapshotAdapter({
      snapshotRef: "snapshot:malformed",
      projectionSnapshotRef: "projection:malformed",
      declaredCoverage: { corpusCellRef: "corpus:empty", documents: 0 },
      search: () => ({
        status: "no_answer",
        results: [
          {
            documentId: "document:must-not-deliver",
            title: "hidden",
            excerpt: "hidden",
            sourceLocator: "https://docs.curiosity.test/hidden",
            observedAt: NOW,
            captureRef: "capture:hidden",
            representationRef: "representation:hidden",
            spanRef: "span:hidden",
            receiptRef: "receipt:hidden",
          },
        ],
      }),
    });
    const malformedReport = await createRetrieveInformationV3({
      authority: allow([]),
      owned: malformed,
      memory: new DevelopmentMemoryV3Adapter([]),
      mcp: new AuthorizedMcpReceiptAdapter(undefined),
      now: () => NOW,
    })(request(legs.slice(0, 1)));
    expect(malformedReport.strata).toEqual([]);
    expect(malformedReport.legs[0]!.failures).toEqual([
      { code: "OWNED_SNAPSHOT_MALFORMED" },
    ]);

    const empty = new OwnedWebSnapshotAdapter({
      snapshotRef: "snapshot:empty",
      projectionSnapshotRef: "projection:empty",
      declaredCoverage: { corpusCellRef: "corpus:empty", documents: 0 },
      search: () => ({ status: "no_answer", results: [] }),
    });
    const emptyReport = await createRetrieveInformationV3({
      authority: allow([]),
      owned: empty,
      memory: new DevelopmentMemoryV3Adapter([]),
      mcp: new AuthorizedMcpReceiptAdapter(undefined),
      now: () => NOW,
    })(request(legs.slice(0, 1)));
    expect(emptyReport).toMatchObject({
      status: "OK",
      strata: [],
      legs: [
        {
          coverage: {
            measurement: "MEASURED",
            completeness: "COMPLETE",
            declaredItems: 0,
            observedItems: 0,
          },
          deliveredItems: 0,
        },
      ],
    });
  });

  test("final delivery authority runs after finalize and catches revocation during finalize", async () => {
    const records = [memoryFixture()];
    const events: string[] = [];
    let revoked = false;
    const policy: AuthorityPolicyV3Port = {
      authorize: async () => ({
        decision: "ALLOW",
        authorityRef: "authority:v3",
        policyVersion: "policy:v3",
      }),
      revalidateDelivery: async () => {
        events.push("delivery");
        return { decision: revoked ? "DENY" : "ALLOW" };
      },
    };
    const report = await createRetrieveInformationV3({
      authority: policy,
      owned,
      memory: new DevelopmentMemoryV3Adapter(records, {
        observe: (event) => {
          events.push(event);
          if (event === "memory-final-state-check") revoked = true;
        },
      }),
      mcp: new AuthorizedMcpReceiptAdapter(undefined),
      now: () => NOW,
    })(request(legs.slice(0, 2)));
    expect(events.indexOf("memory-final-state-check")).toBeLessThan(
      events.indexOf("delivery"),
    );
    expect(events.at(-1)).toBe("delivery");
    expect(report).toMatchObject({
      status: "DENIED",
      stoppingReason: "DELIVERY_AUTHORITY_DENIED",
      strata: [],
    });
  });

  test("enforces aggregate whole-report result budgets and stops later legs at deadline", async () => {
    const bounded = await createRetrieveInformationV3({
      authority: allow([]),
      owned,
      memory: new DevelopmentMemoryV3Adapter([memoryFixture()]),
      mcp: new AuthorizedMcpReceiptAdapter(undefined),
      now: () => NOW,
    })(
      request(legs.slice(0, 2), {
        budget: { ...request(legs.slice(0, 2)).budget, maxResults: 1 },
      }),
    );
    expect(bounded.strata.flatMap((value) => value.items)).toHaveLength(1);
    expect(Buffer.byteLength(JSON.stringify(bounded))).toBeLessThanOrEqual(
      32_768,
    );
    let monotonic = 0;
    const deadlineOwned = new OwnedWebSnapshotAdapter({
      snapshotRef: "snapshot:x",
      projectionSnapshotRef: "projection:x",
      declaredCoverage: { corpusCellRef: "corpus:x", documents: 1 },
      search: () => {
        monotonic = 11;
        return { status: "no_answer", results: [] };
      },
    });
    const expired = await createRetrieveInformationV3({
      authority: allow([]),
      owned: deadlineOwned,
      memory: new DevelopmentMemoryV3Adapter([memoryFixture()], {
        observe: () => {
          throw new Error("later leg started");
        },
      }),
      mcp: new AuthorizedMcpReceiptAdapter(undefined),
      now: () => NOW,
      monotonicNow: () => monotonic,
    })(
      request(legs.slice(0, 2), {
        budget: {
          ...request(legs.slice(0, 2)).budget,
          deadlineUnixMs: Date.parse(NOW) + 10,
        },
      }),
    );
    expect(expired.stoppingReason).toBe("DEADLINE_EXHAUSTED");
    expect(expired.strata).toEqual([]);
  });

  test("hard deadline races never-settling authority and delayed finalize ports", async () => {
    const short = request(legs.slice(0, 2), {
      budget: {
        ...request(legs.slice(0, 2)).budget,
        deadlineUnixMs: Date.parse(NOW) + 5,
      },
    });
    const started = performance.now();
    const authorityTimeout = await createRetrieveInformationV3({
      authority: {
        authorize: async () => new Promise(() => undefined),
        revalidateDelivery: async () => ({ decision: "ALLOW" }),
      },
      owned,
      memory: new DevelopmentMemoryV3Adapter([memoryFixture()]),
      mcp: new AuthorizedMcpReceiptAdapter(undefined),
      now: () => NOW,
      monotonicNow: () => performance.now(),
    })(short);
    expect(performance.now() - started).toBeLessThan(200);
    expect(authorityTimeout.stoppingReason).toBe("DEADLINE_EXHAUSTED");

    const finalizeTimeout = await createRetrieveInformationV3({
      authority: allow([]),
      owned,
      memory: new DevelopmentMemoryV3Adapter([memoryFixture()], {
        observe: async (event) => {
          if (event === "memory-final-state-check") await Bun.sleep(30);
        },
      }),
      mcp: new AuthorizedMcpReceiptAdapter(undefined),
      now: () => NOW,
      monotonicNow: () => performance.now(),
    })(short);
    expect(finalizeTimeout.stoppingReason).toBe("DEADLINE_EXHAUSTED");

    let finalStarted = false;
    const finalTimeout = await createRetrieveInformationV3({
      authority: {
        authorize: async () => ({
          decision: "ALLOW",
          authorityRef: "authority:v3",
          policyVersion: "policy:v3",
        }),
        revalidateDelivery: async () => {
          finalStarted = true;
          return new Promise(() => undefined);
        },
      },
      owned,
      memory: new DevelopmentMemoryV3Adapter([memoryFixture()]),
      mcp: new AuthorizedMcpReceiptAdapter(undefined),
      now: () => NOW,
      monotonicNow: () => performance.now(),
    })(
      request(legs.slice(0, 2), {
        budget: {
          ...request(legs.slice(0, 2)).budget,
          deadlineUnixMs: Date.parse(NOW) + 20,
        },
      }),
    );
    expect(finalStarted).toBe(true);
    expect(finalTimeout.stoppingReason).toBe("DEADLINE_EXHAUSTED");
  });

  test("consumes a bounded authenticated MCP receipt once and denies cross-context, expiry, and collisions", async () => {
    const bridge = createMcpReceiptBridge({
      enabled: true,
      compatibilityMode: "MODEL_MEDIATED",
      now: () => 100,
    });
    const intent = bridge.issue({
      intentRef: "intent:one",
      ...context,
      expiresAtUnixMs: 110,
    });
    expect(
      bridge.capture({
        ...intent,
        ...context,
        hostAuthenticated: true,
        result: [
          {
            title: "MCP docs",
            excerpt: "bounded result",
            sourceLocator: "https://modelcontextprotocol.io/specification",
            observedAt: NOW,
          },
        ],
      }),
    ).toEqual({ status: "CAPTURED" });
    expect(
      bridge.capture({
        ...intent,
        ...context,
        hostAuthenticated: true,
        result: [],
      }),
    ).toEqual({ status: "COLLISION" });
    const other = bridge.issue({
      intentRef: "intent:two",
      ...context,
      expiresAtUnixMs: 110,
    });
    bridge.capture({
      ...other,
      ...context,
      hostAuthenticated: true,
      result: [],
    });
    const expiring = createMcpReceiptBridge({
      enabled: true,
      compatibilityMode: "MODEL_MEDIATED",
      now: () => 200,
    });
    expiring.issue({
      intentRef: "intent:expired",
      ...context,
      expiresAtUnixMs: 199,
    });
    const mismatchedLeg = {
      ...legs[2],
      intentRef: "intent:two",
      sessionRef: "session:other",
    };
    const mismatched = await createRetrieveInformationV3({
      authority: allow([]),
      owned,
      memory: new DevelopmentMemoryV3Adapter([memoryFixture()]),
      mcp: new AuthorizedMcpReceiptAdapter(bridge.consumer()),
      now: () => NOW,
    })(request([legs[0], legs[1], mismatchedLeg]));
    expect(mismatched.legs[2]!.failures).toEqual([{ code: "MCP_UNSUPPORTED" }]);

    const expiredLeg = { ...legs[2], intentRef: "intent:expired" };
    const expired = await createRetrieveInformationV3({
      authority: allow([]),
      owned,
      memory: new DevelopmentMemoryV3Adapter([memoryFixture()]),
      mcp: new AuthorizedMcpReceiptAdapter(expiring.consumer()),
      now: () => NOW,
    })(request([legs[0], legs[1], expiredLeg]));
    expect(expired.legs[2]!.failures).toEqual([{ code: "MCP_UNSUPPORTED" }]);
  });

  test("delivers MCP only from a host-captured receipt with bounded provenance", async () => {
    const bridge = createMcpReceiptBridge({
      enabled: true,
      compatibilityMode: "MODEL_MEDIATED",
      now: () => Date.parse(NOW),
    });
    const intent = bridge.issue({
      intentRef: "intent:delivery",
      ...context,
      expiresAtUnixMs: Date.parse(NOW) + 1_000,
    });
    bridge.capture({
      ...intent,
      ...context,
      hostAuthenticated: true,
      result: [
        {
          title: "MCP specification",
          excerpt: "Tools return bounded content.",
          sourceLocator: "https://modelcontextprotocol.io/specification",
          observedAt: NOW,
        },
      ],
    });
    const report = await createRetrieveInformationV3({
      authority: allow([]),
      owned,
      memory: new DevelopmentMemoryV3Adapter([memoryFixture()]),
      mcp: new AuthorizedMcpReceiptAdapter(bridge.consumer()),
      now: () => NOW,
    })(request());
    expect(
      report.strata.find((value) => value.legId === "mcp")?.items[0],
    ).toMatchObject({
      recordKind: "source-observation",
      provenance: {
        hostReceipt: {
          compatibilityMode: "MODEL_MEDIATED",
          parentCallRef: "call:parent",
          canonicalInputDigest: context.canonicalInputDigest,
        },
      },
    });
    const mcpIndex = report.strata.findIndex((value) => value.legId === "mcp");
    const mcpStratum = report.strata[mcpIndex]!;
    const mcpItem = mcpStratum.items[0]!;
    if (mcpItem.recordKind !== "source-observation")
      throw new Error("unexpected fixture kind");
    expect(() =>
      decodeRetrieveInformationV3Report({
        ...report,
        strata: report.strata.map((stratum, index) =>
          index === mcpIndex
            ? {
                ...mcpStratum,
                items: [
                  {
                    ...mcpItem,
                    provenance: {
                      ...mcpItem.provenance,
                      hostReceipt: {
                        ...mcpItem.provenance.hostReceipt,
                        receiptRef:
                          "mcp-receipt:sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
                      },
                    },
                  },
                ],
              }
            : stratum,
        ),
      }),
    ).toThrow("RETRIEVE_INFORMATION_V3_INVALID");
    const reused = await createRetrieveInformationV3({
      authority: allow([]),
      owned,
      memory: new DevelopmentMemoryV3Adapter([memoryFixture()]),
      mcp: new AuthorizedMcpReceiptAdapter(bridge.consumer()),
      now: () => NOW,
    })(request());
    expect(reused.legs[2]!.failures).toEqual([{ code: "MCP_UNSUPPORTED" }]);
    const forged = await createRetrieveInformationV3({
      authority: allow([]),
      owned,
      memory: new DevelopmentMemoryV3Adapter([memoryFixture()]),
      mcp: new AuthorizedMcpReceiptAdapter({} as never),
      now: () => NOW,
    })(request());
    expect(forged.legs[2]!.failures).toEqual([{ code: "MCP_UNSUPPORTED" }]);
  });

  test("MCP receipt identity binds full intent and settlement", async () => {
    const bridge = createMcpReceiptBridge({
      enabled: true,
      compatibilityMode: "MODEL_MEDIATED",
      now: () => Date.parse(NOW),
    });
    const refs: string[] = [];
    for (const suffix of ["a", "b"]) {
      const intentRef = `intent:${suffix}`;
      const intent = bridge.issue({
        intentRef,
        ...context,
        expiresAtUnixMs: Date.parse(NOW) + 1_000,
      });
      bridge.capture({
        ...intent,
        hostAuthenticated: true,
        result: [
          {
            title: "same",
            excerpt: "same",
            sourceLocator: "https://modelcontextprotocol.io/specification",
            observedAt: NOW,
          },
        ],
      });
      const leg = { ...legs[2], intentRef };
      const report = await createRetrieveInformationV3({
        authority: allow([]),
        owned,
        memory: new DevelopmentMemoryV3Adapter([memoryFixture()]),
        mcp: new AuthorizedMcpReceiptAdapter(bridge.consumer()),
        now: () => NOW,
      })(request([legs[0], legs[1], leg]));
      const item = report.strata.find((value) => value.legId === "mcp")!
        .items[0]!;
      refs.push(item.provenance.receiptRef);
    }
    expect(refs[0]).not.toBe(refs[1]);
    expect(
      refs.every((ref) => /^mcp-receipt:sha256:[a-f0-9]{64}$/u.test(ref)),
    ).toBe(true);
  });

  test("report decoder rejects aggregate overflow, duplicate identities, and provenance conflicts", async () => {
    const baseline = await createRetrieveInformationV3({
      authority: allow([]),
      owned,
      memory: new DevelopmentMemoryV3Adapter([]),
      mcp: new AuthorizedMcpReceiptAdapter(undefined),
      now: () => NOW,
    })(request(legs.slice(0, 1)));
    const item = baseline.strata[0]!.items[0]!;
    const withItems = (items: readonly unknown[]) => ({
      ...baseline,
      strata: [{ ...baseline.strata[0]!, items }],
      legs: [
        {
          ...baseline.legs[0]!,
          coverage: {
            ...baseline.legs[0]!.coverage,
            observedItems: items.length,
          },
          deliveredItems: items.length,
        },
      ],
    });
    const aggregateBaseline = await createRetrieveInformationV3({
      authority: allow([]),
      owned,
      memory: new DevelopmentMemoryV3Adapter([memoryFixture()]),
      mcp: new AuthorizedMcpReceiptAdapter(undefined),
      now: () => NOW,
    })(request(legs.slice(0, 2)));
    const aggregateStrata = aggregateBaseline.strata.map((stratum) => ({
      ...stratum,
      items: Array.from({ length: 10 }, (_, index) => {
        const current = stratum.items[0]!;
        return current.recordKind === "active-assertion"
          ? {
              ...current,
              evidenceId: `memory-evidence:${index}`,
              assertionId: `memory-assertion:${index}`,
            }
          : { ...current, evidenceId: `owned-evidence:${index}` };
      }),
    }));
    expect(() =>
      decodeRetrieveInformationV3Report({
        ...aggregateBaseline,
        strata: aggregateStrata,
        legs: aggregateBaseline.legs.map((leg) => ({
          ...leg,
          coverage: { ...leg.coverage, observedItems: 10 },
          deliveredItems: 10,
        })),
      }),
    ).toThrow("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
    expect(() =>
      decodeRetrieveInformationV3Report(withItems([item, item])),
    ).toThrow("RETRIEVE_INFORMATION_V3_INVALID");
    expect(() =>
      decodeRetrieveInformationV3Report(
        withItems([item, { ...item, evidenceId: "evidence:other" }]),
        { maxResults: 1 },
      ),
    ).toThrow("RETRIEVE_INFORMATION_V3_LIMIT_EXCEEDED");
    for (const conflict of [
      {
        ...item,
        provenance: {
          ...item.provenance,
          surfaceRef: "surface:curiosity-memory:v1",
        },
      },
      {
        ...item,
        provenance: { ...item.provenance, captureRef: "capture:other" },
      },
      {
        ...item,
        provenance: { ...item.provenance, receiptRef: "receipt:other" },
      },
      {
        ...item,
        provenance: {
          ...item.provenance,
          projectionSnapshotRef: "projection:other",
        },
      },
    ])
      expect(() =>
        decodeRetrieveInformationV3Report(withItems([conflict])),
      ).toThrow("RETRIEVE_INFORMATION_V3_INVALID");
  });

  test("descriptor-first decoding never executes getters or toJSON", () => {
    let executions = 0;
    const accessor = { ...request() };
    Object.defineProperty(accessor, "purpose", {
      enumerable: true,
      get: () => {
        executions += 1;
        return "development-test";
      },
    });
    expect(() => decodeRetrieveInformationV3Request(accessor)).toThrow(
      "RETRIEVE_INFORMATION_V3_INVALID",
    );
    const toJson = {
      ...request(),
      toJSON: () => {
        executions += 1;
        return request();
      },
    };
    expect(() => decodeRetrieveInformationV3Request(toJson)).toThrow(
      "RETRIEVE_INFORMATION_V3_INVALID",
    );
    const symbol = { ...request(), [Symbol("hostile")]: true };
    expect(() => decodeRetrieveInformationV3Request(symbol)).toThrow(
      "RETRIEVE_INFORMATION_V3_INVALID",
    );
    const hostileReport = {
      schemaVersion: 3,
      contract: "curiosity.retrieval/retrieve-information-report/v3",
      status: "DENIED",
      requestId: "retrieve-v3",
      authorityRef: "authority:denied",
      asOf: NOW,
      strata: [],
      legs: [],
      partial: true,
      residualUncertainty: ["INITIAL_AUTHORITY_DENIED"],
      stoppingReason: "INITIAL_AUTHORITY_DENIED",
      diagnostic: { code: "RETRIEVE_INFORMATION_V3_DENIED" },
    };
    Object.defineProperty(hostileReport, "asOf", {
      enumerable: true,
      get: () => {
        executions += 1;
        return NOW;
      },
    });
    expect(() => decodeRetrieveInformationV3Report(hostileReport)).toThrow(
      "RETRIEVE_INFORMATION_V3_INVALID",
    );
    const nonEnumerable = {
      schemaVersion: 3,
      contract: "curiosity.retrieval/retrieve-information-report/v3",
      status: "DENIED",
      requestId: "retrieve-v3",
      authorityRef: "authority:denied",
      strata: [],
      legs: [],
      partial: true,
      residualUncertainty: ["INITIAL_AUTHORITY_DENIED"],
      stoppingReason: "INITIAL_AUTHORITY_DENIED",
      diagnostic: { code: "RETRIEVE_INFORMATION_V3_DENIED" },
    };
    Object.defineProperty(nonEnumerable, "asOf", {
      enumerable: false,
      value: NOW,
    });
    expect(() => decodeRetrieveInformationV3Report(nonEnumerable)).toThrow(
      "RETRIEVE_INFORMATION_V3_INVALID",
    );
    expect(() =>
      decodeRetrieveInformationV3Request({ ...request(), hostile: 1n }),
    ).toThrow("RETRIEVE_INFORMATION_V3_INVALID");
    expect(executions).toBe(0);
  });
});
