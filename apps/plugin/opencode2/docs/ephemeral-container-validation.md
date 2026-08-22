# Ephemeral-container package validation

This harness proves the registry-package setup contract without publishing the
package. It does not authorize registry publication, installation cutover,
deployment, or remote mutation.

## Host preparation and container boundary

For the ordinary smoke, the host runs the normal build and
`bun pm pack --ignore-scripts`. The resulting
`@iamsterling/opencode2-config@0.1.0` tarball is the product under test. The pack
contract rejects a private or rewritten manifest, workspace/file/Git/URL
dependency assumptions, missing exports/bin/files, symlinks, and source, test,
workspace, provenance, or dependency-tree artifacts. The tarball is inventoried
and hashed; neither preparation nor validation rewrites it.

The reviewed `tools/ephemeral-container/test-environment/package.json` and
`bun.lock` pin the Linux `opencode2 0.0.0-beta-17595` executable and the product
dependency graph. Host preparation performs a frozen, production,
ignore-scripts Bun install for the selected Linux architecture, copies only the
pinned host executable, traverses the product's installed production closure,
and acquires each exact registry tarball. Every dependency tarball must match
the lock's SHA-512 integrity and its embedded name/version. The prepared tree
contains the product tarball, those lock-resolved tarballs, a generated
allowlist catalog, the pinned test manifest/lock and host executable, and the
validation harness. It contains no checkout, Git metadata, source tree,
preinstalled `node_modules`, registry credential, or Docker socket.

Every prepared file is SHA-256/size/mode inventoried. The launcher verifies the
inventory immediately before Docker; the container verifies it again before
setup and independently inspects every package archive. Docker uses
`--network none`, a read-only root, dropped capabilities,
`no-new-privileges`, a writable `/tmp` workdir, and exactly one read-only bind
mount at `/input`. Only container-local loopback remains. The validation checks
the route/interface state and starts an HTTP registry bound to
`127.0.0.1` only. That registry serves only inventoried package packuments and
tarballs, has no proxy/fallback, logs every request, and rejects everything
else.

The image is pinned by Bun 1.3.14 digest. The host Docker daemon may acquire
that exact image before startup; that daemon operation is outside the
network-disabled container. `--rm` removes the container, and the launcher
removes prepared input in `finally`. A failing `git`/`gh` shim logs any VCS
invocation; success requires zero records. Container environments are built
from an allowlist and contain no operator/provider/registry credentials.

## Registry-package smoke

Run:

```sh
bun run test:container:smoke
```

The smoke extracts the setup block and installer argv from the README embedded
in the product tarball. Test code does not carry another setup recipe. It writes
the exact pinned config, proves clean HOME/XDG/config/cache/project state, and
executes the extracted `bunx` command with only the package transport pointed
at the loopback registry. The package-configured installer branch must preserve
the exact config, install 41 commands, eight skills, and every bundle asset,
and leave no final `node_modules`, local plugin wrapper/directory, staged dist,
or local receipt.

The bunx acquisition and OpenCode resolver use separate cold HOME/cache/temp
roots. Exact `opencode2 v0.0.0-beta-17595` starts without a positive
`OPENCODE_CONFIG_CONTENT` plugin injection. Registry logs must show that bunx
and OpenCode independently requested both the exact product packument and
tarball. The harness locates the OpenCode-cached package only within its
admitted cache roots, hashes every cached product file against the packed
tarball inventory, and imports that exact cached entrypoint for separately
labelled setup instrumentation.

Supported V2 HTTP routes prove:

- three stable `/api/plugin` reads contain `iamsterling.opencode2-config`
  exactly once;
- `/api/agent` exposes eight expected agents/modes and search permissions;
- `/api/command` exposes all 41 plugin commands exactly once;
- `/api/skill` exposes all eight plugin skills at installed locations;
- `/api/config` is healthy and includes the exact package spec; and
- model-free session synthetic/shell activity produces session-bound capture
  events carrying plugin `0.1.0` and host `0.0.0-beta-17595`.

Beta-17595 has no supported HTTP tool-list route. **Installed-plugin setup
instrumentation** therefore imports the exact OpenCode-cached package and
records 20 unique tool registrations, schemas/executors, the three hook
registrations, one event subscription, the orchestrator default, and two safe
executor checks. This is setup instrumentation, not a host tool catalog or
proof that model-dispatch callbacks executed.

Two negative controls remain isolated. The installed-package profile applies
only the documented ID disable directive and requires the plugin, custom
agents, and captures to disappear. The cold-resolver profile uses fresh
HOME/config/cache/temp/project roots while the registry serves the product
packument but withholds its tarball. Registry logs must show the attempted exact
resolution; the plugin and custom agents must remain absent, and no product may
appear in any admitted cold cache. No shared cache or local fallback is
available to either control.

The emitted JSON is the structured proof: README config/argv, product hashes
and packed-file count, per-phase registry requests, cache confinement/file
hashes, command/skill/asset counts, plugin/agent/command/skill/event results,
tool instrumentation, both negative controls, and zero Git invocations.

## Separate local staged-release stress

Run:

```sh
bun run test:container:stress
```

This is a transaction/concurrency test for the source-checkout fallback. It is
not README package-resolution evidence. Host preparation stages the built
release surfaces and locked runtime dependency tree. Twelve installers target
one disposable `OPENCODE_CONFIG_DIR`: exactly one succeeds, while 11 exit `75`
with only:

```text
OPENCODE2_CONFIG_INSTALL_BUSY: retry the installation
```

Stress checks destination symlink confinement, coherent receipt/file hashes,
all assets, no staging/lock leaks, and unrelated/outside canaries. It runs only
on schedule or manual dispatch in CI; package smoke runs on pull requests and
pushes.

Preparation supports pinned Linux `x64` and `arm64` inputs. A preparation-only
run is not a runtime claim for the other architecture; runtime evidence exists
only when Docker executes the matching host binary. Windows, PowerShell,
Darwin, macOS sandbox behavior, and Darwin host binaries remain out of scope.

## Contract references

Expected IDs are in `validation-contract.mjs`; V2 host assertions are in
`functional-validation.mjs`; package-registry orchestration is in
`registry-validation.mjs`; archive and README parsing are in
`package-archive.mjs` and `readme-setup.mjs`; the allowlist registry is in
`registry-server.mjs`; Docker confinement is in `container-command.mjs`; and
host preparation is in `prepare-ephemeral-container-input.mjs` plus
`prepare-registry.mjs`.

OpenCode V2 behavior references are limited to the
[configuration guide](https://opencode.ai/v2/docs/config),
[plugin guide](https://opencode.ai/v2/docs/build/plugins), and
[API overview](https://opencode.ai/v2/docs/api). The pinned executable's local
`/openapi.json` remains the route/schema authority for development tests.
