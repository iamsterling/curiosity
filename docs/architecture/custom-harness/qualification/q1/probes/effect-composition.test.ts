import { describe, expect, test } from "bun:test";

import { runEffectCompositionProbe } from "./effect-composition";

describe("Q1-W02 exact Effect composition boundary", () => {
  test("one ManagedRuntime owns one cached application layer and closes once", async () => {
    expect(await runEffectCompositionProbe()).toEqual({
      acquisitions: 1,
      releases: 1,
      transitions: 2,
      oneCachedContext: true,
      duplicateRuntime: false,
      rejectedAfterDispose: true,
    });
  });
});
