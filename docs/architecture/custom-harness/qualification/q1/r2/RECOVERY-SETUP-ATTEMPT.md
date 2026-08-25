# Q1-R2 controller setup recovery

Before the evidence directory or scratch tree was created, the first controller
load stopped with exit 1 because root-relative CommonJS resolution could not
find the already-installed optional Turbo platform package. No qualification,
retrieval, test, generated-output move, root check, parser, product, or I1
command was spawned. The exact launcher argv and credential-empty environment
remain visible in the parent execution transcript; stderr reported
`MODULE_NOT_FOUND` for `@turbo/darwin-arm64/bin/turbo` under Node `v24.18.0`.

Recovery changes only the setup resolver base from the repository manifest to
the installed `turbo` package manifest, which is the ordinary dependency
resolution base used by the wrapper. The candidate version, artifact, binary,
environment, command sequence, evidence assertions, and acceptance checks are
unchanged. Scratch and `r2/evidence/` were confirmed absent before recovery.
