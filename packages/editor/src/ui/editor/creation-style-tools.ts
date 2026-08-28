import type { EditorTool } from "../../kernel/index.js";

const CREATION_STYLE_TOOLS: ReadonlySet<EditorTool> = new Set([
  "rectangle",
  "ellipse",
  "frame",
  "line",
  "pen",
]);

export const isCreationStyleTool = (tool: EditorTool): boolean =>
  CREATION_STYLE_TOOLS.has(tool);
