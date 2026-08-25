import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenAIOAuth } from "@openai-oauth/ai-sdk";
import { openaiCredentials } from "@openai-oauth/local";
import { createProviderRegistry, streamText } from "ai";
import type { TextGenerator } from "../kernel/text-generator.js";

type ProviderEnvironment = Readonly<Record<string, string | undefined>>;

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

const configured = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const configuredSecret = (value: string | undefined): string | undefined =>
  configured(value) ? value : undefined;

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
    (providerId === "openai" || providerId === "openai-oauth")
  )
    return "medium";
  return "default";
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
    stream: async function* ({ abortSignal, messages }) {
      const result = streamText({
        abortSignal,
        messages: messages.map((message) => ({
          content: message.content,
          role: message.role,
        })),
        model,
        ...(effort === "default"
          ? {}
          : { providerOptions: { openai: { reasoningEffort: effort } } }),
      });
      let completed = false;
      for await (const part of result.fullStream) {
        if (part.type === "text-delta") yield part.text;
        if (part.type === "error") throw new Error("AI_SDK_STREAM_FAILED");
        if (part.type === "abort") throw new Error("AI_SDK_STREAM_ABORTED");
        if (part.type === "finish") completed = true;
      }
      if (!completed) throw new Error("AI_SDK_STREAM_INCOMPLETE");
    },
  };
  return Object.freeze(generator);
};
