# Exact source and retrieval ledger

The original aggregate receipt describes credential-empty GET-only HTTPS into
disposable scratch on 2026-08-24. Exact retrieval commands, per-request exits,
and complete network observation were not retained. Artifact bytes were
discarded after evidence extraction. Response/archive hashes below preserve the
reported observations; URLs with commit IDs are immutable identifiers, while
registry metadata responses are supporting observations rather than the sole
identity.

## Observed Effect/build candidate sources

| Purpose                          | Exact URL                                                                                                                                                                                             | Retained observation                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Effect version metadata          | `https://registry.npmjs.org/effect/4.0.0-beta.107`                                                                                                                                                    | response SHA-256 `fd3bde57…e069`; artifact integrity and attestation URL  |
| Effect artifact                  | `https://registry.npmjs.org/effect/-/effect-4.0.0-beta.107.tgz`                                                                                                                                       | SHA-256 `e3b3664b…dd4d`; SHA-512 `3a8040bf…a2439d`                        |
| Effect attestations              | `https://registry.npmjs.org/-/npm/v1/attestations/effect@4.0.0-beta.107`                                                                                                                              | SLSA source commit `3c495ae7…895e`, workflow run `31356640717/1`          |
| Effect source                    | `https://codeload.github.com/Effect-TS/effect/tar.gz/3c495ae7c96d43bfc3b8020250562a194c2c895e`                                                                                                        | archive SHA-256 `70a73fbe…fe92`                                           |
| Effect license                   | `https://raw.githubusercontent.com/Effect-TS/effect/3c495ae7c96d43bfc3b8020250562a194c2c895e/LICENSE`                                                                                                 | SHA-256 `774c3bc5…df30`                                                   |
| TypeScript metadata              | `https://registry.npmjs.org/typescript/5.9.2`                                                                                                                                                         | response SHA-256 `5730be39…2e5`; git head `5be33469…ee9`                  |
| TypeScript artifact              | `https://registry.npmjs.org/typescript/-/typescript-5.9.2.tgz`                                                                                                                                        | SHA-256 `67a3bc82…2062`                                                   |
| TypeScript source                | `https://codeload.github.com/microsoft/TypeScript/tar.gz/5be33469d551655d878876faa9e30aa3b49f8ee9`                                                                                                    | SHA-256 `161b4a90…7c`                                                     |
| Turbo metadata/artifact          | `https://registry.npmjs.org/turbo/2.10.10`; `https://registry.npmjs.org/turbo/-/turbo-2.10.10.tgz`                                                                                                    | metadata SHA-256 `e5bd4b49…405`; tar SHA-256 `ec38dbac…c023`              |
| Turbo platform metadata/artifact | `https://registry.npmjs.org/@turbo%2fdarwin-arm64/2.10.10`; `https://registry.npmjs.org/@turbo/darwin-arm64/-/darwin-arm64-2.10.10.tgz`                                                               | metadata SHA-256 `c14c2f2a…405`; tar SHA-256 `8c2f28a7…f5b1`              |
| Turbo attestations               | `https://registry.npmjs.org/-/npm/v1/attestations/turbo@2.10.10`; `https://registry.npmjs.org/-/npm/v1/attestations/@turbo%2fdarwin-arm64@2.10.10`                                                    | source `ea08facf…2164`, workflow run `31803665773/1`                      |
| Turbo source/license             | `https://codeload.github.com/vercel/turborepo/tar.gz/ea08facfcc9185adc1096a994408bfc9114b2164`; `https://raw.githubusercontent.com/vercel/turborepo/ea08facfcc9185adc1096a994408bfc9114b2164/LICENSE` | archive `6fcb7458…f30`; license `f7ac4712…05e`                            |
| Bun source commit                | `https://api.github.com/repos/oven-sh/bun/commits/0d9b296af`                                                                                                                                          | resolved `0d9b296af33f2b851fcbf4df3e9ec89751734ba4`                       |
| Bun source/artifact              | `https://codeload.github.com/oven-sh/bun/tar.gz/0d9b296af33f2b851fcbf4df3e9ec89751734ba4`; `https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-darwin-aarch64.zip`                      | source `aa045c1f…d3e5`; zip `d8b96221…2620`; extracted/local binary match |
| Bun license                      | `https://raw.githubusercontent.com/oven-sh/bun/0d9b296af33f2b851fcbf4df3e9ec89751734ba4/LICENSE.md`                                                                                                   | `2c6160ec…3741`                                                           |
| Node release/checksum            | `https://nodejs.org/download/release/v24.18.0/node-v24.18.0-darwin-arm64.tar.gz`; `https://nodejs.org/download/release/v24.18.0/SHASUMS256.txt`                                                       | archive/checksum `e1a97e14…9ed1`; local binary matches                    |

## Rust/SQLite/Git inventory sources

- Rust channel: `https://static.rust-lang.org/dist/channel-rust-1.97.1.toml`
  and `.sha256`; both establish manifest SHA-256 `03569b18…29cf`.
- Rust source/license: exact commit
  `8bab26f4f68e0e26f0bb7960be334d5b520ea452` under
  `https://github.com/rust-lang/rust`; Cargo exact commit
  `c980f4866141969fab6254a680546a277789d6f0` under
  `https://github.com/rust-lang/cargo`.
- SQLite/Rust crates: existing exact `Cargo.toml`, `Cargo.lock`, local
  registry-verified source directories, checksums, feature tree, and license
  files only. No crate retrieval or mutation was performed.
- Apple Git candidate source attempts:
  `https://api.github.com/repos/apple-oss-distributions/Git/git/ref/tags/Git-157`
  and the lowercase `git-157` equivalent both returned HTTP 404. This negative
  result is retained; no mutable branch or substitute source was used.

## Negative retrieval results

- Kubernetes-types exact source commit `a46eb946…d7d0` was retrievable, but its
  package and source archive contained no license text despite exact package
  metadata declaring `Apache-2.0`. It is outside the selected runtime import
  closure and remains unenabled.
- No AI SDK/core/adapter, provider, latest-version selector, mutable branch,
  unselected Git backend, or registry search is recorded as retrieved. This
  aggregate ledger is not packet/endpoint evidence and cannot prove network-zero.
