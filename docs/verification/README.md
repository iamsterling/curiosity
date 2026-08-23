# Verification tiers and CI operation

This directory is repository verification metadata, not capability lifecycle
authority. `inventory.json` classifies every package, script, export, workspace
edge, Cargo crate and target, native ABI profile, test source, workflow job,
release artifact, cross-package contract, and negative boundary. New or changed
surfaces fail until a review updates both the behavior and its classification.

## Local commands

- `bun install --frozen-lockfile --ignore-scripts` installs the locked workspace
  without granting dependency lifecycle execution.
- `bun run test` runs repository tests and each workspace `test` task once.
- `bun run verify` checks inventory and status, runs each workspace `verify`
  task once, then executes the staged plugin/runtime contract without rebuilding
  the already-produced plugin/native inputs. The workspace plugin `verify` is
  portable and cannot invoke the Darwin real-host suite.
- `bun run --cwd apps/plugin/opencode2 verify:linux` fails closed off Linux.
- `bun run --cwd apps/plugin/opencode2 verify:darwin` is the explicit Darwin
  arm64 real-host profile and additionally requires
  `CURIOSITY_TRUSTED_DARWIN_MANUAL=1`; no root or required aggregate reaches it.
- `bun run runtime:portable` is the Linux portable runtime gate.
- `bun run runtime:network-denied` requires non-interactive sudo and establishes
  a fresh `unshare -n` namespace. Missing sudo, `unshare`, `ip`, namespace
  creation, or loopback setup is failure; it is never a skip.
- `bun run runtime:darwin-compatibility` is guarded for a trusted manual Darwin
  runner invocation and explicitly is not M7 qualification.

The runtime gates require rustc and cargo exactly `1.97.1`. Portable and Darwin
compatibility verify formatting, locked clippy with warnings denied, default and
query-only Cargo tests/builds, TypeScript, classified tests with zero skips,
exact normalized ABI symbols, and the package-shaped plugin/runtime executable
contract. Linux uses `nm -D --defined-only`; Darwin uses `nm -gU` and normalizes
the leading underscore.

## CI cadence and required gate

Pull requests, pushes to `main`, and merge queues run inventory/status, plugin
Linux verification, registry smoke, portable runtime plus executable/ABI
contract, and fail-closed network namespace lanes. `required-gate` uses
`if: always()` and fails unless every dependency result is exactly `success`.
No branch rules are changed by this repository.

Installer stress runs only on its weekly schedule or selected manual dispatch.
Darwin compatibility is a separate boolean manual dispatch on the exact labels
`self-hosted`, `macOS`, `ARM64`, and `curiosity-darwin-arm64`. Required lanes are
visibly skipped on schedule/manual events rather than misreported as required
green checks.

## Foreground Darwin runner security

The Darwin runner must remain separately registered and offline by default.
For an approved dispatch, an operator starts its runner interactively in a
dedicated foreground terminal, selects only the reviewed dispatch, observes the
job, stops the process immediately afterward, and verifies no runner process or
service remains. Never install a LaunchAgent/daemon, enable unattended startup,
accept fork or pull-request work, expose repository/provider credentials, or
reuse this label set for general jobs. This procedure is documentation only;
the verification change does not start or install a runner.

## NO-GO boundaries

Publication, deployment, production/lifecycle enablement, GitHub ruleset
mutation, current-source M7 qualification, historical artifact mutation, SDK v2
requalification, runner services, and source capability promotion remain
NO-GO. The immutable M7 artifact remains Current only for its exact historical
commit, pins, platform, and archive digest; current changed source is Deferred.
