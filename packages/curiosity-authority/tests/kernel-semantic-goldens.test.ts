import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { canonicalJson } from "../src/index.js";
import inventory from "./fixtures/kernel-semantics-v1.json" with { type: "json" };

const requiredCases = [
  "workflow-start-advance-terminal",
  "action-allocation-idempotent",
  "binding-gate-exact-decision",
  "bounded-child-lineage",
  "cancellation-descendant-fence",
  "no-progress-budget",
  "bounded-tool-loop",
  "provider-delivery-ambiguity",
  "terminal-receipt-reconciliation",
] as const;

describe("agent-kernel semantic golden inventory", () => {
  test("freezes every H0 behavior with all four evidence views and a mobile owner", () => {
    expect(inventory.schemaVersion).toBe(1);
    expect(inventory.cases.map(({ id }) => id)).toEqual([...requiredCases]);
    expect(new Set(inventory.cases.map(({ id }) => id)).size).toBe(
      inventory.cases.length,
    );
    for (const golden of inventory.cases) {
      expect(golden.desktopOracle.file).toMatch(/\.test\.ts$/u);
      expect(golden.desktopOracle.test.length).toBeGreaterThan(0);
      expect(Object.keys(golden.input).length).toBeGreaterThan(0);
      expect(Object.keys(golden.expected.events).length).toBeGreaterThan(0);
      expect(Object.keys(golden.expected.projection).length).toBeGreaterThan(0);
      expect(Object.keys(golden.expected.operationalState).length).toBeGreaterThan(
        0,
      );
      expect(golden.mobileOwner).toMatch(
        /^(AgentJournalPort|AgentKernel|PortableAuthority)/u,
      );
    }
  });

  test("has a stable canonical digest", () => {
    expect(
      createHash("sha256").update(canonicalJson(inventory)).digest("hex"),
    ).toBe("9d9471642f56349eb34a39415586ae99f841bce1b3ee23aa89c22a632c51e5de");
  });
});
