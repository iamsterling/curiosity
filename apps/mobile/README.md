# Curiosity for iOS and iPadOS

Expo SDK 57 client for the governed Curiosity dashboard API. The app uses
React Native for adaptive screen composition and self-contained
`@expo/ui/swift-ui` hosts for native SwiftUI controls.

## Run

1. Keep the Curiosity web/API server reachable on the LAN.
2. Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_CURIOSITY_URL` to
   that server. Physical devices cannot use the development machine's
   `localhost`.
3. Run `bun run ios` from this directory. Expo Go can run the JavaScript UI via
   `bun run dev`, but the native iPadOS menu requires a development or Release
   build that includes the local Expo module.

The committed HTTP URL is for local development only. Production builds must
use an HTTPS endpoint.

For a local native build, run `bunx expo run:ios`. The checked-in config plugin
backports Expo's upstream UIKit scene-lifecycle template change so SDK 57 apps
built with Xcode 27 launch correctly. The generated `ios/` directory remains
ephemeral and is not committed.

The iPadOS command architecture and expansion priorities are documented in
[`docs/IPADOS-WORKSTATION-COMMANDS.md`](docs/IPADOS-WORKSTATION-COMMANDS.md).
