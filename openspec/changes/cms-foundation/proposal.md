# CMS foundation: an Effect-native, multi-tenant content core with the admin zone as its first surface

Status: **Proposed**

This is an improvement (a new capability), not a defect fix. Nothing here claims
an existing behavior is broken; where the proposal leans on a claim about the
code, the file is cited.

## The Problem

Crafty needs to store two families of structured content and has no system for
either:

1. **Company content** — blog, marketing copy, docs: content that drives the
   marketing zone and future public surfaces.
2. **Customer project data** — per-customer application content with tenants
   created dynamically at runtime (customer and employee data alike), each
   tenant potentially defining its own collections.

What exists today does not cover this. `@crafty/scene-store` is a
filesystem store for scene documents — slugs, atomic writes, revisions,
snapshots (`packages/scene-store/src/index.ts`) — not a queryable content
store. The admin zone is a stage-2 stub: one Server Component rendering a
files table straight from scene-store
(`apps/web/admin/src/app/page.tsx:1-15`). There is no database anywhere in
the repo, and `packages/auth` does not exist yet — the multi-zone change's
auth stage is specced but unimplemented
(`openspec/changes/multi-zone-platform/tasks.md:65-79`).

**Why not adopt an existing CMS.** Deep research (2026-08-09; reports to be
filed under `docs/research/`, summarized in `docs/research/cms-foundation.md`)
rules out the incumbents for this requirement set:

- **PayloadCMS** (the architectural inspiration): collections are code-defined,
  so tenant-defined collections at runtime have no path (upstream discussions
  #5816, #13987). Tenancy is a bolt-on plugin that rewrites access functions
  after the fact, with failure modes at exactly those seams — bulk delete
  bypassing the tenant filter (#16325), validation races (#16462). Its
  snapshot-diff migration generator is still broken under multi-dev (#14415,
  open as of today) and running migrations against the *latest* schema was
  closed as by-design (#11168). v4 is canary-only — no published beta.
- **Directus** relicensed a second time (BSL → MSCL with license-key
  enforcement in v12); **Contentful** is being acquired by Salesforce;
  **Sanity**'s Content Lake is proprietary SaaS; **Strapi** still has no
  native multi-tenancy. The Effect-native server-CMS niche is empty (FoldCMS
  is build-time/static only).

The blast radius is high — a new database, a new package, a new API surface,
and the admin zone's real content — which is why this change carries a full
design and nine capability specs.

## The Decision

One change, full blueprint: a new package **`packages/cms`** (`@crafty/cms`)
— an Effect-based content core — plus its first consumer, the admin zone.

- **Layout**: `kernel/` (zero-IO: field and collection model, versioned
  document codecs, validation, error codes, admin descriptors), `services/`
  (content engine, tenancy, access, assets, outbox), `http/` (thin adapters).
  All content operations go through one in-process engine (the Local-API
  pattern); REST, the agent surface and the admin are adapters over the same
  pipeline. Effect v4 beta, pinned exact; `unstable/*` imports confined to the
  adapter layer.
- **Tenancy is first-class, pooled**: one Postgres database, every content row
  carries a tenant id, row-level security as defense-in-depth beneath explicit
  app-layer scoping at a single query choke point. Company content is a
  reserved system tenant — one uniform model for both content families.
  Tenants are created at runtime via the API. Identity comes from the
  platform's auth layer (better-auth organizations, orgs = tenants) once the
  multi-zone auth stage lands; the CMS owns *authorization* only.
- **Hybrid schema model, no live DDL**: system collections (company content
  types, users, media) are code-defined schemas, versioned in git.
  Tenant-defined collections are rows in a versioned content-type registry,
  compiled at runtime into the same collection representation. Entry data
  lives in one JSONB-backed entries surface.
- **Migration-as-code**: forward-only migrations with a frozen schema snapshot
  per migration — the direct answer to Payload's #14415/#11168.
- **Versioning**: whole-document version snapshots, versions on by default,
  draft and published as separate query surfaces, publish as write-through.
- **Side effects via an outbox** with lease-based claiming — no jobs/queue
  suite.
- **Agent surface at launch**: an MCP-style tool surface projected from the
  same engine, with explicit per-collection exposure and agent-specific
  principals (scoped, expiring, attributed) — the differentiator no incumbent
  ships.
- **Admin** (`apps/web/admin`): the collection config emits *descriptors* —
  data, not components — and the admin composes hand-written field primitives
  keyed by descriptor type, per the react-boundary rules. No generated admin
  tree.

## Where this diverges from the research brief's "Proposed direction"

The brief (`docs/research/cms-foundation.md` § Proposed direction) is
validated with four amendments:

1. **`AuthService` is dropped from the core.** The brief listed it as a CMS
   service; identity belongs to the platform auth layer already specced in
   the multi-zone change. The CMS consumes a principal and owns access
   decisions — two auth systems would otherwise coexist.
2. **"Admin forms" generated from config becomes descriptors + composed
   primitives.** A Payload-style generated admin contradicts this repo's
   react-boundary rules (no generated container components; layouts compose
   primitives).
3. **Multi-tenancy is added as a load-bearing requirement** the brief did not
   carry. It reshapes persistence (tenant column + RLS), access (tenant in
   every decision), and the schema model (the registry exists because tenants
   define collections at runtime).
4. **The agent surface is promoted from "RPC for internal tooling" to a
   launch requirement.** Every serious competitor shipped an MCP server in
   the last 12 months; the open gap is agent-specific permission primitives,
   not the transport.

## Out of Scope

Named here so nothing is smuggled in later:

- **No GraphQL.** Redundant with typed SDK + RSC (and the landscape's
  query-complexity lesson).
- **No real-time collaboration/CRDT**; whole-document snapshots are the
  versioning model.
- **No per-tenant databases or schema-per-tenant silo tier**; deferred with
  trigger recorded in the design.
- **No live content API (sync-tag/SSE) for end users**; admin live preview
  ships the minimal refresh model; the upgrade path is recorded.
- **No full jobs/queue suite**; the outbox is the only async machinery.
- **No localization machinery**; the document envelope reserves a locale
  dimension, nothing more.
- **No rich-text editor choice**; the *storage format* (structured blocks) is
  in scope, the editing component is not.
- **No content branching** (BaseHub-style); recorded as future-facing prior
  art only.
- **No changes** to the editor kernel, renderer protocol, scene-store, or the
  multi-zone serving topology. Scene documents stay in scene-store — this CMS
  does not absorb them.
