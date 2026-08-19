import { describe, expect, test } from "bun:test";

import {
  createRetrieveInformation,
  decodeRetrieveInformationRequest,
  decodeRetrieveInformationReport,
  DevelopmentMemoryIndexedAdapter,
  measureRetrieveInformationReport,
  projectRetrieveInformationReport,
  SearxngLiveAdapter,
  type AuthorityPolicyPort,
  type DevelopmentMemoryFixture,
} from "../src/retrieval/retrieve-information.js";
import type { RepositoryOutcome } from "../src/repository-search.js";

const NOW = "2026-08-18T12:00:00.000Z";
const request = (overrides: Record<string, unknown> = {}) => ({
  schemaVersion: 2,
  contract: "curiosity.retrieval/retrieve-information-request/v2",
  requestId: "retrieve-1",
  authenticatedContextRef: "auth-context:fixture-user",
  purpose: "development-test",
  objective: { question: "What supports alpha?" },
  validAsOf: null,
  knownAsOf: NOW,
  legs: [
    {
      legId: "web",
      surfaceSelector: "public-web/searxng-gateway",
      mode: "LIVE",
      obligation: "OPTIONAL",
      maxResults: 3,
    },
    {
      legId: "memory",
      surfaceSelector: "development-memory/evidence",
      mode: "INDEXED",
      obligation: "REQUIRED",
      maxResults: 3,
    },
  ],
  budget: {
    maxLegs: 2,
    maxResults: 6,
    maxUtf8Bytes: 32_768,
    maxNodes: 256,
    deadlineUnixMs: 1_800_000_000_000,
  },
  ...overrides,
});

const fixture = (
  overrides: Partial<DevelopmentMemoryFixture> = {},
): DevelopmentMemoryFixture => ({
  id: "memory-1",
  recordKind: "active-assertion",
  title: "Alpha evidence",
  excerpt: "Project-authored fixture: alpha is supported.",
  sourceLocator: "fixture://alpha",
  observedAt: NOW,
  evidenceId: "evidence-1",
  committedCaptureRef: "capture-1",
  representationRef: "representation-1",
  spanRef: "span-1",
  receiptRef: "receipt-1",
  assertionId: "assertion-1",
  beliefRevisionRef: "belief-1/revision-1",
  evidenceSetRef: "evidence-set-1",
  validationPolicyRef: "fixture-policy-v1",
  validationDecisionRef: "fixture-validation-1",
  lifecycle: {
    custody: "DURABLE",
    assertion: "ACTIVE",
    queryEligibility: "ELIGIBLE",
    authorizationFreshness: "CURRENT",
    validation: "CURRENT",
    deletion: "LIVE",
  },
  rightsClearance: "PROJECT_AUTHORED_CC0_FIXTURE",
  ...overrides,
});

const allowPolicy = (events: string[], final = true): AuthorityPolicyPort => ({
  authorize: async (context) => {
    events.push("authorize");
    expect(context.authenticatedContextRef).toBe("auth-context:fixture-user");
    expect(context.legs).toHaveLength(2);
    return {
      decision: "ALLOW",
      authorityRef: "fixture-authority:decision-1",
      policyVersion: "fixture-policy-v1",
    };
  },
  revalidateDelivery: async () => {
    events.push("delivery-revalidate");
    return final ? { decision: "ALLOW" } : { decision: "DENY" };
  },
});

const webOutcome: RepositoryOutcome = {
  results: [
    {
      title: "Web alpha",
      url: "https://example.org/alpha",
      content: "untrusted alpha",
      provenance: ["engine-a"],
      trust: "untrusted-search-result",
    },
  ],
  partialFailures: [{ source: "engine-b", reason: "timeout" }],
};

