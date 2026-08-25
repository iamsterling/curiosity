# Q1 tranche entry and boundary

**Tranche:** Q1 only — exact identities, dependency boundaries, and licenses  
**Entry decision:** Authorized by the caller for execution in session
`ses_fcbcdd361ffeeUeMC46nmlf5Wg`. The retained
[PLAN-E02/Q1 receipt](evidence/PLAN-E02-Q1-ENTRY-AUTHORIZATION.md) records the
known authorization evidence and its transcript limits.  
**Implementation authority:** None. I1 and every product change remain
unauthorized.  
**Result:** **STOPPED FAIL CLOSED.** Candidate identity observations were
produced, but the Effect consumer/export boundary and exact reproducibility
metadata for Q1-T01/T02/T04 are insufficient. Canonical-root `bun run lint` also
failed under the credential-empty Q1 tool environment. Per the tranche stop
rule, later root `test`, `build`, and mandatory `verify` commands were not run.
Q1 exit criteria do not pass; no candidate is qualified or accepted for I1,
released, current, or production-ready. See
[Q1-E01](Q1-E01-candidate-matrix.md) and [Q1-E02](evidence/Q1-E02/RESULT.md).

## Decision frame

Q1 answers only whether exact, source-backed candidates exist for later
qualification or implementation entry. It does not implement a product
workspace or establish storage, provider, process-tree, path, Git, sandbox, or
authentication behavior.

Bounded questions:

1. Can exact Effect `4.0.0-beta.107` provide one composition/runtime root without
   a duplicate runtime or an external runtime dependency on the selected API
   surface?
2. Can one exact Bun/TypeScript/Turbo stack and Bun's built-in test runner build
   and test the selected surface, with Node identified whenever invoked?
3. Are source, artifact, lock, feature, platform, license, invalidation, and
   no-auto-update records complete enough for those candidates?
4. Which AI SDK, SQLite, Rust-supervisor, and Git capabilities must remain
   rejected or unknown?

## Authorized write and retrieval surface

The authorized Q1 persistent-write surface was this `qualification/q1/` tree.
Scratch was confined to
`/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/custom-harness-q1/`.
The original receipt records credential-empty GET-only HTTPS retrieval for exact
version, commit, artifact, attestation, manifest, and license URLs. No AI SDK
candidate or provider credential is recorded, but the retained receipts are not
a packet/endpoint observation and cannot prove network-zero. Registry search,
global/root install, lifecycle script, Cargo update/install, Rustup mutation,
and privileged operations were outside the authorized boundary.

## Preflight and corrected boundary observation

- Repository source: `8670d358f761003c49902db5f148baab0c2e6be4`.
- Pre-existing untracked inputs: the accepted custom-harness plan/package/ADRs
  and `research/harnesses/RESEARCH-CONTRACT.md`.
- No `qualification/q1/` file existed at entry.
- No tracked, product, manifest, or lockfile write was introduced by this
  tranche. The original Q1 boundary was nevertheless **not preserved**: root
  check-types/lint created or modified 18 ignored generated files outside the
  Q1 tree. Their metadata was retained and the exact set was deleted during the
  authorized remediation; see
  [the disposition record](evidence/Q1-E02/12-remediation-disposition.md).
- `apps/plugin/opencode2/assets/manifest.json` preflight SHA-256:
  `cc9018882649228e6514e2e0df8ba983d1a8a90a9a7361ba75c7da78d8457e10`.
- Existing ignored build/cache directories were observed. The original status
  checks omitted ignored-file detail and therefore missed the 18-file output
  escape. Q1 evidence is retained only here after exact cleanup; unrelated
  ignored artifacts and parent directories remain untouched.

## Entry controls

- Effect candidate bound: exactly `4.0.0-beta.107`; no fallback candidate.
- AI SDK core/adapter: unselected; retrieval and provider sends forbidden.
- Git: one local CLI candidate inspected; no second backend introduced.
- SQLite behavior, Rust supervision behavior, and Git behavior remain later
  tranche work.
- `UNKNOWN` means unavailable. Qualification is invalidated by any changed pin,
  source, integrity, digest, selected import surface/compiler option, artifact,
  target, platform, or control.

See [the candidate matrix](Q1-E01-candidate-matrix.md), [records](records/), and
[retained evidence](evidence/).
