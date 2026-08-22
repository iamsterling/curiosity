# Installation architecture

No installation cutover is part of this repository. The installer operates only on an explicitly selected disposable or operator-provided `OPENCODE_CONFIG_DIR`; release installation is manifest-verified and transactional.

The installer serializes its complete setup mutation with `.opencode2-config.install.lock`. One concurrent writer succeeds; overlapping losers exit `75` with `OPENCODE2_CONFIG_INSTALL_BUSY: retry the installation`. Before mutation it binds the canonical config-root identity, rejects symlinks in every managed plugin, command, agent, skill, and bundle destination, and revalidates parent identity and containment before later writes. A rejected destination emits only `OPENCODE2_CONFIG_DESTINATION_UNSAFE`; it never prints the unsafe path or follows it outside the config root. An interrupted process can leave the fail-closed lock behind; remove it only after confirming no installer is active. Artifact integrity, duplicate-load prevention, staged rollback, unrelated-file preservation, destination confinement, and Linux ephemeral-container validation are covered by focused tests. Old-state import remains unimplemented:

- native state is only `.opencode/opencode2-config/`;
- old state is read by neither runtime nor bootstrap tooling;
- validation never targets global OpenCode configuration; operator cutover remains separately authorized.

See [ephemeral-container-validation.md](ephemeral-container-validation.md) for the host-prepared, network-disabled smoke and stress procedures.
