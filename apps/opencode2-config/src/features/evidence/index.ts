import type { FeatureRegistration } from "../../plugin/contracts.js";

export const evidenceFeature: FeatureRegistration = { id: "evidence", register: () => undefined };

// Internal development-slice surface. It is intentionally absent from the package root export.
export { InMemoryAnchorEmulator, readVerifiedAnchor } from "./anchor.js";
export type { AnchorHead, AnchorIntent, AnchorRecord, ContinuityAnchorPort } from "./anchor.js";
export { createDevelopmentBootstrap } from "./configuration.js";
export type { DevelopmentClaims, EnvironmentAdapter } from "./configuration.js";
export { DevelopmentFilesystemCustody } from "./custody.js";
export type { EncryptedEnvelope, ObjectAad, ObjectReceipt } from "./custody.js";
export {
  assertionTransition,
  ASSERTION_STATES,
  decodeLayeredIdentities,
  decodeLifecycle,
  decodeRelationship,
  RELATIONSHIP_TYPES,
} from "./domain.js";
export type { AssertionState, LayeredIdentities, Lifecycle, Relationship, RelationshipType } from "./domain.js";
export { EvidenceDiagnostic } from "./diagnostics.js";
export { createDevelopmentHarness, developmentFixture } from "./development-harness.js";
export { bytesDigest, createIdentity, createSpanIdentity, deterministicExtract, lexicalTokens } from "./identity.js";
export type { ExtractedSpan } from "./identity.js";
export { InMemoryTransactionalAuthority, isEligibleRecord, SynchronousIngest } from "./ingest.js";
export type { FixtureIngest, IngestFault, IngestRecord, IngestState, TransactionalAuthorityPort } from "./ingest.js";
export { createQuery, InMemoryLexicalProjection } from "./query.js";
export type { QueryRequest, QueryResponse } from "./query.js";
export { BlockingReconciler } from "./reconciliation.js";
export type { ReconciliationFinding } from "./reconciliation.js";
