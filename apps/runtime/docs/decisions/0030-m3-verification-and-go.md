# ADR 0030: M3 verification and GO

**Status:** Accepted 2026-08-18 for M3 GO only

## Decision

M3 is `GO` at the source snapshot below under runtime ADR 0029 and adapter ADR
0021. This closes only the first harness adapter. It grants no M4 jobs/events,
M5 provider or network inside the runtime, M6 crawl, M7 packaging/deployment,
publication, production cutover, or host-version change.

The reproducible sorted source-manifest SHA-256 is:

`3a5c3c809e0c5e9d7e121d479496dd6d004c0d37fcb6cd6cd16f07c583c2ea8e`

The manifest covers `bun.lock`; runtime package/native/query sources, fixture,
schema and tests; and the OpenCode package, search/plugin integration sources,
focused tests, and architecture/artifact checks. Documentation other than the
fixture schema/metadata is excluded to avoid a self-referential digest. The
exact path/hash rows are below. From the workspace root, this command reproduces
both the rows and final digest without relying on a generated repository file:

```sh
manifest="$(mktemp)"; trap 'rm -f "$manifest"' EXIT
while IFS= read -r file; do shasum -a 256 "$file"; done >"$manifest" <<'PATHS'
apps/opencode2-config/package.json
apps/opencode2-config/src/features/search/core.ts
apps/opencode2-config/src/features/search/index.ts
apps/opencode2-config/src/features/search/runtime-adapter.ts
apps/opencode2-config/src/features/search/searxng-adapter.ts
apps/opencode2-config/src/features/tools/index.ts
apps/opencode2-config/src/plugin/plugin.ts
apps/opencode2-config/tests/characterization/promise-tool-host-abi.test.mjs
apps/opencode2-config/tests/integration/plugin-setup.test.mjs
apps/opencode2-config/tests/real-host/serve-isolation.test.mjs
apps/opencode2-config/tests/security/search-adapter-security.test.mjs
apps/opencode2-config/tests/unit/plugin-entrypoint.test.mjs
apps/opencode2-config/tests/unit/web-search.test.mjs
apps/opencode2-config/tools/real-host-suite.mjs
apps/opencode2-config/tools/verify-architecture.mjs
apps/opencode2-config/tools/verify-artifact.mjs
apps/runtime/docs/schemas/d4-candidate-snapshot-manifest.schema.json
apps/runtime/fixtures/m2-synthetic/v1.0.0/CC0-1.0.txt
apps/runtime/fixtures/m2-synthetic/v1.0.0/README.md
apps/runtime/fixtures/m2-synthetic/v1.0.0/documents/aurora.txt
apps/runtime/fixtures/m2-synthetic/v1.0.0/documents/harbor.txt
apps/runtime/fixtures/m2-synthetic/v1.0.0/manifest.json
apps/runtime/native/Cargo.lock
apps/runtime/native/Cargo.toml
apps/runtime/native/src/corpus.rs
apps/runtime/native/src/lib.rs
apps/runtime/package.json
apps/runtime/src/index.ts
apps/runtime/src/query.d.ts
apps/runtime/src/query.ts
apps/runtime/tests/boundaries.test.ts
apps/runtime/tests/corpus.test.ts
apps/runtime/tests/query-boundary.test.ts
apps/runtime/tests/runtime.test.ts
apps/runtime/tsconfig.json
bun.lock
PATHS
cat "$manifest"
shasum -a 256 "$manifest" | awk '{print $1}'
```

Manifest rows:

