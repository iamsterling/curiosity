# ADR 0039: Private local Darwin arm64 release profile

**Status:** Accepted 2026-08-18 for one user/machine/workspace; repository/local GO only

## Decision

M7 may produce one private, unpublished artifact for the exact local profile:
Darwin arm64, macOS 27.0, Bun 1.3.14, rustc/cargo 1.97.1, OpenCode
`0.0.0-beta-17519`, and Effect `4.0.0-beta.101`. It supports one operator,
machine, and canonical workspace, with standalone foreground OpenCode and the
in-process query-only runtime. No other OS, architecture, host version,
multi-user, service, or background operation is claimed.

The release ID is `m7-<full final commit SHA>`. The builder refuses dirty,
untracked, or non-commit input and is designed to run after the reviewed commit
from a clean checkout or detached HEAD. Release native lookup is only
release-relative `native/libcuriosity_runtime_native.dylib`; development tests
must explicitly select the debug profile. The distribution excludes admin and
owned-query entrypoints, crawl fixtures and TLS keys, source state, credentials,
logs, caches, debug output, broad `node_modules`, gateway authority, and crawl
activation.

Installation is under an isolated user-owned or operator-supplied prefix. A
verified staged release is renamed into `releases/` before the atomic `current`
pointer changes. Upgrade and rollback require the same query-state schema and
never roll state back. Uninstall preserves state and credentials by default and
never changes shared/global OpenCode configuration or services.

The build emits a deterministic private `tar.gz`; extraction accepts only
confined regular-file/directory members. Inside it, `manifest.json` hashes and
records modes for every payload file except integrity metadata, while
`SHA256SUMS` hashes that manifest and the same payload set (and excludes itself),
avoiding a circular checksum. Verification requires both views to be complete
and identical. It also requires the CycloneDX inventory to cover every shipped
first-party package and every package observed in the plugin bundle metafile,
with exact versions, payload files, and included license text.

The release-only Cargo invocation passes a Darwin linker flag that sets
`LC_ID_DYLIB` to `@rpath/libcuriosity_runtime_native.dylib`. Darwin 27 requires
a valid, nonzero `LC_UUID`; after normalized install-ID and source-root inputs,
the linker-derived UUID remains deterministic. The release flag is scoped to
the release subprocess and does not alter development or test Cargo builds. Immediately after the native library is
copied into the staging tree, and before inventory, hashes, manifests, or
archive creation, native verification accepts exactly that self-ID and
`/usr/lib/libSystem.B.dylib`; absolute build paths and every other linked
library remain rejected.

Generated lifecycle scripts derive the release root from their own path. Build
and preflight execute `rustc --version` and `cargo --version` and require exactly
1.97.1 rather than merely recording constants. Install lock removal is owned by
the invocation that created the lock. Rollback uses no-follow metadata checks
for `releases`, the selected release, `receipts`, and the receipt, then verifies
artifact integrity, SBOM/license coverage, and the install receipt before
changing `current`.

This is explicitly **not** publisher identity, signature, notarization,
publication, or support for a public supply chain.

## Fences

M5 live provider operation, M6 crawl activation, production/public deployment,
publication, and every platform outside the exact profile remain **NO-GO**.
This ADR does not itself declare M7 GO: a commit-derived clean build and
independent review remain required.

## Verification timing

Source tests cover integrity contradictions, FIFO rejection, lock contention,
external release symlinks, generated-script invocation, deterministic safe
archive extraction, and release-native builds from different-length source
roots producing byte-identical dylibs with no source roots, identical nonzero
Mach-O UUIDs, exact links, and successful Bun `dlopen`/query smoke. Run
them with `bun run --cwd apps/runtime m7:test`; run the complete runtime checks
with `bun run --cwd apps/runtime verify`. Because the release ID must be the
final clean commit, the full `m7:build`, extracted `scripts/verify`,
`scripts/preflight`, `otool -L` exact-link check, install, upgrade, rollback,
uninstall, launch/smoke, and final archive hash/list checks are post-commit
gates and are not claimed by this pre-commit change.
