# OpenCode provider/model discovery evidence — 2026-08-30

## Question

Does OpenCode obtain models from `models.dev`, from an authenticated provider
API, or both, and which behavior should Curiosity reproduce without adopting
OpenCode's credential boundary?

## Scope and license

Static inspection used the local MIT-licensed OpenCode checkout at
`/Volumes/dev/loom/repos/opencode`, commit
`a85d8d23aa297b3051e642c28e3fc79b457fc4bc`. This investigation covers the
observable catalog/authentication contract. Curiosity reimplements that
contract behind ADR-019 rather than importing OpenCode's runtime or credential
store.

## Findings

### FACT — high confidence: `models.dev` is the baseline catalog

`packages/core/src/models-dev.ts:154-175` selects `https://models.dev` by
default and fetches `/api.json`. Lines 155-166 and 196-239 cache the payload on
disk with a five-minute freshness test and cross-process lock; lines 249-251
schedule refresh attempts. OpenCode's HTTP client also configures transient
retries at lines 145-150.

`packages/opencode/src/provider/provider.ts:1338-1345` converts this data into
the initial catalog/database before loading active providers.

Curiosity adopts the baseline source but not the retry behavior: the broker
performs one bounded fetch per explicit refresh operation.

The selected community Codex transport was also dynamically tested with an
injected fetch. Without an explicit `codexVersion`, it first requested
`https://registry.npmjs.org/@openai/codex/latest` before requesting the Codex
model endpoint. Curiosity pins that adapter field so one discovery operation
produces one authenticated provider request and no implicit registry lookup.

### FACT — high confidence: authenticated hooks can replace provider models

`packages/opencode/src/provider/provider.ts:1392-1417` calls a provider plugin's
`models` hook with stored auth and replaces that provider's model map with the
hook result. `provider.ts:1419-1515` then overlays configured providers/models.

The current Codex plugin at
`packages/opencode/src/plugin/openai/codex.ts:278-318` does not call an OpenAI
model-list API. When OAuth is present, it filters the OpenAI `models.dev`
baseline through an explicit Codex eligibility policy and adjusts selected
metadata/costs.

### FACT — high confidence: dynamic authenticated API discovery is provider-specific

`provider.ts:1564-1578` registers optional custom `discoverModels` functions.
The observed dynamic merge at `provider.ts:1592-1603` is specifically applied
to GitLab and only adds missing models. Therefore “authenticated means all model
lists come from the provider API” is false for this checkout.

### FACT — high confidence: connection state is separate from the full catalog

`packages/opencode/src/server/routes/instance/httpapi/handlers/provider.ts:40-70`
returns the full `models.dev` catalog, default models, and separately computed
connected provider identifiers. `provider/auth.ts:112-158` derives available
auth methods from plugin hooks and stores API credentials through the auth
service.

### FACT — high confidence: Codex offers browser and device authorization

`packages/opencode/src/plugin/openai/codex.ts:430-458` implements browser PKCE.
Lines 460-539 start the beta device flow, poll the device token endpoint, and
exchange its authorization code for OAuth tokens. The desktop plugin keeps and
refreshes those provider tokens in the OpenCode auth boundary.

## Curiosity conclusion

Curiosity uses the same useful precedence—baseline catalog, authenticated
provider override/discovery, then operator configuration—but keeps every
credential and authenticated request on the separate broker. The iPad receives
only a sanitized public projection. Codex remains experimental because provider
terms, beta device-flow enablement, revocation, refresh recovery, and live model
behavior are not yet qualified.

## Unknowns / NO-GO

- No claim is made that every provider's authenticated API exposes a complete
  or stable model list.
- No production claim is made for the community Codex adapter.
- No direct provider OAuth session may be placed in Hermes to close these gaps.
