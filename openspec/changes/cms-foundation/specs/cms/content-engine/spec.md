# Content engine

## Purpose

Defines the single in-process content engine: validated CRUD, draft and
published as separate query surfaces, whole-document version history, and
publish/unpublish semantics. Every external surface is an adapter over this
engine; none may bypass it.

## ADDED Requirements

### Requirement: All content operations flow through one engine

Every content mutation and read — from the HTTP API, the agent surface, the
admin, or internal services — SHALL execute through the same engine
pipeline: tenant scoping, access evaluation, validation, persistence,
side-effect recording. No surface SHALL write content storage directly.

#### Scenario: Every surface produces identical outcomes

- **GIVEN** the same create request submitted via the HTTP API and via the
  agent surface by equivalently-permitted principals
- **WHEN** both execute
- **THEN** both produce documents that validate identically, record their
  principal, and trigger the same side-effect records

### Requirement: Writes are validated and atomic

A create or update SHALL validate the full resulting document against its
collection definition before persisting; an invalid document SHALL be
rejected with stable field-addressed diagnostic codes and SHALL persist
nothing. A write and its side-effect record SHALL be committed atomically —
either both are durable or neither is.

#### Scenario: An invalid update persists nothing

- **WHEN** an update produces a document violating a field constraint
- **THEN** the response carries a stable code identifying the field and
  rule, and the stored document is unchanged

### Requirement: Draft and published are separate query surfaces

Every draft-enabled collection SHALL expose two distinct read surfaces:
drafts (latest working state, authorized principals only) and published
(last published state, servable to anonymous readers). Editing a draft SHALL
NOT alter what the published surface returns until publish. Publishing SHALL
atomically make the draft state the published state.

#### Scenario: Draft edits do not leak to the published surface

- **GIVEN** a published entry that is subsequently edited as a draft
- **WHEN** the published surface is read
- **THEN** it returns the last published state, while the draft surface
  returns the edited state
- **AND** after publish, both surfaces return the new state

### Requirement: Version history is recorded by default and restorable

Every write to a versioned collection SHALL record a whole-document version
snapshot with its principal and timestamp. Versioning SHALL be on by default
for content collections, with a bounded per-entry retention count; the
oldest snapshots are pruned at the bound. An authorized principal SHALL be
able to restore any retained version, which becomes a new draft version
rather than rewriting history.

#### Scenario: Restore creates a new version

- **GIVEN** an entry with versions 1..5
- **WHEN** version 3 is restored
- **THEN** a new version 6 with version 3's content exists as the draft, and
  versions 1..5 remain in history

### Requirement: Publish can be scheduled

An authorized principal SHALL be able to schedule a publish or unpublish for
a future time. The transition SHALL occur within the system's declared
side-effect latency of the scheduled time, SHALL be attributed to the
scheduling principal, and SHALL be cancellable until it runs.

#### Scenario: A scheduled publish fires once

- **GIVEN** a draft scheduled to publish at time T
- **WHEN** T passes
- **THEN** the entry is published exactly once, the transition is recorded
  with its scheduling principal, and cancelling after T fails with a stable
  code
