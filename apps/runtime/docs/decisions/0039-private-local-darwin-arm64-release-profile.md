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

The host's ripgrep bootstrap is closed by shipping the exact existing local
`/Users/sterling/.cache/opencode/bin/rg` input: ripgrep 15.1.0 revision
`af60c2de9d`, Darwin arm64, SHA-256
`4fdf1d8365af224bc70e3c1490d8461d859c37cc70e739a11e987af0215f3e94`.
Build and verification reject any missing, relocated, symlinked, wrong-version,
wrong-architecture, or wrong-hash input and accept only
`/usr/lib/libiconv.2.dylib` and `/usr/lib/libSystem.B.dylib` links. The artifact
records this input in its profile, provenance, CycloneDX component, and manifest
and includes ripgrep's COPYING, MIT, and Unlicense texts.

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
changing `current`. Launch derives `HOME`, all XDG roots, and the OpenCode
configuration directory from one operator-supplied isolated profile root,
clears the ambient environment (including provider/model credentials), and
requires canonical external paths in `CURIOSITY_M7_STATE_ROOT`,
`CURIOSITY_M7_WORKSPACE`, and `CURIOSITY_M7_QUERY_CAPABILITY_FILE`. It verifies
the bundled plugin path and runtime search options before supplying them only
through `OPENCODE_CONFIG_CONTENT`. `OPENCODE_CONFIG_PROJECT_DISABLE=1` disables
project discovery, and the otherwise empty isolated OpenCode config directory
is rejected if it contains a competing source. The process-local configuration
first disables `opencode.*` built-ins, then activates the absolute bundled
`plugin/index.js`, so `/api/plugin` can report exactly the one controlled ID.
Capability-file bytes are never copied into configuration or probe records.
There is no generated config file or discovery shim.

Launch starts the bundled host as `opencode2 --standalone`, but the supervisor
does not accept a short-lived process as activated: after a fixed 500 ms delay,
it waits within a ten-second deadline for exactly one setup probe, and requires
exactly one cleanup when the foreground host exits. Smoke instead starts the
same bundled binary as the proven private `opencode2 serve --hostname 127.0.0.1
--port 0` seam. It parses the loopback address from bounded output and repeatedly
sends authenticated, location-qualified `GET /api/plugin` requests for the
canonical workspace until a fixed 30-second deadline. Acceptance requires the
API data to contain exactly `iamsterling.opencode2-config`; built-ins, empty or
additional IDs, malformed responses, and non-200 responses are not evidence.
The bundled adapter records one setup, the expected hook
and tool registrations, and one cleanup through a nonce-bound mode-restricted marker. Its mode-0600 marker is confined to the profile, contains no paths
or secrets, is supplemental rather than authoritative evidence, and is safely
removed after validation. Import, setup, registration, competing activation, cleanup,
host, or survivor failures produce one stable redacted diagnostic. Before either command,
the profile root and each HOME/XDG/OpenCode directory are created or validated
as canonical, current-user-owned, non-symlink directories with no group/world
write permission. Smoke additionally requires `/usr/bin/sandbox-exec`, runs the
host under a packaged literal policy that denies non-loopback outbound traffic
and writes outside the profile plus the validated workspace/state roots, and routes proxy-aware attempts to a packaged
loopback rejecting recorder. Any proxy record is a release-smoke failure,
including model-catalog requests to `models.opencode.ai`, GitHub requests,
provider or inference requests, unknown authorities, and capacity exhaustion.
Launch intentionally makes no general
production-egress claim: it retains profile and environment isolation but leaves
interactive networking policy to a separately reviewed deployment boundary.
The clean environment PATH is exactly the artifact `bin`, `/usr/bin`, and
`/bin`; the runtime executable is invoked by its pinned absolute path. Repeated
generated-script and real-host smokes require zero observed GitHub, model
catalog, provider, or inference attempts because the approved `bin/rg` is found
before the host can enter its downloader.
SIGINT, SIGTERM, and SIGHUP immediately start bounded process-group shutdown;
after a fixed grace interval, or on a repeated signal, remaining descendants
are killed and reaped before the launcher exits with the signal status.

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
Mach-O UUIDs, exact links, successful Bun `dlopen`/query smoke, and generated
launch/host-smoke command, environment, explicit activation lifecycle, profile symlink/mode
rejection, secret-canary redaction, network guard, and child cleanup semantics. Run
them with `bun run --cwd apps/runtime m7:test`; run the complete runtime checks
with `bun run --cwd apps/runtime verify`. Because the release ID must be the
final clean commit, the full `m7:build`, extracted `scripts/verify`,
`scripts/preflight`, `otool -L` exact-link check, install, upgrade, rollback,
uninstall, launch, exact bundled-host `scripts/smoke`, process-survivor check,
and final archive hash/list checks are post-commit gates and are not claimed by
this pre-commit change. Host smoke emits no success evidence externally and on
failure emits only `M7_HOST_SMOKE_FAILED`; it records no response body,
environment dump, profile path, or credential value.
