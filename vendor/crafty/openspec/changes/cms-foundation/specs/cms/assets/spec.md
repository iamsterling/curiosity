# Assets

## Purpose

Defines first-class media assets: typed, tenant-scoped uploads with
metadata, referenced from content by stable identity, and served through a
distinct read path. Transform pipelines are declared but minimal in v1.

## ADDED Requirements

### Requirement: Assets are typed, tenant-scoped records

An uploaded asset SHALL produce a record with a stable identifier, tenant
scope, declared media type, byte size, content hash, and the uploading
principal. Assets SHALL obey the same tenancy and access rules as content
entries. Upload of a media type outside the accepting collection's declared
set SHALL be rejected with a stable diagnostic code.

#### Scenario: An upload yields a complete record

- **WHEN** an authorized principal uploads an image to a tenant
- **THEN** the asset record carries id, tenant, media type, size, hash and
  principal, and is only visible within that tenant

### Requirement: Content references assets by stable identity

Content fields SHALL reference assets by their stable identifier, never by
storage location or URL. Deleting an asset that is still referenced SHALL
fail with a stable diagnostic code listing referencing entries, unless the
delete is explicitly forced by an authorized principal.

#### Scenario: A referenced asset resists deletion

- **GIVEN** an asset referenced by a published entry
- **WHEN** a delete is attempted without force
- **THEN** the delete fails with a stable code identifying the referencing
  entry

### Requirement: Asset binaries are served through a dedicated read path

Asset binaries SHALL be served through a read path distinct from the content
API, honoring tenancy and public/private state: assets referenced only by
non-public content SHALL NOT be anonymously fetchable, and public asset
responses SHALL be cacheable with hash-addressed stability.

#### Scenario: Private assets stay private

- **GIVEN** an asset referenced only by a draft
- **WHEN** an anonymous fetch of its binary is attempted
- **THEN** the fetch is refused
