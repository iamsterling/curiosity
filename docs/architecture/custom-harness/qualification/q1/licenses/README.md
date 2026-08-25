# Q1 license and notice ledger

This ledger lists the retained files represented as identified license/notice
texts. No third-party source, schema, test, protocol, or format implementation is
recorded as copied into Q1 probes or records. Q1-T04 lacks exact command and scan
metadata, so this inventory is not a qualified completeness result.

| Candidate/material                            | Expression                                                | Retained files / origin                                                                                                                                          |
| --------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Effect `4.0.0-beta.107`                       | MIT                                                       | `effect-4.0.0-beta.107-MIT.txt`; aggregate receipt reports source/package-byte match                                                                             |
| Selected Effect declared install dependencies | MIT or Apache-2.0 as named in exact package metadata      | `effect-dep-*`; Kubernetes-types declares Apache-2.0 but supplies no text, so no text was fabricated or copied and it remains outside the selected runtime graph |
| TypeScript `5.9.2`                            | Apache-2.0 plus notices                                   | `typescript-5.9.2-Apache-2.0.txt`, `typescript-5.9.2-ThirdPartyNoticeText.txt`                                                                                   |
| Turbo `2.10.10` wrapper/platform              | MIT                                                       | `turbo-2.10.10-MIT.txt`                                                                                                                                          |
| Bun `1.3.14`                                  | MIT and bundled third-party terms listed in upstream file | `bun-1.3.14-LICENSE.md` from exact Bun commit                                                                                                                    |
| Node `24.18.0` ancillary runtime              | Node license and bundled component terms                  | `node-24.18.0-LICENSE.txt` from exact signed-tag commit                                                                                                          |
| Rust `1.97.1` / Cargo `1.97.1`                | MIT OR Apache-2.0 plus Rust COPYRIGHT notices             | `rust-*`, `cargo-*` from exact commits                                                                                                                           |
| `rusqlite 0.40.2` / `libsqlite3-sys 0.38.2`   | MIT; bundled SQLite is public domain                      | retained MIT texts; inventory only                                                                                                                               |
| possible `libc 0.2.189` supervisor dependency | MIT OR Apache-2.0                                         | both exact local crate texts retained; candidate remains UNKNOWN                                                                                                 |
| Apple Git CLI                                 | Unknown exact artifact/source mapping                     | no license text copied; candidate remains unavailable                                                                                                            |

File SHA-256 values are retained in
`../evidence/Q1-T01/identity-license-observation.log`; the raw log hash is in
`../evidence/Q1-T01/SHA256SUMS`. License retention is inventory evidence, not
legal advice, publication authority, a distribution decision, or candidate
qualification.
