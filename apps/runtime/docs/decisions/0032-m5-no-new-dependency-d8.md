# ADR 0032: M5 no-new-dependency D8 disposition

**Status:** Accepted 2026-08-18

## Decision

M5 introduces no external runtime dependency and therefore requires no package
version, license, or supply-chain approval beyond the existing Bun 1.3.14 and
Node-compatible standard-library surface. `node:https`, `node:dns/promises`, and
`node:net` provide transport, resolution, TLS, and address classification.
`bun.lock`, the runtime package dependency set, and Cargo's empty dependency set
remain unchanged by M5.

This accepted `not-required` D8 disposition applies only to the repository
implementation in ADR 0031. Any new transport, proxy, DNS, certificate,
observability, retry, cache, provider SDK, or deployment dependency requires a
new D8 record before introduction. Packaging, supervision, deployment topology,
release, and production rollback remain M7 and production NO-GO.
