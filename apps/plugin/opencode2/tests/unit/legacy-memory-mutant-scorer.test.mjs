import assert from "node:assert/strict";
import test from "node:test";
import { scoreMutationReceipts } from "../../tools/legacy-memory-mutant-scorer.mjs";

const valid = (id = "m1") => ({
  id,
  diffHash: `diff-${id}`,
  sourceHash: `source-${id}`,
  baselineTestPass: true,
  mutantCompilePass: true,
  designatedTest: "test-a",
  observedTest: "test-a",
  designatedVector: "vector-a",
  observedVector: "vector-a",
  expectedMismatchField: "/result/value",
  observedField: "/result/value",
  verdict: "killed",
});

for (const [name, mutate, code] of [
  [
    "baseline-failing test",
    (r) => (r.baselineTestPass = false),
    "MUTANT_BASELINE_FAILED",
  ],
  [
    "compile-failing mutant",
    (r) => (r.mutantCompilePass = false),
    "MUTANT_COMPILE_FAILED",
  ],
  [
    "unrelated test failure",
    (r) => (r.observedTest = "test-b"),
    "MUTANT_UNRELATED_TEST_FAILURE",
  ],
  [
    "wrong vector",
    (r) => (r.observedVector = "vector-b"),
    "MUTANT_WRONG_VECTOR",
  ],
  ["wrong field", (r) => (r.observedField = "/wrong"), "MUTANT_WRONG_FIELD"],
]) {
  test(`mutant scorer rejects ${name}`, () => {
    const receipt = valid();
    mutate(receipt);
    assert.throws(() => scoreMutationReceipts([receipt]), new RegExp(code));
  });
}

test("mutant scorer rejects duplicate mutants", () => {
  const first = valid("one");
  const second = valid("two");
  second.diffHash = first.diffHash;
  assert.throws(
    () => scoreMutationReceipts([first, second]),
    /MUTANT_DUPLICATE_DIFF/,
  );
});
