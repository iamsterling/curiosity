import { describe, expect, test } from "bun:test";
import { evaluateMetrics } from "../tools/efficiency/metrics.js";

describe("efficiency evaluation", () => {
  test("fails a breached budget and reports baseline movement", () => {
    const [metric] = evaluateMetrics(
      {
        stream: {
          metrics: { latency_ms: 12 },
          units: { latency_ms: "ms" },
        },
      },
      { "stream.latency_ms": { maximum: 10 } },
      { "stream.latency_ms": 8 },
    );
    expect(metric).toEqual({
      baselineDeltaPercent: 50,
      budget: { maximum: 10 },
      id: "stream.latency_ms",
      passed: false,
      unit: "ms",
      value: 12,
    });
  });

  test("rejects a budget without a corresponding observation", () => {
    expect(() =>
      evaluateMetrics(
        { stream: { metrics: {}, units: {} } },
        { "stream.missing": { maximum: 1 } },
      ),
    ).toThrow("EFFICIENCY_METRIC_MISSING:stream.missing");
  });
});
