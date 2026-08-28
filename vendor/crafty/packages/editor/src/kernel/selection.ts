import type { DocumentId, EditorDocument, Rect } from "./document.js";

/** Derived from live authored bounds; selection geometry is never stored. */
export const selectionUnionBounds = (document: EditorDocument, pageId: DocumentId, ids: readonly DocumentId[]): Rect | undefined => {
  const page = document.pages[pageId];
  if (!page) return undefined;
  let result: Rect | undefined;
  for (const id of ids) {
    const node = document.nodes[id];
    if (!node || id === page.rootId) continue;
    const { bounds } = node;
    const x = result ? Math.min(result.x, bounds.x) : bounds.x;
    const y = result ? Math.min(result.y, bounds.y) : bounds.y;
    const right = result ? Math.max(result.x + result.width, bounds.x + bounds.width) : bounds.x + bounds.width;
    const bottom = result ? Math.max(result.y + result.height, bounds.y + bounds.height) : bounds.y + bounds.height;
    result = { x, y, width: right - x, height: bottom - y };
  }
  return result;
};
