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
  assert.equal(app.ios.infoPlist?.CuriosityBrokerOrigin, undefined);
  assert.equal(app.ios.infoPlist?.NSLocalNetworkUsageDescription, undefined);
  assert.equal(
    app.ios.infoPlist?.NSAppTransportSecurity?.NSAllowsLocalNetworking,
    undefined,
  );
  assert.deepEqual(app.plugins, [
    "./plugins/with-ios-scene-lifecycle.cjs",
    "expo-router",
  ]);
  assert.equal(app.userInterfaceStyle, "automatic");
  assert.equal(packageJson.main, "expo-router/entry");
  assert.equal(packageJson.dependencies["@expo/ui"], "~57.0.14");
  assert.equal(packageJson.dependencies["@curiosity/authority"], "workspace:*");
  assert.equal(packageJson.dependencies["@crafty/editor"], "workspace:*");
  assert.equal(packageJson.dependencies["expo-router"], "~57.0.17");
  assert.equal(packageJson.dependencies["expo-crypto"], "~57.0.2");
  assert.equal(
    packageJson.dependencies["react-native-drawer-layout"],
    "4.2.10",
  );
  assert.equal(
    packageJson.dependencies["react-native-gesture-handler"],
    "~2.32.0",
  );
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
  const nestedSidebar = await readFile(
    new URL("../src/components/nested-sidebar.tsx", import.meta.url),
    "utf8",
  );
  const workspaceToolbar = await readFile(
    new URL("../src/components/workspace-toolbar.tsx", import.meta.url),
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
  const theme = await readFile(
    new URL("../src/theme.ts", import.meta.url),
    "utf8",
  );

  assert.match(craft, /CRAFT \/ DOCUMENT/u);
  assert.match(craft, /LAYERS/u);
  assert.match(craft, /INSPECTOR/u);
  assert.match(issues, /Lifecycle bridge stalls after scene resize/u);
  assert.match(issues, /Ready for review/u);
  assert.match(issues, /In progress/u);
  assert.match(issues, /Issues Inspector/u);
  assert.match(memory, /OBSERVE/u);
  assert.match(memory, /ADJUDICATE/u);
  assert.match(memory, /SYNTHESIZE/u);
  assert.match(memory, /BITEMPORAL SCOPE/u);
  assert.match(memory, /decision_based_on/u);
  assert.match(audio, /BAR · BEAT · TICK/u);
  assert.match(audio, /AUDIO ENGINE NOT IMPLEMENTED/u);
  assert.match(nestedSidebar, /NotesSourceSidebar/u);
  assert.match(nestedSidebar, /NotesArtifactList/u);
  assert.match(nestedSidebar, /onSelectCollection/u);
  assert.match(nestedSidebar, /onOpenThread/u);
  assert.match(nestedSidebar, /navigationLevel/u);
  assert.match(workspaceToolbar, /Show sessions/u);
  assert.match(composer, /@expo\/ui\/swift-ui/u);
  assert.match(composer, /<Host/u);
  assert.match(composer, /<GlassEffectContainer/u);
  assert.match(composer, /<TextField/u);
  assert.doesNotMatch(composer, /TextInput/u);
  assert.match(
    composer,
    /<HStack[\s\S]*glassEffect[\s\S]*<TextField[\s\S]*<Button/u,
  );
  assert.match(composer, /buttonStyle\("plain"\)/u);
  assert.match(glassPanel, /glassEffect/u);
  assert.match(glassPanel, /variant: "regular"/u);
  assert.match(workspace, /headerShown: false/u);
  assert.match(workspace, /edges=\{\["left", "right"\]\}/u);
  assert.doesNotMatch(workspace, /"left", "right", "bottom"/u);
  assert.match(workspace, /title: ""/u);
  assert.match(workspace, /style=\{styles\.composerOverlay\}/u);
  assert.match(workspace, /useState<WorkspaceView>\("chat"\)/u);
  assert.doesNotMatch(workspace, /AtmosphericBackdrop|ModeSelector|appModes/u);
  assert.match(workspace, /<NestedSidebar/u);
  assert.doesNotMatch(workspace, /SurfaceSwitcher/u);
  assert.match(workspaceToolbar, /buttonStyle\("glass"\)/u);
  assert.doesNotMatch(nestedSidebar, /runtimeStatusLabel/u);
  assert.doesNotMatch(workspaceToolbar, /<Picker|pickerStyle\("segmented"\)/u);
  assert.doesNotMatch(
    nestedSidebar,
    /Session connected|Session offline|serverUrl/u,
  );
  assert.doesNotMatch(
    theme,
    /atmosphereBlue|atmosphereGreen|atmosphereViolet/u,
  );
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

  assert.match(
    patched,
    /class SceneDelegate: UIResponder, UIWindowSceneDelegate/u,
  );
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
  assert.match(
    nativeModule,
    /UIMainMenuSystem\.shared\.setBuildConfiguration/u,
  );
  assert.match(nativeModule, /UIKeyCommand/u);
  assert.match(nativeModule, /curiosityPerformCommand/u);
  assert.match(nativeModule, /Events\(commandEvent\)/u);
  assert.match(nativeClient, /requireOptionalNativeModule/u);
  assert.match(registry, /curiosity\.file\.newChat/u);
  assert.match(registry, /curiosity\.work\.commandPalette/u);
  assert.doesNotMatch(registry, /curiosity\.view\.toggleSidebar/u);
});

