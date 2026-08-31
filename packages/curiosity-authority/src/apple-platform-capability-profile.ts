import { PortableAuthorityError } from "./domain.js";

export const applePlatformProfileIds = Object.freeze([
  "iphone",
  "ipad",
  "macos-sandboxed",
  "macos-workstation",
] as const);

export type ApplePlatformProfileId = (typeof applePlatformProfileIds)[number];

export const applePlatformCapabilities = Object.freeze([
  "background.unattended",
  "documents.read",
  "external-harness.invoke",
  "filesystem.mutation",
  "filesystem.read",
  "git.mutation",
  "git.read",
  "process.execution",
  "provider.generate",
  "sandbox.execution",
] as const);

export type ApplePlatformCapability =
  (typeof applePlatformCapabilities)[number];

export const applePlatformDesktopCapabilities = Object.freeze([
  "background.unattended",
  "external-harness.invoke",
  "filesystem.mutation",
  "filesystem.read",
  "git.mutation",
  "git.read",
  "process.execution",
  "sandbox.execution",
] as const satisfies readonly ApplePlatformCapability[]);

export interface ApplePlatformQualification {
  readonly capability: ApplePlatformCapability;
  readonly evidenceId: string;
}

export interface ApplePlatformCapabilityProfile {
  readonly capabilityCeiling: readonly ApplePlatformCapability[];
  readonly profileId: ApplePlatformProfileId;
  readonly qualifications: readonly ApplePlatformQualification[];
  readonly runtimeFamily: "ios" | "macos";
  readonly schemaVersion: 1;
}

export interface ApplePlatformCapabilityProfileInput {
  readonly profileId: ApplePlatformProfileId;
  readonly qualifications?: readonly ApplePlatformQualification[];
}

export const applePlatformQualificationEvidence = Object.freeze(
  [] as readonly ApplePlatformQualification[],
);

const baselineCapabilities = Object.freeze([
  "documents.read",
  "provider.generate",
] as const satisfies readonly ApplePlatformCapability[]);
const capabilitySet = new Set<string>(applePlatformCapabilities);
const desktopCapabilitySet = new Set<string>(applePlatformDesktopCapabilities);
const profileIdSet = new Set<string>(applePlatformProfileIds);
const qualificationEvidenceByCapability = new Map(
  applePlatformQualificationEvidence.map(({ capability, evidenceId }) => [
    capability,
    evidenceId,
  ]),
);
const evidenceIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u;

const runtimeFamily = (
  profileId: ApplePlatformProfileId,
): ApplePlatformCapabilityProfile["runtimeFamily"] =>
  profileId === "iphone" || profileId === "ipad" ? "ios" : "macos";

const validatedQualifications = (
  profileId: ApplePlatformProfileId,
  qualifications: readonly ApplePlatformQualification[],
): readonly ApplePlatformQualification[] => {
  if (!Array.isArray(qualifications))
    throw new PortableAuthorityError("APPLE_PLATFORM_QUALIFICATION_INVALID");
  if (qualifications.length > applePlatformDesktopCapabilities.length)
    throw new PortableAuthorityError("APPLE_PLATFORM_QUALIFICATION_INVALID");

  const capabilities = new Set<string>();
  const evidenceIds = new Set<string>();
  const validated = qualifications.map((qualification) => {
    if (
      !qualification ||
      typeof qualification !== "object" ||
      Array.isArray(qualification)
    )
      throw new PortableAuthorityError("APPLE_PLATFORM_QUALIFICATION_INVALID");
    const { capability, evidenceId } = qualification;
    if (
      !capabilitySet.has(capability) ||
      typeof evidenceId !== "string" ||
      !evidenceIdPattern.test(evidenceId) ||
      capabilities.has(capability) ||
      evidenceIds.has(evidenceId)
    )
      throw new PortableAuthorityError("APPLE_PLATFORM_QUALIFICATION_INVALID");
    capabilities.add(capability);
    evidenceIds.add(evidenceId);
    return Object.freeze({ capability, evidenceId });
  });

  for (const { capability, evidenceId } of validated) {
    if (
      profileId !== "macos-workstation" ||
      !desktopCapabilitySet.has(capability)
    )
      throw new PortableAuthorityError("APPLE_PLATFORM_CAPABILITY_INELIGIBLE");
    if (qualificationEvidenceByCapability.get(capability) !== evidenceId)
      throw new PortableAuthorityError(
        "APPLE_PLATFORM_QUALIFICATION_UNAVAILABLE",
      );
  }

  return Object.freeze(
    validated.sort((left, right) =>
      left.capability.localeCompare(right.capability),
    ),
  );
};

export const createApplePlatformCapabilityProfile = (
  input: ApplePlatformCapabilityProfileInput,
): ApplePlatformCapabilityProfile => {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    !profileIdSet.has(input.profileId)
  )
    throw new PortableAuthorityError("APPLE_PLATFORM_PROFILE_INVALID");
  const qualifications = validatedQualifications(
    input.profileId,
    input.qualifications ?? [],
  );
  const capabilityCeiling = Object.freeze(
    [
      ...baselineCapabilities,
      ...qualifications.map(({ capability }) => capability),
    ].sort(),
  );
  return Object.freeze({
    capabilityCeiling,
    profileId: input.profileId,
    qualifications,
    runtimeFamily: runtimeFamily(input.profileId),
    schemaVersion: 1,
  });
};
