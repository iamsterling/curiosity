# Ephemeral-container setup validation

This harness validates a release candidate; it does not authorize installation cutover, publication, deployment, or remote mutation. The authoritative source is an exact ref from the approved private Git repository. The local working-tree mode is explicitly non-authoritative.

## Prerequisites and inputs

- Docker with Linux containers and network access during image build and acquisition.
- A private HTTPS Git URL plus a token **file**, or a private SSH Git URL plus an SSH agent socket and pinned `known_hosts` file.
- An exact branch, tag, or preferably immutable commit in `OPENCODE2_GIT_REF`.
- `OPENCODE2_PLUGIN_PATH` only when the plugin is not at `apps/plugin/opencode2`.

Credentials are bind-mounted only into the short-lived Git acquisition container. After Git checkout, that container removes `.git` and its temporary askpass helper and exits. Dependency installation and build then run in a second container with no token or known-hosts mount, SSH-agent socket, Git URL/ref environment, askpass setting, or inherited candidate-script environment; `prepare.mjs` also fails closed if a credential path or environment variable is present. Candidate lifecycle/build scripts receive a small allowlist containing only Bun cache, home, locale, and executable-path values. The launcher never passes credentials as container command arguments, secret environment values, build arguments, image layers, preparation/validation-container mounts, or retained volumes. Git URLs containing userinfo, query, or fragment components are rejected before Docker with `OPENCODE2_CREDENTIAL_IN_URL_FORBIDDEN`, and the rejected URL is never printed. Git command output is suppressed so authentication failures cannot replay credential material. CI briefly materializes its masked secret as a mode-0600 runner file, removes it in an `always()` step, and does not echo it. The launcher removes its named volume and image in `finally` cleanup.

### HTTPS (authoritative)

Create a mode-0600 token file outside the repository using the operator or CI secret store, then run:

```sh
export OPENCODE2_GIT_URL=https://github.example/owner/private-repository.git
export OPENCODE2_GIT_REF=<reviewed-ref>
export OPENCODE2_GIT_TOKEN_FILE=/secure/runtime/opencode2-git-token
bun run test:container:smoke
```

### SSH agent (authoritative)

```sh
export OPENCODE2_GIT_URL=git@github.example:owner/private-repository.git
export OPENCODE2_GIT_REF=<reviewed-ref>
export OPENCODE2_GIT_KNOWN_HOSTS_FILE=/secure/runtime/known_hosts
# SSH_AUTH_SOCK must name the existing agent socket.
bun run test:container:smoke
```

Missing URL, ref, credential file, agent, or pinned host keys fails closed. Git acquisition and the credential-free dependency/build preparation each have networking in separate containers; validation starts afterward in a third `docker run --network none` container. Never report the local fixture as a private-Git result.

## Smoke and stress

`bun run test:container:smoke` creates isolated HOME, XDG config/data/cache, OpenCode config, temporary, and project roots. Before the normal install it points a managed skills directory at a distinct outside-root canary directory and proves installation fails with `OPENCODE2_CONFIG_DESTINATION_UNSAFE` without adding or changing any outside file. It then installs and serially reinstalls, checks every release receipt hash and manifested asset, preserves unrelated/config and outside-root canaries, exposes only the already-acquired local-plugin dependencies required by the [V2 plugin contract](https://opencode.ai/v2/docs/build/plugins), and starts exact `opencode2 v0.0.0-beta-17595`. The V2 `/api/plugin` inventory must contain exactly one `iamsterling.opencode2-config`; shutdown must leave no process-group survivors.

`bun run test:container:stress` launches 12 installers against one `OPENCODE_CONFIG_DIR`. Exactly one must succeed. All 11 losers must exit `75`, write no stdout, and emit exactly:

```text
OPENCODE2_CONFIG_INSTALL_BUSY: retry the installation
```

Stress also checks coherent receipt/file hashes, all assets, no staging or lock leaks, unrelated files, and the outside-root canary. It is scheduled/manual initially, not a pull-request gate.

For mechanical harness checks without private credentials:

```sh
bun run test:container:smoke:local
bun run test:container:stress:local
```

These commands print `NON-AUTHORITATIVE` and use the current working tree. On abrupt host termination, inspect and remove leftover `opencode2-validation-*` Docker volumes/images. Build cache contains only the generic harness image; `docker builder prune` is optional operator cleanup. A stale installer lock inside a real config root must be removed only after confirming no installer process is active.

## CI and platform limit

The repository-root workflow runs local smoke on pull requests/pushes and runs authoritative smoke only for non-fork contexts when the configured private URL, ref, and token are all available. Local and credential-available private stress run only on schedule or manual dispatch. Forks receive no private secret.

This validates Linux containers on Docker-supported `x64`/`arm64`. It does not validate Windows, PowerShell execution, Darwin, macOS sandbox behavior, or Darwin host binaries.