```text
d844318a8df2ee0f3e936fe688f358f2565d47bc9fae7d248e37b735532cf395  apps/opencode2-config/package.json
2ac6545a0502c4242125db276c0f892b9fe9af20ce70f4c8219495230c241594  apps/opencode2-config/src/features/search/core.ts
170ab5bce4a51b76ff8aa23a4913ff7f54af135d66829c26a627c8372919503e  apps/opencode2-config/src/features/search/index.ts
170e64c864396b6fec3b46aba69e054fe2dc14fc9cd1d2bc323d008e656fc780  apps/opencode2-config/src/features/search/runtime-adapter.ts
d65a9020b28ab101eba42f0a565520be5637b5cca22900675c04edafe9d47325  apps/opencode2-config/src/features/search/searxng-adapter.ts
1df74ef171f925cb6b52bee8bca608bccf916151162133a7622343566f662a4d  apps/opencode2-config/src/features/tools/index.ts
e1349089fd24623accdfc3def40e3fa6ff11eb2a30b14d450fc8d81bf03d43fb  apps/opencode2-config/src/plugin/plugin.ts
48f8caf3d6dcf49c193118fe95d1e35ce0ccefd79b6a77b2fc7a283a81933f04  apps/opencode2-config/tests/characterization/promise-tool-host-abi.test.mjs
235e0932cefea3108c0a90a16b99897dd8b452086471cee77a4a1667c7408866  apps/opencode2-config/tests/integration/plugin-setup.test.mjs
bb12806df67d5cf2946a1ad0f1eb4e1ff8f265c8668c01ccecbf3c674e5dd7f5  apps/opencode2-config/tests/real-host/serve-isolation.test.mjs
00a3e8ae4125dce2210a421e40e00ce08a9c20010d8fa54661b37931f5f77e58  apps/opencode2-config/tests/security/search-adapter-security.test.mjs
484649da7f999e28b6d0178e3171b01017d2e91355db2e2631cbf0947a02a5c9  apps/opencode2-config/tests/unit/plugin-entrypoint.test.mjs
0a37bbae8109d98cc0a4c3a31484a4bd4c951addb2581c80a211b4e68755d411  apps/opencode2-config/tests/unit/web-search.test.mjs
a06913a81cf8dc00282ef9dc8a700dd61c5d66a982ae78c74d222b01a52247a7  apps/opencode2-config/tools/real-host-suite.mjs
8493f496cf09eae9452e7e33967d8430d24b0cbdb24bc4fa7f1638c07770b11c  apps/opencode2-config/tools/verify-architecture.mjs
d6f4e9259143f2a2388ca55796d106c66d06d60592057e9ebb91be7fafa7f7bc  apps/opencode2-config/tools/verify-artifact.mjs
a4a40a49b04602827b838eb59f4c835f3f88121b4eac1b4a0e4affd5f73dac9b  apps/runtime/docs/schemas/d4-candidate-snapshot-manifest.schema.json
8ab0a72cb0b11b9fc7ec8590158b9513ece6842f5b818c62cee25d7deefd3048  apps/runtime/fixtures/m2-synthetic/v1.0.0/CC0-1.0.txt
22cac085a88464bbc8324818ecb2663b2ad02d65327894f4148d21a61107fd85  apps/runtime/fixtures/m2-synthetic/v1.0.0/README.md
27f8fb8019ed8359633a9c043af440120833fc6036dc4dfd4480d88672d595e6  apps/runtime/fixtures/m2-synthetic/v1.0.0/documents/aurora.txt
d71c3fed2369e6b8c63892f559f54d6c053123de01b8ebb437a97836514c622f  apps/runtime/fixtures/m2-synthetic/v1.0.0/documents/harbor.txt
78579c26058b557bda39f987d2fa1988d82c06d48f965260a3161b1a46767880  apps/runtime/fixtures/m2-synthetic/v1.0.0/manifest.json
e9dce7d65b823f5da6a7dcebd7d3159ccd09cb996c21f3bb9ef78f3493dc8327  apps/runtime/native/Cargo.lock
d19340a124e8569f07d006256934dd1e314c89fbd689fe09ef145f2cf4291e3b  apps/runtime/native/Cargo.toml
65f30836381d5c6a42b95868545a41275dd21025af95e6226dbc58553c9e5d4c  apps/runtime/native/src/corpus.rs
7dcf2755dbebefa9648b73d54b01d0cf6ef13ae6413862e566a1192b38545ef0  apps/runtime/native/src/lib.rs
28355454766cb5edfd0d8786195f5ef50a89de04648634cf60425401c4b8fca2  apps/runtime/package.json
1041c5646440f00cdb34e9a0c9b111bce3f6941c8a14bf804fa6c53d519d2dc8  apps/runtime/src/index.ts
a614b2cc7463ae4a4b92296f178498cb013eb5d4504dc1170970029ddc5a2b87  apps/runtime/src/query.d.ts
f610ffd47f69ec751d9cf73fa0d33879e027dea64ed4fc56378938ce72418808  apps/runtime/src/query.ts
e58e148eb7a5e2cf59497cd24c8b5878b01b268003290d13779fd52fc31d1fc8  apps/runtime/tests/boundaries.test.ts
0f4d7c54f94df00f2577891dab0d6b0bcd4e7b215def1f7b5528bfd8051f1e31  apps/runtime/tests/corpus.test.ts
3a2f009d7e2da9b9c61629d695f21124c002d19576f44c020f6ddb558607c510  apps/runtime/tests/query-boundary.test.ts
d0badb0dad2d43d6e9dd4ff0efe7c8da91e3642e5f566a98f9de36cb0c0005fc  apps/runtime/tests/runtime.test.ts
df152a39fd47a0d66c09245c3b441d5e4b54eff4f80d42ae0b9a3fb136cc2f63  apps/runtime/tsconfig.json
d77073684778ffb6f8eed2ef6b226cafea0b303d2c8d8d4fa7fb2e26d8829041  bun.lock
```

