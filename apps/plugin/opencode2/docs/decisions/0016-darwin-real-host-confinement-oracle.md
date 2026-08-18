# ADR 0016: Darwin real-host confinement oracle

**Status: Proposed, corrected 2026-08-18.** This decision replaces the weak
security oracle described in ADR 0015; it does not claim the current harness
implements this design. The correction incorporates conflicting exact-host
evidence: isolated probes observed two catalog attempts that the proxy rejected,
while the pinned `/api/plugin` probe with `OPENCODE_DISABLE_MODELS_FETCH=1`
observed zero, and adopts M7's zero-external-attempt release-smoke invariant.

## Decision and invariant

The exact-host probe must not turn ABI acceptance into an opportunity for the
pinned host or copied plugin artifact to affect the operator's machine. The
invariant is stronger than post-run inspection: non-loopback egress and writes
outside the disposable root are denied by an inherited Darwin sandbox, and the
host may not create descendants. Inspection is evidence about attempted traffic
and retained content; it is not presented as enforcement.

The probe remains Darwin-only, credential-free with respect to model providers,
and isolated under one `mkdtemp(realpath(os.tmpdir()))` root. It starts no active
installation, changes no global configuration, and performs no symlink, install,
restart, publish, or cutover operation.

## Facts, assumptions, and claim boundary

**Current facts.** On the target Darwin host, `/usr/bin/sandbox-exec` is present.
A focused disposable test confirmed that `(deny file-write*)` plus an explicit
`(allow file-write* (subpath ROOT))` permits a write below the real root and
rejects `/tmp` outside it. `(deny process-fork)` rejects a shell fork. The exact
`0.0.0-next-17430` `serve`/authenticated
`GET /api/plugin?location[directory]=<disposable-project>` path completed with
`(deny process-fork)`, so this acceptance path has no demonstrated child-process
requirement. The existing non-loopback network deny also permits the loopback
activation path. Prior isolated runtime probes observed two HTTPS proxy `CONNECT`
attempts to `models.opencode.ai:443`; the controlled proxy rejected both. A
subsequent exact pinned-host `/api/plugin` probe with
`OPENCODE_DISABLE_MODELS_FETCH=1` observed zero proxy attempts. The differing
observations make zero attempts an explicit acceptance invariant rather than an
environment-sensitive assumption. `/api/model` remains an unnecessarily broad
activation oracle; the narrow `/api/plugin` release smoke requires zero external
proxy records.

**Assumption to validate in implementation.** The final literal profile must be
exercised against both the exact host and adversarial fixtures on every supported
Darwin CI image. `sandbox-exec` is deprecated, so presence alone is not evidence
that a future OS release preserves its behavior.

**Proposed claim boundary.** A passing report may claim:

- the sandbox prevented successful non-loopback network connections during the
  run;
- the controlled proxy recorded zero external attempts; any proxy record,
  including a model-catalog or GitHub request, is a release-smoke failure;
- the sandbox prevented successful writes outside the disposable root;
- a complete scan of regular files retained below the root at the scan barrier,
  plus captured stdout/stderr and proxy requests, found no raw Basic secret or
  its derived authorization value; and
- `process-fork` denial prevented creation of descendant processes.

It must not claim that proxy logs enumerate direct-connect attempts, that a final
tree scan proves a file was never created and removed, or that stdout regexes
prove no model call. Darwin's available unprivileged sandbox interface prevents
network success but does not provide a complete per-attempt audit stream. The
report therefore separates `successfulExternalEgressPrevented: true` from the
required zero observed proxy records; it never translates a zero proxy count
into proof that no direct denied network attempt occurred.

## Enforceable probe design

The controller performs setup outside the sandbox, resolves the root with
`realpath`, copies the built artifact, and then launches exactly this command
shape:

```text
/usr/bin/sandbox-exec -f <root>/sandbox.sb \
  <root>/artifact/node_modules/@opencode-ai/cli-darwin-arm64/bin/opencode2 \
  serve --hostname 127.0.0.1 --port 0 --log-level all
```

