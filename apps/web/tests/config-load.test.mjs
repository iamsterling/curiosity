import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

import configuration from "../next.config.js";

test("one web app composes governed Curiosity and Craft surfaces", async () => {
  assert.deepEqual(configuration, {
    serverExternalPackages: [
      "@crafty/scene-store",
      "@curiosity/custom-harness",
      "@curiosity/runtime",
    ],
  });
  await Promise.all([
    access(new URL("../app/page.tsx", import.meta.url)),
    access(new URL("../app/editor/page.tsx", import.meta.url)),
    access(new URL("../app/editor/[slug]/page.tsx", import.meta.url)),
    access(new URL("../app/api/curiosity/chat/route.ts", import.meta.url)),
    access(new URL("../app/api/files/[slug]/document/route.ts", import.meta.url)),
  ]);
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const layout = await readFile(
    new URL("../app/layout.tsx", import.meta.url),
    "utf8",
  );
  const chatRoute = await readFile(
    new URL("../app/api/curiosity/chat/route.ts", import.meta.url),
    "utf8",
  );
  const kernelBoundary = await readFile(
    new URL("../app/dashboard-kernel.ts", import.meta.url),
    "utf8",
  );
  const appEntries = await readdir(new URL("../app", import.meta.url), {
    recursive: true,
  });

  assert.match(page, /DashboardClient/u);
  assert.match(layout, /DashboardRail/u);
  assert.match(chatRoute, /loadDashboardKernel/u);
  assert.match(
    kernelBoundary,
    /@curiosity\/custom-harness\/dashboard\/node/u,
  );
  assert.doesNotMatch(
    `${page}\n${layout}\n${chatRoute}`,
    /signCommand|createCuriosityHarness|CURIOSITY_AUTH_SECRET/u,
  );
  assert.equal(
    appEntries.some((entry) => /actions?\.[cm]?[jt]sx?$/u.test(entry)),
    false,
  );
});

test("Craft remains a mode of the Curiosity app rather than a second app", async () => {
  const rootPackage = JSON.parse(
    await readFile(new URL("../../../package.json", import.meta.url), "utf8"),
  );
  const webPackage = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  const craftPage = await readFile(
    new URL("../app/editor/page.tsx", import.meta.url),
    "utf8",
  );
  assert.equal(rootPackage.workspaces.includes("vendor/crafty/apps/*"), false);
  assert.equal(rootPackage.workspaces.includes("vendor/crafty/packages/editor"), true);
  assert.match(webPackage.scripts.dev, /^bun --bun next dev/u);
  assert.match(webPackage.scripts.start, /^bun --bun next start/u);
  assert.match(webPackage.scripts.dev, /--hostname 0\.0\.0\.0/u);
  assert.match(webPackage.scripts.start, /--hostname 0\.0\.0\.0/u);
  assert.doesNotMatch(
    await readFile(new URL("../app/dashboard-client.tsx", import.meta.url), "utf8"),
    /crypto\.randomUUID/u,
  );
  assert.match(craftPage, /Curiosity-owned surface/u);
});