## Evidence

- `bun run --cwd apps/runtime verify` exited 0: 10 Rust tests and 34 Bun tests in
  four files (196 expectations), plus formatting, Clippy, locked build, and
  TypeScript checks.
- Darwin `sandbox-exec -p '(version 1)(allow default)(deny network*)' bun test
  tests/*.test.ts` exited 0 with the same 34/196 runtime count.
- `bun run --cwd apps/opencode2-config verify` exited 0: ABI/type/lint/format/build;
  116 unit, 22 integration, 14 characterization, 19 security, and 9 release
  tests; installer, artifact/provenance/resource/secret checks; and the isolated
  pinned real-host suite. The host invoked the exported Effect lifecycle and
  observed one setup/cleanup, both exact search
  names, zero successful external egress, and no surviving process.
- Root `bun run lint`, `bun run check-types`, and `bun run build` exited 0.
  `git diff --check` produced no output and exited 0.

Focused evidence covers wrong principal/workspace/operation/capability through
native, TypeScript, query-package, and adapter mappings; exact
reserved source URLs; query-only package loading; no admin surface; alias execute
identity; researcher allow/deny; unchanged default SearXNG; explicit no-network
runtime selection; no fallback; redacted config/open/diagnostic mapping;
distinct principal-rejection and native-capability-denial adapter outcomes;
interruption through the registered Effect executor; registration disposal before
idempotent runtime close; and controlled plugin inventory/local
duplicate/schema-description attestation. The focused plugin network-denied run
passed 18 tests; the runtime network-denied run passed 34 tests (196
expectations).

## Residual limitations and rollback

The pinned custom-tool context has no call-scoped `AbortSignal`. Effect can
prevent not-started work and suppress publication to an interrupted caller, but
cannot preempt synchronous FFI already executing; the native call is internally
deadline-bounded to 15 seconds. The pinned host accepts same-name registration
without exposing winner provenance, so uniqueness is deployment-controlled and
attested, not globally host-enforced. The real-host suite activates the default
backend; runtime execution is covered by deterministic Effect/package tests, not
a credentialed model turn. No multi-platform or production guarantee is made.

Rollback removes the explicit runtime backend key (restoring the default
SearXNG adapter) and unloads/restarts the plugin. Tool registration disposes before the
idempotent runtime close; corpus state is not mutated or removed.
