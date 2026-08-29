import {
  createEditorKernel,
  type EditorDocument,
  type EditorKernel,
} from "@crafty/editor/kernel";
import {
  parseDocumentEntry,
  parseUiManifest,
  UI_DOCUMENT_ROLE,
} from "@crafty/scene-store/ui-format";
import { installCraftyRuntimeAdapters } from "./crafty-runtime-adapter";

const RECTANGLE_ID = "rectangle-portability";
const COMMITTED_DELTA = Object.freeze({ dx: 24, dy: 16 });

export type CraftyUiPackageBytes = {
  readonly manifest: string;
  readonly documentEntry: string;
};

export type CraftyKernelPortabilityEvidence = {
  readonly cancelledBytes: string;
  readonly committedBytes: string;
  readonly initialBytes: string;
  readonly redoneBytes: string;
  readonly undoneBytes: string;
};

const invariant: (condition: unknown, code: string) => asserts condition = (
  condition,
  code,
) => {
  if (!condition) throw new Error(code);
};

export const parseCraftyUiPackage = ({
  documentEntry,
  manifest,
}: CraftyUiPackageBytes): {
  document: EditorDocument;
  documentPath: string;
  revision: number;
} => {
  const parsedManifest = parseUiManifest(manifest);
  if (!parsedManifest.ok) throw new Error(parsedManifest.message);
  const documentPath = parsedManifest.value.entries[UI_DOCUMENT_ROLE];
  invariant(documentPath, `UI_ENTRY_MISSING:${UI_DOCUMENT_ROLE}`);
  const parsedEntry = parseDocumentEntry(documentEntry);
  if (!parsedEntry.ok) {
    throw new Error(parsedEntry.diagnostics[0]?.code ?? parsedEntry.code);
  }
  return {
    document: parsedEntry.document,
    documentPath,
    revision: parsedManifest.value.revision,
  };
};

export const parseCraftyUiPackageDocument = (
  uiPackage: CraftyUiPackageBytes,
): EditorDocument => parseCraftyUiPackage(uiPackage).document;

export const createCraftyKernelFromUiPackage = (
  uiPackage: CraftyUiPackageBytes,
): EditorKernel => {
  installCraftyRuntimeAdapters();
  return createEditorKernel(parseCraftyUiPackageDocument(uiPackage));
};

const rectangleBounds = (document: EditorDocument) => {
  const rectangle = document.nodes[RECTANGLE_ID];
  invariant(rectangle?.kind === "rectangle", "PORTABILITY_RECTANGLE_MISSING");
  return rectangle.bounds;
};

export const runCraftyKernelPortabilityGate = (
  uiPackage: CraftyUiPackageBytes,
): CraftyKernelPortabilityEvidence => {
  const kernel = createCraftyKernelFromUiPackage(uiPackage);
  const initialBytes = kernel.serialize();
  const initialBounds = rectangleBounds(kernel.getDocument());

  kernel.beginTransaction("Cancel rectangle move");
  kernel.preview({
    type: "move-nodes",
    nodeIds: [RECTANGLE_ID],
    delta: { dx: 100, dy: 100 },
  });
  kernel.rollback();
  const cancelledBytes = kernel.serialize();
  invariant(cancelledBytes === initialBytes, "PORTABILITY_CANCEL_MISMATCH");
  invariant(
    kernel.getHistoryDepths().undo === 0,
    "PORTABILITY_CANCEL_RECORDED_HISTORY",
  );

  kernel.beginTransaction("Move rectangle");
  kernel.preview({
    type: "move-nodes",
    nodeIds: [RECTANGLE_ID],
    delta: COMMITTED_DELTA,
  });
  kernel.commit();
  const committedBytes = kernel.serialize();
  const committedBounds = rectangleBounds(kernel.getDocument());
  invariant(
    committedBounds.x === initialBounds.x + COMMITTED_DELTA.dx &&
      committedBounds.y === initialBounds.y + COMMITTED_DELTA.dy,
    "PORTABILITY_COMMIT_MISMATCH",
  );
  invariant(
    kernel.getHistoryDepths().undo === 1,
    "PORTABILITY_TRANSACTION_HISTORY_MISMATCH",
  );

  invariant(kernel.undo(), "PORTABILITY_UNDO_REJECTED");
  const undoneBytes = kernel.serialize();
  invariant(undoneBytes === initialBytes, "PORTABILITY_UNDO_MISMATCH");

  invariant(kernel.redo(), "PORTABILITY_REDO_REJECTED");
  const redoneBytes = kernel.serialize();
  invariant(redoneBytes === committedBytes, "PORTABILITY_REDO_MISMATCH");

  return {
    cancelledBytes,
    committedBytes,
    initialBytes,
    redoneBytes,
    undoneBytes,
  };
};
