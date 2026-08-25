# Q1 final boundary audit

**Corrected verdict:** **ORIGINAL BOUNDARY NOT PRESERVED; EXACT OUTPUT ESCAPE
REMEDIATED.** Q1 remains stopped on Q1-E02 and evidence-sufficiency failures.
This supersedes the original “Boundary preserved” verdict.

## Persistent delta

The root check-types/lint commands created or modified 18 ignored generated files
outside `docs/architecture/custom-harness/qualification/q1/`. Original
pre/post status checks omitted ignored-file detail, so their outside-Q1 match did
not detect the escape. The exact paths, ignore rules, sizes, SHA-256 values,
filesystem times, and command-window ties are retained in
`../evidence/Q1-E02/12-remediation-disposition.md` without copied contents.

The authorized remediation deleted exactly those 18 files. It did not remove
their parent directories or unrelated ignored artifacts. The failed first
post-check invocation returned exit 1 because its stat-snapshot exclusion
expression accidentally left the 18 targets in the comparison; its preserved
diff shows only those exact 18 removals. Subsequent static checks confirm all 18
are absent.

No tracked file, product source, root/app manifest, root lock, product Cargo
file, CI, inventory/status file, `.git`, credential, global package, or toolchain
was changed. The accepted plan, package README, ADR-001 through ADR-010, and
`research/harnesses/RESEARCH-CONTRACT.md` remain pre-existing untracked inputs.

## Runtime/retrieval boundary

- The original aggregate ledger records exact GET-only HTTPS retrieval into
  authorized scratch, but lacks exact per-request commands/exits and cannot prove
  complete network-zero.
- No provider candidate, credential, endpoint test, listener, or provider request
  is recorded. No evidence proves a provider request occurred; no packet/endpoint
  evidence proves none occurred.
- Probe receipts describe installed artifacts, no-auto-install, and no-env-file
  controls, but focused Q1-T01/T02/T04 receipts are not exactly reproducible.
- Copied persistent third-party bytes are recorded as identified license/notice
  texts; Q1-T04 lacks sufficient command metadata to qualify that scan.

## Stop and remediated postcondition

Canonical-root lint exited 1. The later root test, build, and verify commands
were not run. The later authorized remediation performed only Q1
evidence/document writes, deletion of the exact 18 audited generated files, and
read-only/static local checks. It did not rerun any root or qualification
command.

The protected generated plugin manifest remains
`cc9018882649228e6514e2e0df8ba983d1a8a90a9a7361ba75c7da78d8457e10`.
Root `bun.lock`, `package.json`, and `turbo.json` remain respectively
`0656e39945e9b62c4535f0a60fb3da5a2d0206e9e0757d4226e277aba98e9075`,
`d45e0fcd14dd5f373fec1e131895bca2e291abc3bfe4aef1418562ee9d5b31d5`,
and `d6e2e99a1ae21c2f5fd2c32a7f85089b1ae81b73c0eac7999e7a19cef2c5c549`.
Original scratch and remediation temporary snapshots are absent. Current retained
evidence remains under the Q1 tree, but remediation does not retroactively make
the original boundary preserved or Q1 qualified.
