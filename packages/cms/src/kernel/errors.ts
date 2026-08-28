import * as Data from "effect/Data";

/**
 * Stable machine-readable error codes. Codes are the contract: consumers and
 * tests assert on codes, never on prose. Field-addressed validation problems
 * use `ValidationIssue`, which carries the field path and the rule code.
 */

export const VALIDATION_FAILED = "CMS_VALIDATION_FAILED";
export const UNKNOWN_SCHEMA_VERSION = "CMS_UNKNOWN_SCHEMA_VERSION";
export const COLLECTION_NOT_FOUND = "CMS_COLLECTION_NOT_FOUND";
export const COLLECTION_ALREADY_EXISTS = "CMS_COLLECTION_ALREADY_EXISTS";
export const COLLECTION_IMMUTABLE = "CMS_COLLECTION_IMMUTABLE";
export const DEFINITION_STALE = "CMS_DEFINITION_STALE";
export const ENTRY_NOT_FOUND = "CMS_ENTRY_NOT_FOUND";
export const ACCESS_DENIED = "CMS_ACCESS_DENIED";
export const AGENT_EXPIRED = "CMS_AGENT_EXPIRED";
export const AGENT_REVOKED = "CMS_AGENT_REVOKED";
export const AGENT_SCOPE_EXCEEDED = "CMS_AGENT_SCOPE_EXCEEDED";
export const TENANT_REQUIRED = "CMS_TENANT_REQUIRED";
export const TENANT_NOT_FOUND = "CMS_TENANT_NOT_FOUND";
export const TENANT_SYSTEM_IMMUTABLE = "CMS_TENANT_SYSTEM_IMMUTABLE";
export const PUBLISH_NOT_DRAFT = "CMS_PUBLISH_NOT_DRAFT";
export const RESTORE_NOT_FOUND = "CMS_RESTORE_NOT_FOUND";
export const ASSET_REFERENCED = "CMS_ASSET_REFERENCED";
export const ASSET_TYPE_DISALLOWED = "CMS_ASSET_TYPE_DISALLOWED";
export const ASSET_NOT_FOUND = "CMS_ASSET_NOT_FOUND";
export const ASSET_PRIVATE = "CMS_ASSET_PRIVATE";
export const SCHEDULE_CANCELLED = "CMS_SCHEDULE_CANCELLED";
export const OUTBOX_CLAIM_LOST = "CMS_OUTBOX_CLAIM_LOST";
export const MIGRATION_ORDER_CONFLICT = "CMS_MIGRATION_ORDER_CONFLICT";
export const MIGRATION_UNKNOWN_APPLIED = "CMS_MIGRATION_UNKNOWN_APPLIED";
export const MIGRATION_PENDING = "CMS_MIGRATION_PENDING";
export const INTERNAL = "CMS_INTERNAL";
export const NOT_IMPLEMENTED = "CMS_NOT_IMPLEMENTED";

export type CmsErrorCode = typeof VALIDATION_FAILED | typeof UNKNOWN_SCHEMA_VERSION | typeof COLLECTION_NOT_FOUND
  | typeof COLLECTION_ALREADY_EXISTS | typeof COLLECTION_IMMUTABLE | typeof DEFINITION_STALE
  | typeof ENTRY_NOT_FOUND | typeof ACCESS_DENIED | typeof AGENT_EXPIRED | typeof AGENT_REVOKED
  | typeof AGENT_SCOPE_EXCEEDED | typeof TENANT_REQUIRED | typeof TENANT_NOT_FOUND
  | typeof TENANT_SYSTEM_IMMUTABLE | typeof PUBLISH_NOT_DRAFT | typeof RESTORE_NOT_FOUND
  | typeof ASSET_REFERENCED | typeof ASSET_TYPE_DISALLOWED | typeof ASSET_NOT_FOUND | typeof ASSET_PRIVATE
  | typeof SCHEDULE_CANCELLED | typeof OUTBOX_CLAIM_LOST | typeof MIGRATION_ORDER_CONFLICT
  | typeof MIGRATION_UNKNOWN_APPLIED | typeof MIGRATION_PENDING | typeof INTERNAL | typeof NOT_IMPLEMENTED;

