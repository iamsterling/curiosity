import assert from "node:assert/strict";
import { test } from "bun:test";
import { createMobileApplePlatformProfile } from "../src/mobile-platform-profile.ts";

test("mobile platform selection maps exact iOS idioms to bounded profiles", () => {
  const phone = createMobileApplePlatformProfile({
    operatingSystem: "ios",
    userInterfaceIdiom: "phone",
  });
  const tablet = createMobileApplePlatformProfile({
    operatingSystem: "ios",
    userInterfaceIdiom: "tablet",
  });

  assert.equal(phone.profileId, "iphone");
  assert.equal(tablet.profileId, "ipad");
  assert.deepEqual(phone.capabilityCeiling, [
    "documents.read",
    "provider.generate",
  ]);
  assert.deepEqual(tablet.capabilityCeiling, phone.capabilityCeiling);
});

test("mobile platform selection fails closed outside the iOS host", () => {
  assert.throws(
    () =>
      createMobileApplePlatformProfile({
        operatingSystem: "android",
        userInterfaceIdiom: "phone",
      }),
    /APPLE_MOBILE_PLATFORM_UNSUPPORTED/u,
  );
  assert.throws(
    () =>
      createMobileApplePlatformProfile({
        operatingSystem: "ios",
        userInterfaceIdiom: "desktop",
      }),
    /APPLE_MOBILE_PLATFORM_UNSUPPORTED/u,
  );
});
