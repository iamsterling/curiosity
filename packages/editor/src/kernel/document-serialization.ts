import { canonicalEditorDocumentString, loadEditorDocument, type EditorDocument, type MigrationResult } from "./document.js";

/**
 * The persistence surface of the kernel: one stable place for saving and
 * loading the authored document. The canonical byte rules and the
 * validate/migrate chain live in document.ts; this module is the named API
 * the store, the routes and the CLI depend on, so document internals can
 * evolve without rippling through the persistence path.
 */

/** Canonical, byte-stable serialization of the authored document. Throws
 *  `EDITOR_DOCUMENT_INVALID` when the document fails validation — a save must
 *  never write an invalid document. */
export const serializeDocument = (document: EditorDocument): string => canonicalEditorDocumentString(document);

/** Parse a serialized document: validate, run the migration chain, and record
 *  which migrations ran. Unknown schema versions are rejected with
 *  `DOCUMENT_UNSUPPORTED_SCHEMA`, never coerced (I10). */
export const parseDocument = (serialized: string): MigrationResult => loadEditorDocument(serialized);

export type { MigrationResult } from "./document.js";
