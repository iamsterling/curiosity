# CMS foundation — design

Grounding: three primary-source research reports (2026-08-09) — PayloadCMS v4
canary/main, multi-tenancy on Postgres + Effect, and the 2025–26 CMS
landscape — plus the earlier five-report brief
(`docs/research/cms-foundation.md`). Sources are cited inline; the reports get
filed under `docs/research/` and the research ledger as part of this change.

Every section names its prior art and whether it is **followed**, **adapted**,
**diverged from**, or **deferred**.

## 1. Package layout and the one-pipeline rule

```
packages/cms (@crafty/cms)
  kernel/    zero-IO: field model, collection model, document envelope,
             versioned codecs, validation, access-rule evaluation (pure part),
             admin descriptors, stable error codes
  services/  ContentEngine, TenantService, AccessService, AssetStore,
             Outbox, ContentTypeRegistry — Effect services with explicit
             dependencies, composed in one layer graph
  http/      REST adapter, agent-tool adapter, webhook delivery — thin
             translations onto the engine
```

- **Local-API-first** (Payload — followed): every surface (REST, agent tools,
  the admin's server components) calls the same in-process engine. No surface
  owns logic the others lack.
- **Kernel is zero-IO** (this repo's editor kernel discipline — followed):
  validation, codecs and descriptor projection are pure and testable without a
  database. Mirrors "test the kernel, not the component."
- **Config is immutable input** (Payload — diverged): Payload sanitizes and
  *mutates* a shared config object; v4 had to remove a shared `defaults`
  export because mutation leaked (payload PR #17103). Here collection configs
  are parsed once into frozen kernel values.
- Dependency direction: `@crafty/cms` is a new leaf-ish package depending on
  nothing in the workspace (it must not import editor/scene packages);
  `apps/web/admin` consumes it. `@crafty/auth` (from the multi-zone change)
  will be a peer input at the service boundary, not a kernel dependency.

## 2. Effect version policy

**Decision: Effect v4 beta, pinned exact versions.** v3 is end-of-line
(maintenance); a greenfield core starting on v3 buys a guaranteed migration.

Alternatives considered:
- *v3 stable* — lost: EOL trajectory; the schema/codec surface we depend on
  most is where v4 consolidation happened.
- *Wait for v4 stable* — lost: unbounded delay for a core that is entirely
  internal; pinning + a small adapter layer bounds the churn.

Churn containment rules (these are design constraints, not suggestions):
- `effect/unstable/*` imports (HTTP, RPC) are confined to `http/`. The kernel
  and services import stable modules only.
- Tenant context is **our own service interface**, never raw fiber-local
  machinery — Effect v4 removes FiberRef in favor of `Context.Reference`
  (effect-smol migration/fiberref.md), so hiding it behind a Tag makes that
  change invisible.
- Errors are schema-carrying tagged error classes with a stable
  machine-readable `code` (repo convention: codes, not prose).

## 3. Persistence and migrations

**Decision: Postgres, one database, Effect SQL; a JSONB document surface for
entries plus plain relational tables for system concerns** (tenants, content
types, versions, assets, outbox, principals).

- Entries: one table shape `(id, tenant_id, collection, type_version, status,
  locale-reserved envelope, data jsonb, timestamps)` with GIN
  (`jsonb_path_ops`) plus expression B-tree indexes on hot fields (Crunchy
  "Indexing JSONB" — followed). JSONB-over-EAV is the modern consensus
  (GitLab ADR-001 — followed).
- *Alternative: per-collection projected tables* (Payload's dozens of child
  tables — diverged): projection is exactly what forces snapshot-diff
  migrations on every collection edit — impossible when tenants edit
  collections at runtime. **Deferred trigger**: if measured query performance
  on hot tenant-defined fields (committed fixture, recorded environment,
  distribution — per `docs/architecture/performance.md`) shows expression
  indexes insufficient, revisit materialized projections *per hot field*, not
  per collection.
- *Alternative: Drizzle-Effect hybrid* — deferred: legitimate only if
  relational CRUD outgrows raw typed SQL; start with Effect SQL alone (brief
  §1 — followed).

**Migrations: migration-as-code, forward-only, frozen snapshots.** Each
migration is a TS Effect committed with a frozen copy of the schema metadata
it was written against; data migrations run against that frozen shape, never
the live config. State derives from the migration log. No dev-push mode.
Prior art: Payload's snapshot-diff generator — **diverged**, deliberately:
#14415 (duplicate DDL under multi-dev) is open as of 2026-08-09, and #11168
(migrations execute against the latest schema) was closed *as designed* —
the design this section exists to not repeat.

## 4. Tenancy

**Decision: pooled model — shared tables, `tenant_id` on every content row,
RLS as defense-in-depth, explicit app-layer scoping as the primary filter.
Company content is a reserved system tenant.**

Alternatives considered:
- *Schema-per-tenant* — lost: migration fan-out per schema and catalog bloat;
  realistic ceiling of a few hundred tenants (PlanetScale 2026, Crunchy).
- *Database/project-per-tenant* — lost for the default tier: connection-pool
  multiplication and provisioning latency versus "a tenant is an INSERT".
  **Deferred trigger**: a paying customer with a contractual
  instance-isolation requirement un-defers a silo tier (Neon-style
  project-per-tenant is the strongest candidate; AWS SaaS-lens silo/pool
  framing — followed).
- *Payload's plugin approach* (config rewriting after the fact) —
  **diverged**: its cross-tenant bulk-delete bug (#16325) and validation
  races (#16462) live exactly at the bolt-on seams. Tenancy here is a
  required input to the query layer, not a rewrite pass.

Mechanics:
- A `TenantContext` service is provided per request by HTTP middleware after
  resolving the session's active organization. There is no code path to run a
  content query without a tenant context — the engine's query functions
  require it in their environment.
- One choke point, `withTenantTransaction`, opens the transaction and issues
  `SET LOCAL app.tenant_id` inside it — the only pooler-safe RLS mechanism
  (PgBouncer transaction pooling cannot carry session GUCs; `SET LOCAL`
  outside a transaction silently no-ops — Crunchy/Nile pattern, followed).
- RLS hardening: `FORCE ROW LEVEL SECURITY`, app connects as a
  non-owner/non-BYPASSRLS role, every `tenant_id` indexed. RLS is the
  backstop; every query is also explicitly tenant-filtered. (PlanetScale's
  measured >3x cost on unoptimized policy-only filtering — respected; do not
  invent our own perf numbers without fixtures.)
- Per-tenant pooling/layers: not needed in the pooled model; keyed layer
  memoization stays in the back pocket for the silo tier.
- Per-tenant export is a query (`tenant_id` filter), not `pg_dump` —
  first-class export endpoint deferred; **trigger**: first customer offboard
  or backup-contract requirement.

## 5. Collection model and tenant-defined collections

**Decision: hybrid — code-defined system collections + a versioned
content-type registry for tenant-defined collections; both compile to one
runtime collection representation; no live DDL.**

- Code-defined collections (Payload's config-as-single-source — followed;
  expressed as Effect Schema rather than untyped config — the structural
  advantage Payload cannot reach): one definition drives validation, the
  document codec, HTTP contracts, generated TS types, admin descriptors, and
  agent tool schemas.
- Tenant-defined collections are rows: definition JSON + integer version with
  optimistic locking (Contentful content-type API — followed), compiled at
  request time (cached per version) into the same representation.
- *Alternative: live-DDL metadata engines* (Directus `directus_collections`,
  Twenty's metadata→DDL) — lost: runtime DDL means migration fan-out,
  catalog churn and DDL-as-a-service risk inside request paths.
- *Alternative: code-only* (Payload/Sanity) — lost: redeploy-per-schema-change
  is exactly the wall the customer requirement breaks.
- Stored documents carry their schema version; decode is a versioned-union
  upgrade chain, always encode latest; **unknown or future versions are
  rejected, never coerced** (repo invariant — followed; brief §1 pattern).

## 6. Access control and principals

**Decision: access functions `(principal, tenant, operation) → allow | deny |
query-constraint`, evaluated in the engine; a permission map is computed for
the admin** (Payload's `boolean | Where` model and login-time permission map —
followed; unchanged even in Payload v4, which validates its durability).

- Principals: humans (better-auth session; org = tenant, roles from the org
  plugin) and **agents** — first-class principals with scope (collections +
  operations), expiry, and attribution. Every write records its principal.
  Prior art: nobody ships this (Sanity robot tokens and Strapi owner-bound
  MCP tokens are the nearest) — this is deliberate new ground, kept small:
  scoped/expiring/attributed, nothing more in v1.
- Field-level access: descriptor-level redaction only in v1 (read masks);
  full field-level rules deferred — **trigger**: first system collection
  that needs per-field write rules.

## 7. Content engine, versions, publishing

- Draft and published are **separate query surfaces** (landscape convergence
  — followed); publish is write-through of the draft snapshot.
- Whole-document version snapshots with a per-collection cap, versions **on
  by default** (Payload v4 default — followed; simpler than deltas/CRDT
  unless real-time collab is the product, which it is not).
- Scheduled publish: a scheduled outbox entry, not a queue suite.
- Doc locking: deferred — **trigger**: second concurrent human editor in real
  use; the admin is single-team today.
- Rich text is stored as **structured blocks** (Portable-Text-shaped:
  blocks/spans/marks), renderer-independent and queryable. Editor choice is
  decoupled and out of scope (2026 consensus: Tiptap likely, Payload's
  Lexical bet — diverged; no interchange standard emerged, so we own the
  stored shape).

## 8. API surfaces

- **REST** (versioned) over the platform HTTP layer as a thin adapter;
  expected errors are declared schemas with stable codes; defects → 500,
  never leaked (brief §1 — followed). Draft reads require an authorized
  principal; published reads are the cacheable anonymous surface (avoid
  Payload's per-request access evaluation on hot anonymous reads — diverged
  via a separate published read path).
- **Agent tools (MCP-shaped)** projected from collection definitions:
  explicit **opt-in exposure per collection** (Payload v4's opt-out lesson —
  diverged: their upgrade silently exposed unlisted collections), per-tool
  access composed over document ACL (Payload v4 — followed), authenticated as
  agent principals (§6).
- **Admin live preview**: draft-save event → RSC refresh against the
  draft-aware read path (Payload's server-preview model — followed; a small
  event channel suffices). *Sanity-style sync-tag SSE live content* —
  **deferred**; Effect Streams make it natural later; **trigger**: first
  end-user-facing surface that needs published-content liveness without
  polling.

## 9. Side effects: outbox

Every mutation that must trigger downstream work (webhooks, scheduled
publish, search indexing later) writes an outbox row in the same transaction
as the mutation — no un-awaited hook work that silently rolls back (Payload
`afterChange` failure mode — diverged; Payload v4's own jobs rework abandoned
hooks for direct calls, #16414, which corroborates). A worker claims entries
with lease-based claiming — `processingToken` + renewable `processingUntil`
(Payload v4's design — adapted onto Effect fibers + Schedule). At-least-once
delivery; consumers are idempotent; delivery attempts and outcomes are
recorded.

## 10. Admin surface

- Config emits **descriptors** (field kind, constraints, permission map
  entries) as serializable data. `apps/web/admin` composes hand-written field
  primitives keyed by descriptor kind; layouts compose panels; nothing
  generates a component tree (react-boundary rules — followed; Payload's
  import-map generated admin — diverged).
- Server Components read the engine directly (same process or via the
  editor-zone API boundary — resolved at implementation against the
  multi-zone topology); mutations go through route handlers calling the
  engine. Session/tenant switcher rides better-auth organizations
  (`activeOrganizationId`).
- Payload v4's RouterAdapter retrofit is the cautionary tale — the admin
  package stays host-agnostic where cheap (descriptors and primitives don't
  import Next), but we do not build a framework-adapter layer we don't need.

## 11. Dependency on the multi-zone auth stage

`packages/auth` does not exist yet (multi-zone tasks stage 3, unchecked).
This change depends on its *contract* — better-auth with the organization
plugin, Postgres-backed — and sequences auth-dependent stages after it. If
multi-zone stage 3 has not landed when implementation reaches tenancy, the
better-auth org integration lands as part of that stage rather than being
duplicated here. The CMS never mounts its own auth routes.

## 12. Licensing note

The core is in-repo and private today. If `@crafty/cms` is ever extracted or
published, it is MIT from day one — the 2025–26 landscape (Directus's second
relicense with key enforcement, Contentful→Salesforce) makes a
credibly-governed permissive core a trust asset. Recorded now so the decision
predates any first commit of an extracted package.

## 13. Deferred ledger (single list, with un-defer triggers)

| Deferred | Trigger |
|---|---|
| Silo tier (db/project-per-tenant) | contractual instance-isolation requirement |
| Materialized projections for hot fields | measured JSONB query distribution on a committed fixture exceeding need |
| Sync-tag SSE live content API | end-user liveness requirement |
| Field-level write rules | first collection needing them |
| Doc locking | second concurrent editor in practice |
| Per-tenant export/backup endpoint | first offboard/backup contract |
| Localization machinery | first localized content requirement |
| Rich-text editor selection | first authoring surface beyond raw fields |
| Content branching (BaseHub-style) | product pull; pairs with the version model |
| Search indexing | first search requirement (outbox already carries the event) |
