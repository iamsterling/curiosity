# Q1 ignored-output remediation disposition

## Scope and decision

This record was written before disposition. It inventories the exact 18 ignored
files identified by the independent Q1 audit as created or modified during the
canonical-root check window. File contents are not copied here. The authorized
disposition is deletion of these files only; parent directories and all other
ignored artifacts are excluded.

The Q1 check window retained by the original evidence is
`2026-08-24T15:44:30Z` through `2026-08-24T15:45:26Z`. More specifically,
`05-check-types.log` records check-types from `15:44:50Z` through `15:44:52Z`
and shows `next typegen` for `apps/docs` and `apps/web`;
`06-lint.log` records lint from `15:44:52Z` through `15:44:52Z` and shows the
started package tasks. All times below are filesystem times converted to UTC
from the retained epoch values.

## Exact audited set before deletion

| Path                                                 | Ignore rule reported by `git check-ignore -v` | Bytes | SHA-256                                                            | Modified UTC           | Birth UTC              | Q1-window tie                                   |
| ---------------------------------------------------- | --------------------------------------------- | ----: | ------------------------------------------------------------------ | ---------------------- | ---------------------- | ----------------------------------------------- |
| `apps/docs/next-env.d.ts`                            | `apps/docs/.gitignore:36:next-env.d.ts`       |   288 | `1862ac4bbbc5192d4bf562161df66ea547ed3e67173100656ab606ae9797db2b` | `2026-08-24T15:44:51Z` | `2026-08-24T15:44:51Z` | Created during retained check-types window.     |
| `apps/web/next-env.d.ts`                             | `apps/web/.gitignore:36:next-env.d.ts`        |   288 | `1862ac4bbbc5192d4bf562161df66ea547ed3e67173100656ab606ae9797db2b` | `2026-08-24T15:44:51Z` | `2026-08-24T15:44:51Z` | Created during retained check-types window.     |
| `apps/docs/.next/types/cache-life.d.ts`              | `apps/docs/.gitignore:13:/.next/`             |  5905 | `4f984436b10cfb43ccf7fc3114dcb851cbefa4d58b7d8ae741aaae0f6e330129` | `2026-08-24T15:44:51Z` | `2026-08-24T12:35:48Z` | Modified during retained `next typegen` window. |
| `apps/docs/.next/types/root-params.d.ts`             | `apps/docs/.gitignore:13:/.next/`             |   101 | `f3387dd7800eec3c34273f7a8efad13e864598c7e8f788d321e407390989bb59` | `2026-08-24T15:44:51Z` | `2026-08-24T12:35:48Z` | Modified during retained `next typegen` window. |
| `apps/docs/.next/types/routes.d.ts`                  | `apps/docs/.gitignore:13:/.next/`             |  1397 | `a384610388221cd70cffb4503cee7853b8b076f2b4a55324b20a4bdbd25a3538` | `2026-08-24T15:44:51Z` | `2026-08-24T12:35:48Z` | Modified during retained `next typegen` window. |
| `apps/docs/.next/types/validator.ts`                 | `apps/docs/.gitignore:13:/.next/`             |  2095 | `8c738d7ab02122bec55d98eab2f5e875f5306ebffe56a6be96f2da0916a7ea71` | `2026-08-24T15:44:51Z` | `2026-08-24T12:35:48Z` | Modified during retained `next typegen` window. |
| `apps/web/.next/types/cache-life.d.ts`               | `apps/web/.gitignore:13:/.next/`              |  5905 | `4f984436b10cfb43ccf7fc3114dcb851cbefa4d58b7d8ae741aaae0f6e330129` | `2026-08-24T15:44:51Z` | `2026-08-24T12:35:48Z` | Modified during retained `next typegen` window. |
| `apps/web/.next/types/root-params.d.ts`              | `apps/web/.gitignore:13:/.next/`              |   101 | `f3387dd7800eec3c34273f7a8efad13e864598c7e8f788d321e407390989bb59` | `2026-08-24T15:44:51Z` | `2026-08-24T12:35:48Z` | Modified during retained `next typegen` window. |
| `apps/web/.next/types/routes.d.ts`                   | `apps/web/.gitignore:13:/.next/`              |  1397 | `a384610388221cd70cffb4503cee7853b8b076f2b4a55324b20a4bdbd25a3538` | `2026-08-24T15:44:51Z` | `2026-08-24T12:35:48Z` | Modified during retained `next typegen` window. |
| `apps/web/.next/types/validator.ts`                  | `apps/web/.gitignore:13:/.next/`              |  2095 | `8c738d7ab02122bec55d98eab2f5e875f5306ebffe56a6be96f2da0916a7ea71` | `2026-08-24T15:44:51Z` | `2026-08-24T12:35:48Z` | Modified during retained `next typegen` window. |
| `apps/docs/.turbo/turbo-check-types.log`             | `.gitignore:19:.turbo`                        |    90 | `99d7c2179cdd316467c51f37901025a0753453664d741214ba56fc631fa6c0bc` | `2026-08-24T15:44:52Z` | `2026-08-24T12:50:43Z` | Modified by retained check-types task.          |
| `apps/web/.turbo/turbo-check-types.log`              | `.gitignore:19:.turbo`                        |    90 | `99d7c2179cdd316467c51f37901025a0753453664d741214ba56fc631fa6c0bc` | `2026-08-24T15:44:52Z` | `2026-08-24T12:50:43Z` | Modified by retained check-types task.          |
| `apps/plugin/opencode2/.turbo/turbo-check-types.log` | `.gitignore:19:.turbo`                        |    35 | `531213aef7b88a98688e8dab65030c5541dce1c6c6230161e9e1d5d447cf2c6f` | `2026-08-24T15:44:51Z` | `2026-08-24T12:50:43Z` | Modified by retained check-types task.          |
| `apps/plugin/opencode2/.turbo/turbo-lint.log`        | `.gitignore:19:.turbo`                        |    68 | `6fc744c610a0a32d494c737d24c293e3cdc423b863ba0c5e160aafa9016a29b6` | `2026-08-24T15:44:52Z` | `2026-08-24T12:50:43Z` | Modified during retained lint window.           |
| `apps/runtime/.turbo/turbo-check-types.log`          | `.gitignore:19:.turbo`                        |    15 | `8366207267355d3e3d5bf3bf6e8c94c5f93f6078c34f08973fa2b38cdda6cc92` | `2026-08-24T15:44:51Z` | `2026-08-24T12:50:43Z` | Modified by retained check-types task.          |
| `apps/runtime/.turbo/turbo-lint.log`                 | `.gitignore:19:.turbo`                        |   672 | `d6005554f1a3dc17ccb23941834fbc3265d0e35655e2a5348fcd4b0544e0db6a` | `2026-08-24T15:44:52Z` | `2026-08-24T12:50:43Z` | Modified during retained lint window.           |
| `packages/ui/.turbo/turbo-check-types.log`           | `.gitignore:19:.turbo`                        |    15 | `8366207267355d3e3d5bf3bf6e8c94c5f93f6078c34f08973fa2b38cdda6cc92` | `2026-08-24T15:44:50Z` | `2026-08-24T12:50:43Z` | Modified by retained check-types task.          |
| `packages/ui/.turbo/turbo-lint.log`                  | `.gitignore:19:.turbo`                        |    28 | `960f1eb37ac4d28430af9bef2c98f32333254854ffde619330f53d373ce0f632` | `2026-08-24T15:44:52Z` | `2026-08-24T12:50:43Z` | Modified during retained lint window.           |

