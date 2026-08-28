# ADR 0006: Agents Use the Same Command Substrate

Status: Accepted — not yet implemented
Date: 2026-08-05
Implementation status: No agent mutation surface exists; see `../agent-editing.md`

## Context

Agent actions must not bypass document invariants or create a second mutation model.

## Options Considered

- Allow agents to edit serialized JSON.
- Give agents direct renderer or React access.
- Expose validated query and command operations with receipts.

## Decision

Agents call the same command validator and transaction API as human tools. Their operations include preview, validation diagnostics, commit or rollback, and a human-readable diff receipt.

## Consequences

Automation is safer and deterministic. Query and batch command APIs become first-class product surfaces.

## Validation

Agent command fixtures must preserve all document invariants and produce the same history semantics as equivalent human commands.
