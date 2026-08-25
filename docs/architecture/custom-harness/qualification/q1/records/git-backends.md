# Git backend candidate record

## Candidate count

One of the permitted maximum two backends was inspected. No library backend or
alternate Git executable was introduced.

## Apple Git CLI

**Verdict:** **UNKNOWN — UNAVAILABLE**  
**Disposition:** **DEFERRED**  
**Confidence:** High for running artifact/platform identity; low for exact
source/license mapping.

| Field              | Observation                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Version/build      | `git version 2.54.0 (Apple Git-157)`                                                                                                 |
| Build options      | arm64; `no commit associated with this build`; `fsmonitor--daemon`; libcurl `8.7.1`; zlib `1.2.12`; default SHA-1/files ref format   |
| Shim               | `/usr/bin/git`, SHA-256 `0741e745385d941a1cb1e97bef08b801d58e86c795c8b9a57e873fce7930db19`                                           |
| Running artifact   | `/Applications/Xcode.app/Contents/Developer/usr/bin/git`, SHA-256 `3dd98fff510403664c65b9992d088c2de50b7826e48adbdddd0e70796b9404cb` |
| Signature/platform | Apple `com.apple.git`, arm64; Xcode `27.0`, build `27A5209h`; host macOS `27.0`, build `26A5368g`                                    |
| Auto-update        | Git command inventory exposes no self-update command. Xcode replacement is external to Git and is forbidden during qualification.    |

Exact `Git-157` and `git-157` tag lookups in Apple's public source repository
returned HTTP 404. The running build explicitly embeds no source commit, and no
artifact-local Git license/source receipt was found. Upstream Git `2.54.0`
cannot substitute for Apple's modified build. Therefore source-to-artifact and
license mapping are unresolved, and the backend fails closed.

No Git mutation or worktree behavior was tested. Q3 may inspect a separately
authorized exact backend, but this record cannot enable Git or I8.
