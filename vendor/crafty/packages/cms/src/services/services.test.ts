import { describe, expect, it } from "vitest";
import { parseCollectionDefinition } from "../kernel/collection.js";
import { ValidationFailure, TENANT_REQUIRED, TenantError } from "../kernel/errors.js";
import { InMemoryContentEngine } from "./engine.js";
import { InMemoryContentTypeRegistry } from "./registry.js";
import { InMemoryTenantService, SYSTEM_TENANT_ID, withTenantTransaction } from "./tenancy.js";

const definition = parseCollectionDefinition({
  name: "posts", system: false, agentExposed: false, publicRead: true, previewable: true,
  fields: [{ name: "title", kind: "text", required: true }],
});

describe("local CMS service boundaries", () => {
  it("requires a tenant before running work", () => {
    expect(() => withTenantTransaction(undefined, () => true)).toThrowError(TenantError);
    try { withTenantTransaction(undefined, () => true); } catch (error) { expect((error as TenantError).code).toBe(TENANT_REQUIRED); }
  });

  it("keeps the system tenant reserved and hidden", () => {
    const tenants = new InMemoryTenantService();
    tenants.create("customer-a", "A");
    expect(tenants.list({ tenantId: "customer-a", principalId: "user" }).map((t) => t.id)).toEqual(["customer-a"]);
    expect(tenants.get(SYSTEM_TENANT_ID).system).toBe(true);
  });

  it("creates a runtime definition and enforces its fields through the engine", () => {
    const registry = new InMemoryContentTypeRegistry();
    const created = registry.create({ ...definition, system: false });
    const engine = new InMemoryContentEngine();
    expect(() => engine.create({ tenantId: "customer-a", principalId: "user" }, created, "entry-1", {})).toThrowError(ValidationFailure);
    const entry = engine.create({ tenantId: "customer-a", principalId: "user" }, created, "entry-1", { title: "Hello" });
    expect(entry.tenantId).toBe("customer-a");
    expect(engine.get({ tenantId: "customer-a", principalId: "user" }, created.name, entry.id).data.title).toBe("Hello");
  });
});
