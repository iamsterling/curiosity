## Purpose

Exposes Crafty's agent command-room capabilities through standard local MCP
transports so compatible AI clients can inspect the live document and perform
validated, reviewable edits without direct filesystem or renderer access.

## ADDED Requirements

### Requirement: Discoverable MCP query surface
The MCP server SHALL expose clearly named read-only tools or resources for
document summary, tree/children, node details, selection, resolved layout, and
diagnostics. Read operations MUST return bounded structured content and the
authoritative revision.

#### Scenario: Inspect a live file
- **WHEN** an MCP client calls a query tool with a permitted file scope
- **THEN** it receives structured document context sufficient to choose a
  subsequent operation, including file/page identity and revision

#### Scenario: Query without write capability
- **WHEN** a client has read capability but no write capability
- **THEN** all query tools succeed within scope and mutation tools are rejected
  before reaching the command room

### Requirement: Transactional MCP writes
The MCP server SHALL expose preview, commit, rollback, receipt, and change
subscription operations backed by the command room. MCP write tools MUST
accept only serializable command envelopes and MUST return structured results
with stable error codes rather than transport-specific prose.

#### Scenario: Preview then commit through MCP
- **WHEN** a client previews and commits a valid command batch with a label,
  base revision, transaction ID, and idempotency key
- **THEN** MCP returns the preview diagnostics followed by the durable receipt
  and the live file revision advances once

#### Scenario: MCP rejects an unsafe write
- **WHEN** a client submits arbitrary code, an unrestricted filesystem path, or
  a command outside its capability scope
- **THEN** the server rejects the request without invoking document mutation

### Requirement: Local transport parity
The MCP server SHALL provide stdio for local CLI/desktop clients and
Streamable HTTP for a running local web server, with both transports invoking
the same command-room service and producing equivalent tool results.

#### Scenario: Use the stdio adapter
- **WHEN** a local MCP client starts the CLI adapter and performs a query and
  preview
- **THEN** the adapter serves the request over stdio and applies the same scope,
  validation, revision, and capability rules as HTTP

#### Scenario: Use the HTTP adapter
- **WHEN** a local MCP client connects to the configured Streamable HTTP endpoint
  with an allowed file scope
- **THEN** it can perform the same operations and receive the same structured
  response shapes as the stdio adapter

### Requirement: Capability and scope enforcement
The MCP boundary SHALL enforce capabilities scoped to principal, workspace, file,
and operation, including document read, query-resolved, preview, commit,
rollback, receipt read, and presence/read-event access. The server MUST NOT
accept arbitrary filesystem paths or silently broaden a requested scope.

#### Scenario: Access a permitted file
- **WHEN** a client presents a capability allowing read and preview for one file
- **THEN** it may query and preview that file but cannot read or mutate another
  file

#### Scenario: Missing commit capability
- **WHEN** a client without document-commit capability calls commit
- **THEN** the server returns a stable capability diagnostic and the room and
  document remain unchanged
