import { PortableAuthorityError } from "./domain.js";

export interface GenerationTransportReceipt {
  readonly callId: string;
  readonly maxRetries: 0;
  readonly transportAttempts: 1;
}

export const validateGenerationTransportReceipt = (
  value: unknown,
): GenerationTransportReceipt => {
  const receipt =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  if (
    !receipt ||
    Object.keys(receipt).sort().join(",") !==
      ["callId", "maxRetries", "transportAttempts"].sort().join(",") ||
    typeof receipt.callId !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,255}$/u.test(receipt.callId) ||
    receipt.maxRetries !== 0 ||
    receipt.transportAttempts !== 1
  )
    throw new PortableAuthorityError("GENERATION_TRANSPORT_RECEIPT_INVALID");
  return Object.freeze({
    callId: receipt.callId,
    maxRetries: 0,
    transportAttempts: 1,
  });
};
