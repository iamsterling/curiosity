# CMS Foundation — Deep Research Brief

- **Date:** 2026-08-09
- **Status:** Research brief for a proposal. Not doctrine.
- **How produced:** five deep-research subagent reports (Effect.ts core, PayloadCMS
  v3 architecture, CMS prior-art landscape, content/domain modelling, OpenSpec +
  interactive Claude launch). Primary-source verified as of today; links cited.

## Context this brief is written for

A **brand-new custom CMS** for structured **app/database content** (content
drives an application, not just a marketing site). Requirements established with
the team:

- Stack is **TypeScript + Effect.ts** (favoured for its error model, schema
  discipline, structured concurrency, and agent-friendliness).
- **PayloadCMS** is the UX/architecture inspiration.
- Admin surface already exists in this repo: **`apps/web/admin`**
  (`@crafty/admin`, Next 16 / React 19, Server Components, better-auth gating
  planned, `@crafty/scene-store`). Part of the multi-zone platform
  (`apps/web`: base / editor / marketing / admin).
- **OpenSpec is the sanctioned process** — `openspec/` is live, OpenSpec skills
  are installed for Claude Code (`.claude/skills/openspec-*`, `/opsx`).
- Spec generation happens in an **interactive Claude Code session on `--model
  fable`** (Fable 5), never `-p`.

## 1. Effect.ts as the app core (report: Effect.ts CMS backend)

- **Version reality:** Effect **v3 is end-of-line** (maintenance only). **v4 is
  in beta** with unified versioning (ecosystem packages share one version; much
  of platform/sql/rpc merged into `effect/unstable/*`). For a greenfield CMS:
  **start on v4 beta, pin exact versions**, budget for `unstable/*` churn.
  Schema renames in v4 are mechanical (`decodeUnknown`→`decodeUnknownEffect`,
  `filter`→`check`, `TaggedError`→`TaggedErrorClass`).
- **`@effect/schema` is the single source of truth.** One schema drives:
  decode/encode validation, JSON Schema 3.x via `JSONSchema.make` (incl.
  OpenAPI 3.1 target), API contracts via `HttpApi`, DB accessors, and property
  tests (`Schema.arbitrary`). Structural + refined schemas; `transformOrFail`
  bridges `Encoded ↔ Type` and can depend on injected services.
