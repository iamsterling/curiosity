export interface PromptMessage {
  readonly content: string;
  readonly role: "system" | "user" | "assistant";
}

export interface TextToolDefinition {
  readonly description: string;
  readonly inputSchema: unknown;
  readonly name: string;
  readonly version: string;
}

export type TextGenerationPart =
  | string
  | { readonly text: string; readonly type: "text-delta" }
  | {
      readonly input: unknown;
      readonly toolCallId: string;
      readonly toolName: string;
      readonly type: "tool-call";
    };

export interface TextGenerationRequest {
  readonly abortSignal: AbortSignal;
  readonly messages: readonly PromptMessage[];
  readonly tools?: readonly TextToolDefinition[];
}

export interface TextGenerator {
  readonly effort: string;
  readonly modelId: string;
  readonly stream: (
    request: TextGenerationRequest,
  ) => AsyncIterable<TextGenerationPart>;
}

export interface ProviderRouteConfig {
  readonly adapterVersion: string;
  readonly generator: TextGenerator;
  readonly routeId: string;
}
