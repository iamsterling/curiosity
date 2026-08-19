import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { qualifyOwnedWebFixture } from "../src/owned-web-qualification.js";

test("qualification wrapper rejects non-absolute caller paths before native code", () => {
  expect(() =>
    qualifyOwnedWebFixture("relative", "fixture.html", "fixture.proof"),
  ).toThrow("OWNED_WEB_QUALIFICATION_PATH_INVALID");
});

test.skipIf(process.env.CURIOSITY_OWNED_WEB_QUALIFICATION !== "1")(
  "qualification wrapper admits only the project fixture into a pre-existing operator-controlled root",
  () => {
    const root = realpathSync(
      mkdtempSync(join(tmpdir(), "curiosity-owned-web-ts-")),
    );
    const fixture = realpathSync(
      new URL(
        "../fixtures/owned-web-qualification/v1/static.html",
        import.meta.url,
      ).pathname,
    );
    const proof = realpathSync(
      new URL(
        "../fixtures/owned-web-qualification/v1/static.proof",
        import.meta.url,
      ).pathname,
    );
    try {
      qualifyOwnedWebFixture(root, fixture, proof);
      const privateRoot = join(root, ".owned-web-qualification-v1");
      expect(existsSync(join(privateRoot, "control.sqlite3"))).toBe(true);
      expect(existsSync(join(privateRoot, "objects"))).toBe(true);
      expect(existsSync(join(privateRoot, "records"))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);

test.skipIf(process.env.CURIOSITY_OWNED_WEB_QUALIFICATION !== "1")(
  "qualification wrapper rejects an absent operator root without creating it",
  () => {
    const parent = realpathSync(
      mkdtempSync(join(tmpdir(), "curiosity-owned-web-absent-")),
    );
    const root = join(parent, "missing-root");
    const fixture = realpathSync(
      new URL(
        "../fixtures/owned-web-qualification/v1/static.html",
        import.meta.url,
      ).pathname,
    );
    const proof = realpathSync(
      new URL(
        "../fixtures/owned-web-qualification/v1/static.proof",
        import.meta.url,
      ).pathname,
    );
    try {
      expect(() => qualifyOwnedWebFixture(root, fixture, proof)).toThrow(
        "OWNED_WEB_QUALIFICATION_REJECTED",
      );
      expect(existsSync(root)).toBe(false);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  },
);

test.skipIf(process.env.CURIOSITY_OWNED_WEB_QUALIFICATION !== "1")(
  "rejected qualification cleans its created subtree under a stable operator root",
  () => {
    const root = realpathSync(
      mkdtempSync(join(tmpdir(), "curiosity-owned-web-rejected-")),
    );
    const fixture = realpathSync(
      new URL(
        "../fixtures/owned-web-qualification/v1/static.html",
        import.meta.url,
      ).pathname,
    );
    const wrongProof = realpathSync(
      new URL(
        "../fixtures/owned-web-qualification/v1/plain.proof",
        import.meta.url,
      ).pathname,
    );
    try {
      expect(() => qualifyOwnedWebFixture(root, fixture, wrongProof)).toThrow(
        "OWNED_WEB_QUALIFICATION_REJECTED",
      );
      expect(existsSync(join(root, ".owned-web-qualification-v1"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);