- **Schema evolution for stored documents:** version-tagged union pattern —
  `Schema.Union(Schema.Struct({version: tag(n), value: Vn})…)`, decode against
  the union with `transformOrFail` chains `V1→…→Vcurrent`, always encode latest.
  On read, an unknown/future version **fails to parse — reject, never coerce**
  (mirrors the repo's "unknown schema versions are rejected" invariant). Use
  `onExcessProperty: "preserve"` when legacy codecs must round-trip newer
  documents; `"error"` at API boundaries. Store documents as JSON (JSONB) via
  `Schema.parseJson`.
- **Persistence — Effect SQL (Postgres) is the right primary choice for
  content:** pooled connections, `sql.withTransaction` (nested savepoints),
  classified `SqlError`, streaming, LISTEN/NOTIFY (publish invalidation), and
  `SqlSchema`/`SqlResolver` decoding rows straight into a Schema. Documents live
  in a `documents(id, type, version, data jsonb, status, …)` table; relational
  tables (users, roles, revisions, webhooks, audit) are plain typed SQL.
  Migrator is forward-only TS Effects. Prisma has no real Effect integration
  (and is a second schema source). **Drizzle has a first-class Effect bridge**
  (`drizzle-orm/effect-postgres`) — a legitimate hybrid only if relational CRUD
  outgrows raw SQL; start with Effect SQL alone.
- **API layer:** `@effect/platform` `HttpApi` is declarative and schema-driven
  with built-in error schemas (404/409 etc.), Swagger, and `OpenApi.fromApi`
  emitting OpenAPI 3.1. Still officially **Unstable** — acceptable for
  greenfield, budget for change. Note the v4 change: endpoint decode failures
  default to defects → use `HttpApiSchema.withBadRequest` for typed 400s.
- **Recommendation:** **versioned REST via HttpApi** for the public content API;
  **RPC (`@effect/rpc`, v4: `effect/unstable/rpc`)** for internal admin/agent
  tooling where type-sharing beats REST purity. Both mountable on one router.
- **Errors & observability:** domain errors = `Data.TaggedError` classes (v4:
  `Schema.TaggedErrorClass` so errors are schemas and `addError`-able), carrying
  a **stable machine-readable `code`** + `_tag` for `catchTags`. At the HTTP
  boundary: expected errors → declared `HttpApiError` schemas; defects → 500,
  logged, never leaked. `Effect.withSpan` + `@effect/opentelemetry` for tracing;
  `Logger.json`. `@effect/vitest` gives `it.effect`, `it.layer`, `it.live`,
  `it.prop` (schema properties); kernel tests need no DOM/HTTP.
- **Prior art:** **FoldCMS** — small MIT static CMS on Effect + `@effect/sql`
  (`defineCollection` with a Schema, typed relations, loaders) — closest
  working example to study.
- **Known friction:** real learning curve; cryptic layer-composition type
  errors (build the layer graph in one place); stepping through internals when
  debugging; small ecosystem (write own service wrappers); v4 `unstable` churn.

## 2. PayloadCMS v3 — what to steal, what to avoid (report: PayloadCMS architecture)

**How it works (end-to-end):** `buildConfig()` (collections/globals/fields) is
sanitized into the single source of truth; one config drives the DB schema
(Drizzle for Postgres/SQLite, Mongoose for Mongo), the generated React admin,
three API surfaces, and generated TS types. Fields carry their own validation,
hooks, access, localization, indexing and admin components (registered by string
path via a generated import map). All APIs are adapters over the in-process
**Local API**. Access control = per-op functions returning `boolean | where`; a
login-time Access op builds a permission map that drives admin visibility.
Drafts/versions = whole-document snapshots (newest wins; publish = write-through
to the main table); doc locking for concurrency. Localization is field-level.
(Aug 2026 note: Payload joined Figma June 2025; core remains MIT/self-hostable;
v4 in beta.)

**Steal:**
1. Config-as-single-source (one field spec → schema, admin UI, API, types).
2. Local API as an in-process engine; every surface (REST, GraphQL, SDK, MCP)
   is a thin adapter over it — an agent-first CMS should expose an agent
   protocol over the same pipeline.
3. Access-control-as-query-constraint + permission map for admin visibility.
4. Whole-doc version snapshots for drafts (maxPerDoc pruning; publish = write
   through). Simpler than deltas/CRDT unless real-time collab is the product.
5. Per-op lifecycle hooks with explicit blocking semantics.
6. JSONB document column + projection columns over dozens of child tables.

**Avoid:**
- **Snapshot-diff migration generation** — duplicates under multi-dev (#14415);
  Local API unusable inside migrations (#11168). Greenfield: migration-as-code
  whose state derives from the migration log, **schema snapshots frozen per
  migration**, data migrations run against migration-time schema, no dev-push.
- Dual Mongo+SQL abstraction cost; depth/typing footgun on populated
  relationships; generated "DO NOT MODIFY" magic; per-request access eval on hot
  anonymous reads; un-awaited `afterChange` work silently rolling back (use an
  explicit **outbox**, which Effect makes first-class).
- GraphQL-for-everyone (redundant with RSC + typed SDK); the full jobs/queue
  suite to start (outbox + external queue is enough).

## 3. Prior-art landscape (report: CMS prior-art landscape)

Converged blueprint a new CMS should execute (TS + Effect):

- **Payload**: config→(schema, types, admin, API) pipeline + Local API.
- **Sanity**: structured content as data (Portable Text), live preview — but the
  Content Lake is proprietary SaaS; **open front-end + closed store is a trap**
  — ship the storage layer.
- **KeystoneJS**: one TS config generating Prisma schema + GraphQL + admin +
  types (purest schema-first expression; also a fund-/-focus caution).
- **Ghost**: editorial rigor (roles, scheduling, review) is a *product* — design
  it into core, not a paid tier.
- **Directus**: owning the DB is the real self-host guarantee; licensing history
  (BSL→GPLv3→MSCL+keys) is a trust cost — **MIT/Apache from day one**.
- **Strapi**: click-built schema is the anti-pattern; open-core gating + phone-
  home licensing are hostile to self-hosters.
- **Git-based (Tina/Keystatic/Decap)**: Git gives review/audit/branching for
  free but collapses on scheduling/workflows/conflicts for relational content —
  fine as an export/audit format, not the primary store.
- Anti-patterns: content as documents (WP/HTML-comment blocks), GraphQL-only
  serving (query-complexity ceilings), building the admin without a component
  kit, per-seat pricing on core.
- The 12 decisions to nail (short form): schema-as-code+single source; derived
  compile-time types; core-as-library + HTTP-as-adapter; customer-owned DB with
  migration-as-code; rich text as structured data; draft/published as separate
  query surfaces; immutable/diffable/restorable version history; editorial
  workflow in core; access-control-as-function; live preview via a live content
  API; first-class typed media assets with transforms; license/business model
  before first commit.

## 4. Content / domain modelling (report: content-domain modelling)

- **Data over presentation** — model what content *is*, not how it looks.
- **Reference vs embed:** reference when reusable / own lifecycle / own editor /
  must stay in sync; embed when document-specific or a historical snapshot.
  Heuristic: "if the parent were deleted, should this go too?"
- **Stable ids** (implementation identifiers, not slugs); store legacy/external
  ids as fields. Referential integrity valuable; unresolved weak references are
  flagged, never silently substituted (matches "diagnostics over guesses").
- **Authored content is durable; resolved output is never written back.**
- **Rich text as structured blocks** (Portable Text-style): blocks, spans,
  marks/annotations — queryable and renderer-independent.
- **Versioning/workflow:** state machine for draft → review → publish; schedule-
  capable; immutable audit trail.
- **Schema evolution:** additive-only migrations, forward compatibility,
  validation at rest and at the edge.
- **Storage tradeoff:** JSONB documents vs normalized tables — decide from real
  query patterns (block embedding is fine; joins hurt when over-normalized).
- **i18n:** decide field-level vs document-level early (Payload does field-level
  locale maps/tables; fallback chains).

## 5. Spec generation session — mechanics (report: OpenSpec + Claude launch)

- OpenSpec is installed here: config at `openspec/config.yaml` (projected into
  every proposal: Crafty invariants + "reasoning depth scales with blast
  radius", "evidence over assertion", proposal/spec/design rules), live
  `openspec/changes/`, and the OpenSpec skills in `.claude/skills/`.
- Launch a **real interactive** session (never `-p`):

  ```sh
  osascript -e 'tell app "Terminal" to do script "cd /Volumes/dev/crafty && /Users/sterling/.local/bin/claude --model fable"'
  ```

  (`--model fable` = Claude Fable 5; needs Claude Code ≥ 2.1.170, installed is
  2.1.226. `/model fable` also works mid-session.)
- In-session: use the `openspec-propose` skill (slash command) or `/opsx` to ask
  Claude to generate the CMS proposal.
- Pitfalls: Fable 5 safety classifiers can fall back to Opus on some domains
  (rare; >95% sessions unaffected); avoid piping stdin (keeps it interactive).

## Proposed direction to validate in the proposal (not decided)

- New editor-package (e.g. `packages/cms`) hosting the Effect-based core:
  `kernel/` (zero-IO: content schemas, versioned codecs, validation —
  "validated, invertible commands" discipline from the constitution) +
  `services/` (`ContentStore`, `AssetStore`, `PublishService`, `AuthService`,
  `WebhookDispatcher`) + `http/` (`HttpApi` groups as thin adapters).
- Postgres + JSONB document store; migration-as-code with frozen per-migration
  snapshots.
- Config-as-single-source modelled after Payload, expressed as an Effect schema
  (fields → DB schema, validation, HTTP contracts, admin forms, generated
  types).
- Local-API-first; REST + RPC/agent protocol as adapters over one pipeline.
- Admin lives in `apps/web/admin` (Server Components + `useSyncExternalStore`
  discipline; panels consume their own state — follow the react-boundary doc).
- Whole-doc version snapshots; draft/published as separate query surfaces.
- Stable machine-readable error codes; explicit outbox for async effects.

## Key sources

- Effect: effect.website/docs (Schema, platform, SQL), v4 beta announcement,
  schema versioning issue #1818, tim-smart versioned-union gist.
- Payload: payloadcms.com/docs (concepts, database, access-control, versions,
  local-api, plugins, mcp), issues #14415, #11168, #11072, #14794, #15542.
- Landscape: Sanity/Payload/Strapi/Directus/Keystone/Tina/Keystatic/Ghost docs
  as cited per report; FoldCMS (github.com/bitswired/foldcms); Keystone 8;
  Ghost architecture; figma.com "payload-joins-figma".
- OpenSpec: openspec.sh, openspec npm package, Claude Code model-config docs.
