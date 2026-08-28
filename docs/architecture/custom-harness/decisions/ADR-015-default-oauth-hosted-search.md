# ADR-015: Default OAuth hosted search

**Status:** Accepted and implementation authorized — 2026-08-27  
**Authority:** The user explicitly required real web search through the existing
OpenAI OAuth session for trusted-local development. Production, deployment,
publication, release, and broader platform authority remain excluded.

## Context

The researcher exposed `web_search` only when an operator separately configured
a local corpus, a private SearXNG gateway token, or the isolated benchmark
adapter. OpenAI OAuth already authorized ordinary model generation, and the
installed OpenAI Responses provider supported hosted `web_search`, but the
harness did not connect that provider capability to its governed research tool.
The prior no-adapter fallback reached the model without retrieval and therefore
did not satisfy the research objective.

## Decision

When the selected answer model is `openai-oauth`, configure an OpenAI hosted
search adapter and the existing bounded HTTPS fetch adapter by default.

1. Hosted search uses `@openai-oauth/local` through the existing provider
   boundary. It does not read, copy, print, persist, or introduce another
   credential.
2. A search call is forced to the provider's `web_search` tool with low search
   context, no retries, at most 64 output tokens, a ten-second deadline, and a
   process-wide four-call concurrency ceiling. Curiosity accepts no more than
   the requested ten URLs.
3. Provider-returned URLs are deduplicated, restricted to credential-free HTTP
   or HTTPS, and treated only as untrusted discovery results. Generated answer
   text is not admitted as source content.
4. Page retrieval remains separate. It uses the existing bounded HTTPS adapter,
   including public-address DNS pinning, redirect revalidation, no ambient
   credentials, and response size, media, encoding, UTF-8, and deadline bounds.
5. Search and fetch still traverse the researcher-only final tool sink,
   successful action records, `source.captured` custody, and verified-citation
   receipt path. An OpenAI response does not grant truth or action authority.
6. `CURIOSITY_RESEARCH_ADAPTER=none` disables implicit hosted search.
   `openai-oauth` explicitly selects it when another answer provider is active.
   Existing explicit runtime and benchmark adapters retain their prior rules.
7. Doctor reports configured search and fetch capability without probing or
   exposing credentials. Actual OAuth failure remains a runtime authentication
   failure.

## Acceptance checks

- A default OAuth adapter receipt reports both `network.search` and
  `network.fetch`; explicit `none` reports neither.
- A live hosted-search call returns bounded public source URLs through the
  inherited OAuth session.
- A full `/research` turn records a successful `web_search`, at least one
  `source.captured` event, and a verified research receipt.
- Missing or invalid credentials do not produce a false search result or leak a
  credential value.
- Existing role, SSRF, deadline, source-custody, type, architecture, package,
  binary, and repository verification checks pass.

## Non-goals

No generic crawler, unbounded provider tool loop, credential export, source-text
trust elevation, production qualification, deployment, release, signing,
notarization, publication, multi-user service, or non-Darwin claim is authorized.

## References

- [OpenAI web search guide](https://developers.openai.com/api/docs/guides/tools-web-search)
- [AI SDK OpenAI provider: web search](https://ai-sdk.dev/providers/ai-sdk-providers/openai#web-search)
- [ADR-014](ADR-014-benchmark-owned-retrieval.md)
