# ADR-018: Tool-free iPadOS Foundation Models route

**Status:** Accepted; implementation spike exists — 2026-08-29  
**Decision history:** The user accepted ADR-017 through ADR-021 as implementation
authority on 2026-08-29.  
**Authority:** Authorizes implementation of this design. It does not qualify
model quality, safety, performance, tools, release, or provider substitution.

**Known limitation identified 2026-08-29:** The implementation bounds message
count, UTF-8 bytes, and the API's `maximumResponseTokens` option, but it does not
yet enforce the user-selected 4,096-token total input-plus-output envelope.
[ADR-020](ADR-020-ipados-governed-memory-curation.md) requires a conservative
total-context assembler before this route may curate memory.

## Context

The iPad must support useful local generation without a Mac or server, while the
model must not become command, event, tool, or completion authority. Apple's
Foundation Models framework supplies an on-device route beginning with iOS and
iPadOS 26, but availability depends on the device, Apple Intelligence settings,
assets, and locale.

## Decision

Add one explicit, tool-free `GenerationPort` backed by
`SystemLanguageModel.default`.

1. The route identifies itself as `apple:system-language-model` and reports
   runtime availability and a stable reason. Availability never selects another
   provider as a hidden fallback.
2. Swift reconstructs a structurally bounded transcript from user/assistant
   messages and uses fixed Curiosity instructions. Requests are limited to 64
   messages, 65,536 UTF-8 bytes per message, an API option ceiling of 4,096
   maximum response tokens, and a 256-byte turn identity. These guards are not a
   total-context budget or evidence that a 4,096-token response fits beside the
   input.
3. Streaming uses Expo module events keyed by the authority turn ID. The
   TypeScript adapter forwards only matching-turn deltas and removes its listener
   on every terminal path.
4. Cancellation is terminal at the `GenerationPort`: an already-aborted signal
   never enters native generation; an in-flight abort races the generation,
   invokes native task cancellation, and returns `ACTION_CANCELLED` even if a
   fast model finishes concurrently. Swift also checks task cancellation after
   the final stream snapshot.
5. Foundation Models errors map to stable Curiosity codes for unavailable
   assets/model, context size, rate limits, guardrails, refusal, locale, generic
   failure, and cancellation.
6. Any request containing tools fails closed with
   `FOUNDATION_MODEL_TOOL_BRIDGE_UNAVAILABLE`. No model-emitted text can claim a
   tool receipt or bypass durable command admission.
7. Expo events remain the bounded implementation for this spike. TurboModule or
   JSI adoption requires measured evidence; it is not presumed necessary.

## Invariants

- **ADR-018-I01:** The model proposes text; the portable authority alone records
  terminal completion or failure.
- **ADR-018-I02:** Stream deltas cannot cross turn identities.
- **ADR-018-I03:** Cancellation never publishes assistant success for the
  cancelled authority turn.
- **ADR-018-I04:** Missing or unavailable Foundation Models fails explicitly and
  never routes to a Mac, LAN service, or cloud model.
- **ADR-018-I05:** Tool-bearing requests cannot execute on this route.

## Consequences

Eligible iPads can perform bounded local drafting without network access. The
route is device-scale and unsuitable as a silent replacement for Curiosity's
advanced main-agent or research capabilities. Availability UI and additional
task qualification remain required.

## Binary acceptance checks

- [x] **ADR-018-AC01:** Adapter tests cover pre-abort, in-flight abort, listener
      cleanup, and foreign-turn delta rejection.
- [x] **ADR-018-AC02:** Installed-SDK and signed Release iPhoneOS builds compile
      the native route.
- [x] **ADR-018-AC03:** On the connected iPadOS 27 device, status is available,
      one request emits five deltas and completes in 1,396 ms, and another turn
      terminates as `ACTION_CANCELLED`.
- [x] **ADR-018-AC04:** Tool-bearing requests fail closed in the portable
      authority/native route.
- [ ] **ADR-018-AC05:** Unsupported device, disabled Apple Intelligence,
      unavailable assets, unsupported locale, context overflow, guardrail,
      refusal, and rate-limit fixtures all report the specified code.
- [ ] **ADR-018-AC06:** Backgrounding and stale-event races settle to explicit
      journal states on a physical device.
- [ ] **ADR-018-AC07:** Representative tasks record quality, first-response and
      completion distributions, memory, thermal state, OS, and model version.
- [ ] **ADR-018-AC08:** A conservative preflight enforces the configured total
      input-plus-output envelope, including fixed instructions and structured
      schema overhead, before native dispatch.

## Non-goals

No tool execution, retrieval, web search, advanced-agent parity, hidden provider
fallback, quality budget, performance budget, or release qualification.

## Evidence

- [N1–N3 physical acceptance, 2026-08-29](../evidence/ipados-native-n1-n3-2026-08-29.md)
- `apps/mobile/modules/curiosity-runtime/ios/FoundationModelHost.swift`
- `apps/mobile/src/foundation-model-generation-port.ts`
