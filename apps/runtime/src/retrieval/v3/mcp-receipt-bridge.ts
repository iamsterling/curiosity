export interface McpReceiptContext {
  readonly requestId: string;
  readonly authenticatedContextRef: string;
  readonly sessionRef: string;
  readonly agentRef: string;
  readonly messageRef: string;
  readonly parentCallRef: string;
  readonly canonicalInputDigest: string;
}

export interface McpReceiptItem {
  readonly title: string;
  readonly excerpt: string;
  readonly sourceLocator: string;
  readonly observedAt: string;
}

interface McpReceiptIntent extends McpReceiptContext {
  readonly intentRef: string;
  readonly nonceRef: string;
  readonly expiresAtUnixMs: number;
}

interface CapturedMcpReceipt extends McpReceiptIntent {
  readonly receiptRef: string;
  readonly compatibilityMode: "MODEL_MEDIATED";
  readonly capturedAt: string;
  readonly result: readonly McpReceiptItem[];
}

type Entry = {
  readonly intent: McpReceiptIntent;
  captured?: CapturedMcpReceipt;
  settlementDigest?: string;
  used: boolean;
};

const capabilityBrand = Symbol("curiosity.mcp-receipt-consumer");
export type McpConsumerCapability = { readonly [capabilityBrand]: true };
const consumers = new WeakMap<
  object,
  (expected: McpReceiptExpectation) => McpConsumeOutcome
>();

export interface McpReceiptExpectation extends McpReceiptContext {
  readonly intentRef: string;
}

export type McpConsumeOutcome =
  | { readonly status: "AVAILABLE"; readonly receipt: CapturedMcpReceipt }
  | { readonly status: "UNSUPPORTED"; readonly code: string };

const validId = (value: string): boolean =>
  value.length > 0 &&
  Buffer.byteLength(value) <= 128 &&
  /^[A-Za-z0-9][A-Za-z0-9:._/-]*$/u.test(value);

const canonical = (value: unknown): string =>
  Array.isArray(value)
    ? `[${value.map(canonical).join(",")}]`
    : value && typeof value === "object"
      ? `{${Object.entries(value)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
          .join(",")}}`
      : JSON.stringify(value);

const digestInput = (value: unknown): string =>
  new Bun.CryptoHasher("sha256").update(canonical(value)).digest("hex");

const validContext = (value: McpReceiptContext): boolean =>
  [
    value.requestId,
    value.authenticatedContextRef,
    value.sessionRef,
    value.agentRef,
    value.messageRef,
    value.parentCallRef,
  ].every(validId) && /^sha256:[a-f0-9]{64}$/u.test(value.canonicalInputDigest);

const sameContext = (
  left: McpReceiptContext,
  right: McpReceiptContext,
): boolean =>
  left.requestId === right.requestId &&
  left.authenticatedContextRef === right.authenticatedContextRef &&
  left.sessionRef === right.sessionRef &&
  left.agentRef === right.agentRef &&
  left.messageRef === right.messageRef &&
  left.parentCallRef === right.parentCallRef &&
  left.canonicalInputDigest === right.canonicalInputDigest;

const validItem = (item: McpReceiptItem): boolean =>
  item.title.length > 0 &&
  Buffer.byteLength(item.title) <= 300 &&
  item.excerpt.length > 0 &&
  Buffer.byteLength(item.excerpt) <= 2_000 &&
  /^https:\/\//u.test(item.sourceLocator) &&
  Buffer.byteLength(item.sourceLocator) <= 2_048 &&
  Number.isFinite(Date.parse(item.observedAt));

export const consumeMcpCapability = (
  capability: McpConsumerCapability | undefined,
  expected: McpReceiptExpectation,
): McpConsumeOutcome => {
  if (!capability || typeof capability !== "object")
    return { status: "UNSUPPORTED", code: "MCP_RECEIPT_CAPABILITY_INVALID" };
  const consume = consumers.get(capability);
  return (
    consume?.(expected) ?? {
      status: "UNSUPPORTED",
      code: "MCP_RECEIPT_CAPABILITY_INVALID",
    }
  );
};

