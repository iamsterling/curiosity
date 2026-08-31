import { describe, expect, test } from "bun:test";
import {
  applePlatformDesktopCapabilities,
  applePlatformProfileIds,
  applePlatformQualificationEvidence,
  createApplePlatformCapabilityProfile,
  type ApplePlatformQualification,
  type ApplePlatformCapabilityProfileInput,
} from "../src/index.js";

const create = (input: ApplePlatformCapabilityProfileInput) =>
  createApplePlatformCapabilityProfile(input);

describe("Apple platform capability profiles", () => {
  test("constructs deterministic frozen baseline profiles for every exact ID", () => {
    const profiles = applePlatformProfileIds.map((profileId) =>
      create({ profileId }),
    );

    expect(profiles.map(({ profileId }) => profileId)).toEqual([
      "iphone",
      "ipad",
      "macos-sandboxed",
      "macos-workstation",
    ]);
    for (const profile of profiles) {
      expect(profile.capabilityCeiling).toEqual([
        "documents.read",
        "provider.generate",
      ]);
      expect(profile.qualifications).toEqual([]);
      expect(Object.isFrozen(profile)).toBe(true);
      expect(Object.isFrozen(profile.capabilityCeiling)).toBe(true);
      expect(Object.isFrozen(profile.qualifications)).toBe(true);
    }
    expect(applePlatformQualificationEvidence).toEqual([]);
    expect(Object.isFrozen(applePlatformQualificationEvidence)).toBe(true);
    expect(profiles.map(({ runtimeFamily }) => runtimeFamily)).toEqual([
      "ios",
      "ios",
      "macos",
      "macos",
    ]);
  });

  test("fails closed for unknown profiles and malformed qualifications", () => {
    expect(() =>
      create({
        profileId:
          "visionos" as ApplePlatformCapabilityProfileInput["profileId"],
      }),
    ).toThrow("APPLE_PLATFORM_PROFILE_INVALID");
    expect(() =>
      create({
        profileId: "macos-workstation",
        qualifications: [
          { capability: "git.read", evidenceId: "contains spaces" },
        ],
      }),
    ).toThrow("APPLE_PLATFORM_QUALIFICATION_INVALID");
    expect(() =>
      create(null as unknown as ApplePlatformCapabilityProfileInput),
    ).toThrow("APPLE_PLATFORM_PROFILE_INVALID");
    expect(() =>
      create({
        profileId: "macos-workstation",
        qualifications: [null as unknown as ApplePlatformQualification],
      }),
    ).toThrow("APPLE_PLATFORM_QUALIFICATION_INVALID");
    expect(() =>
      create({
        profileId: "macos-workstation",
        qualifications: [
          { capability: "git.read", evidenceId: "QMAC-GIT-001" },
          { capability: "git.read", evidenceId: "QMAC-GIT-002" },
        ],
      }),
    ).toThrow("APPLE_PLATFORM_QUALIFICATION_INVALID");
    expect(() =>
      create({
        profileId: "macos-workstation",
        qualifications: [
          { capability: "git.read", evidenceId: "QMAC-SHARED-001" },
          { capability: "process.execution", evidenceId: "QMAC-SHARED-001" },
        ],
      }),
    ).toThrow("APPLE_PLATFORM_QUALIFICATION_INVALID");
  });

  test("rejects every desktop qualification outside the workstation profile", () => {
    for (const profileId of ["iphone", "ipad", "macos-sandboxed"] as const) {
      for (const capability of applePlatformDesktopCapabilities) {
        expect(() =>
          create({
            profileId,
            qualifications: [{ capability, evidenceId: `Q-${capability}` }],
          }),
        ).toThrow("APPLE_PLATFORM_CAPABILITY_INELIGIBLE");
      }
    }
  });

  test("rejects unregistered workstation evidence without widening authority", () => {
    for (const qualification of [
      { capability: "git.read", evidenceId: "QMAC-GIT-READ-001" },
      {
        capability: "process.execution",
        evidenceId: "QMAC-PROCESS-001",
      },
    ] as const) {
      expect(() =>
        create({
          profileId: "macos-workstation",
          qualifications: [qualification],
        }),
      ).toThrow("APPLE_PLATFORM_QUALIFICATION_UNAVAILABLE");
    }
    expect(
      create({ profileId: "macos-workstation" }).capabilityCeiling,
    ).toEqual(["documents.read", "provider.generate"]);
  });
});
