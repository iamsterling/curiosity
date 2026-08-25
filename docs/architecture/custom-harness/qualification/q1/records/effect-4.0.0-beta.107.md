# Effect `4.0.0-beta.107` evidence record

**Corrected verdict:** **INSUFFICIENT / UNKNOWN** for the four intended public
subpaths and consumer resolution. This supersedes the original QUALIFIED
verdict.  
**Disposition:** **DEFERRED**; exact authorized-version observations are retained,
but no Effect surface is available to I1.  
**Confidence:** Medium for the aggregated identity/provenance observations; low
for reproducibility, public export resolution, and consumer TypeScript behavior.

## Exact identity and source-to-artifact provenance

| Field                            | Exact value                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Package                          | `effect@4.0.0-beta.107`                                                                                                            |
| Lock integrity                   | `sha512-OoBAv8eF+yanc+C6xhgEUnWeXUSHA6ynnscYqpkAY9GSnzZWystsIjBowVqCkLpHGlnRtdIqYT3wHwpOY6JDnQ==`                                  |
| Tarball SHA-256                  | `e3b3664b248b812eb4d6ad278817b29a803c1a7694237c367b201099b21edd4d`                                                                 |
| Tarball SHA-512 hex              | `3a8040bfc785fb26a773e0bac6180452759e5d448703aca79ec718aa990063d1929f3656cacb6c223068c15a8290ba471a59d1b5d22a613df01f0a4e63a2439d` |
| npm SHA-1                        | `6f928025031c3f137c66a8a4f3f11bdc72804c83`                                                                                         |
| SLSA resolved source             | `3c495ae7c96d43bfc3b8020250562a194c2c895e`                                                                                         |
| Source tree                      | `5e77033d116402945c4115c8c3c6b8fce8ec81e8`                                                                                         |
| Build workflow/run               | `.github/workflows/release.yml`; GitHub Actions run `31356640717`, attempt 1                                                       |
| Installed/tar tree manifest hash | both `7cac23fe10a5d289adb5dcf02b31bb11e140618d9d906dab5de0e6f1f5d7aa43`                                                            |
| License                          | MIT; retained SHA-256 `774c3bc5924ad8ae6c5a75f1c53db13feb238ade15989625c513d07b60dedf30`                                           |

The aggregate receipt reports that the npm SLSA subject SHA-512 equals the
downloaded tarball and root lock integrity, that the attestation resolves to the
listed source commit, and that installed/tar manifests match. Exact commands and
per-command exits were not retained. The attestation signature bundle was
retained only through its response digest and was not independently re-verified;
this is a known evidence exclusion, not a claim of reproducible build.

## Internal-file probe boundary

Intended public imports named by the record:

- `effect/Context`
- `effect/Effect`
- `effect/Layer`
- `effect/ManagedRuntime`

The actual probe source did not import those public package subpaths. It opened
and imported files beneath
`node_modules/.bun/effect@4.0.0-beta.107/node_modules/effect/dist/` directly.
Historical Bun output reports that its internal emitted-JavaScript scan passed,
but it does not prove package `exports`, public-subpath resolution, or behavior
from a consumer package. The declared dependency inventory remains an
observation; no selected runtime closure is qualified.

The probe source checks for one root lock entry and compares installed paths and
internal runtime identities. Historical output reports those checks passing.
Because its command/environment/exit metadata is incomplete and it bypasses the
public export boundary, it is not qualification evidence.

## Composition/runtime observations

Historical output reports that the internal-file Bun probe:

1. builds one `Context.Service` through one `Layer.effect`;
2. creates one `ManagedRuntime`;
3. executes two transitions through one service instance;
4. observes one acquisition and one cached context;
5. disposes once and observes one release; and
6. rejects work after disposal.

These are internal-file observations only. They qualify neither public
composition primitives nor the future I1 authority boundary, persistence,
command port, provider gateway, process supervision, or application behavior.

## TypeScript boundary and retained negative result

The first strict library-declaration pass (`skipLibCheck: false`) failed on
`AsyncDisposable`/`Disposable` library selection and an upstream emitted
`SchemaAST.Sentinel` reference. Upstream source at the exact commit uses
TypeScript `^7.0.2` and `skipLibCheck: true`; this repository's base TypeScript
configuration also uses `skipLibCheck: true`.

