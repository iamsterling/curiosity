# Persistence and migrations

## Purpose

Defines the storage evolution contract: forward-only migrations as code,
each carrying a frozen snapshot of the schema it was written against, state
derived from the migration log, and no snapshot-diff generation. This is the
deliberate inverse of the migration model whose failure modes motivated this
design.

## ADDED Requirements

### Requirement: Migrations are forward-only code with frozen schemas

Every storage change SHALL be a committed migration executed in a recorded
order. Each migration SHALL embed a frozen snapshot of the schema metadata
it was authored against, and any data transformation inside it SHALL run
against that frozen shape — never against the current collection
definitions. Applied migrations SHALL never be edited; corrections are new
migrations.

#### Scenario: An old data migration survives later schema changes

- **GIVEN** a migration written when a collection had shape A, and the
  collection has since evolved to shape C
- **WHEN** the migration runs on a fresh environment replaying the log
- **THEN** it executes against its frozen shape A and succeeds identically
  to its original run

### Requirement: Migration state derives from the log

The set of applied migrations SHALL be recorded in storage, and the system's
notion of current schema state SHALL derive from that log — not from
diffing a live database against definitions. Two developers adding
migrations concurrently SHALL be detected as an ordering conflict at apply
time with a stable diagnostic code, never silently merged.

#### Scenario: Concurrent migrations conflict loudly

- **GIVEN** two branches each adding a migration with the same predecessor
- **WHEN** the second is applied after the first
- **THEN** the conflict is reported with a stable code, and nothing is
  applied until the order is resolved

### Requirement: Startup verifies migration state

At startup the system SHALL compare the migration log against the
migrations it ships. Pending migrations SHALL be reported (and applied only
when explicitly permitted); an unknown applied migration — one in the log
the build does not know — SHALL be a startup failure with a stable
diagnostic code, never ignored.

#### Scenario: An unknown applied migration halts startup

- **GIVEN** a database whose log contains a migration this build does not
  ship
- **WHEN** the system starts
- **THEN** startup fails with a stable code naming the unknown migration
