# ADR 0023: stateless M1 Rust core and Bun shim

**Status:** Accepted 2026-08-17 for repository implementation only; publishing
and deployment are not authorized

## Context

The implementation plan requires an explicit product boundary, code owner,
language, semantic contract, resource ceilings, and dependency policy before
M1. The user authorized M1 in `apps/runtime` and selected a Rust core with a
TypeScript shim. ADRs 0021 and 0022 remain proposals.

## Decision

`apps/runtime` owns one stateless, in-process M1 vertical slice. A
dependency-free Rust 2024 `cdylib`/`rlib` validates the canonical
`curiosity.runtime/v0` `web_search` request behind panic-contained, prefixed C
symbols. The ABI accepts caller-owned scalar pointers and lengths and returns
fixed integer statuses; no Rust-owned pointer crosses it. Native process-wide
admission is capped at eight.

A private Bun TypeScript shim loads the library with built-in `bun:ffi`, rejects
unknown or malformed request shapes in fixed precedence, injects time for
deterministic deadline checks, maps only stable redacted diagnostics, and
provides static capability discovery. The accepted request bounds are:

- request IDs are 1–64 ASCII characters in `[A-Za-z0-9._:-]`;
- queries are non-whitespace, at most 500 UTF-16 code units and 2,000 UTF-8
  bytes; whitespace is exactly the ECMAScript `TrimString` whitespace and line
  terminator set (including U+FEFF, excluding U+200B);
- `maxResults` is an integer from 1 through 10, defaulting to 5; and
- deadlines are safe integers strictly after now and no more than 15 seconds
  ahead.

Valid M1 requests deterministically return `unavailable`, `corpus_absent`, `No
corpus is available.`, and zero results. They expose no content, result, or
authority fields. Rejections use only the approved redacted diagnostic set.

M1 has no runtime Rust or npm dependencies and no network, corpus, provider,
index, storage, persistence, environment/credential access, telemetry,
background work, process boundary, adapter, alias registration, installer,
container, publishing, or deployment surface. Generated native artifacts stay
ignored. The Bun shim is a runtime boundary, not a harness adapter; harness
ownership remains unchanged.

## Consequences

This closes WP0 and authorizes implementation only for M1. Focused Rust and Bun
tests are the acceptance evidence. Because a portable socket-denial harness is
disproportionate for this in-process dependency-free slice, M1 uses direct
deterministic behavior, isolated-directory, manifest, import, and forbidden
effect-source checks; this does not authorize treating those checks as a
network sandbox in later milestones.

The ABI rejects each field length against its semantic byte maximum before
constructing a Rust slice or validating UTF-8. In-bound non-null pointers must
still reference readable memory for their full paired length for the duration
of the call. That pointer validity is an unavoidable C caller obligation:
Rust's panic containment does not catch memory faults or make invalid pointers
safe.

Admission saturation and release are tested against the actual process-wide
Rust counter. Bun-level `runtime_busy` mapping remains present in the stable
status table, but deterministic saturation is not exercised from Bun because
M1 exposes no production mutation hook and its synchronous no-corpus call does
not provide a safe deterministic overlap point. This is a test coverage
boundary, not authorization for a test-control ABI symbol.

No package publication, deployment, provider/corpus work, persistence, adapter
or MCP/HTTP surface, `formerhuman_search` registration, or product-completion
claim follows from this decision. Each requires its own accepted authority.
