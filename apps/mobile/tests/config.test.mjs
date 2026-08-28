import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sceneLifecyclePlugin from "../plugins/with-ios-scene-lifecycle.cjs";

test("mobile package is an iPhone and multitasking iPad Expo target", async () => {
  const app = JSON.parse(
    await readFile(new URL("../app.json", import.meta.url), "utf8"),
  ).expo;
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );

  assert.deepEqual(app.platforms, ["ios"]);
  assert.equal(app.ios.supportsTablet, true);
  assert.equal(app.ios.requireFullScreen, false);
  assert.match(app.ios.infoPlist.NSLocalNetworkUsageDescription, /Curiosity/u);
  assert.deepEqual(app.plugins, [
    "./plugins/with-ios-scene-lifecycle.cjs",
    "expo-router",
  ]);
  assert.equal(app.userInterfaceStyle, "automatic");
  assert.equal(packageJson.main, "expo-router/entry");
  assert.equal(packageJson.dependencies["@expo/ui"], "~57.0.14");
  assert.equal(packageJson.dependencies["expo-router"], "~57.0.17");
  assert.equal(packageJson.dependencies["react-native-drawer-layout"], "4.2.10");
  assert.equal(packageJson.dependencies["react-native-gesture-handler"], "~2.32.0");
  assert.equal(packageJson.dependencies["react-native-reanimated"], "4.5.1");
});

test("mobile icon is an opaque 1024px PNG", async () => {
  const icon = await readFile(new URL("../assets/icon.png", import.meta.url));
  assert.deepEqual(icon.subarray(1, 4), Buffer.from("PNG"));
  assert.equal(icon.readUInt32BE(16), 1024);
  assert.equal(icon.readUInt32BE(20), 1024);
  assert.equal(icon[25], 2);
});

test("native controls cross the SwiftUI host boundary explicitly", async () => {
  const craft = await readFile(
    new URL("../src/components/craft-surface.tsx", import.meta.url),
    "utf8",
  );
  const issues = await readFile(
    new URL("../src/components/issues-surface.tsx", import.meta.url),
    "utf8",
  );
  const memory = await readFile(
    new URL("../src/components/memory-surface.tsx", import.meta.url),
    "utf8",
  );
  const audio = await readFile(
    new URL("../src/components/audio-surface.tsx", import.meta.url),
    "utf8",
  );
  const surfaceSwitcher = await readFile(
    new URL("../src/components/surface-switcher.tsx", import.meta.url),
    "utf8",
  );
  const composer = await readFile(
    new URL("../src/components/composer.tsx", import.meta.url),
    "utf8",
  );
  const glassPanel = await readFile(
    new URL("../src/components/glass-panel.tsx", import.meta.url),
    "utf8",
  );
  const workspace = await readFile(
    new URL("../src/screens/workspace-screen.tsx", import.meta.url),
    "utf8",
  );
  const sidebar = await readFile(
    new URL("../src/components/workspace-sidebar.tsx", import.meta.url),
    "utf8",
  );
  const theme = await readFile(
    new URL("../src/theme.ts", import.meta.url),
    "utf8",
  );

  assert.match(craft, /CRAFT \/ DOCUMENT/u);
  assert.match(craft, /LAYERS/u);
  assert.match(craft, /INSPECTOR/u);
  assert.match(issues, /CUR-42/u);
  assert.match(issues, /In progress/u);
  assert.match(memory, /OBSERVE/u);
  assert.match(memory, /ADJUDICATE/u);
  assert.match(memory, /SYNTHESIZE/u);
  assert.match(memory, /BITEMPORAL SCOPE/u);
  assert.match(memory, /decision_based_on/u);
  assert.match(audio, /BAR · BEAT · TICK/u);
  assert.match(audio, /AUDIO ENGINE NOT IMPLEMENTED/u);
  assert.match(surfaceSwitcher, /Issues/u);
  assert.match(surfaceSwitcher, /Chat/u);
  assert.match(surfaceSwitcher, /Craft/u);
  assert.match(surfaceSwitcher, /Memory/u);
  assert.match(surfaceSwitcher, /Audio/u);
  assert.match(composer, /@expo\/ui\/swift-ui/u);
  assert.match(composer, /<Host/u);
  assert.match(composer, /<GlassEffectContainer/u);
  assert.match(composer, /<TextField/u);
  assert.doesNotMatch(composer, /TextInput/u);
  assert.match(composer, /<HStack[\s\S]*glassEffect[\s\S]*<TextField[\s\S]*<Button/u);
  assert.match(composer, /buttonStyle\("plain"\)/u);
  assert.match(glassPanel, /glassEffect/u);
  assert.match(glassPanel, /variant: "regular"/u);
  assert.match(workspace, /headerBackground: \(\) => null/u);
  assert.match(workspace, /headerTitle: ""/u);
  assert.match(workspace, /headerTransparent: true/u);
  assert.match(workspace, /title: ""/u);
  assert.match(workspace, /<Stack\.Toolbar/u);
  assert.match(workspace, /<Drawer/u);
  assert.match(workspace, /style=\{styles\.composerOverlay\}/u);
  assert.match(workspace, /useState<WorkspaceView>\("issues"\)/u);
  assert.doesNotMatch(workspace, /AtmosphericBackdrop|ModeSelector|appModes/u);
  assert.match(sidebar, /PROJECTS/u);
  assert.match(sidebar, /CONVERSATIONS · \{threads\.length\}/u);
  assert.match(sidebar, /PROJECT SYSTEM/u);
  assert.match(sidebar, /Session connected/u);
  assert.doesNotMatch(theme, /atmosphereBlue|atmosphereGreen|atmosphereViolet/u);
});

