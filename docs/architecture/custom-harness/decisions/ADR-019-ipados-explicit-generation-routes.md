# ADR-019: iPadOS explicit generation routes and provider custody

**Status:** Accepted — 2026-08-29  
**Decision history:** The user accepted the local-coprocessor/frontier-provider
split and requested a software architecture on 2026-08-29. The detailed route
and custody contracts were accepted as implementation authority with ADR-017
through ADR-021 on 2026-08-29.  
**Authority:** Authorizes implementation of this architecture. It does not
authorize a broker deployment, provider terms, credential enrollment, production
traffic, or a provider-security claim.

## Context

ADR-016 requires the iPad product to remain locally authoritative and prohibits
AI SDK from the production portable import closure. ADR-018 provides one bounded
Foundation Models route but does not define route selection or advanced provider
access. The desktop harness uses AI SDK adapters and desktop credential sources,
which are not a mobile authentication design.

Provider connection, model selection, agent role, and per-operation routing must
remain separate. Missing or expired authorization must not make Curiosity
silently substitute a model with materially different privacy, context, tool,
quality, or cost properties.

## Decision

1. `PortableAuthority` resolves and journals one exact generation route before
   dispatch. `auto` is a versioned authority policy input, not a dispatch route.
2. Route selection records purpose, requested route, actual route, provider,
   model, adapter version, context-plan identity, and policy version. Every
   terminal or delivery-unknown receipt retains that identity.
3. Agent roles never encode provider routes. Provider catalog, provider
   connection, model selection, and route selection are separate contracts and
   projections.
4. A route adapter can dispatch only its exact selected route. Unavailability,
   authentication failure, context overflow, cancellation, and delivery
   ambiguity fail under stable codes and never trigger another route.
5. `on-device.apple` remains a native Foundation Models adapter and contains no
   AI SDK dependency.
6. Frontier providers are optional capabilities reached through one explicit
   Curiosity account broker. The app remains locally usable without the broker.
7. The iPad stores only a revocable broker session under native
   when-unlocked/`ThisDeviceOnly` Keychain custody. Hermes receives connection
   metadata but no broker token or provider credential.
8. Provider credentials stay at the broker. Documented delegated authorization
   is used where supported; otherwise key enrollment occurs on a broker-hosted
   TLS page and is not represented as OAuth.
9. Vercel AI SDK adapters execute broker-side only. They may encode requests,
   decode structured output/tool proposals, and parse streams; hidden retries,
   automatic tool loops, route selection, policy, and durable completion remain
   disabled or outside the SDK.
10. Every frontier physical request satisfies ADR-004 call allocation,
    cancellation, usage, and delivery-ambiguity rules. Provider transport
    success cannot directly complete an authority attempt.

This decision supersedes the direct-user-provider-key option described in the
initial iPad severance document. A provider API key in native Keychain but copied
into Hermes or used by app-bundled provider code is not an allowed production
route.

## Invariants

- **ADR-019-I01:** One durable selection identity names every generation
  dispatch and terminal receipt.
- **ADR-019-I02:** No adapter silently substitutes another route or model.
- **ADR-019-I03:** Provider and broker credentials are absent from Hermes,
  events, prompts, logs, bundle resources, and crash reports.
- **ADR-019-I04:** AI SDK code runs neither in the portable authority nor in the
  React Native production closure.
- **ADR-019-I05:** Broker absence cannot prevent local authority, journal,
  document, or on-device-model startup.
- **ADR-019-I06:** Model tool output is a proposal and cannot execute an effect
  without the separately governed authority loop.

## Consequences

Curiosity can expose an OpenCode-like provider catalog and connection experience
without copying OpenCode's desktop environment credential model. The broker
adds an operated security and availability boundary, so frontier support is no
longer synonymous with a fully standalone binary. That dependency is explicit
and capability-scoped; local use remains self-contained.

Provider-specific authorization terms, account recovery, abuse controls,
retention, regional processing, and deployment operations become broker release
requirements. A compile check or mocked login cannot qualify them.

## Rejected alternatives

- **Provider API keys in Hermes:** exposes long-lived secrets to app code and
  conflicts with provider client-secret guidance.
- **Provider keys used directly by bundled AI SDK adapters:** expands the mobile
  TCB and does not satisfy the portable-closure invariant.
- **Reuse desktop CLI OAuth state:** relies on an undocumented cross-product
  credential protocol and a Mac/desktop trust boundary.
- **Use `@ai-sdk/react` as chat authority:** duplicates Curiosity's durable turn,
  cancellation, policy, and projection ownership.
- **Silent frontier-to-local fallback:** changes privacy and capability while
  preserving a misleading operation identity.

## Binary acceptance checks

- [ ] **ADR-019-AC01:** Route tests prove exact selection for local, frontier,
      research, and `auto`, and prove every unavailable route performs zero
      alternate dispatches.
- [ ] **ADR-019-AC02:** Success, failure, cancellation, and delivery-unknown
      events retain requested route, actual route, model, purpose, context plan,
      and policy version.
- [ ] **ADR-019-AC03:** Static bundle, journal, prompt, log, and crash-report
      fixtures contain no broker or provider credential.
- [ ] **ADR-019-AC04:** Native authentication uses an exact HTTPS origin, system
      authentication session, PKCE, and native Keychain custody; Hermes receives
      metadata only.
- [ ] **ADR-019-AC05:** Disconnect/revocation immediately makes the exact route
      unavailable without disturbing local startup.
- [ ] **ADR-019-AC06:** Network observation and crash injection satisfy ADR-004
      for normal, failed, cancelled, and ambiguous frontier calls with hidden
      SDK retries/tool loops disabled.
- [ ] **ADR-019-AC07:** With the broker unreachable, a physical iPad cold-launches,
      recovers local history, queries local memory, and completes an eligible
      on-device operation.

## Non-goals

No provider contract approval, direct-provider credential flow, hard currency
limit, multi-user collaboration design, broker deployment, release claim, or
claim that frontier capability is available while the broker is unconfigured.