describe("development-only RetrieveInformation v2", () => {
  test("executes exactly the two explicit bounded legs after initial authority and keeps epistemic strata separate", async () => {
    const events: string[] = [];
    const web = new SearxngLiveAdapter(async () => {
      events.push("web-read");
      return webOutcome;
    });
    const memory = new DevelopmentMemoryIndexedAdapter([fixture()], {
      observe: (event) => {
        events.push(event);
      },
    });
    const report = await createRetrieveInformation({
      authority: allowPolicy(events),
      web,
      memory,
      now: () => NOW,
    })(request());

    expect(events[0]).toBe("authorize");
    expect(events).toContain("memory-projection-read");
    expect(events).toContain("memory-hydration-read");
    expect(events).toContain("memory-final-state-check");
    expect(events.indexOf("delivery-revalidate")).toBeLessThan(
      events.indexOf("memory-final-state-check"),
    );
    expect(report.authorityRef).toBe("fixture-authority:decision-1");
    expect(report.strata.map((stratum) => stratum.epistemicKind)).toEqual([
      "source-observation",
      "active-assertion",
    ]);
    expect(
      report.strata[0]!.items.every(
        (item) => item.recordKind === "source-observation",
      ),
    ).toBe(true);
    expect(
      report.strata[1]!.items.every(
        (item) => item.recordKind === "active-assertion",
      ),
    ).toBe(true);
    expect(report).not.toHaveProperty("score");
    expect(report).not.toHaveProperty("confidence");
    expect(report.strata[0]!.items[0]).toMatchObject({
      nativeRank: {
        namespace: "org.searxng.providers/v1",
        labels: ["engine-a"],
      },
    });
    expect(report.strata[1]!.items[0]).not.toHaveProperty("nativeRank");
    expect(report.partial).toBe(true);
    expect(
      report.legs.find((leg) => leg.legId === "web")?.coverage,
    ).toMatchObject({ measurement: "UNKNOWN", completeness: "PARTIAL" });
    expect(report.stoppingReason).toBe("DECLARED_LEGS_COMPLETED");
    expect(report.residualUncertainty).toContain("WEB_COVERAGE_UNKNOWN");
  });

  test("initial denial performs zero source, projection, custody, or hydration reads", async () => {
    const events: string[] = [];
    const denied: AuthorityPolicyPort = {
      authorize: async () => ({
        decision: "DENY",
        authorityRef: "fixture-authority:denied",
        policyVersion: "fixture-policy-v1",
      }),
      revalidateDelivery: async () => {
        throw new Error("must not run");
      },
    };
    const report = await createRetrieveInformation({
      authority: denied,
      web: new SearxngLiveAdapter(async () => {
        events.push("web-read");
        return webOutcome;
      }),
      memory: new DevelopmentMemoryIndexedAdapter([fixture()], {
        observe: (event) => {
          events.push(event);
        },
      }),
      now: () => NOW,
    })(request());
    expect(events).toEqual([]);
    expect(report).toMatchObject({
      status: "DENIED",
      diagnostic: { code: "RETRIEVE_INFORMATION_DENIED" },
      strata: [],
    });
  });

  test("memory re-reads lifecycle after delivery authorization and suppresses tombstone or revocation races", async () => {
    const records = [
      fixture({
        id: "evidence-only",
        recordKind: "custodied-evidence",
        assertionId: undefined,
        beliefRevisionRef: undefined,
        evidenceSetRef: undefined,
      }),
      fixture({ id: "race" }),
    ];
    const policy = allowPolicy([]);
    policy.revalidateDelivery = async () => {
      records[1] = fixture({
        id: "race",
        lifecycle: { ...fixture().lifecycle, deletion: "TOMBSTONED" },
      });
      return { decision: "ALLOW" };
    };
    const memory = new DevelopmentMemoryIndexedAdapter(records);
    const report = await createRetrieveInformation({
      authority: policy,
      web: new SearxngLiveAdapter(async () => ({
        results: [],
        partialFailures: [],
      })),
      memory,
      now: () => NOW,
    })(request());
    const memoryItems = report.strata
      .filter((value) => value.legId === "memory")
      .flatMap((value) => value.items);
    expect(memoryItems).toEqual([]);
    expect(report.stoppingReason).toBe("REQUIRED_LEG_UNAVAILABLE");
    expect(
      report.legs.find((leg) => leg.legId === "memory")?.failures,
    ).toContainEqual({ code: "FINAL_STATE_SUPPRESSED" });

    const revoked = [fixture({ id: "revoked" })];
    const revokedPolicy = allowPolicy([]);
    revokedPolicy.revalidateDelivery = async () => {
      revoked[0] = fixture({
        id: "revoked",
        lifecycle: {
          ...fixture().lifecycle,
          authorizationFreshness: "REVOKED",
        },
      });
      return { decision: "ALLOW" };
    };
    const revokedReport = await createRetrieveInformation({
      authority: revokedPolicy,
      web: new SearxngLiveAdapter(async () => ({
        results: [],
        partialFailures: [],
      })),
      memory: new DevelopmentMemoryIndexedAdapter(revoked),
      now: () => NOW,
    })(request());
    expect(revokedReport.strata.some((value) => value.legId === "memory")).toBe(
      false,
    );
  });

  test("enforces exact aggregate output count, UTF-8, and node budgets with deterministic prefix omission", async () => {
    const richWeb = {
      results: [{ ...webOutcome.results[0]!, content: "é".repeat(900) }],
      partialFailures: [],
    };
    const run = (budget: Record<string, number>) =>
      createRetrieveInformation({
        authority: allowPolicy([]),
        web: new SearxngLiveAdapter(async () => richWeb),
        memory: new DevelopmentMemoryIndexedAdapter([
          fixture({ excerpt: "x".repeat(1200) }),
        ]),
        now: () => NOW,
      })(request({ budget: { ...request().budget, ...budget } }));
    const baseline = await run({
      maxResults: 6,
      maxUtf8Bytes: 32_768,
      maxNodes: 256,
    });
    const items = baseline.strata.flatMap((value) => value.items);
    const exact = await run({
      maxResults: items.length,
      maxUtf8Bytes: 32_768,
      maxNodes: 256,
    });
    expect(exact.strata.flatMap((value) => value.items)).toHaveLength(
      items.length,
    );
    const over = await run({
      maxResults: items.length - 1,
      maxUtf8Bytes: 32_768,
      maxNodes: 256,
    });
    expect(over.strata.flatMap((value) => value.items)).toHaveLength(
      items.length - 1,
    );
    expect(
      over.legs.some((leg) =>
        leg.failures.some(
          (failure) => failure.code === "OUTPUT_BUDGET_EXHAUSTED",
        ),
      ),
    ).toBe(true);
    expect(() =>
      decodeRetrieveInformationRequest(
        request({ budget: { ...request().budget, maxUtf8Bytes: 128_001 } }),
      ),
    ).toThrow("RETRIEVE_INFORMATION_LIMIT_EXCEEDED");
    expect(() =>
      decodeRetrieveInformationReport({
        ...baseline,
        residualUncertainty: Array.from(
          { length: 1_100 },
          () => "GLOBAL_LIMIT",
        ),
      }),
    ).toThrow("RETRIEVE_INFORMATION_LIMIT_EXCEEDED");
  });

  test("bounds the complete returned report at exact byte/node limits and falls back to the minimal typed envelope", async () => {
    const run = (budget: Record<string, number>) =>
      createRetrieveInformation({
        authority: allowPolicy([]),
        web: new SearxngLiveAdapter(async () => webOutcome),
        memory: new DevelopmentMemoryIndexedAdapter([
          fixture({ excerpt: "x".repeat(900) }),
        ]),
        now: () => NOW,
      })(request({ budget: { ...request().budget, ...budget } }));
    const baseline = await run({ maxUtf8Bytes: 32_768, maxNodes: 256 });
    const exactMeasure = measureRetrieveInformationReport(baseline);
    const exact = await run({
      maxUtf8Bytes: exactMeasure.utf8Bytes,
      maxNodes: exactMeasure.nodes,
    });
    expect(measureRetrieveInformationReport(exact)).toEqual(exactMeasure);
    const bytePlusOne = await run({
      maxUtf8Bytes: exactMeasure.utf8Bytes - 1,
      maxNodes: exactMeasure.nodes,
    });
    expect(
      measureRetrieveInformationReport(bytePlusOne).utf8Bytes,
    ).toBeLessThanOrEqual(exactMeasure.utf8Bytes - 1);
    expect(
      bytePlusOne.strata.flatMap((value) => value.items).length,
    ).toBeLessThan(baseline.strata.flatMap((value) => value.items).length);
    const nodePlusOne = await run({
      maxUtf8Bytes: exactMeasure.utf8Bytes,
      maxNodes: exactMeasure.nodes - 1,
    });
    expect(
      measureRetrieveInformationReport(nodePlusOne).nodes,
    ).toBeLessThanOrEqual(exactMeasure.nodes - 1);
    const minimal = await run({ maxUtf8Bytes: 2_048, maxNodes: 32 });
    expect(minimal).toMatchObject({
      stoppingReason: "OUTPUT_BUDGET_EXHAUSTED",
      legs: [],
      strata: [],
      partial: true,
      residualUncertainty: ["OUTPUT_BUDGET_EXHAUSTED"],
    });
    expect(
      measureRetrieveInformationReport(minimal).utf8Bytes,
    ).toBeLessThanOrEqual(2_048);
    expect(measureRetrieveInformationReport(minimal).nodes).toBeLessThanOrEqual(
      32,
    );
    const maximumIds = await createRetrieveInformation({
      authority: {
        authorize: async () => ({
          decision: "ALLOW",
          authorityRef: "a".repeat(128),
          policyVersion: "fixture-policy-v1",
        }),
        revalidateDelivery: async () => ({ decision: "ALLOW" }),
      },
      web: new SearxngLiveAdapter(async () => webOutcome),
      memory: new DevelopmentMemoryIndexedAdapter([fixture()]),
      now: () => NOW,
    })(
      request({
        requestId: "r".repeat(128),
        budget: { ...request().budget, maxUtf8Bytes: 2_048, maxNodes: 32 },
      }),
    );
    expect(maximumIds.stoppingReason).toBe("OUTPUT_BUDGET_EXHAUSTED");
    expect(
      measureRetrieveInformationReport(maximumIds).utf8Bytes,
    ).toBeLessThanOrEqual(2_048);
    expect(
      measureRetrieveInformationReport(maximumIds).nodes,
    ).toBeLessThanOrEqual(32);
  });

  test("deadline checks stop later legs and use final delivery time", async () => {
    let monotonic = 0;
    let wall = Date.parse(NOW);
    const report = await createRetrieveInformation({
      authority: allowPolicy([]),
      web: new SearxngLiveAdapter(async () => {
        monotonic = 101;
        wall += 101;
        return webOutcome;
      }),
      memory: new DevelopmentMemoryIndexedAdapter([fixture()], {
        observe: () => {
          throw new Error("later leg started");
        },
      }),
      now: () => new Date(wall).toISOString(),
      monotonicNow: () => monotonic,
    })(
      request({
        budget: { ...request().budget, deadlineUnixMs: Date.parse(NOW) + 100 },
      }),
    );
    expect(report.stoppingReason).toBe("DEADLINE_EXHAUSTED");
    expect(report.asOf).toBe(new Date(wall).toISOString());
    expect(report.strata).toEqual([]);
    expect(report.legs.find((leg) => leg.legId === "memory")?.failures).toEqual(
      [{ code: "DEADLINE_NOT_STARTED" }],
    );
  });

  test("required leg failure blocks delivery while optional failure remains deliverable partial", async () => {
    const failingWeb = new SearxngLiveAdapter(async () => {
      throw new Error("secret provider body");
    });
    const requiredLegs = request().legs.map((leg) => ({
      ...leg,
      obligation: leg.legId === "web" ? "REQUIRED" : "OPTIONAL",
    }));
    const required = await createRetrieveInformation({
      authority: allowPolicy([]),
      web: failingWeb,
      memory: new DevelopmentMemoryIndexedAdapter([fixture()]),
      now: () => NOW,
    })(request({ legs: requiredLegs }));
    expect(required).toMatchObject({
      stoppingReason: "REQUIRED_LEG_UNAVAILABLE",
      partial: true,
      strata: [],
    });
    expect(JSON.stringify(required)).not.toContain("secret provider body");
    const optional = await createRetrieveInformation({
      authority: allowPolicy([]),
      web: failingWeb,
      memory: new DevelopmentMemoryIndexedAdapter([fixture()]),
      now: () => NOW,
    })(request());
    expect(optional.stoppingReason).toBe("DECLARED_LEGS_COMPLETED");
    expect(optional.strata.some((value) => value.legId === "memory")).toBe(
      true,
    );
  });

  test("memory failures are stable, redacted, and still reach final delivery authorization", async () => {
    for (const [failedEvent, code] of [
      ["memory-projection-read", "MEMORY_PROJECTION_UNAVAILABLE"],
      ["memory-hydration-read", "MEMORY_HYDRATION_UNAVAILABLE"],
      ["memory-final-state-check", "MEMORY_FINAL_CHECK_UNAVAILABLE"],
    ] as const) {
      const events: string[] = [];
      const report = await createRetrieveInformation({
        authority: allowPolicy(events),
        web: new SearxngLiveAdapter(async () => ({
          results: [],
          partialFailures: [],
        })),
        memory: new DevelopmentMemoryIndexedAdapter([fixture()], {
          observe: (event) => {
            if (event === failedEvent) throw new Error("secret memory path");
          },
        }),
        now: () => NOW,
      })(request());
      expect(events).toContain("delivery-revalidate");
      expect(
        report.legs.find((leg) => leg.legId === "memory")?.failures,
      ).toEqual([{ code }]);
      expect(JSON.stringify(report)).not.toContain("secret memory path");
    }
  });

  test("composition catches rejecting web retrieve, memory prepare, and memory finalize ports", async () => {
    const cases = [
      {
        stage: "web",
        web: {
          surfaceSelector: "public-web/searxng-gateway",
          retrieve: async () => {
            throw new Error(
              "RETRIEVE_INFORMATION_ADAPTER_MISMATCH secret web exception",
            );
          },
        } as unknown as SearxngLiveAdapter,
        memory: new DevelopmentMemoryIndexedAdapter([fixture()]),
        code: "WEB_RETRIEVE_UNAVAILABLE",
      },
      {
        stage: "prepare",
        web: new SearxngLiveAdapter(async () => ({
          results: [],
          partialFailures: [],
        })),
        memory: {
          surfaceSelector: "development-memory/evidence",
          prepare: async () => {
            throw new Error("secret prepare exception");
          },
          finalize: async () => {
            throw new Error("must not finalize");
          },
        } as unknown as DevelopmentMemoryIndexedAdapter,
        code: "MEMORY_PREPARE_UNAVAILABLE",
      },
      {
        stage: "finalize",
        web: new SearxngLiveAdapter(async () => ({
          results: [],
          partialFailures: [],
        })),
        memory: {
          surfaceSelector: "development-memory/evidence",
          prepare: async () => ({
            kind: "memory-preparation",
            ids: ["memory-1"],
            report: {
              legId: "memory",
              surfaceSelector: "development-memory/evidence",
              mode: "INDEXED",
              obligation: "REQUIRED",
              coverage: {
                measurement: "MEASURED",
                completeness: "COMPLETE",
                observedItems: 1,
              },
              freshness: { state: "CURRENT", observedAt: NOW },
              failures: [],
              deliveredItems: 0,
            },
          }),
          finalize: async () => {
            throw new Error("secret finalize exception");
          },
        } as unknown as DevelopmentMemoryIndexedAdapter,
        code: "MEMORY_FINALIZE_UNAVAILABLE",
      },
    ];
    for (const value of cases) {
      const events: string[] = [];
      const report = await createRetrieveInformation({
        authority: allowPolicy(events),
        web: value.web,
        memory: value.memory,
        now: () => NOW,
      })(request());
      expect(events).toContain("delivery-revalidate");
      expect(
        report.legs.some((leg) =>
          leg.failures.some(({ code }) => code === value.code),
        ),
      ).toBe(true);
      expect(JSON.stringify(report)).not.toContain("secret");
      expect(JSON.stringify(report)).not.toContain("ADAPTER_MISMATCH");
      if (value.stage !== "web")
        expect(report.stoppingReason).toBe("REQUIRED_LEG_UNAVAILABLE");
    }
  });

  test("report decoder rejects contradictory denial, mode, linkage, counts, and partiality", async () => {
    const valid = await createRetrieveInformation({
      authority: allowPolicy([]),
      web: new SearxngLiveAdapter(async () => webOutcome),
      memory: new DevelopmentMemoryIndexedAdapter([fixture()]),
      now: () => NOW,
    })(request());
    const invalid = [
      {
        ...valid,
        status: "DENIED",
        diagnostic: { code: "RETRIEVE_INFORMATION_DENIED" },
        stoppingReason: "INITIAL_AUTHORITY_DENIED",
        residualUncertainty: ["INITIAL_AUTHORITY_DENIED"],
      },
      {
        ...valid,
        legs: valid.legs.map((leg, index) =>
          index ? leg : { ...leg, mode: "INDEXED" },
        ),
      },
      {
        ...valid,
        strata: valid.strata.map((stratum, index) =>
          index ? stratum : { ...stratum, legId: "missing" },
        ),
      },
      {
        ...valid,
        legs: valid.legs.map((leg, index) =>
          index ? leg : { ...leg, deliveredItems: leg.deliveredItems + 1 },
        ),
      },
      { ...valid, partial: false },
    ];
    for (const value of invalid)
      expect(() => decodeRetrieveInformationReport(value)).toThrow(
        "RETRIEVE_INFORMATION_INVALID",
      );
    const denied = {
      ...valid,
      status: "DENIED",
      strata: [],
      legs: [],
      partial: true,
      residualUncertainty: ["WRONG"],
      stoppingReason: "INITIAL_AUTHORITY_DENIED",
      diagnostic: { code: "RETRIEVE_INFORMATION_DENIED" },
    };
    expect(() => decodeRetrieveInformationReport(denied)).toThrow(
      "RETRIEVE_INFORMATION_INVALID",
    );
  });

  test("report decoder enforces fixed web and development-memory coverage semantics", async () => {
    const valid = await createRetrieveInformation({
      authority: allowPolicy([]),
      web: new SearxngLiveAdapter(async () => webOutcome),
      memory: new DevelopmentMemoryIndexedAdapter([fixture()]),
      now: () => NOW,
    })(request());
    const webIndex = valid.legs.findIndex(
      ({ surfaceSelector }) => surfaceSelector === "public-web/searxng-gateway",
    );
    const memoryIndex = valid.legs.findIndex(
      ({ surfaceSelector }) =>
        surfaceSelector === "development-memory/evidence",
    );
    const replace = (index: number, leg: unknown) =>
      valid.legs.map((current, currentIndex) =>
        currentIndex === index ? leg : current,
      );
    const web = valid.legs[webIndex]!;
    const memory = valid.legs[memoryIndex]!;
    const invalid = [
      {
        ...valid,
        legs: replace(webIndex, {
          ...web,
          coverage: {
            ...web.coverage,
            measurement: "MEASURED",
            completeness: "COMPLETE",
          },
        }),
      },
      {
        ...valid,
        legs: replace(webIndex, {
          ...web,
          coverage: { ...web.coverage, completeness: "COMPLETE" },
        }),
      },
      {
        ...valid,
        legs: replace(webIndex, {
          ...web,
          coverage: { ...web.coverage, completeness: "UNKNOWN" },
        }),
      },
      {
        ...valid,
        legs: replace(webIndex, {
          ...web,
          freshness: { state: "UNKNOWN", observedAt: NOW },
        }),
      },
      {
        ...valid,
        legs: replace(memoryIndex, {
          ...memory,
          coverage: {
            ...memory.coverage,
            measurement: "MEASURED",
            completeness: "PARTIAL",
          },
          failures: [],
        }),
      },
    ];
    for (const value of invalid)
      expect(() => decodeRetrieveInformationReport(value)).toThrow(
        "RETRIEVE_INFORMATION_INVALID",
      );
  });

  test("final delivery denial suppresses every hydrated result", async () => {
    const report = await createRetrieveInformation({
      authority: allowPolicy([], false),
      web: new SearxngLiveAdapter(async () => webOutcome),
      memory: new DevelopmentMemoryIndexedAdapter([fixture()]),
      now: () => NOW,
    })(request());
    expect(report).toMatchObject({
      status: "DENIED",
      diagnostic: { code: "RETRIEVE_INFORMATION_DELIVERY_DENIED" },
      strata: [],
    });
  });

  test("closed decoder rejects unknown fields, credentials, bounds, prototypes, and lower-kind promotion", () => {
    expect(
      JSON.parse(JSON.stringify(decodeRetrieveInformationRequest(request()))),
    ).toEqual(JSON.parse(JSON.stringify(request())));
    for (const invalid of [
      request({ token: "secret" }),
      request({ legs: [...request().legs, request().legs[0]] }),
      request({ budget: { ...request().budget, maxNodes: 10 } }),
      request({ objective: { question: "x", surprise: true } }),
      request({ authenticatedContextRef: "Bearer secret" }),
    ])
      expect(() => decodeRetrieveInformationRequest(invalid)).toThrow(
        /RETRIEVE_INFORMATION_(UNKNOWN_FIELD|INVALID|LIMIT_EXCEEDED)/,
      );
    const hostile = Object.create({ token: "inherited" });
    Object.assign(hostile, request());
    expect(() => decodeRetrieveInformationRequest(hostile)).toThrow(
      "RETRIEVE_INFORMATION_INVALID",
    );
    expect(() =>
      decodeRetrieveInformationReport({
        schemaVersion: 2,
        contract: "curiosity.retrieval/retrieve-information-report/v2",
        status: "OK",
        requestId: "x",
        authorityRef: "a",
        asOf: NOW,
        strata: [
          {
            stratumId: "s",
            legId: "web",
            epistemicKind: "custodied-evidence",
            items: [{ recordKind: "source-observation" }],
          },
        ],
        legs: [],
        partial: false,
        residualUncertainty: [],
        stoppingReason: "DECLARED_LEGS_COMPLETED",
      }),
    ).toThrow("RETRIEVE_INFORMATION_INVALID");
  });

  test("internal projection is lossless, bounded, and no action operation exists", async () => {
    const report = await createRetrieveInformation({
      authority: allowPolicy([]),
      web: new SearxngLiveAdapter(async () => webOutcome),
      memory: new DevelopmentMemoryIndexedAdapter([fixture()]),
      now: () => NOW,
    })(request());
    expect(projectRetrieveInformationReport(report)).toEqual(report);
    expect(Object.keys(report)).not.toContain("actions");
    expect(JSON.stringify(report)).not.toMatch(
      /"operation":"(?:capture|validate|activate|erase|restore|executeAction)"/,
    );
  });

  test("fixtures and transports are project-injected and compatibility exports remain untouched", async () => {
    let calls = 0;
    const adapter = new SearxngLiveAdapter(async (input) => {
      calls += 1;
      expect(input.question).toBe("What supports alpha?");
      return webOutcome;
    });
    await createRetrieveInformation({
      authority: allowPolicy([]),
      web: adapter,
      memory: new DevelopmentMemoryIndexedAdapter([fixture()]),
      now: () => NOW,
    })(request());
    expect(calls).toBe(1);
    expect(fixture().rightsClearance).toBe("PROJECT_AUTHORED_CC0_FIXTURE");
    const packageJson = await Bun.file(
      new URL("../package.json", import.meta.url),
    ).json();
    expect(Object.keys(packageJson.exports)).toEqual([
      ".",
      "./query",
      "./admin",
      "./owned-query",
    ]);
  });
});