/** Pure compatibility state machine. It performs no MCP or OpenCode call. */
export const createMcpReceiptBridge = (options: {
  readonly enabled: boolean;
  readonly compatibilityMode: "MODEL_MEDIATED";
  readonly now: () => number;
}) => {
  const entries = new Map<string, Entry>();
  const receiptSettlements = new Map<string, string>();
  let nonce = 0;

  const consume = (expected: McpReceiptExpectation): McpConsumeOutcome => {
    const entry = entries.get(expected.intentRef);
    if (!entry)
      return { status: "UNSUPPORTED", code: "MCP_RECEIPT_NOT_AVAILABLE" };
    if (options.now() > entry.intent.expiresAtUnixMs)
      return { status: "UNSUPPORTED", code: "MCP_RECEIPT_EXPIRED" };
    if (!validContext(expected) || !sameContext(entry.intent, expected))
      return { status: "UNSUPPORTED", code: "MCP_RECEIPT_CONTEXT_MISMATCH" };
    if (entry.used)
      return { status: "UNSUPPORTED", code: "MCP_RECEIPT_ALREADY_USED" };
    if (!entry.captured)
      return { status: "UNSUPPORTED", code: "MCP_RECEIPT_NOT_AVAILABLE" };
    entry.used = true;
    return { status: "AVAILABLE", receipt: structuredClone(entry.captured) };
  };

  return {
    issue(input: Omit<McpReceiptIntent, "nonceRef">): McpReceiptIntent {
      if (!options.enabled) throw new Error("MCP_RECEIPT_BRIDGE_DISABLED");
      if (
        !validId(input.intentRef) ||
        !validContext(input) ||
        !Number.isSafeInteger(input.expiresAtUnixMs) ||
        input.expiresAtUnixMs < 0 ||
        entries.has(input.intentRef)
      )
        throw new Error("MCP_RECEIPT_INTENT_INVALID");
      nonce += 1;
      const intent = { ...input, nonceRef: `nonce:${nonce}` };
      entries.set(input.intentRef, { intent, used: false });
      return intent;
    },

    capture(
      input: McpReceiptIntent & {
        readonly hostAuthenticated: boolean;
        readonly result: readonly McpReceiptItem[];
      },
    ): { readonly status: "CAPTURED" | "COLLISION" | "UNSUPPORTED" } {
      const entry = entries.get(input.intentRef);
      if (
        !entry ||
        !options.enabled ||
        !input.hostAuthenticated ||
        !sameContext(entry.intent, input) ||
        entry.intent.nonceRef !== input.nonceRef ||
        options.now() > entry.intent.expiresAtUnixMs ||
        input.result.length > 10 ||
        !input.result.every(validItem)
      )
        return { status: "UNSUPPORTED" };

      const capturedAt = new Date(options.now()).toISOString();
      const settlement = {
        intent: entry.intent,
        compatibilityMode: options.compatibilityMode,
        capturedAt,
        result: input.result,
      };
      const settlementDigest = digestInput(settlement);
      if (entry.captured)
        return {
          status:
            entry.settlementDigest === settlementDigest
              ? "CAPTURED"
              : "COLLISION",
        };

      const receiptRef = `mcp-receipt:sha256:${settlementDigest}`;
      const priorSettlement = receiptSettlements.get(receiptRef);
      if (
        priorSettlement !== undefined &&
        priorSettlement !== canonical(settlement)
      )
        return { status: "COLLISION" };
      receiptSettlements.set(receiptRef, canonical(settlement));
      entry.settlementDigest = settlementDigest;
      entry.captured = {
        ...entry.intent,
        receiptRef,
        compatibilityMode: options.compatibilityMode,
        capturedAt,
        result: input.result.map((item) => ({ ...item })),
      };
      return { status: "CAPTURED" };
    },

    consumer(): McpConsumerCapability {
      const capability = Object.freeze({
        [capabilityBrand]: true,
      }) as McpConsumerCapability;
      consumers.set(capability, consume);
      return capability;
    },
  };
};
