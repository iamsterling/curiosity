# Exact build/test stack evidence record

**Corrected verdict:** **INSUFFICIENT / NOT REPRODUCIBLE** as a bounded
candidate and **NOT ACCEPTED FOR I1**. This supersedes the original QUALIFIED
verdict.  
**Disposition:** **DEFERRED as observations only**; no install, manifest, lock,
or product change occurred.  
**Confidence:** Medium for aggregated source/artifact identity observations;
low for focused-execution reproducibility.

## Selected tuple

| Component                            | Source identity                                                         | Artifact/lock identity                                                                                                                                                                                | License                                           |
| ------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Bun runtime and built-in test runner | `1.3.14`, commit `0d9b296af33f2b851fcbf4df3e9ec89751734ba4`             | official Darwin arm64 zip SHA-256 `d8b96221828ad6f97ac7ac0ab7e95872341af763001e8803e8267652c2652620`; local/release binary SHA-256 `e0c90ec15d33363e6b70713d56bc3b2c7585c17f40a0fe0f8fd9305901d4e233` | MIT plus bundled notices in retained `LICENSE.md` |
| TypeScript                           | `5.9.2`, registry git head `5be33469d551655d878876faa9e30aa3b49f8ee9`   | tarball SHA-256 `67a3bc82e822b8f45f653a80fc3a9730d23214d36c83ba85dd7f5abebee82062`; lock SHA-512 `0960735d…0dd1f4`; installed/tar manifest `c2e4c4d…5e0ea`                                            | Apache-2.0; ThirdPartyNotice retained             |
| Turbo wrapper                        | `2.10.10`, SLSA source `ea08facfcc9185adc1096a994408bfc9114b2164`       | tarball SHA-256 `ec38dbacb9fcc5e19081169c31889f5971abd15043003b8a53f2c8e81218c023`; lock SHA-512 `ffdd0a4d…03964c`                                                                                    | MIT                                               |
| Turbo platform binary                | same source, Darwin arm64                                               | tarball SHA-256 `8c2f28a74e6061dc99515c027a0c6ed404b3c0401b69475d642a6c5b3cf7f5b1`; lock SHA-512 `55962cc5…204283`; binary SHA-256 `415bad4b27666b6ba13f37e563b4f6b02add80775588637c6bc6d0f5a161d7ce` | MIT                                               |
| Node when invoked                    | `24.18.0`, signed tag commit `20da4aeadabc5b0a01e3fcf520f91df8285c68a2` | official archive/checksum SHA-256 `e1a97e14c99c803e96c7339403282ea05a499c32f8d83defe9ef5ec66f979ed1`; local/release binary `ee6fb0e015284d83a91e8ec5213f43a157f8a392b58555301682892ba928c04a`         | Node license retained                             |

Platform: macOS `27.0`, build `26A5368g`, Darwin arm64. Bun is Developer
ID-signed by team `7FRXF46ZSN`; Turbo by `JW6Y669B67`; Node by
`HX7739G8FX`. Signatures were inspected but are not a release/notarization
claim.

## Recorded compiler/test profile

- Built-in runner: Bun `bun:test`, observed as `bun test v1.3.14
(0d9b296a)`.
- TypeScript: `strict: true`, `target: ES2023`, `module: ESNext`,
  `moduleResolution: Bundler`, `lib: [ESNext, DOM]`, and
  `skipLibCheck: true` for the upstream Effect beta declarations.
- Turbo: `2.10.10`; telemetry and update notification disabled with
  `TURBO_TELEMETRY_DISABLED=1`, `TURBO_NO_UPDATE_NOTIFIER=1`,
  `NO_UPDATE_NOTIFIER=1`, and `CI=1`.
- Bun execution: `--no-install --no-env-file`; scratch HOME has
  `telemetry = false` and `install.auto = "disable"`.
- The intended environment was credential-empty with explicit HOME/TMPDIR/PATH
  and the controls above. Focused receipts do not retain its exact expansion.
  Provider/non-loopback activity was unauthorized, but these receipts do not
  prove network-zero.

Node `24.18.0` is not the selected test runner, but it is an exact ancillary
identity because root scripts and the Turbo/TypeScript wrappers can invoke it.
Every retained root check records this same Node identity.

## Observations and exclusions

Historical output reports 15 tests/35 expectations passing. The TypeScript log
contains only an elided command and no explicit exit. The initial comment-based
import scanner failure and third-party declaration failure are retained. Exact
focused commands, environment, timestamps, and exits are incomplete, and the
Effect probe uses internal `dist` imports. No focused execution, dependency
install, source rebuild, cache portability, cross-platform support, Windows
support, auto-update, publication, or reproducible-build qualification is made.

Any future qualification would be invalidated by a changed version, source
commit, artifact/integrity/binary digest, platform, compiler option, runner,
notification/telemetry control, or Node identity when Node is used.

## Canonical-root stop

The retained root logs report format, local-link, inventory, status, and
check-types exits of zero. Check-types also created or modified 18 ignored files
outside Q1, so the original persistent boundary was not preserved. Root lint
failed in `@curiosity/runtime` because a Cargo invocation inside Turbo
could not select a Rustup toolchain, although the outer evidence wrapper had
identified Rust/Cargo `1.97.1`. The credential-empty environment used scratch
HOME/Cargo state; Turbo's pass-through list does not include
`RUSTUP_TOOLCHAIN`. This is the leading explanation, not a repaired result.

Per the explicit stop rule, Q1 did not alter the environment and retry, and did
not run later root test/build/verify commands. The exact 18-file escape has been
deleted under remediation, but neither cleanup nor this record makes Q1 exit
pass.
