import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import configuration from "../next.config.js";

test("docs starter configuration and page source load without a product capability claim", async () => {
  assert.deepEqual(configuration, {});
  await access(new URL("../app/page.tsx", import.meta.url));
  assert.match(await readFile(new URL("../app/page.tsx", import.meta.url), "utf8"), /export default function Home/u);
});