test("iOS prebuild adopts the required single-scene lifecycle", () => {
  const source = `class AppDelegate {
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return true
  }
}

class ReactNativeDelegate {}`;
  const patched = sceneLifecyclePlugin.patchAppDelegate(source);

  assert.match(patched, /class SceneDelegate: UIResponder, UIWindowSceneDelegate/u);
  assert.doesNotMatch(patched, /UIWindow\(frame: UIScreen\.main\.bounds\)/u);
  assert.equal(sceneLifecyclePlugin.patchAppDelegate(patched), patched);
  assert.equal(
    sceneLifecyclePlugin.sceneManifest.UIApplicationSupportsMultipleScenes,
    false,
  );
});

test("iPad workstation commands use a prebuild-safe native menu bridge", async () => {
  const moduleConfig = JSON.parse(
    await readFile(
      new URL(
        "../modules/curiosity-commands/expo-module.config.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const nativeModule = await readFile(
    new URL(
      "../modules/curiosity-commands/ios/CuriosityCommandsModule.swift",
      import.meta.url,
    ),
    "utf8",
  );
  const registry = await readFile(
    new URL("../src/commands/workstation-commands.ts", import.meta.url),
    "utf8",
  );
  const nativeClient = await readFile(
    new URL(
      "../modules/curiosity-commands/src/CuriosityCommandsModule.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.deepEqual(moduleConfig.apple.appDelegateSubscribers, [
    "CuriosityCommandsAppDelegateSubscriber",
  ]);
  assert.match(nativeModule, /UIMainMenuSystem\.shared\.setBuildConfiguration/u);
  assert.match(nativeModule, /UIKeyCommand/u);
  assert.match(nativeModule, /curiosityPerformCommand/u);
  assert.match(nativeModule, /Events\(commandEvent\)/u);
  assert.match(nativeClient, /requireOptionalNativeModule/u);
  assert.match(registry, /curiosity\.file\.newChat/u);
  assert.match(registry, /curiosity\.work\.commandPalette/u);
  assert.match(registry, /curiosity\.view\.toggleSidebar/u);
});
