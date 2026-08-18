# ADR 0015: exact next-17430 plugin ABI

**Status:** Proposed, corrected 2026-08-13 and repinned 2026-08-13; the earlier
server-ABI draft is withdrawn and was never accepted

## Invariant and correction

The exact shipped host must discover one `iamsterling.opencode2-config` plugin,
run all product registrations once, and release them on deactivation. Runtime
state remains project-scoped under `.opencode/opencode2-config/`. ABI verification
must not read, write, link, install, start, or restart the operator's active
configuration.

**Proposed evidence pending policy acceptance.** The repository and packaged executable are pinned to
`0.0.0-next-17430`; the executable reports `opencode2 v0.0.0-next-17430`. The
packaged CLI source map
`node_modules/@opencode-ai/cli-darwin-arm64/bin/chunk-d9x5z2nq.js.map`
(SHA-256 `a83d55a461b35b7eb90931589bb26080f497b6fbcfc5935d38507fd5cadda201`)
contains the release's loader sources. In `../core/src/plugin/supervisor.ts`, the
decoded default export is exactly one of:

```ts
{ id: string, effect: Function }
{ id: string, setup: Function }
```

The loader converts the latter through `PluginPromise.fromPromise`. In
`../core/src/plugin/promise.ts`, it calls `plugin.setup(context)` and installs a
returned cleanup as a scope finalizer. In `../core/src/plugin.ts`, activation
rejects duplicate IDs before loading, retains an unchanged `(id, version)`
generation without reloading, closes replaced/removed plugin scopes, and restores
the prior plugin if a replacement fails. Isolated execution of this exact binary
confirms `{id,effect}` and `{id,setup}` are accepted and `{id,server}` is rejected.

The published `@opencode-ai/plugin@0.0.0-next-17430` root export agrees with the
Promise branch (`dist/promise/plugin.d.ts`, SHA-256
`d1b65b2471e4e946057cc37fa93b6a66a5eaf4b6c585e582b5a99d21ce0eb6a7`). Its
`@opencode-ai/plugin/v1` declarations describe a different abstraction and are
not evidence of the packaged host's external-module ABI. The previous ADR draft
reversed that authority and selected `{id,server}`. That ABI claim is incorrect
and retired. Exact-host evidence now establishes an authenticated
`/api/plugin?location[directory]=<disposable-project>` request as the
least-semantic plugin-activating stimulus; setup and registration markers, not
the endpoint response body, remain the invocation evidence.

Artifact identity remains version-qualified: the packaged CLI executable has
SHA-256 `2971389c6311b78e283bbf3355b80bf164768180b90f06cb30cbed79a0ba15a1`;
the registry CLI integrity is
`sha512-ON3zoqoII0vc3swzG0Zpyg/5KOOnf/w2Z+e01MLjD3sc0qfAIF/LOx+D/myRGqze5SdMprEjQxOieThRp15hUw==`,
and the plugin integrity is
`sha512-FOUhl7+VU4uKfLcQ6klyvxzKeenPzZ4ur91qb8IySnV2Q7W+SOqsDEKBA0e/7K/V/jSvJs6Oo2EF4C/yWh6QLA==`.
The source map and isolated behavior are authoritative for this host pin; current
upstream source and mismatched declarations are explanatory only.

## Decision

**Target.** Support only the next-17430 Promise-compatible ABI. The package root
and `./server` subpath resolve to the same compiled entrypoint whose sole runtime
export is:

```ts
export default Plugin.define({
  id: "iamsterling.opencode2-config",
  setup,
})
```

There is no `effect`, `server`, named plugin value, or dual-ABI export. The name of
the retained `./server` package subpath is distribution compatibility, not an ABI
claim.

`setup(context)` composes the existing Promise feature registrations and returns
one idempotent cleanup. Registration is transactional: if a later registration
fails, already-created registrations are disposed in reverse order before the
error escapes. Normal host deactivation invokes the same reverse cleanup exactly
once through the host scope finalizer. Product code uses the root
`@opencode-ai/plugin` contract; V1-only `Hooks`, `PluginInput`, `PluginModule`,
`tool`, schemas, result envelopes, and client calls are removed.

