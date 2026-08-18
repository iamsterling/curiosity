# ADR 0022: installable local-first search runtime

**Status:** Proposed 2026-08-17; not accepted and not implementation authority

## Context

Accepted ADR 0020 defines the bounded provider-neutral `web_search` ABI and its
transition adapter. Proposed ADR 0021 defines invariants for an owned public-web
semantic core. Neither chooses the first distribution shape or assigns authority
among runtime, OpenCode plugin, skill, MCP, and corpus administration.

## Proposed decision

Ship the first reference profile, if separately authorized, as an installable
**local single-node** runtime behind one canonical provider-neutral domain API.
The first integration is a native OpenCode adapter preserving `web_search`, the
deprecated alias, stable redacted diagnostics, hard bounds, and effective
researcher-only permission enforced fail closed after configuration composition.
A skill provides procedure and guidance only. MCP is an optional later transport
and schema adapter; it must not redefine search semantics or authority.

Keep a read-only bounded query surface separate from administrator crawl,
import, pause/resume, delete, rebuild, backup, restore, and policy operations.
Query credentials cannot call admin operations. The runtime owns retrieval
semantics, bounds, captures/versions, provenance, ranking and coverage warnings;
the plugin owns registration/mapping and effective OpenCode permission; the
skill owns no enforcement; a later MCP adapter owns transport only. Neither
search results nor a query caller receive action authority, ambient credentials,
or arbitrary fetch authority.

The local profile starts with no bundled corpus and performs no silent crawl,
provider call, telemetry, or setup network request. Offline query uses the last
authorized local snapshot and discloses staleness/coverage; an empty or absent
snapshot returns a stable reason. Corpus import and movement are explicit,
audited admin acts with rights and custody records.

Distribution must define signed/versioned artifacts, platform and dependency
manifests, paths/ports, least privilege, schema/domain/adapter compatibility,
upgrade preflight and rollback, backup/restore and projection rebuild, credential
revocation, and uninstall choices that never silently retain or delete corpus,
quarantine, backups, logs, or configuration. Capture/version/policy records are
authoritative; query projections are rebuildable.

A single-tenant server profile may follow after an independent operations and
security review. Cluster operation and true multi-tenancy are deferred and
require new decisions; they are not implicit consequences of the domain API.

## Consequences

Local-first minimizes initial trust, custody, network, and operations surface and
makes the native OpenCode contract testable without making OpenCode the domain
model. It also puts installation, upgrades, disk capacity, backups, patching, and
corpus custody on the local operator. Later adapters must prove semantic and
diagnostic compatibility rather than fork behavior.

This proposal does not accept ADR 0021, alter accepted ADR 0020, authorize code,
packaging, crawling, corpus acquisition, provider calls, deployment, dependency
exceptions, or a product-completion claim. See the
[cross-product synthesis](../research/cross-product-web-search-synthesis-2026-08-17.md)
and [owned-search dossier](../research/owned-public-web-search-architecture-2026-08-17.md).
