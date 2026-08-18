# ADR 0024: M1 verification and GO

**Status:** Accepted 2026-08-17 for M1 GO only

## Context

[ADR 0023](0023-stateless-m1-runtime.md) authorized the bounded stateless M1
implementation. The implementation was reviewed in coordinator session
`ses_fed0e27ceffeFpVLbhzgBctIHN`. Initial blockers were corrected. The final
independent re-review found no M1 blocker; its remaining medium concern about
dynamic network-module forms and its stale-reference findings were corrected,
and the package verification command then passed.

There is no committed M1 baseline in this working copy. The workspace was dirty
and contained the reviewed M1 files as uncommitted changes, so this decision
cannot claim clean-checkout or commit-based reproducibility. It binds the GO to
the source-manifest digest below instead.

## Decision

M1 is `GO` at the reviewed source snapshot. This closes M1 only. It grants no M2
implementation, corpus, persistence, dependency, adapter, network, publishing,
or deployment authority.

The reproducible source-manifest SHA-256 is:

`5785445eaea7fabfce192e0c0d6ed3a76ee9466822bebb1f4b6da08a27ee2eb2`

From the repository root, reproduce it on macOS with:

```sh
files=(bun.lock apps/runtime/package.json apps/runtime/tsconfig.json \
  apps/runtime/native/Cargo.lock apps/runtime/native/Cargo.toml \
  apps/runtime/native/src/lib.rs apps/runtime/src/index.ts \
  apps/runtime/tests/boundaries.test.ts apps/runtime/tests/runtime.test.ts)
printf '%s\n' "${files[@]}" | LC_ALL=C sort |
  while IFS= read -r file; do
    hash=$(/usr/bin/shasum -a 256 "$file" | /usr/bin/awk '{print $1}')
    printf '%s  %s\n' "$hash" "$file"
  done | /usr/bin/shasum -a 256
```

The digest hashes the SHA-256 manifest lines (`hash`, two spaces, repository
relative path, newline) in bytewise path order. It includes the reviewed M1
sources, tests, package/build configuration, and lockfiles. It excludes ignored
`native/target/` build artifacts and all documentation, including this ADR, so
documentation edits cannot make the evidence self-referential.

## Acceptance evidence

| M1 acceptance item | Evidence at the digested snapshot |
| --- | --- |
| Approved versioned no-corpus envelope and determinism | `tests/runtime.test.ts` checks two identical calls and the exact `unavailable`/`corpus_absent` envelope with zero results. |
| Invalid, oversized, unsupported, and expired input diagnostics | Bun contract cases plus seven Rust tests cover validation order, ABI status integers, malformed UTF-8, independent query bounds, deadlines, and bounded admission. Diagnostics are exact and redacted. |
| No external-content or authority fields | The envelope test rejects `result`, `content`, and `authority`; capability discovery reports no network, corpus, or persistence. |
| No effects, dependencies, or state writes | `tests/boundaries.test.ts` exercises startup, discovery, request, and close in an isolated directory; scans the complete Rust/TypeScript runtime source set for forbidden network, filesystem, environment, subprocess, telemetry, and background-work surfaces; checks manifests for forbidden network dependencies; and probes dynamic `import`/`require` network-module forms against the detector. This is source/effect-denial evidence, not an OS socket sandbox. |
| Bounded behavior | Tests cover a response ceiling of 512 serialized bytes, zero results, request/query/deadline bounds, and native process admission capped at eight. No latency or RSS measurement or claim is made. |
| Required verification | `bun run --cwd apps/runtime verify` exited 0 after formatting and Clippy checks, seven Rust tests, Rust build, TypeScript checking, and 18 Bun tests across two files (59 expectations). |
| Scope boundary | The reviewed implementation contains no adapter, corpus, provider, persistence, packaging, deployment, or background-job implementation. |

## Limitations and reopen conditions

This is not evidence from a clean checkout, a committed tree, an OS-enforced
network sandbox, or a multi-platform matrix. Generated native artifacts existed
locally but were ignored and excluded. The review record is identified only by
its coordinator session; no reviewer identity is asserted.

Reopen M1 before relying on this GO if the manifest digest changes; any included
source, test, manifest, configuration, or lockfile changes; package verification
fails; source discovery no longer enumerates the complete runtime source set;
an effect, runtime dependency, corpus byte, persistent state, adapter, or network
surface appears; a clean-checkout/platform claim is required; or a later review
finds that the static effect controls are insufficient for the scope being
claimed.

## Consequences

The planning record may mark WP0 and M1 closed and may begin decision work for
D4 and D5. [ADR 0025](0025-m2-initial-local-test-snapshot.md) and
[ADR 0026](0026-m2-foundational-durable-state-boundary.md) are proposals only;
neither supplies M2 authority.
