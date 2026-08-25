import { describe, expect, test } from "bun:test";

import baseline from "./fixtures/qualified-input.json";

type QualificationInput = typeof baseline;

const clone = (): QualificationInput => structuredClone(baseline);
const remainsQualified = (candidate: QualificationInput) =>
  JSON.stringify(candidate) === JSON.stringify(baseline);

describe("Q1-T02 qualification invalidation", () => {
  test("unchanged exact input remains current", () => {
    expect(remainsQualified(clone())).toBe(true);
  });

  test.each([
    [
      "pin",
      (candidate: QualificationInput) => {
        candidate.effect.version = "4.0.0-beta.108";
      },
    ],
    [
      "feature/import surface",
      (candidate: QualificationInput) => {
        candidate.effect.importSurface.push("effect/Schema");
      },
    ],
    [
      "source digest",
      (candidate: QualificationInput) => {
        candidate.effect.artifactSha256 = "0".repeat(64);
      },
    ],
    [
      "platform artifact",
      (candidate: QualificationInput) => {
        candidate.buildTest.turbo.platformBinarySha256 = "f".repeat(64);
      },
    ],
    [
      "platform",
      (candidate: QualificationInput) => {
        candidate.buildTest.target.arch = "x64";
      },
    ],
  ])("changed %s invalidates the qualification", (_label, mutate) => {
    const candidate = clone();
    mutate(candidate);
    expect(remainsQualified(candidate)).toBe(false);
  });
});
