export const providerCatalogSchemaVersion = 1 as const;

export type ProviderAuthenticationMethod =
  "api-key" | "device-code" | "oauth-pkce";
export type ProviderCatalogSource =
  "configured" | "embedded" | "models.dev" | "provider-api";
export type ProviderConnectionState =
  "connected" | "connecting" | "disconnected" | "error" | "revoked";

export interface ProviderModelCatalogEntry {
  readonly contextWindow?: number;
  readonly id: string;
  readonly name: string;
  readonly reasoning: boolean;
  readonly source: ProviderCatalogSource;
  readonly toolCall: boolean;
}

export interface ProviderCatalogEntry {
  readonly authenticationMethods: readonly ProviderAuthenticationMethod[];
  readonly connectionState: ProviderConnectionState;
  readonly experimental: boolean;
  readonly id: string;
  readonly models: readonly ProviderModelCatalogEntry[];
  readonly name: string;
}

export interface ProviderCatalogSnapshot {
  readonly providers: readonly ProviderCatalogEntry[];
  readonly revision: string;
  readonly schemaVersion: typeof providerCatalogSchemaVersion;
}

export interface ProviderCatalogLayer {
  readonly providers: readonly (Omit<ProviderCatalogEntry, "models"> & {
    readonly models?: readonly ProviderModelCatalogEntry[];
  })[];
}

export interface ProviderCatalogComposition {
  readonly authenticatedModels?: Readonly<
    Record<string, readonly ProviderModelCatalogEntry[]>
  >;
  readonly baseline: ProviderCatalogSnapshot;
  readonly configured?: ProviderCatalogLayer;
  readonly connectionStates?: Readonly<Record<string, ProviderConnectionState>>;
  readonly revision: string;
}

const providerIdPattern = /^[a-z0-9][a-z0-9-]{0,63}$/u;
const modelIdPattern = /^[^\u0000-\u0020\u007f]{1,256}$/u;
const revisionsPattern = /^[a-zA-Z0-9._:-]{1,128}$/u;
const authenticationMethods = new Set<ProviderAuthenticationMethod>([
  "api-key",
  "device-code",
  "oauth-pkce",
]);
const catalogSources = new Set<ProviderCatalogSource>([
  "configured",
  "embedded",
  "models.dev",
  "provider-api",
]);
const connectionStates = new Set<ProviderConnectionState>([
  "connected",
  "connecting",
  "disconnected",
  "error",
  "revoked",
]);

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const boundedString = (
  value: unknown,
  pattern: RegExp,
  maximumBytes = 256,
): string | undefined =>
  typeof value === "string" &&
  new TextEncoder().encode(value).byteLength <= maximumBytes &&
  pattern.test(value)
    ? value
    : undefined;

const decodeModel = (value: unknown): ProviderModelCatalogEntry | undefined => {
  const input = record(value);
  const id = boundedString(input?.id, modelIdPattern);
  const name = boundedString(input?.name, /^.{1,160}$/u, 320);
  const source = input?.source as ProviderCatalogSource;
  if (
    !input ||
    !id ||
    !name ||
    typeof input.reasoning !== "boolean" ||
    !catalogSources.has(source) ||
    typeof input.toolCall !== "boolean"
  )
    return undefined;
  const contextWindow = input.contextWindow;
  if (
    contextWindow !== undefined &&
    (!Number.isSafeInteger(contextWindow) || Number(contextWindow) < 1)
  )
    return undefined;
  return Object.freeze({
    ...(typeof contextWindow === "number" ? { contextWindow } : {}),
    id,
    name,
    reasoning: input.reasoning,
    source,
    toolCall: input.toolCall,
  });
};

