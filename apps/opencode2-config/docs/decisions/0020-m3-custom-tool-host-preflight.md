# ADR 0020: M3 custom-tool host preflight

**Status:** Characterized 2026-08-18; limitation accepted by the project owner
for the bounded design in ADR 0021. The original preflight STOP is superseded,
not disproved.

## Scope and exact evidence

This preflight changes no runtime or search behavior. It characterizes the exact
pinned Promise plugin package and the existing isolated Darwin real-host fixture.
The lock pin and installed package are both `0.0.0-beta-17519`; relevant installed
SHA-256 values are:

- `dist/promise/adapter.js`: `c07da0deb3bcd5f2c9a23602592c2de503b556ead3effeebb9d8cb4efade0fbb`
- `dist/promise/tool.d.ts`: `552fe7edd7f70c067227b4739cdb1567e7461d3ad18fb16bc073ebc0ff32c068`
- `@opencode-ai/schema/dist/tool.d.ts`: `c37b29a8e4dc68c1092c0553b63150329881ecfdcd749472cc2cb9e4fa73f6f2`
- `dist/promise/registration.d.ts`: `e98f49ff7f8fe9fb391ca6b50232bf55ed3731b0b39cae03b6e344d023ba347f`

`tests/characterization/promise-tool-host-abi.test.mjs` runs through the published
Promise-to-Effect adapter, rather than invoking a definition from a permissive
map. `bun run test:real-host` remains the closest host authority: it copies the
exact CLI, SDK and built artifact into a disposable sandbox, activates through
`GET /api/plugin`, and observes setup, registration and cleanup.

## Findings

1. **Trusted agent identity: yes.** `Tool.Context` contains host-created
   `sessionID`, `agent`, `messageID`, and call `id`. The Promise adapter spreads
   that context unchanged into the custom definition. The characterization sees
   `agent: "researcher"` at execution without accepting agent identity in tool
   input. This identity is suitable as host provenance, subject to the normal
   rule that authorization still belongs to host permission policy.
2. **Call-scoped `AbortSignal`: no.** Neither schema `Tool.Context` nor Promise
   `ToolContext` has `signal`. The adapter's `executePromiseTool` adds only a
   Promise `progress` function. By contrast, the separate `websearch.transform`
   API explicitly supplies `{ signal: AbortSignal }`; that signal does not cross
   into custom named tools.
3. **Cancellation before execution:** interrupting the Effect before evaluation
   prevents the Promise definition from starting.
4. **Cancellation during execution:** interrupting the caller's Effect does not
   cancel the already-started Promise definition. The caller fiber terminates,
   but the definition continues and completes after its gate is released. There
   is no host signal for cooperative cancellation or for aborting a downstream
   fetch.
5. **Duplicate `web_search` registration:** the exact real host accepts this
   plugin's custom `web_search` registration while the host owns its web-search
   surface, activates successfully, and reports one exposed `web_search` ID in
   the product registration set. It emits no duplicate diagnostic. The public
   API does not state or expose ordering/winner provenance, so replacement order
   is not a stable contract. M3 must not rely on either rejection or a particular
   winner. A same-name multi-plugin execution winner remains intentionally
   unclaimed because proving it requires model/simulation execution beyond the
   credential-free activation fixture.
6. **Registration disposal:** Promise registrations are scoped by the published
   adapter. Closing the plugin scope disposes the transform once. The exact-host
   fixture independently observes one plugin cleanup after one setup; the product
   cleanup disposes its returned registrations in reverse order.

## Gate and local/upstream boundary

The original finding was **STOP** because M3 then required a call-scoped
cancellation signal for a custom named tool,
but the pinned custom-tool ABI cannot provide one and in-flight Promise work
survives host interruption. A local wrapper can create its own `AbortController`
or timeout, but cannot bind it to the host call's cancellation event; presenting
that as host cancellation would be false. The blocker therefore cannot be fixed
locally without changing the requirement, moving to the separately shaped
`websearch.transform` provider API, or changing OpenCode upstream to pass a
call-scoped signal into `Tool.Context` and the Promise adapter.

Agent identity and registration disposal were GO. Duplicate-name behavior is not
a safe extension point, so a future adapter must also use an upstream-supported
override/provider mechanism or a deployment-controlled inventory and exact-host
attestation that explicitly does not claim global host uniqueness. ADR 0021
adopts the latter under owner-approved residual risk.

## Reproduction

```text
bun run abi:check
node --test tests/characterization/promise-tool-host-abi.test.mjs
bun run test:characterization
bun run build
bun run test:real-host
```

Revisit on any host/plugin pin change, a `Tool.Context` declaration change, an
adapter hash change, or an upstream duplicate-registration/override contract.
