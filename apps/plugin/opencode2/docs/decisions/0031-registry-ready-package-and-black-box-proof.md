# ADR 0031: Registry-ready package and black-box proof

Status: Accepted

Supersedes: ADR 0002

## Decision

`@iamsterling/opencode2-config` is a registry-ready scoped package with exact
version `0.1.0`, public-access package metadata, complete exports/bin/files, and
only independently resolvable production dependencies. The private,
unpublished `@curiosity/runtime` workspace remains an optional operator
integration loaded at runtime; it is not a normal, peer, or optional package
dependency and receives no publication authority.

The README owns one exact OpenCode V2 setup contract: configure
`@iamsterling/opencode2-config@0.1.0`, invoke that version's packaged installer,
then verify activation. Tags and ranges are not part of the supported setup.

Package validation builds and packs the unmodified product through normal Bun
tooling. The ordinary container smoke receives only the inventoried product
tarball, exact lock-resolved dependency tarballs, pinned host/test inputs, and
the validation harness. Under Docker `--network none`, a loopback-only,
allowlist registry serves those artifacts without proxy or fallback. Separate
cold bunx and OpenCode caches must independently request the product. A fresh
resolver with the product artifact withheld and an installed-package disable
profile are mandatory negative controls. A failing Git shim and strict
prepared-input inventory enforce the source/VCS/credential boundary.

The local staged-release installer remains a separate stress and transaction
test. It is not evidence that the README package workflow works.

## Consequences

Registry readiness and local registry simulation do not publish any artifact.
No token, publication workflow, tag, release, deployment, or installation
cutover is authorized. Actual publication requires a separately reviewed
decision and operator approval. CI may pack and test the artifact on pull
requests and pushes; scheduled/manual CI may run the staged-release stress.
