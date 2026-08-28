# CMS foundation — tasks

Sequencing rationale: the kernel (1) is pure and unblocks everything;
persistence (2) precedes any service; tenancy (3) precedes the engine (4)
because scoping is a required input to every query, not a later filter;
the registry (5) rides on the engine; adapters (6–8) follow the engine;
the admin (9) lands last as the first full consumer.

> **Dependency note:** stages 3 and 9 need the platform identity layer
> (`packages/auth`, better-auth + organization plugin) from the multi-zone
> change's stage 3, which is **not yet implemented**
> (`openspec/changes/multi-zone-platform/tasks.md` stage 3). If it has not
> landed when stage 3 here begins, land it there first — this change never
> mounts its own auth routes and never duplicates the membership store.
> Local dev Postgres exists via the compose setup (commit d165b04).

## 1. Package and kernel

- [ ] 1.1 Scaffold `packages/cms` (`@crafty/cms`): Effect v4 beta pinned
  exact; `kernel/` / `services/` / `http/` subpath layout; lint rule (or
  test) proving `kernel/` and `services/` import no `unstable/*` module
- [x] 1.2 Kernel: field model + collection definition (parse → frozen
  value), document envelope with schema version, versioned-union codec with
  upgrade chains, unknown/future version rejection with stable codes
- [x] 1.3 Kernel: structured rich-text block model (blocks/spans/marks) as a
  field kind; validation without any editor dependency
- [x] 1.4 Kernel: admin descriptor projection and agent tool schema
  projection from definitions; permission-map types
- [x] 1.5 Kernel: stable error-code catalogue (`CMS_*` codes, field-addressed
  validation diagnostics)
- [x] 1.6 Verification: kernel test suite with no DB/HTTP (`bun run test`
  in-package); property tests for codec round-trips and upgrade chains;
  tests assert on codes, never prose

## 2. Persistence and migrations

- [ ] 2.1 Effect SQL Postgres layer: pooled client, health check, typed
  errors; compose wiring for dev/test databases
- [ ] 2.2 Migration engine: forward-only TS migrations, frozen per-migration
  schema snapshots, log-derived state, ordering-conflict detection,
  startup verification (pending reported, unknown-applied fails)
- [ ] 2.3 Initial migrations: tenants, principals/agent-principals, content
  types registry, entries (tenant_id, collection, type_version, status,
  data), versions, assets, outbox, webhook subscriptions/deliveries
- [ ] 2.4 RLS: policies on every tenant-scoped table keyed off the
  transaction-local tenant setting; `FORCE ROW LEVEL SECURITY`; app role is
  non-owner/non-BYPASSRLS; `tenant_id` indexed everywhere; GIN +
  expression-index recipe for entries
- [ ] 2.5 Verification: migration replay from empty DB is deterministic;
  ordering-conflict and unknown-applied tests; an RLS "belt-and-suspenders"
  test proving a deliberately unscoped query returns nothing

## 3. Tenancy and identity

- [ ] 3.1 `TenantContext` service + `withTenantTransaction` choke point
  (`SET LOCAL` inside the transaction); engine query environment requires
  tenant scope by construction
- [ ] 3.2 Tenant lifecycle: create/suspend via engine ops; reserved system
  tenant (undeletable, invisible to non-system principals), seeded by
  migration
- [ ] 3.3 Identity bridge: resolve better-auth session + active organization
  → principal + tenant scope; org roles → CMS roles (depends on multi-zone
  stage 3 — see note)
- [ ] 3.4 Verification: cross-tenant isolation suite (list/filter/paginate/
  bulk ops), scope-less operation rejection, system-tenant invisibility

## 4. Content engine

- [ ] 4.1 CRUD pipeline: tenant scope → access evaluation → validation →
  persist + side-effect record in one transaction; principal recorded on
  every write
- [ ] 4.2 Access: rule evaluation (allow/deny/constraint), constraint
  conjunction into queries incl. bulk ops; permission-map derivation
- [ ] 4.3 Drafts/published as separate read paths; publish write-through;
  version snapshots on by default with bounded retention + restore
- [ ] 4.4 Agent principals: creation (scope, expiry, owner), scope-narrowing
  semantics, expiry/revocation enforcement, attribution on every op
