import type { EditorKernel } from "@crafty/editor/kernel";
import {
  parseDocumentEntry,
  parseUiManifest,
  serializeUiPackageRevision,
  UI_DOCUMENT_ROLE,
} from "@crafty/scene-store/ui-format";
import type { CraftyUiPackageBytes } from "./crafty-kernel-portability";

export interface CraftyUiPackagePublicationStore {
  readDocumentEntry(path: string): Promise<string | undefined>;
  readManifest(): Promise<string | undefined>;
  writeImmutableDocument(path: string, bytes: string): Promise<void>;
  publishManifest(bytes: string): Promise<void>;
}

const publishedRevision = (manifest: string | undefined): number => {
  if (manifest === undefined) return 0;
  const parsed = parseUiManifest(manifest);
  if (!parsed.ok) throw new Error(parsed.message);
  return parsed.value.revision;
};

export const loadCraftyUiPackage = async (
  store: CraftyUiPackagePublicationStore,
): Promise<CraftyUiPackageBytes | undefined> => {
  const manifest = await store.readManifest();
  if (manifest === undefined) return undefined;
  const parsedManifest = parseUiManifest(manifest);
  if (!parsedManifest.ok) throw new Error(parsedManifest.message);
  const path = parsedManifest.value.entries[UI_DOCUMENT_ROLE];
  if (!path) throw new Error(`UI_ENTRY_MISSING:${UI_DOCUMENT_ROLE}`);
  const documentEntry = await store.readDocumentEntry(path);
  if (documentEntry === undefined) {
    throw new Error(`UI_ENTRY_MISSING:${UI_DOCUMENT_ROLE}`);
  }
  const parsedEntry = parseDocumentEntry(documentEntry);
  if (!parsedEntry.ok) throw new Error(parsedEntry.code);
  return { documentEntry, manifest };
};

export const saveCraftyUiPackage = async (
  store: CraftyUiPackagePublicationStore,
  kernel: EditorKernel,
  expectedRevision: number,
): Promise<{ documentBytes: string; revision: number }> => {
  const document = kernel.getDocument();
  const documentBytes = kernel.serialize();
  const before = await store.readManifest();
  if (publishedRevision(before) !== expectedRevision) {
    throw new Error("DOCUMENT_REVISION_STALE");
  }
  const nextRevision = expectedRevision + 1;
  const publication = serializeUiPackageRevision(
    document,
    nextRevision,
  );
  await store.writeImmutableDocument(
    publication.documentPath,
    publication.documentEntry,
  );
  const beforePublish = await store.readManifest();
  if (publishedRevision(beforePublish) !== expectedRevision) {
    throw new Error("DOCUMENT_REVISION_STALE");
  }
  await store.publishManifest(publication.manifest);

  const published = await loadCraftyUiPackage(store);
  if (!published || published.documentEntry !== publication.documentEntry) {
    throw new Error("DOCUMENT_PUBLICATION_FAILED");
  }
  return { documentBytes, revision: nextRevision };
};
