export interface PromptMessage {
  readonly content: string;
  readonly role: "system" | "user" | "assistant";
}

export interface TextGenerationRequest {
  readonly abortSignal: AbortSignal;
  readonly messages: readonly PromptMessage[];
}

export interface TextGenerator {
  readonly effort: string;
  readonly modelId: string;
  readonly stream: (request: TextGenerationRequest) => AsyncIterable<string>;
}