The registration mapping is direct:

- context projection registers `context.session.hook("context", ...)`;
- capture registers Promise `tool.hook("execute.before"/"execute.after", ...)`
  and consumes `context.event.subscribe(...)` under an abort signal;
- all product tool definitions register in one `context.tool.transform(...)`;
- product continuations call `context.session.prompt(...)` and
  `context.session.interrupt(...)` without a synthetic V1 client;
- prompt continuation preserves the deterministic message `id`, `metadata`,
  delivery, and resume fields supported by the exact Promise request contract;
  unsupported fields fail closed rather than being dropped or translated;
- tool definitions retain the Promise schema/result contract at their declaration
  sites; no V1 Zod-schema or `{title, output, metadata}` adapter remains.

Duplicate behavior follows the host contract. Two configured definitions with the
same ID fail activation before either duplicate is loaded. Re-applying an identical
ordered `(id, version)` generation is a host no-op. Replacement closes the old
scope before setup and restoration is host-owned on failure. A project-root
in-process guard may remain only as defense in depth for direct/test invocation:
it must not create a second writer, must return a no-op cleanup for the duplicate,
and must release its key after failed setup or final cleanup. Tests must not encode
the retired server-hook diagnostic object as host behavior.

Artifact verification checks the exact default object, exact ID, callable `setup`,
absence of `server` and `effect`, and no extra runtime exports. It also checks the
root plugin dependency and CLI pin, package/root-and-`./server` resolution,
generated provenance (source digest, package version, plugin API version, host
version, entrypoint), and stale-build rejection. `dist/` stays generated and
ignored; linking a package directory still requires a build first.

## Credential-free real-host oracle

**Transitional correction:** ADR 0016 supersedes the security/confinement oracle
in this section. The ABI stimulus and copied-artifact provenance remain accepted;
output regexes, tree audits, retained-content scans, and PID snapshots have only
the narrower evidentiary meaning stated there.

**Proposed acceptance probe.** The probe creates one private temporary root with
isolated HOME, XDG config/data/cache, project, and `OPENCODE_CONFIG_DIR`. It copies
the freshly built package under that root and writes a local
`.opencode/plugins/opencode2-config.js` wrapper. The wrapper default-exports the
same `{id,setup}` and delegates to the built setup, writing an invocation marker
inside the disposable project immediately on entry. It decorates only the
disposable context's registration functions to append registration kind and ID to
a marker, then calls the built setup; its returned finalizer delegates first and
then writes a cleanup marker. This records host-observed registration without
changing production code. No production entrypoint contains probe behavior.

The probe chooses an unpredictable password in process memory, passes it only to
the child as `OPENCODE_PASSWORD`, and sends
`Authorization: Basic base64("opencode:" + password)` only to loopback. It never
writes, prints, snapshots, or returns the password/header. After the pinned server
announces its loopback address, an authenticated
`GET /api/plugin?location[directory]=<disposable-project>` is the activation
stimulus. Success requires HTTP success, the invocation marker, and the expected
single setup/registration evidence. As specified by ADR 0016, zero or more proxy
attempts are acceptable only when every observed attempt is a rejected
catalog-metadata `CONNECT` to exactly `models.opencode.ai:443` and the exact count
is reported; no provider, inference, unknown-authority, other-method, or
successful external request is accepted.

The probe uses no inherited credentials, binds only `127.0.0.1`, uses a sandbox
egress policy and records host-output request/denial signals, checks raw output
before redaction, audits the disposable root tree and symlink targets, and records
only stable codes. In `finally`, it terminates the detached process group (TERM
then KILL) and observed descendants, verifies no orphan, removes the entire root,
and clears local credential references. A failed cleanup, symlink escape, duplicate
invocation, unredacted secret, sandbox denial, or observed model request fails
acceptance.

## Alternatives considered

1. **Promise `{id,setup}` (selected).** It is accepted by the exact loader and is
   the published root SDK contract. Existing feature adapters already express
   registration handles, reverse cleanup, event subscriptions, tools, and rich
   continuation metadata in this model, so it is the smallest coherent repair.
