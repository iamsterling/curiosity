import { describe, expect, it } from "vitest";

import { createFileWorkspace } from "./workspace.js";

describe("editor workspace", () => {
  it("describes the current first-party file workspace", () => {
    expect(createFileWorkspace("project-a")).toEqual({
      mode: "design",
      file: {
        slug: "project-a",
        href: "/editor/project-a",
        browserHref: "/editor",
      },
    });
  });
});
