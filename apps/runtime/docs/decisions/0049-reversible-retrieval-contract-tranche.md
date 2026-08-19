# ADR 0049: reversible Curiosity Retrieval contract tranche

**Status:** Accepted 2026-08-18 for this narrow repository implementation only;
production and irreversible behavior remain NO-GO

## Context

After reviewing scoped options, the root user explicitly authorized the
reversible Curiosity Retrieval tranche and its review remediation. That authority
must be recorded without converting proposed ADRs 0043–0048 into broad
implementation authority or weakening ADR 0041 and plugin ADR 0024 gates.

## Decision

Authorize only pure internal, versioned TypeScript contracts and closed decoders;
read-only mapping of current runtime repository-search outcomes into ephemeral
untrusted candidates and coverage frames; source-capability representations;
typed characterization fixtures for M2, M6, EventCapture, Ledger v1, and the
development evidence slice; specification documentation; and tests.

Implementation remains under `apps/runtime/src/retrieval/`, is not exported from
the package manifest, introduces no dependency, and preserves existing runtime
query responses. Inputs are bounded and fail closed; source metadata is inert,
allowlisted, and cannot confer evidence, validation, lifecycle, or authorization
meaning. Extension acceptance is closed per allowlisted namespace; arbitrary
source-defined objects are not accepted. Provider metadata is identifier-only
and rejects known credential shapes by grammar and prefix; this is not a claim of
generic secret detection, and callers remain responsible for never supplying
credentials as metadata.

## Explicit exclusions

This decision does **not** accept ADRs 0043–0048 generally and does not authorize
public/package-root ABI expansion, SQLite or other persistence, durable capture,
validation or assertion activation, production memory, connectors, crawling,
MCP calls, vector/graph indexes, migrations, dual-write, fallback authority,
credentials, deployment, or any production-readiness claim. Legacy mappings and
authorization snapshots remain non-authoritative metadata. No authoritative root
may be mutated.

## Evidence and reversibility

The implementation is removable internal source, fixtures, tests, and
documentation. Its executable contract and remaining limitations are recorded in
[Curiosity Retrieval internal contracts v1](../specifications/curiosity-retrieval-contracts-v1.md).
Any persistence, composition, package export, migration, or production profile
requires a separate accepted decision and its own qualification evidence.