The generated profile contains the literal canonical root (Scheme-escaped; no
string concatenation from untrusted input):

```scheme
(version 1)
(allow default)
(deny network-outbound)
(allow network-outbound (remote ip "localhost:*"))
(deny file-write*)
(allow file-write* (subpath "/private/.../opencode2-real-host-..."))
(deny process-fork)
```

The child inherits no writable regular-file descriptor outside the root;
stdin is `/dev/null` and stdout/stderr are controller-owned pipes. This matters
because Darwin sandbox restrictions apply when a resource is acquired, not to a
writable descriptor opened before sandbox entry. The root is checked for
pre-existing symlinks before launch, and the outside-write fixture covers both a
direct sibling path and an in-root symlink to that sibling; either successful
write fails acceptance.

The controller sets only an allowlisted environment: `PATH`, isolated `HOME`,
`XDG_CONFIG_HOME`, `XDG_DATA_HOME`, `XDG_CACHE_HOME`,
`OPENCODE_CONFIG_DIR`, `OPENCODE_CONFIG_CONTENT`, `OPENCODE_PASSWORD`,
`OPENCODE_CONFIG_PROJECT_DISABLE=1`, `OPENCODE_DISABLE_MODELS_FETCH=1`,
`OPENCODE_DISABLE_FFF=1`, `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, and
`NO_PROXY=127.0.0.1,localhost`. The fetch-disable setting is retained but is not
represented as proof of zero traffic: exact-host observations differ across
probe environments. The controller does not spread `process.env`; provider,
cloud, git, npm, SSH-agent, and system proxy variables are absent. The three
proxy variables point to a controller-owned loopback HTTP canary that records
method, authority, and path but never headers or bodies. Unknown proxy protocol,
or any request is an observed outbound attempt and fails with
`REAL_HOST_EXTERNAL_ATTEMPT_OBSERVED`. There is no authority exception: models,
GitHub, provider, inference, and unknown-authority records all fail release
smoke. The proxy never tunnels an accepted `CONNECT` or forwards any request.
Direct non-loopback traffic remains impossible even if the runtime ignores proxy
variables.

The exact-host fixture copies the approved ripgrep 15.1.0 Darwin arm64 binary
(SHA-256
`4fdf1d8365af224bc70e3c1490d8461d859c37cc70e739a11e987af0215f3e94`)
from `/Users/sterling/.cache/opencode/bin/rg`, verifies its version,
architecture, hash, and system-only links, and sets PATH to only artifact
`bin`, `/usr/bin`, and `/bin`. Repeated clean runs require zero GitHub, model,
provider, or inference proxy attempts.

Rejected records do not satisfy the invariant: any recorded external attempt is
a release-smoke failure even though the proxy permits no successful external
connection. No provider credentials are present.

Internal negative probes use a fresh 256-bit nonce in their generated wrapper.
Import, setup, and duplicate wrappers append exactly one nonce-bound failure
condition; the harness maps it to `REAL_HOST_TEST_IMPORT_FAILED`,
`REAL_HOST_TEST_SETUP_FAILED`, or `REAL_HOST_TEST_DUPLICATE_FAILED`, kills and
reaps the isolated process group, and removes the disposable root. Tests match
the specific code, a bounded duration, and the recorded PID's non-survival.
These test-only codes are not exposed by public artifact diagnostics.

The scenario must complete within the suite's declared deadline, and the recorder
must fail closed if its configured evidence capacity is exhausted. Timeout or
evidence truncation is a failed/inconclusive probe. Any future numeric capacity
is only an operational resource bound, never an attempt allowance.

The unpredictable Basic password exists only in controller memory and the child
environment. Before any diagnostic is serialized, the controller scans raw
stdout/stderr, proxy metadata, and every retained regular file under the root as
bytes for the password, `opencode:<password>`, and the complete Basic header
value. Symlinks, non-regular files, unreadable files, or a file changing between
`lstat`, read, and a second `lstat` fail closed. The scan runs after host cleanup
and process exit but before root deletion. Reports contain only stable codes,
counts, relative paths for non-secret evidence, and artifact digests.

`deny process-fork` is the descendant oracle, not PID sampling. The controller
still launches the sandbox as a detached process-group leader and sends TERM then
KILL to that group in `finally`, but process-table snapshots are cleanup evidence
only. If the exact host later requires a child, this probe fails; it is not
weakened to observational orphan detection without a new decision.

## Adversarial fixture qualification

Before the exact-host scenario, the same profile builder and runner execute four
small fixture modes from inside the root. Each test first proves its benign
control succeeds, then requires the malicious action to produce the named failure:

1. `network`: connect to a controller canary on a non-loopback interface; the
   connection must fail. Separately issue an HTTP request through the loopback
   proxy; the proxy count must become one and the suite must emit
   `REAL_HOST_PROXY_ATTEMPT_OBSERVED`.
2. `outside-write`: attempt `open(O_CREAT|O_WRONLY)` at a sibling canary path
   outside the root, directly and through an in-root symlink; both must fail and
   the sibling must remain absent, yielding `REAL_HOST_OUTSIDE_WRITE_DENIED`.
3. `secret-persist`: write the supplied fixture canary into a retained in-root
   file; the content scanner must reject with `REAL_HOST_SECRET_PERSISTED`. A
   separate output mode must reject with `REAL_HOST_SECRET_LEAK`.
4. `detached-child`: attempt to spawn a detached sleeper that would write a
   sibling canary after the parent exits; spawn must fail under `process-fork`,
   the delayed canary must remain absent, and the result is
   `REAL_HOST_PROCESS_FORK_DENIED`.

Tests that merely assert fixture exit codes are insufficient: each malicious
test must fail if its corresponding sandbox clause, proxy assertion, or content
scanner is deliberately disabled. Fixture canaries live only in the disposable
test parent and are removed in `finally`.

## Evidence schema and binary acceptance

The public result is JSON-shaped and secret-free:

```text
activation: { method: "GET", path: "/api/plugin",
              query: { "location[directory]": "<disposable-project>" },
              authenticated: true, source: "OPENCODE_CONFIG_CONTENT",
              projectConfig: false }
