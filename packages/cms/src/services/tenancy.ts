import { TenantError, TENANT_REQUIRED, TENANT_SYSTEM_IMMUTABLE, TENANT_NOT_FOUND } from "../kernel/errors.js";

export const SYSTEM_TENANT_ID = "system";

export interface Tenant {
  readonly id: string;
  readonly name: string;
  readonly system: boolean;
  readonly suspended: boolean;
}

export interface TenantContext {
  readonly tenantId: string;
  readonly principalId: string;
  readonly systemPrincipal?: boolean;
}

/** In-memory tenant registry for kernel/service tests and local adapters. */
export class InMemoryTenantService {
  private readonly tenants = new Map<string, Tenant>([
    [SYSTEM_TENANT_ID, { id: SYSTEM_TENANT_ID, name: "Company", system: true, suspended: false }],
  ]);

  create(id: string, name: string): Tenant {
    if (!id || id === SYSTEM_TENANT_ID) {
      throw new TenantError({ code: TENANT_SYSTEM_IMMUTABLE, tenantId: id || SYSTEM_TENANT_ID });
    }
    if (this.tenants.has(id)) return this.tenants.get(id)!;
    const tenant = Object.freeze({ id, name, system: false, suspended: false });
    this.tenants.set(id, tenant);
    return tenant;
  }

  suspend(id: string): Tenant {
    const tenant = this.get(id);
    if (tenant.system) throw new TenantError({ code: TENANT_SYSTEM_IMMUTABLE, tenantId: id });
    const next = Object.freeze({ ...tenant, suspended: true });
    this.tenants.set(id, next);
    return next;
  }

  get(id: string): Tenant {
    const tenant = this.tenants.get(id);
    if (!tenant) throw new TenantError({ code: TENANT_NOT_FOUND, tenantId: id });
    return tenant;
  }

  list(context: TenantContext): ReadonlyArray<Tenant> {
    return [...this.tenants.values()].filter((tenant) => context.systemPrincipal === true || !tenant.system);
  }
}

export function requireTenant(context: TenantContext | undefined): TenantContext {
  if (!context?.tenantId) throw new TenantError({ code: TENANT_REQUIRED });
  return context;
}

/** Executes work only after a tenant has been established. DB adapters can use this boundary to SET LOCAL. */
export function withTenantTransaction<T>(context: TenantContext | undefined, work: (scope: TenantContext) => T): T {
  return work(requireTenant(context));
}
