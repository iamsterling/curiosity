import { canonicalJson, utf8ByteLength } from "./canonical-json.js";
import { PortableAuthorityError, type Sha256 } from "./domain.js";

export const generationPurposes = [
  "agent.step",
  "intent.classify",
  "turn.answer",
  "memory.curate",
  "memory.rerank",
  "memory.compact",
  "retrieval.query",
  "title.generate",
] as const;

export type GenerationPurpose = (typeof generationPurposes)[number];

export type RoutePreference =
  | { readonly kind: "exact"; readonly routeId: string }
  | { readonly kind: "auto"; readonly policyId: string };

export interface GenerationSelection {
  readonly adapterVersion: string;
  readonly locality: "device" | "frontier";
  readonly modelId: string;
  readonly providerId: string;
  readonly purpose: GenerationPurpose;
  readonly requestedRouteId: string;
  readonly routeId: string;
  readonly selectionPolicyId: string;
}

export interface GenerationRouteReceipt extends GenerationSelection {
  readonly contextPlanId: string;
  readonly selectionId: string;
}

const selectionKeys = [
  "adapterVersion",
  "locality",
  "modelId",
  "providerId",
  "purpose",
  "requestedRouteId",
  "routeId",
  "selectionPolicyId",
] as const;
const receiptKeys = [
  ...selectionKeys,
  "contextPlanId",
  "selectionId",
] as const;
const identifierPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,255}$/u;
const digestPattern = /^[a-f0-9]{64}$/u;

const record = (value: unknown): Record<string, unknown> | undefined =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype
    ? (value as Record<string, unknown>)
    : undefined;

const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => Object.keys(value).sort().join(",") === [...keys].sort().join(",");

const identifier = (value: unknown): value is string =>
  typeof value === "string" &&
  utf8ByteLength(value) <= 256 &&
  identifierPattern.test(value);

export const validateGenerationSelection = (
  value: unknown,
): GenerationSelection => {
  const selection = record(value);
  if (
    !selection ||
    !hasExactKeys(selection, selectionKeys) ||
    !identifier(selection.adapterVersion) ||
    (selection.locality !== "device" && selection.locality !== "frontier") ||
    !identifier(selection.modelId) ||
    !identifier(selection.providerId) ||
    !generationPurposes.includes(selection.purpose as GenerationPurpose) ||
    !identifier(selection.requestedRouteId) ||
    !identifier(selection.routeId) ||
    !identifier(selection.selectionPolicyId)
  )
    throw new PortableAuthorityError("GENERATION_SELECTION_INVALID");
  return Object.freeze({
    adapterVersion: selection.adapterVersion,
    locality: selection.locality,
    modelId: selection.modelId,
    providerId: selection.providerId,
    purpose: selection.purpose as GenerationPurpose,
    requestedRouteId: selection.requestedRouteId,
    routeId: selection.routeId,
    selectionPolicyId: selection.selectionPolicyId,
  });
};

export const validateGenerationRouteReceipt = (
  value: unknown,
): GenerationRouteReceipt => {
  const receipt = record(value);
  if (
    !receipt ||
    !hasExactKeys(receipt, receiptKeys) ||
    typeof receipt.contextPlanId !== "string" ||
    !digestPattern.test(receipt.contextPlanId) ||
    typeof receipt.selectionId !== "string" ||
    !digestPattern.test(receipt.selectionId)
  )
    throw new PortableAuthorityError("GENERATION_ROUTE_RECEIPT_INVALID");
  const selection = validateGenerationSelection(
    Object.fromEntries(selectionKeys.map((key) => [key, receipt[key]])),
  );
  return Object.freeze({
    ...selection,
    contextPlanId: receipt.contextPlanId,
    selectionId: receipt.selectionId,
  });
};

export const createGenerationRouteReceipt = async (
  selection: GenerationSelection,
  turnId: string,
  contextPlanId: string,
  sha256: Sha256,
): Promise<GenerationRouteReceipt> => {
  if (!identifier(turnId) || !digestPattern.test(contextPlanId))
    throw new PortableAuthorityError("GENERATION_TURN_ID_INVALID");
  const validated = validateGenerationSelection(selection);
  const selectionId = await sha256(
    canonicalJson({ contextPlanId, schemaVersion: 1, selection: validated, turnId }),
  );
  return validateGenerationRouteReceipt({
    ...validated,
    contextPlanId,
    selectionId,
  });
};

export const appleOnDeviceGenerationSelection = (
  purpose: GenerationPurpose,
): GenerationSelection =>
  Object.freeze({
    adapterVersion: "foundation-models-v1",
    locality: "device",
    modelId: "apple:system-language-model",
    providerId: "apple",
    purpose,
    requestedRouteId: "on-device.apple",
    routeId: "on-device.apple",
    selectionPolicyId: "ipados-local-v1",
  });

export const onDeviceAppleGenerationSelection: GenerationSelection =
  appleOnDeviceGenerationSelection("turn.answer");
