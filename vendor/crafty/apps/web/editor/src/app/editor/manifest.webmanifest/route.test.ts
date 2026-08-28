import { describe, expect, it } from "vitest";

import { GET, manifest } from "./route";

describe("editor manifest route", () => {
  it("advertises install metadata only for the editor zone", async () => {
    const response = GET();

    expect(response.headers.get("content-type")).toContain("application/manifest+json");
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(await response.json()).toEqual(manifest);
  });
});