const decodeProvider = (value: unknown): ProviderCatalogEntry | undefined => {
  const input = record(value);
  const id = boundedString(input?.id, providerIdPattern, 64);
  const name = boundedString(input?.name, /^.{1,120}$/u, 240);
  const state = input?.connectionState as ProviderConnectionState;
  if (
    !input ||
    !id ||
    !name ||
    typeof input.experimental !== "boolean" ||
    !connectionStates.has(state) ||
    !Array.isArray(input.authenticationMethods) ||
    input.authenticationMethods.length > 4 ||
    !input.authenticationMethods.every((method) =>
      authenticationMethods.has(method as ProviderAuthenticationMethod),
    ) ||
    !Array.isArray(input.models) ||
    input.models.length > 1_024
  )
    return undefined;
  const models = input.models.map(decodeModel);
  if (models.some((model) => !model)) return undefined;
  const methods = input.authenticationMethods as ProviderAuthenticationMethod[];
  if (new Set(methods).size !== methods.length) return undefined;
  return Object.freeze({
    authenticationMethods: Object.freeze([...methods]),
    connectionState: state,
    experimental: input.experimental,
    id,
    models: Object.freeze(models as ProviderModelCatalogEntry[]),
    name,
  });
};

export const decodeProviderCatalogSnapshot = (
  value: unknown,
): ProviderCatalogSnapshot | undefined => {
  const input = record(value);
  const revision = boundedString(input?.revision, revisionsPattern, 128);
  if (
    !input ||
    input.schemaVersion !== providerCatalogSchemaVersion ||
    !revision ||
    !Array.isArray(input.providers) ||
    input.providers.length > 128
  )
    return undefined;
  const providers = input.providers.map(decodeProvider);
  if (providers.some((provider) => !provider)) return undefined;
  const typed = providers as ProviderCatalogEntry[];
  if (new Set(typed.map(({ id }) => id)).size !== typed.length)
    return undefined;
  return Object.freeze({
    providers: Object.freeze(typed),
    revision,
    schemaVersion: providerCatalogSchemaVersion,
  });
};

export const composeProviderCatalog = ({
  authenticatedModels = {},
  baseline,
  configured = { providers: [] },
  connectionStates = {},
  revision,
}: ProviderCatalogComposition): ProviderCatalogSnapshot => {
  const providers = new Map(
    baseline.providers.map((provider) => [
      provider.id,
      { ...provider, models: [...provider.models] },
    ]),
  );
  for (const [providerId, models] of Object.entries(authenticatedModels)) {
    const provider = providers.get(providerId);
    if (provider) provider.models = [...models];
  }
  for (const configuredProvider of configured.providers) {
    const existing = providers.get(configuredProvider.id);
    const models = new Map(
      (existing?.models ?? []).map((model) => [model.id, model]),
    );
    for (const model of configuredProvider.models ?? [])
      models.set(model.id, model);
    providers.set(configuredProvider.id, {
      ...existing,
      ...configuredProvider,
      models: [...models.values()],
    });
  }
  return Object.freeze({
    providers: Object.freeze(
      [...providers.values()].map((provider) =>
        Object.freeze({
          ...provider,
          connectionState:
            connectionStates[provider.id] ?? provider.connectionState,
          models: Object.freeze([...provider.models]),
        }),
      ),
    ),
    revision,
    schemaVersion: providerCatalogSchemaVersion,
  });
};

const embeddedAuthentication = (
  ...methods: ProviderAuthenticationMethod[]
): readonly ProviderAuthenticationMethod[] => Object.freeze(methods);

const embeddedProviders: readonly ProviderCatalogEntry[] = Object.freeze([
  {
    authenticationMethods: embeddedAuthentication("oauth-pkce"),
    connectionState: "disconnected",
    experimental: true,
    id: "openai-oauth",
    models: Object.freeze([]),
    name: "ChatGPT / Codex",
  },
  {
    authenticationMethods: embeddedAuthentication("api-key"),
    connectionState: "disconnected",
    experimental: false,
    id: "openai",
    models: Object.freeze([]),
    name: "OpenAI API",
  },
  {
    authenticationMethods: embeddedAuthentication("api-key"),
    connectionState: "disconnected",
    experimental: false,
    id: "anthropic",
    models: Object.freeze([]),
    name: "Anthropic",
  },
  {
    authenticationMethods: embeddedAuthentication("api-key"),
    connectionState: "disconnected",
    experimental: false,
    id: "google",
    models: Object.freeze([]),
    name: "Google AI",
  },
]);

export const embeddedProviderCatalog: ProviderCatalogSnapshot = Object.freeze({
  providers: embeddedProviders,
  revision: "embedded-v1",
  schemaVersion: providerCatalogSchemaVersion,
});