## Uncertainty and exclusions

Birth times show that the eight `.next/types` files and eight `.turbo` logs
pre-existed Q1 and were overwritten or touched in the Q1 window. Their prior
bytes were not retained, so restoration is impossible; deletion is the
authorized conservative disposition. The two `next-env.d.ts` files were born in
the Q1 window. Confidence is high that all 18 paths are the exact audited set
because every modified time aligns with the corresponding retained command and
the generated paths match its task output.

`apps/docs/.turbo/turbo-lint.log` and
`apps/web/.turbo/turbo-lint.log` are explicitly excluded: their modified times
are `2026-08-24T12:50:43Z`, outside Q1. Other files beneath the ignored parent
directories are also excluded. The original pre/post status logs omitted
ignored files, so they did not detect this escape.

Deleting children necessarily updates parent-directory metadata. The parent
directories themselves were retained, and the before/after file-stat diff shows
no non-target file change outside Q1.

## Disposition status and partial-attempt note

This inventory was created before deletion. The subsequent cleanup invocation
validated all 18 pre-deletion SHA-256 values and deleted all 18 paths. It then
returned exit 1 because a generated `find` exclusion expression did not actually
exclude the targets from its before/after stat comparison. The preserved
`13-remediation-postcheck.log` therefore says snapshot match `no`, but its diff
contains only the 18 authorized removals and reports all 18 absent. No deletion
was retried. A later static post-check confirmed the partial attempt left all 18
absent, protected hashes unchanged, tracked diff empty, excluded pre-existing
lint logs unchanged, parent directories present, and scratch absent.
