# Access control

## Purpose

Defines authorization: per-operation access rules evaluated in the engine
for every principal, results as allow/deny or a query constraint, a
permission map consumable by the admin, and agent principals as first-class,
scoped, expiring, attributed identities. Authentication itself belongs to
the platform identity layer and is out of scope here.

## ADDED Requirements

### Requirement: Access rules gate every operation and can constrain queries

Every collection operation (create, read, update, delete, publish, restore)
SHALL be gated by an access rule evaluated with the principal, the tenant
scope, and the operation. A rule result SHALL be either a decision
(allow/deny) or a query constraint that is conjoined with the operation's
query so the principal can only ever see or affect rows the constraint
admits. Denials SHALL carry a stable diagnostic code.

#### Scenario: A constraint result narrows a list

- **GIVEN** a rule granting an author read access only to entries they
  authored
- **WHEN** the author lists the collection
- **THEN** only their own entries return, under any filter or pagination the
  author supplies

### Requirement: A permission map is derivable per principal

For any authenticated principal and tenant scope, the system SHALL produce a
permission map — per collection, per operation, allowed / denied /
conditional — without executing content queries. The map SHALL be
consistent with actual rule evaluation at operation time.

#### Scenario: The admin renders from the permission map

- **WHEN** the admin requests the permission map for the signed-in principal
- **THEN** collections the principal cannot read are absent from the map,
  and operations marked allowed do not subsequently deny under identical
  conditions

### Requirement: Agent principals are scoped, expiring and attributed

An agent principal SHALL be creatable by an authorized human principal with:
an explicit scope (tenants, collections, operations), a mandatory expiry,
and an owner. Agent principals SHALL pass through the same access evaluation
as humans, additionally bounded by their scope — a scope can only narrow,
never widen, what the owner's rules allow. Every operation SHALL record the
acting principal; operations by an expired or revoked agent principal SHALL
fail with a stable diagnostic code.

#### Scenario: An agent cannot exceed its scope

- **GIVEN** an agent principal scoped to read one collection
- **WHEN** it attempts a write to that collection or a read of another
- **THEN** both fail with stable diagnostic codes, and the attempts are
  recorded with the agent principal's identity

#### Scenario: Expiry is enforced

- **GIVEN** an agent principal past its expiry
- **WHEN** it attempts any operation
- **THEN** the operation fails with a stable expiry code

### Requirement: Anonymous published reads bypass no scoping

The published read surface MAY be served to anonymous readers without
per-request rule evaluation, but SHALL still be tenant-scoped and SHALL
only ever expose entries in the published state of collections marked
publicly readable.

#### Scenario: Anonymous reads see only published public content

- **WHEN** an anonymous reader queries the published surface
- **THEN** drafts, non-public collections and other tenants' content are
  unreachable regardless of query shape
