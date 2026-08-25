# Rust toolchain and smallest supervisor-closure record

## Toolchain identity

**Corrected verdict:** **INSUFFICIENT** as a qualified compiler/toolchain
identity; this supersedes the original QUALIFIED verdict.  
**Disposition:** **DEFERRED as observations only**  
**Confidence:** Medium for the aggregate local/source/channel values; exact
commands, per-command environment, timestamps, and exits were not retained, and
no source rebuild was performed.

- `rustc 1.97.1 (8bab26f4f 2026-07-14)`, full source commit
  `8bab26f4f68e0e26f0bb7960be334d5b520ea452`.
- `cargo 1.97.1 (c980f4866 2026-06-30)`, Cargo source commit
  `c980f4866141969fab6254a680546a277789d6f0`.
- Target/host: `aarch64-apple-darwin`; installed targets are
  `aarch64-apple-darwin` and `wasm32-unknown-unknown`.
- Exact channel manifest SHA-256:
  `03569b1886ceb5c05276b50c8431ab111de944cd6140fe1fa7d821dd8e0f29cf`.
- Official component SHA-256 values: aggregate Rust tar
  `cbd14c36…a8b26`, rustc `b7999e81…a86e`, Cargo
  `4c70846f…3c39`, and arm64 std `27b3da11…ed5d`.
- Local rustc SHA-256:
  `210df6794001b73ec3d453878707fa1e0bdcb63c427024a6e6574bbe5615a4da`.
- Local Cargo SHA-256:
  `7672ead309d505577c018fff2cafb3433601f073e38cbe87359ac1f7b944bbf5`.
- Licenses/notices: Rust MIT/Apache-2.0/COPYRIGHT and Cargo
  MIT/Apache-2.0 retained.

These observations may inform later disposable probes under separate tranche
authority. They do not qualify a toolchain or supervisor behavior.

## Smallest closure analysis

| Closure                            | Verdict      | Reason                                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact toolchain `std` only         | **REJECTED** | Standard process pipes can support basic framed parent/child I/O, but stable `std` does not establish the required macOS descendant process-group termination and inherited-descriptor closure. Treating direct-child kill as sufficient would weaken ADR-001.                                          |
| `std` plus possible `libc@0.2.189` | **UNKNOWN**  | The existing lock provides exact checksum `3eaf3ede3fee6db1a4c2ee091bf8a8b4dccdc6d17f656fb07896ee72867612f2`, target support, and MIT OR Apache-2.0 texts. The required features, wrappers, safe API sequence, complete closure, artifact digest in a supervisor build, and Q3 behavior are unresolved. |

No framing, serialization, async runtime, process, signal, error, or logging
crate was guessed or adopted. Q3 must choose the smallest exact closure and
qualify IPC, descriptor hygiene, descendant termination, authority loss, and
platform behavior before I1 can use a supervisor.
