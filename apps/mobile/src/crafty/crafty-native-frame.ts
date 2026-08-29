import {
  editorDocumentToScene,
  projectSelectionBox,
  screenToWorld,
  type EditorKernel,
} from "@crafty/editor/kernel";
import {
  projectDocumentDrawCommands,
  projectDocumentGlassSurfaces,
} from "@crafty/editor/rendering";
import { composeRenderFrame, sceneToRenderFrame } from "@crafty/scene-renderer";
export type CanvasSize = Readonly<{
  height: number;
  pixelRatio: number;
  width: number;
}>;

export const serializeCraftyNativeFrame = (
  kernel: EditorKernel,
  size: CanvasSize,
): string => {
  const projection = kernel.getProjection();
  const scene = editorDocumentToScene(
    projection.resolvedDocument,
    projection.documentRevision,
  );
  const frameId = projection.state.currentPageId.replace(/^page-/u, "");
  const { panX, panY, zoom } = projection.state.viewport;
  const selectedIds = projection.state.selectedIds;
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : undefined;
  const frame = sceneToRenderFrame(
    scene,
    frameId,
    {
      height: size.height,
      panX,
      panY,
      pixelRatio: size.pixelRatio,
      width: size.width,
      zoom,
    },
    selectedId,
  );
  const selectionBox = selectedIds.length > 0
    ? projectSelectionBox(
        projection.resolvedDocument,
        projection.state.currentPageId,
        selectedIds,
      )
    : undefined;
  const draft = projection.state.interaction.draftBounds;
  const draftStart = draft
    ? screenToWorld({ x: draft.x, y: draft.y }, projection.state.viewport)
    : undefined;
  const draftEnd = draft
    ? screenToWorld(
        { x: draft.x + draft.width, y: draft.y + draft.height },
        projection.state.viewport,
      )
    : undefined;
  const previewBounds =
    draftStart && draftEnd
      ? {
          x: Math.min(draftStart.x, draftEnd.x),
          y: Math.min(draftStart.y, draftEnd.y),
          width: Math.abs(draftEnd.x - draftStart.x),
          height: Math.abs(draftEnd.y - draftStart.y),
        }
      : undefined;
  return JSON.stringify(
    composeRenderFrame(frame, {
      glassSurfaces: projectDocumentGlassSurfaces(
        projection.resolvedDocument,
      ),
      pathCommands: projectDocumentDrawCommands(
        projection.resolvedDocument,
        projection.state.currentPageId,
      ),
      ...(previewBounds ? { previewBounds } : {}),
      ...(selectionBox ? { selectionBox } : {}),
    }),
  );
};
