# Q1-E02 canonical-root verification result

**Result:** **FAIL — STOPPED FAIL CLOSED**  
**Source commit:** `8670d358f761003c49902db5f148baab0c2e6be4`  
**Profile:** macOS `27.0` build `26A5368g`, Darwin arm64; Bun `1.3.14`
revision `0d9b296af`; Node `24.18.0`; Rust/Cargo `1.97.1`.

## Command ledger

| Order | Canonical-root command             |    Exit | Output SHA-256                                                     | Verdict                                                     |
| ----- | ---------------------------------- | ------: | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| 1     | pre-stop changed-Q1 Prettier check |       0 | `a282aa6f62a7adb2ebe8fad92375366534a6e8671da54881b7f890e156e56439` | PASS                                                        |
| 2     | pre-stop Q1 local-link check       |       0 | `d1ce13a4bba8234ba57333110f8a86c55152aa8a18c2f027835a94675083bac8` | PASS; 8 links, 0 failures                                   |
| 3     | `bun run inventory:check`          |       0 | `977c12f0f7849d221bd66ac13714440a8258657c8a69fe33f3cace3e8933bbd7` | PASS                                                        |
| 4     | `bun run status:check`             |       0 | `6d26896a7fc2960a69528af48ddd29d958d44638bb8578099ad6d75d983ae3fe` | PASS                                                        |
| 5     | `bun run check-types`              |       0 | `77934ad2e1f15d387c184ac58722d09584b420e37e2ab121a020b0025a7ff534` | COMMAND EXIT 0; created/modified ignored outputs outside Q1 |
| 6     | `bun run lint`                     |       1 | `08b97aace86d4f937992f00348e314ed7e126e4a281aeae424bf54398ba820d4` | **FAIL**                                                    |
| 7     | `bun run test`                     | not run | n/a                                                                | BLOCKED BY STOP                                             |
| 8     | `bun run build`                    | not run | n/a                                                                | BLOCKED BY STOP                                             |
| 9     | `bun run verify`                   | not run | n/a                                                                | BLOCKED BY STOP; mandatory verification unmet               |

All Bun root commands used `--no-install --no-env-file`. The environment used a
credential-empty scratch HOME/TMP/XDG/Cargo facade, Cargo offline mode, forced
Turbo execution, and disabled Turbo telemetry/update notification.

## Failure

`@curiosity/runtime:lint` invoked Cargo through Turbo and failed:

```text
error: rustup could not choose a version of cargo to run, because one wasn't
specified explicitly, and no default is configured.
```

The outer wrapper successfully reported Rust/Cargo `1.97.1`; the failure arose
inside Turbo's task environment. A likely cause is that the scratch-HOME Rustup
selection depended on `RUSTUP_TOOLCHAIN`, while `turbo.json` passes explicit
Cargo/Rust tool variables but not that variable. This inference was not tested
after the failure because the caller required an immediate stop on root-check or
tool mismatch. No retry, fallback, environment weakening, or package-local
substitute was used.

## Corrected boundary finding

- The original Q1 persistent boundary was **not preserved**. Check-types/lint
  created or modified exactly 18 ignored generated files outside Q1; original
  status checks omitted ignored detail and therefore missed them.
- The authorized remediation retained metadata only, then deleted exactly those
  18 files. Parent directories and unrelated ignored artifacts were not removed.
  See `12-remediation-disposition.md`, preserved first-attempt
  `13-remediation-postcheck.log`, and
  `14-remediation-final-boundary.log`.
- The first remediation post-check returned exit 1 only because its snapshot
  exclusion expression compared the 18 intended targets; its diff contains no
  other file change. The deletion had completed, and subsequent static checks
  confirm all 18 are absent.
- `apps/plugin/opencode2/assets/manifest.json` remains
  `cc9018882649228e6514e2e0df8ba983d1a8a90a9a7361ba75c7da78d8457e10`.
- Root `bun.lock`, `package.json`, and `turbo.json` remain respectively
  `0656e39945e9b62c4535f0a60fb3da5a2d0206e9e0757d4226e277aba98e9075`,
  `d45e0fcd14dd5f373fec1e131895bca2e291abc3bfe4aef1418562ee9d5b31d5`,
  and `d6e2e99a1ae21c2f5fd2c32a7f85089b1ae81b73c0eac7999e7a19cef2c5c549`.
- No tracked, product, manifest, lock, accepted-plan/README/ADR, or research file
  changed during remediation. Repository HEAD remains unchanged.
- Original raw evidence is preserved. Remediation corrections supersede only
  unsupported summaries and are not represented as covered by the original
  format/link logs. No root or qualification command was rerun.

Q1 exit criteria do not pass because root lint failed, mandatory later root
checks were blocked, the original boundary escaped, focused evidence is
insufficient, and the public Effect consumer boundary is unproven. I1 remains
unauthorized.