export class KernelError extends Data.TaggedError("KernelError")<{ code: CmsErrorCode; detail?: string }> {}

export class UnknownSchemaVersionError extends Data.TaggedError("UnknownSchemaVersionError")<{
  code: CmsErrorCode;
  collection: string;
  version: number;
  known: ReadonlyArray<number>;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  code: CmsErrorCode;
  resource: string;
  id?: string;
}> {}

export class AccessDeniedError extends Data.TaggedError("AccessDeniedError")<{
  code: CmsErrorCode;
  collection: string;
  operation: string;
}> {}

export class AgentExpiredError extends Data.TaggedError("AgentExpiredError")<{
  code: CmsErrorCode;
  principalId: string;
}> {}

export class AgentRevokedError extends Data.TaggedError("AgentRevokedError")<{
  code: CmsErrorCode;
  principalId: string;
}> {}

export class AgentScopeExceededError extends Data.TaggedError("AgentScopeExceededError")<{
  code: CmsErrorCode;
  principalId: string;
  collection: string;
  operation: string;
}> {}

export class TenantError extends Data.TaggedError("TenantError")<{
  code: CmsErrorCode;
  tenantId?: string;
}> {}

export class ConflictError extends Data.TaggedError("ConflictError")<{
  code: CmsErrorCode;
  detail?: string;
}> {}

export class MigrationError extends Data.TaggedError("MigrationError")<{
  code: CmsErrorCode;
  detail?: string;
}> {}

export class AssetError extends Data.TaggedError("AssetError")<{
  code: CmsErrorCode;
  assetId?: string;
  detail?: string;
}> {}

export class OutboxError extends Data.TaggedError("OutboxError")<{
  code: CmsErrorCode;
  detail?: string;
}> {}

export class InternalError extends Data.TaggedError("InternalError")<{
  code: CmsErrorCode;
  correlationId: string;
  detail?: string;
}> {}

/** Rule codes for field-addressed validation diagnostics. */
export const REQUIRED = "CMS_REQUIRED_FIELD";
export const BAD_TYPE = "CMS_BAD_TYPE";
export const MIN_LENGTH = "CMS_MIN_LENGTH";
export const MAX_LENGTH = "CMS_MAX_LENGTH";
export const PATTERN = "CMS_PATTERN";
export const MIN_VALUE = "CMS_MIN_VALUE";
export const MAX_VALUE = "CMS_MAX_VALUE";
export const NOT_ONE_OF = "CMS_NOT_ONE_OF";
export const RICH_TEXT_INVALID = "CMS_RICH_TEXT_INVALID";
export const REFERENCE_INVALID = "CMS_REFERENCE_INVALID";
export const GROUP_INVALID = "CMS_GROUP_INVALID";
export const ARRAY_INVALID = "CMS_ARRAY_INVALID";

export type ValidationRuleCode = typeof REQUIRED | typeof BAD_TYPE | typeof MIN_LENGTH | typeof MAX_LENGTH
  | typeof PATTERN | typeof MIN_VALUE | typeof MAX_VALUE | typeof NOT_ONE_OF | typeof RICH_TEXT_INVALID
  | typeof REFERENCE_INVALID | typeof GROUP_INVALID | typeof ARRAY_INVALID;

export interface ValidationIssue {
  readonly field: string;
  readonly rule: ValidationRuleCode;
  readonly detail?: string;
}

export class ValidationFailure extends Data.TaggedError("ValidationFailure")<{
  code: typeof VALIDATION_FAILED;
  issues: ReadonlyArray<ValidationIssue>;
}> {}

export function validationFailure(issues: ReadonlyArray<ValidationIssue>): ValidationFailure {
  return new ValidationFailure({ code: VALIDATION_FAILED, issues });
}
