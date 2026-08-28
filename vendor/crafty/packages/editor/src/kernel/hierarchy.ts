import type { DocumentCommand } from "./commands.js";
import type { DocumentId, DocumentNode, EditorDocument, Rect } from "./document.js";

/**
 * Group and ungroup, planned as pure command lists.
 *
 * Both are composites over `reparent-node`, so they must be dispatched as a
 * single batch: `dispatchBatch` is atomic, which is what makes a rejected
 * command midway (a cycle, a bad index) leave the document untouched rather
 * than half-grouped.
 */

const GROUP_FILL = "#00000000";
const GROUP_STROKE = "#00000000";

const unionBounds = (nodes: DocumentNode[]): Rect => {
  const minX = Math.min(...nodes.map((node) => node.bounds.x));
  const minY = Math.min(...nodes.map((node) => node.bounds.y));
  const maxX = Math.max(...nodes.map((node) => node.bounds.x + node.bounds.width));
  const maxY = Math.max(...nodes.map((node) => node.bounds.y + node.bounds.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

/**
 * Wrap `nodeIds` in a new group under their shared parent.
 *
 * Members keep their document order, and the group takes the slot of the
 * lowest-ordered member. Every member must share one parent: grouping across
 * parents has no single correct z-order or coordinate space, so it is rejected
 * rather than guessed at.
 */
export const planGroup = (document: EditorDocument, nodeIds: readonly DocumentId[], groupId: DocumentId, name = "Group"): DocumentCommand[] => {
  if (nodeIds.length === 0) throw new Error("DOCUMENT_GROUP_EMPTY");
  if (document.nodes[groupId]) throw new Error(`DOCUMENT_NODE_EXISTS:${groupId}`);
  const unique = [...new Set(nodeIds)];
  const nodes = unique.map((id) => {
    const node = document.nodes[id];
    if (!node) throw new Error(`DOCUMENT_NODE_MISSING:${id}`);
    return node;
  });
  if (nodes.some((node) => node.parentId === null)) throw new Error("DOCUMENT_GROUP_ROOT");
  const parentId = nodes[0]!.parentId!;
  if (nodes.some((node) => node.parentId !== parentId)) throw new Error("DOCUMENT_GROUP_MIXED_PARENTS");
  const parent = document.nodes[parentId];
  if (!parent) throw new Error(`DOCUMENT_PARENT_MISSING:${parentId}`);

  // Document order, not selection order — grouping must not reshuffle z-order.
  const ordered = [...nodes].sort((left, right) => parent.childIds.indexOf(left.id) - parent.childIds.indexOf(right.id));
  const insertIndex = parent.childIds.indexOf(ordered[0]!.id);
  const group: DocumentNode = {
    id: groupId,
    kind: "group",
    name,
    parentId,
    childIds: [],
    bounds: unionBounds(ordered),
    transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    visible: true,
    locked: false,
    opacity: 1,
    fill: GROUP_FILL,
    stroke: GROUP_STROKE,
    cornerRadius: 0,
    zIndex: parent.childIds.length + 1
  };
  return [
    { type: "create-node", node: group },
    ...ordered.map((node, index): DocumentCommand => ({ type: "reparent-node", nodeId: node.id, parentId: groupId, index })),
    // Every member has left the parent by now, and no unselected sibling sat
    // below the lowest member, so the original index is still the right slot.
    { type: "reparent-node", nodeId: groupId, parentId, index: insertIndex }
  ];
};

/**
 * Dissolve a group, lifting its children into its parent at its own position
 * and preserving their order.
 */
export const planUngroup = (document: EditorDocument, groupId: DocumentId): DocumentCommand[] => {
  const group = document.nodes[groupId];
  if (!group) throw new Error(`DOCUMENT_NODE_MISSING:${groupId}`);
  if (group.kind !== "group") throw new Error(`DOCUMENT_UNGROUP_NOT_A_GROUP:${group.kind}`);
  const parentId = group.parentId;
  if (!parentId) throw new Error("DOCUMENT_UNGROUP_ROOT");
  const parent = document.nodes[parentId];
  if (!parent) throw new Error(`DOCUMENT_PARENT_MISSING:${parentId}`);
  const groupIndex = parent.childIds.indexOf(groupId);
  if (groupIndex < 0) throw new Error("DOCUMENT_UNGROUP_CHILD_MISSING");
  // Each child lands immediately before the group, which drifts right as they
  // arrive — so the children end up in order, in the group's old slot.
  return [
    ...group.childIds.map((childId, index): DocumentCommand => ({ type: "reparent-node", nodeId: childId, parentId, index: groupIndex + index })),
    { type: "delete-node", nodeId: groupId }
  ];
};