2. **Native `{id,effect}`.** Also accepted and gives direct access to host scopes
   and Effect services. It loses now because the product is Promise-shaped; it
   would require a broad lifecycle/client/tool rewrite and direct Effect coupling
   without a demonstrated functional gain. Revisit only for an independently
   justified capability unavailable through the Promise adapter.
3. **V1 `{id,server}`.** Plausible from the published `/v1` declarations and
   current upstream history, but rejected by the exact packaged loader. It violates
   the host-discovery invariant and is retired.
4. **Dual `effect`/`setup` or version sniffing.** Plausible for multi-host support,
   but the loader schema chooses a union and the repository supports one exact pin.
   Ambiguity and untested lifecycle branches lose.

## Implementation migration map

**Transitional; not implemented by this ADR.** The implementation change must:

1. restore `src/plugin/plugin.ts`, `src/plugin/contracts.ts`, and `src/index.ts` to
   the root Promise contract and sole default `{id,setup}` export;
2. remove `src/plugin/v1-server.ts` and reconnect `hookFoundationFeature` plus
   `structuredToolsFeature` through `composeFeatures`, preserving partial-failure
   rollback and reverse idempotent cleanup;
3. remove `/v1` imports and V1 schema/result conversions from
   `src/features/tools/index.ts`, and preserve the exact 18-tool Promise
   inventory recorded by ADR 0017; engineering command/controller internals do
   not expand this public ABI without a separate protocol revision;
4. restore Promise context/event/tool hook registration and continuation mapping,
   retaining independent fail-closed capability gates that are not ABI-derived;
5. rewrite `tests/unit/v1-plugin-entrypoint.test.mjs`,
   `tests/integration/plugin-setup.test.mjs`, artifact verification, build
   provenance, README wording, current-state wording, and real-host documentation
   so none assert `server` or V1 hooks;
6. replace the current configured-only real-host result with the authenticated
   `/api/plugin?location[directory]=...` invocation oracle above and ADR 0016's
    exact-authority rejected-catalog classification.

## Acceptance, pre-mortem, and revisit triggers

Acceptance is binary:

1. Static and artifact tests observe only a default object with the exact ID and
   callable `setup`; `server`, `effect`, V1 runtime imports, and extra exports are
   absent.
2. Focused tests cover exactly the 18 expected tools (and reject extra
   `engineering_*` registrations), context/event/tool registrations,
   continuation field preservation, one setup, duplicate suppression, failed
   partial-registration rollback, and reverse idempotent cleanup.
3. The clean artifact resolves identically from root and `./server`, carries
   matching exact-pin provenance, and stale-source verification fails.
4. The isolated exact-host test authenticates
   `GET /api/plugin?location[directory]=...`, observes one delegated setup marker
   and expected registrations, runs under the ADR 0016 Darwin boundaries, reports
   its observed proxy-attempt count and classifies every observed attempt as a
   rejected `models.opencode.ai:443` catalog `CONNECT`, records zero
   provider/inference or unknown-authority attempts and zero
   successful external egress, finds zero retained secret matches, and removes all
   disposable state.
5. `bun run verify` passes without global config, symlink, install, restart, active
   host, or cutover mutation.

Pre-mortem: the correction can still fail if package loading differs from local
plugin loading (detected by testing the local wrapper plus separate artifact
resolution), setup marks entry but registration fails (detected by registration
evidence and HTTP failure), duplicate generations create two writers (detected by
setup count and filesystem lease tests), cleanup leaks subscriptions/processes
(detected by finalizer markers, handle tests, and orphan checks), or the probe leaks
its Basic secret (detected by output/result scans and a canary password). Stop on
any mismatch; do not broaden the ABI or weaken the oracle.

Revisit when the exact host pin changes, the shipped loader removes Promise setup,
or a required capability is proven to need Effect-native services. Each trigger
requires a new packaged-source-map and isolated-runtime probe before design.

**Non-goals:** multi-version compatibility, changing a pin, enabling disabled
capabilities, publishing, global installation/configuration, active activation,
restart, symlink, or cutover.
