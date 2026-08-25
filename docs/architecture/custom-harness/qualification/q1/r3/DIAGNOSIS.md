# Q1-R3 fail-closed diagnosis

**Verdict remains:** `STOPPED_FAIL_CLOSED`.

## Passed before the stop

- Exact pinned Effect metadata, artifact, source tree, license, public export
  closure, one-runtime behavior, and TypeScript consumer checks passed.
- Exact local/release Bun, Node, and Turbo binary identities passed; local
  TypeScript, Rust, and Cargo versions passed.
- Every-leaf candidate invalidation and no-update/no-install/no-provider
  controls passed.
- The generated-output move-aside completed before the canonical checks, and
  receipt `039-restore` passed after the stop. Scratch is absent and protected
  hashes are unchanged.

## Decisive failure

Receipt `038-root-inventory-check` records exit 1. The mutation tests expected
their own targeted errors but first encountered
`VERIFICATION_PACKAGE_DEPENDENCIES:apps/plugin/opencode2` in the unchanged test
baseline.

The verification catalog records OpenCode plugin and fixture dependencies at
`@opencode-ai/*@0.0.0-beta-17595` and `effect@4.0.0-beta.107`. Current `HEAD`
uses `@opencode-ai/*@0.0.0-beta-18138` and `effect@4.0.0-rc.111`. The same
pre-existing change also left the status catalog, current-state prose, and ADR
authority pinned to beta-17595 while source guards changed.

An in-memory, no-write inventory check proved that six dependency-record edits
plus the changed package-manifest record digest are sufficient for the
verification inventory itself. They are not sufficient to preserve current
lifecycle claims: the status catalog requires an explicit decision to qualify
the new ABI or demote affected capabilities. Updating hashes alone would be an
unsupported acceptance.

## Boundary

No baseline catalog, status, dependency, product, or I1 file was changed.
Continuation requires a separately authorized repository-baseline remediation
and then a new Q1 recovery tranche; failed R3 evidence will not be overwritten.