The attempted profile used `lib: ["ESNext", "DOM"]`, `strict: true`, and
`skipLibCheck: true`. The retained final TypeScript log contains only an elided
command line, with no compiler output or explicit exit, and the source imports
internal `dist` paths. It therefore cannot establish public consumer
type-checking. The initial failure is preserved, not erased, in
`evidence/Q1-T01/diagnostic-upstream-declaration-check.log`.

## Declared install closure and licenses

| Package                                           | Exact resolution               | License record                                                                             | Runtime status in selected graph                              |
| ------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `@standard-schema/spec`                           | `1.1.0`                        | MIT, retained                                                                              | Not imported                                                  |
| `fast-check`                                      | `4.9.0`                        | MIT, retained                                                                              | Not imported                                                  |
| `pure-rand`                                       | `8.4.2`                        | MIT, retained                                                                              | Not imported                                                  |
| `kubernetes-types`                                | `1.30.0`, git head `a46eb946…` | Apache-2.0 SPDX in exact package metadata; package/source archive contains no license file | Not imported; no bytes copied into project-owned probe/source |
| `msgpackr`                                        | `2.0.5`                        | MIT, retained                                                                              | Not imported                                                  |
| `msgpackr-extract`                                | `3.0.4`                        | MIT, retained                                                                              | Not imported                                                  |
| `@msgpackr-extract/msgpackr-extract-darwin-arm64` | `3.0.4`, git head `71def7bd…`  | MIT metadata, same source as parent                                                        | Not imported                                                  |
| `node-gyp-build-optional-packages`                | `5.2.2`                        | MIT, retained                                                                              | Not imported                                                  |
| `detect-libc`                                     | `2.1.2`                        | Apache-2.0, retained                                                                       | Not imported                                                  |
| `uuid`                                            | `14.0.1`                       | MIT, retained                                                                              | Not imported                                                  |

Exact root-lock SHA-512 integrities, in table order, are:

```text
@standard-schema/spec@1.1.0  l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==
fast-check@4.9.0             7ms6T7SybUev/PQITciI0yLM2pOSFy5zpG8Ty7tQofcVaQUvrMXp6CBwqF6fThLCLOrfBtuHAtwq6Yu4XPCllg==
pure-rand@8.4.2              vvuOGgcuPJAirlHvuQw1TrOiw7ptaIXXmIbNuiNOY6lNGJJH49PQ1Kj4nd783nPdQhQdicgOjVI2yI/9BD6/Ng==
kubernetes-types@1.30.0      Dew1okvhM/SQcIa2rcgujNndZwU8VnSapDgdxlYoB84ZlpAD43U6KLAFqYo17ykSFGHNPrg0qry0bP+GJd9v7Q==
msgpackr@2.0.5               cef05H/dSYpLpqp3sj/qyZh5vhUYCalnaLO7j1yOmpsR0y/XwLVtK7r5gn+U/F7CTEfMowcGhlUQJDLcLf7jcA==
msgpackr-extract@3.0.4       4kmO/MdyUIkLIvTPr8VHLil4AtoKIoniWPIEk5+CDy0xnWC84azhSFmuJ7PxZdsYtiP5kEeQsORAVIeMgxT+Hw==
native extract@3.0.4         LCkGo6JDfaBhgST7UpPWgNgLINpcpabaHfyz5OBx75nUYxBsaEPxjnyNjWpeb/xBup/682QnBfRBy2/LvPutZQ==
node-gyp-build@5.2.2         s+w+rBWnpTMwSFbaE0UXsRlg7hU4FjekKU4eyAih5T8nJuNZT1nNsskXpxmeqSK9UzkBl6UgRlnKc8hz8IEqOw==
detect-libc@2.1.2            Btj2BOOO83o3WyH59e8MgXsxEQVcarkUOpEYrubB0urwnN10yQ364rsiByU11nZlqWYZm05i/of7io4mzihBtQ==
uuid@14.0.1                  6ZxzVpzDXDa3bJWaHilVayA+BH/1zmxCJoVgvmqJnid/gPoKHxUrS/aC/T6LGQtNHT+XHG9fXPJB4d+IrU30Ew==
```

The absence of a bundled Kubernetes license text is retained as a negative
result. Its unambiguous Apache-2.0 metadata is sufficient only for this internal,
non-imported install inventory; enabling or copying it requires a new license
review.

## Invalidation and exclusions

A future qualification would be invalidated by any changed Effect version,
source, integrity, tarball digest, package tree, selected import, compiler
profile, Bun identity, platform, or duplicate physical runtime. The current
record qualifies no public Effect subpath, AI, SQL, process, workflow, event-log,
Schema, root-barrel, platform runtime, or provider behavior.
