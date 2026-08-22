# Ephemeral-container setup validation

This harness is the normal repository setup test. It does not authorize installation cutover, publication, deployment, or remote mutation.

## Boundary and input preparation

The checked-out workspace is the only repository input. The launcher runs the normal plugin build on the host, then copies only the release package surfaces (`dist`, `assets`, installer, package metadata, README, and license) and the three-file validation harness into one temporary prepared tree. Source files, tests, workspace locks, repository metadata, and all other checkout surfaces are excluded. Every prepared file and symlink is hash-inventoried with its size, file mode or link target; links must resolve within the prepared root. The launcher verifies that complete inventory immediately before invoking Docker, and validation verifies it again as its first container action.

The host also provisions two Linux-only test prerequisites from the reviewed `tools/ephemeral-container/test-environment/package.json` and `bun.lock`: the plugin runtime dependencies and the `opencode2 0.0.0-beta-17595` executable. Provisioning uses `bun install --frozen-lockfile --production --ignore-scripts` for the selected Linux architecture and fails if the lock would change. The manifest, lock, installed dependency graph, copied executable, and lock provenance are all part of the prepared-tree inventory. Bun may satisfy the locked packages from its host cache or package registry. The test container runs no package installation, compilation, bundling, source build, or other development command.

Every test container is started with `--network none`, a read-only root filesystem, dropped capabilities, no-new-privileges, and exactly one read-only bind mount: the host-prepared tree at `/input`. The inventoried harness runs from `/input/validation-harness`; no checkout path or second host bind enters the container. The only interface retained by Docker is container-local loopback, which the activation check needs; there is no external route or interface. The validation program checks this namespace before setup.

The launcher names the base image by the Bun 1.3.14 digest already pinned in the repository. If that image is not present, the host Docker daemon may acquire that exact image before process startup; this daemon-side image operation is separate from the network-disabled container. The harness neither builds an image nor creates a named volume. `--rm` removes the stopped container, and the host removes its temporary prepared input in `finally` cleanup.

## Smoke and stress

Run the normal smoke test from the checked-out workspace:

```sh
bun run test:container:smoke
```

Smoke creates isolated HOME, XDG config/data/cache, OpenCode config, temporary, and project roots. Before normal installation it points a managed skills directory at a distinct outside-root canary and proves installation fails with `OPENCODE2_CONFIG_DESTINATION_UNSAFE` without changing any outside file. It then performs clean setup from the prepared release, serially reinstalls, checks the complete prepared release inventory, every installed release receipt/hash, and every manifested asset, and preserves unrelated/config and outside-root canaries. Finally it starts exact `opencode2 v0.0.0-beta-17595`; the V2 `/api/plugin` inventory must contain exactly one `iamsterling.opencode2-config`, and shutdown must leave no process-group survivors.

Run contention coverage with:

```sh
bun run test:container:stress
```

Stress launches 12 installers against one `OPENCODE_CONFIG_DIR`. Exactly one succeeds. All 11 losers exit `75`, write no stdout, and emit exactly:

```text
OPENCODE2_CONFIG_INSTALL_BUSY: retry the installation
```

Stress also checks coherent receipt/file hashes, all assets, no staging or lock leaks, unrelated files, and the outside-root canary. It runs on schedule or manual dispatch in CI; smoke is the ordinary pull-request and push test.

This validates Linux Docker environments on `x64` and `arm64`. It does not validate Windows, PowerShell execution, Darwin, macOS sandbox behavior, or Darwin host binaries. A stale installer lock in an operator config root must be removed only after confirming no installer process is active.
