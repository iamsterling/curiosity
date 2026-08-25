# Existing SQLite Rust tuple inventory

**Verdict:** **UNKNOWN — Q2 REQUIRED**  
**Disposition:** **DEFERRED**  
**Confidence:** High for local lock/source inventory; no confidence is assigned
to durability or readiness behavior.

## Exact observed tuple

- Manifest: `rusqlite = "=0.40.2"`, optional, default features disabled,
  feature `bundled`.
- `rusqlite 0.40.2` lock checksum:
  `23f2a97da3e3873c73cb2a2e71b35c40ff95e0b1eefa8d72d8499a6928c3b5b3`.
- `libsqlite3-sys 0.38.2` lock checksum:
  `f1d20bef17f513b9b3004532233187769cd072d790971f4e4da0e346eb6401e8`.
- Bundled SQLite: `3.53.2`, source ID
  `2026-06-03 19:12:13 d6e03d8c777cfa2d35e3b60d8ec3e0187f3e9f99d8e2ee9cac695fd6fcdf1a24`.
- Feature trace: `rusqlite/bundled` -> `rusqlite/modern_sqlite` and
  `libsqlite3-sys/{bundled,bundled_bindings,cc}`; exact transitive versions and
  features are retained in the Q1 scratch-derived observation summarized in
  Q1-T01.
- Licenses: rusqlite/libsqlite3-sys MIT texts retained. Bundled SQLite's source
  is public-domain material; no behavioral or redistribution conclusion is made
  by this inventory.
- Host observation only: macOS `27.0`/Darwin arm64. The system SQLite CLI and
  Node-bundled SQLite are separate identities and are not this candidate.

## Explicitly untested

No database was opened and no connection setting, compile option, VFS,
filesystem, device/cache policy, WAL, synchronization, hard-reset, backup,
restore, corruption, or network-filesystem behavior was tested. The existing
manifest couples this optional dependency to a broader runtime feature; that
feature is not selected for the custom harness.

Q2 must define and test a complete exact profile. This tuple cannot report
storage readiness and cannot be used by I2.
