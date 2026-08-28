# Admin surface

## Purpose

Defines the admin zone as the first full consumer of the content engine:
collection browsing and editing driven by descriptors, tenant switching,
draft/publish controls, version history, and live preview of drafts. The
admin renders from data the engine provides; it owns no content logic.

## ADDED Requirements

### Requirement: The admin renders collections from descriptors

The admin SHALL render collection lists and entry editors from the field
descriptors and permission map the engine provides — including for
tenant-defined collections it has never seen — by composing its own field
primitives per descriptor kind. A descriptor kind the admin does not
recognize SHALL render as an explicit unsupported-field state, never crash
the editor and never silently drop the field's value on save.

#### Scenario: A tenant-defined collection gets a working editor

- **GIVEN** a tenant principal defined a new collection minutes ago
- **WHEN** an admin user opens it
- **THEN** a list view and entry editor render from its descriptors, honor
  its validation, and save through the engine

#### Scenario: Unknown descriptors degrade loudly and safely

- **GIVEN** an entry containing a field whose descriptor kind the admin
  build does not implement
- **WHEN** the entry is edited and saved
- **THEN** the unknown field shows an unsupported state, its stored value
  survives the save unchanged, and a diagnostic is surfaced

### Requirement: Admin capability follows the permission map

The admin SHALL show and enable only what the signed-in principal's
permission map admits: collections absent from the map do not appear;
operations marked denied are not offered. The map SHALL be enforced
server-side by the engine regardless of what the admin renders.

#### Scenario: A read-only principal sees no edit affordances

- **WHEN** a principal with read-only permissions opens a collection
- **THEN** no create, edit, publish or delete affordances render, and a
  hand-crafted mutation request still fails at the engine

### Requirement: The admin operates within a selected tenant

The admin SHALL scope every view and operation to an explicitly selected
tenant from the principal's memberships, with the selection visible at all
times. Switching tenants SHALL never carry pending edits across tenants.
Principals with a single membership get that tenant implicitly.

#### Scenario: Tenant switching is total

- **GIVEN** a principal who is a member of tenants A and B
- **WHEN** they switch from A to B
- **THEN** all lists, editors and permission-derived affordances reflect B
  only, and no draft state from A remains in the editing surface

### Requirement: Editing exposes drafts, publishing and history

The entry editor SHALL make the draft/published distinction explicit:
which state is being viewed, whether a draft differs from published, and
controls to publish, schedule, or restore a version — each available only
per the permission map. Version history SHALL be browsable with principal
and timestamp per version.

#### Scenario: The editor is honest about state

- **GIVEN** a published entry with newer draft edits
- **WHEN** an editor views it
- **THEN** the surface shows the draft with an explicit
  differs-from-published indication and a publish control

### Requirement: Draft saves refresh a live preview

When a previewable collection's draft is saved from the admin, an open
preview of that entry SHALL update to the new draft state without a manual
reload, rendering through the draft read surface.

#### Scenario: Preview follows the draft

- **GIVEN** an open preview of an entry alongside its editor
- **WHEN** the editor saves a draft change
- **THEN** the preview shows the change without manual reload