test("Craft uses an Expo-native Metal canvas", async () => {
  const moduleConfig = JSON.parse(
    await readFile(
      new URL(
        "../modules/curiosity-canvas/expo-module.config.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const craft = await readFile(
    new URL("../src/components/craft-surface.tsx", import.meta.url),
    "utf8",
  );
  const nativeView = await readFile(
    new URL(
      "../modules/curiosity-canvas/ios/CuriosityCanvasView.swift",
      import.meta.url,
    ),
    "utf8",
  );
  const renderer = await readFile(
    new URL(
      "../modules/curiosity-canvas/ios/CuriosityCanvasRenderer.swift",
      import.meta.url,
    ),
    "utf8",
  );
  const podspec = await readFile(
    new URL(
      "../modules/curiosity-canvas/ios/CuriosityCanvas.podspec",
      import.meta.url,
    ),
    "utf8",
  );

  assert.deepEqual(moduleConfig.apple.modules, ["CuriosityCanvasModule"]);
  assert.match(craft, /<CuriosityCanvasView/u);
  assert.match(craft, /METAL RENDERER ONLINE/u);
  assert.doesNotMatch(craft, /ScrollView/u);
  assert.match(nativeView, /MTKView/u);
  assert.match(nativeView, /UIPinchGestureRecognizer/u);
  assert.match(nativeView, /onPointerInput/u);
  assert.match(nativeView, /onAccessibilityCommand/u);
  assert.doesNotMatch(nativeView, /EditorKernel|rectangle-portability/u);
  assert.match(renderer, /MTKViewDelegate/u);
  assert.match(renderer, /CuriosityCraftyRendererNativeHost/u);
  assert.match(renderer, /renderFrameJSON/u);
  assert.match(renderer, /updateFrameJSON/u);
  assert.doesNotMatch(
    renderer,
    /simd_float4x4|makeRenderPipelineState|CanvasScene|native-ffi-rectangle|rectangle-1/u,
  );
  assert.match(
    podspec,
    /CRAFTY_RENDERER_LIBRARY="\$\{PODS_CONFIGURATION_BUILD_DIR\}\/libcrafty_renderer_native_ffi\.a"/u,
  );
});

test("Craft feature work is gated by the canonical Crafty translation matrix", async () => {
  const matrix = await readFile(
    new URL("../design/CRAFT-IPAD-FEATURE-TRANSLATION.md", import.meta.url),
    "utf8",
  );
  const standards = await readFile(
    new URL("../design/APPLE-DESIGN-STANDARDS.md", import.meta.url),
    "utf8",
  );

  assert.match(standards, /CRAFT-IPAD-FEATURE-TRANSLATION\.md/u);
  assert.match(matrix, /EditorDocument.*one authored model/u);
  assert.match(matrix, /CanvasScene\.swift.*renderer proof/u);
  assert.match(matrix, /must not evolve[\s\S]*Swift-authored scene graph/u);
  assert.match(matrix, /versioned `RenderFrame`/u);
  assert.match(matrix, /Rust\/Vello\/wgpu Metal candidate/u);
  assert.match(matrix, /PencilKit as canonical pen/u);
  assert.match(matrix, /GPU-object accessibility and focus/u);
  assert.match(matrix, /Durable collaboration and local drafts/u);
  assert.match(matrix, /2D-to-3D evolution/u);
  assert.match(matrix, /CURIOSITY_NO_GO/u);
  assert.match(matrix, /## Stop decision/u);
});

test("Craft runs the canonical kernel portability gate from a real .ui package", async () => {
  const craft = await readFile(
    new URL("../src/components/craft-surface.tsx", import.meta.url),
    "utf8",
  );
  const gate = await readFile(
    new URL("../src/crafty/crafty-kernel-portability.ts", import.meta.url),
    "utf8",
  );
  const fixtureLoader = await readFile(
    new URL("../src/crafty/crafty-ui-fixture.ts", import.meta.url),
    "utf8",
  );
  const runtimeAdapter = await readFile(
    new URL("../src/crafty/crafty-runtime-adapter.ts", import.meta.url),
    "utf8",
  );
  const metro = await readFile(
    new URL("../metro.config.cjs", import.meta.url),
    "utf8",
  );

  assert.match(gate, /from "@crafty\/editor\/kernel"/u);
  assert.match(gate, /beginTransaction\("Cancel rectangle move"\)/u);
  assert.match(gate, /kernel\.rollback\(\)/u);
  assert.match(gate, /beginTransaction\("Move rectangle"\)/u);
  assert.match(gate, /kernel\.undo\(\)/u);
  assert.match(gate, /kernel\.redo\(\)/u);
  assert.match(fixtureLoader, /crafty-kernel-portability\.ui\/manifest\.ui/u);
  assert.match(fixtureLoader, /crafty-kernel-portability\.ui\/document-1\.ui/u);
  assert.match(runtimeAdapter, /structuredClone/u);
  assert.match(runtimeAdapter, /uuidv4/u);
  assert.match(metro, /moduleName\.endsWith\("\.js"\)/u);
  assert.match(craft, /CRAFTY KERNEL \/ \{kernelStatus\.toUpperCase\(\)\}/u);
});
