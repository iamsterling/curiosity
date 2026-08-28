import type { EditorTool } from "../../kernel/index.js";

/**
 * The single source of truth for tool names and shortcuts. The toolbar pills
 * and the keyboard bindings both read it, so a tool can never carry different
 * keys or labels in the two places, and the `Record<EditorTool, string>` types
 * force the compiler to name every tool here when the kernel union grows.
 *
 * The pen is the path tool (Photoshop's model — drawing AND point editing),
 * which is why the old node tool's N key routes here too.
 */
export const TOOL_LABELS: Record<EditorTool, string> = {
  select: "Select",
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  line: "Line",
  frame: "Frame",
  hand: "Hand",
  pen: "Pen",
};

export const TOOL_SHORTCUTS: Record<EditorTool, string> = {
  select: "V",
  rectangle: "R",
  ellipse: "O",
  line: "L",
  frame: "F",
  hand: "H",
  pen: "P",
};

export const ALL_TOOLS: readonly EditorTool[] = [
  "select",
  "rectangle",
  "ellipse",
  "line",
  "frame",
  "hand",
  "pen",
];

/** Legacy keys that still route to a tool — N was the node tool, which is
 *  now the pen. */
const TOOL_ALIAS_KEYS: Readonly<Record<string, EditorTool>> = {
  n: "pen",
};

/** Shortcut key (lowercased) → tool, for the keyboard bindings. */
export const TOOL_BY_KEY: Readonly<Record<string, EditorTool>> = {
  ...Object.fromEntries(
    (Object.entries(TOOL_SHORTCUTS) as [EditorTool, string][]).map(
      ([tool, key]) => [key.toLowerCase(), tool],
    ),
  ),
  ...TOOL_ALIAS_KEYS,
};
