import * as Schema from "effect/Schema";

/**
 * Access model: rules evaluate `(principal, tenant, operation)` to a decision
 * (allow / deny) or a query constraint that is conjoined with the operation's
 * query. Everything is plain data so rules are pure and testable.
 */

export const Operation = Schema.Literals(["create", "read", "update", "delete", "publish", "restore", "list"]);
export type Operation = Schema.Schema.Type<typeof Operation>;

export const PrincipalKind = Schema.Literals(["human", "agent"]);
export type PrincipalKind = Schema.Schema.Type<typeof PrincipalKind>;

export interface PrincipalRef {
  readonly id: string;
  readonly kind: PrincipalKind;
}

export const FilterOp = Schema.Literals(["eq", "neq", "lt", "lte", "gt", "gte", "in", "like"]);
export type FilterOp = Schema.Schema.Type<typeof FilterOp>;

export const FilterClause = Schema.Struct({
  field: Schema.String,
  op: FilterOp,
  value: Schema.Json,
});
export type FilterClause = Schema.Schema.Type<typeof FilterClause>;

export type FilterValue = FilterClause | { readonly op: "and"; readonly clauses: readonly FilterValue[] }
  | { readonly op: "or"; readonly clauses: readonly FilterValue[] };

export const Filter: Schema.Schema<FilterValue> = Schema.Union([
  FilterClause,
  Schema.Struct({ op: Schema.Literals(["and"]), clauses: Schema.Array(Schema.suspend(() => Filter)) }),
  Schema.Struct({ op: Schema.Literals(["or"]), clauses: Schema.Array(Schema.suspend(() => Filter)) }),
]);
export type Filter = FilterValue;

export type AccessDecision =
  | { readonly kind: "allow" }
  | { readonly kind: "deny"; readonly code: string }
  | { readonly kind: "constraint"; readonly filter: Filter };

export interface AccessContext {
  readonly principal: PrincipalRef;
  readonly tenantId: string;
  readonly operation: Operation;
}

export type AccessRule = (ctx: AccessContext) => AccessDecision;

export type TriState = "allowed" | "denied" | "conditional";

export interface PermissionMap {
  readonly collections: Readonly<Record<string, Readonly<Record<Operation, TriState>>>>;
}

export function decisionToTriState(decision: AccessDecision): TriState {
  switch (decision.kind) {
    case "allow":
      return "allowed";
    case "deny":
      return "denied";
    case "constraint":
      return "conditional";
  }
}

/** Conjoins a constraint with a caller-supplied filter (and-ed). */
export function conjoinFilters(base: Filter, extra: Filter): Filter {
  return { op: "and", clauses: [base, extra] };
}

/**
 * Derives the permission map for a principal without executing content
 * queries: every collection/operation pair is evaluated and classified
 * allowed / denied / conditional. Collections the principal cannot read are
 * absent from the map.
 */
export function derivePermissionMap(
  rules: ReadonlyMap<string, ReadonlyMap<Operation, AccessRule>>,
  collectionNames: ReadonlyArray<string>,
  ctx: Omit<AccessContext, "operation">,
): PermissionMap {
  const collections: Record<string, Record<Operation, TriState>> = {};
  for (const name of collectionNames) {
    const byOperation = rules.get(name);
    if (!byOperation) continue;
    const readDecision = byOperation.get("read")?.({ ...ctx, operation: "read" })
      ?? ({ kind: "deny" as const, code: "CMS_ACCESS_DENIED" });
    if (readDecision.kind === "deny") continue;
    const ops: Record<Operation, TriState> = {
      create: "denied",
      read: decisionToTriState(readDecision),
      update: "denied",
      delete: "denied",
      publish: "denied",
      restore: "denied",
      list: decisionToTriState(readDecision),
    };
    for (const op of ["create", "update", "delete", "publish", "restore"] as const) {
      const rule = byOperation.get(op);
      if (rule) {
        ops[op] = decisionToTriState(rule({ ...ctx, operation: op }));
      }
    }
    collections[name] = ops;
  }
  return { collections };
}
