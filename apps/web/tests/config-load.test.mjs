import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

import configuration from "../next.config.js";

test("web configuration and page expose only the read-only thread projection", async () => {
  assert.deepEqual(configuration, {
    serverExternalPackages: ["@curiosity/custom-harness"],
  });
  await access(new URL("../app/page.tsx", import.meta.url));
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const loader = await readFile(
    new URL("../app/thread-projections.ts", import.meta.url),
    "utf8",
  );
  const appEntries = await readdir(new URL("../app", import.meta.url), {
    recursive: true,
  });

  assert.match(page, /loadThreadProjectionView/u);
  assert.match(loader, /@curiosity\/custom-harness\/thread-projections\/node/u);
  assert.doesNotMatch(
    `${page}\n${loader}`,
    /\bsubmit\b|signCommand|createCuriosityHarness|["']use server["']/u,
  );
  assert.equal(
    appEntries.some((entry) =>
      /(?:^|\/)api(?:\/|$)|actions?\.[cm]?[jt]sx?$/u.test(entry),
    ),
    false,
  );
});
