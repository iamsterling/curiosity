# Tenancy

## Purpose

Defines dynamic multi-tenancy: tenants created at runtime, every content
operation scoped to exactly one tenant, company content held by a reserved
system tenant, and isolation enforced in depth. Tenancy is a property of the
content engine itself, not a plugin over it.

## ADDED Requirements

### Requirement: Tenants are created and managed at runtime

Creating a tenant SHALL be an online operation available through the API to
an authorized principal — no deploy, no schema change, no restart. A new
tenant SHALL be immediately able to hold content and members.

#### Scenario: A tenant created via the API is immediately usable

- **WHEN** an authorized principal creates a tenant
- **THEN** the tenant exists immediately, and a subsequent write of a content
  entry scoped to that tenant succeeds

### Requirement: Every content operation is tenant-scoped by construction

Every content read and write SHALL execute within an explicit tenant scope.
There SHALL be no code path that queries or mutates content without a tenant
scope; an operation arriving without one SHALL fail with a stable diagnostic
code rather than defaulting to any tenant.

#### Scenario: A scope-less operation is rejected

- **WHEN** a content query is attempted with no tenant scope established
- **THEN** the operation fails with a stable machine-readable diagnostic code
- **AND** no rows from any tenant are returned

#### Scenario: Cross-tenant reads return nothing

- **GIVEN** tenant A and tenant B each hold entries in the same collection
- **WHEN** a principal scoped to tenant A lists that collection
- **THEN** only tenant A's entries are returned, including under bulk
  operations, filtered queries and pagination

### Requirement: Isolation is enforced in depth, not by query discipline alone

Tenant isolation SHALL be enforced by at least two independent layers: the
engine SHALL scope every query explicitly, and the storage layer SHALL
independently refuse rows outside the operation's tenant scope, such that a
defect in one layer does not expose another tenant's data. Bulk and
administrative operations SHALL pass through the same scoping as single-item
operations.

#### Scenario: A bulk delete cannot cross tenants

- **GIVEN** a principal scoped to tenant A issues a bulk delete matching a
  filter that would match entries in tenant B
- **WHEN** the delete executes
- **THEN** only tenant A's matching entries are deleted and tenant B's are
  untouched

### Requirement: Company content lives in a reserved system tenant

First-party content (blog, marketing, docs collections) SHALL be held by a
reserved system tenant that cannot be deleted and is not listable or
selectable by non-system principals. The system tenant SHALL obey the same
scoping and access rules as every other tenant.

#### Scenario: The system tenant is invisible to customers

- **WHEN** a customer-tenant principal lists tenants or queries content
- **THEN** the system tenant and its content do not appear

### Requirement: Tenant membership and roles come from the platform identity layer

A principal's tenant memberships and roles SHALL derive from the platform
identity layer's organization model; the content system SHALL NOT maintain a
second membership store. The active tenant for a session SHALL be resolved
from the session's active organization.

#### Scenario: Organization membership grants tenant access

- **GIVEN** a user who is a member of organization X with an editor role
- **WHEN** the user's session is active with X selected
- **THEN** content operations execute scoped to X's tenant with the editor
  role's permissions
