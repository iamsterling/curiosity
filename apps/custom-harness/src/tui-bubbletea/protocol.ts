export const TUI_PROTOCOL_VERSION = 1 as const;
export const TUI_PROTOCOL_FRAME_LIMIT = 1 << 20;

export interface TuiCapabilitySnapshot {
  readonly id: string;
  readonly reason: string;
  readonly state:
    | "catalogued"
    | "scaffolded"
    | "available"
    | "qualified"
    | "unavailable";
}

export interface TuiCatalogSnapshot {
  readonly commands: readonly {
    readonly description: string;
    readonly name: string;
    readonly status: "active" | "compatibility-deprecated";
  }[];
  readonly digest: string;
  readonly pluginIds: readonly string[];
  readonly toolNames: readonly string[];
  readonly workflowNames: readonly string[];
}

export interface TuiHostSnapshot {
  readonly actorId: string;
  readonly capabilities: readonly TuiCapabilitySnapshot[];
  readonly catalog: TuiCatalogSnapshot;
  readonly effort: string;
  readonly error: string;
  readonly inspectorText: string;
  readonly messages: readonly {
    readonly role: "assistant" | "user";
    readonly sequence: number;
    readonly text: string;
  }[];
  readonly modelId: string;
  readonly profile: string;
  readonly status: "idle" | "working";
  readonly streamingText: string;
  readonly submittedText: string;
  readonly threadId: string;
  readonly threadTitle: string;
  readonly workingDirectory: string;
}

export type TuiClientMessage =
  | { readonly type: "client.hello"; readonly payload: { readonly nonce: string } }
  | {
      readonly type: "client.turn.submit";
      readonly payload: { readonly text: string };
    }
  | { readonly type: "client.quit"; readonly payload: Readonly<Record<string, never>> };

export interface TuiHostMessage {
  readonly payload: TuiHostSnapshot | { readonly code: string };
  readonly type: "host.error" | "host.snapshot";
}

interface WireEnvelope {
  readonly payload: unknown;
  readonly type: string;
  readonly version: number;
}

const record = (value: unknown, error: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(error);
  return value as Record<string, unknown>;
};

const exactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
  error: string,
): void => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  )
    throw new Error(error);
};

const decodePayload = (
  envelope: WireEnvelope,
): TuiClientMessage["payload"] => {
  const payload = record(envelope.payload, "TUI_PROTOCOL_PAYLOAD_INVALID");
  if (envelope.type === "client.quit") {
    exactKeys(payload, [], "TUI_PROTOCOL_PAYLOAD_INVALID");
    return Object.freeze({});
  }
  if (envelope.type === "client.hello") {
    exactKeys(payload, ["nonce"], "TUI_PROTOCOL_PAYLOAD_INVALID");
    if (typeof payload.nonce !== "string" || !/^[a-f0-9]{64}$/u.test(payload.nonce))
      throw new Error("TUI_PROTOCOL_NONCE_INVALID");
    return Object.freeze({ nonce: payload.nonce });
  }
  if (envelope.type === "client.turn.submit") {
    exactKeys(payload, ["text"], "TUI_PROTOCOL_PAYLOAD_INVALID");
    if (
      typeof payload.text !== "string" ||
      !payload.text.trim() ||
      Buffer.byteLength(payload.text) > 64 * 1024
    )
      throw new Error("TUI_PROTOCOL_TURN_INVALID");
    return Object.freeze({ text: payload.text });
  }
  throw new Error("TUI_PROTOCOL_MESSAGE_UNSUPPORTED");
};

export const decodeTuiClientMessage = (value: unknown): TuiClientMessage => {
  const envelope = record(value, "TUI_PROTOCOL_FRAME_INVALID");
  exactKeys(envelope, ["payload", "type", "version"], "TUI_PROTOCOL_FRAME_INVALID");
  if (envelope.version !== TUI_PROTOCOL_VERSION || typeof envelope.type !== "string")
    throw new Error("TUI_PROTOCOL_VERSION_UNSUPPORTED");
  const wire: WireEnvelope = {
    payload: envelope.payload,
    type: envelope.type,
    version: envelope.version,
  };
  return Object.freeze({
    payload: decodePayload(wire),
    type: wire.type,
  }) as TuiClientMessage;
};

export const encodeTuiHostMessage = (message: TuiHostMessage): string => {
  const frame = `${JSON.stringify({
    payload: message.payload,
    type: message.type,
    version: TUI_PROTOCOL_VERSION,
  })}\n`;
  if (Buffer.byteLength(frame) > TUI_PROTOCOL_FRAME_LIMIT)
    throw new Error("TUI_PROTOCOL_FRAME_TOO_LARGE");
  return frame;
};
