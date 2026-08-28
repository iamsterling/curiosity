import { describe, expect, it } from "vitest";

import {
  ALL_TOOLS,
  TOOL_BY_KEY,
  TOOL_LABELS,
  TOOL_SHORTCUTS,
} from "./tool-shortcuts.js";

describe("tool-shortcuts", () => {
  it("names and shortcuts cover every tool exactly once", () => {
    const tools = new Set(ALL_TOOLS);
    expect(tools.size).toBe(ALL_TOOLS.length);
    expect(Object.keys(TOOL_LABELS).sort()).toEqual([...tools].sort());
    expect(Object.keys(TOOL_SHORTCUTS).sort()).toEqual([...tools].sort());
  });

  it("maps every shortcut key back to its tool", () => {
    for (const tool of ALL_TOOLS) {
      expect(TOOL_BY_KEY[TOOL_SHORTCUTS[tool].toLowerCase()]).toBe(tool);
    }
  });

  it("keeps the documented key set", () => {
    expect(TOOL_SHORTCUTS).toEqual({
      select: "V",
      rectangle: "R",
      ellipse: "O",
      line: "L",
      frame: "F",
      hand: "H",
      pen: "P",
    });
  });

  it("routes the legacy node key N to the pen tool", () => {
    expect(TOOL_BY_KEY.n).toBe("pen");
  });

  it("labels every tool with non-empty text", () => {
    for (const tool of ALL_TOOLS) {
      expect(TOOL_LABELS[tool].length).toBeGreaterThan(0);
    }
  });
});
