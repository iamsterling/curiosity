# Q1 provenance, invalidation, and update controls

**Corrected verdict:** **INSUFFICIENT / NOT REPRODUCIBLE** for the Effect and
build/test candidate records. This supersedes the original QUALIFIED verdict.  
**Disposition:** **PROPOSED POLICY ONLY**; product enforcement awaits separate
implementation authority and exact rerun evidence.

## Source-to-artifact rule

A qualified candidate is the conjunction of its exact source revision,
registry/release artifact and integrity, installed-byte digest/manifest where
observed, build environment/tool identities, selected import/features/compiler
options, target/platform, license/notice set, test evidence, and exclusions.
Names or semver selectors alone are never identities.

## Invalidation rule

Qualification becomes unavailable before use when any of the following changes:

- version/pin, resolved source commit, lock integrity, tarball/archive/binary or
  installed-tree digest;
- selected Effect import surface, compiler option, tool feature, dependency
  closure, backend, or artifact;
- Bun, TypeScript, Turbo, Node-when-used, Rust, operating-system, architecture,
  or platform build identity;
- license/notice mapping or copied-material inventory; or
- no-install, no-env-file, update-notifier, telemetry, credential-empty, or
  provider/network exclusion control.

Q1-T02 source mutates a fixture pin, import surface, digest, platform artifact,
and target and compares JSON inequality. Its historical output lacks exact
command/environment/exit metadata and does not implement product enforcement.
The fail-closed policy remains that a changed candidate requires full dependent
qualification, not inheritance.

## No-auto-update controls

- The proposed Bun allowlist is only `run`/`test` with
  `--no-install --no-env-file` and
  scratch config `install.auto = "disable"`. `bun upgrade`, `bun update`,
  `bun install`, and `bunx` are excluded.
- The proposed Turbo profile disables telemetry and update notification. The
  retained source observation calls its updater an update **notifier**; it does
  not establish execution of the control. Any future updater path is forbidden.
- No TypeScript or Effect update path is selected by the proposed profile.
- Root/package/global installs, lifecycle scripts, Cargo update/install, Rustup
  mutation, and Git/Xcode update are forbidden.
- An update can occur only under a later authenticated, reviewed change and a
  complete rerun. Q1 itself is evidence, not an update command.

## Copied-material control

The retained inventory represents project-owned probes/records as clean-room
expressions and lists identified license/notice texts in
`../licenses/README.md`. Q1-T04 lacks exact commands and scan metadata, so the
inventory cannot independently prove copied-material completeness. No AI adapter
or resolved Git-source material is recorded as copied.
