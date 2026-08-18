# ADR 0037: M4 verification and GO

**Status:** Accepted 2026-08-18 for M4 GO only

The project owner accepts M4 under ADR 0034 at source digest
`c5370dccd5961e8e4f911cbc05625cbe72d5000c868d3ee82ae0f3aeda1ccb1d`. Reproduce from `apps/runtime` with the command below; ADRs
0037 and 0038 are excluded so recording their verdict does not change it.

```sh
find src native/src tests fixtures/m6-owned tools package.json tsconfig.json \
  native/Cargo.toml native/Cargo.lock docs/README.md README.md \
  docs/plans/complementary-runtime-implementation-plan.md \
  docs/decisions/0034-m4-d5a-owned-crawl-job-semantics.md \
  docs/decisions/0035-m6-repository-local-fetch-d6.md \
  docs/decisions/0036-m6-owned-synthetic-cell-d7.md -type f -print0 | \
  sort -z | xargs -0 shasum -a 256 | shasum -a 256
```

Focused M4 tests cover deterministic submission-orphan repair, idempotency
conflict/replay, ordered bounded events, canonical-file cancellation settlement
under the writer lock, final-fetch cancellation races, immutable terminal
settlement, abandoned-attempt recovery,
foreground execution, redacted audit separation, and Rust transition authority.
Full prior suites remain required. Rollback removes `./admin`, `src/admin.ts`,
`native/src/jobs.rs`, and M4-created state while preserving all M1–M5 paths.

This is not production durability, public crawling, generic jobs, or M7.
