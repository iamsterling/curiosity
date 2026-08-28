import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenAIOAuth } from "@openai-oauth/ai-sdk";
import { openaiCredentials } from "@openai-oauth/local";
import {
  createProviderRegistry,
  generateText,
  jsonSchema,
  streamText,
  tool,
  type ToolSet,
} from "ai";
import type { TextGenerator } from "../kernel/text-generator.js";
import type { PromptMessage } from "../kernel/text-generator.js";

type ProviderEnvironment = Readonly<Record<string, string | undefined>>;

export interface HostedWebSearchRequest {
  readonly abortSignal: AbortSignal;
  readonly query: string;
  readonly timeoutMs: number;
}

export interface HostedWebSearchResponse {
  readonly urls: readonly string[];
}

export type HostedWebSearch = (
  request: HostedWebSearchRequest,
) => Promise<HostedWebSearchResponse>;

const supportedProviders = new Set([
  "anthropic",
  "compatible",
  "google",
  "openai",
  "openai-oauth",
]);
const supportedEfforts = new Set([
  "default",
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);
const openAiOAuthAuthenticationMessages = [
  "ChatGPT access token not found.",
  "ChatGPT account id not found",
] as const;

const errorRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const hostedSearchUrls = (toolResults: readonly unknown[]): readonly string[] => {
  const urls = new Set<string>();
  for (const value of toolResults) {
    const result = errorRecord(value);
    const output = errorRecord(result?.output);
    if (!Array.isArray(output?.sources)) continue;
    for (const sourceValue of output.sources) {
      const source = errorRecord(sourceValue);
      if (source?.type === "url" && typeof source.url === "string")
        urls.add(source.url);
    }
  }
  return [...urls];
};

export const aiSdkStreamFailureCode = (
  providerId: string,
  error: unknown,
): string => {
  if (providerId !== "openai-oauth") return "AI_SDK_STREAM_FAILED";
  const record = errorRecord(error);
  const message = error instanceof Error ? error.message : undefined;
  const status = record?.statusCode ?? record?.status;
  return status === 401 ||
    (message &&
      openAiOAuthAuthenticationMessages.some((prefix) =>
        message.startsWith(prefix),
      ))
    ? "OPENAI_OAUTH_AUTHENTICATION_REQUIRED"
    : "AI_SDK_STREAM_FAILED";
};

const configured = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const configuredSecret = (value: string | undefined): string | undefined =>
  configured(value) ? value : undefined;

export const splitAiSdkPrompt = (
  input: readonly PromptMessage[],
): {
  readonly messages: readonly PromptMessage[];
  readonly system?: string;
} => {
  const system = input
    .filter(({ role }) => role === "system")
    .map(({ content }) => content)
    .join("\n\n");
  const messages = input.filter(({ role }) => role !== "system");
  return system ? { messages, system } : { messages };
};

export const resolveAiSdkModelId = (
  environment: ProviderEnvironment,
): string => {
  const explicit = configured(environment.CURIOSITY_MODEL);
  if (explicit) return explicit;
  if (configuredSecret(environment.OPENAI_API_KEY))
    return "openai:gpt-5.4-mini";
  if (configuredSecret(environment.ANTHROPIC_API_KEY))
    return "anthropic:claude-sonnet-4-5";
  if (configuredSecret(environment.GOOGLE_GENERATIVE_AI_API_KEY))
    return "google:gemini-2.5-flash";
  return "openai-oauth:gpt-5.4-mini";
};

export const resolveAiSdkEffort = (
  environment: ProviderEnvironment,
  modelId: string,
): string => {
  const explicit = configured(environment.CURIOSITY_EFFORT)?.toLowerCase();
  const providerId = modelId.slice(0, modelId.indexOf(":"));
  if (explicit && !supportedEfforts.has(explicit))
    throw new Error("TUI_EFFORT_INVALID");
  if (
    explicit &&
    explicit !== "default" &&
    providerId !== "openai" &&
    providerId !== "openai-oauth"
  )
    throw new Error("TUI_EFFORT_UNSUPPORTED");
  if (explicit) return explicit;
  if (
    !configured(environment.CURIOSITY_MODEL) &&
    providerId === "openai-oauth"
  )
    return "low";
  if (!configured(environment.CURIOSITY_MODEL) && providerId === "openai")
    return "medium";
  return "default";
};

export const createOpenAiOAuthHostedWebSearch = (
  modelId: string,
): HostedWebSearch => {
  if (!modelId || Buffer.byteLength(modelId) > 256)
    throw new Error("OPENAI_OAUTH_SEARCH_MODEL_INVALID");
  const provider = createOpenAIOAuth(openaiCredentials());
  const model = provider(modelId);
  return async ({ abortSignal, query, timeoutMs }) => {
    try {
      const result = await generateText({
        abortSignal,
        maxOutputTokens: 64,
        maxRetries: 0,
        model,
        prompt: [
          "Search the public web for the following query.",
          "Use exactly one search query. Do not answer the query; only perform discovery.",
          `Query JSON: ${JSON.stringify(query)}`,
        ].join("\n"),
        providerOptions: { openai: { reasoningEffort: "low" } },
        timeout: timeoutMs,
        toolChoice: { toolName: "web_search", type: "tool" },
        tools: {
          web_search: openai.tools.webSearch({
            externalWebAccess: true,
            searchContextSize: "low",
          }),
        },
      });
      return Object.freeze({ urls: hostedSearchUrls(result.toolResults) });
    } catch (cause) {
      const name = cause instanceof Error ? cause.name : "";
      const message = cause instanceof Error ? cause.message : "";
      const failureCode =
        abortSignal.aborted ||
        name.includes("Timeout") ||
        message.toLowerCase().includes("timed out")
          ? "AI_SDK_STREAM_ABORTED"
          : aiSdkStreamFailureCode("openai-oauth", cause);
      throw new Error(failureCode, { cause });
    }
  };
};

const validateModelId = (
  modelId: string,
  environment: ProviderEnvironment,
): void => {
  if (
    Buffer.byteLength(modelId) > 256 ||
    /[\u0000-\u0020\u007f]/u.test(modelId)
  )
    throw new Error("TUI_MODEL_INVALID");
  const separator = modelId.indexOf(":");
  const providerId = separator > 0 ? modelId.slice(0, separator) : "";
  if (!supportedProviders.has(providerId))
    throw new Error("TUI_PROVIDER_UNSUPPORTED");
  if (
    providerId === "compatible" &&
    !configured(environment.CURIOSITY_OPENAI_COMPATIBLE_BASE_URL)
  )
    throw new Error("TUI_COMPATIBLE_BASE_URL_REQUIRED");
};

export const createAiSdkTextGenerator = (
  environment: ProviderEnvironment,
): TextGenerator => {
  const modelId = resolveAiSdkModelId(environment);
  const effort = resolveAiSdkEffort(environment, modelId);
  validateModelId(modelId, environment);
  const providerId = modelId.slice(0, modelId.indexOf(":"));
  const compatibleBaseUrl =
    configured(environment.CURIOSITY_OPENAI_COMPATIBLE_BASE_URL) ??
    "http://127.0.0.1";
  const anthropicApiKey = configuredSecret(environment.ANTHROPIC_API_KEY);
  const compatibleApiKey = configuredSecret(
    environment.CURIOSITY_OPENAI_COMPATIBLE_API_KEY,
  );
  const googleApiKey = configuredSecret(
    environment.GOOGLE_GENERATIVE_AI_API_KEY,
  );
  const openAiApiKey = configuredSecret(environment.OPENAI_API_KEY);
  const registry = createProviderRegistry({
    anthropic: createAnthropic(
      anthropicApiKey ? { apiKey: anthropicApiKey } : {},
    ),
    compatible: createOpenAICompatible({
      ...(compatibleApiKey ? { apiKey: compatibleApiKey } : {}),
      baseURL: compatibleBaseUrl,
      name: "curiosity-openai-compatible",
    }),
    google: createGoogleGenerativeAI(
      googleApiKey ? { apiKey: googleApiKey } : {},
    ),
    openai: createOpenAI(openAiApiKey ? { apiKey: openAiApiKey } : {}),
    "openai-oauth": createOpenAIOAuth(openaiCredentials()),
  });
  const model = registry.languageModel(
    modelId as
      | `anthropic:${string}`
      | `compatible:${string}`
      | `google:${string}`
      | `openai:${string}`
      | `openai-oauth:${string}`,
  );

  const generator: TextGenerator = {
    effort,
    modelId,
    stream: async function* ({ abortSignal, messages, tools = [] }) {
      const prompt = splitAiSdkPrompt(messages);
      const modelTools = Object.fromEntries(
        tools.map((definition) => [
          definition.name,
          tool({
            description: definition.description,
            inputSchema: jsonSchema(definition.inputSchema as never),
          }),
        ]),
      ) as ToolSet;
      const result = streamText({
        abortSignal,
        messages: prompt.messages.map((message) => ({
          content: message.content,
          role: message.role,
        })),
        model,
        ...(prompt.system ? { system: prompt.system } : {}),
        ...(tools.length > 0 ? { tools: modelTools } : {}),
        ...(effort === "default"
          ? {}
          : { providerOptions: { openai: { reasoningEffort: effort } } }),
      });
      let completed = false;
      for await (const part of result.fullStream) {
        if (part.type === "text-delta") yield part.text;
        if (part.type === "tool-call")
          yield {
            input: part.input,
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            type: "tool-call" as const,
          };
        if (part.type === "error")
          throw new Error(aiSdkStreamFailureCode(providerId, part.error));
        if (part.type === "abort") throw new Error("AI_SDK_STREAM_ABORTED");
        if (part.type === "finish") completed = true;
      }
      if (!completed) throw new Error("AI_SDK_STREAM_INCOMPLETE");
    },
  };
  return Object.freeze(generator);
};