- [ ] 4.5 Verification: engine suite for the access matrix, draft/publish
  state machine, restore-creates-new-version, agent scope/expiry; bulk
  delete cannot cross tenants (the Payload #16325 regression test, ours)

## 5. Dynamic collections

- [ ] 5.1 Content-type registry: definition JSON + integer version,
  optimistic-lock updates with stable conflict code, per-version retention
- [ ] 5.2 Compile registry rows → the kernel's frozen collection
  representation (cached per version); system-collection identity protected
- [ ] 5.3 Old-version entries readable under their recorded version;
  additive-compatibility validation on definition updates
- [ ] 5.4 Verification: create-collection-then-write round trip, stale
  update conflict, version-2-entries-survive-version-3 tests

## 6. HTTP API and agent tools

- [ ] 6.1 Versioned REST adapter in `http/`: contracts derived per exposed
  collection, filtering/pagination, declared error schemas, correlation-id
  defect handling; OpenAPI emission
- [ ] 6.2 Published read path: sessionless, tenant-scoped, byte-stable
  responses for unchanged state
- [ ] 6.3 Agent tool surface: opt-in exposure flag per collection, tools
  projected from definitions, agent-principal auth, engine access
  evaluation; MCP transport binding
- [ ] 6.4 Verification: contract tests HTTP-vs-engine parity, unexposed
  collection invisibility, error-code coverage; `bun run typecheck` green
  with generated types

## 7. Assets

- [ ] 7.1 AssetStore service: upload (type/size/hash/principal), tenant
  scoping, media-type enforcement; storage backend behind a service
  interface (filesystem first, matching the deploy volume)
- [ ] 7.2 Reference integrity: asset references by id, referenced-asset
  delete refusal with referencing-entry codes, forced delete
- [ ] 7.3 Binary read path: private-asset refusal, public cacheable
  hash-addressed responses
- [ ] 7.4 Verification: upload/reference/delete suite incl. private-asset
  anonymous fetch refusal

## 8. Outbox, webhooks, scheduling

- [ ] 8.1 Outbox: same-transaction intent rows; worker with lease-based
  claiming (token + renewable expiry), at-least-once, recorded attempts
- [ ] 8.2 Webhooks: tenant-scoped subscriptions, signed deliveries, backoff
  retries, dead state, per-subscription history
- [ ] 8.3 Scheduled publish/unpublish as scheduled outbox entries;
  cancellation until run; attribution
- [ ] 8.4 Verification: rollback-leaves-no-intent, crashed-worker lease
  recovery, exhaustion-to-dead, scheduled-publish-fires-once tests

## 9. Admin surface (`apps/web/admin`)

- [ ] 9.1 Field primitives per descriptor kind (composed, no generated
  containers, per react-boundary rules); unsupported-kind state that
  preserves values on save
- [ ] 9.2 Collection list + entry editor pages: Server Components reading
  the engine; mutations via route handlers → engine; permission-map-driven
  affordances
- [ ] 9.3 Tenant switcher over organization memberships; no cross-tenant
  edit carryover; single-membership implicit tenant
- [ ] 9.4 Draft/published state UI, publish + schedule + restore controls,
  version history view
- [ ] 9.5 Live preview: draft-save event → RSC refresh over the draft read
  path
- [ ] 9.6 Verification: descriptor-driven editor renders a tenant-defined
  collection created in the same session; read-only principal sees no
  mutation affordances and server still refuses; preview updates on save

## 10. Docs, ADR, ledger, close-out

- [ ] 10.1 File the three 2026-08-09 research reports under `docs/research/`
  and add research-ledger entries (Payload v4, tenancy, landscape — source,
  lesson, adopted/adapted/rejected/deferred per entry)
- [ ] 10.2 ADR: the CMS core decisions that meet the ADR bar — Effect as a
  core dependency, Postgres + pooled tenancy + RLS, JSONB entries +
  migration-as-code persistence format, agent-principal model
- [ ] 10.3 Update `docs/architecture/current-state.md` (new package, new
  database) and `docs/operator-workflows.md` (migrations, dev DB); deploy
  env contract additions in `deploy/`
- [ ] 10.4 Full verification: `bun run typecheck && bun run test && bun run
  lint && bun run format:check`; migration replay on a clean database;
  isolation suite green
