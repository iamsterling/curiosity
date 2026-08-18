# ADR 0028: M2 verification and GO

**Status:** Accepted 2026-08-18 for M2 GO only

## Decision

M2 is `GO` at the source snapshot below. This closes only M2. It grants no
adapter, job/event, provider/network, crawler/corpus, packaging, publication,
deployment, production, or M3–M7 implementation authority.

The reproducible sorted source-manifest SHA-256 is:

`27a314a1627c6bd2d4491878b1e9f0d1785d4e7069282f922f9dfec2f3aae68b`

From the repository root, reproduce it on macOS with:

```sh
files=(bun.lock apps/runtime/package.json apps/runtime/tsconfig.json \
  apps/runtime/native/Cargo.lock apps/runtime/native/Cargo.toml \
  apps/runtime/native/src/lib.rs apps/runtime/native/src/corpus.rs \
  apps/runtime/src/index.ts apps/runtime/tests/boundaries.test.ts \
  apps/runtime/tests/runtime.test.ts apps/runtime/tests/corpus.test.ts \
  apps/runtime/docs/schemas/d4-candidate-snapshot-manifest.schema.json \
  apps/runtime/fixtures/m2-synthetic/v1.0.0/manifest.json \
  apps/runtime/fixtures/m2-synthetic/v1.0.0/CC0-1.0.txt \
  apps/runtime/fixtures/m2-synthetic/v1.0.0/README.md \
  apps/runtime/fixtures/m2-synthetic/v1.0.0/documents/aurora.txt \
  apps/runtime/fixtures/m2-synthetic/v1.0.0/documents/harbor.txt)
printf '%s\n' "${files[@]}" | LC_ALL=C sort |
  while IFS= read -r file; do
    hash=$(/usr/bin/shasum -a 256 "$file" | /usr/bin/awk '{print $1}')
    printf '%s  %s\n' "$hash" "$file"
  done | /usr/bin/shasum -a 256
```

Documentation other than the schema and fixture metadata is excluded to avoid a
self-referential digest. Ignored build products and runtime state are excluded.

## Evidence and limitations

- `bun run --cwd apps/runtime verify` exited 0: 9 Rust tests, 31 Bun tests in
  three files, 164 expectations, formatting, Clippy, locked build/test, and
  TypeScript checks passed.
- Root `bun run lint`, `bun run check-types`, and `bun run build` exited 0;
  `git diff --check` produced no output and exited 0.
- Darwin `sandbox-exec -p '(version 1)(allow default)(deny network*)' bun test
  tests/*.test.ts` exited 0 with the same 31/164 counts. This denies socket
  network during Bun tests; it is not evidence for every build subprocess or
  another OS.
- Exact accepted manifest bytes and document digests, security-relevant manifest
  mutations, M1 compatibility, operator-provisioned query/admin separation,
  native admin-secret enforcement, commit/ref and tombstone/removal ordering,
  deterministic/zero/partial retrieval, corruption, intermediate and leaf
  symlinks (including object digest prefixes), projection rebuild,
  withdrawal/delete, and tombstone non-resurrection are covered. Backup/restore
  is not supported, so no backup claim is made. Crash-boundary evidence is
  deterministic incomplete-state simulation plus invisible staged-file
  recovery; stale `writer.lock` tests exercise every admin mutation and confirm
  read-only query behavior. These are not process-kill or power-loss tests.
- Rust stdlib component checks and canonicalization cannot close a same-process
  TOCTOU race without descriptor-relative no-follow operations. Arbitrary code
  able to inspect memory or directly manipulate/dlopen the native library is
  outside the in-process capability threat boundary.
- No latency, RSS, clean-checkout, multi-platform, production, release, or
  deployment guarantee is claimed. The working tree already contained
  uncommitted M1/documentation work, so this GO binds the digest rather than a
  commit.
