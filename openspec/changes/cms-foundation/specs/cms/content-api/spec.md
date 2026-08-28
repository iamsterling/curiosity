# Content API

## Purpose

Defines the external surfaces over the engine: a versioned HTTP API derived
from collection definitions, an agent tool surface with explicit exposure,
and the error contract shared by both. Both are adapters; neither owns
behavior of its own.

## ADDED Requirements

### Requirement: The HTTP API is versioned and derived from definitions

The system SHALL expose a versioned HTTP API whose per-collection contracts
(paths, request/response shapes, error shapes) derive from collection
definitions. A contract SHALL exist for every exposed collection without
hand-written per-collection route code. The API version in the path SHALL
change only on breaking contract changes.

#### Scenario: A new collection is served without new route code

- **WHEN** a collection (code-defined or tenant-defined) becomes exposed
- **THEN** its CRUD endpoints, filtering and pagination are served under the
  current API version with contracts matching its definition

### Requirement: Errors are stable codes, never leaked internals

Every API error response SHALL carry a stable machine-readable code and the
addressed field or resource where applicable. Expected failures (validation,
access denial, version conflict, not found) SHALL be distinct declared
shapes. Unexpected failures SHALL return a generic server error carrying a
correlation identifier and SHALL NOT expose internal details; the full
failure SHALL be recorded server-side under that identifier.

#### Scenario: A defect does not leak

- **WHEN** an unexpected internal failure occurs during a request
- **THEN** the response is a generic server error with a correlation id, and
  the recorded server-side failure is retrievable by that id

### Requirement: Agent tools are an explicit, opt-in projection

The system SHALL expose an agent tool surface (schema-described tools for
querying and mutating content) projected from collection definitions. A
collection SHALL be reachable through agent tools only when its definition
explicitly opts in — never by default — and newly added collections SHALL be
unexposed until opted in. Tool input/output schemas SHALL derive from the
same definitions as the HTTP contracts. Agent tool calls SHALL authenticate
as agent principals and pass through engine access evaluation.

#### Scenario: An unexposed collection is invisible to agents

- **GIVEN** a collection without agent exposure
- **WHEN** an agent principal lists available tools
- **THEN** no tool referencing that collection appears, and a direct call
  naming it fails with a stable code

### Requirement: Draft reads and mutations require principals; published reads scale anonymously

API routes serving drafts or accepting mutations SHALL require an
authenticated principal and tenant scope. The published read surface SHALL
be servable without a session and SHALL be cacheable — responses for the
same published state SHALL be byte-identical to permit caching layers.

#### Scenario: The published surface is cache-friendly

- **GIVEN** an unchanged published entry
- **WHEN** it is fetched twice anonymously
- **THEN** both responses are byte-identical
