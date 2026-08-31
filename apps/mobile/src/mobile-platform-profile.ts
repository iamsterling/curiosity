import {
  createApplePlatformCapabilityProfile,
  PortableAuthorityError,
  type ApplePlatformCapabilityProfile,
} from "@curiosity/authority";

export type MobileAppleUserInterfaceIdiom = "phone" | "tablet";

export interface MobileApplePlatformDescriptor {
  readonly operatingSystem: string;
  readonly userInterfaceIdiom: MobileAppleUserInterfaceIdiom;
}

export const createMobileApplePlatformProfile = (
  descriptor: MobileApplePlatformDescriptor,
): ApplePlatformCapabilityProfile => {
  if (
    descriptor.operatingSystem !== "ios" ||
    (descriptor.userInterfaceIdiom !== "phone" &&
      descriptor.userInterfaceIdiom !== "tablet")
  )
    throw new PortableAuthorityError("APPLE_MOBILE_PLATFORM_UNSUPPORTED");
  return createApplePlatformCapabilityProfile({
    profileId: descriptor.userInterfaceIdiom === "tablet" ? "ipad" : "iphone",
  });
};
