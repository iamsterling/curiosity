import { describe, expect, it } from "vitest";

import type { EditorTool } from "../../kernel/index.js";
import { isCreationStyleTool } from "./creation-style-tools.js";

describe("creation style control visibility", () => {
  it.each([
    ["rectangle", true],
    ["ellipse", true],
    ["frame", true],
    ["line", true],
    ["pen", true],
    ["select", false],
    ["hand", false],
  ] as const)("returns %s => %s", (tool, visible) => {
    expect(isCreationStyleTool(tool as EditorTool)).toBe(visible);
  });
});
