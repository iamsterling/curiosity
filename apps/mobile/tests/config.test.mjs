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
  const agents = await readFile(
    new URL("../src/screens/agent-activity-screen.tsx", import.meta.url),
    "utf8",
  );
  const settings = await readFile(
    new URL("../src/screens/settings-screen.tsx", import.meta.url),
    "utf8",
  );
  const workspaceRoutes = await readFile(
    new URL("../app/(app)/(project)/_layout.tsx", import.meta.url),
    "utf8",
  );
  const systemRoutes = await readFile(
    new URL("../app/(app)/(system)/_layout.tsx", import.meta.url),
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
  const projectLayout = await readFile(
    new URL(
      "../app/(app)/(project)/projects/[projectId]/_layout.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const organizationSelector = await readFile(
    new URL("../src/components/organization-selector.tsx", import.meta.url),
    "utf8",
  );
  const sourceSidebar = await readFile(
    new URL("../src/components/parent-sidebar-content.tsx", import.meta.url),
    "utf8",
  );
  const parentShell = await readFile(
    new URL("../src/components/parent-sidebar-shell.tsx", import.meta.url),
    "utf8",
  );
  const parentController = await readFile(
    new URL("../src/use-parent-sidebar-controller.ts", import.meta.url),
    "utf8",
  );
  const appSidebarPrimitives = await readFile(
    new URL("../src/components/app-sidebar-primitives.tsx", import.meta.url),
    "utf8",
  );
  const rootLayout = await readFile(
    new URL("../app/(app)/_layout.tsx", import.meta.url),
    "utf8",
  );
  const defaultRoute = await readFile(
    new URL("../app/(app)/(overview)/index.tsx", import.meta.url),
    "utf8",
  );
  const systemShell = await readFile(
    new URL("../src/components/system-screen-shell.tsx", import.meta.url),
    "utf8",
  );
  const workspacePrimitives = await readFile(
    new URL(
      "../src/components/project-workspace-primitives.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const workspaceToolbar = await readFile(
    new URL("../src/components/project-route-toolbar.tsx", import.meta.url),
    "utf8",
  );
  const routeCanvas = await readFile(
    new URL("../src/components/project-route-canvas.tsx", import.meta.url),
    "utf8",
  );
  const toolbarPrimitives = await readFile(
    new URL("../src/components/project-toolbar-primitives.tsx", import.meta.url),
    "utf8",
  );
  const catalog = await readFile(
    new URL("../src/workspace-catalog-context.tsx", import.meta.url),
    "utf8",
  );
  const projectController = await readFile(
    new URL("../src/use-project-route-controller.ts", import.meta.url),
    "utf8",
  );
  const workspaceRouteBuilder = await readFile(
    new URL("../src/workspace-routes.ts", import.meta.url),
    "utf8",
  );
  const composer = await readFile(
    new URL("../src/components/composer.tsx", import.meta.url),
    "utf8",
  );
  const commandPalette = await readFile(
    new URL("../src/components/command-palette.tsx", import.meta.url),
    "utf8",
  );
  const glassPanel = await readFile(
    new URL("../src/components/glass-panel.tsx", import.meta.url),
    "utf8",
  );
  const workspace = await readFile(
    new URL("../src/screens/project-sessions-screen.tsx", import.meta.url),
    "utf8",
  );
  const theme = await readFile(
    new URL("../src/theme.ts", import.meta.url),
    "utf8",
  );

  assert.match(craft, /CRAFT \/ DOCUMENT/u);
  assert.match(craft, /LAYERS/u);
  assert.match(craft, /INSPECTOR/u);
  assert.match(agents, /Durable execution log across/u);
  assert.match(agents, /SUBAGENT · DEPTH/u);
  assert.match(agents, /listRunProjections|useAgentActivity/u);
  assert.match(settings, /Provider Connections/u);
  assert.match(settings, /Native Keychain/u);
  assert.match(workspaceRoutes, /headerShown: false/u);
  assert.match(systemRoutes, /headerShown: false/u);
  assert.match(workspaceRoutes, /animation: "none"/u);
  assert.match(systemRoutes, /animation: "none"/u);
  assert.match(rootLayout, /animation: "none"/u);
  assert.match(commandPalette, /animationType="none"/u);
  assert.match(memory, /OBSERVE/u);
  assert.match(memory, /ADJUDICATE/u);
  assert.match(memory, /SYNTHESIZE/u);
  assert.match(memory, /BITEMPORAL SCOPE/u);
  assert.match(memory, /decision_based_on/u);
  assert.match(audio, /BAR · BEAT · TICK/u);
  assert.match(audio, /AUDIO ENGINE NOT IMPLEMENTED/u);
  assert.doesNotMatch(projectLayout, /NotesSourceSidebar/u);
  assert.equal((projectLayout.match(/ProjectNavigator/gu) ?? []).length, 2);
  assert.match(parentShell, /ParentSidebarContent/u);
  assert.match(parentShell, /react-native-drawer-layout/u);
  assert.match(parentShell, /drawerType="front"/u);
  assert.match(parentShell, /open=\{sidebar\.open\}/u);
  assert.match(parentShell, /swipeEnabled=\{false\}/u);
  assert.doesNotMatch(parentShell, /sidebar\.open \?/u);
  assert.match(rootLayout, /<ParentSidebarShell>/u);
  assert.match(rootLayout, /<Stack/u);
  assert.match(defaultRoute, /<Redirect href="\/projects\/curiosity\/sessions/u);
  assert.match(parentController, /parentSidebarOpen/u);
  assert.match(appSidebarPrimitives, /shadowOpacity/u);
  assert.doesNotMatch(parentShell, /sourceVisible|childVisible|width >= 700/u);
  assert.match(systemShell, /openParentSidebar/u);
  assert.match(workspaceToolbar, /onShowAppSidebar/u);
  assert.match(workspacePrimitives, /forwardRef/u);
  assert.match(projectLayout, /ProjectNavigator/u);
  assert.match(projectLayout, /<Slot/u);
  assert.match(projectLayout, /ProjectWorkspaceRoot/u);
  assert.match(parentShell, /onOpenProject/u);
  assert.match(projectLayout, /onOpenThread/u);
  assert.match(projectLayout, /project\.layout/u);
  assert.match(sourceSidebar, /OrganizationSelector/u);
  assert.doesNotMatch(sourceSidebar, /label="Search"/u);
  assert.match(sourceSidebar, /title="Activity"/u);
  assert.match(sourceSidebar, /Runs and agent activity/u);
  assert.match(sourceSidebar, /ORGANIZATION OVERVIEW/u);
  assert.match(sourceSidebar, /Project · 4 collections/u);
  assert.doesNotMatch(sourceSidebar, />Issues</u);
  assert.doesNotMatch(sourceSidebar, />Craft|>Audio|>Providers/u);
  assert.match(sourceSidebar, />\s*Projects\s*</u);
  assert.match(sourceSidebar, /AppSidebarNavigationFooter/u);
  assert.match(sourceSidebar, /Math\.max\(12, bottomInset\)/u);
  assert.match(organizationSelector, /<Menu/u);
  assert.match(organizationSelector, /buttonStyle\("glass"\)/u);
  assert.match(organizationSelector, /menuStyle\("button"\)/u);
  assert.match(organizationSelector, /New Organization…/u);
  assert.match(parentController, /Alert\.prompt/u);
  assert.match(parentController, /organizationRecentRoute/u);
  assert.match(parentController, /organizationAgentsRoute/u);
  assert.match(parentController, /navigateToProject\(project\)/u);
  assert.match(workspaceToolbar, /Show \$\{projectNavigationLabel\}/u);
  assert.match(workspaceToolbar, /<ProjectToolbarTitle>\{title\}/u);
  assert.match(projectLayout, /ProjectNavigator/u);
  assert.match(routeCanvas, /activeCollectionId === "sessions"/u);
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
  assert.match(parentShell, /edges=\{\["left", "right"\]\}/u);
  assert.doesNotMatch(parentShell, /"left", "right", "bottom"/u);
  assert.match(workspace, /<ProjectComposerOverlay>/u);
  assert.doesNotMatch(workspace, /AtmosphericBackdrop|ModeSelector|appModes/u);
  assert.doesNotMatch(workspace, /NestedSidebar|collectionForPath|view ===/u);
  assert.match(workspace, /<ProjectRouteCanvas/u);
  assert.match(routeCanvas, /<ProjectCanvasRoot/u);
  assert.doesNotMatch(workspace, /SurfaceSwitcher/u);
  assert.match(toolbarPrimitives, /buttonStyle\(prominent \? "glassProminent" : "glass"\)/u);
  assert.doesNotMatch(projectLayout, /runtimeStatusLabel/u);
  assert.doesNotMatch(workspaceToolbar, /<Picker|pickerStyle\("segmented"\)/u);
  assert.match(catalog, /WorkspaceProject/u);
  assert.match(projectController, /catalog\.project\(projectId\)/u);
  assert.match(projectController, /threadsForProject\(\s*projectId/u);
  assert.match(projectController, /projectState\(projectId\)/u);
  assert.doesNotMatch(workspaceRouteBuilder, /projectName|\?/u);
  assert.doesNotMatch(
    projectLayout,
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