network: { successfulExternalEgressPrevented: true,
           successfulExternalEgressCount: 0,
           observedProxyAttempts: 0,
           catalogMetadata: { method: "CONNECT",
                              authority: "models.opencode.ai:443",
                              disposition: "rejected", attempts: 0 },
           modelCatalogAttempts: 0, githubAttempts: 0,
           providerInferenceAttempts: 0, successfulInferenceCount: 0,
           unknownAuthorityAttempts: 0 }
filesystem: { outsideWritesPrevented: true, retainedFilesScanned: N }
credentials: { providerCredentialsInherited: false,
               retainedRawMatches: 0, outputRawMatches: 0 }
processes: { forkPrevented: true, observedGroupMembersBeforeCleanup: [PID],
             survivingGroupMembersAfterCleanup: [] }
fixtures: { network: "caught", proxy: "caught", outsideWrite: "caught",
            secretPersistence: "caught", detachedChild: "caught" }
```

`source` is the literal configuration source used to activate the copied plugin,
and `projectConfig: false` confirms project configuration was disabled.
`catalogMetadata` describes the only catalog attempt classification: fixed
`CONNECT`, authority, and rejected disposition strings plus a numeric `attempts`
count equal to both `observedProxyAttempts` and `modelCatalogAttempts`. Acceptance
requires all three counts to be zero; `githubAttempts` remains a separate numeric
counter that must also be zero.

Acceptance is binary:

1. Darwin and `sandbox-exec` are required; unsupported platforms fail with
   `REAL_HOST_DARWIN_SANDBOX_REQUIRED`, not a weaker fallback.
2. The exact pinned copied artifact completes activation, registration, tool,
   and cleanup assertions under the literal final profile.
3. All fixture qualification results are `caught`; the exact host has zero proxy
   records, zero successful external egress, zero model-catalog, GitHub,
   provider/inference, and unknown-authority attempts, and zero retained secret
   matches. Any proxy record, method, authority, disposition, accounting
   mismatch, timeout, or recorder-capacity exhaustion fails closed.
4. The controller deletes the root and sibling fixture canaries in `finally`.
5. `bun run test:unit`, `bun run test:security`, `bun run test:real-host`, and
   `bun run verify` pass without global mutation.

## Alternatives considered

1. **Inherited sandbox plus zero-record proxy assertion and fork denial
   (selected).** This
   is plausible because it gives kernel-enforced network/write/process boundaries
   while retaining useful attempt evidence. It loses complete attempt
   observability: direct denied connections are prevented but not exhaustively
   logged by an unprivileged API.
2. **Audit-only process/tree/output sampling.** This is portable and simple, but
   loses because create-delete writes, short-lived or re-parented children, and
   unlogged network calls can evade snapshots. It cannot support the safety
   invariant.
3. **Privileged DTrace/Endpoint Security capture.** This could provide richer
   attempt telemetry, but loses because it requires privileges/entitlements and
   global host facilities unavailable to repository CI. It would violate the
   no-global-mutation operating constraint.
4. **Container or VM isolation.** This gives a stronger whole-system boundary,
   but loses for this decision because the accepted ABI must be exercised by the
   exact Darwin host binary and no repository-pinned VM substrate exists.

## File-level implementation map

- `tools/real-host-suite.mjs`: retain scenario orchestration but replace regex,
  tree, and PID security conclusions with a shared sandbox runner, allowlisted
  environment, in-memory proxy, scan barrier, and the evidence schema above.
- `tools/lib/darwin-real-host-guard.mjs` (new): canonical-root/profile builder,
  sandbox availability self-test, controlled-proxy recorder, zero-record
  assertion, byte scanner, and detached-group finalizer. It exports
  testable policy functions, not secrets.
- `tests/fixtures/real-host-adversary.mjs` (new): the four fixture modes; no
  production import and no behavior selected by the production plugin.
- `tests/security/darwin-real-host-guard.test.mjs` (new, Darwin-gated): benign
  controls, each malicious fixture, symlink escape, scanner race/unreadable-file
  fail-closed cases, zero-attempt acceptance, model-catalog, GitHub, provider,
  method, and authority rejection, timeout/capacity failure, and mutation tests
  proving each guard is discriminating.
- `tests/unit/real-host-suite.test.mjs`: evidence-schema and stable-code tests;
  delete assertions that infer security from output regexes or PID snapshots.
- `docs/operations/real-host-probes.md` and ADR 0015: remain Proposed pending
  policy acceptance; tests alone do not make the operating policy Current.

Focused acceptance commands are:

```text
node --test tests/security/darwin-real-host-guard.test.mjs
bun run build && bun run test:real-host
bun run test:unit
bun run test:security
bun run verify
```

## Pre-mortem, revisit triggers, and non-goals

Likely failures are sandbox syntax drift (fixture controls stop discriminating),
an exact-host child requirement (serve fails with fork denial), an unexpected
external attempt (release smoke fails), proxy bypass (still prevented, but
no attempt record), secret material written then deleted (outside the
retained-content claim), or scanner races (fail closed). A residual contradiction
remains: `OPENCODE_DISABLE_MODELS_FETCH=1` coincided with zero attempts in the
exact-host run but does not explain the prior two-attempt observations. Revisit
on any Darwin version change in CI, removal/behavior change of `sandbox-exec`,
host pin or packaged source-map change, any recurring external attempt, measured
evidence that justifies an operational capacity, resolution of the
fetch-setting contradiction,
demonstrated host child requirement, or a release
requirement for complete denied-attempt telemetry.

Non-goals are proving that no denied direct connection was attempted, forensic
recovery of deleted in-root files, non-Darwin support, successful model execution,
provider credentials, global configuration, installation, restart, publication,
or cutover.
