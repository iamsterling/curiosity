# Registry-ready package release manifest

ADR 0031 authorizes creation and local black-box validation of the unmodified
`@iamsterling/opencode2-config@0.1.0` package tarball. Normal package tooling
defines the artifact from `package.json#files`; validation records its SHA-256,
packed file inventory, exact metadata, dependency graph, README setup block,
41-command/eight-skill asset inventory, and the pinned OpenCode
`0.0.0-beta-17595` compatibility target.

The container smoke serves that tarball and exact lock-resolved dependency
tarballs from an allowlist-only loopback registry under `--network none`.
Registry request logs, cold-cache confinement, extracted-file hashes, host
catalogs/events, negative controls, and zero Git invocation are verification
evidence. The tarball is never rewritten by the harness.

This manifest is **registry-ready, not published**. It defines no registry
token, publish command, release tag, hosted artifact, deployment, or
installation cutover. Each remains separately authorized work.
