import type { DocumentId, EditorDocument, PathGeometry } from "./document.js";
import { booleanOperate, type BooleanOperand, type BooleanResult } from "./boolean.js";
import { ORDER_KEY_STEP, orderKeyForSigned, resolveAutoHandles } from "./path-geometry.js";

/**
 * The compound's resolved outline (the `vector-editing` change, section 5):
 * a kernel-side projection over the members' RESOLVED geometries in member
 * order (the `childIds` order — subtract/exclude read it). The merged outline
 * is a disposable resolution product, never written back; the authored
 * compound record carries only the operation. The projection re-resolves on
 * every call, so member edits land in the next projection for free.
 *
 * The projection-facing forms never throw: an unresolvable outline (missing
 * members, engine preconditions) yields `undefined`, and the consumers draw
 * nothing. The COMMANDS resolve the outline strictly — the engine's
 * `VECTOR_BOOLEAN_*` precondition codes surface as-is from `booleanOperate`.
 *
 * Rectangle and frame members contribute their tight rect as path geometry
 * (the engine consumes paths); the authored `cornerRadius` is not yet
 * carried into the outline — a v1 limitation, noted in the change's tick.
 */

/** A rectangle/frame member's surface as a pinned closed path (min corner at
 *  (0,0)); the node's bounds carry the placement, exactly like path nodes. */
const rectPathGeometry = (width: number, height: number): PathGeometry => {
  const subpathId = "rect-s0";
  const corner = (name: string, x: number, y: number, index: number): PathGeometry["points"][string] => ({
    id: `rect-${name}`,
    subpathId,
    order: orderKeyForSigned(index * ORDER_KEY_STEP),
    x,
    y,
    handleMode: "corner",
  });
  const p0 = corner("p0", 0, 0, 0);
  const p1 = corner("p1", width, 0, 1);
  const p2 = corner("p2", width, height, 2);
  const p3 = corner("p3", 0, height, 3);
  return {
    points: { [p0.id]: p0, [p1.id]: p1, [p2.id]: p2, [p3.id]: p3 },
    subpaths: { [subpathId]: { id: subpathId, closed: true } },
    fillRule: "nonzero",
  };
};

/**
 * One compound member in the engine's operand form: pinned geometry + world
 * placement. Path members contribute their RESOLVED geometry (auto handles
 * materialized — the engine consumes path geometry, and an auto point stores
 * no handles); rectangle and frame members contribute their tight rect.
 * `undefined` when the member is not a shape the engine can consume.
 */
export const compoundMemberOperand = (document: EditorDocument, memberId: DocumentId): BooleanOperand | undefined => {
  const member = document.nodes[memberId];
  if (!member) return undefined;
  if (member.kind === "path") {
    if (!member.path) return undefined;
    return { geometry: resolveAutoHandles(member.path), placement: { x: member.bounds.x, y: member.bounds.y } };
  }
  if (member.kind === "rectangle" || member.kind === "frame") {
    return { geometry: rectPathGeometry(member.bounds.width, member.bounds.height), placement: { x: member.bounds.x, y: member.bounds.y } };
  }
  return undefined;
};

/** The members' engine operands in member order, or `undefined` when the node
 *  is not a compound or any member is unresolvable (missing, an unsupported
 *  kind, missing path geometry). The projection-facing form — the commands
 *  validate member kinds loudly and resolve strictly. */
export const compoundMemberOperands = (document: EditorDocument, nodeId: DocumentId): BooleanOperand[] | undefined => {
  const node = document.nodes[nodeId];
  if (!node || node.kind !== "compound" || !node.compound) return undefined;
  if (node.childIds.length < 2) return undefined;
  const operands: BooleanOperand[] = [];
  for (const childId of node.childIds) {
    const operand = compoundMemberOperand(document, childId);
    if (!operand) return undefined;
    operands.push(operand);
  }
  return operands;
};

/** The compound's merged outline as a pinned `BooleanResult` (geometry +
 *  world placement), or `undefined` when the outline cannot be produced:
 *  unresolvable members, an engine precondition failure, or an empty boolean
 *  result. Pure, disposable, deterministic across calls — never written back. */
export const resolveCompoundOutlineResult = (document: EditorDocument, nodeId: DocumentId): BooleanResult | undefined => {
  const node = document.nodes[nodeId];
  const operands = compoundMemberOperands(document, nodeId);
  if (!node?.compound || !operands) return undefined;
  try {
    const result = booleanOperate(operands, node.compound.operation, `compound-${nodeId}-outline`);
    return Object.keys(result.geometry.subpaths).length > 0 ? result : undefined;
  } catch {
    // Engine preconditions (open subpaths, area-less members) mean "not
    // computable", not corruption: the projection reports nothing to draw.
    return undefined;
  }
};

/** The compound's resolved outline geometry (pinned form), or `undefined`
 *  when it cannot be produced. The scene/harness projection consumer. */
export const resolveCompoundOutline = (document: EditorDocument, nodeId: DocumentId): PathGeometry | undefined =>
  resolveCompoundOutlineResult(document, nodeId)?.geometry;
