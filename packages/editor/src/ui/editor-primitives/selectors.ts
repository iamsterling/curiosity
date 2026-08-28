import type { EditorTool } from "../../kernel/index.js";
import type { EditorProjection } from "../editor/harness.js";

export const selectTool = (projection: EditorProjection): EditorTool =>
  projection.interaction.tool;
export const selectHasSelection = (projection: EditorProjection): boolean =>
  projection.selectedIds.length > 0;
export const selectHistory = (projection: EditorProjection): string =>
  `${projection.canUndo ? "1" : "0"}${projection.canRedo ? "1" : "0"}`;
export const selectGridVisible = (projection: EditorProjection): boolean =>
  projection.gridVisible;
export const selectZoom = (projection: EditorProjection): number =>
  projection.viewport.zoom;
/** The active page's snap families, serialized for equality — the snap
 *  settings surface's state. */
export const selectSnapSettings = (
  projection: EditorProjection,
): { grid: boolean; guides: boolean; objects: boolean; pixel: boolean } => {
  const page = projection.pages.find(
    (candidate) => candidate.id === projection.activePageId,
  );
  return page?.canvas.snap ?? { grid: false, guides: false, objects: false, pixel: false };
};
