import { type AccessRule, type Operation, type PrincipalRef } from "../kernel/access.js";
import { type CollectionDefinition } from "../kernel/collection.js";
import { ENTRY_NOT_FOUND, ACCESS_DENIED, PUBLISH_NOT_DRAFT, AccessDeniedError, NotFoundError, KernelError, validationFailure } from "../kernel/errors.js";
import { validateFields } from "../kernel/fields.js";
import { requireTenant, type TenantContext } from "./tenancy.js";

export type EntryStatus = "draft" | "published";
export interface ContentEntry { readonly id: string; readonly tenantId: string; readonly collection: string; readonly status: EntryStatus; readonly data: Readonly<Record<string, unknown>>; readonly version: number; readonly updatedBy: PrincipalRef; }
export interface ContentStore { readonly entries: Map<string, ContentEntry>; }

const key = (tenantId: string, collection: string, id: string, status: EntryStatus = "draft") => `${tenantId}:${collection}:${id}:${status}`;

/** Transaction-shaped local engine. A database implementation can replace the store without changing callers. */
export class InMemoryContentEngine {
  constructor(private readonly store: ContentStore = { entries: new Map() }, private readonly rules = new Map<string, ReadonlyMap<Operation, AccessRule>>()) {}

  private authorize(scope: TenantContext, collection: string, operation: Operation): void {
    const decision = this.rules.get(collection)?.get(operation)?.({ principal: { id: scope.principalId, kind: "human" }, tenantId: scope.tenantId, operation }) ?? { kind: "allow" as const };
    if (decision.kind === "deny") throw new AccessDeniedError({ code: ACCESS_DENIED, collection, operation });
  }

  create(scope: TenantContext | undefined, definition: CollectionDefinition, id: string, data: Record<string, unknown>): ContentEntry {
    const tenant = requireTenant(scope); this.authorize(tenant, definition.name, "create");
    const issues = validateFields(definition.fields, data); if (issues.length) throw validationFailure(issues);
    const entry = Object.freeze({ id, tenantId: tenant.tenantId, collection: definition.name, status: "draft" as const, data: Object.freeze({ ...data }), version: 1, updatedBy: { id: tenant.principalId, kind: "human" as const } });
    this.store.entries.set(key(tenant.tenantId, definition.name, id, "draft"), entry); return entry;
  }

  get(scope: TenantContext | undefined, collection: string, id: string, status: EntryStatus = "draft"): ContentEntry {
    const tenant = requireTenant(scope); this.authorize(tenant, collection, "read");
    const entry = this.store.entries.get(key(tenant.tenantId, collection, id, status));
    if (!entry) throw new NotFoundError({ code: ENTRY_NOT_FOUND, resource: "entry", id });
    return entry;
  }

  publish(scope: TenantContext | undefined, collection: string, id: string): ContentEntry {
    const tenant = requireTenant(scope); this.authorize(tenant, collection, "publish");
    const entry = this.store.entries.get(key(tenant.tenantId, collection, id, "draft"));
    if (!entry) throw new NotFoundError({ code: ENTRY_NOT_FOUND, resource: "entry", id });
    if (entry.status !== "draft") throw new KernelError({ code: PUBLISH_NOT_DRAFT });
    const published = Object.freeze({ ...entry, status: "published" as const });
    this.store.entries.set(key(tenant.tenantId, collection, id, "published"), published); return published;
  }
}
